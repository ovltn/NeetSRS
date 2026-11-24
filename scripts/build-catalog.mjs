// Rebuilds the bundled problem catalog and trims the roadmaps to what NeetCode offers.
//
//   node scripts/build-catalog.mjs
//
// NeetCode hosts LeetCode problems under its own slugs. The problem list embedded in
// neetcode.io's main bundle pairs each NeetCode slug with its LeetCode slug; LeetSRS's
// catalog supplies the LeetCode number, topics and translated title for that slug.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const SITE = 'https://neetcode.io/';
const LEETCODE_CATALOG =
  'https://raw.githubusercontent.com/mattcdrake/LeetSRS/main/public/data/leetcode-catalog-v1.json';
const CATALOG_FILE = 'public/data/neetcode-catalog-v1';
const ROADMAP_DIR = 'public/data/roadmaps';

async function get(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

/** The `{problem:"…",link:"…",ncLink:"…"}` literals in NeetCode's bundle, as plain objects. */
function parseProblemList(bundle) {
  return (bundle.match(/\{problem:"[^{}]*\}/g) ?? []).map((literal) =>
    Object.fromEntries(
      [...literal.matchAll(/(\w+):("(?:[^"\\]|\\.)*"|!0|!1)/g)].map(([, key, value]) => [
        key,
        value === '!0' ? true : value === '!1' ? false : JSON.parse(value),
      ])
    )
  );
}

const html = await get(SITE);
const bundleName = html.match(/src="(main\.[0-9a-f]+\.js)"/)?.[1];
if (!bundleName) throw new Error('main.*.js not found on neetcode.io');
const listed = parseProblemList(await get(SITE + bundleName));
const leetcodeBySlug = new Map(Object.values(JSON.parse(await get(LEETCODE_CATALOG))).map((p) => [p.slug, p]));

const catalog = {};
const unmatched = [];
for (const entry of listed) {
  const slug = entry.ncLink?.replace(/\/$/, '');
  const leetcodeSlug = entry.link?.replace(/\/$/, '');
  if (!slug) continue;
  const leetcode = leetcodeBySlug.get(leetcodeSlug);
  if (!leetcode) {
    unmatched.push(slug);
    continue;
  }
  catalog[leetcode.frontendId] ??= {
    frontendId: leetcode.frontendId,
    title: entry.problem,
    translatedTitle: leetcode.translatedTitle,
    slug,
    leetcodeSlug,
    difficulty: entry.difficulty.toLowerCase(),
    isPaidOnly: entry.pro === true,
    topics: leetcode.topics,
    sources: ['neetcode.io'],
    ...(/^[A-Za-z0-9_-]{11}$/.test(entry.video ?? '')
      ? { youtubeUrl: `https://www.youtube.com/watch?v=${entry.video}` }
      : leetcode.youtubeUrl
        ? { youtubeUrl: leetcode.youtubeUrl }
        : {}),
  };
}

const count = Object.keys(catalog).length;
if (count < 500) throw new Error(`Only ${count} problems parsed; NeetCode's bundle format probably changed`);

const sorted = Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => (a < b ? -1 : 1)));
const text = `${JSON.stringify(sorted, null, 2)}\n`;
writeFileSync(`${CATALOG_FILE}.json`, text);
writeFileSync(`${CATALOG_FILE}.sha256`, `${createHash('sha256').update(text).digest('hex')}\n`);
console.log(`${count} problems written; ${unmatched.length} without a LeetCode match: ${unmatched.join(', ')}`);

// A roadmap can only list problems NeetCode hosts.
for (const file of readdirSync(ROADMAP_DIR)) {
  const path = `${ROADMAP_DIR}/${file}`;
  const roadmap = JSON.parse(readFileSync(path, 'utf8'));
  const dropped = [];
  for (const group of roadmap.groups) {
    dropped.push(...group.frontendIds.filter((id) => !catalog[id]));
    group.frontendIds = group.frontendIds.filter((id) => catalog[id]);
  }
  roadmap.groups = roadmap.groups.filter((group) => group.frontendIds.length > 0);
  writeFileSync(path, `${JSON.stringify(roadmap, null, 2)}\n`);
  if (dropped.length > 0) console.log(`${roadmap.id}: dropped ${dropped.join(', ')} (not on NeetCode)`);
}
