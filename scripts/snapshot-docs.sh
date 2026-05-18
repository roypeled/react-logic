#!/usr/bin/env bash
# Snapshot the current docs as a new Docusaurus version.
#
# Reads the latest git tag (`v<X.Y.Z>`), regenerates the typedoc API into
# `libs/docs-generator/docs/api/`, snapshots `docs/` into
# `versioned_docs/version-<X.Y.Z>/`, bumps `lastVersion` in
# `docusaurus.config.ts`, and stages + commits only the versioning files.
#
# Usage: scripts/snapshot-docs.sh [version]
#   (omit `version` to derive from the latest `v*` git tag)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DIR="${REPO_ROOT}/libs/docs-generator"

# 1. Determine version
if [ "${1:-}" ]; then
  VERSION="${1#v}"
else
  LATEST_TAG="$(git -C "$REPO_ROOT" describe --tags --match 'v*' --abbrev=0 2>/dev/null || true)"
  if [ -z "$LATEST_TAG" ]; then
    echo "error: no v* tags found; pass a version explicitly: $0 0.2.0" >&2
    exit 1
  fi
  VERSION="${LATEST_TAG#v}"
fi

echo "→ snapshotting docs as version $VERSION"

# 2. Refuse to overwrite an existing snapshot
if [ -d "${DOCS_DIR}/versioned_docs/version-${VERSION}" ]; then
  echo "error: versioned_docs/version-${VERSION} already exists" >&2
  exit 1
fi

# 3. Build (regenerates docs/api/ via the typedoc plugin)
echo "→ building docs (regenerates api/)"
npx nx build docs-generator

# 4. Snapshot
echo "→ cutting Docusaurus version"
cd "$DOCS_DIR"
npx docusaurus docs:version "$VERSION"
cd "$REPO_ROOT"

# 5. Bump lastVersion in docusaurus.config.ts
CONFIG="${DOCS_DIR}/docusaurus.config.ts"
if grep -qE "lastVersion: *'[^']+'" "$CONFIG"; then
  sed -i.bak -E "s/lastVersion: *'[^']+'/lastVersion: '${VERSION}'/" "$CONFIG"
else
  echo "warn: no existing lastVersion line; not editing $CONFIG" >&2
fi
rm -f "${CONFIG}.bak"

# 6. Stage + commit only the versioning-related files
git -C "$REPO_ROOT" add \
  "libs/docs-generator/versioned_docs" \
  "libs/docs-generator/versioned_sidebars" \
  "libs/docs-generator/versions.json" \
  "libs/docs-generator/docusaurus.config.ts"

git -C "$REPO_ROOT" commit -m "docs: snapshot version ${VERSION}"

echo "✔ snapshot committed for version $VERSION"
