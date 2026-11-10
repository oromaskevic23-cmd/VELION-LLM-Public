// Opt-in real local model check. It uses only synthetic input and the loopback server.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { ggufServiceFromEnv } from '../native-gguf/gguf-chat.mjs';
import { createAppServer } from '../server.mjs';
import { scoreGgufSmoke } from './gguf-smoke-cases.mjs';

if (process.env.IMPERIAL_CHAT_LOCAL_ONLY !== 'YES' || process.env.VELION_LOCAL_BACKEND !== 'gguf')
  throw Error('Explicitly enable the local GGUF backend before running this smoke test.');
const service = await ggufServiceFromEnv();
const server = createAppServer({ localChatService: service });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = 'http://127.0.0.1:' + server.address().port;
const transcript = [];
const receipts = [];
try {
  const prompts = [
    'Меня зовут Ирина. Запомни это. Как зовут тебя?',
    'Как меня зовут? Ответь только одним именем.',
    'Сколько будет 2+2? Ответь только числом.',
  ];
  for (const prompt of prompts) {
    transcript.push({ role: 'user', content: prompt });
    const response = await fetch(origin + '/api/chat', {
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.VELION_CHAT_TOKEN,
      },
      body: JSON.stringify({ messages: transcript }),
      signal: AbortSignal.timeout(120000),
    });
    const result = await response.json();
    if (!response.ok) throw Error('LOCAL_CHAT_FAILED_' + (result.code || response.status));
    assert.equal(result.receipt.provider, 'llama-cpp-local');
    assert.equal(result.receipt.modelSha256, process.env.VELION_GGUF_SHA256);
    assert.ok(result.answer.trim());
    transcript.push({ role: 'assistant', content: result.answer });
    receipts.push(result.receipt);
  }
  const answers = transcript
    .filter((message) => message.role === 'assistant')
    .map((message) => message.content);
  const checks = scoreGgufSmoke(answers);
  const passed = checks.every(check => check.passed);
  console.log(
    JSON.stringify(
      {
        status: passed ? 'LOCAL_GGUF_SMOKE_PASS' : 'LOCAL_GGUF_SMOKE_FAIL',
        provider: 'llama-cpp-local',
        modelSha256: process.env.VELION_GGUF_SHA256,
        cases: checks,
        answers,
        receipts,
      },
      null,
      2,
    ),
  );
  if (!passed) process.exitCode = 1;
} finally {
  server.close();
  await once(server, 'close');
  await service.dispose();
}
