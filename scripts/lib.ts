import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * The manifest schema lives in the AmableData repo (`packages/core/src/apps`).
 * CI checks it out into `.amable/`; locally set AMABLE_REPO to a checkout.
 */
export const AMABLE_REPO = resolve(process.env.AMABLE_REPO ?? '.amable');

type AppsModule = typeof import('../.amable/packages/core/src/apps/index');

export async function loadSchema(): Promise<AppsModule> {
  const entry = join(AMABLE_REPO, 'packages/core/src/apps/index.ts');
  if (!existsSync(entry)) {
    throw new Error(`AmableData checkout not found at ${AMABLE_REPO} (set AMABLE_REPO)`);
  }
  return (await import(pathToFileURL(entry).href)) as AppsModule;
}

export const APPS_DIR = resolve('apps');

/** Per-app catalog flags, maintained by the catalog owner (never by the app developer). */
export interface CatalogFlags {
  revoked?: boolean;
  revoked_reason?: string;
  added_at?: string;
}

export interface AppFolder {
  readonly id: string;
  readonly dir: string;
  readonly manifest: unknown;
  readonly flags: CatalogFlags;
}

export function readApps(root = APPS_DIR): AppFolder[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = join(root, entry.name);
      const manifestPath = join(dir, 'manifest.json');
      const flagsPath = join(dir, 'catalog.json');
      return {
        id: entry.name,
        dir,
        manifest: JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown,
        flags: existsSync(flagsPath) ? (JSON.parse(readFileSync(flagsPath, 'utf8')) as CatalogFlags) : {},
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function fail(lines: string[]): never {
  for (const line of lines) console.error(`::error::${line}`);
  process.exit(1);
}
