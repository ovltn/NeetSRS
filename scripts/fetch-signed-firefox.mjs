// Downloads a version Mozilla has already signed, so a release whose signing outlasted the
// workflow can be finished by running the workflow again instead of uploading twice.
//
//   node scripts/fetch-signed-firefox.mjs <version> <out .xpi>
//
// Exit codes: 0 downloaded, 2 never submitted (sign it now), 3 awaiting Mozilla's review (try again later),
// 4 rejected or disabled (fix it and release a new version).
// Reads WEB_EXT_API_KEY and WEB_EXT_API_SECRET; the add-on ID comes from the built manifest.
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const [version, out] = process.argv.slice(2);
if (!version || !out) throw new Error('Usage: node scripts/fetch-signed-firefox.mjs <version> <out .xpi>');
const { WEB_EXT_API_KEY: key, WEB_EXT_API_SECRET: secret } = process.env;
if (!key || !secret) throw new Error('Set WEB_EXT_API_KEY and WEB_EXT_API_SECRET');
const id = JSON.parse(readFileSync('.output/firefox-mv3/manifest.json', 'utf8')).browser_specific_settings.gecko.id;

// addons.mozilla.org authenticates each request with a short-lived JWT signed by the API secret.
function authorization() {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ iss: key, jti: randomUUID(), iat: now, exp: now + 60 })}`;
  return { Authorization: `JWT ${body}.${createHmac('sha256', secret).update(body).digest('base64url')}` };
}

const url = `https://addons.mozilla.org/api/v5/addons/addon/${encodeURIComponent(id)}/versions/v${version}/`;
const response = await fetch(url, { headers: authorization() });
if (response.status === 404) {
  console.log(`${id} ${version} has not been submitted.`);
  process.exit(2);
}
if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
// Mozilla's file statuses: public = signed, unreviewed = awaiting review, disabled = rejected or disabled.
// is_disabled means the developer disabled the version on addons.mozilla.org.
const { file, is_disabled: disabledByDeveloper } = await response.json();
if (disabledByDeveloper || file?.status === 'disabled') {
  console.log(
    `${id} ${version} was ${disabledByDeveloper ? 'disabled on addons.mozilla.org' : 'rejected or disabled by Mozilla'}; ` +
      'it cannot be released. Fix the cause, bump the version and release again.'
  );
  process.exit(4);
}
if (file?.status === 'unreviewed') {
  console.log(`${id} ${version} is awaiting Mozilla's review.`);
  process.exit(3);
}
if (file?.status !== 'public') throw new Error(`${id} ${version}: unexpected file status ${file?.status}`);
const download = await fetch(file.url, { headers: authorization() });
if (!download.ok) throw new Error(`${file.url}: HTTP ${download.status}`);
writeFileSync(out, Buffer.from(await download.arrayBuffer()));
console.log(`Downloaded the signed ${id} ${version} to ${out}.`);
