# Gifts & Roses

Website for Gifts & Roses, a floral and gift boutique in Jeddah. Arabic by default with an English toggle; customers order through WhatsApp.

## Shop settings

Edit `assets/js/config.js`:

- `whatsapp`: the shop's WhatsApp number, digits only, starting with 966. Currently 056 705 6986.
- `instagram`: username without the @ (currently `thamers_interlude_`), or leave empty to hide the button.
- `mapsQuery`: what the "Open in Google Maps" button searches for.
- `designer`: "Design your gift" pricing, used for every price on the site:
  - `pricePerFlower`: 5 SAR per flower (roses in four colours, sunflowers, lilies).
  - `arrangingFee`: 10 SAR for every 5 flowers or part of 5 (1–5 flowers = 10, 6–10 = 20, …).
  - `balloonPrice`: 3 SAR each; `giftBoxPrice`: 25 SAR; `brandedPackagingPrice`: 0 (free).
  - `extras`: teddy bear, chocolates, scented candle. `null` shows "price on WhatsApp"; set a number to show the price.
- `products`: what each product card loads into the designer (flowers, wrapping, balloons, gift box, extras, packaging). Card prices are worked out from these.

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
- `assets/js/i18n.js`: English strings and WhatsApp message wording
- `assets/js/designer.js`: "Design your gift" controls, pricing and the live drawing
- `assets/js/main.js`: language switching, product cards and the order form
- `assets/img/`: images cut from the logo and product photos

It's a static site with no build step, so it can be hosted on GitHub Pages, Netlify or any web host.
