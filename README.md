# Lunchdrop+

Browser extension for [Lunchdrop](https://www.lunchdrop.com/). Chrome and Firefox, built with [WXT](https://wxt.dev/) (Vite) and React.

On Lunchdrop, the support row is labeled "Support:". Clicking the price opens a modal titled "Support": Lunchdrop's default, a percentage, the subsidy still left today, or skip. Choosing an option updates the open order. Remember for future orders is on by default, and turning it off keeps the change on this order only. A spinner grows in beside that price while the request runs, then a checkmark fades out. The toolbar popup edits the same preference. After an order is placed, the extension sets that fee when it differs from Lunchdrop’s default.

Menu alerts live in a separate project. This extension works without that service.

## Scripts

```bash
yarn dev            # watch mode; load .output/chrome-mv3-dev in Arc
yarn dev:firefox
yarn build          # unpacked extension in .output/chrome-mv3
yarn build:firefox  # unpacked extension in .output/firefox-mv3
yarn verify         # ESLint, Prettier, and tsc
yarn release 0.1.0  # verify, zip, and publish a GitHub release
```

`yarn install` registers git hooks: pre-commit runs lint-staged, pre-push runs `yarn verify`.

Load the unpacked build from `chrome://extensions` or `about:debugging`.

Vite is a direct dev dependency because Yarn 1 does not install WXT's peer dependency on its own.

## Release

With a clean worktree and an `origin` remote:

```bash
yarn release 0.1.0          # or: yarn release patch
yarn release 0.1.0 --dry-run
```

`yarn release` sets the `package.json` version, runs `yarn verify`, zips Chrome and Firefox, commits that version, pushes, and creates GitHub release `v0.1.0` with both zips. `--dry-run` builds the zips and leaves `package.json` as it was.

Those GitHub files are for manual install. They do not auto-update.

Chrome and Arc update an extension after it is published on the Chrome Web Store. Unlisted is enough: it stays out of search, anyone with the listing link can install, and installed copies update on Chrome's normal schedule. A draft that was never published does not. On macOS and Windows, a self-hosted update manifest (including one attached to a GitHub release) is only honored for enterprise-managed Chrome. Linux can install a packed extension from your own server.

Firefox updates from addons.mozilla.org, including an unlisted add-on. A GitHub-hosted update file works only after Mozilla has signed the package.
