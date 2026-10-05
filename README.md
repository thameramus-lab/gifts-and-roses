# Gifts & Roses

Website for Gifts & Roses, a floral and gift boutique in Jeddah. Arabic by default with an English toggle; customers order and pay on the website.

## Shop settings

Edit `assets/js/config.js`:

- `whatsapp`: the shop's WhatsApp number, digits only, starting with 966. Currently 056 705 6986.
- `instagram`: username without the @ (currently `thamers_interlude_`), or leave empty to hide the button.
- `mapsQuery`: what the "Open in Google Maps" button searches for.
- `hours`: opening hours, shown with an "Open now / Closed now" label (Jeddah time). Empty = hidden. **Currently sample hours: replace before launch.**
- `payments`: ways to pay (`"cash"`, `"mada"`, `"applepay"`, `"stcpay"`, `"transfer"`). Empty = hidden. **Currently sample methods: replace before launch.**
- `designer`: "Design your gift" pricing, used for every price on the site:
  - `pricePerFlower`: 5 SAR per flower (roses in four colours, sunflowers, lilies).
  - `arrangingFee`: 15 SAR for every 5 flowers or part of 5 (1–5 flowers = 15, 6–10 = 30, …).
  - `balloonPrice`: 3 SAR each; `giftBoxPrice`: 25 SAR; `brandedPackagingPrice`: 0 (free).
  - `extras`: teddy bear, chocolates, scented candle. `null` shows "Price coming soon" and the item can't be ordered online; set a number to show the price.
- `products`: what each product card loads into the designer (flowers, wrapping, balloons, gift box, extras, packaging), and which "Shop by occasion" filters show it (`occasions`: `"birthday"`, `"love"`, `"congrats"`, `"getwell"`). Card prices are worked out from these.

## Ordering and payment

Customers design a gift, fill in their details and pay on the website through [Moyasar](https://moyasar.com) (mada, credit card, Apple Pay, STC Pay). WhatsApp is only for questions.

- **Pay online:** the full total is charged.
- **Cash on delivery:** `cashFee` is added to the order, `cashDepositPercent` of the total is paid online as a deposit, and the rest is paid in cash. `cashFee` is currently a **placeholder (15 SAR)**.
- Items without a price (`extras` set to `null`) can't be ordered online; the form says so.

Settings are under `ordering` in `assets/js/config.js`:

- `moyasarKey`: the shop's publishable key from the Moyasar dashboard. Empty = ordering is off and the form says it's being set up. Use `pk_test_...` to try it with Moyasar's test cards, then `pk_live_...` once the account is activated (needs the shop's commercial registration).
- `methods`: `"creditcard"`, `"applepay"`, `"stcpay"`. Apple Pay and STC Pay also need enabling in the Moyasar dashboard; Apple Pay needs the website's domain verified there.
- **Apple Pay** shows only in Safari on iPhone, iPad or Mac, on an https address, once the domain is verified: download the domain association file from the Moyasar dashboard and add it to this repo as `.well-known/apple-developer-merchantid-domain-association` (no file extension). The empty `.nojekyll` file at the root makes GitHub Pages serve the `.well-known` folder; don't delete it.
- `orderEndpoint` (optional): a Google Sheet + email inbox for orders. Set it up with `google-apps-script/orders.gs` (steps at the top of that file).

Every payment carries the full order (items, date, phone, card message, order number) as metadata, so the shop sees it in the Moyasar dashboard. Before preparing an order, check its payment there and that the amount matches the order total.

The payment form library is in `assets/vendor/moyasar/` (MIT licence, from the `moyasar-payment-form` npm package, version 2.3.0).

## Editing text

- Arabic text is in `index.html` (the shop's Arabic name is هدايا وورود).
- English text is in `assets/js/i18n.js`, under the same keys as the `data-i18n` attributes in the HTML.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 (add `?lang=en` for English).

## Structure

- `index.html`: the page
- `assets/css/styles.css`: styles (colour and type tokens at the top)
- `assets/js/config.js`: shop details
- `assets/js/i18n.js`: English text and the wording the scripts use
- `assets/js/designer.js`: "Design your gift" controls, pricing and the photo board
- `assets/js/main.js`: language switching, product cards, the order form and payment
- `google-apps-script/orders.gs`: optional Google Sheet + email order inbox
- `assets/vendor/moyasar/`: Moyasar payment form library
- `assets/img/`: images cut from the logo and product photos

It's a static site with no build step, so it can be hosted on GitHub Pages, Netlify or any web host.
