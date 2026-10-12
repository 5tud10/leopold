/* Variante B – Sammlung als Figur aus Werken (aus dem Repo leopold/grid, für die Seite angepasst):
   rund 1300 Werke der Online Sammlung als Kacheln in der Form der Leopold-Figur.
   Ziehen zum Bewegen, Zoom per Knopf oder Trackpad-Pinch, Klick öffnet die Werkansicht.
   Der Filter darüber füllt die Figur mit den passenden Werken neu: die Silhouette bleibt vollständig.
   Bewegung über eine Federung: gleitet weich nach und schwingt ganz leicht aus. */
(() => {
  "use strict";
  const stage = document.querySelector("[data-fgrid]");
  if (!stage || !window.DATA) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const de = () => document.documentElement.lang !== "en";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Abstimmung (Bewegung wie im Original) ---
  const COLS = 56, FILL = 0.3, GAP = 0.1, BASE = 60;
  const ZOOM_MAX = 9, ZOOM_STEP = 2, ZOOM_START = 4.2;   // Start: nah dran, die Figur zeigt sich erst beim Herauszoomen
  const LERP = 0.15, THROW = 10, HOVER_MS = 250, HOVER_ALPHA = 0.6, THUMB = 192;
  const INTRO_FADE = 1500;
  const DIM = 0.07;                                          // nicht passende Werke beim Filtern

  // --- Werke: Künstler*in und Zeit für den Filter ---
  const { shape } = window.DATA;
  const works = window.DATA.works.map((w, i) => {
    const year = +(String(w.date).match(/\d{4}/) || [0])[0];
    const time = !year ? null : year < 1900 ? "pre" : year < 1910 ? "1900" : year < 1919 ? "1910" : year < 1946 ? "1919" : "post";
    return { ...w, i, ext: true, thumb: "assets/figure-grid/" + w.thumb, name: (w.artist || "").split(",")[0].trim(), time };
  });
  const TIMES = [
    ["pre", "Vor 1900", "Before 1900"], ["1900", "1900–1909", "1900–1909"], ["1910", "1910–1918", "1910–1918"],
    ["1919", "1919–1945", "1919–1945"], ["post", "Nach 1945", "After 1945"]
  ];
  const tally = {};
  works.forEach(w => { if (w.name && !/^Anonym/.test(w.name)) tally[w.name] = (tally[w.name] || 0) + 1; });
  const ARTISTS = Object.keys(tally).sort((a, b) => tally[b] - tally[a]).slice(0, 12);
  const sel = { artist: new Set(), time: new Set() };
  const match = (w, skip) =>
    (skip === "artist" || !sel.artist.size || sel.artist.has(w.name)) &&
    (skip === "time" || !sel.time.size || sel.time.has(w.time));

  // --- Form → Zellen ---
  const [vx, vy, vw, vh] = shape.viewBox;
  const unit = vw / COLS, ROWS = Math.ceil(vh / unit), SS = 8;
  const mc = document.createElement("canvas");
  mc.width = COLS * SS; mc.height = ROWS * SS;
  const mctx = mc.getContext("2d", { willReadFrequently: true });
  mctx.scale(SS / unit, SS / unit); mctx.translate(-vx, -vy);
  for (const d of shape.paths) mctx.fill(new Path2D(d));
  const px = mctx.getImageData(0, 0, mc.width, mc.height).data;
  const cells = [], byPos = new Map();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    let n = 0;
    for (let y = 0; y < SS; y++) for (let x = 0; x < SS; x++)
      if (px[(((r * SS + y) * mc.width) + c * SS + x) * 4 + 3] > 127) n++;
    if (n / (SS * SS) < FILL) continue;
    const cell = { c, r, i: cells.length, w: works[cells.length % works.length], a: 0, sc: 1, next: null, t0: 0, jit: Math.random() };
    cells.push(cell); byPos.set(c + "," + r, cell);
  }
  { const d = cells.map(k => Math.hypot(k.c + .5 - COLS / 2, k.r + .5 - ROWS / 2)), max = Math.max(...d); cells.forEach((k, i) => (k.dist = d[i] / max)); }

  // --- Zustand ---
  const canvas = $("canvas", stage), ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, state = "wait", R = 1, ze = 1, O = 0, Q = 0, pe = 0, ve = 0, glideRaf = null, reveal = 0;
  let hoverKey = null, hoverA = 1, hoverT0 = 0, hoverRaf = null;
  const cellPx = (z = R) => BASE * z;
  const BAR = 0;                                           // keine Leiste mehr unter der Figur
  const fitZoom = () => Math.min(W / ((COLS + 4) * BASE), (H - BAR - 20) / ((ROWS + 2) * BASE));   // Platz für die Leiste unten
  const ease3 = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const centre = (z = R) => ({ x: (W - COLS * cellPx(z)) / 2, y: (H - BAR - ROWS * cellPx(z)) / 2 });
  function clampPan(x, y) {
    const s = cellPx(), sw = COLS * s, sh = ROWS * s;
    return { x: sw <= W ? (W - sw) / 2 : Math.max(W - sw, Math.min(x, 0)), y: sh <= H - BAR ? (H - BAR - sh) / 2 : Math.max(H - BAR - sh, Math.min(y, 0)) };
  }

  let queued = false;
  const requestRender = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; render(); }); } };
  function hiFor(cell) {
    const w = cell.w;
    if (!w.hi) { w.hi = new Image(); w.hi.onload = () => { w.hi.ready = true; requestRender(); }; w.hi.src = w.src; }
    return w.hi.ready ? w.hi : null;
  }
  // Vorschaubild eines Werks, bei Bedarf nachladen (beim Filtern kommen Werke dazu, die anfangs nicht in der Figur waren)
  function thumbFor(w) {
    if (!w.imgEl) { w.imgEl = new Image(); w.imgEl.onload = requestRender; w.imgEl.src = w.thumb; }
    return w.imgEl.naturalWidth ? w.imgEl : null;
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (state === "wait") return;
    const s = cellPx(), g = s * GAP, t = s - g, wantHi = t > 64 || t * dpr > THUMB * 1.15;   // nah: ganze Werke statt quadratischer Vorschau
    for (const cell of cells) {
      if (cell.a <= 0.003) continue;
      let x = O + cell.c * s + g / 2, y = Q + cell.r * s + g / 2, tt = t;
      if (x > W || y > H || x + t < 0 || y + t < 0) continue;
      if (cell.sc !== 1) { tt = t * cell.sc; x += (t - tt) / 2; y += (t - tt) / 2; }
      const key = cell.c + "," + cell.r;
      ctx.globalAlpha = cell.a * (key === hoverKey ? hoverA : 1);
      const hi = wantHi && hiFor(cell), th = thumbFor(cell.w);
      if (hi) {
        const iw = hi.naturalWidth, ih = hi.naturalHeight, k = Math.min(tt / iw, tt / ih), dw = iw * k, dh = ih * k;
        ctx.drawImage(hi, x + (tt - dw) / 2, y + (tt - dh) / 2, dw, dh);    // ganzes Werk, echtes Format
      } else if (wantHi && th) {
        ctx.globalAlpha *= .35; ctx.drawImage(th, x, y, tt, tt);            // lädt noch: Vorschau zart
      } else if (th) ctx.drawImage(th, x, y, tt, tt);
      else { ctx.fillStyle = "#ececea"; ctx.fillRect(x, y, tt, tt); }
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    if (state === "done") { const c = clampPan(O, Q); O = pe = c.x; Q = ve = c.y; }
    else ({ x: O, y: Q } = centre(), pe = O, ve = Q);
    render();
  }

  // --- Federung zu Ziel-Zoom und -Position: gleitet weich nach, schwingt ganz leicht aus ---
  const STIFF = 0.085, DAMP = 0.80;                        // leicht unterdämpft: minimaler Bounce
  let vR = 0, vO = 0, vQ = 0;
  function glide() {
    vR = (vR + (ze - R) * STIFF) * DAMP;
    vO = (vO + (pe - O) * STIFF) * DAMP;
    vQ = (vQ + (ve - Q) * STIFF) * DAMP;
    R += vR; O += vO; Q += vQ;
    render();
    const still = Math.abs(ze - R) < .0008 && Math.abs(pe - O) < .3 && Math.abs(ve - Q) < .3 && Math.abs(vR) < .0006 && Math.abs(vO) < .2 && Math.abs(vQ) < .2;
    if (still) { R = ze; O = pe; Q = ve; vR = vO = vQ = 0; render(); glideRaf = null; }
    else glideRaf = requestAnimationFrame(glide);
  }
  const startGlide = () => { if (reduced) { R = ze; O = pe; Q = ve; return render(); } if (!glideRaf) glideRaf = requestAnimationFrame(glide); };
  // Ziel so begrenzen, wie es beim Ziel-Zoom erlaubt wäre
  function clampTarget() {
    const s = cellPx(ze), sw = COLS * s, sh = ROWS * s;
    pe = sw <= W ? (W - sw) / 2 : Math.max(W - sw, Math.min(pe, 0));
    ve = sh <= H - BAR ? (H - BAR - sh) / 2 : Math.max(H - BAR - sh, Math.min(ve, 0));
  }
  function zoomTo(z, cx = W / 2, cy = H / 2) {
    const s0 = cellPx(), s1 = cellPx(z);
    pe = cx - (cx - O) / s0 * s1; ve = cy - (cy - Q) / s0 * s1; ze = z;
    clampTarget(); startGlide();
  }
  function tween(ms, toR, toXY, done) {
    cancelAnimationFrame(glideRaf); glideRaf = null; vR = vO = vQ = 0;
    const r0 = R, x0 = O, y0 = Q, t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / ms), e = ease3(p);
      R = r0 + (toR - r0) * e;
      const to = toXY();
      O = x0 + (to.x - x0) * e; Q = y0 + (to.y - y0) * e; pe = O; ve = Q;
      render();
      if (p < 1) requestAnimationFrame(step); else { R = ze = toR; done && done(); }
    };
    requestAnimationFrame(step);
  }

  // --- Hover ---
  function setHover(key) {
    if (key === hoverKey) return;
    hoverKey = key; hoverA = 1; hoverT0 = performance.now();
    cancelAnimationFrame(hoverRaf);
    if (!key) return render();
    const anim = () => {
      const p = Math.min(1, (performance.now() - hoverT0) / HOVER_MS);
      hoverA = 1 + (HOVER_ALPHA - 1) * p; render();
      if (p < 1) hoverRaf = requestAnimationFrame(anim);
    };
    hoverRaf = requestAnimationFrame(anim);
  }
  function cellAt(clientX, clientY) {
    const b = canvas.getBoundingClientRect(), s = cellPx();
    const gx = (clientX - b.left - O) / s, gy = (clientY - b.top - Q) / s;
    const cell = byPos.get(Math.floor(gx) + "," + Math.floor(gy));
    if (!cell || cell.a < .5) return null;
    const fx = gx - cell.c, fy = gy - cell.r;
    return fx >= GAP / 2 && fx <= 1 - GAP / 2 && fy >= GAP / 2 && fy <= 1 - GAP / 2 ? cell : null;
  }

  // --- Ziehen, Werfen, Klick, Pinch ---
  let dragging = false, moved = false, sx = 0, sy = 0, so = 0, sq = 0, lastT = 0, velX = 0, velY = 0, lastX = 0, lastY = 0, pinch = null;
  const pointers = new Map();
  canvas.addEventListener("pointerdown", e => {
    if (state !== "done" || (e.pointerType === "mouse" && e.button !== 0)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      dragging = false; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), r: R };
      return;
    }
    dragging = true; moved = false;
    sx = e.clientX; sy = e.clientY; so = O; sq = Q; lastT = Date.now(); velX = velY = 0; lastX = O; lastY = Q;
    pe = O; ve = Q; ze = R;
    stage.classList.add("is-grabbing");
  });
  canvas.addEventListener("pointermove", e => {
    if (state !== "done") return;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()], bx = canvas.getBoundingClientRect();
      const z = Math.min(ZOOM_MAX, Math.max(fitZoom(), pinch.r * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d));
      const mx = (a.x + b.x) / 2 - bx.left, my = (a.y + b.y) / 2 - bx.top, s0 = cellPx(), s1 = cellPx(z);
      O = pe = mx - (mx - O) / s0 * s1; Q = ve = my - (my - Q) / s0 * s1; R = ze = z;
      return render();
    }
    if (dragging) {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 3) { moved = true; setHover(null); }
      if (moved) {
        const c = clampPan(so + dx, sq + dy), now = Date.now(), dt = now - lastT;
        if (dt > 0) { velX = (c.x - lastX) / dt * 16; velY = (c.y - lastY) / dt * 16; }
        lastT = now; lastX = c.x; lastY = c.y; pe = c.x; ve = c.y; startGlide();
      }
      return;
    }
    if (e.pointerType !== "mouse") return;
    const cell = cellAt(e.clientX, e.clientY);
    setHover(cell ? cell.c + "," + cell.r : null);
    stage.classList.toggle("is-pointing", !!cell);
  });
  function release(e) {
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; return; }
    if (!dragging) return;
    dragging = false; stage.classList.remove("is-grabbing");
    if (Math.abs(velX) > .5 || Math.abs(velY) > .5) { pe += velX * THROW; ve += velY * THROW; clampTarget(); }
    startGlide();
  }
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", () => { if (!dragging) { setHover(null); stage.classList.remove("is-pointing"); } });
  canvas.addEventListener("click", e => {
    if (state !== "done" || moved) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell || !window.openWorks) return;
    const list = works.filter(w => match(w));
    window.openWorks(list, Math.max(0, list.indexOf(cell.w)));
  });
  // Rad: nach einem Klick in die Figur (oder im Vollbild) zoomt es an der Mausposition, sonst scrollt die Seite.
  // Trackpad-Pinch (ctrl + Rad) zoomt immer.
  let active = false;
  const setActive = on => { active = on; stage.classList.toggle("is-active", on); };
  canvas.addEventListener("pointerdown", () => setActive(true));
  stage.addEventListener("pointerleave", () => { if (!stage.classList.contains("is-full")) setActive(false); });
  canvas.addEventListener("wheel", e => {
    if (state !== "done" || !(e.ctrlKey || active || stage.classList.contains("is-full"))) return;
    e.preventDefault();
    const b = canvas.getBoundingClientRect(), cx = e.clientX - b.left, cy = e.clientY - b.top;
    const k = e.ctrlKey ? 0.01 : 0.0025;
    const z = Math.min(ZOOM_MAX, Math.max(fitZoom(), ze * Math.exp(-e.deltaY * k))), s0 = cellPx(ze), s1 = cellPx(z);
    pe = cx - (cx - pe) / s0 * s1; ve = cy - (cy - ve) / s0 * s1; ze = z;
    clampTarget(); startGlide();
  }, { passive: false });
  canvas.addEventListener("dblclick", e => {
    if (state !== "done") return;
    const b = canvas.getBoundingClientRect();
    zoomTo(Math.min(ZOOM_MAX, Math.max(ze * 2.5, fitZoom() * 4)), e.clientX - b.left, e.clientY - b.top);
  });
  // Vollbild: wie im Original-Experiment, Esc oder Knopf schließt
  const fullBtns = $$("[data-fg-full]");
  function setFull(on) {
    stage.classList.toggle("is-full", on);
    document.documentElement.classList.toggle("is-locked", on);
    fullBtns.forEach(b => (b.textContent = on ? (de() ? "Schließen" : "Close") : (de() ? "Vollbild" : "Full screen")));
    setActive(on);
    resize();
    if (state === "done") { cancelAnimationFrame(glideRaf); glideRaf = null; vR = vO = vQ = 0; ze = R = fitZoom() * (on ? 1.6 : 1); const c = centre(); pe = O = c.x; ve = Q = c.y; const cl = clampPan(O, Q); O = pe = cl.x; Q = ve = cl.y; render(); }
  }
  fullBtns.forEach(b => b.addEventListener("click", () => setFull(!stage.classList.contains("is-full"))));
  addEventListener("keydown", e => { if (e.key === "Escape" && stage.classList.contains("is-full") && !document.querySelector(".sheet.is-open")) setFull(false); });
  const on = (sel, fn) => $$(sel).forEach(b => b.addEventListener("click", () => state === "done" && fn()));
  on("[data-fg-in]", () => zoomTo(Math.min(ZOOM_MAX, ze * ZOOM_STEP)));
  on("[data-fg-out]", () => zoomTo(Math.max(fitZoom(), ze / ZOOM_STEP)));
  on("[data-fg-fit]", () => tween(900, fitZoom(), () => centre(), null));


  // --- Filter: Chips, Zähler, Panel ---
  const panel = $("[data-filter-panel]"), ft = $("[data-filter-toggle]");
  ft.addEventListener("click", () => {
    const open = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open", open);
    ft.setAttribute("aria-expanded", open);
  });
  function chip(key, value) {
    const c = document.createElement("button");
    c.className = "chip"; c.dataset.value = value; c.setAttribute("aria-pressed", "false");
    c.innerHTML = "<span></span> <small></small>";
    c.addEventListener("click", () => { sel[key].has(value) ? sel[key].delete(value) : sel[key].add(value); applyFilter(); });
    return c;
  }
  ARTISTS.forEach(a => $('[data-fg-chips="artist"]').appendChild(chip("artist", a)));
  TIMES.forEach(([k]) => $('[data-fg-chips="time"]').appendChild(chip("time", k)));
  function updateChips() {
    $$('[data-fg-chips] .chip').forEach(c => {
      const key = c.closest("[data-fg-chips]").dataset.fgChips, v = c.dataset.value;
      const n = works.filter(w => (key === "artist" ? w.name === v : w.time === v) && match(w, key)).length;
      const on = sel[key].has(v);
      $("span", c).textContent = key === "time" ? TIMES.find(t => t[0] === v)[de() ? 1 : 2] : v;
      $("small", c).textContent = `(${n})`;
      c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on);
      c.disabled = !n && !on;
    });
    $("[data-fg-count]").textContent = works.filter(w => match(w)).length;
  }
  // Kachel-Animationen (Aufbau und Tausch) laufen in einer gemeinsamen Schleife
  const SWAP_MS = 520, IN_MS = 700;
  let animRaf = null;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function animate() {
    const now = performance.now();
    let busy = false;
    for (const k of cells) {
      if (k.t0 === 0) continue;
      const p = (now - k.t0) / (k.next ? SWAP_MS : IN_MS);
      if (p < 0) { busy = true; continue; }                          // wartet noch auf seinen Einsatz
      if (k.next) {                                                  // Tausch: schrumpfen → Werk wechseln → wachsen
        if (p < .5) { const e = easeOut(p * 2); k.a = k.from * (1 - e); k.sc = 1 - .28 * e; busy = true; }
        else { if (k.next !== true) { k.w = k.next; } k.next = null; k.from = 0; k.t0 = now; k.a = 0; k.sc = .72; busy = true; }
      } else if (p < 1) { const e = easeOut(p); k.a = k.to * e; k.sc = .72 + .28 * (e + Math.sin(e * Math.PI) * .06); busy = true; }   // wächst herein, minimaler Überschwinger
      else { k.a = k.to; k.sc = 1; k.t0 = 0; }
    }
    render();
    animRaf = busy ? requestAnimationFrame(animate) : null;
  }
  const startAnim = () => { if (!animRaf) animRaf = requestAnimationFrame(animate); };

  function applyFilter() {
    updateChips();
    const hits = works.filter(w => match(w));
    const filtered = sel.artist.size || sel.time.size;
    const now = performance.now();
    cells.forEach((k, i) => {
      // gefiltert: die Treffer füllen die ganze Figur (reihum), sonst die ursprüngliche Belegung
      const w = !filtered ? works[i % works.length] : hits.length ? hits[i % hits.length] : null;
      k.to = w ? 1 : DIM;
      if (reduced) { if (w) k.w = w; k.a = k.to; k.sc = 1; k.t0 = 0; k.next = null; return; }
      if (w === k.w && k.a === k.to && !k.next) return;
      k.from = k.a; k.next = w && w !== k.w ? w : true;              // true: gleiches Werk, nur neu einblenden
      k.t0 = now + k.dist * 260 + k.jit * 160;                       // von der Mitte nach außen, leicht unregelmäßig
    });
    reduced ? render() : startAnim();
  }
  updateChips();
  new MutationObserver(updateChips).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  // --- Start, sobald der Bereich in die Nähe kommt: laden, von der Mitte aus einblenden, hineinzoomen ---
  addEventListener("resize", resize);
  resize();
  const load = src => new Promise(res => { const im = new Image(); im.onload = im.onerror = () => res(im); im.src = src; });
  let started = false;
  new IntersectionObserver((entries, obs) => {
    if (started || !entries.some(e => e.isIntersecting)) return;
    started = true; obs.disconnect();
    const uniq = [...new Set(cells.map(k => k.w))];
    Promise.all(uniq.map(w => load(w.thumb).then(im => (w.imgEl = im)))).then(() => {
      stage.classList.add("is-ready");
      R = ze = ZOOM_START;
      { const k = cells[Math.floor(cells.length * .45)], s = cellPx(); const c = clampPan(W / 2 - (k.c + .5) * s, (H - BAR) / 2 - (k.r + .5) * s); O = pe = c.x; Q = ve = c.y; }
      state = "done"; stage.classList.add("is-live");
      const now = performance.now(), s = cellPx();
      cells.forEach(k => {
        k.to = 1;
        if (reduced) { k.a = 1; return; }
        // Abstand zur Bildmitte bestimmt den Einsatz, dazu etwas Zufall: baut sich ruhig von innen auf
        const dx = (O + (k.c + .5) * s - W / 2) / W, dy = (Q + (k.r + .5) * s - H / 2) / H;
        k.a = 0; k.sc = .72; k.next = null; k.from = 0;
        k.t0 = now + Math.min(1.2, Math.hypot(dx, dy)) * 520 + k.jit * 380;
      });
      reduced ? render() : startAnim();
    });
  }, { rootMargin: "300px 0px" }).observe(stage);
})();
