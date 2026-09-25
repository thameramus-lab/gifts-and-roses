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
    const url = new URL(location.href);
    if (lang === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    history.replaceState(null, "", url);
  }

  function renderPrices() {
    const fmt = new Intl.NumberFormat(msg().locale, {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    });
    document.querySelectorAll("[data-product]").forEach((card) => {
      const el = card.querySelector("[data-price]");
      const price = cfg.prices[card.dataset.product];
      if (!el) return;
      el.hidden = price == null;
      if (price != null) el.textContent = fmt.format(price);
    });
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

  function openOrder(product) {
    form.reset();
    clearErrors();
    setDialogProduct(product);
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

  function validate() {
    const errors = [];
    const m = msg();
    if (!dateInput.value) errors.push([dateInput, m.errDate]);
    else if (dateInput.value < dateInput.min) errors.push([dateInput, m.errDatePast]);

    const district = form.elements.district;
    if (form.elements.fulfil.value === "delivery" && !district.value.trim()) {
      errors.push([district, m.errDistrict]);
    }
    const details = form.elements.details;
    if (currentProduct === "custom" && !details.value.trim()) {
      errors.push([details, m.errDetails]);
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
    if (delivery) lines.push(`• ${m.district}: ${f.district.value.trim()}`);
    if (currentProduct === "custom") lines.push(`• ${m.details}: ${f.details.value.trim()}`);
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
    dialog.close();
    // "noopener" as a window feature makes window.open return null, so detach manually.
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    else location.href = url;
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
