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
  mapsQuery: "Aabir Al Qarath St, Obhur Al Shamaliyah, Jeddah 23817",

  // Prices in Saudi riyals, e.g. 250. Leave as null to hide the price on the card.
  prices: {
    "surprise-bouquet": null,
    "elegant-gift-set": null,
  },

  // "Build your bouquet" pricing, in Saudi riyals.
  bouquet: {
    pricePerFlower: 5,
    // Arranging fee for a bouquet of `flowers` flowers. It grows with the bouquet:
    // 2 flowers = 10 for the flowers + 10 arranging = 20.
    arrangingFee: (flowers) => flowers * 5,
    defaultFlowers: 10,
    minFlowers: 1,
    maxFlowers: 200,
  },
};
