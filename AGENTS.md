# AGENTS.md

Context for AI agents working in this repository. Read this before making changes.

## Keep this file up to date

If your work changes architecture, directory layout, or the decisions in [docs/plan.md](docs/plan.md), update this file and the plan in the same session.

## What this project is

**Lunchdrop+** is a browser extension for [Lunchdrop](https://www.lunchdrop.com/). The repo is **lunchdrop-plus**.

Lunchdrop stays the ordering surface. We do not build our own cart, checkout, or payment flow.

The extension saves a support-fee preference and, after Lunchdrop places an order, posts that fee when it differs from Lunchdrop's default. The preference is Lunchdrop's default, a percentage of the meal, the subsidy still left today, or none ($0). The popup is where that preference is saved. On an open order, the support row is labeled "Support:". When the amount is not Lunchdrop's own fee, that price is bold and italic. Clicking the price opens a modal with Custom, Percentage, Remaining subsidy, and None. Custom is a dollar amount for this order. It starts at Lunchdrop's fee from the latest place, item update, or item removal response, and otherwise at the amount on the receipt. Editing or removing an item replaces that saved fee and applies the preference again. Percentage, Remaining subsidy, and None update the order as soon as they are picked. Remember for future orders appears for those three and starts unchecked unless that choice is already the saved preference. Custom is not remembered. A spinner grows in on the row under that price while the request runs, then a checkmark fades out. The option text keeps its width. The popup is headed Lunchdrop+ in bold accent green, with the extension version in grey parentheses beside it, and groups settings into Support and UI tabs. A subdued GitHub mark at the right of that heading opens the public repository. Support is the fee preference. UI chooses hide all, show all, or a custom mix of reminders, ratings, referrals, and invites. Order updates stay visible. The order summary links to add more items, enter a promo code or gift card, and remove the subsidy, plus the info icons beside each breakdown row, start hidden, with the same hide-all, show-all, or custom choice. Cancel stays visible. Long words in item descriptions wrap onto the next line, on by default, and the UI tab can turn that off. Restaurant cards grow so a full row lines up with the page. A short last row stays the same card size and stays on the left. That layout is on by default, and the UI tab can turn it off. The on-page support sheet stays on the visible viewport while the page scrolls and while the browser chrome collapses. A narrow viewport keeps the sheet on the bottom edge. A wider viewport centers it.

Menu alerts live in a separate project. This extension works with no account on that service.

## Layout

| Path           | Purpose                                                                                                                                                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/plan.md` | Product decisions and build order. Read this before implementing.                                                                                                                                                                                                                                                                                      |
| `design/`      | Icon source: the SVG, a 512px PNG master, and a lossless WebP used by the README. Not shipped in the extension.                                                                                                                                                                                                                                        |
| `entrypoints/` | WXT entrypoints. `order-hook.content.ts` runs in the page world and wraps `fetch` and XHR for place, item update, and item removal. `lunchdrop.content` labels the support row, opens a shadow-root modal from the price, wraps long item descriptions, evens the restaurant card grid, and hides chosen order-summary links and breakdown info icons. |
| `components/`  | React UI shared by the popup and the on-page modal.                                                                                                                                                                                                                                                                                                    |
| `lib/`         | Support policy, storage, page-prompt rules, order-summary link rules, description wrapping, restaurant-card layout, and visual-viewport framing.                                                                                                                                                                                                       |

## Conventions

- Yarn, not npm.
- The extension must work with no account on the notification service.
- `yarn verify` runs ESLint, Prettier, and `tsc --noEmit`. It must pass. The script is `verify` because Yarn 1 treats `yarn check` as its own command.
- ESLint is typescript-eslint `strictTypeChecked` and `stylisticTypeChecked`, plus the React and React Hooks recommended configs (including the compiler rules). Extra bans: `any` is already an error, non-null assertions, `ts-ignore`, `ts-nocheck`, and `console.log`. `console.warn` and `console.error` are allowed. Exported functions need return types.
- TypeScript, on top of the WXT baseline (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`): `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noUncheckedSideEffectImports`, `erasableSyntaxOnly`.
- Prettier: no semicolons, single quotes, trailing commas where ES5 allows, 100-column lines.
- `yarn install` installs a pre-commit hook (lint-staged) and a pre-push hook (`yarn verify`). ESLint stays on v9 until `eslint-plugin-react` supports v10.
- `yarn release 0.1.0` (or `patch`, `minor`, `major`) verifies, zips Chrome and Firefox, commits the version bump, and publishes both zips to GitHub release `v0.1.0`. Those zips do not auto-update. Chrome and Arc update from the Chrome Web Store, including an unlisted listing. Publishing the release runs `.github/workflows/firefox-amo.yml`, which submits the Firefox build to addons.mozilla.org on the unlisted channel and attaches the signed package. That workflow needs repository secrets `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` from the [add-on API key page](https://addons.mozilla.org/developers/addon/api/key/).
