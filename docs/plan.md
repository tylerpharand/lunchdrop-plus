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
- `yarn release` publishes a GitHub release with the Chrome zip. The Firefox zip is a build check and is not published. `.github/workflows/firefox-amo.yml` then submits the Firefox build to addons.mozilla.org on the unlisted channel, with the source archive and the build notes in `scripts/amo-approval-notes.md`, and attaches the signed package as `lunchdrop-plus-<version>-firefox.xpi`. That file installs on desktop Firefox and Firefox for Android. Credentials are the `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` repository secrets.

## Extension

**Support fee.** The order row is labeled "Support:". When the amount is not Lunchdrop's own fee, that price is bold and italic, with an accent-green lightning bolt to its left. A support amount of $0.00 keeps that styling unless Custom is selected for that order. Clicking the price opens a modal titled "Support" instead of Lunchdrop's editor. The same preference is in the toolbar popup. That sheet stays on the visible viewport. Its width and height follow the visual viewport while the page scrolls and while the browser chrome collapses. A narrow viewport keeps it on the bottom edge. A wider viewport centers it.

**Settings.** The toolbar popup is headed "Lunchdrop+" in bold accent green, with the extension version in grey parentheses beside it, and groups settings into Support and UI tabs. A subdued GitHub mark at the right of that heading opens the public repository. Support is the fee preference. UI has a combobox to hide all, show all, or customize which of the reminder, rating, referral, and invite banners are hidden. Order updates stay visible. Those banners start hidden. A second combobox, Order summary, hides the links to add more items, enter a promo code or gift card, and remove the subsidy, plus the info icons beside each breakdown row. Those start hidden. The same hide-all, show-all, or custom choice can show any of them. Cancel stays visible. Long words in item descriptions wrap onto the next line. That wrap is on by default and can be turned off in the UI tab. Restaurant cards grow so a full row lines up with the page. A short last row stays the same card size and stays on the left. That layout is on by default and can be turned off in the UI tab. Enhanced restaurant tiles start on. The UI tab can turn them off. They hide the delivery time and the order deadline under each restaurant, tighten the gap between those tiles, and drop a tile's bottom padding when nothing is left under the logo. An order already placed turns that tile dark green (#006400). The logo shrinks to leave an accent-green chin with a white checkmark and Order Placed. The chin is painted on the tile itself so the dark green cannot show through a seam. When that tile is selected, its offset border is accent green (#009900) with 12px corners, the way other selected tiles keep their border off the tile. Enhanced tiles round every selected tile's border to 12px. The green New badge on a restaurant tile stays visible until the UI tab hides it. Improved menu bar starts on. The date picker stays at the top in place of the header. Days fade out at the left and right of the scroller, the menu button sits on the left fade, and the calendar button stays off. The selected day keeps white text, a 3px white border at 60% opacity, and a white fill from 25% at the top to 15% at the bottom. The day scroller only moves sideways. On a narrow screen, the bar scales to 90% so the text, padding, and height are a little smaller, and it still spans the width. A 1px bottom border in black at 12.5% opacity (#00000020) separates the bar from what sits under it. One-step sign in starts off. The UI tab can turn it on. The sign-in page then shows the email and password together, so a password manager can fill both. A blank password still continues to company sign-in.

**Browsers.** Chrome and Firefox on desktop. Firefox for Android can run extensions; Chrome on Android generally cannot.

## Support fee

The saved preference is Lunchdrop’s default, a percentage of the item subtotal, the subsidy still left today, or none (`$0`). The popup saves that preference. An open order’s modal offers Custom, Percentage, Remaining subsidy, and None. Custom is a dollar amount for this order, starting at Lunchdrop’s fee from the place-order response when that fee was saved, and otherwise at the amount already on the receipt. It applies when the field is left or Done is pressed, and it is not remembered. Percentage, Remaining subsidy, and None update the receipt immediately. Remember for future orders is shown for those three. It starts checked when that choice is already saved. Picking Percentage, Remaining subsidy, or None checks it and saves that choice, unless the user has unchecked it. The order keeps that choice when the dollar amount does not change, so Remaining subsidy at `$0` stays selected after None. Remaining subsidy is the cap left after this meal takes its share, so a meal that costs at least the cap leaves `$0` even when the discount line is a little under the cap. Percentage does not look at the subsidy. The popup and the on-page modal share `browser.storage.local`. A spinner grows in on the row under that price while the request runs, then a checkmark fades out. The option text keeps its width.

Placing an order stays `POST /api/deliveries/{deliveryId}/order`. Editing an item is `POST /api/deliveries/{deliveryId}/order/update`, and removing one is `POST /api/deliveries/{deliveryId}/order/remove`. A page-world hook then calls `POST /api/deliveries/{deliveryId}/order/support-fee` when the preference disagrees with the returned `supportFee` and the fee is editable. A meal change replaces the saved Lunchdrop fee with the fee on that response before the preference is applied. If remaining subsidy is selected and the day’s cap cannot be read, the returned fee is left alone. If the support-fee call fails, the original order response is what the page keeps.

## Build order

1. Support-fee preference in the popup and on the order page. Shipped.
2. Hide reminder, rating, referral, and invite banners. Default is hide all. Shipped.
3. Wrap long words in item descriptions. Shipped.
4. Hide the order summary links to add more items, enter a promo code or gift card, and remove the subsidy, plus the info icons beside each breakdown row. Default is hide all. Cancel stays visible.
5. Even out restaurant cards so a full row lines up with the page. On by default. A short last row keeps that card size and stays on the left.
6. Enhanced restaurant tiles. On by default. The delivery time and the order deadline under each restaurant stay hidden, the gap between those tiles tightens, and a tile with nothing left under the logo drops its bottom padding. An order already placed turns that tile dark green (#006400). The logo shrinks to leave an accent-green chin with a white checkmark and Order Placed. The chin is painted on the tile itself so the dark green cannot show through a seam. When that tile is selected, its offset border is accent green (#009900) with 12px corners, the way other selected tiles keep their border off the tile. Enhanced tiles round every selected tile's border to 12px.
7. Hide the green New badge on a restaurant tile. Off by default.
8. Improved menu bar. On by default. The date picker stays at the top in place of the header. Days fade out at the left and right of the scroller, the menu button sits on the left fade, and the calendar button stays off. The selected day keeps white text, a 3px white border at 60% opacity, and a white fill from 25% at the top to 15% at the bottom. The day scroller only moves sideways. On a narrow screen, the bar scales to 90% so the text, padding, and height are a little smaller, and it still spans the width. A 1px bottom border in black at 12.5% opacity (#00000020) separates the bar from what sits under it.
9. Leave availability alerts out of this repository.
10. One-step sign in. Off by default. The sign-in page shows the email and password together so a password manager can fill both. A blank password still continues to company sign-in.
