// Emulated DOM tests; these do not establish real browser, microphone or model compatibility.
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Browser } from 'happy-dom';
import { createAppServer } from '../server.mjs';
import { createLocalChatService } from '../chat-service.mjs';

const TOKEN = 'fixture-token-for-local-chat-tests-123456',
  MODEL = 'example-local:1b';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('emulated UI: dictation, chat, local history, language and safe text rendering', async (t) => {
  let calls = 0,
    spoken = [],
    storageSnapshot;
  const ollamaFixture = createLocalChatService({
    accessToken: TOKEN,
    model: MODEL,
    fetchImpl: async () => {
      calls++;
      return new Response(
        JSON.stringify({
          model: MODEL,
          done: true,
          message: { role: 'assistant', content: 'Test answer <img src=x onerror=alert(1)>' },
        }),
      );
    },
  });
  const model = {
    ...ollamaFixture,
    async chat(messages, options) {
      const result = await ollamaFixture.chat(messages, options);
      return { ...result, receipt: { ...result.receipt, provider: 'llama-cpp-local' } };
    },
  };
  const server = createAppServer({ localChatService: model });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = new Browser({
    settings: {
      enableJavaScriptEvaluation: true,
      suppressInsecureJavaScriptEnvironmentWarning: true,
      navigation: {
        beforeContentCallback(window) {
          // Happy DOM resets localStorage on navigation; carry the browser fixture forward.
          if (storageSnapshot) window.localStorage.setItem('velion-chat-history-v1', storageSnapshot);
          // Happy DOM does not supply the browser Origin header for this POST; emulate it.
          window.fetch = (url, options) =>
            fetch(url, { ...options, signal: undefined, headers: { ...options.headers, Origin: origin } });
          window.SpeechRecognition = class {
            start() {
              this.onstart?.();
              const result = [{ transcript: 'Тестовый вопрос' }];
              result.isFinal = true;
              this.onresult?.({ results: [result] });
              this.onend?.();
            }
            stop() {
              this.onend?.();
            }
            abort() {
              this.onend?.();
            }
          };
          window.SpeechSynthesisUtterance = class {
            constructor(text) {
              this.text = text;
            }
          };
          window.speechSynthesis = {
            cancel() {},
            speak(utterance) {
              spoken.push(utterance.text);
            },
          };
        },
      },
    },
  });
  t.after(async () => {
    await browser.close();
    server.close();
  });
  const page = browser.newPage();
  await page.goto(origin + '/');
  await page.waitUntilComplete();
  let d = page.mainFrame.document,
    w = page.mainFrame.window;
  assert.equal(d.querySelectorAll('.chat-item').length, 1);
  assert.equal(d.querySelector('#mic').disabled, false);
  d.querySelector('#open-settings').click();
  assert.equal(d.querySelector('#settings-dialog').open, true);
  d.querySelector('#token').value = TOKEN;
  d.querySelector('#save-history').checked = true;
  d.querySelector('#save-history').dispatchEvent(new w.Event('change'));
  d.querySelector('#close-settings').click();
  d.querySelector('#mic').click();
  assert.equal(d.querySelector('#prompt').value, 'Тестовый вопрос');
  d.querySelector('#chat-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
  for (let i = 0; i < 100 && d.querySelector('#send').disabled; i++) await delay(20);
  assert.equal(calls, 1);
  assert.equal(d.querySelectorAll('.message').length, 2);
  assert.match(d.querySelector('#status').textContent, /Ответ получен/);
  assert.equal(d.querySelectorAll('.messages img').length, 0);
  assert.match(d.querySelector('.message.assistant').textContent, /<img src=x/);
  d.querySelector('#speak').click();
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0], 'Test answer <img src=x onerror=alert(1)>');
  const saved = w.localStorage.getItem('velion-chat-history-v1');
  assert.match(saved, /Тестовый вопрос/);
  assert.equal(saved.includes(TOKEN), false);
  d.querySelector('#new-chat').click();
  assert.equal(d.querySelectorAll('.chat-item').length, 2);
  assert.equal(d.querySelectorAll('.message').length, 0);
  d.querySelector('#search').value = 'Тестовый';
  d.querySelector('#search').dispatchEvent(new w.Event('input'));
  assert.equal(d.querySelectorAll('.chat-item').length, 1);
  d.querySelector('#search').value = 'no match';
  d.querySelector('#search').dispatchEvent(new w.Event('input'));
  assert.equal(d.querySelectorAll('.chat-item').length, 0);
  d.querySelector('#search').value = '';
  d.querySelector('#search').dispatchEvent(new w.Event('input'));
  d.querySelectorAll('.chat-item')[1].click();
  assert.equal(d.querySelectorAll('.message').length, 2);
  d.querySelector('#language').value = 'en-US';
  d.querySelector('#language').dispatchEvent(new w.Event('change'));
  assert.equal(d.querySelector('#new-chat').textContent.includes('New conversation'), true);
  storageSnapshot = w.localStorage.getItem('velion-chat-history-v1');
  await page.goto(origin + '/');
  await page.waitUntilComplete();
  d = page.mainFrame.document;
  w = page.mainFrame.window;
  assert.equal(d.querySelectorAll('.chat-item').length, 2);
  assert.equal(d.querySelectorAll('.message').length, 2);
  assert.equal(d.querySelector('#token').value, '');
  assert.equal(d.querySelector('#save-history').checked, true);
});

test('emulated UI disables voice recognition when browser support is missing', async (t) => {
  const server = createAppServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const browser = new Browser({
    settings: { enableJavaScriptEvaluation: true, suppressInsecureJavaScriptEnvironmentWarning: true },
  });
  t.after(async () => {
    await browser.close();
    server.close();
  });
  const page = browser.newPage();
  await page.goto('http://127.0.0.1:' + server.address().port + '/');
  await page.waitUntilComplete();
  assert.equal(page.mainFrame.document.querySelector('#mic').disabled, true);
});
