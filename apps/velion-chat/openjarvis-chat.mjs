// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Opt-in local adapter. The OpenJarvis server is a separate trust boundary.
import { createLocalChatService } from './chat-service.mjs';

const MAX_RESPONSE_BYTES = 65536;
const invalid = () => new Response('{}', { headers: { 'Content-Type': 'application/json' } });

async function readResponse(response) {
  const reader = response?.body?.getReader?.();
  if (!reader) throw Error('Invalid response');
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw Error('Invalid response');
      length += value.byteLength;
      if (length > MAX_RESPONSE_BYTES) {
        try { await reader.cancel(); } catch {}
        throw Error('Response too large');
      }
      chunks.push(value);
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
  } finally {
    reader.releaseLock();
  }
}

export function createOpenJarvisChatService({
  accessToken, model, apiKey, port = 8000, trustedDirectMode = false,
  fetchImpl = fetch, timeoutMs = 90000,
} = {}) {
  if (
    trustedDirectMode !== true ||
    typeof apiKey !== 'string' || !/^[A-Za-z0-9_-]{32,256}$/.test(apiKey) ||
    !Number.isInteger(port) || port < 1 || port > 65535 ||
    typeof fetchImpl !== 'function'
  ) throw Object.assign(new Error('OPENJARVIS_CONFIGURATION_INVALID'), { code: 'OPENJARVIS_CONFIGURATION_INVALID' });

  const endpoint = 'http://127.0.0.1:' + port + '/v1/chat/completions';
  const base = createLocalChatService({
    accessToken, model, timeoutMs,
    // Reuse VELION's validation, cancellation, single-request limit and receipts.
    fetchImpl: async (_unusedUrl, options) => {
      const request = JSON.parse(options.body);
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          max_tokens: 1024,
          stream: false,
          tools: null,
        }),
        signal: options.signal,
      });
      if (!response?.ok) return response;
      let value;
      try { value = await readResponse(response); } catch {
        if (options.signal?.aborted) throw Error('Request cancelled');
        return invalid();
      }
      const choice = Array.isArray(value?.choices) && value.choices.length === 1 ? value.choices[0] : null;
      const message = choice?.message;
      if (
        value?.model !== model || choice?.finish_reason !== 'stop' ||
        message?.role !== 'assistant' || typeof message.content !== 'string' ||
        (message.tool_calls != null && (!Array.isArray(message.tool_calls) || message.tool_calls.length !== 0)) ||
        message.function_call != null
      ) return invalid();
      return new Response(JSON.stringify({
        model: value.model,
        done: true,
        done_reason: 'stop',
        message: { role: 'assistant', content: message.content },
      }), { headers: { 'Content-Type': 'application/json' } });
    },
  });
  return Object.freeze({
    authenticate: base.authenticate,
    async chat(messages, options) {
      const result = await base.chat(messages, options);
      return {
        ...result,
        receipt: {
          ...result.receipt,
          provider: 'openjarvis-local',
          toolAccess: 'NOT_REQUESTED_SERVER_UNVERIFIED',
          inferenceBackend: 'UNVERIFIED',
        },
      };
    },
  });
}

export function openJarvisServiceFromEnv(env = process.env) {
  if (env.IMPERIAL_CHAT_LOCAL_ONLY !== 'YES') return null;
  const portText = env.VELION_OPENJARVIS_PORT ?? '8000';
  if (!/^[1-9][0-9]{0,4}$/.test(portText))
    throw Object.assign(new Error('OPENJARVIS_CONFIGURATION_INVALID'), { code: 'OPENJARVIS_CONFIGURATION_INVALID' });
  return createOpenJarvisChatService({
    accessToken: env.VELION_CHAT_TOKEN,
    model: env.VELION_LOCAL_MODEL,
    apiKey: env.VELION_OPENJARVIS_API_KEY,
    port: Number(portText),
    trustedDirectMode: env.VELION_OPENJARVIS_TRUSTED_DIRECT_MODE === 'YES',
  });
}
