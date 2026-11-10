# VELION navigation verification

Observed locally on 2026-11-10 against the standalone VELION chat.

- `npm run check` and `npm test`: 16 tests passed.
- Chromium 153.0.8010.0: mobile emulation at 375×812 and 320×568;
  synthetic-model dialogue, menu open/close, Escape and focus return,
  search reset on a new conversation, manifest and no horizontal overflow.
- Desktop 1200×800: sidebar collapse/restore and resizing between desktop
  and mobile. The hidden sidebar is inert and the toggle exposes its state.
- The Chromium process used `--no-sandbox` in this controlled test environment.
  Browser model replies were supplied by a synthetic fixture.

Not tested: physical iPhone, iOS Safari, microphone, installation, online
hosting, production authentication, or an always-on model. This observation
does not establish model quality or security certification.
