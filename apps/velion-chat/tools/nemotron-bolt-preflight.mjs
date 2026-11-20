// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Read-only, loopback-only inventory check. Not model provenance attestation.
export const BOLT_MODEL_ID = 'hf.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB:Q4_K_M';
const TAGS_URL = 'http://127.0.0.1:11434/api/tags';
const MAX_BYTES = 65536;
const fail = (code) => Object.assign(new Error(code), {code});

export function validateBoltInventory(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.models) || value.models.length > 256)
    throw fail('BOLT_INVENTORY_INVALID');
  const found = value.models.filter(item => item?.name === BOLT_MODEL_ID);
  if (found.length !== 1) throw fail('BOLT_MODEL_MISSING_OR_DUPLICATED');
  const model = found[0];
  if (!Number.isSafeInteger(model.size) || model.size < 2_000_000_000 || model.size > 16_000_000_000 ||
      typeof model.digest !== 'string' || !/^[a-f0-9]{64}$/.test(model.digest))
    throw fail('BOLT_MODEL_IDENTITY_UNVERIFIED');
  return Object.freeze({model: BOLT_MODEL_ID, installedBytes: model.size, localDigest: model.digest,
    verifiedScope: 'LOCAL_OLLAMA_INVENTORY_ONLY'});
}

export async function checkLocalBolt({fetchImpl = fetch, timeoutMs = 6000} = {}) {
  if (typeof fetchImpl !== 'function' || !Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 10000)
    throw fail('BOLT_PREFLIGHT_INVALID');
  let response;
  try {
    response = await fetchImpl(TAGS_URL, {
      method:'GET', redirect:'error', headers:{Accept:'application/json'},
      signal:AbortSignal.timeout(timeoutMs)
    });
  } catch { throw fail('BOLT_LOCAL_OLLAMA_UNAVAILABLE'); }
  if (!response?.ok || !/application\/json/i.test(response.headers?.get?.('content-type') || ''))
    throw fail('BOLT_LOCAL_INVENTORY_UNAVAILABLE');
  const reader = response.body?.getReader?.();
  if (!reader) throw fail('BOLT_INVENTORY_INVALID');
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array) || (total += value.byteLength) > MAX_BYTES)
        throw fail('BOLT_INVENTORY_TOO_LARGE');
      chunks.push(value);
    }
    let payload;
    try { payload = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(Buffer.concat(chunks))); }
    catch { throw fail('BOLT_INVENTORY_INVALID'); }
    return validateBoltInventory(payload);
  } finally {
    if (total > MAX_BYTES) await reader.cancel().catch(()=>{});
    reader.releaseLock();
  }
}
