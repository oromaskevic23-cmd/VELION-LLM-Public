// Select one explicitly enabled local backend. No remote or paid fallback.
import {localChatServiceFromEnv} from '../chat-service.mjs';
import {ggufServiceFromEnv} from '../native-gguf/gguf-chat.mjs';

export async function localIntelligenceService(env = process.env) {
  if (env.IMPERIAL_CHAT_LOCAL_ONLY !== 'YES') throw Error('LOCAL_INTELLIGENCE_EVALUATION_NOT_ENABLED');
  const backend = env.VELION_LOCAL_BACKEND ?? 'ollama';
  if (backend === 'ollama') return localChatServiceFromEnv(env);
  if (backend === 'gguf') return ggufServiceFromEnv(env);
  throw Error('CHAT_BACKEND_INVALID');
}
