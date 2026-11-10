# VELION — private phone proof (Tailscale Serve only)

**Status: source implementation, NOT device-verified.** This is an opt-in engineering
bridge from the existing loopback-only web app to a private HTTPS URL inside a
Tailscale tailnet. It is **not** consumer hosting, Expo, native iOS/Android,
an App Store release, a production authentication system or an authorization
to use IMPERIAL Core internal data.

## Architecture and trust boundary

Phone browser (Tailscale user/device) -> private HTTPS Tailscale **Serve** ->
loopback reverse proxy on the operator's trusted machine -> existing VELION
chat server -> already configured local Ollama or GGUF backend.

**Never use Tailscale Funnel or public port forwarding.** There is no public
listening port in VELION: Node remains bound to `127.0.0.1`. The private
origin is rejected unless all of these conditions hold:

1. Phone bridge was explicitly configured at startup.
2. The request reaches Node from loopback, through a trusted local proxy.
3. HTTP Host exactly matches the configured `https://*.ts.net` origin.
4. The Tailscale Serve `Tailscale-User-Login` identity header matches the
   owner's explicitly configured login.
5. For POST /api/chat, browser Origin exactly matches that private HTTPS origin.
6. The normal VELION session bearer token is also valid.
7. Existing request-body, concurrency, timeout and model restrictions still apply.

Tailscale Serve strips user-supplied identity headers before adding its own,
according to the [Tailscale Serve documentation](https://tailscale.com/docs/features/tailscale-serve).
Identity headers are not guaranteed for tagged devices, which therefore fail closed.
The model server and local host must still be trusted. A compromised process
on the operator's host can spoof loopback headers and is out of scope.

## Operator runbook — manual, no automated deployment

Prerequisites: a trusted computer capable of running the local model, a
Tailscale tailnet with MagicDNS/HTTPS, Tailscale connected both on this computer
and on the phone, and narrowly restricted tailnet grants for the phone/device.
Do not connect any internal corporate database or production secrets.

1. Install and configure the local VELION Ollama or GGUF backend exactly as
   documented in [README.md](README.md). Keep the existing 
   `IMPERIAL_CHAT_LOCAL_ONLY=YES` opt-in and a freshly generated strong
   `VELION_CHAT_TOKEN` **only in the server environment**.
2. Look up the actual machine HTTPS URL in `tailscale serve --status` or via
   the Serve output. Set `VELION_TAILNET_ORIGIN` to that exact origin (no
   trailing slash, path or custom port), and set `VELION_TAILNET_LOGIN` to
   the intended owner's Tailscale login. Example, using placeholders:

   ```sh
   export VELION_TAILNET_ORIGIN=https://your-machine.your-tailnet.ts.net
   export VELION_TAILNET_LOGIN=owner@example.com
   npm start
   ```

3. In a second terminal on the **same machine**, enable private Serve:

   ```sh
   tailscale serve --bg 4174
   tailscale serve --status
   ```

   The HTTPS URL must match `VELION_TAILNET_ORIGIN`. If proxy Host or user
   identity headers differ in a particular Tailscale version, **stop and
   investigate**; do not relax checks without adding negative tests.
4. On an iPhone or Android device connected to the same permitted tailnet,
   open the private HTTPS URL. In VELION Settings, enter the locally generated
   session token through a trusted channel, then send a synthetic question.
   Never put that token into GitHub, a chat transcript, a screenshot or a
   URL. Do not test with customer, company, CRM, wallet or personal data.
5. Capture the exact device, OS, browser, model identifier and file hash,
   response received, errors, total tokens/latency if available, and results
   of the negative checks. A phone screenshot is not evidence of the model's
   identity or broad quality.

## Negative checks before declaring a pass

- Missing phone configuration: private-origin API returns 403.
- Wrong Tailscale login or missing identity header: 403.
- Wrong HTTPS Origin: 403.
- Wrong bearer token: 401.
- Valid identity, Origin and token: local model inference must really run,
  not a synthetic fixture.
- Server with backend disabled: 503.
- No public Funnel exposure, public DNS deployment or open LAN port.
- Owner kill switch: stop the local Node process and disable Serve.

```sh
# Run code-level checks on the exact commit, no hosted CI required:
npm run check
npm test

# After the phone experiment, disable the Serve listener:
tailscale serve --https=443 off
```

**Acceptance requirement:** hardware evidence from both iOS and Android,
real model responses, independently repeatable negative authorization tests,
and no unexpected quota or network exposure. Until then the status is
`IMPLEMENTED_IN_DRAFT / DEVICE_NOT_VERIFIED`.

## Production boundary

A customer-facing native app needs a separate production identity, consent,
tenancy/isolation, quotas and billing controls, Guardian Core, Approval Gateway,
audit retention/redaction, formal threat modelling, operational availability,
mobile store review and independent QA. This tailnet proof deliberately
does not authorize agent tool calls or production data access.

Project author and founding architect: Alexander Nikolaevich Romaskevich
(RomaskevicH). Third-party models, Tailscale and their rights remain separate.
