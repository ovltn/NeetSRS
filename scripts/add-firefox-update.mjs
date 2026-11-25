// Lists a signed Firefox build in updates.json, the update manifest Firefox polls.
//
//   node scripts/add-firefox-update.mjs <signed .xpi>
//
// Run after `npm run zip:firefox`: the add-on ID and version come from the built manifest.
// The .xpi must be attached to the GitHub release v<version> under the name neetsrs-<version>.xpi.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const UPDATES = 'updates.json';
const RELEASES = 'https://github.com/ovltn/NeetSRS/releases/download';

const xpi = process.argv[2];
if (!xpi) throw new Error('Usage: node scripts/add-firefox-update.mjs <signed .xpi>');

const built = JSON.parse(readFileSync('.output/firefox-mv3/manifest.json', 'utf8'));
const id = built.browser_specific_settings.gecko.id;
const { version } = built;
const hash = createHash('sha256').update(readFileSync(xpi)).digest('hex');

const manifest = JSON.parse(readFileSync(UPDATES, 'utf8'));
manifest.addons[id] ??= { updates: [] };
const updates = manifest.addons[id].updates.filter((update) => update.version !== version);
updates.push({
  version,
  update_link: `${RELEASES}/v${version}/neetsrs-${version}.xpi`,
  update_hash: `sha256:${hash}`,
});
manifest.addons[id].updates = updates;
writeFileSync(UPDATES, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${UPDATES}: ${id} ${version} -> ${updates.at(-1).update_link}`);
