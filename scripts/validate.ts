import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fail, loadSchema, OFFICIAL_BUNDLE_PREFIX, readApps } from './lib';

/**
 * Schema check of every manifest, plus the catalog rules the schema alone cannot
 * express: folder name = app id, https only, no development URLs. Apps deployed
 * into the workspace's own Cloudflare account (`base_url` = DEPLOYED_APP_ORIGIN)
 * must carry a released bundle of the AmableData repository and an icon
 * committed next to the manifest.
 */
const { parseAppManifest, isDevelopmentManifest, isDeployableManifest, DEPLOYED_APP_ORIGIN } = await loadSchema();
const errors: string[] = [];
const apps = readApps();

for (const app of apps) {
  const result = parseAppManifest(app.manifest);
  if (!result.ok) {
    for (const issue of result.issues) errors.push(`apps/${app.id}/manifest.json ${issue.path}: ${issue.message}`);
    continue;
  }
  const manifest = result.manifest;
  if (manifest.id !== app.id) {
    errors.push(`apps/${app.id}/manifest.json: id "${manifest.id}" must match the folder name`);
  }
  if (isDevelopmentManifest(manifest)) {
    errors.push(`apps/${app.id}/manifest.json: development URLs are not allowed in the catalog`);
  }
  const deployed = manifest.base_url === DEPLOYED_APP_ORIGIN;
  if (deployed !== (manifest.deployment !== undefined)) {
    errors.push(`apps/${app.id}/manifest.json: "deployment" and base_url ${DEPLOYED_APP_ORIGIN} go together`);
    continue;
  }
  if (!deployed) continue;
  if (!isDeployableManifest(manifest)) {
    errors.push(`apps/${app.id}/manifest.json: deployment needs bundle_url and bundle_sha256 (node scripts/release-app.mjs ${app.id} in AmableData)`);
    continue;
  }
  if (!manifest.deployment.bundle_url.startsWith(OFFICIAL_BUNDLE_PREFIX)) {
    errors.push(`apps/${app.id}/manifest.json: bundle_url must be a release asset of ${OFFICIAL_BUNDLE_PREFIX}`);
  }
  const icon = `https://raw.githubusercontent.com/Ratne/amable-apps/main/apps/${app.id}/icon.png`;
  if (manifest.icon_url !== icon) errors.push(`apps/${app.id}/manifest.json: icon_url must be ${icon}`);
  if (!existsSync(join(app.dir, 'icon.png'))) errors.push(`apps/${app.id}/icon.png: missing (the icon is served from this repository)`);
}

if (errors.length > 0) fail(errors);
console.log(`${String(apps.length)} manifest(s) valid`);
