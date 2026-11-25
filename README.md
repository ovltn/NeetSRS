# NeetSRS

NeetSRS helps you remember what you learn on [NeetCode](https://neetcode.io) through spaced repetition. Solve a problem, rate your recall, and review it when it's due.

It is a fork of [LeetSRS](https://github.com/mattcdrake/LeetSRS) by Matt Drake, adapted from LeetCode to NeetCode. It is not listed in a browser store: Firefox installs it from this repository's releases, and Chrome from source.

## How it works

1. **Solve a problem on neetcode.io.** When your submission is accepted, the NeetSRS panel opens from the editor toolbar.
2. **Rate your recall.** Choose **Again**, **Hard**, **Good**, or **Easy**, or press 1–4. Each rating shows when the problem will come back.
3. **Return for review.** Open the extension: **Home** shows problems that are due, **Calendar** shows the next four weeks, and **Roadmaps** follows Blind 75, NeetCode 150, NeetCode 250 or Grind 75.

NeetSRS schedules reviews with the [FSRS algorithm](https://github.com/open-spaced-repetition/ts-fsrs). Your data stays in the browser; export or import a backup from Settings, or in Firefox sign in with GitHub to sync it through a secret Gist.

## Differences from LeetSRS

- Runs on neetcode.io only. Problems keep their LeetCode numbers and use NeetCode's titles and links.
- The catalog holds the 1,104 problems NeetCode hosts. Grind 75 lists 71 problems, because NeetCode does not host the other four.
- GitHub Gist sync works in Firefox only, through NeetSRS's own sign-in server. Chrome builds from source have no fixed sign-in address.
- leetcode.cn support, the store rating prompt and the release announcement are removed.

## Install in Firefox

Open the `.xpi` attached to the [latest release](https://github.com/ovltn/NeetSRS/releases/latest) in Firefox 140 or newer. Mozilla signs each release without listing it in the add-on store, and Firefox checks [`updates.json`](updates.json) about once a day to install new releases by itself.

## Install from source

```sh
git clone https://github.com/ovltn/NeetSRS.git
cd NeetSRS
npm install
npm run build
```

In Chrome, open `chrome://extensions`, turn on **Developer mode**, select **Load unpacked** and choose `.output/chrome-mv3`.

In Firefox, run `npm run build:firefox`, open `about:debugging#/runtime/this-firefox`, select **Load Temporary Add-on** and choose `.output/firefox-mv3/manifest.json`. Firefox removes a temporary add-on when it restarts.

## Releasing

1. Bump the version: `npm version <x.y.z> --no-git-tag-version`, add a `CHANGELOG.md` entry, and push to `main`.
2. Run the **Release Firefox** workflow from the Actions tab, or `gh workflow run release-firefox.yml`.

The workflow runs the checks, signs the Firefox build with Mozilla (unlisted channel), publishes it as release `v<x.y.z>`, and adds it to `updates.json`. It needs the repository secrets `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`, the JWT issuer and secret from <https://addons.mozilla.org/developers/addon/api/key/>. Mozilla usually signs within minutes; if it takes longer than the hour the workflow waits, run the workflow again later and it picks up the signed file. If Mozilla rejects a version, the workflow says so: fix the cause and release a new version. Anyone holding them can publish a version that installed copies will accept, so keep them only in those secrets. The workflow also needs the repository variable `NEETSRS_GITHUB_CLIENT_ID` (see below); without it the build would have no GitHub sync, so the workflow stops.

## Sign-in server

GitHub sync signs in through `backend/worker.ts`, a Cloudflare Worker at `https://neetsrs-auth.neetsrs.workers.dev` that holds the GitHub OAuth App's client secret and exchanges sign-in codes and refresh tokens for the extension. It stores nothing and never sees learning data.

- The OAuth App's callback URL is Firefox's redirect URL for `neetsrs@ovltn.github.io`: `https://133f2c0640d73c08bbab7e146e8800ef9541f110.extensions.allizom.org/`. The same value is `ALLOWED_CALLBACKS` in `backend/wrangler.jsonc`.
- The public client ID is `GITHUB_CLIENT_ID` in `backend/wrangler.jsonc`, the `NEETSRS_GITHUB_CLIENT_ID` repository variable, and `WXT_GITHUB_CLIENT_ID` in a local `.env`.
- Set the secret with `npx wrangler secret put GITHUB_CLIENT_SECRET --config backend/wrangler.jsonc`, and deploy with `npm run backend:deploy` after `npx wrangler login`.
- The Worker's address is `shared/github-auth-origin.ts`. Changing it needs a new release, and users grant GitHub access again.

## Problem data

`node scripts/build-catalog.mjs` rebuilds `public/data/neetcode-catalog-v1.json` from the problem list in neetcode.io's site bundle and LeetSRS's catalog, and drops roadmap entries NeetCode does not host. Installed copies download the catalog from this repository's `main` branch when it changes.

## Development

Use Node.js 24 or newer. After `npm install`, `npm run dev` starts Chrome with the extension loaded.

| Command                  | Purpose                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`            | Start Chrome with a fresh temporary profile.                                                                                                     |
| `npm run dev:persistent` | Reuse a Chrome profile, including logins and extension data.                                                                                     |
| `npm run dev:reset`      | Delete the persistent development profile, including its logins and extension data. Stop the dev server and close the development browser first. |
| `npm run dev:firefox`    | Start Firefox with a fresh temporary profile.                                                                                                    |
| `npm run build:firefox`  | Build the Firefox MV3 extension.                                                                                                                 |
| `npm run zip:firefox`    | Package the Firefox extension and source archive.                                                                                                |
| `npm run lint:firefox`   | Validate the built Firefox extension with Mozilla’s linter.                                                                                      |
| `npm run build`          | Build the production Chrome extension.                                                                                                           |
| `npm run zip`            | Package the Chrome extension for distribution.                                                                                                   |
| `npm run check`          | Run lint, formatting, type, and test checks.                                                                                                     |

The persistent profile lives in `.wxt/chrome-data`, which Git ignores. Fresh runs leave it untouched.

## Contributing

Bug reports, feedback, and contributions are welcome. [Open an issue](https://github.com/ovltn/NeetSRS/issues) or read the [contribution guidelines](https://github.com/ovltn/NeetSRS/blob/main/CONTRIBUTING.md) before opening a pull request.

## License

[MIT](https://github.com/ovltn/NeetSRS/blob/main/LICENSE.md)
