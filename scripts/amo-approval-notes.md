# Firefox review build

Build an exact copy of the Firefox package from this source archive.

## Environment

- Operating system: macOS or Linux
- Node.js 22: https://nodejs.org/ or `nvm install 22`
- Yarn Classic 1.22.17, after Node is installed: `npm install -g yarn@1.22.17`

## Steps

1. Unzip this archive.
2. `yarn install --frozen-lockfile`. If that fails because the archive is not a git checkout, husky is the cause. Run `yarn install --frozen-lockfile --ignore-scripts` instead.
3. `yarn zip:firefox`

`yarn zip:firefox` runs `wxt zip -b firefox --mv3`.

The built package is `.output/lunchdrop-plus-<version>-firefox.zip`. `<version>` is the `version` field in `package.json`.

Third-party libraries are installed from `yarn.lock`. The extension source is the TypeScript and TSX in this archive.
