(() => {
  const cfg = window.SITE_CONFIG;
  const { en, messages } = window.I18N;
  const root = document.documentElement;
  const LANG_KEY = "gr-lang";

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
  const money = (sar) =>
    new Intl.NumberFormat(msg().locale, { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(sar);
  const number = (n) => new Intl.NumberFormat(msg().locale).format(n);

  function waUrl(text) {
    return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  // ---- Design your gift ----
  const designer = window.GiftDesigner.create({
    root: document.querySelector("[data-designer]"),
    config: cfg,
    msg,
    money,
    number,
  });

  function renderProductPrices() {
    document.querySelectorAll("[data-product-price]").forEach((el) => {
      const price = designer.priceFor(el.dataset.productPrice);
      el.textContent = price.unpriced.length ? msg().from(money(price.total)) : money(price.total);
    });
  }

  document.querySelectorAll("[data-customise]").forEach((btn) => {
    btn.addEventListener("click", () => {
      designer.load(btn.dataset.customise);
      const section = document.getElementById("design");
      section.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      document.getElementById("design-title").focus({ preventScroll: true });
    });
  });

  // ---- Language ----
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

    designer.render();
    renderProductPrices();
    updateCardCount();
    if (dialog.open) renderOrderSummary();

    try { localStorage.setItem(LANG_KEY, lang); } catch {}
    try {
      const url = new URL(location.href);
      if (lang === "en") url.searchParams.set("lang", "en");
      else url.searchParams.delete("lang");
      history.replaceState(null, "", url);
    } catch {}
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

  function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  // The design as labelled lines, shared by the dialog summary and the WhatsApp message.
  function designLines() {
    const m = msg();
    const d = designer.describe();
    const lines = [[m.basedOnLabel, d.basedOn ?? m.custom]];
    if (d.flowers.length) lines.push([m.flowers, m.list(d.flowers)]);
    if (d.wrap) lines.push([m.wrap, d.wrap]);
    if (d.balloons.length) lines.push([m.balloons, m.list(d.balloons)]);
    if (d.extras.length) lines.push([m.extras, m.list(d.extras)]);
    let total = money(d.price.total);
    if (d.price.unpriced.length) {
      total += ` ${m.pricePlus(m.list(d.price.unpriced.map((id) => m.names.extra[id])))}`;
    }
    return { lines, branded: d.branded, total };
  }

  function renderOrderSummary() {
    const m = msg();
    const { lines, branded, total } = designLines();
    const box = dialog.querySelector("[data-order-summary]");
    const list = document.createElement("dl");
    const packagingPrice = cfg.designer.brandedPackagingPrice;
    const packaging = branded ? [[m.packaging, packagingPrice ? money(packagingPrice) : m.free]] : [];
    for (const [label, value] of [...lines, ...packaging, [m.price, total]]) {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      list.append(row);
    }
    list.lastChild.classList.add("price-total");
    box.replaceChildren(list);
  }

  function updateConditionalFields() {
    form.querySelector('[data-when="delivery"]').hidden = form.elements.fulfil.value !== "delivery";
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

  function openOrder() {
    showForm();
    form.reset();
    clearErrors();
    renderOrderSummary();
    dateInput.min = todayISO();
    updateConditionalFields();
    updateCardCount();
    dialog.showModal();
  }

  document.querySelectorAll("[data-d-order]").forEach((btn) => btn.addEventListener("click", openOrder));
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
    const { lines: design, branded, total } = designLines();
    const lines = [m.greeting, ...design.map(([label, value]) => `• ${label}: ${value}`)];
    if (branded) lines.push(`• ${m.brandedYes}`);
    lines.push(`• ${m.price}: ${total}`);
    lines.push(`• ${delivery ? m.delivery : m.pickup} — ${m.date}: ${date}`);
    lines.push(`• ${m.time}: ${f.time.selectedOptions[0].textContent}`);
    if (delivery) lines.push(`• ${m.district}: ${f.district.value.trim()}`);
    if (f.details.value.trim()) lines.push(`• ${m.details}: ${f.details.value.trim()}`);
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

  // ---- Start ----
  document.querySelector("[data-lang-toggle]").addEventListener("click", () => {
    applyLang(lang === "ar" ? "en" : "ar");
  });

  let initial = new URLSearchParams(location.search).get("lang");
  if (!initial) {
    try { initial = localStorage.getItem(LANG_KEY); } catch {}
  }
  applyLang(initial || "ar");
})();
