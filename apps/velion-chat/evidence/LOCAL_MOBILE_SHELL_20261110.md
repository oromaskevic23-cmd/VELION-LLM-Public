# VELION mobile web shell: local checkpoint

This unsigned local engineering record is not a native application release,
an iPhone/Safari test, an external audit or evidence of production hosting.
The work starts from VELION main commit
`715247b2b03d31e3870583fdc91c97e27ef1b33f`.

The local-only interface now serves a web app manifest and VELION wordmark
icons, provides iOS Home Screen metadata, and adjusts spacing and touch targets
for narrow screens. There is no service worker and no offline chat guarantee.
Phone installation and remote use require a separately secured HTTPS service.

## Tests observed on 10 November 2026

- Node.js 24.22.1: syntax check and **15/15 Node tests** passed.
- Chromium 153.0.8010.0 / Playwright 1.62.1: the optional
  `npm run smoke:mobile` completed at **375×812 and 320×568** viewport sizes.
  It checked manifest loading, local icon reference, message input, a
  synthetic assistant response, sidebar open/close, a 44-pixel send target and
  absence of horizontal overflow. Chromium ran with `--no-sandbox` in this
  development environment; this is not containment evidence.
- Separately, the updated loopback server and CPU GGUF adapter completed the
  three synthetic prompts in `npm run smoke:gguf` using the third-party
  Qwen2.5 1.5B model. The model identified as VELION, recalled a synthetic
  name and answered 2+2. The recorded model-token warning remains unresolved.
  This smoke check does not establish broad model quality or parity with Astra.

No physical iPhone, Android device, Safari, microphone, Home Screen
installation, remote authentication or continuous voice call was tested.
The current server is restricted to loopback on the machine running it.

## Source and evidence hashes

| File | SHA-256 |
| --- | --- |
| `server.mjs` | `288385eb8a756763413491a35c491bc951b3f20c86edbb2e520355f1dacf2db6` |
| `public/index.html` | `e2600788ad82afa9ed719f4f06b5f3f8dfd8f2df028ac75d2e0b87502083305f` |
| `public/styles.css` | `7c8493e062a5620caaf1efe1299266ea60c6bea79a01d6cf46796266a9ed290b` |
| `public/manifest.webmanifest` | `e6bc40117bb602e3681aeef9d04963ab9b707a3dd4969c1d9538b474171123a0` |
| `tools/mobile-browser-smoke.mjs` | `7b182fbe2aff863fe0a637fe7c09368ec00e5741b9765a481ca15b230e4153a6` |
| [GGUF smoke output](20261110-mobile-gguf-smoke.json) | `dd33936cf0ba5c243dca0b3b61e6641ef0a362ac1deb583ddfb9e556a18fb207` |

Hashes enable byte comparison only; they are not signatures or independent
attestation. See [the earlier quality probe](LOCAL_GGUF_QUALITY_20261110.md)
for the small model's observed arithmetic and format-following failures.
