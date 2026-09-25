# Gifts & Roses

Website for Gifts & Roses, a floral and gift boutique in Jeddah. Arabic by default with an English toggle; customers order through WhatsApp.

## Before going live

Edit `assets/js/config.js`:

- `whatsapp`: the shop's WhatsApp number, digits only, starting with 966 (e.g. `966512345678`). The placeholder `966500000000` must be replaced.
- `instagram`: username without the @, or leave empty to hide the button.
- `prices`: price in SAR for each product, or `null` to hide it.

## Editing text

- Arabic text is in `index.html`.
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
