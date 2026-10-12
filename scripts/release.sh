#!/usr/bin/env bash
# Verify, zip, and publish Lunchdrop+ to a GitHub release.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: yarn release <version> [--dry-run]

  version    A new x.y.z, or patch, minor, or major relative to package.json

The release checks origin and gh auth, requires a clean worktree, sets the
package.json version, runs yarn verify, zips Chrome and Firefox, commits that
version, pushes, and creates GitHub release v<version> with the Chrome zip.
The Firefox zip is a build check and is not published. The Firefox Add-on
workflow then submits the Firefox build to addons.mozilla.org and attaches
lunchdrop-plus-<version>-firefox.xpi.

--dry-run builds the zips and leaves package.json unchanged.
EOF
}

cd "$(dirname "$0")/.."

DRY_RUN=0
VERSION_ARG=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h | --help)
      usage
      exit 0
      ;;
    --) ;;
    -*)
      echo "Unknown option: $arg" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -n "$VERSION_ARG" ]]; then
        echo "Unexpected argument: $arg" >&2
        exit 1
      fi
      VERSION_ARG="$arg"
      ;;
  esac
done

if [[ -z "$VERSION_ARG" ]]; then
  usage >&2
  exit 1
fi

CURRENT="$(node -p "require('./package.json').version")"

case "$VERSION_ARG" in
  patch | minor | major)
    VERSION="$(node -e '
      const [current, kind] = process.argv.slice(1)
      const parts = current.split(".").map(Number)
      if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
        console.error("package.json version must look like 1.2.3")
        process.exit(1)
      }
      const [major, minor, patch] = parts
      if (kind === "major") console.log(`${major + 1}.0.0`)
      else if (kind === "minor") console.log(`${major}.${minor + 1}.0`)
      else console.log(`${major}.${minor}.${patch + 1}`)
    ' "$CURRENT" "$VERSION_ARG")"
    ;;
  *)
    VERSION="$VERSION_ARG"
    ;;
esac

node -e '
  const version = process.argv[1]
  if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version)) {
    console.error("Version must look like 1.2.3")
    process.exit(1)
  }
' "$VERSION"

node -e '
  const [next, current] = process.argv.slice(1).map((version) => version.split(".").map(Number))
  const cmp = next[0] - current[0] || next[1] - current[1] || next[2] - current[2]
  if (!(cmp > 0)) {
    console.error(`Version ${process.argv[1]} is not newer than package.json (${process.argv[2]})`)
    process.exit(1)
  }
' "$VERSION" "$CURRENT"

TAG="v${VERSION}"

if [[ "$DRY_RUN" -eq 0 ]]; then
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Not a git repository." >&2
    exit 1
  fi
  if ! git remote get-url origin >/dev/null 2>&1; then
    echo "No origin remote. Add the GitHub repository, commit this tree, then run yarn release again." >&2
    exit 1
  fi
  if ! gh auth status >/dev/null 2>&1; then
    echo "gh is not logged in. Run: gh auth login" >&2
    exit 1
  fi
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree is not clean. Commit or stash changes before releasing." >&2
    exit 1
  fi
  if ! remote_tag="$(git ls-remote --tags origin "refs/tags/${TAG}")"; then
    echo "Could not read tags from origin." >&2
    exit 1
  fi
  if [[ -n "$remote_tag" ]]; then
    echo "Tag ${TAG} already exists on origin." >&2
    exit 1
  fi
fi

COMMITTED=0
BACKUP="$(mktemp)"
cp package.json "$BACKUP"

restore_version() {
  if [[ "$COMMITTED" -eq 0 && -f "${BACKUP:-}" ]]; then
    cp "$BACKUP" package.json
    git restore --staged -- package.json 2>/dev/null || true
  fi
  rm -f "${BACKUP:-}"
}
trap restore_version EXIT

node --input-type=module -e '
  import { readFileSync, writeFileSync } from "node:fs"
  const file = "package.json"
  const pkg = JSON.parse(readFileSync(file, "utf8"))
  pkg.version = process.argv[1]
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
' "$VERSION"

echo "Version ${CURRENT} -> ${VERSION}"

yarn verify
yarn zip
yarn zip:firefox

CHROME_ZIP=".output/lunchdrop-plus-${VERSION}-chrome.zip"
FIREFOX_ZIP=".output/lunchdrop-plus-${VERSION}-firefox.zip"

if [[ ! -f "$CHROME_ZIP" || ! -f "$FIREFOX_ZIP" ]]; then
  echo "Expected zip files were not produced:" >&2
  echo "  ${CHROME_ZIP}" >&2
  echo "  ${FIREFOX_ZIP}" >&2
  exit 1
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry run. Chrome zip:"
  echo "  ${CHROME_ZIP}"
  echo "Firefox zip built and not published:"
  echo "  ${FIREFOX_ZIP}"
  exit 0
fi

if ! git add -- package.json || ! git commit -m "$(cat <<EOF
Release Lunchdrop+ ${VERSION}.

EOF
)"; then
  echo "Commit failed. package.json will be restored." >&2
  exit 1
fi
COMMITTED=1

if ! git push -u origin HEAD; then
  echo "The version commit is only local. Push it, then create the release:" >&2
  echo "  git push -u origin HEAD" >&2
  echo "  gh release create ${TAG} --target $(git branch --show-current) --title \"Lunchdrop+ ${VERSION}\" ${CHROME_ZIP}" >&2
  exit 1
fi

NOTES="$(cat <<EOF
Chrome package for manual install. It does not auto-update. Chrome and Arc update from the Chrome Web Store, including an unlisted listing.

The signed Firefox package is attached as lunchdrop-plus-${VERSION}-firefox.xpi when addons.mozilla.org finishes signing. That file installs on desktop Firefox and Firefox for Android.
EOF
)"

if ! gh release create "$TAG" \
  --target "$(git branch --show-current)" \
  --title "Lunchdrop+ ${VERSION}" \
  --notes "$NOTES" \
  "$CHROME_ZIP"; then
  echo "The version commit is on origin. Create the release with:" >&2
  echo "  gh release create ${TAG} --target $(git branch --show-current) --title \"Lunchdrop+ ${VERSION}\" ${CHROME_ZIP}" >&2
  exit 1
fi

echo "Published ${TAG}"
echo "Firefox submission to addons.mozilla.org runs from the Publish Firefox add-on workflow."
