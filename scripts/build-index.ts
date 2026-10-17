import { mkdirSync, writeFileSync } from 'node:fs';
import { fail, loadSchema, readApps } from './lib';

/**
 * Builds `dist/index.json` from every valid manifest and, with
 * CATALOG_SIGNING_KEY (PKCS#8 base64, GitHub secret) set, the signed envelope
 * `dist/index.signed.json` that installations download.
 */
const { parseAppManifest, signCatalogIndex, CATALOG_INDEX_FORMAT } = await loadSchema();
const keyId = process.env.CATALOG_KEY_ID ?? '2026-10';
const signingKey = process.env.CATALOG_SIGNING_KEY;

const errors: string[] = [];
const apps = readApps().flatMap((app) => {
  const parsed = parseAppManifest(app.manifest);
  if (!parsed.ok) {
    errors.push(`${app.id}: invalid manifest`);
    return [];
  }
  return [
    {
      manifest: app.manifest,
      verified: true,
      revoked: app.flags.revoked === true,
      ...(app.flags.revoked_reason === undefined ? {} : { revoked_reason: app.flags.revoked_reason }),
      ...(app.flags.added_at === undefined ? {} : { added_at: app.flags.added_at }),
    },
  ];
});
if (errors.length > 0) fail(errors);

const index = { format: CATALOG_INDEX_FORMAT, generated_at: new Date().toISOString(), apps };
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.json', `${JSON.stringify(index, null, 2)}\n`);
if (signingKey === undefined || signingKey === '') {
  console.warn('CATALOG_SIGNING_KEY not set: dist/index.signed.json not written');
} else {
  const signed = await signCatalogIndex(index, signingKey.trim(), keyId);
  writeFileSync('dist/index.signed.json', `${JSON.stringify(signed)}\n`);
  console.log(`signed ${String(apps.length)} app(s) with key ${keyId}`);
}
