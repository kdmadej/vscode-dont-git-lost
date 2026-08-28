# Changelog

## [0.2.0] - 2026-08-28

### Changed
- **Don't Git Lost is now 100% free.** No license keys, no paid tiers, no feature gating, nothing to buy — now or later.
- Removed the license popup and the `Enter License Key`, `Buy License` and `Remove License Key` commands.
- Removed the shared `lucasprag.licenseKeys` setting.

### Added
- `Don't Git Lost: Leave a Review` command.
- A prompt asking for a marketplace review after 14 days of use. It is a non-modal notification, appears at most three times, and stops permanently once you rate or dismiss it.

## [0.1.6] - 2026-06-01

### Fixed
- Typed characters no longer briefly appear at the end of the blame annotation
- Blame annotation no longer flickers while typing (clears immediately on edit, re-appears 500ms after typing stops)

### Added
- Uncommitted lines now show `You, just now` (or `You, 2 minutes ago`, etc.) instead of no annotation

## [0.1.5] - 2026-05-28

### Fixed
- Use live Polar credentials in production and sandbox credentials in development (automatic switching based on extension mode)

## [0.1.4] - 2026-05-28

### Changed
- Test release to verify the publish workflow works end-to-end with the public vscode-license repo.

## [0.1.3] - 2026-05-28

### Fixed
- Publish workflow clones vscode-license without a token since the repo is public, removing the authentication failure.

## [0.1.2] - 2026-05-28

### Fixed
- Publish workflow now uses `git clone` instead of `actions/checkout` for the vscode-license dependency to avoid the path-outside-workspace restriction.

## [0.1.1] - 2026-05-28

### Fixed
- Publish workflow now builds the `@lucasprag/vscode-license` dependency after checkout so esbuild can resolve it.

## [0.1.0] - 2026-05-08

### Added
- File time-travel: ◀ ▶ ⌂ buttons in the editor toolbar to step through commit history of the active file.
- Inline current-line blame annotation, configurable via `dontgitlost.blame.format`.
- Hover card with author avatar, commit URL, and PR link for GitHub, GitLab, and Bitbucket repos.
- Self-hosted host support via `dontgitlost.host.selfHosted` setting.
