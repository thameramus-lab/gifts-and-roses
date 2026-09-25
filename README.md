# Gifts & Roses

Website for Gifts & Roses, a floral and gift boutique in Jeddah. Arabic by default with an English toggle; customers order through WhatsApp.

## Shop settings

Edit `assets/js/config.js`:

- `whatsapp`: the shop's WhatsApp number, digits only, starting with 966. Currently 056 600 0069.
- `instagram`: username without the @ (currently `thamers_interlude_`), or leave empty to hide the button.
- `mapsQuery`: what the "Open in Google Maps" button searches for.
- `prices`: price in SAR for the Surprise Bouquet and Elegant Gift Set, or `null` to hide it.
- `bouquet`: "Build your bouquet" pricing. Each flower is `pricePerFlower` (5 SAR), plus `arrangingFee`, which is 5 SAR per flower, so 2 flowers cost 10 + 10 = 20 SAR. Change that one line to use a different rule.

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
- `assets/js/main.js`: language switching, prices and the order form
- `assets/img/`: images cut from the logo and product photos

It's a static site with no build step, so it can be hosted on GitHub Pages, Netlify or any web host.
