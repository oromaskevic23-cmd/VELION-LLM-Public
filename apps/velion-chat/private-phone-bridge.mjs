// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Narrow, opt-in phone proof behind private Tailscale Serve; never public Funnel.
const LOOPBACK = new Set(['127.0.0.1', '::ffff:127.0.0.1']);

export function privatePhoneBridgeFromEnv(env = process.env) {
  const origin = (env.VELION_TAILNET_ORIGIN ?? '').trim();
  const login = (env.VELION_TAILNET_LOGIN ?? '').trim().toLowerCase();
  if (!origin && !login) return null;
  if (!origin || !login) throw Error('TAILNET_BRIDGE_INCOMPLETE');
  let url;
  try {
    url = new URL(origin);
  } catch {
    throw Error('TAILNET_ORIGIN_INVALID');
  }
  if (
    url.protocol !== 'https:' ||
    !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.ts\.net$/.test(url.hostname) ||
    url.origin !== origin ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw Error('TAILNET_ORIGIN_INVALID');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) throw Error('TAILNET_LOGIN_INVALID');
  return Object.freeze({ origin, host: url.host, login });
}

export function isAuthorizedPrivatePhoneRequest(req, bridge) {
  if (!bridge) return false;
  const login = req.headers['tailscale-user-login'];
  return (
    LOOPBACK.has(req.socket.remoteAddress) &&
    req.headers.host === bridge.host &&
    typeof login === 'string' &&
    login.toLowerCase() === bridge.login &&
    (req.method !== 'POST' || req.headers.origin === bridge.origin)
  );
}
