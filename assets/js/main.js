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

  // ---- Shop by occasion ----
  const productCards = [...document.querySelectorAll("[data-customise]")].map((btn) => ({
    occasions: cfg.products[btn.dataset.customise].occasions ?? [],
    card: btn.closest("li"),
  }));
  const occasions = document.querySelector("[data-occasions]");
  occasions.querySelectorAll("input").forEach((input) => {
    const used = input.value === "all" || productCards.some((p) => p.occasions.includes(input.value));
    input.closest("label").hidden = !used;
  });
  occasions.addEventListener("change", (e) => {
    const value = e.target.value;
    for (const p of productCards) p.card.hidden = value !== "all" && !p.occasions.includes(value);
  });

  // ---- Opening hours and ways to pay (hidden until set in config.js) ----
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };

  function isOpenNow() {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Riyadh", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
      }).formatToParts(new Date()).map((p) => [p.type, p.value]),
    );
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
    const now = Number(parts.hour) * 60 + Number(parts.minute);
    return cfg.hours.some((rule) => {
      const open = toMinutes(rule.open), close = toMinutes(rule.close);
      if (close > open) return rule.days.includes(day) && now >= open && now < close;
      // Closes after midnight: open from `open` today, or until `close` for yesterday's opening.
      return (rule.days.includes(day) && now >= open) || (rule.days.includes((day + 6) % 7) && now < close);
    });
  }

  function renderShopInfo() {
    const m = msg();
    const hoursBox = document.querySelector("[data-hours]");
    hoursBox.hidden = !cfg.hours?.length;
    if (cfg.hours?.length) {
      // 7 January 2024 was a Sunday, so day n falls on the 7th + n.
      const dayName = (n) => new Date(2024, 0, 7 + n).toLocaleDateString(m.locale, { weekday: "long" });
      const time = (hhmm) => {
        const [h, min] = hhmm.split(":").map(Number);
        return new Date(2024, 0, 1, h, min).toLocaleTimeString(m.locale, { hour: "numeric", minute: "2-digit", hour12: true });
      };
      const list = document.querySelector("[data-hours-list]");
      list.replaceChildren(...cfg.hours.map((rule) => {
        const days = rule.days;
        const inARow = days.length > 2 && days.every((d, i) => i === 0 || d === (days[i - 1] + 1) % 7);
        const row = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = inARow ? `${dayName(days[0])} – ${dayName(days.at(-1))}` : m.list(days.map(dayName));
        dd.textContent = `${time(rule.open)} – ${time(rule.close)}`;
        row.append(dt, dd);
        return row;
      }));
      const badge = document.querySelector("[data-open-now]");
      const open = isOpenNow();
      badge.textContent = open ? m.openNow : m.closedNow;
      badge.classList.toggle("is-open", open);
    }

    const payBox = document.querySelector("[data-payments]");
    payBox.hidden = !cfg.payments?.length;
    document.querySelector("[data-payments-list]").replaceChildren(...(cfg.payments ?? []).map((id) => {
      const li = document.createElement("li");
      li.textContent = m.payments[id] ?? id;
      return li;
    }));
  }

  // ---- Floating WhatsApp button (phones) ----
  // Hidden over the designer (it has its own order bar) and the contact section
  // (it has its own WhatsApp button).
  const floatBtn = document.querySelector("[data-wa-float]");
  if ("IntersectionObserver" in window) {
    const inView = new Set();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inView.add(entry.target);
        else inView.delete(entry.target);
      }
      floatBtn.classList.toggle("is-hidden", inView.size > 0);
    });
    for (const id of ["design", "contact"]) observer.observe(document.getElementById(id));
  }

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
    renderShopInfo();
    updateCardCount();
    if (dialog.open) renderOpenStep();

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
  // Step 1 (form): order details and how to pay. Step 2 (#order-pay): the Moyasar
  // payment form. Step 3 (#order-done): confirmation, or a failed payment to retry.
  // Online: the whole total is paid now. Cash: a cash fee is added and a deposit
  // is paid now; the rest is paid in cash on delivery or pickup.
  const ordering = cfg.ordering;
  const PENDING_KEY = "gr-pending-order";
  const dialog = document.getElementById("order-dialog");
  const form = document.getElementById("order-form");
  const paySection = document.getElementById("order-pay");
  const doneSection = document.getElementById("order-done");
  const summary = document.getElementById("error-summary");
  const dateInput = form.elements.date;
  const cardInput = form.elements.card;
  const cardCount = document.getElementById("f-card-count");

  const store = {
    get() {
      try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || localStorage.getItem(PENDING_KEY)); } catch { return null; }
    },
    set(order) {
      const json = JSON.stringify(order);
      try { sessionStorage.setItem(PENDING_KEY, json); } catch {}
      try { localStorage.setItem(PENDING_KEY, json); } catch {}
    },
    clear() {
      try { sessionStorage.removeItem(PENDING_KEY); } catch {}
      try { localStorage.removeItem(PENDING_KEY); } catch {}
    },
  };

  function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  // Short, readable order number, e.g. GR-1005-K7Q2.
  function newOrderId() {
    const d = new Date();
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) => chars[n % chars.length]).join("");
    return `GR-${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${rand}`;
  }

  // Saudi mobile in any common form (05…, 5…, +9665…, 009665…, Arabic digits) → 05XXXXXXXX.
  function normalisePhone(raw) {
    const digits = raw.replace(/[٠-٩]/g, (c) => "٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/\D/g, "");
    const local = digits.replace(/^(00966|966)/, "").replace(/^0/, "");
    return /^5\d{8}$/.test(local) ? `0${local}` : null;
  }

  function payChoice() {
    return form.elements.pay.value;
  }

  // Totals for the current design and payment choice, in riyals.
  function totals(pay = payChoice()) {
    const base = designer.describe().price.total;
    if (pay !== "cash") return { base, fee: 0, total: base, charge: base, rest: 0 };
    const fee = ordering.cashFee;
    const total = base + fee;
    const deposit = Math.max(1, Math.ceil((total * ordering.cashDepositPercent) / 100));
    return { base, fee, total, charge: deposit, rest: total - deposit };
  }

  // The design as labelled lines, shared by the summaries and the saved order.
  function designLines() {
    const m = msg();
    const d = designer.describe();
    const lines = [[m.basedOnLabel, d.basedOn ?? m.custom]];
    if (d.flowers.length) lines.push([m.flowers, m.list(d.flowers)]);
    if (d.wrap) lines.push([m.wrap, d.wrap]);
    if (d.balloons.length) lines.push([m.balloons, m.list(d.balloons)]);
    if (d.extras.length) lines.push([m.extras, m.list(d.extras)]);
    return { lines, branded: d.branded, unpriced: d.price.unpriced };
  }

  // Summary rows: the design, packaging, cash fee, total, and deposit / rest for cash.
  function summaryRows(pay = payChoice()) {
    const m = msg();
    const { lines, branded } = designLines();
    const sum = totals(pay);
    const rows = [...lines];
    if (branded) {
      const p = cfg.designer.brandedPackagingPrice;
      rows.push([m.packaging, p ? money(p) : m.free]);
    }
    if (sum.fee) rows.push([m.cashFeeLine, money(sum.fee)]);
    rows.push([m.price, money(sum.total), "price-total"]);
    if (pay === "cash") {
      rows.push([m.depositLine(number(ordering.cashDepositPercent)), money(sum.charge)]);
      rows.push([m.restLine, money(sum.rest)]);
    }
    return rows;
  }

  function renderRows(box, rows) {
    const list = document.createElement("dl");
    for (const [label, value, cls] of rows) {
      const row = document.createElement("div");
      if (cls) row.className = cls;
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      list.append(row);
    }
    box.replaceChildren(list);
  }

  // What stops the order: online ordering not set up, or items without a price.
  function blocker() {
    const m = msg();
    if (!ordering.moyasarKey) return m.blockedSetup;
    const { unpriced } = designLines();
    if (unpriced.length) return m.blockedUnpriced(m.list(unpriced.map((id) => m.names.extra[id])));
    return null;
  }

  function renderOrderForm() {
    const m = msg();
    const pay = payChoice();
    const sum = totals(pay);
    renderRows(dialog.querySelector("[data-order-summary]"), summaryRows(pay));
    dialog.querySelector("[data-cash-fee-hint]").textContent =
      m.cashFeeHint(money(ordering.cashFee), number(ordering.cashDepositPercent));
    form.querySelector("[data-order-total]").textContent = money(sum.charge);
    form.querySelector(".order-total span").textContent = pay === "cash" ? m.payDeposit : t("order.totalLabel");
    form.querySelector("[data-submit-label]").textContent = pay === "cash" ? m.submitCash : m.submitOnline;
    form.querySelector("[data-submit-note]").textContent =
      pay === "cash" ? m.noteCash(money(sum.charge), money(sum.rest)) : m.noteOnline;

    const blocked = blocker();
    const note = form.querySelector("[data-order-blocked]");
    note.hidden = !blocked;
    if (blocked) {
      note.textContent = blocked + " ";
      if (!ordering.moyasarKey) {
        const link = document.createElement("a");
        link.href = waUrl(m.general);
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = t("contact.whatsapp");
        note.append(link);
      }
    }
    form.querySelector("[data-submit]").disabled = !!blocked;
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

  function showStep(step) {
    form.hidden = step !== "form";
    paySection.hidden = step !== "pay";
    doneSection.hidden = step !== "done";
  }

  function renderOpenStep() {
    if (!form.hidden) renderOrderForm();
  }

  function openOrder(values) {
    form.reset();
    clearErrors();
    if (values) {
      for (const [name, value] of Object.entries(values)) {
        const field = form.elements[name];
        if (field) field.value = value;
      }
    }
    dateInput.min = todayISO();
    updateConditionalFields();
    updateCardCount();
    showStep("form");
    renderOrderForm();
    if (!dialog.open) dialog.showModal();
  }

  document.querySelectorAll("[data-d-order]").forEach((btn) => btn.addEventListener("click", () => openOrder()));
  dialog.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", () => dialog.close()));
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  form.addEventListener("change", (e) => {
    if (e.target.name === "fulfil") updateConditionalFields();
    if (e.target.name === "pay") renderOrderForm();
  });
  cardInput.addEventListener("input", updateCardCount);
  paySection.querySelector("[data-pay-back]").addEventListener("click", () => {
    showStep("form");
    form.querySelector("[data-submit]").focus();
  });

  function validate() {
    const errors = [];
    const m = msg();
    const f = form.elements;
    if (!dateInput.value) errors.push([dateInput, m.errDate]);
    else if (dateInput.value < dateInput.min) errors.push([dateInput, m.errDatePast]);
    if (f.fulfil.value === "delivery" && !f.district.value.trim()) errors.push([f.district, m.errDistrict]);
    if (!f.name.value.trim()) errors.push([f.name, m.errName]);
    if (!normalisePhone(f.phone.value)) errors.push([f.phone, m.errPhone]);
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

  // Everything about the order, saved before payment and sent to the shop afterwards.
  function buildOrder() {
    const m = msg();
    const f = form.elements;
    const pay = payChoice();
    const sum = totals(pay);
    const delivery = f.fulfil.value === "delivery";
    const [y, mo, d] = f.date.value.split("-").map(Number);
    const date = new Date(y, mo - 1, d).toLocaleDateString(m.locale, {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const values = {};
    for (const name of ["fulfil", "date", "time", "district", "name", "phone", "card", "details", "pay"]) {
      values[name] = f[name].value;
    }
    const { lines, branded } = designLines();
    return {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      lang,
      pay,
      total: sum.total,
      charge: sum.charge,
      rest: sum.rest,
      cashFee: sum.fee,
      name: f.name.value.trim(),
      phone: normalisePhone(f.phone.value),
      fulfil: delivery ? m.delivery : m.pickup,
      date,
      time: f.time.selectedOptions[0].textContent,
      district: delivery ? f.district.value.trim() : "",
      card: f.card.value.trim(),
      notes: f.details.value.trim(),
      design: lines.map(([label, value]) => `${label}: ${value}`).join(" | "),
      branded,
      rows: summaryRows(pay),
      values,
      snapshot: designer.snapshot(),
    };
  }

  // Order details attached to the Moyasar payment, so the shop sees them in its dashboard.
  function metadataFor(order) {
    const clip = (v) => String(v ?? "").slice(0, 400);
    return Object.fromEntries(Object.entries({
      order_id: order.id,
      payment_type: order.pay === "cash" ? "cash_on_delivery_deposit" : "paid_in_full",
      order_total_sar: order.total,
      paid_now_sar: order.charge,
      cash_due_sar: order.rest,
      customer_name: order.name,
      customer_phone: order.phone,
      fulfilment: order.fulfil,
      date: order.date,
      time: order.time,
      district: order.district,
      design: order.design,
      branded_packaging: order.branded ? "yes" : "no",
      card_message: order.card,
      notes: order.notes,
      language: order.lang,
    }).filter(([, v]) => v !== "" && v != null).map(([k, v]) => [k, clip(v)]));
  }

  let moyasarLoading = null;
  function loadMoyasar() {
    if (window.Moyasar) return Promise.resolve(window.Moyasar);
    moyasarLoading ??= new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "assets/vendor/moyasar/moyasar.css";
      document.head.append(css);
      const script = document.createElement("script");
      script.src = "assets/vendor/moyasar/moyasar.umd.js";
      script.onload = () => resolve(window.Moyasar);
      script.onerror = () => { moyasarLoading = null; reject(new Error("moyasar")); };
      document.head.append(script);
    });
    return moyasarLoading;
  }

  async function startPayment(order) {
    const m = msg();
    showStep("pay");
    paySection.querySelector("[data-pay-amount]").textContent = money(order.charge);
    const error = paySection.querySelector("[data-pay-error]");
    error.hidden = true;
    const container = document.getElementById("mysr-form");
    container.replaceChildren();
    document.getElementById("pay-title").focus();
    try {
      const Moyasar = await loadMoyasar();
      const methods = ordering.methods;
      Moyasar.init({
        element: "#mysr-form",
        amount: Math.round(order.charge * 100),
        currency: "SAR",
        description: order.pay === "cash" ? `Gifts & Roses deposit, order ${order.id}` : `Gifts & Roses order ${order.id}`,
        publishable_api_key: ordering.moyasarKey,
        callback_url: location.href.split("#")[0],
        language: lang,
        methods,
        metadata: metadataFor(order),
        ...(methods.includes("applepay") && {
          apple_pay: {
            country: "SA",
            label: ordering.applePayLabel,
            validate_merchant_url: "https://api.moyasar.com/v1/applepay/initiate",
          },
        }),
        // Moyasar requires an async function here.
        on_completed: async (payment) => {
          store.set({ ...order, paymentId: payment.id });
        },
      });
    } catch {
      error.textContent = m.payLoadError;
      error.hidden = false;
    }
  }

  // Optional Google Sheet + email for the shop (see google-apps-script/orders.gs).
  function sendToShop(order, paymentId, status) {
    if (!ordering.orderEndpoint) return Promise.resolve();
    const { snapshot, values, rows, ...rest } = order;
    return fetch(ordering.orderEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...rest, paymentId, paymentStatus: status }),
    }).catch(() => {});
  }

  function showDone(order, ok, reason) {
    const m = msg();
    showStep("done");
    const title = doneSection.querySelector("[data-done-title]");
    const text = doneSection.querySelector("[data-done-text]");
    const ref = doneSection.querySelector("[data-done-ref]");
    const retry = doneSection.querySelector("[data-done-retry]");
    if (ok) {
      title.textContent = order.pay === "cash" ? m.doneCashTitle : m.donePaidTitle;
      text.textContent = order.pay === "cash" ? m.doneCashText(money(order.rest), order.phone) : m.donePaidText(order.phone);
      ref.textContent = m.doneRef(order.id);
      ref.hidden = false;
    } else {
      title.textContent = m.failTitle;
      text.textContent = m.failText(reason);
      ref.hidden = true;
    }
    renderRows(doneSection.querySelector("[data-done-summary]"), order.rows);
    retry.hidden = ok;
    retry.onclick = () => openOrder(order.values);
    if (!dialog.open) dialog.showModal();
    title.focus();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();
    if (blocker()) return;
    const errors = validate();
    if (errors.length) {
      showErrors(errors);
      return;
    }
    const order = buildOrder();
    store.set(order);
    startPayment(order);
  });

  // Back from Moyasar: the payment page returns here with ?id=…&status=…&message=…
  function handlePaymentReturn() {
    const params = new URLSearchParams(location.search);
    const paymentId = params.get("id");
    const status = params.get("status");
    if (!paymentId || !status) return;
    const reason = params.get("message");
    try {
      const url = new URL(location.href);
      for (const key of ["id", "status", "message"]) url.searchParams.delete(key);
      history.replaceState(null, "", url);
    } catch {}
    const order = store.get();
    if (!order) return;
    designer.restore(order.snapshot);
    if (status === "paid") {
      store.clear();
      sendToShop(order, paymentId, status);
      showDone(order, true);
    } else {
      showDone(order, false, reason);
    }
  }

  // ---- Start ----
  document.querySelector("[data-lang-toggle]").addEventListener("click", () => {
    applyLang(lang === "ar" ? "en" : "ar");
  });

  let initial = new URLSearchParams(location.search).get("lang");
  if (!initial) {
    try { initial = localStorage.getItem(LANG_KEY); } catch {}
  }
  applyLang(initial || "ar");
  handlePaymentReturn();
})();
