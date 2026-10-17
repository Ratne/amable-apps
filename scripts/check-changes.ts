import { execFileSync } from 'node:child_process';
import { fail } from './lib';

/**
 * Pull request guard against silent identity changes. Compared with the base
 * branch, a PR may not:
 * - remove or rename an app folder (the id is permanent: installations key on it);
 * - change `jwks_url` or `base_url` of an existing app, unless the PR carries the
 *   `identity-change-approved` label (set by the catalog owner after verifying
 *   the developer out of band);
 * - touch `catalog.json` (catalog owner only, label `catalog-owner`).
 */
const base = process.env.BASE_REF ?? 'origin/main';
const labels = (process.env.PR_LABELS ?? '').split(',').map((l) => l.trim());

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function manifestAt(ref: string, id: string): Record<string, unknown> | null {
  try {
    return JSON.parse(git('show', `${ref}:apps/${id}/manifest.json`)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const errors: string[] = [];
const changed = git('diff', '--name-status', `${base}...HEAD`, '--', 'apps')
  .split('\n')
  .filter(Boolean)
  .map((line) => line.split('\t'));

for (const [status, path, renamed] of changed) {
  const id = path?.split('/')[1];
  if (id === undefined) continue;
  if (status?.startsWith('D') || status?.startsWith('R')) {
    errors.push(`apps/${id}: app folders cannot be removed or renamed${renamed === undefined ? '' : ` (→ ${renamed})`}`);
    continue;
  }
  if (path?.endsWith('/catalog.json') && !labels.includes('catalog-owner')) {
    errors.push(`${path}: only the catalog owner edits catalog flags`);
  }
  if (!path?.endsWith('/manifest.json') || status === 'A') continue;
  const before = manifestAt(base, id);
  const after = manifestAt('HEAD', id);
  if (before === null || after === null) continue;
  for (const field of ['id', 'jwks_url', 'base_url']) {
    if (before[field] !== after[field] && !labels.includes('identity-change-approved')) {
      errors.push(`apps/${id}: "${field}" changed from ${String(before[field])} to ${String(after[field])}; needs the identity-change-approved label`);
    }
  }
}

if (errors.length > 0) fail(errors);
console.log(`${String(changed.length)} changed file(s) checked`);
