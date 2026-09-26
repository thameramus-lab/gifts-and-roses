/*
 * "Design your gift": option controls, pricing and the photo board of what's chosen.
 * Pricing and choices come from SITE_CONFIG.designer; text comes from the
 * current language's messages, passed in by main.js.
 */
(() => {
  const FLOWERS = ["rose-red", "rose-pink", "rose-white", "rose-yellow", "sunflower", "lily"];
  const WRAPS = ["kraft", "black", "blush", "white"];
  const BALLOONS = ["black", "gold", "pearl", "silver", "pink", "red", "blue", "lilac"];
  const EXTRAS = ["teddy", "chocolates", "candle"];

  const WRAP_COLOUR = { kraft: "#C9A27A", black: "#2B2626", blush: "#EFC9CC", white: "#F3EEE8" };
  const BALLOON_COLOUR = {
    black: "#221E1E", gold: "#C9A24A", pearl: "#F2EEE6", silver: "#BFC3C7",
    pink: "#E89AAE", red: "#B3263A", blue: "#6E8FC9", lilac: "#B7A2D6",
  };

  // Close-up photos cut from the shop's own product photos.
  const PHOTO = {
    "rose-red": "rose-red", "rose-pink": "rose-pink", "rose-white": "rose-white",
    "rose-yellow": "rose-yellow", sunflower: "sunflower", lily: "lily",
    giftBox: "gift-box", teddy: "teddy", chocolates: "chocolates", candle: "candle",
    balloons: "balloons",
  };
  const photo = (key) => `assets/img/options/${PHOTO[key]}.webp`;

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
    const img = (src, cls) => el("img", { class: cls, src, width: "320", height: "320", alt: "", loading: "lazy", decoding: "async" });

    // Flowers: one photo card per type, with a counter
    const flowerList = $("[data-d-flowers]");
    for (const type of FLOWERS) {
      const id = `d-flower-${type}`;
      const card = el("li", { class: "d-card", "data-card": type });
      const body = el("div", { class: "d-card-body" });
      const stepper = el("div", { class: "stepper stepper-sm" });
      stepper.append(
        el("button", { class: "stepper-btn", type: "button", "data-flower": type, "data-delta": "-1" }, `<svg class="icon" aria-hidden="true"><use href="#i-minus"/></svg>`),
        el("input", { id, type: "number", inputmode: "numeric", min: "0", max: String(d.maxPerFlower), step: "1", "data-flower-input": type }),
        el("button", { class: "stepper-btn", type: "button", "data-flower": type, "data-delta": "1" }, `<svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>`),
      );
      body.append(
        el("label", { class: "d-card-name", for: id, "data-name": `flower:${type}` }),
        el("span", { class: "d-card-price", "data-flower-price": "" }),
        stepper,
      );
      card.append(img(photo(type), "d-card-img"), body);
      flowerList.append(card);
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
        el("span", { class: "swatch", style: `--swatch:${WRAP_COLOUR[wrap]}`, "aria-hidden": "true" }),
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
        class: "balloon-swatch", type: "button", "data-add-balloon": colour, style: `--swatch:${BALLOON_COLOUR[colour]}`,
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

    // Gift box and extras: photo cards you tick
    const extrasList = $("[data-d-extras]");
    for (const id of ["giftBox", ...EXTRAS]) {
      const card = el("label", { class: "d-card d-card-check" });
      const body = el("span", { class: "d-card-body" });
      body.append(
        el("span", { class: "d-card-name", "data-name": `extra:${id}` }),
        el("span", { class: "d-card-price", "data-extra-price": id }),
      );
      card.append(el("input", { type: "checkbox", class: "d-card-toggle", "data-extra": id }), img(photo(id), "d-card-img"), body);
      extrasList.append(card);
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

    // The board: a photo tile for everything chosen, with how many.
    function renderBoard(m) {
      const board = $("[data-d-preview]");
      const parts = [];

      if (basedOn) {
        const head = el("div", { class: "board-head" });
        head.append(el("img", { src: `assets/img/${basedOn.id}-560.webp`, width: "560", height: "560", alt: "", class: "board-thumb" }));
        const text = el("p", { class: "board-based" });
        text.textContent = m.basedOn(m.productNames[basedOn.id]) + (basedOn.changed ? m.edited : "");
        head.append(text);
        parts.push(head);
      }

      const tiles = [];
      const tile = (src, label, count, extra) => {
        const t = el("li", { class: "board-tile" });
        const frame = el("div", { class: "board-frame" });
        frame.append(img(src, "board-img"));
        if (count) {
          const badge = el("span", { class: "board-badge" });
          badge.textContent = `× ${number(count)}`;
          frame.append(badge);
        }
        if (extra) frame.append(extra);
        const cap = el("span", { class: "board-caption" });
        cap.textContent = label;
        t.append(frame, cap);
        tiles.push(t);
      };

      for (const type of FLOWERS) {
        if (state.flowers[type]) tile(photo(type), nameOf(`flower:${type}`), state.flowers[type]);
      }
      if (state.balloons.length) {
        const dots = el("span", { class: "board-dots", "aria-hidden": "true" });
        for (const colour of state.balloons) dots.append(el("span", { class: "swatch", style: `--swatch:${BALLOON_COLOUR[colour]}` }));
        tile(photo("balloons"), m.balloons, state.balloons.length, dots);
      }
      if (state.giftBox) tile(photo("giftBox"), nameOf("extra:giftBox"));
      for (const id of state.extras) tile(photo(id), nameOf(`extra:${id}`));

      if (tiles.length) {
        const list = el("ul", { class: "board-tiles", role: "list" });
        list.append(...tiles);
        parts.push(list);
        const chips = el("p", { class: "board-chips" });
        if (FLOWERS.some((t) => state.flowers[t])) {
          const wrap = el("span", { class: "board-chip" }, `<span class="swatch" style="--swatch:${WRAP_COLOUR[state.wrap]}" aria-hidden="true"></span><span></span>`);
          wrap.lastChild.textContent = `${m.wrap}: ${nameOf(`wrap:${state.wrap}`)}`;
          chips.append(wrap);
        }
        if (state.branded) {
          const branded = el("span", { class: "board-chip" });
          branded.textContent = m.packaging;
          chips.append(branded);
        }
        if (chips.childNodes.length) parts.push(chips);
      } else {
        const empty = el("p", { class: "board-empty" });
        empty.textContent = m.emptyPreview;
        parts.push(empty);
      }
      board.replaceChildren(...parts);
    }

    function render() {
      const m = msg();
      const price = priceOf(state, d);

      root.querySelectorAll("[data-name]").forEach((node) => { node.textContent = nameOf(node.dataset.name); });

      for (const type of FLOWERS) {
        const count = state.flowers[type] || 0;
        const name = nameOf(`flower:${type}`);
        const card = root.querySelector(`[data-card="${type}"]`);
        card.querySelector("[data-flower-input]").value = count;
        card.querySelector("[data-flower-price]").textContent = m.eachPlain(money(d.pricePerFlower));
        const [minus, plus] = card.querySelectorAll("[data-flower]");
        minus.disabled = count <= 0;
        plus.disabled = count >= d.maxPerFlower;
        minus.setAttribute("aria-label", m.fewer(name));
        plus.setAttribute("aria-label", m.more(name));
        card.classList.toggle("is-on", count > 0);
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
          `<span class="swatch" style="--swatch:${BALLOON_COLOUR[colour]}" aria-hidden="true"></span><span></span><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg>`);
        btn.children[1].textContent = name;
        return btn;
      }));

      extrasList.querySelectorAll("[data-extra]").forEach((input) => {
        const id = input.dataset.extra;
        input.checked = id === "giftBox" ? state.giftBox : state.extras.includes(id);
        input.closest(".d-card").classList.toggle("is-on", input.checked);
        const p = id === "giftBox" ? d.giftBoxPrice : d.extras[id];
        extrasList.querySelector(`[data-extra-price="${id}"]`).textContent = p == null ? m.priceOnWhatsApp : money(p);
      });
      brandedBox.checked = state.branded;
      $("[data-d-branded-price]").textContent = d.brandedPackagingPrice ? money(d.brandedPackagingPrice) : m.free;

      renderBoard(m);

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
        row.append(el("dt"), el("dd"));
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
