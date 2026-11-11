// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Optional, CPU-only local GGUF adapter. Model bytes and runtime are supplied separately.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { createLocalChatService } from '../chat-service.mjs';
import {TASK_DRAFT_FORMAT,TASK_DRAFT_SCHEMA} from '../task-draft-schema.mjs';

const fail = (code) => Object.assign(new Error(code), { code });

async function hashModel(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

// The injectable runtime is for deterministic tests; production uses the pinned optional package.
export async function createLocalGgufService({ accessToken, modelPath, expectedSha256, maxTokens = 512, enableStructured = false, loadRuntime } = {}) {
  if (
    typeof modelPath !== 'string' ||
    !isAbsolute(modelPath) ||
    typeof expectedSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(expectedSha256) ||
    !Number.isSafeInteger(maxTokens) || maxTokens < 64 || maxTokens > 1024 ||
    typeof enableStructured !== 'boolean'
  )
    throw fail('GGUF_CONFIGURATION_INVALID');
  // Validate the same access token before reading or loading a model.
  const modelName = 'gguf-' + expectedSha256.slice(0, 12);
  createLocalChatService({ accessToken, model: modelName });
  let stat;
  try {
    stat = await lstat(modelPath);
  } catch {
    throw fail('GGUF_MODEL_UNAVAILABLE');
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw fail('GGUF_MODEL_UNAVAILABLE');
  let modelSha256;
  try {
    modelSha256 = await hashModel(modelPath);
  } catch {
    throw fail('GGUF_MODEL_UNAVAILABLE');
  }
  if (modelSha256 !== expectedSha256) throw fail('GGUF_MODEL_HASH_MISMATCH');

  const runtime = loadRuntime ? await loadRuntime() : await import('node-llama-cpp');
  const llama = await runtime.getLlama({ gpu: false, build: 'never' });
  let model, grammar;
  try {
    model = await llama.loadModel({ modelPath, gpuLayers: 0 });
    if (enableStructured) grammar = await llama.createGrammarForJsonSchema(TASK_DRAFT_SCHEMA);
  } catch (cause) {
    try { if(model) await model.dispose(); } finally { await llama.dispose(); }
    throw cause;
  }
  let disposed = false;
  const fetchImpl = async (_url, options) => {
    if (disposed) throw fail('GGUF_RUNTIME_DISPOSED');
    const payload = JSON.parse(options.body);
    const messages = payload.messages;
    let context, session;
    try {
      context = await model.createContext({ contextSize: 2048, threads: 4 });
      session = new runtime.LlamaChatSession({
        contextSequence: context.getSequence(),
        systemPrompt: messages[0].content,
      });
      const prior = messages
        .slice(1, -1)
        .map((message) =>
          message.role === 'user'
            ? { type: 'user', text: message.content }
            : { type: 'model', response: [message.content] },
        );
      session.setChatHistory([...session.getChatHistory(), ...prior]);
      const result = await session.promptWithMeta(messages.at(-1).content, {
        maxTokens,
        temperature: 0.2,
        signal: options.signal,
        stopOnAbortSignal: false,
        ...(payload.format === TASK_DRAFT_FORMAT ? {grammar} : {}),
      });
      if (options.signal.aborted) throw fail('GGUF_CANCELLED');
      const finished = ['eogToken', 'stopGenerationTrigger'].includes(result.stopReason);
      return new Response(
        JSON.stringify({
          model: modelName,
          done: true,
          done_reason: finished ? 'stop' : result.stopReason === 'maxTokens' ? 'length' : 'other',
          message: { role: 'assistant', content: result.responseText },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    } finally {
      try {
        session?.dispose();
      } finally {
        if (context) await context.dispose();
      }
    }
  };
  const base = createLocalChatService({ accessToken, model: modelName, fetchImpl, enableStructured });
  return Object.freeze({
    authenticate: base.authenticate,
    async chat(messages, options) {
      const response = await base.chat(messages, options);
      return { ...response, receipt: { ...response.receipt, provider: 'llama-cpp-local', modelSha256 } };
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      await model.dispose();
      await llama.dispose();
    },
  });
}

export async function ggufServiceFromEnv(env = process.env) {
  if (env.IMPERIAL_CHAT_LOCAL_ONLY !== 'YES') return null;
  if (env.VELION_GGUF_STRUCTURED_DRAFT !== undefined && !['YES','NO'].includes(env.VELION_GGUF_STRUCTURED_DRAFT))
    throw fail('GGUF_CONFIGURATION_INVALID');
  return createLocalGgufService({
    accessToken: env.VELION_CHAT_TOKEN,
    modelPath: env.VELION_GGUF_PATH,
    expectedSha256: env.VELION_GGUF_SHA256,
    maxTokens: env.VELION_GGUF_MAX_TOKENS === undefined ? 512 : Number(env.VELION_GGUF_MAX_TOKENS),
    enableStructured: env.VELION_GGUF_STRUCTURED_DRAFT === 'YES',
  });
}

