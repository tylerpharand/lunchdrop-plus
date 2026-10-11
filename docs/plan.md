# Plan

## Names

|           |                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------ |
| Repo      | `lunchdrop-plus`                                                                                 |
| Extension | Lunchdrop+                                                                                       |
| Site      | [lunchdrop.com](https://www.lunchdrop.com/), including city hosts such as `dallas.lunchdrop.com` |

## What this is

A Chrome and Firefox extension. Injected behavior on Lunchdrop, plus a popup for settings. Orders, cart, and payment stay on Lunchdrop.

Availability alerts are a separate project. Nothing in this repo signs in on the user's behalf.

## Decisions

- Orders, cart, and payment stay on Lunchdrop. The user still places the order there.
- The extension works with no account on a notification service.
- Match `*://*.lunchdrop.com/*`. Sign-in starts at `/signin` with phone or email. City subdomains are real hosts, not just marketing pages.
- Package manager is Yarn.
- `yarn verify` is strict type-checked ESLint, Prettier, and `tsc`. Details are in `AGENTS.md`.
- The UI is React and Tailwind. [WXT](https://wxt.dev/) is the build: Vite under the hood, Manifest V3, Chrome and Firefox from one project. The page modal renders in a shadow root so Lunchdrop's CSS and ours stay apart. Revisit WXT only if it blocks a target we care about (Firefox for Android is the one to check first).
- `yarn release` publishes a GitHub release. `.github/workflows/firefox-amo.yml` then submits the Firefox build to addons.mozilla.org on the unlisted channel, with the source archive and the build notes in `scripts/amo-approval-notes.md`. Credentials are the `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` repository secrets.

## Extension

**Support fee.** The order row is labeled "Support:". Clicking the price opens a modal titled "Support" instead of Lunchdrop's editor. The same preference is in the toolbar popup.

**Settings.** The toolbar popup is headed "Lunchdrop+" and groups settings into Support and UI tabs. A subdued GitHub mark at the right of that heading opens the public repository. Support is the fee preference. UI is a combobox to hide all, show all, or customize which of the reminder, rating, referral, and invite banners are hidden. Order updates stay visible. Nothing is hidden unless the user says so.

**Browsers.** Chrome and Firefox on desktop. Firefox for Android can run extensions; Chrome on Android generally cannot.

## Support fee

The saved preference is Lunchdrop’s default, a percentage of the item subtotal, the subsidy still left today, or none (`$0`). The popup saves that preference. An open order’s modal offers Custom, Percentage, Remaining subsidy, and None. Custom is a dollar amount for this order, starting at Lunchdrop’s fee from the place-order response when that fee was saved, and otherwise at the amount already on the receipt. It applies when the field is left or Done is pressed, and it is not remembered. Percentage, Remaining subsidy, and None update the receipt immediately. Remember for future orders is shown for those three and starts unchecked unless that choice is already saved. Remaining subsidy is `$0` once the day is maxed. Percentage does not look at the subsidy. The popup and the on-page modal share `browser.storage.local`. A spinner grows in beside that price while the request runs, then a checkmark fades out.

Placing an order stays `POST /api/deliveries/{deliveryId}/order`. Editing an item is `POST /api/deliveries/{deliveryId}/order/update`, and removing one is `POST /api/deliveries/{deliveryId}/order/remove`. A page-world hook then calls `POST /api/deliveries/{deliveryId}/order/support-fee` when the preference disagrees with the returned `supportFee` and the fee is editable. A meal change replaces the saved Lunchdrop fee with the fee on that response before the preference is applied. If remaining subsidy is selected and the day’s cap cannot be read, the returned fee is left alone. If the support-fee call fails, the original order response is what the page keeps.

## Build order

1. Support-fee preference in the popup and on the order page. Shipped.
2. Hide reminder, rating, referral, and invite banners. Shipped.
3. Leave availability alerts out of this repository.
