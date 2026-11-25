# Agent Instructions

## References

| Need                          | File                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------ |
| Setup, development, packaging | [README.md#development](README.md#development)                                 |
| Scripts and dependencies      | [package.json](package.json)                                                   |
| CI checks                     | [.github/workflows/ci.yml](.github/workflows/ci.yml)                           |
| PR title conventions          | [.github/workflows/conventional-pr.yml](.github/workflows/conventional-pr.yml) |
| Releases                      | [.github/workflows/release-firefox.yml](.github/workflows/release-firefox.yml) |
| Privacy policy                | [PRIVACY.md](PRIVACY.md)                                                       |

## Layout

| Path                     | Contents                                                                 |
| ------------------------ | ------------------------------------------------------------------------ |
| `entrypoints/`           | Thin WXT entrypoints that load the code below                            |
| `background/`            | Service worker: reviews, sync, GitHub sign-in, badge                     |
| `content/`, `content/ui` | neetcode.io integration and its panel                                    |
| `popup/`                 | Popup `views/`, `components/`, `queries/`, `dialogs/`                    |
| `shared/`                | Domain logic, `i18n/` (`en.ts`, `zh-CN.ts`), `ui/` tokens and components |
| `backend/`               | Cloudflare worker for GitHub OAuth                                       |
| `test/`                  | Test setup, `utils/` fixtures and mocks                                  |

Tests live in `__tests__/` beside the code and are grouped by workflow, not by component; for example, `content/ui/__tests__/NeetSrsControl.test.tsx` covers the rating menu.

## NeetCode specifics

NeetSRS is a fork of LeetSRS for neetcode.io.

- A card's `frontendId` is still the LeetCode problem number; a catalog problem's `slug` is NeetCode's own slug (`duplicate-integer`), which is what the page URL and links use.
- `scripts/build-catalog.mjs` generates `public/data/neetcode-catalog-v1.json` and trims the roadmaps. Do not edit them by hand.
- `content/submission-observer.ts` and `content/editor-reset.ts` depend on NeetCode's private API and markup; check them against the live site when they stop working.
- Firefox releases are self-hosted: `.github/workflows/release-firefox.yml` signs the build (unlisted), attaches it to a GitHub release and lists it in `updates.json` through `scripts/add-firefox-update.mjs`. The manifest's `update_url` points at that file on `main`, so do not move or rename it.
- Gist sync is hidden unless `WXT_GITHUB_CLIENT_ID` is set, and its sign-in server address is a placeholder.

## Commands

| Task               | Command                            |
| ------------------ | ---------------------------------- |
| Test one file      | `npm test -- path/to/file.test.ts` |
| Check changed code | `npx biome check path/to/file.ts`  |
| Check types        | `npm run compile`                  |
| Format files       | `npm run format`                   |
| Full checks        | `npm run check`                    |
- Run full checks before submitting code or configuration changes.
- For Markdown-only changes, run `npm run format` and verify the diff and affected links; skip the full check and tests.
- In Codex, run tests and full checks with `sandbox_permissions: "require_escalated"` from the first attempt; WXT's test setup needs a localhost port.

## UI and styling

- The design system in [docs/design-system/](docs/design-system/README.md) defines the colours, type, spacing, shapes and icons for both the popup and the neetcode.io panel. Read its README, `tokens.json` and the relevant `components/*/README.md` before changing UI.
- When the code and the design system disagree, follow the design system.
- Style with the `--ls-*` tokens from `shared/ui/tokens.css`; do not hard-code colours or add one-off sizes.
- Set text with the named sizes: `text-hero`, `text-stat`, `text-title`, `text-body`, `text-xs` and `text-caption` in the popup (`popup/App.css`), and `text-panel-title`, `text-panel-body` and `text-panel-meta` on NeetCode (`content/ui/shadow.css`). Use `primaryButton` from `popup/styles.ts` for filled brand buttons.

## Tests

- Add a test only when it catches a plausible regression or meaningful failure that existing tests miss; otherwise, do not add it.
- Prioritize critical user flows, consequential business rules, integration boundaries, realistic edge cases, and known regressions.
- Extend nearby `__tests__/*.test.ts` or `*.test.tsx` coverage before creating another test suite.
- Assert observable behavior; do not mirror implementation details, test trivial getters/setters, or retest framework guarantees.
- Use representative cases; add permutations only when they catch distinct, plausible failures.
- Do not add tests merely to increase coverage or because a file changed.
- Reuse fixtures and service mocks from `test/utils/`.
- Persist test storage changes through storage writes; `test/setup.ts` makes reads return snapshots.

## Edge cases and complexity

- Add branches, validation, retries, synchronization, or abstractions only when a realistic failure justifies their complexity.
- Account for normal interaction, external input, and ordinary background concurrency or retries; scale safeguards to failure likelihood and impact.
- Rely on established internal invariants; validate untrusted input at actual trust boundaries instead of duplicating internal defenses.
- Do not add code or tests for pathological timing, impossible navigation, or invented internal corruption without evidence of a real failure or an explicit request.

## Repository conventions

- Keep PR titles and descriptions concise.
- Do not sign commits or pull requests: omit agent attribution such as `Co-Authored-By` trailers and "Generated with" lines.
- Perform implementation work in a separate Git worktree.
- Do not commit generated `.wxt/` or `.output/` files.
- Use GitHub's native issue relationships when marking issues as blocked or blocking.
