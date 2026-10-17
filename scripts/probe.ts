import { fail, loadSchema, readApps } from './lib';

/**
 * Live checks of the apps touched by a PR (or every app with --all):
 * base_url answers over https, the JWKS is valid and contains usable signing keys.
 */
const { parseAppManifest } = await loadSchema();
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const all = process.argv.includes('--all');
const SIGNING_KEYS = new Set(['OKP:Ed25519', 'EC:P-256', 'RSA:']);

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
  return response.json();
}

const errors: string[] = [];
for (const app of readApps()) {
  if (!all && only.length > 0 && !only.includes(app.id)) continue;
  const parsed = parseAppManifest(app.manifest);
  if (!parsed.ok) continue;
  const manifest = parsed.manifest;
  try {
    const response = await fetch(manifest.base_url, { signal: AbortSignal.timeout(10_000), redirect: 'manual' });
    if (response.status >= 500) errors.push(`${app.id}: base_url answered ${String(response.status)}`);
  } catch (error) {
    errors.push(`${app.id}: base_url unreachable (${error instanceof Error ? error.message : String(error)})`);
  }
  try {
    const jwks = (await fetchJson(manifest.jwks_url)) as { keys?: Array<Record<string, unknown>> };
    const keys = Array.isArray(jwks.keys) ? jwks.keys : [];
    const usable = keys.filter(
      (k) => typeof k['kid'] === 'string' && SIGNING_KEYS.has(`${String(k['kty'])}:${k['kty'] === 'RSA' ? '' : String(k['crv'])}`),
    );
    if (usable.length === 0) errors.push(`${app.id}: JWKS has no Ed25519 / P-256 / RSA key with a kid`);
    if (keys.some((k) => 'd' in k)) errors.push(`${app.id}: JWKS exposes a PRIVATE key`);
  } catch (error) {
    errors.push(`${app.id}: JWKS unreadable (${error instanceof Error ? error.message : String(error)})`);
  }
}

if (errors.length > 0) fail(errors);
console.log('live checks passed');
