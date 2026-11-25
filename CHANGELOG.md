# Changelog

## 0.1.1 (2026-11-25)

### Features

- Firefox updates itself: releases are signed by Mozilla, published on GitHub, and listed in `updates.json`, which the add-on's manifest points to.

## 0.1.0 (2026-11-24)

First NeetSRS release, forked from [LeetSRS 1.7.2](https://github.com/mattcdrake/LeetSRS/releases/tag/v1.7.2).

### Features

- Run on neetcode.io: open the rating panel after an accepted submission, mount the control in NeetCode's editor toolbar, and reset the editor through NeetCode's Reset Code dialog.
- Ship a catalog of the 1,104 problems NeetCode hosts, built by `scripts/build-catalog.mjs`.

### Removed

- leetcode.com and leetcode.cn support, the preferred-site setting, the store rating prompt and the release announcement.
- GitHub Gist sync is hidden until NeetSRS has an OAuth app of its own.

For earlier history, see the [LeetSRS changelog](https://github.com/mattcdrake/LeetSRS/blob/main/CHANGELOG.md).
