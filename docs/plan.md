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

## Extension

**Support fee.** The order row is labeled "Support:". Clicking the price opens a modal titled "Support" instead of Lunchdrop's editor. The same preference is in the toolbar popup.

**Settings.** The toolbar popup is headed "Lunchdrop+" and groups settings into Support, UI, and Misc tabs. A subdued GitHub mark at the right of that heading opens the public repository. Support is the fee preference. UI is one switch that hides reminder, rating, referral, and invite banners. Order updates stay visible. That switch is off unless the user turns it on.

**Browsers.** Chrome and Firefox on desktop. Firefox for Android can run extensions; Chrome on Android generally cannot.

## Support fee

The saved preference is Lunchdrop’s default, a percentage of the item subtotal, the subsidy still left today, or skip (`$0`). Remaining subsidy is `$0` once the day is maxed. Percentage does not look at the subsidy. The popup and the on-page modal share `browser.storage.local`. Choosing an option in the modal also updates the open order. Remember for future orders is on by default; turning it off leaves the saved preference unchanged. A spinner grows in beside that price while the request runs, then a checkmark fades out.

Placing an order stays `POST /api/deliveries/{deliveryId}/order`. A page-world fetch hook then calls `POST /api/deliveries/{deliveryId}/order/support-fee` when the preference disagrees with the returned `supportFee` and the fee is editable. If remaining subsidy is selected and the day’s cap cannot be read, the placed fee is left alone. If the support-fee call fails, the original order response is what the page keeps.

## Build order

1. Support-fee preference in the popup and on the order page. Shipped.
2. Hide reminder, rating, referral, and invite banners. Shipped.
3. Leave availability alerts out of this repository.
