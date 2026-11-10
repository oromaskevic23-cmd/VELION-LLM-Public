# VELION local GGUF conversation: bounded real-model check

This is a self-recorded local development experiment on 10 November 2026,
not an independent audit or a deployment claim. The original model weights
belong to their respective third-party owners; VELION is the application and
control interface.

## Runtime and model

- Runtime: Node.js 24.22.1, `node-llama-cpp` 3.22.3, CPU, local loopback.
- Model: [Qwen2.5-1.5B-Instruct-GGUF](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF), file `qwen2.5-1.5b-instruct-q4_k_m.gguf` at source revision `91cad51170dc346986eccefdc2dd33a9da36ead9`.
- Model-file SHA-256: `6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e`.
- No hosted inference API, paid fallback, customer information or persistent
  model hosting was used. The temporary execution environment has stopped.

## Observed result

The explicitly invoked local smoke test sent three synthetic Russian prompts
through the real loopback HTTP handler and the GGUF adapter. It observed a
VELION self-identification, recalled the synthetic name `Irina` in the next
turn, and answered `4` to `2+2`. The three assertions passed in this run.
Start and finish were `2026-11-10T06:42:21.288Z` and
`2026-11-10T06:42:28.740Z`. [Unsigned local output and receipts](20261110-gguf-smoke.json)
have SHA-256 `4c7483339399e39548981a6d768c66f71dad0d4a8a8b1bb7c3256b7e2ad654f2`.

Separately, a Chromium test at a 390-by-844 viewport used the same real model
through the browser UI for two turns. No real iPhone or physical microphone was
tested. The test did not establish a continuous voice conversation.

The runtime emitted a warning that a control-looking token in the model was
not marked as a control token and would be overridden. The model still returned
the recorded responses. This warning has not been independently resolved.

## Source binding

The local smoke used these SHA-256 source bytes:

| File | SHA-256 |
| --- | --- |
| `native-gguf/gguf-chat.mjs` | `95a3c5f0251ed4ad5815ef01d0dac8877627f8d2e2bfc3f651e9b32de7689683` |
| `chat-service.mjs` | `be42fdfda8c94eb9731c9aec32cc100a42283f96ccd833ae8ef8a41ea6e01c09` |
| `server.mjs` | `7fa43baaee9683fa5faef22e727c1fc825148f9d2ea39a3a5431285dd0ea8d89` |
| `public/app.mjs` | `3a998d788576c3dc39350fd422a26d147160fbba3e1a33bbef1927a589d87299` |
| `tools/gguf-live-smoke.mjs` | `2c70e8db4a4e18b2ee1eb04bb83d2e6a9834e93114f4ffd5a63ff5901e168357` |

Hashes prove only that the listed bytes can be compared; they do not prove who
ran the test. The standard automated suite uses fixtures. Three successful
synthetic checks cannot establish general accuracy, parity with another model,
enterprise readiness, production authorization, 24/7 service or security.
