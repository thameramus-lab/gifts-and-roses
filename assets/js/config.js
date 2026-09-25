/*
 * Shop details — edit these values; the rest of the site reads from here.
 */
window.SITE_CONFIG = {
  // WhatsApp number in international format, digits only:
  // 966 followed by the mobile number without its leading 0 (05X XXX XXXX -> 9665XXXXXXXX).
  whatsapp: "966566000069",

  // Instagram username without the @. Leave empty to hide the Instagram button.
  instagram: "thamers_interlude_",

  // What the "Open in Google Maps" button searches for.
  mapsQuery: "Aabir Al Qarath St, Obhur Al-Shamaliyah, Jeddah 23817",

  // Pricing, in Saudi riyals. Used by "Build your bouquet" and by every order form.
  bouquet: {
    pricePerFlower: 5,
    // Arranging fee: 10 for every 5 flowers or part of 5
    // (1–5 flowers = 10, 6–10 = 20, 11–15 = 30, and so on).
    arrangingFee: (flowers) => Math.ceil(flowers / 5) * 10,
    // Gift price, on top of the flowers and arranging fee.
    // The Surprise Bouquet and Elegant Gift Set always include a gift.
    giftPrice: 25,
    defaultFlowers: 10,
    minFlowers: 1,
    maxFlowers: 200,
  },
};
