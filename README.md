# NeetSRS

NeetSRS helps you remember what you learn on [NeetCode](https://neetcode.io) through spaced repetition. Solve a problem, rate your recall, and review it when it's due.

It is a fork of [LeetSRS](https://github.com/mattcdrake/LeetSRS) by Matt Drake, adapted from LeetCode to NeetCode. It is not published in a browser store; install it from source.

## How it works

1. **Solve a problem on neetcode.io.** When your submission is accepted, the NeetSRS panel opens from the editor toolbar.
2. **Rate your recall.** Choose **Again**, **Hard**, **Good**, or **Easy**, or press 1–4. Each rating shows when the problem will come back.
3. **Return for review.** Open the extension: **Home** shows problems that are due, **Calendar** shows the next four weeks, and **Roadmaps** follows Blind 75, NeetCode 150, NeetCode 250 or Grind 75.

NeetSRS schedules reviews with the [FSRS algorithm](https://github.com/open-spaced-repetition/ts-fsrs). Your data stays in the browser; export or import a backup from Settings.

## Differences from LeetSRS

- Runs on neetcode.io only. Problems keep their LeetCode numbers and use NeetCode's titles and links.
- The catalog holds the 1,104 problems NeetCode hosts. Grind 75 lists 71 problems, because NeetCode does not host the other four.
- GitHub Gist sync is hidden: it needs an OAuth app and sign-in server that NeetSRS does not have yet.
- leetcode.cn support, the store rating prompt and the release announcement are removed.

## Install from source

```sh
git clone https://github.com/ovltn/NeetSRS.git
cd NeetSRS
npm install
npm run build
```

In Chrome, open `chrome://extensions`, turn on **Developer mode**, select **Load unpacked** and choose `.output/chrome-mv3`.

In Firefox (140 or newer), run `npm run build:firefox`, open `about:debugging#/runtime/this-firefox`, select **Load Temporary Add-on** and choose `.output/firefox-mv3/manifest.json`. Firefox removes a temporary add-on when it restarts.

### A permanent Firefox install

Release Firefox only keeps add-ons that Mozilla has signed. To sign your own copy without listing it publicly, create API credentials at <https://addons.mozilla.org/developers/addon/api/key/> and run:

```sh
npm run zip:firefox
npx web-ext sign --channel unlisted --source-dir .output/firefox-mv3 \
  --upload-source-code .output/neetsrs-<version>-sources.zip \
  --api-key "$WEB_EXT_API_KEY" --api-secret "$WEB_EXT_API_SECRET"
```

Open the signed `.xpi` it writes to `web-ext-artifacts/` in Firefox to install it.

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
