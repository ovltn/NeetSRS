# NeetSRS Privacy Policy

**Last Updated: November 25, 2026**

Your learning data—cards, notes, review activity, and settings—stays on your device.

NeetSRS follows the Chrome Web Store Limited Use requirements. We do not sell your data, use it for advertising, or transfer it for purposes unrelated to NeetSRS. The extension does not collect analytics, crash reports, or other telemetry.

The extension downloads the problem catalog from the NeetSRS repository on GitHub when the catalog changes. It makes no other network requests unless you sign in with GitHub.

## Optional GitHub sync

If you turn on GitHub sync, NeetSRS stores your learning data in a Gist in your GitHub account to keep your devices in sync. Signing in alone does not turn on sync. Sign-in asks GitHub for `gist` access to manage Gists and `offline_access` to renew access without signing in again.

NeetSRS does not encrypt backups. New backups are secret Gists: **they are not private—anyone with the link can read them.**

GitHub sign-in goes through a NeetSRS authentication service hosted on Cloudflare (`neetsrs-auth.neetsrs.workers.dev`). It passes the sign-in code and renewal tokens between the extension and GitHub, stores nothing, and never receives your learning data, which travels directly between the extension and GitHub. Cloudflare processes connection metadata, including IP addresses. GitHub and Cloudflare handle data under their own privacy policies.

## Your controls

You can turn off sync or sign out at any time. Signing out disconnects sync and removes saved GitHub credentials from the extension, but keeps your learning data and backups. You can delete backups or revoke access through GitHub.

## Changes

We will update this policy when our data practices change. For questions, open an issue in the [NeetSRS repository](https://github.com/ovltn/NeetSRS/issues).
