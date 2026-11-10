// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Local conversation adapter: no tools, code execution, privileged actions or remote fallback.
import { createHash, timingSafeEqual } from 'node:crypto';

const MODEL_URL = 'http://127.0.0.1:11434/api/chat';
const MODEL_NAME = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,90}$/;
const MAX_OUTPUT_BYTES = 65536;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const error = (code) => Object.assign(new Error(code), { code });
const SYSTEM_PROMPT = [
  'You are VELION, the conversational intelligence interface of IMPERIAL Core.',
  'Be helpful, natural and concise. Reply in the user’s language unless asked otherwise.',
  'Distinguish an idea from a verified fact. Do not invent evidence or claim a server,',
  'tool, payment, permission, deployment or real-world action exists or succeeded.',
  'You cannot access tools, execute code, change accounts or approve actions in this chat.',
  'The local model is a separate provider and its output may be incorrect.',
].join(' ');

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 12)
    throw error('CHAT_INVALID_MESSAGES');
  let total = 0;
  const copy = messages.map((message, index) => {
    if (
      !message ||
      typeof message !== 'object' ||
      Array.isArray(message) ||
      Object.keys(message).sort().join('|') !== 'content|role' ||
      message.role !== (index % 2 ? 'assistant' : 'user') ||
      typeof message.content !== 'string' ||
      !message.content.trim() ||
      message.content.length > 4000
    )
      throw error('CHAT_INVALID_MESSAGES');
    total += Buffer.byteLength(message.content, 'utf8');
    return { role: message.role, content: message.content };
  });
  if (copy.at(-1).role !== 'user' || total > 24000) throw error('CHAT_INVALID_MESSAGES');
  return copy;
}

async function readBounded(response) {
  const reader = response?.body?.getReader?.();
  if (!reader) throw error('CHAT_MODEL_RESPONSE_INVALID');
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw error('CHAT_MODEL_RESPONSE_INVALID');
      total += value.byteLength;
      if (total > MAX_OUTPUT_BYTES) {
        try {
          await reader.cancel();
        } catch {}
        throw error('CHAT_MODEL_RESPONSE_TOO_LARGE');
      }
      chunks.push(value);
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
  } catch (cause) {
    if (cause?.code) throw cause;
    throw error('CHAT_MODEL_RESPONSE_INVALID');
  } finally {
    reader.releaseLock();
  }
}

export function createLocalChatService({ accessToken, model, fetchImpl = fetch, timeoutMs = 90000 } = {}) {
  if (
    typeof accessToken !== 'string' ||
    !/^[A-Za-z0-9_-]{32,128}$/.test(accessToken) ||
    typeof model !== 'string' ||
    !MODEL_NAME.test(model) ||
    model.includes('..') ||
    model.includes('://') ||
    typeof fetchImpl !== 'function' ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1000 ||
    timeoutMs > 120000
  )
    throw error('CHAT_CONFIGURATION_INVALID');
  const expected = Buffer.from(accessToken, 'utf8');
  let busy = false;
  return Object.freeze({
    authenticate(header) {
      if (typeof header !== 'string' || !header.startsWith('Bearer ') || header.length > 135) return false;
      const supplied = Buffer.from(header.slice(7), 'utf8');
      return supplied.length === expected.length && timingSafeEqual(supplied, expected);
    },
    async chat(messages, { signal } = {}) {
      const clean = validateMessages(messages);
      if (busy) throw error('CHAT_BUSY');
      busy = true;
      try {
        const started = Date.now();
        const payload = {
          model,
          stream: false,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...clean],
          options: { num_predict: 1024 },
        };
        let response;
        try {
          const timeout = AbortSignal.timeout(timeoutMs);
          response = await fetchImpl(MODEL_URL, {
            method: 'POST',
            redirect: 'error',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
            signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
          });
        } catch {
          throw error(signal?.aborted ? 'CHAT_CANCELLED' : 'CHAT_MODEL_UNAVAILABLE');
        }
        if (!response?.ok) throw error('CHAT_MODEL_HTTP_FAILED');
        let result;
        try {
          result = JSON.parse(await readBounded(response));
        } catch (cause) {
          if (cause?.code) throw cause;
          throw error('CHAT_MODEL_RESPONSE_INVALID');
        }
        if (
          !result ||
          result.done !== true ||
          result.model !== model ||
          result.message?.role !== 'assistant' ||
          typeof result.message.content !== 'string' ||
          !result.message.content.trim() ||
          result.message.content.length > 4000 ||
          (Object.hasOwn(result, 'done_reason') && result.done_reason !== 'stop')
        )
          throw error('CHAT_MODEL_RESPONSE_INVALID');
        const finished = Date.now();
        return {
          answer: result.message.content,
          receipt: {
            provider: 'ollama-local',
            requestedModel: model,
            returnedModel: result.model,
            startedAt: new Date(started).toISOString(),
            finishedAt: new Date(finished).toISOString(),
            latencyMs: finished - started,
            inputSha256: sha256(JSON.stringify(clean)),
            outputSha256: sha256(result.message.content),
            outcome: 'MODEL_RESPONSE_RECEIVED',
            toolAccess: 'NONE',
            approval: 'NOT_GRANTED',
          },
        };
      } finally {
        busy = false;
      }
    },
  });
}

export function localChatServiceFromEnv(env = process.env) {
  if (env.IMPERIAL_CHAT_LOCAL_ONLY !== 'YES') return null;
  return createLocalChatService({ accessToken: env.VELION_CHAT_TOKEN, model: env.VELION_LOCAL_MODEL });
}
