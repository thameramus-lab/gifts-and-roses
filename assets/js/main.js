(() => {
  const cfg = window.SITE_CONFIG;
  const { en, messages } = window.I18N;
  const root = document.documentElement;
  const LANG_KEY = "gr-lang";

  const PRODUCT_KEYS = {
    "surprise-bouquet": "p1.name",
    "elegant-gift-set": "p2.name",
    custom: "p3.name",
  };

  // Arabic strings come straight from the markup, so they are written only once.
  const ar = {};
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    ar[el.dataset.i18n] ??= el.textContent.trim();
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    for (const [attr, key] of attrPairs(el)) ar[key] ??= el.getAttribute(attr);
  });
  const dicts = { ar, en };

  function attrPairs(el) {
    return el.dataset.i18nAttr.split(";").map((pair) => pair.split(":"));
  }

  let lang = "ar";
  const t = (key) => dicts[lang][key] ?? ar[key] ?? "";
  const msg = () => messages[lang];

  function waUrl(text) {
    return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  function applyLang(next) {
    lang = next === "en" ? "en" : "ar";
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      for (const [attr, key] of attrPairs(el)) el.setAttribute(attr, t(key));
    });

    const toggle = document.querySelector("[data-lang-toggle]");
    toggle.textContent = msg().switchTo;
    toggle.setAttribute("aria-label", msg().switchLabel);
    toggle.lang = lang === "ar" ? "en" : "ar";

    document.querySelectorAll("[data-wa-link]").forEach((a) => {
      a.href = waUrl(msg().general);
    });

    renderPrices();
    updateCardCount();
    if (dialog.open) setDialogProduct(currentProduct);

    try { localStorage.setItem(LANG_KEY, lang); } catch {}
    try {
      const url = new URL(location.href);
      if (lang === "en") url.searchParams.set("lang", "en");
      else url.searchParams.delete("lang");
      history.replaceState(null, "", url);
    } catch {}
  }

  const money = (sar) =>
    new Intl.NumberFormat(msg().locale, { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(sar);
  const number = (n) => new Intl.NumberFormat(msg().locale).format(n);

  // ---- Pricing ----
  const bq = cfg.bouquet;

  function bouquetPrice(count, withGift) {
    const flowers = count * bq.pricePerFlower;
    const fee = bq.arrangingFee(count);
    const gift = withGift ? bq.giftPrice : 0;
    return { flowers, fee, gift, total: flowers + fee + gift };
  }

  // A flower counter with gift option and price breakdown. The page and the
  // order form each have one, built from the same [data-calc] markup.
  function createCalc(el) {
    const input = el.querySelector("[data-calc-count]");
    const giftBox = el.querySelector("[data-calc-gift]");
    const state = { count: bq.defaultFlowers, gift: false, giftLocked: false };

    input.min = bq.minFlowers;
    input.max = bq.maxFlowers;

    function render() {
      const price = bouquetPrice(state.count, state.gift);
      input.value = state.count;
      giftBox.checked = state.gift;
      giftBox.disabled = state.giftLocked;
      for (const [key, value] of Object.entries(price)) {
        el.querySelector(`[data-calc-cost="${key}"]`).textContent = money(value);
      }
      el.querySelector("[data-gift-row]").hidden = !state.gift;
      el.querySelector("[data-gift-label]").textContent = state.giftLocked ? msg().giftIncluded : msg().addGift;
      el.querySelector("[data-gift-price]").textContent = money(bq.giftPrice);
      el.querySelector('[data-calc-step="-1"]').disabled = state.count <= bq.minFlowers;
      el.querySelector('[data-calc-step="1"]').disabled = state.count >= bq.maxFlowers;
    }

    function setCount(n) {
      state.count = Math.min(bq.maxFlowers, Math.max(bq.minFlowers, Math.round(n) || bq.minFlowers));
      render();
    }

    el.querySelectorAll("[data-calc-step]").forEach((btn) => {
      btn.addEventListener("click", () => setCount(state.count + Number(btn.dataset.calcStep)));
    });
    input.addEventListener("change", () => setCount(Number(input.value)));
    giftBox.addEventListener("change", () => {
      state.gift = giftBox.checked;
      render();
    });

    return {
      state,
      render,
      set(count, gift, giftLocked) {
        Object.assign(state, { gift, giftLocked });
        setCount(count);
      },
      price: () => bouquetPrice(state.count, state.gift),
    };
  }

  const [pageCalc, orderCalc] = [...document.querySelectorAll("[data-calc]")].map(createCalc);

  function renderPrices() {
    const note = msg().priceNote(money(bq.giftPrice), money(bq.pricePerFlower));
    document.querySelectorAll("[data-price-note]").forEach((el) => { el.textContent = note; });
    pageCalc.render();
    orderCalc.render();
  }

  // ---- Links that don't depend on language ----
  document.querySelectorAll("[data-wa-link]").forEach((a) => {
    a.target = "_blank";
    a.rel = "noopener";
  });
  if (cfg.instagram) {
    const ig = document.querySelector("[data-instagram-link]");
    ig.href = `https://instagram.com/${cfg.instagram}`;
    ig.target = "_blank";
    ig.rel = "noopener";
    ig.hidden = false;
  }
  document.querySelector("[data-maps-link]").href =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cfg.mapsQuery)}`;
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // ---- Order dialog ----
  const dialog = document.getElementById("order-dialog");
  const form = document.getElementById("order-form");
  const summary = document.getElementById("error-summary");
  const dateInput = form.elements.date;
  const cardInput = form.elements.card;
  const cardCount = document.getElementById("f-card-count");
  const ready = document.getElementById("order-ready");
  const readyLink = ready.querySelector("[data-ready-link]");
  let currentProduct = null;

  function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function setDialogProduct(product) {
    currentProduct = product;
    dialog.querySelector("[data-order-product]").textContent = t(PRODUCT_KEYS[product]);
  }

  function updateConditionalFields() {
    const delivery = form.elements.fulfil.value === "delivery";
    form.querySelector('[data-when="delivery"]').hidden = !delivery;
    form.querySelector('[data-when="custom"]').hidden = currentProduct !== "custom";
  }

  function updateCardCount() {
    cardCount.textContent = msg().charsLeft(cardInput.maxLength - cardInput.value.length);
  }

  function clearErrors() {
    summary.hidden = true;
    summary.querySelector("ul").replaceChildren();
    form.querySelectorAll(".field-error").forEach((p) => { p.hidden = true; p.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  }

  function showForm() {
    ready.hidden = true;
    form.hidden = false;
  }

  function openOrder(product) {
    showForm();
    form.reset();
    clearErrors();
    setDialogProduct(product);
    // "Build your bouquet" carries over what was chosen on the page;
    // the photographed sets always come with their gift.
    if (product === "custom") orderCalc.set(pageCalc.state.count, pageCalc.state.gift, false);
    else orderCalc.set(bq.defaultFlowers, true, true);
    dateInput.min = todayISO();
    updateConditionalFields();
    updateCardCount();
    dialog.showModal();
  }

  document.querySelectorAll("[data-order]").forEach((btn) => {
    btn.addEventListener("click", () => openOrder(btn.dataset.order));
  });
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  form.addEventListener("change", (e) => {
    if (e.target.name === "fulfil") updateConditionalFields();
  });
  cardInput.addEventListener("input", updateCardCount);
  readyLink.addEventListener("click", () => setTimeout(() => dialog.close(), 0));
  ready.querySelector("[data-ready-back]").addEventListener("click", () => {
    showForm();
    form.querySelector("button[type=submit]").focus();
  });

  function validate() {
    const errors = [];
    const m = msg();
    if (!dateInput.value) errors.push([dateInput, m.errDate]);
    else if (dateInput.value < dateInput.min) errors.push([dateInput, m.errDatePast]);

    const district = form.elements.district;
    if (form.elements.fulfil.value === "delivery" && !district.value.trim()) {
      errors.push([district, m.errDistrict]);
    }
    return errors;
  }

  function showErrors(errors) {
    const list = summary.querySelector("ul");
    for (const [input, text] of errors) {
      input.setAttribute("aria-invalid", "true");
      const p = document.getElementById(`${input.id}-error`);
      p.textContent = text;
      p.hidden = false;

      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${input.id}`;
      a.textContent = text;
      a.addEventListener("click", (e) => { e.preventDefault(); input.focus(); });
      li.append(a);
      list.append(li);
    }
    summary.hidden = false;
    summary.focus();
  }

  function buildMessage() {
    const m = msg();
    const f = form.elements;
    const delivery = f.fulfil.value === "delivery";
    const [y, mo, d] = f.date.value.split("-").map(Number);
    const date = new Date(y, mo - 1, d).toLocaleDateString(m.locale, {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const lines = [
      m.greeting,
      `• ${m.product}: ${t(PRODUCT_KEYS[currentProduct])}`,
      `• ${delivery ? m.delivery : m.pickup} — ${m.date}: ${date}`,
      `• ${m.time}: ${f.time.selectedOptions[0].textContent}`,
    ];
    const price = orderCalc.price();
    lines.push(`• ${m.flowerCount}: ${number(orderCalc.state.count)}`);
    lines.push(
      `• ${m.price}: ${money(price.total)} (${m.priceParts(money(price.flowers), money(price.fee), price.gift && money(price.gift))})`,
    );
    if (delivery) lines.push(`• ${m.district}: ${f.district.value.trim()}`);
    if (currentProduct === "custom" && f.details.value.trim()) {
      lines.push(`• ${m.details}: ${f.details.value.trim()}`);
    }
    if (f.card.value.trim()) lines.push(`• ${m.card}: ${f.card.value.trim()}`);
    if (f.name.value.trim()) lines.push(`• ${m.name}: ${f.name.value.trim()}`);
    return lines.join("\n");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();
    const errors = validate();
    if (errors.length) {
      showErrors(errors);
      return;
    }
    const url = waUrl(buildMessage());
    // "noopener" as a window feature makes window.open return null, so detach manually.
    const win = window.open(url, "_blank");
    if (win) {
      win.opener = null;
      dialog.close();
      return;
    }
    // Pop-up blocked: offer a plain link to WhatsApp instead.
    readyLink.href = url;
    form.hidden = true;
    ready.hidden = false;
    document.getElementById("order-ready-title").focus();
  });

  // ---- Language ----
  document.querySelector("[data-lang-toggle]").addEventListener("click", () => {
    applyLang(lang === "ar" ? "en" : "ar");
  });

  let initial = new URLSearchParams(location.search).get("lang");
  if (!initial) {
    try { initial = localStorage.getItem(LANG_KEY); } catch {}
  }
  applyLang(initial || "ar");
})();
