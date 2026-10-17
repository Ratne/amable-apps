import { fail, loadSchema, readApps } from './lib';

/**
 * Schema check of every manifest, plus the catalog rules the schema alone cannot
 * express: folder name = app id, https only, no development URLs.
 */
const { parseAppManifest, isDevelopmentManifest } = await loadSchema();
const errors: string[] = [];
const apps = readApps();

for (const app of apps) {
  const result = parseAppManifest(app.manifest);
  if (!result.ok) {
    for (const issue of result.issues) errors.push(`apps/${app.id}/manifest.json ${issue.path}: ${issue.message}`);
    continue;
  }
  if (result.manifest.id !== app.id) {
    errors.push(`apps/${app.id}/manifest.json: id "${result.manifest.id}" must match the folder name`);
  }
  if (isDevelopmentManifest(result.manifest)) {
    errors.push(`apps/${app.id}/manifest.json: development URLs are not allowed in the catalog`);
  }
}

if (errors.length > 0) fail(errors);
console.log(`${String(apps.length)} manifest(s) valid`);
