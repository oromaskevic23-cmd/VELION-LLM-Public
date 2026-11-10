# VELION local conversation prototype

VELION is a standalone IMPERIAL Core product. This increment provides a local
conversation interface with a searchable conversation sidebar, multilingual controls,
multi-turn text, optional browser speech recognition, response playback, and
optional device-local chat history. It is a prototype, not a hosted service or
a claim that VELION owns model weights. No third-party model is downloaded or
activated by this repository.

## Run on a trusted computer

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

## Voice and privacy

Speech-to-text and speech output depend on the browser and device. The
microphone is started only by an explicit user action. Some browser speech
recognition services may transmit audio to a third party. The UI lets the user
review the transcript before sending, and disables dictation if the browser does
not expose its speech recognition API. Speech output is opt-in and may require
a user gesture or an installed voice. This is turn-based dictation and speech
playback, not a full-duplex real-time voice service.

## Security and evidence boundaries

- The service requires explicit opt-in, a nontrivial session token, fixed
  loopback Host and Origin, JSON, bounded request/response sizes and one active
  model request. It calls only `127.0.0.1:11434` and rejects redirects.
- Generated text is rendered as text. The chat does not execute model output,
  invoke tools, authorize payments, approve changes or launch agents.
- The token and local-origin checks are narrow development controls, not
  production authentication, distributed AI Passport, Guardian Core,
  Approval Gateway, federated orchestration or a persistent Audit Ledger.
- A model request returns a non-persistent receipt with provider, requested
  and returned model, timestamps, latency, outcome and input/output SHA-256
  hashes. Hashes are not signatures, identity, a cost receipt or independent
  audit evidence. Conversations are not added to a server journal.
- Model output is untrusted and can be inaccurate. The local model server,
  browser, computer and any speech-recognition provider are part of the trust
  boundary. This local server must not be exposed to the public internet.
- No inference, installed model, real microphone, iPhone compatibility,
  continuous voice conversation, 24/7 availability or production readiness
  is established by the included automated tests.

## Verification

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
```

The runtime itself uses Node.js built-ins only. The locked `happy-dom` package
is a test-only dependency for DOM emulation. Model responses, microphone and
speech output in the tests are synthetic. The emulation is not a real browser,
visual review, live model request or external security assessment. The
workflow results must be checked for the exact commit being reviewed.

Project author and founding architect: Alexander Nikolaevich Romaskevich
(RomaskevicH). Third-party rights and model licenses remain separate.
