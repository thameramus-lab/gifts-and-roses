/*
 * "Design your gift": option controls, pricing and the live illustration.
 * Pricing and choices come from SITE_CONFIG.designer; text comes from the
 * current language's messages, passed in by main.js.
 */
(() => {
  const FLOWERS = ["rose-red", "rose-pink", "rose-white", "rose-yellow", "sunflower", "lily"];
  const WRAPS = ["kraft", "black", "blush", "white"];
  const BALLOONS = ["black", "gold", "pearl", "silver", "pink", "red", "blue", "lilac"];
  const EXTRAS = ["teddy", "chocolates", "candle"];

  // ---- Illustration palette ----
  const ROSE = {
    "rose-red": ["#B3263A", "#6E1424"],
    "rose-pink": ["#E892A8", "#B85473"],
    "rose-white": ["#F6F1EA", "#C9BDAE"],
    "rose-yellow": ["#F3C94E", "#C7952A"],
  };
  const WRAP = {
    kraft: ["#C9A27A", "#B08760"],
    black: ["#2B2626", "#1A1616"],
    blush: ["#EFC9CC", "#DDAFB4"],
    white: ["#F3EEE8", "#DCD4CA"],
  };
  const BALLOON = {
    black: "#221E1E", gold: "#C9A24A", pearl: "#F2EEE6", silver: "#BFC3C7",
    pink: "#E89AAE", red: "#B3263A", blue: "#6E8FC9", lilac: "#B7A2D6",
  };
  const GOLD = "#C9A24A";
  const BALLOON_SPOTS = [
    [150, 92], [214, 70], [96, 128], [270, 104], [182, 140], [120, 58],
    [244, 150], [66, 84], [306, 66], [168, 34], [322, 142], [44, 146],
  ];

  const f = (n) => Math.round(n * 10) / 10;

  function roseHead(type, s) {
    const [fill, dark] = ROSE[type];
    const a = f(s * 0.58), b = f(s * 0.3);
    return `<circle r="${f(s)}" fill="${fill}" stroke="${dark}" stroke-opacity=".35"/>` +
      `<path d="M ${-a} 0 A ${a} ${a} 0 1 1 0 ${a}" fill="none" stroke="${dark}" stroke-width="${f(s * 0.12)}" stroke-opacity=".6" stroke-linecap="round"/>` +
      `<path d="M ${-b} ${f(-s * 0.08)} A ${b} ${b} 0 1 1 ${f(s * 0.08)} ${b}" fill="none" stroke="${dark}" stroke-width="${f(s * 0.1)}" stroke-opacity=".6" stroke-linecap="round"/>` +
      `<circle r="${f(s * 0.12)}" fill="${dark}" fill-opacity=".55"/>`;
  }

  function sunflowerHead(s) {
    let petals = "";
    for (let k = 0; k < 14; k++) {
      petals += `<ellipse cy="${f(-s * 0.7)}" rx="${f(s * 0.2)}" ry="${f(s * 0.4)}" fill="#F2B01E" stroke="#D8940E" stroke-width=".6" transform="rotate(${f((k * 360) / 14)})"/>`;
    }
    return petals + `<circle r="${f(s * 0.46)}" fill="#5A3A1A"/><circle r="${f(s * 0.3)}" fill="#7A4E22"/>`;
  }

  function lilyHead(s) {
    let petals = "";
    const p = `M0 0 Q ${f(s * 0.36)} ${f(-s * 0.5)} 0 ${f(-s * 1.05)} Q ${f(-s * 0.36)} ${f(-s * 0.5)} 0 0 Z`;
    for (let k = 0; k < 6; k++) {
      petals += `<path d="${p}" fill="#FBF8F2" stroke="#D5CDBE" stroke-width=".8" transform="rotate(${k * 60 + 30})"/>`;
    }
    let stamens = "";
    for (const ang of [-40, 10, 60]) {
      const r = (ang * Math.PI) / 180, x = f(Math.sin(r) * s * 0.45), y = f(-Math.cos(r) * s * 0.45);
      stamens += `<line x2="${x}" y2="${y}" stroke="#9DB47E" stroke-width=".9"/><circle cx="${x}" cy="${y}" r="${f(s * 0.07)}" fill="#C7792A"/>`;
    }
    return petals + `<circle r="${f(s * 0.18)}" fill="#CFE3B5"/>` + stamens;
  }

  function head(type, s) {
    if (type === "sunflower") return sunflowerHead(s);
    if (type === "lily") return lilyHead(s);
    return roseHead(type, s);
  }

  // Deterministic pseudo-random numbers, so the drawing doesn't jump between renders.
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Spread each flower type evenly through the bouquet instead of in clumps.
  function mixTypes(counts) {
    const items = [];
    for (const type of FLOWERS) {
      const n = counts[type] || 0;
      for (let i = 0; i < n; i++) items.push({ type, order: (i + 0.5) / n });
    }
    return items.sort((a, b) => a.order - b.order).map((item) => item.type);
  }

  function drawBouquet(state, total) {
    const [wrap, wrapDark] = WRAP[state.wrap];
    const cx = 200, cy = 200;
    const R = 62 + Math.min(44, total * 1.6);
    const types = mixTypes(state.flowers).slice(0, 70);
    const n = types.length;
    const size = Math.max(9, Math.min(24, (R * 1.05) / Math.sqrt(n) + 3));
    const rand = rng(n * 31 + 7);
    let svg = "";

    // Back paper, stems
    svg += `<path d="M ${f(cx - R - 26)} ${cy - 30} L ${cx - 20} 384 L ${cx + 20} 384 L ${f(cx + R + 26)} ${cy - 30} Q ${cx} ${f(cy - R * 0.9)} ${f(cx - R - 26)} ${cy - 30} Z" fill="${wrapDark}"/>`;
    for (const dx of [-12, -4, 4, 12]) {
      svg += `<line x1="${cx + dx}" y1="378" x2="${cx + dx * 1.4}" y2="414" stroke="#5E7F54" stroke-width="3.5" stroke-linecap="round"/>`;
    }

    // Greenery and baby's breath behind the heads
    for (let i = 0; i < 16; i++) {
      const ang = Math.PI + (i / 15) * Math.PI;
      const x = f(cx + Math.cos(ang) * R * 0.98), y = f(cy + 6 + Math.sin(ang) * R * 0.66);
      const rot = f((ang * 180) / Math.PI + 90);
      svg += `<ellipse cx="${x}" cy="${y}" rx="7" ry="14" fill="${i % 2 ? "#7FA08A" : "#93B29B"}" transform="rotate(${rot} ${x} ${y})"/>`;
    }
    const heads = [];
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt((i + 0.5) / n), t = i * 2.39996;
      heads.push({ type: types[i], x: cx + r * R * 0.84 * Math.cos(t), y: cy - 4 + r * R * 0.56 * Math.sin(t) });
    }
    for (let i = 0; i < 26; i++) {
      const t = rand() * Math.PI * 2, r = Math.sqrt(rand());
      svg += `<circle cx="${f(cx + Math.cos(t) * r * R)}" cy="${f(cy - 2 + Math.sin(t) * r * R * 0.64)}" r="2.4" fill="#FFFFFF" stroke="#E4DDD2" stroke-width=".5"/>`;
    }

    // Flower heads, back to front
    heads.sort((a, b) => a.y - b.y);
    for (const h of heads) {
      svg += `<g transform="translate(${f(h.x)} ${f(h.y)})">${head(h.type, size)}</g>`;
    }
    for (let i = 0; i < 12; i++) {
      const t = rand() * Math.PI * 2, r = 0.3 + rand() * 0.7;
      svg += `<circle cx="${f(cx + Math.cos(t) * r * R * 0.9)}" cy="${f(cy - 2 + Math.sin(t) * r * R * 0.6)}" r="1.9" fill="#FFFFFF" fill-opacity=".9"/>`;
    }

    // Front paper with a tissue layer, then the bow
    svg += `<path d="M ${f(cx - R - 16)} ${cy + 14} L ${cx - 20} 386 L ${cx + 20} 386 L ${f(cx + R + 16)} ${cy + 14} Q ${cx} ${f(cy + 26 + R * 0.35)} ${f(cx - R - 16)} ${cy + 14} Z" fill="#FFFFFF" fill-opacity=".55"/>`;
    svg += `<path d="M ${f(cx - R - 6)} ${cy + 26} L ${cx - 20} 388 L ${cx + 20} 388 L ${f(cx + R + 6)} ${cy + 26} Q ${cx} ${f(cy + 40 + R * 0.35)} ${f(cx - R - 6)} ${cy + 26} Z" fill="${wrap}"/>`;
    svg += `<path d="M ${cx} ${f(cy + 34 + R * 0.35)} L ${cx} 386" stroke="${wrapDark}" stroke-width="1.5" opacity=".6"/>`;

    const ribbon = state.branded ? "#1F1B1B" : state.wrap === "black" || state.wrap === "kraft" ? GOLD : "#8C2A43";
    svg += `<g transform="translate(${cx} 368)">` +
      `<path d="M -3 4 L -16 34 L -8 32 L -4 38 Z M 3 4 L 14 36 L 7 33 L 3 39 Z" fill="${ribbon}"/>` +
      `<ellipse cx="-14" cy="-2" rx="15" ry="8" fill="none" stroke="${ribbon}" stroke-width="5" transform="rotate(-18 -14 -2)"/>` +
      `<ellipse cx="14" cy="-2" rx="15" ry="8" fill="none" stroke="${ribbon}" stroke-width="5" transform="rotate(18 14 -2)"/>` +
      `<circle r="5.5" fill="${ribbon}"/></g>`;
    if (state.branded) {
      svg += `<g transform="translate(${cx + 12} 376) rotate(8)">` +
        `<line x1="0" y1="0" x2="4" y2="8" stroke="${GOLD}" stroke-width=".8"/>` +
        `<rect x="-8" y="8" width="42" height="24" rx="2" fill="#1F1B1B" stroke="${GOLD}" stroke-width=".8"/>` +
        `<text x="13" y="19" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="7" fill="${GOLD}">Gifts &amp;</text>` +
        `<text x="13" y="27" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="7" fill="${GOLD}">Roses</text></g>`;
    }
    return svg;
  }

  function drawBalloons(balloons, anchor) {
    let strings = "", shapes = "";
    balloons.slice(0, BALLOON_SPOTS.length).forEach((colour, i) => {
      const [x, y] = BALLOON_SPOTS[i];
      const fill = BALLOON[colour];
      strings += `<path d="M ${x} ${y + 42} Q ${f((x + anchor[0]) / 2 + 12)} ${f((y + anchor[1]) / 2 + 20)} ${anchor[0]} ${anchor[1]}" fill="none" stroke="#9A8F88" stroke-width=".8"/>`;
      shapes += `<g transform="translate(${x} ${y})">` +
        `<ellipse rx="31" ry="37" fill="${fill}" stroke="#000" stroke-opacity=".12"/>` +
        `<path d="M -4 36 L 4 36 L 0 43 Z" fill="${fill}"/>` +
        `<ellipse cx="-11" cy="-15" rx="7" ry="11" fill="#FFFFFF" fill-opacity="${colour === "pearl" ? ".8" : ".35"}" transform="rotate(-24 -11 -15)"/></g>`;
    });
    return strings + shapes;
  }

  function drawTeddy(branded) {
    const fur = "#C49A6C", light = "#E6CBA5", bow = branded ? "#1F1B1B" : "#8C2A43";
    return `<g>` +
      `<ellipse cx="80" cy="378" rx="30" ry="31" fill="${fur}"/>` +
      `<ellipse cx="80" cy="384" rx="17" ry="18" fill="${light}" opacity=".7"/>` +
      `<ellipse cx="62" cy="404" rx="12" ry="8" fill="#D8B488"/><ellipse cx="98" cy="404" rx="12" ry="8" fill="#D8B488"/>` +
      `<circle cx="62" cy="312" r="9" fill="${fur}"/><circle cx="98" cy="312" r="9" fill="${fur}"/>` +
      `<circle cx="62" cy="312" r="4.5" fill="${light}"/><circle cx="98" cy="312" r="4.5" fill="${light}"/>` +
      `<circle cx="80" cy="330" r="24" fill="${fur}"/>` +
      `<ellipse cx="80" cy="339" rx="10" ry="7.5" fill="${light}"/>` +
      `<ellipse cx="80" cy="335" rx="3.6" ry="2.6" fill="#3A2A20"/>` +
      `<circle cx="72" cy="325" r="2.6" fill="#2A1E18"/><circle cx="88" cy="325" r="2.6" fill="#2A1E18"/>` +
      `<path d="M 80 352 L 68 346 L 68 358 Z M 80 352 L 92 346 L 92 358 Z" fill="${bow}"/><circle cx="80" cy="352" r="2.6" fill="${bow}"/></g>`;
  }

  function drawChocolates() {
    let balls = "";
    for (const [x, y] of [[132, 392], [146, 392], [160, 392], [139, 402], [153, 402]]) {
      balls += `<circle cx="${x}" cy="${y}" r="6" fill="${GOLD}" stroke="#A8832F" stroke-width=".6"/><circle cx="${x - 2}" cy="${y - 2}" r="1.6" fill="#fff" fill-opacity=".6"/>`;
    }
    return `<rect x="122" y="382" width="48" height="28" rx="3" fill="#2B2626" stroke="${GOLD}" stroke-width="1"/>` + balls;
  }

  function drawCandle() {
    return `<rect x="236" y="366" width="30" height="42" rx="4" fill="#221E1E"/>` +
      `<rect x="236" y="362" width="30" height="7" rx="2" fill="#3A3434"/>` +
      `<rect x="241" y="380" width="20" height="14" rx="1" fill="#F2EEE6" fill-opacity=".9"/>` +
      `<line x1="244" y1="386" x2="258" y2="386" stroke="#221E1E" stroke-width=".8"/>`;
  }

  function drawGiftBox(branded) {
    let svg = `<rect x="280" y="352" width="92" height="56" rx="2" fill="#231F1F"/>` +
      `<rect x="276" y="340" width="100" height="16" rx="2" fill="#2E2929"/>` +
      `<rect x="302" y="340" width="9" height="68" fill="${GOLD}"/>` +
      `<rect x="276" y="345" width="100" height="6" fill="${GOLD}" opacity=".85"/>` +
      `<ellipse cx="296" cy="334" rx="12" ry="6.5" fill="none" stroke="${GOLD}" stroke-width="4" transform="rotate(-16 296 334)"/>` +
      `<ellipse cx="317" cy="334" rx="12" ry="6.5" fill="none" stroke="${GOLD}" stroke-width="4" transform="rotate(16 317 334)"/>` +
      `<circle cx="306.5" cy="337" r="4" fill="${GOLD}"/>`;
    if (branded) {
      svg += `<text x="343" y="384" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="9" fill="${GOLD}">Gifts &amp;</text>` +
        `<text x="343" y="395" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="9" fill="${GOLD}">Roses</text>`;
    }
    return svg;
  }

  function illustrate(state, emptyText) {
    const total = FLOWERS.reduce((sum, type) => sum + (state.flowers[type] || 0), 0);
    const hasBouquet = total > 0;
    const anchor = hasBouquet ? [200, 366] : state.giftBox ? [306, 336] : [200, 404];
    let svg = `<ellipse cx="200" cy="410" rx="170" ry="10" fill="#3A3331" fill-opacity=".08"/>`;

    if (state.balloons.length) {
      svg += drawBalloons(state.balloons, anchor);
      if (!hasBouquet && !state.giftBox) svg += `<rect x="190" y="398" width="20" height="12" rx="3" fill="${GOLD}"/>`;
    }
    if (hasBouquet) svg += drawBouquet(state, total);
    if (state.extras.includes("teddy")) svg += drawTeddy(state.branded);
    if (state.extras.includes("chocolates")) svg += drawChocolates();
    if (state.extras.includes("candle")) svg += drawCandle();
    if (state.giftBox) svg += drawGiftBox(state.branded);

    const empty = !hasBouquet && !state.balloons.length && !state.giftBox && !state.extras.length;
    if (empty) {
      svg += `<text x="200" y="220" text-anchor="middle" font-family="Tajawal, Montserrat, sans-serif" font-size="16" fill="#685D59">${emptyText}</text>`;
    }
    return `<svg viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${svg}</svg>`;
  }

  // ---- Pricing ----
  function priceOf(state, d) {
    const flowerCount = FLOWERS.reduce((sum, type) => sum + (state.flowers[type] || 0), 0);
    const lines = {
      flowers: flowerCount * d.pricePerFlower,
      fee: flowerCount ? d.arrangingFee(flowerCount) : 0,
      balloons: state.balloons.length * d.balloonPrice,
      giftBox: state.giftBox ? d.giftBoxPrice : 0,
      branded: state.branded ? d.brandedPackagingPrice : 0,
    };
    const extras = state.extras.map((id) => ({ id, price: d.extras[id] }));
    const known = Object.values(lines).reduce((a, b) => a + b, 0) +
      extras.reduce((a, e) => a + (e.price ?? 0), 0);
    return {
      flowerCount,
      balloonCount: state.balloons.length,
      lines,
      extras,
      unpriced: extras.filter((e) => e.price == null).map((e) => e.id),
      total: known,
    };
  }

  const clone = (s) => ({
    flowers: { ...s.flowers },
    wrap: s.wrap,
    balloons: [...s.balloons],
    giftBox: !!s.giftBox,
    extras: [...s.extras],
    branded: !!s.branded,
  });

  // ---- Controls ----
  function create({ root, config, msg, money, number, onChange }) {
    const d = config.designer;
    let state = clone(d.start);
    let basedOn = null;

    const $ = (sel) => root.querySelector(sel);
    const el = (tag, attrs = {}, html = "") => {
      const node = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
      node.innerHTML = html;
      return node;
    };

    // Flowers: one row per type with a counter
    const flowerList = $("[data-d-flowers]");
    for (const type of FLOWERS) {
      const id = `d-flower-${type}`;
      const row = el("li", { class: "d-row" });
      row.append(
        el("span", { class: "d-icon", "aria-hidden": "true" }, `<svg viewBox="-26 -26 52 52">${head(type, 20)}</svg>`),
        el("label", { class: "d-row-name", for: id, "data-name": `flower:${type}` }),
      );
      const stepper = el("div", { class: "stepper stepper-sm" });
      stepper.append(
        el("button", { class: "stepper-btn", type: "button", "data-flower": type, "data-delta": "-1" }, `<svg class="icon" aria-hidden="true"><use href="#i-minus"/></svg>`),
        el("input", { id, type: "number", inputmode: "numeric", min: "0", max: String(d.maxPerFlower), step: "1", "data-flower-input": type }),
        el("button", { class: "stepper-btn", type: "button", "data-flower": type, "data-delta": "1" }, `<svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>`),
      );
      row.append(stepper);
      flowerList.append(row);
    }
    flowerList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-flower]");
      if (!btn) return;
      setFlower(btn.dataset.flower, (state.flowers[btn.dataset.flower] || 0) + Number(btn.dataset.delta));
    });
    flowerList.addEventListener("change", (e) => {
      const type = e.target.dataset.flowerInput;
      if (type) setFlower(type, Number(e.target.value));
    });
    function setFlower(type, n) {
      state.flowers[type] = Math.min(d.maxPerFlower, Math.max(0, Math.round(n) || 0));
      update();
    }

    // Wrapping: radio chips
    const wrapGroup = $("[data-d-wraps]");
    for (const wrap of WRAPS) {
      const label = el("label", { class: "choice" });
      label.append(
        el("input", { type: "radio", name: "d-wrap", value: wrap }),
        el("span", { class: "swatch", style: `--swatch:${WRAP[wrap][0]}`, "aria-hidden": "true" }),
        el("span", { "data-name": `wrap:${wrap}` }),
      );
      wrapGroup.append(label);
    }
    wrapGroup.addEventListener("change", (e) => {
      state.wrap = e.target.value;
      update();
    });

    // Balloons: tap a colour to add one, tap a chip to remove it
    const swatches = $("[data-d-balloon-swatches]");
    for (const colour of BALLOONS) {
      swatches.append(el("button", {
        class: "balloon-swatch", type: "button", "data-add-balloon": colour, style: `--swatch:${BALLOON[colour]}`,
      }));
    }
    swatches.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add-balloon]");
      if (!btn || state.balloons.length >= d.maxBalloons) return;
      state.balloons.push(btn.dataset.addBalloon);
      update();
    });
    const chosen = $("[data-d-balloons]");
    chosen.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove-balloon]");
      if (!btn) return;
      const index = Number(btn.dataset.removeBalloon);
      state.balloons.splice(index, 1);
      update();
      // Keep keyboard focus in the list after the chip disappears.
      const chips = chosen.querySelectorAll("button");
      (chips[Math.min(index, chips.length - 1)] || swatches.querySelector("button")).focus();
    });

    // Gift box and extras: checkboxes
    const extrasList = $("[data-d-extras]");
    for (const id of ["giftBox", ...EXTRAS]) {
      const label = el("label", { class: "d-check" });
      label.append(
        el("input", { type: "checkbox", "data-extra": id }),
        el("span", { "data-name": `extra:${id}` }),
        el("span", { class: "d-check-price", "data-extra-price": id }),
      );
      extrasList.append(label);
    }
    extrasList.addEventListener("change", (e) => {
      const id = e.target.dataset.extra;
      if (id === "giftBox") state.giftBox = e.target.checked;
      else state.extras = EXTRAS.filter((x) => (x === id ? e.target.checked : state.extras.includes(x)));
      update();
    });

    const brandedBox = $("[data-d-branded]");
    brandedBox.addEventListener("change", () => {
      state.branded = brandedBox.checked;
      update();
    });

    $("[data-d-reset]").addEventListener("click", () => load(null));

    // Keys look like "flower:rose-red", "wrap:black", "balloon:black" or "extra:teddy".
    function nameOf(key) {
      const [kind, id] = key.split(":");
      return msg().names[kind][id];
    }

    function update() {
      basedOn = basedOn && { ...basedOn, changed: true };
      render();
      onChange?.();
    }

    function render() {
      const m = msg();
      const price = priceOf(state, d);

      root.querySelectorAll("[data-name]").forEach((node) => { node.textContent = nameOf(node.dataset.name); });

      for (const type of FLOWERS) {
        const count = state.flowers[type] || 0;
        const name = nameOf(`flower:${type}`);
        root.querySelector(`[data-flower-input="${type}"]`).value = count;
        const [minus, plus] = root.querySelectorAll(`[data-flower="${type}"]`);
        minus.disabled = count <= 0;
        plus.disabled = count >= d.maxPerFlower;
        minus.setAttribute("aria-label", m.fewer(name));
        plus.setAttribute("aria-label", m.more(name));
        root.querySelector(`#d-flower-${type}`).closest(".d-row").classList.toggle("is-on", count > 0);
      }

      wrapGroup.querySelectorAll("input").forEach((input) => { input.checked = input.value === state.wrap; });

      const full = state.balloons.length >= d.maxBalloons;
      swatches.querySelectorAll("button").forEach((btn) => {
        btn.setAttribute("aria-label", m.addBalloon(nameOf(`balloon:${btn.dataset.addBalloon}`)));
        btn.disabled = full;
      });
      $("[data-d-balloon-count]").textContent = m.balloonCount(number(state.balloons.length), number(d.maxBalloons));
      $("[data-d-balloon-price]").textContent = m.each(money(d.balloonPrice));
      chosen.replaceChildren(...state.balloons.map((colour, i) => {
        const name = nameOf(`balloon:${colour}`);
        const btn = el("button", { type: "button", class: "balloon-chip", "data-remove-balloon": i, "aria-label": m.removeBalloon(name) },
          `<span class="swatch" style="--swatch:${BALLOON[colour]}" aria-hidden="true"></span><span></span><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg>`);
        btn.children[1].textContent = name;
        return btn;
      }));

      extrasList.querySelectorAll("[data-extra]").forEach((input) => {
        const id = input.dataset.extra;
        input.checked = id === "giftBox" ? state.giftBox : state.extras.includes(id);
        const p = id === "giftBox" ? d.giftBoxPrice : d.extras[id];
        extrasList.querySelector(`[data-extra-price="${id}"]`).textContent = p == null ? m.priceOnWhatsApp : money(p);
      });
      brandedBox.checked = state.branded;
      $("[data-d-branded-price]").textContent = d.brandedPackagingPrice ? money(d.brandedPackagingPrice) : m.free;

      $("[data-d-preview]").innerHTML = illustrate(state, m.emptyPreview);

      const based = $("[data-d-based]");
      based.hidden = !basedOn;
      if (basedOn) based.textContent = m.basedOn(m.productNames[basedOn.id]) + (basedOn.changed ? m.edited : "");

      // Price summary
      const rows = [];
      if (price.flowerCount) {
        rows.push([m.flowersLine(number(price.flowerCount)), money(price.lines.flowers)]);
        rows.push([m.fee, money(price.lines.fee)]);
      }
      if (price.balloonCount) rows.push([m.balloonsLine(number(price.balloonCount)), money(price.lines.balloons)]);
      if (state.giftBox) rows.push([nameOf("extra:giftBox"), money(price.lines.giftBox)]);
      for (const extra of price.extras) {
        rows.push([nameOf(`extra:${extra.id}`), extra.price == null ? m.priceOnWhatsApp : money(extra.price)]);
      }
      if (state.branded) rows.push([m.packaging, d.brandedPackagingPrice ? money(price.lines.branded) : m.free]);
      $("[data-d-lines]").replaceChildren(...rows.map(([label, value]) => {
        const row = el("div");
        row.append(el("dt", {}, ""), el("dd", {}, ""));
        row.firstChild.textContent = label;
        row.lastChild.textContent = value;
        return row;
      }));
      $("[data-d-total]").textContent = money(price.total);
      $("[data-d-total-bar]").textContent = money(price.total);
      const note = $("[data-d-unpriced]");
      note.hidden = !price.unpriced.length;
      if (price.unpriced.length) note.textContent = m.unpricedNote(m.list(price.unpriced.map((id) => nameOf(`extra:${id}`))));

      const nothing = !price.flowerCount && !price.balloonCount && !state.giftBox && !state.extras.length;
      root.querySelectorAll("[data-d-order]").forEach((btn) => { btn.disabled = nothing; });
    }

    function load(productId) {
      state = clone(productId ? config.products[productId] : d.start);
      basedOn = productId ? { id: productId, changed: false } : null;
      render();
      onChange?.();
    }

    // Plain-text description, used for the WhatsApp message and the order summary.
    function describe() {
      const m = msg();
      const price = priceOf(state, d);
      const flowers = FLOWERS.filter((t) => state.flowers[t]).map((t) => `${nameOf(`flower:${t}`)} × ${number(state.flowers[t])}`);
      const balloonCounts = {};
      for (const c of state.balloons) balloonCounts[c] = (balloonCounts[c] || 0) + 1;
      const balloons = Object.entries(balloonCounts).map(([c, n]) => `${nameOf(`balloon:${c}`)} × ${number(n)}`);
      const extras = [...(state.giftBox ? ["giftBox"] : []), ...state.extras].map((id) => nameOf(`extra:${id}`));
      return {
        basedOn: basedOn && m.productNames[basedOn.id] + (basedOn.changed ? m.edited : ""),
        flowers,
        wrap: price.flowerCount ? nameOf(`wrap:${state.wrap}`) : null,
        balloons,
        extras,
        branded: state.branded,
        price,
        money,
      };
    }

    render();
    return { render, load, describe, priceFor: (id) => priceOf(clone(config.products[id]), d) };
  }

  window.GiftDesigner = { create };
})();
