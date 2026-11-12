# VELION local conversation prototype

VELION is a standalone IMPERIAL Core product. This increment provides a local
conversation interface with a searchable conversation sidebar, multilingual controls,
multi-turn text, optional browser speech recognition, response playback, and
optional device-local chat history. It is a prototype, not a hosted service or
a claim that VELION owns model weights. No third-party model is downloaded or
activated by this repository.

Three explicit local backends are available: an existing Ollama service, an
optional CPU-only GGUF runtime, or a separately operated OpenJarvis API. None
is enabled by default, and there is no
automatic fallback between them.

## Run with an existing Ollama service

Requires Node.js 22 or later and a separately installed, running Ollama service
on the same computer. The model must already be installed and authorized for
the intended use. No provider credentials or paid services are required by
this adapter, and there is no network or paid-provider fallback.

From this directory, configure a local session:

```sh
export IMPERIAL_CHAT_LOCAL_ONLY=YES
export VELION_LOCAL_MODEL=YOUR_INSTALLED_LOCAL_MODEL
export VELION_CHAT_TOKEN="$(node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))')"
printf 'Local session token: %s\n' "$VELION_CHAT_TOKEN"
npm start
```

Open `http://127.0.0.1:4174/` **on that same computer**. Open Settings and
enter the locally printed token. Never post the token to a chat, commit it, or
reuse it as another service's secret. The UI is available without configuring a
model, but the chat endpoint returns disabled until all settings are present.
The server only binds to loopback; this URL is not an internet address and
cannot provide access from a separate phone. A safe authenticated remote
deployment is a separate task.

The model receives the latest five completed exchanges and the current user
message, further reduced when size limits are reached. Up to 25 conversations
of 25 exchanges each can be kept in the current browser session. Optional
history saving uses that browser's localStorage and includes the message text;
the session token is not saved. Turning that option off removes the saved copy.
Storage failures are reported. Existing conversations remain in memory until
the page is refreshed, closed or a conversation is deleted.

Assistant responses display fenced code blocks with an individual copy button.
All response content is inserted as text: HTML is not interpreted and code is
not executed. This is limited code-fence formatting, not full Markdown support.
If a request fails or is stopped while another draft is being typed, both texts
remain available in the current tab. Resolve the failed request before sending
another message in that conversation. Failed requests and unsent drafts are
not persisted and disappear when the page is refreshed or closed.

## Run with a local GGUF model (optional)

This alternative uses the separately installed `node-llama-cpp` package and a
local GGUF file supplied by the operator. It requires no Ollama server and
does not download a model at runtime. Use a model from a source and with terms
appropriate to the intended use. The computer and model file remain trusted;
this is not a sandbox for malicious model files.

```sh
# From apps/velion-chat: install the optional runtime and its locked dependencies.
npm ci --prefix native-gguf --ignore-scripts --no-audit --no-fund
export IMPERIAL_CHAT_LOCAL_ONLY=YES
export VELION_LOCAL_BACKEND=gguf
export VELION_GGUF_PATH=/absolute/path/to/your-model.gguf
export VELION_GGUF_SHA256=YOUR_VERIFIED_MODEL_FILE_SHA256
export VELION_CHAT_TOKEN="$(node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))')"
printf 'Local session token: %s\n' "$VELION_CHAT_TOKEN"
npm start
```

The GGUF path must be absolute, point to a regular non-symlink file and match
the supplied lowercase SHA-256 before the runtime loads it. On Linux,
`sha256sum /absolute/path/to/your-model.gguf` computes the file digest. Compare
that digest with an independently trusted value; a hash alone does not prove
model authorship or safety. The optional runtime selects CPU and rejects a
missing prebuilt binary instead of automatically downloading or building one.
Installation may take significant disk space. The server listens only on
`127.0.0.1`; stopping its process stops the service.

The optional `VELION_GGUF_MAX_TOKENS` server setting changes the per-response
generation limit from the default 512 to an integer between 64 and 1024. A
higher value can take longer; the existing timeout and response-size limits
still apply. Incomplete responses fail closed. This is a local operator setting,
not a caller-controlled parameter.

For an explicitly enabled, local CONSTRUCTOR AI experiment, set
`VELION_GGUF_STRUCTURED_DRAFT=YES` before starting the GGUF server. The fixed
`constructor_draft_v1` format uses a pinned JSON grammar and an independent
shape check; callers cannot supply an arbitrary schema. It is disabled by
default and does not affect ordinary chat. The format constrains syntax, not
correctness, safety, execution permission or release. The generated source
remains untrusted and must still pass Constructor's quarantine and separate QA.

## OpenJarvis local chat adapter (experimental)

This adapter is an opt-in client for a separately installed, trusted
OpenJarvis server's `/v1/chat/completions` API. It does not install or start
OpenJarvis, provision an inference engine, connect email or calendar, grant
permissions, or start agents. It accepts only a fixed `127.0.0.1` endpoint,
uses a separate API key, rejects redirects, and has no fallback to a different
backend. The present checks use a synthetic local API; a real OpenJarvis/model
integration has not been verified.

Before enabling it, inspect the actual OpenJarvis instance and its configuration.
Use an isolated OpenJarvis home and credential store; configure loopback,
authenticated API access, a known local engine/model and direct engine mode
(`[server] agent = ""`). Disable MCP servers, agent manager/scheduler, channels
and other background services in that instance, and do not supply cloud
credentials. The reviewed upstream source can load MCP tools and discover cloud
credentials even when a client submits no tools. Server logs and configuration
must be verified separately: the `trusted` environment flag is an operator
assertion, not an automated check or security guarantee. See
[OpenJarvis API documentation](https://open-jarvis.github.io/OpenJarvis/deployment/api-server/)
and inspect the precise installed version.

Once that server has been independently configured and checked, start VELION
with `IMPERIAL_CHAT_LOCAL_ONLY=YES`, `VELION_LOCAL_BACKEND=openjarvis`,
`VELION_LOCAL_MODEL` set to the model served by OpenJarvis,
`VELION_CHAT_TOKEN` set to a fresh VELION session token, and
`VELION_OPENJARVIS_API_KEY` set to the server's separate API key. Set
`VELION_OPENJARVIS_PORT` only if the loopback port differs from 8000. Set
`VELION_OPENJARVIS_TRUSTED_DIRECT_MODE=YES` only after that inspection.
The API key must contain 32–256 letters, digits, underscores or hyphens; do not
commit or share it. Open VELION on the same computer at the normal loopback URL.
No remote phone access or persistent service is established by this adapter.

The request contains no tool definitions. This alone does not stop a separately
configured server-side agent from acting or prove which engine generated the
response. Receipts therefore label server tool access and the inference backend
as unverified. OpenJarvis structured CONSTRUCTOR AI draft requests are disabled:
this text adapter does not provide the existing GGUF grammar or acceptance gate.

## Voice and privacy

Speech-to-text and speech output depend on the browser and device. The
microphone is started only by an explicit user action. Some browser speech
recognition services may transmit audio to a third party. The UI lets the user
review the transcript before sending, and disables dictation if the browser does
not expose its speech recognition API. Speech output is opt-in and may require
a user gesture or an installed voice. This is turn-based dictation and speech
playback, not a full-duplex real-time voice service.

## Phone-ready web app shell

The standalone interface includes a local web app manifest, the existing
VELION wordmark as Home Screen icons, and safe-area spacing for phone screens.
This is a web app shell, not a native iOS/Android app or an App Store release.
The current development server only binds to the same computer's loopback and
cannot be reached from a separate phone. Installing and using the web app on a
phone requires a separately engineered, authenticated HTTPS deployment; no such
deployment is provided here. There is no service worker or offline chat cache.
An actual iPhone, Safari, microphone and Home Screen installation require
separate device testing.

An optional local Chromium test, `npm run smoke:mobile`, requires a separately
installed Playwright and compatible Chromium. It uses synthetic chat data at
two phone-sized viewports; it is not an iOS or native-installation test. For a
development environment with an existing Chromium executable, set the absolute
path in `VELION_CHROMIUM_EXECUTABLE`. Set `VELION_BROWSER_NO_SANDBOX=YES`
only when that local environment requires it; this disables Chromium's sandbox
and is not evidence of security isolation.

## Security and evidence boundaries

- The service requires explicit opt-in, a nontrivial session token, fixed
  loopback Host and Origin, JSON, bounded request/response sizes and one active
  model request. Ollama requests use only `127.0.0.1:11434` and reject redirects;
  the optional GGUF backend runs the selected local file in the server process.
- Generated text is rendered as text. The chat does not execute model output,
  invoke tools, authorize payments, approve changes or launch agents.
- The system prompt tells the model not to request or disclose credentials.
  This instruction can fail and is not a security boundary; do not enter real
  secrets into the chat. The evaluation evidence records unsafe model advice.
- The token and local-origin checks are narrow development controls, not
  production authentication, distributed AI Passport, Guardian Core,
  Approval Gateway, federated orchestration or a persistent Audit Ledger.
- A model request returns a non-persistent receipt with provider, requested
  and returned model, timestamps, latency, outcome and input/output SHA-256
  hashes. Hashes are not signatures, identity, a cost receipt or independent
  audit evidence. GGUF receipts also report the checked model-file digest.
  Conversations are not added to a server journal.
- Model output is untrusted and can be inaccurate. The local model server,
  browser, computer and any speech-recognition provider are part of the trust
  boundary. This local server must not be exposed to the public internet.
- The standard test suite does not establish live inference, real microphone,
  iPhone compatibility, continuous voice conversation, 24/7 availability or
  production readiness.
- For OpenJarvis, local access restrictions apply to the VELION endpoint; the
  separate server's own configuration and actual engine still require review.

## Verification

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
```

To perform an explicit real-model check after configuring the GGUF environment
above, run `npm run smoke:gguf`. It starts a temporary loopback server, sends
three synthetic prompts and checks VELION identity, short conversation context
and a basic arithmetic answer. The selected model can fail these checks. A pass
is limited to those cases and is not a broad model-quality benchmark. When all
three model responses arrive, the tool prints each check and retains the answers
and receipts even if one or more checks fail; failed checks use a nonzero exit.
One [bounded real-model run](evidence/LOCAL_GGUF_SMOKE_20261110.md) is recorded
with its model hash, exact scope and warning.

For additional explicitly configured local inference, `npm run evaluate:gguf`
checks four synthetic arithmetic or format-following cases and records one
unscored response for manual review. It exits unsuccessfully if any scored case
fails. Its one-run score is not a model comparison or an enterprise evaluation;
generated answers may differ between runs. One [quality probe](evidence/LOCAL_GGUF_QUALITY_20261110.md)
records a failed check and the exact limitations.

The default Ollama adapter uses Node.js built-ins only. The separately installed
GGUF option uses `node-llama-cpp` and its dependencies; `happy-dom` is a
test-only dependency for DOM emulation. The repository's automated tests use
synthetic model responses and voice events. DOM emulation is not a real browser,
live model request or external security assessment. Check workflow results for
the exact commit being reviewed.

The opt-in `npm run evaluate:intelligence` runs 20 source-visible synthetic
development cases through the configured local Ollama or GGUF backend: 14 strict automated
checks and six responses for manual review. It makes up to 20 inference requests and
does not run during the normal test suite. Results include a suite digest and
model receipts; a manual case is never counted as an automatic pass. The
runner stops at the first provider error instead of making repeated requests.
This small public suite is useful for spotting regressions, not for claiming a
general intelligence ranking or superiority over Astra. Comparison requires
the same prompts, settings and independently reviewed, unseen tasks.

One [real local Qwen2.5 1.5B evaluation](evidence/INTELLIGENCE_1P5B_20261110.md)
passed 3 of 14 strict checks and included unsafe advice in a manual case. It is
evidence of limitations in that particular run, not a deployment or safety claim.
The same suite on [Qwen2.5-Coder 7B](evidence/INTELLIGENCE_CODER7B_20261110.md)
passed 8 of 14 strict checks and also gave unsafe advice in the manual key case.
Neither configuration is suitable for a phone-facing service on this evidence.

Project author and founding architect: Alexander Nikolaevich Romaskevich
(RomaskevicH). Third-party rights and model licenses remain separate.

