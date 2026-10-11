# AGENTS.md

Context for AI agents working in this repository. Read this before making changes.

## Keep this file up to date

If your work changes architecture, directory layout, or the decisions in [docs/plan.md](docs/plan.md), update this file and the plan in the same session.

## What this project is

**Lunchdrop+** is a browser extension for [Lunchdrop](https://www.lunchdrop.com/). The repo is **lunchdrop-plus**.

Lunchdrop stays the ordering surface. We do not build our own cart, checkout, or payment flow.

The extension saves a support-fee preference and, after Lunchdrop places an order, posts that fee when it differs from Lunchdrop's default. The preference is Lunchdrop's default, a percentage of the meal, the subsidy still left today, or skip. On the order, that row is labeled "Support:". Clicking the price opens the extension's modal. Choosing an option updates the open order. Remember for future orders is on by default, and turning it off keeps the change on this order only. A spinner grows in beside that price while the request runs, then a checkmark fades out. The popup is headed Lunchdrop+ and groups settings into Support, UI, and Misc tabs. A subdued GitHub mark at the right of that heading opens the public repository. Support is the fee preference. UI is a switch that hides Lunchdrop's extra prompts (reminders, ratings, referrals, invites) while leaving order updates visible.

Menu alerts live in a separate project. This extension works with no account on that service.

## Layout

| Path           | Purpose                                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/plan.md` | Product decisions and build order. Read this before implementing.                                                                                                           |
| `entrypoints/` | WXT entrypoints. `order-hook.content.ts` runs in the page world and wraps `fetch`. `lunchdrop.content` labels the support row and opens a shadow-root modal from the price. |
| `components/`  | React UI shared by the popup and the on-page modal.                                                                                                                         |
| `lib/`         | Support policy, storage, and page-prompt rules.                                                                                                                             |

## Conventions

- Yarn, not npm.
- The extension must work with no account on the notification service.
- `yarn verify` runs ESLint, Prettier, and `tsc --noEmit`. It must pass. The script is `verify` because Yarn 1 treats `yarn check` as its own command.
- ESLint is typescript-eslint `strictTypeChecked` and `stylisticTypeChecked`, plus the React and React Hooks recommended configs (including the compiler rules). Extra bans: `any` is already an error, non-null assertions, `ts-ignore`, `ts-nocheck`, and `console.log`. `console.warn` and `console.error` are allowed. Exported functions need return types.
- TypeScript, on top of the WXT baseline (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`): `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noUncheckedSideEffectImports`, `erasableSyntaxOnly`.
- Prettier: no semicolons, single quotes, trailing commas where ES5 allows, 100-column lines.
- `yarn install` installs a pre-commit hook (lint-staged) and a pre-push hook (`yarn verify`). ESLint stays on v9 until `eslint-plugin-react` supports v10.
- `yarn release 0.1.0` (or `patch`, `minor`, `major`) verifies, zips Chrome and Firefox, commits the version bump, and publishes both zips to GitHub release `v0.1.0`. Those zips do not auto-update. Chrome and Arc update from the Chrome Web Store, including an unlisted listing. Firefox updates from addons.mozilla.org.
