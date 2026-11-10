// Optional real Chromium UI check with a synthetic local model response.
// It does not test a physical phone, Safari, installation, voice or security isolation.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { isAbsolute } from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../server.mjs';
import { createLocalChatService } from '../chat-service.mjs';

const token = 'fixture-mobile-token-0123456789ABCDEF';
const model = 'example-local:1b';
const service = createLocalChatService({
  accessToken: token, model,
  fetchImpl: async () => new Response(JSON.stringify({
    model, done: true, message: {role: 'assistant', content: 'Здравствуйте! Готова помочь.'},
  })),
});
const executablePath = process.env.VELION_CHROMIUM_EXECUTABLE;
if (executablePath && !isAbsolute(executablePath)) throw Error('Browser executable must be an absolute path');
const options = {headless: true};
if (executablePath) options.executablePath = executablePath;
if (process.env.VELION_BROWSER_NO_SANDBOX === 'YES')
  options.args = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-software-rasterizer', '--no-zygote'];
const server = createAppServer({localChatService: service});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
const checks = [];
try {
  browser = await chromium.launch(options);
  for (const viewport of [{width: 375, height: 812}, {width: 320, height: 568}]) {
    const context = await browser.newContext({viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 1});
    try {
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin, {waitUntil: 'load'});
      assert.equal(await page.locator('#open-sidebar').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('#sidebar').evaluate(el => el.inert), true);
      const cdp = await context.newCDPSession(page);
      const manifest = await cdp.send('Page.getAppManifest');
      assert.equal(new URL(manifest.url).pathname, '/manifest.webmanifest');
      assert.equal(manifest.errors.length, 0, JSON.stringify(manifest.errors));
      assert.equal(await page.locator('link[rel=apple-touch-icon]').getAttribute('href'), '/app-icon-180.png');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      const send = await page.locator('#send').boundingBox();
      assert.ok(send && send.width >= 44 && send.height >= 44 && send.y + send.height <= viewport.height);
      assert.equal(await page.locator('#prompt').evaluate(el => getComputedStyle(el).fontSize), '16px');
      await page.locator('#settings-top').tap();
      await page.locator('#token').fill(token);
      await page.locator('#close-settings').tap();
      await page.locator('#prompt').fill('Проверка мобильного диалога');
      await page.locator('#send').tap();
      await page.locator('.message.assistant').waitFor();
      assert.match(await page.locator('.message.assistant').innerText(), /Готова помочь/);
      await page.locator('#open-sidebar').tap();
      assert.equal(await page.locator('#sidebar').evaluate(el => el.classList.contains('open')), true);
      assert.equal(await page.locator('#open-sidebar').getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('#sidebar').evaluate(el => el.inert), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'close-sidebar');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#open-sidebar').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'open-sidebar');
      await page.locator('#open-sidebar').tap();
      await page.locator('#search').fill('no matching chat');
      assert.equal(await page.locator('.chat-item').count(), 0);
      await page.locator('#new-chat').tap();
      assert.equal(await page.locator('#search').inputValue(), '');
      assert.equal(await page.locator('#sidebar').evaluate(el => el.inert), true);
      await page.locator('#open-sidebar').tap();
      assert.equal(await page.locator('.chat-item').count(), 2);
      await page.locator('#close-sidebar').tap();
      assert.equal(await page.locator('#sidebar').evaluate(el => el.classList.contains('open')), false);
      assert.deepEqual(errors, []);
      checks.push({viewport, manifest: 'PASS', dialogue: 'SYNTHETIC_FIXTURE_PASS', sidebar: 'PASS', overflow: 'NONE'});
    } finally {
      await context.close();
    }
  }
  const desktop = await browser.newPage({viewport: {width: 1200, height: 800}});
  await desktop.goto(origin, {waitUntil: 'load'});
  assert.equal(await desktop.locator('#open-sidebar').getAttribute('aria-expanded'), 'true');
  await desktop.locator('#open-sidebar').click();
  assert.equal(await desktop.locator('#sidebar').isVisible(), false);
  assert.equal(await desktop.locator('#sidebar').evaluate(el => el.inert), true);
  await desktop.locator('#open-sidebar').click();
  assert.equal(await desktop.locator('#sidebar').isVisible(), true);
  await desktop.setViewportSize({width: 375, height: 812});
  await desktop.waitForFunction(() => document.querySelector('#open-sidebar').getAttribute('aria-expanded') === 'false');
  assert.equal(await desktop.locator('#open-sidebar').getAttribute('aria-expanded'), 'false');
  assert.equal(await desktop.locator('#sidebar').evaluate(el => el.inert), true);
  await desktop.setViewportSize({width: 1200, height: 800});
  await desktop.waitForFunction(() => document.querySelector('#open-sidebar').getAttribute('aria-expanded') === 'true');
  assert.equal(await desktop.locator('#open-sidebar').getAttribute('aria-expanded'), 'true');
  assert.equal(await desktop.locator('#sidebar').isVisible(), true);
  await desktop.close();
  checks.push({viewport: {width: 1200, height: 800}, sidebar: 'COLLAPSE_AND_RESIZE_PASS'});
  console.log(JSON.stringify({browser: browser.version(), checks, device: 'CHROMIUM_EMULATION_ONLY', iosInstall: 'NOT_TESTED'}));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
