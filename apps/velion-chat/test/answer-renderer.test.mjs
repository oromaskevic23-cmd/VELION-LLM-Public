import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {renderAnswer} from '../public/answer-renderer.mjs';

test('fenced code is readable and copyable while HTML remains inert text', async () => {
  const window = new Window();
  const root = window.document.createElement('div');
  let copied;
  const input = 'Before <img src=x onerror=alert(1)>\n```js\n</code><script>attack()</script>\n```\nAfter';
  renderAnswer(root, input, {codeLabel:'Code', copyLabel:'Copy code', copyCode:code => {copied = code;}});
  assert.equal(root.querySelectorAll('script,img').length, 0);
  assert.equal(root.querySelector('code').textContent, '</code><script>attack()</script>');
  assert.match(root.textContent, /Before <img/);
  assert.match(root.textContent, /After/);
  root.querySelector('button').click();
  assert.equal(copied, '</code><script>attack()</script>');
  await window.happyDOM.close();
});

test('incomplete fences remain text and complete blocks keep their own content', async () => {
  const window = new Window();
  const root = window.document.createElement('div');
  renderAnswer(root, '```python\nprint(1)\n```\n```\nnext\n```\n```unfinished', {
    codeLabel:'Code', copyLabel:'Copy code', copyCode:()=>{}
  });
  assert.equal(root.querySelectorAll('pre code').length, 2);
  assert.deepEqual([...root.querySelectorAll('pre code')].map(node=>node.textContent), ['print(1)', 'next']);
  assert.match(root.textContent, /```unfinished/);
  await window.happyDOM.close();
});
