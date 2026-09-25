/*
 * Shop details — edit these values; the rest of the site reads from here.
 */
window.SITE_CONFIG = {
  // WhatsApp number in international format, digits only:
  // 966 followed by the mobile number without its leading 0 (05X XXX XXXX -> 9665XXXXXXXX).
  whatsapp: "966567056986",

  // Instagram username without the @. Leave empty to hide the Instagram button.
  instagram: "thamers_interlude_",

  // What the "Open in Google Maps" button searches for.
  mapsQuery: "Aabir Al Qarath St, Obhur Al-Shamaliyah, Jeddah 23817",

  // "Design your gift" pricing and choices. All prices in Saudi riyals.
  designer: {
    pricePerFlower: 5,
    // Arranging fee: 15 for every 5 flowers or part of 5
    // (1–5 flowers = 15, 6–10 = 30, 11–15 = 45, and so on).
    arrangingFee: (flowers) => Math.ceil(flowers / 5) * 15,
    maxPerFlower: 100,

    balloonPrice: 3,
    maxBalloons: 12,

    giftBoxPrice: 25,
    // Gifts & Roses branded ribbon and tag. 0 = free.
    brandedPackagingPrice: 0,

    // Extras: set a price, or null to show "price confirmed on WhatsApp".
    extras: {
      teddy: null,
      chocolates: null,
      candle: null,
    },

    // What the designer starts with.
    start: {
      flowers: {},
      wrap: "kraft",
      balloons: [],
      giftBox: false,
      extras: [],
      branded: true,
    },
  },

  // Products on the page. "Customise" loads each one into the designer,
  // so its price is worked out from the same pricing as above.
  products: {
    "birthday-box": {
      flowers: { "rose-red": 10, lily: 3 },
      wrap: "black",
      balloons: ["black", "black", "gold", "gold", "pearl", "pearl"],
      giftBox: true,
      extras: ["teddy"],
      branded: true,
    },
    "someone-special-box": {
      flowers: { "rose-red": 12 },
      wrap: "black",
      balloons: [],
      giftBox: true,
      extras: ["chocolates", "candle", "teddy"],
      branded: true,
    },
    "sunflower-bouquet": {
      flowers: { sunflower: 7 },
      wrap: "kraft",
      balloons: [],
      giftBox: false,
      extras: [],
      branded: true,
    },
    "surprise-bouquet": {
      flowers: { "rose-pink": 6, "rose-white": 5 },
      wrap: "blush",
      balloons: [],
      giftBox: true,
      extras: [],
      branded: false,
    },
    "elegant-gift-set": {
      flowers: { "rose-red": 12 },
      wrap: "white",
      balloons: [],
      giftBox: true,
      extras: [],
      branded: false,
    },
  },
};
