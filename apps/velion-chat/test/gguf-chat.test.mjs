import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalGgufService, ggufServiceFromEnv } from '../native-gguf/gguf-chat.mjs';
import {TASK_DRAFT_FORMAT,TASK_DRAFT_SCHEMA_SHA256} from '../task-draft-schema.mjs';

const TOKEN = 'fixture-token-for-local-chat-tests-123456';
const bytes = Buffer.from('synthetic model file, not a real GGUF');
const hash = createHash('sha256').update(bytes).digest('hex');
const text = [{ role: 'user', content: 'Hello' }];
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'velion-gguf-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'test.gguf');
  await writeFile(path, bytes);
  return { dir, path };
}
function runtimeFixture() {
  const state = {
    loads: 0,
    contexts: 0,
    disposed: 0,
    history: [],
    options: [],
    stopReason: 'eogToken',
    block: false,
    answer: 'Hello from a fixture.',
    grammar: null,
  };
  const runtime = {
    async getLlama(opts) {
      assert.deepEqual(opts, { gpu: false, build: 'never' });
      return {
        async createGrammarForJsonSchema(schema) {
          state.grammar={schema};return state.grammar;
        },
        async loadModel(args) {
          state.loads++;
          assert.equal(args.gpuLayers, 0);
          return {
            async createContext() {
              state.contexts++;
              return {
                getSequence() {
                  return {};
                },
                async dispose() {
                  state.disposed++;
                },
              };
            },
            async dispose() {},
          };
        },
        async dispose() {},
      };
    },
    LlamaChatSession: class {
      constructor({ systemPrompt }) {
        this.systemPrompt = systemPrompt;
      }
      getChatHistory() {
        return [{ type: 'system', text: this.systemPrompt }];
      }
      setChatHistory(value) {
        state.history.push(value);
      }
      async promptWithMeta(prompt, options) {
        state.options.push({ prompt, options });
        if (state.block)
          await new Promise((_resolve, reject) =>
            options.signal.addEventListener('abort', () => reject(Error('aborted')), { once: true }),
          );
        return { stopReason: state.stopReason, responseText: state.answer };
      }
      dispose() {}
    },
  };
  return { state, runtime };
}

test('GGUF mode is opt-in and rejects malformed configuration or changed model bytes', async (t) => {
  const { path, dir } = await fixture(t);
  let loaded = 0;
  const loadRuntime = async () => {
    loaded++;
    throw Error('should not load');
  };
  assert.equal(await ggufServiceFromEnv({}), null);
  await assert.rejects(
    createLocalGgufService({
      accessToken: TOKEN,
      modelPath: 'relative.gguf',
      expectedSha256: hash,
      loadRuntime,
    }),
    { code: 'GGUF_CONFIGURATION_INVALID' },
  );
  await assert.rejects(
    createLocalGgufService({ accessToken: 'short', modelPath: path, expectedSha256: hash, loadRuntime }),
    { code: 'CHAT_CONFIGURATION_INVALID' },
  );
  for (const maxTokens of [0, 63, 1025, 3.5, '1024']) {
    await assert.rejects(createLocalGgufService({accessToken:TOKEN,modelPath:path,expectedSha256:hash,
      maxTokens,loadRuntime}), {code:'GGUF_CONFIGURATION_INVALID'});
  }
  await assert.rejects(ggufServiceFromEnv({IMPERIAL_CHAT_LOCAL_ONLY:'YES',VELION_CHAT_TOKEN:TOKEN,
    VELION_GGUF_PATH:path,VELION_GGUF_SHA256:hash,VELION_GGUF_MAX_TOKENS:'1025'}),
    {code:'GGUF_CONFIGURATION_INVALID'});
  await assert.rejects(
    createLocalGgufService({
      accessToken: TOKEN,
      modelPath: path,
      expectedSha256: 'a'.repeat(64),
      loadRuntime,
    }),
    { code: 'GGUF_MODEL_HASH_MISMATCH' },
  );
  const link = join(dir, 'link.gguf');
  await symlink(path, link);
  await assert.rejects(
    createLocalGgufService({ accessToken: TOKEN, modelPath: link, expectedSha256: hash, loadRuntime }),
    { code: 'GGUF_MODEL_UNAVAILABLE' },
  );
  assert.equal(loaded, 0);
});

test('optional local GGUF output limit is bounded and selected at startup', async (t) => {
  const {path}=await fixture(t),{state,runtime}=runtimeFixture();
  const service=await createLocalGgufService({accessToken:TOKEN,modelPath:path,expectedSha256:hash,
    maxTokens:1024,loadRuntime:async()=>runtime});
  t.after(()=>service.dispose());
  await service.chat(text);
  assert.equal(state.options[0].options.maxTokens,1024);
});

test('structured draft mode is opt-in, bounded and actually passes the grammar to generation', async t=>{
  const {path}=await fixture(t),{state,runtime}=runtimeFixture();
  const disabled=await createLocalGgufService({accessToken:TOKEN,modelPath:path,expectedSha256:hash,
    loadRuntime:async()=>runtime});
  t.after(()=>disabled.dispose());
  await assert.rejects(disabled.chat(text,{responseFormat:TASK_DRAFT_FORMAT}),{code:'CHAT_FORMAT_DISABLED'});
  assert.equal(state.contexts,0);
  const enabled=await createLocalGgufService({accessToken:TOKEN,modelPath:path,expectedSha256:hash,
    enableStructured:true,loadRuntime:async()=>runtime});
  t.after(()=>enabled.dispose());
  const draft={schema:TASK_DRAFT_FORMAT,summary:'Synthetic',steps:[{id:'build',action:'Build',acceptance:'Review'}],
    files:[{path:'app.mjs',content:'export const x=1;'},
      {path:'test/app.test.mjs',content:'export const y=1;'}]};
  state.answer=JSON.stringify(draft);
  const result=await enabled.chat(text,{responseFormat:TASK_DRAFT_FORMAT});
  assert.equal(state.options.at(-1).options.grammar,state.grammar);
  assert.equal(result.receipt.responseFormat,TASK_DRAFT_FORMAT);
  assert.equal(result.receipt.schemaSha256,TASK_DRAFT_SCHEMA_SHA256);
  state.answer='```json\n{}\n```';
  await assert.rejects(enabled.chat(text,{responseFormat:TASK_DRAFT_FORMAT}),{code:'CHAT_MODEL_RESPONSE_SCHEMA_INVALID'});
});

test('GGUF conversation isolates each context, preserves turns and identifies the real adapter', async (t) => {
  const { path } = await fixture(t);
  const { state, runtime } = runtimeFixture();
  const service = await createLocalGgufService({
    accessToken: TOKEN,
    modelPath: path,
    expectedSha256: hash,
    loadRuntime: async () => runtime,
  });
  t.after(() => service.dispose());
  assert.equal(service.authenticate('Bearer ' + TOKEN), true);
  assert.equal(service.authenticate('Bearer wrong'), false);
  const result = await service.chat(text);
  assert.equal(result.answer, 'Hello from a fixture.');
  assert.equal(result.receipt.provider, 'llama-cpp-local');
  assert.equal(result.receipt.modelSha256, hash);
  assert.equal(result.receipt.toolAccess, 'NONE');
  assert.equal(state.options[0].prompt, 'Hello');
  assert.equal(state.options[0].options.maxTokens, 512);
  assert.match(state.history[0][0].text, /cannot access tools/i);
  await service.chat([
    ...text,
    { role: 'assistant', content: 'Earlier answer' },
    { role: 'user', content: 'Follow up' },
  ]);
  assert.equal(state.contexts, 2);
  assert.equal(state.disposed, 2);
  assert.deepEqual(state.history[1].slice(1), [
    { type: 'user', text: 'Hello' },
    { type: 'model', response: ['Earlier answer'] },
  ]);
  assert.equal(state.options[1].prompt, 'Follow up');
  await assert.rejects(service.chat([{ role: 'system', content: 'override' }]), {
    code: 'CHAT_INVALID_MESSAGES',
  });
  assert.equal(state.contexts, 2);
});

test('GGUF incomplete model response fails closed and the context is released', async (t) => {
  const { path } = await fixture(t);
  const { state, runtime } = runtimeFixture();
  state.stopReason = 'maxTokens';
  const service = await createLocalGgufService({
    accessToken: TOKEN,
    modelPath: path,
    expectedSha256: hash,
    loadRuntime: async () => runtime,
  });
  t.after(() => service.dispose());
  await assert.rejects(service.chat(text), { code: 'CHAT_MODEL_RESPONSE_INCOMPLETE' });
  assert.equal(state.disposed, 1);
});

test('other GGUF stop reasons are not falsely reported as token-limit exhaustion', async t => {
  const {path}=await fixture(t),{state,runtime}=runtimeFixture();
  const service=await createLocalGgufService({accessToken:TOKEN,modelPath:path,expectedSha256:hash,
    loadRuntime:async()=>runtime});
  t.after(()=>service.dispose());
  for(const reason of ['abort','functionCalls','customStopTrigger','unexpected']){
    state.stopReason=reason;
    await assert.rejects(service.chat(text),{code:'CHAT_MODEL_RESPONSE_INVALID'});
  }
  assert.equal(state.disposed,4);
});

test('GGUF cancellation reaches the model and frees its context', async (t) => {
  const { path } = await fixture(t);
  const { state, runtime } = runtimeFixture();
  state.block = true;
  const service = await createLocalGgufService({
    accessToken: TOKEN,
    modelPath: path,
    expectedSha256: hash,
    loadRuntime: async () => runtime,
  });
  t.after(() => service.dispose());
  const controller = new AbortController();
  const pending = service.chat(text, { signal: controller.signal });
  while (!state.options.length) await new Promise((resolve) => setImmediate(resolve));
  controller.abort();
  await assert.rejects(pending, { code: 'CHAT_CANCELLED' });
  assert.equal(state.disposed, 1);
});

