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

  // Opening hours, shown in the contact section with an "Open now" label.
  // days: 0 = Sunday, 1 = Monday … 5 = Friday, 6 = Saturday. Jeddah time, 24-hour clock.
  // A closing time earlier than the opening time means after midnight.
  // Leave the list empty to hide opening hours. Example:
  //   hours: [
  //     { days: [6, 0, 1, 2, 3, 4], open: "10:00", close: "23:00" },
  //     { days: [5], open: "16:00", close: "23:30" },
  //   ],
  hours: [],

  // Ways to pay, shown in the contact section. Any of:
  // "cash", "mada", "applepay", "stcpay", "transfer". Leave empty to hide.
  payments: [],

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
  // occasions: which "Shop by occasion" filters show the product. Any of:
  // "birthday", "love", "congrats", "getwell".
  products: {
    "birthday-box": {
      occasions: ["birthday"],
      flowers: { "rose-red": 10, lily: 3 },
      wrap: "black",
      balloons: ["black", "black", "gold", "gold", "pearl", "pearl"],
      giftBox: true,
      extras: ["teddy"],
      branded: true,
    },
    "someone-special-box": {
      occasions: ["love", "birthday"],
      flowers: { "rose-red": 12 },
      wrap: "black",
      balloons: [],
      giftBox: true,
      extras: ["chocolates", "candle", "teddy"],
      branded: true,
    },
    "sunflower-bouquet": {
      occasions: ["congrats", "getwell"],
      flowers: { sunflower: 7 },
      wrap: "kraft",
      balloons: [],
      giftBox: false,
      extras: [],
      branded: true,
    },
    "surprise-bouquet": {
      occasions: ["birthday", "love", "congrats"],
      flowers: { "rose-pink": 6, "rose-white": 5 },
      wrap: "blush",
      balloons: [],
      giftBox: true,
      extras: [],
      branded: false,
    },
    "elegant-gift-set": {
      occasions: ["love", "congrats"],
      flowers: { "rose-red": 12 },
      wrap: "white",
      balloons: [],
      giftBox: true,
      extras: [],
      branded: false,
    },
  },
};
