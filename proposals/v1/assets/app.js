/* Leopold Museum – Konzeptentwurf */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const SHOT = params.has("shot");                                   // Prüfmodus für Screenshots
  if (SHOT) document.documentElement.classList.add("is-shot");
  const reduced = SHOT || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = n => String(n).padStart(2, "0");
  const IMG = id => `assets/img/works/${id}.jpg`;
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ───────── Sprache ───────── */

  const I18N = window.I18N;
  let lang = params.get("lang") || store.get("lang") || "de";
  if (!I18N[lang]) lang = "de";
  const T = k => I18N[lang][k];
  // Werkfelder: englische Fassung aus der Online Sammlung, sonst Deutsch
  const F = (w, k) => (lang === "en" && w[k + "_en"]) || w[k] || "";
  const firstMove = s => (s || "").split(",")[0].trim().replace(" I ", " / ");
  const shortDate = s => (s || "").split(",")[0];

  /* ───────── Daten ───────── */

  const WORKS = (window.WORKS || []).map(w => ({ ...w, move: firstMove(w.movement) }));
  const byId = new Map(WORKS.map(w => [w.id, w]));
  // Filterwert bleibt deutsch, die Beschriftung folgt der Sprache
  const moveLabel = {};
  WORKS.forEach(w => { if (w.move) moveLabel[w.move] = { de: w.move, en: firstMove(w.movement_en) || w.move }; });

  /* ───────── Start ───────── */

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  if (SHOT) document.body.classList.remove("is-loading");
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 900))]).then(() => {
    requestAnimationFrame(() => document.body.classList.remove("is-loading"));
    splitLines();
  });

  /* ───────── Öffnungsstatus (Wiener Zeit) ───────── */

  function viennaNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Vienna", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")), mins: (+get("hour") % 24) * 60 + +get("minute") };
  }
  function updateStatus() {
    const { day, mins } = viennaNow();
    const open = day !== 2 && mins >= 600 && mins < 1080;
    let long, ticker;
    if (open) { long = T("statusOpen"); ticker = T("tickerOpen"); }
    else if (day !== 2 && mins < 600) { long = T("statusOpensToday"); ticker = T("tickerOpensToday"); }
    else if (day === 2 || day === 1) { long = T("statusClosedWed"); ticker = T("tickerClosedWed"); }   // Dienstag Ruhetag
    else { long = T("statusClosedTomorrow"); ticker = T("tickerClosedTomorrow"); }
    $("[data-status-line]").textContent = long;
    const big = open ? "bigOpen" : (day !== 2 && mins < 600) ? "bigOpensToday" : (day === 2 || day === 1) ? "bigClosedWed" : "bigClosedTomorrow";
    $$("[data-status-big]").forEach(s => (s.textContent = T(big)));
    $$("[data-plan-dot]").forEach(d => d.classList.toggle("is-closed", !open));
    $$("[data-ticker]").forEach(s => (s.textContent = ticker));
    $("[data-ticket-pill]").classList.toggle("is-closed", !open);
  }
  setInterval(updateStatus, 30000);

  /* ───────── Menü ───────── */

  const menu = $("[data-menu]");
  // Panel so platzieren, dass sein Logo exakt auf dem Logo im Kopf liegt (kein Springen)
  function anchorMenu() {
    const panel = $(".menu__panel"), src = $(".top__logo img"), dst = $(".menu__logo img");
    const logoLink = $(".menu__logo");
    panel.classList.remove("is-anchored"); panel.style.left = panel.style.top = ""; logoLink.style.transform = "";
    const s = src.getBoundingClientRect();
    if (s.width < 10 || $(".top").classList.contains("is-compact")) {   // Kopf eingeklappt: Panel klappt genau aus der Pille auf
      const pill = $(".pill").getBoundingClientRect();
      panel.classList.add("is-anchored", "is-from-pill");
      panel.style.left = pill.left + "px";
      panel.style.top = pill.top + "px";
      panel.style.width = pill.width + "px";
      return;
    }
    panel.classList.remove("is-from-pill"); panel.style.width = "";
    const p = panel.getBoundingClientRect(), d = dst.getBoundingClientRect();
    const left = s.left - (d.left - p.left), top = s.top - (d.top - p.top);
    panel.classList.add("is-anchored");
    panel.style.left = Math.max(12, Math.min(left, innerWidth - p.width - 12)) + "px";
    panel.style.top = top + "px";
    // was das Panel am Rand nicht ausgleichen kann (mobil), gleicht das Logo selbst aus
    const d2 = dst.getBoundingClientRect();
    logoLink.style.transform = `translate(${s.left - d2.left}px, ${s.top - d2.top}px)`;
  }
  function setMenu(open) {
    if (open) { anchorMenu(); void $(".menu__panel").offsetWidth; }   // Position übernehmen, bevor geöffnet wird: nichts gleitet herein
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", !open);
    document.documentElement.classList.toggle("is-menu-open", open);   // Seite steht still, solange das Menü offen ist
    $$("[data-menu-open]").forEach(b => b.setAttribute("aria-expanded", open));
    if (open) setTimeout(() => $(".menu__close").focus(), 50);
  }
  $$("[data-menu-open]").forEach(b => b.addEventListener("click", () => setMenu(true)));
  // die ganze Pille öffnet das Menü, nicht nur das Symbol (auch die Figur links)
  $("[data-pill]").addEventListener("click", e => { if (e.target.closest("[data-menu-open]")) return; e.preventDefault(); setMenu(true); });
  $$("[data-menu-close]").forEach(b => b.addEventListener("click", () => setMenu(false)));
  $$("[data-menu-link]").forEach(a => a.addEventListener("click", () => setMenu(false)));
  $$("[data-lang]").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));

  /* ───────── Hero: Karten ───────── */

  const SLIDES = [
    { f: "w", work: 629, pos: "62% 50%", thumb: IMG("web-lm-04148") },
    { f: "t", kind: "open", bg: "#F6FF54", ink: "#111" },                       // grafische Folie: Öffnungshinweis, live
    { f: "s", img: "assets/img/ex/7314.jpg", pos: "35% 50%", thumb: "assets/img/ev/7499.jpg", thumbPos: "50% 30%", href: "#ausstellungen", fromEx: true },
    { f: "t", kind: "quote", bg: "#c8ab69", ink: "#000" },
    { f: "s", kind: "pass", bg: "#111", ink: "#fff" },                // grafische Folie: Jahreskarte, dreht sich in 3D                      // grafische Folie: Zitat Rudolf Leopold
    { f: "s", work: 527, pos: "50% 50%", thumb: IMG("web-lm-00454") },
    { f: "w", img: "assets/img/ex/vermittlung.jpg", pos: "64% 50%", thumb: "assets/img/ex/vermittlung.jpg", thumbPos: "62% 40%", href: "#kalender", tx: "slidePeople", credit: "peopleCredit" },
    { f: "t", img: "assets/img/ex/7374.jpg", pos: "58% 50%", thumb: "assets/img/ex/7374.jpg", thumbPos: "30% 60%", href: "#ausstellungen", fromEx: true },
    { f: "s", kind: "type", bg: "#1f3b2d", ink: "#f4f1ea", href: "#ausstellungen" },   // grafische Folie: Ausstellung nur als Text auf Farbe
    { f: "w", work: 164, pos: "50% 50%", thumb: IMG("web-lm-00631") },
    { f: "t", work: 646, pos: "50% 35%", thumb: IMG("web-lm-00642") },
    { f: "s", work: 273, pos: "50% 30%", thumb: IMG("web-lm-00188") },
    { f: "w", work: 269, pos: "40% 50%", thumb: IMG("web-lm-00716") },
    { f: "t", work: 526, pos: "50% 50%", thumb: IMG("web-lm-00655") },
    { f: "s", work: 188, pos: "50% 50%", thumb: IMG("web-lm-00282") }
  ].map(s => {
    const w = s.work ? byId.get(s.work) : null;
    return { ...s, w, img: s.img || (w && IMG(w.img)) };
  });

  const DURATION = 5200;
  const hero = $("[data-hero]");
  const track = $("[data-track]");
  const dotsEl = $("[data-dots]");
  document.documentElement.style.setProperty("--dur", DURATION + "ms");

  const cards = SLIDES.map((s, i) => {
    const el = document.createElement("article");
    el.className = "card no-anim" + (s.kind ? " card--g" : "");
    el.setAttribute("aria-roledescription", "Folie");
    if (s.kind) {
      el.style.setProperty("--g-bg", s.bg);
      el.style.setProperty("--g-ink", s.ink);
      const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>`;
      el.innerHTML = s.kind === "pass" ? `
      <img class="pass__bg" src="assets/img/pass-bg.jpg" alt="" draggable="false">
      <div class="card__g card__g--pass">
        <p class="g__kick" data-g="passKick"></p>
        <div class="pass" aria-hidden="true">
          <span class="pass__shadow"></span>
          <div class="pass__gl" data-pass3d></div>
          <div class="pass__card">
            <div class="pass__face pass__front">
              <img class="pass__art" src="assets/img/pass-schiele.jpg" alt="" draggable="false">
              <span class="pass__logo"><img src="assets/logo-white.svg" alt="" draggable="false"></span>
              <span class="pass__name">Leopold Card<small>Nur gültig mit Lichtbildausweis</small></span>
            </div>
            <div class="pass__face pass__back">
              <span class="pass__stripe"></span>
              <span class="pass__sign"></span>
              <span class="pass__logo pass__logo--back"><img src="assets/logo-white.svg" alt="" draggable="false"></span>
            </div>
          </div>
        </div>
        <div class="g__foot"><p data-g="passSub"></p><a class="g__cta" target="_blank" rel="noopener" data-g-href="urlPass"><span data-g="passCta"></span>${arrow}</a></div>
      </div>` : s.kind === "quote" ? `
      <div class="card__q">
        <blockquote class="q__text"><span data-g="quote1"></span><span class="q__l2" data-g="quote2"></span><span class="q__l3" data-g="quote3"></span></blockquote>
        <p class="q__by" data-g="quoteBy"></p>
        <img class="q__fig" src="assets/img/quote-figure.svg" alt="" draggable="false">
      </div>` : s.kind === "open" ? `
      <div class="card__g">
        <p class="g__kick"><i class="plan__dot" data-plan-dot></i><span data-g="openKick"></span></p>
        <p class="g__big" data-status-big></p>
        <div class="g__foot"><p data-g="openSub"></p><a class="g__cta" target="_blank" rel="noopener" data-g-href="urlTickets"><span data-g="openCta"></span>${arrow}</a></div>
      </div>` : `
      <div class="card__g">
        <p class="g__kick" data-g="typeKick"></p>
        <p class="g__big" data-g="typeTitle"></p>
        <div class="g__foot"><p data-g="typeSub"></p><a class="g__cta" href="${s.href}"><span data-g="typeCta"></span>${arrow}</a></div>
      </div>`;
      track.appendChild(el);
      return el;
    }
    el.innerHTML = `
      <img class="card__img" src="${s.img}" alt="" style="object-position:${s.pos}" ${i > 2 ? 'loading="lazy"' : ""} draggable="false">
      <div class="card__info">
        <div class="card__thumb"><img src="${s.thumb}" alt="" loading="lazy" draggable="false" style="object-position:${s.thumbPos || "50% 50%"}"></div>
        <div class="card__text"><b></b><span></span></div>
        <button class="card__view" tabindex="-1"></button>
      </div>
      <span class="card__credit"></span>`;
    track.appendChild(el);
    return el;
  });
  const dots = SLIDES.map((s, i) => {
    const d = document.createElement("button");
    d.className = "dot";
    d.setAttribute("role", "tab");
    d.addEventListener("click", () => go(i));
    dotsEl.appendChild(d);
    return d;
  });

  function textCards() {
    const texts = T("slides");
    let k = 0;
    cards.forEach((el, i) => {
      const s = SLIDES[i];
      if (s.kind) {
        $$("[data-g]", el).forEach(n => (n.textContent = T("g_" + n.dataset.g)));
        $$("[data-g-href]", el).forEach(n => (n.href = T(n.dataset.gHref)));
        const label = s.kind === "open" ? T("g_openKick") : s.kind === "quote" ? T("g_quoteBy") : s.kind === "pass" ? T("g_passKick") : T("g_typeTitle");
        el.setAttribute("aria-label", T("slideOf")(i + 1, SLIDES.length, label));
        dots[i].setAttribute("aria-label", label);
        return;
      }
      const [title, text] = s.tx ? T(s.tx) : texts[k++];
      $(".card__text b", el).textContent = title;
      $(".card__text span", el).textContent = text;
      $(".card__view", el).textContent = T("view");
      $(".card__credit", el).textContent = s.credit ? T(s.credit) : s.fromEx ? T("fromExhibition") : `${s.w.artist}, ${F(s.w, "title")}, ${shortDate(F(s.w, "date"))}`;
      el.setAttribute("aria-label", T("slideOf")(i + 1, SLIDES.length, title));
      dots[i].setAttribute("aria-label", title);
    });
  }

  let current = 0;
  let timer = null;
  let dragX = 0;

  // Breiten der drei Formate aus der Höhe des Sliders; mobil alle gleich breit
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;width:var(--card-w)";
  hero.appendChild(probe);
  function widths() {
    const mobile = innerWidth <= 760, base = probe.offsetWidth, H = hero.clientHeight;
    const fmt = { t: base, s: Math.min(H * .85, innerWidth * .48), w: Math.min(H * 1.3, innerWidth * .62) };
    return { mobile, ws: SLIDES.map(s => (mobile ? base : fmt[s.f || "t"])), base };
  }

  // Position jeder Karte relativ zur aktiven: aktiv links vom Mittelfeld (mobil ganz links), die vorige ragt links herein
  function layout(animate = true) {
    const { mobile, ws, base } = widths();
    const n = cards.length, gap = 10;
    const wa = ws[current];
    const anchor = mobile ? 12 : Math.max(70, Math.min(base + gap, innerWidth - wa - 120));   // aktive Karte ganz sichtbar, die nächste ragt rechts herein
    const xs = new Array(n);
    xs[current] = anchor;
    for (let o = 1; o <= n / 2; o++) {                                   // nach rechts
      const i = (current + o) % n, prev = (current + o - 1) % n;
      xs[i] = xs[prev] + ws[prev] + gap;
    }
    for (let o = 1; o < n / 2; o++) {                                    // nach links: die vorige endet 60 px vom Rand
      const i = (current - o + n) % n, next = (current - o + 1 + n) % n;
      xs[i] = o === 1 ? (mobile ? -ws[i] - 40 + 12 - gap : 60 - ws[i]) : xs[next] - ws[i] - gap;
    }
    cards.forEach((el, i) => {
      el.style.width = ws[i] + "px";
      const x = xs[i];
      // Karten, die über den Rand springen würden, ohne Animation umsetzen
      const prevX = parseFloat(el.dataset.x || x);
      const jump = Math.abs(x - prevX) > innerWidth * 1.2;
      el.classList.toggle("no-anim", !animate || jump || !!dragX);
      el.style.setProperty("--x", (x + dragX) + "px");
      el.dataset.x = x;
      el.classList.toggle("is-active", i === current);
      el.inert = i !== current;
    });
    dots.forEach((d, i) => {
      d.classList.toggle("is-active", i === current);
      d.setAttribute("aria-selected", i === current);
    });
  }

  function go(i) {
    current = (i + cards.length) % cards.length;
    const d = dots[current];
    d.classList.remove("is-active"); void d.offsetWidth;          // Fortschritt neu starten
    layout(true);
    schedule();
  }
  let paused = false;
  function schedule() {
    clearTimeout(timer);
    if (reduced || paused) return;
    timer = setTimeout(() => go(current + 1), DURATION);
  }

  layout(false);
  requestAnimationFrame(() => cards.forEach(c => c.classList.remove("no-anim")));
  if (SHOT) { current = (+params.get("shot") || 1) - 1; layout(false); }
  schedule();
  addEventListener("resize", () => layout(false));

  // Pause beim Hovern
  hero.addEventListener("mouseenter", () => { if (reduced) return; clearTimeout(timer); document.body.classList.add("is-hero-paused"); });
  hero.addEventListener("mouseleave", () => {
    if (reduced || paused) return;
    document.body.classList.remove("is-hero-paused");
    const after = getComputedStyle(dots[current], "::after").transform;
    const done = after && after !== "none" ? parseFloat(after.split("(")[1]) : 0;
    clearTimeout(timer);
    timer = setTimeout(() => go(current + 1), Math.max(400, DURATION * (1 - done)));
  });

  // Ziehen und Wischen
  let startX = null, moved = false;
  hero.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    startX = e.clientX; moved = false;
    clearTimeout(timer);
  });
  addEventListener("pointermove", e => {
    if (startX === null) return;
    dragX = (e.clientX - startX) * .9;
    if (Math.abs(dragX) > 6) { moved = true; layout(false); }
  });
  addEventListener("pointerup", () => {
    if (startX === null) return;
    const d = dragX;
    startX = null; dragX = 0;
    if (Math.abs(d) > 60) go(current + (d < 0 ? 1 : -1));
    else { layout(true); schedule(); }
  });

  cards.forEach((el, i) => el.addEventListener("click", e => {
    if (moved) { e.preventDefault(); return; }
    if (i !== current) { go(i); return; }
    const s = SLIDES[i];
    if (s.work) openSheet(s.work, WORKS);
    else if (s.href) document.querySelector(s.href).scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }));

  addEventListener("keydown", e => {
    if (sheet.classList.contains("is-open") || menu.classList.contains("is-open")) return;
    if (hero.getBoundingClientRect().bottom < innerHeight * .4) return;
    if (e.key === "ArrowRight") go(current + 1);
    if (e.key === "ArrowLeft") go(current - 1);
  });

  /* ───────── Scroll ───────── */

  const top = $("[data-top]");
  let ticking = false;
  function onScroll() {
    top.classList.toggle("is-compact", scrollY > 40);   // Logo und Punkte treten zurück, Pille wird breit
    $(".pill__fig").tabIndex = scrollY > 40 ? 0 : -1;
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ───────── Statement: Zeile für Zeile ───────── */

  const intro = $("[data-intro]");
  function splitLines() {
    const keepIn = intro.classList.contains("is-in");
    intro.textContent = "";
    const words = T("intro").split(" ").map(w => {
      const s = document.createElement("span");
      s.textContent = w;
      s.style.whiteSpace = "nowrap";               // Wörter mit Bindestrich nicht beim Messen trennen
      intro.appendChild(s);
      intro.appendChild(document.createTextNode(" "));
      return s;
    });
    const lines = [];
    let y = null;
    words.forEach(s => {
      if (s.offsetTop !== y) { lines.push([]); y = s.offsetTop; }
      lines[lines.length - 1].push(s.textContent);
    });
    intro.innerHTML = lines.map((l, i) => `<span class="ln"><span style="transition-delay:${i * 80}ms">${l.join(" ")}</span></span>`).join("");
    if (SHOT || reduced || keepIn) intro.classList.add("is-in");
    else revealObs.observe(intro);
  }
  let resizeT;
  addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(splitLines, 150); });

  /* ───────── Einblenden ───────── */

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      revealObs.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: .05 });

  function rise(els, step = 60) {
    els.forEach((el, i) => {
      el.classList.add("rise");
      el.style.setProperty("--d", `${(i % 4) * step}ms`);
      if (SHOT) el.classList.add("is-in"); else revealObs.observe(el);
    });
  }
  rise($$(".u-card"), 50);
  rise([$(".work__head"), $(".visit")]);

  // Kartenreihen (Aktuell, Kalender) mit der Maus ziehen
  let row = null, rx = null, rs = 0, rmoved = false;
  $$("[data-drag]").forEach(r => {
    r.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; row = r; rx = e.clientX; rs = r.scrollLeft; rmoved = false; });
    r.addEventListener("click", e => { if (rmoved) e.preventDefault(); }, true);
  });
  addEventListener("pointermove", e => {
    if (rx === null) return;
    const d = e.clientX - rx;
    if (Math.abs(d) > 4) { rmoved = true; row.classList.add("is-dragging"); }
    row.scrollLeft = rs - d;
  });
  addEventListener("pointerup", () => { if (!row) return; const r = row; rx = null; row = null; setTimeout(() => r.classList.remove("is-dragging"), 0); });

  /* ───────── Sammlung ───────── */
  // nur auf Seiten mit dem Werk-Raster (Variante B zeigt stattdessen die Figur aus Werken)
  const coll = $("[data-grid]") ? (() => {

  const INITIAL = 8;
  const grid = $("[data-grid]");
  const state = { all: false, artist: new Set(), movement: new Set() };

  const imgObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const img = e.target;
      img.src = img.dataset.src;
      const done = () => img.classList.add("is-loaded");
      img.decode ? img.decode().then(done, done) : img.addEventListener("load", done);
      imgObs.unobserve(img);
    });
  }, { rootMargin: "300px 0px" });

  WORKS.forEach((w, i) => {
    const el = document.createElement("button");
    el.className = "tile";
    el.innerHTML = `
      <div class="tile__img"><img data-src="${IMG(w.img)}" alt=""></div>
      <p class="tile__title"></p>
      <p class="tile__desc"><b></b> <span></span></p>`;
    el.addEventListener("click", () => openSheet(w.id, visible));
    el.hidden = i >= INITIAL;
    w.el = el;
    grid.appendChild(el);
    const img = $("img", el);
    if (SHOT) { img.src = img.dataset.src; img.classList.add("is-loaded"); } else imgObs.observe(img);
  });
  rise(WORKS.slice(0, INITIAL).map(w => w.el), 70);

  function textTiles() {
    WORKS.forEach(w => {
      $(".tile__title", w.el).textContent = F(w, "title");
      $(".tile__desc b", w.el).textContent = `${w.artist}, ${shortDate(F(w, "date"))}.`;
      $(".tile__desc span", w.el).textContent = F(w, "technique");
      $("img", w.el).alt = `${w.artist}, ${F(w, "title")}`;
    });
  }

  const matches = (w, skip) =>
    (skip === "artist" || !state.artist.size || state.artist.has(w.artist)) &&
    (skip === "movement" || !state.movement.size || state.movement.has(w.move));

  function buildChips(key, field) {
    const box = $(`[data-chips="${key}"]`);
    const counts = {};
    WORKS.forEach(w => { if (w[field]) counts[w[field]] = (counts[w[field]] || 0) + 1; });
    Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, "de")).forEach(v => {
      const c = document.createElement("button");
      c.className = "chip";
      c.dataset.value = v;
      c.setAttribute("aria-pressed", "false");
      c.innerHTML = `<span></span> <small></small>`;
      c.addEventListener("click", () => {
        state[key].has(v) ? state[key].delete(v) : state[key].add(v);
        clearFocus();                                  // Hand-Filter löst den Schwerpunkt
        apply();
      });
      box.appendChild(c);
    });
  }
  buildChips("artist", "artist");
  buildChips("movement", "move");

  function updateChips() {
    [["artist", "artist"], ["movement", "move"]].forEach(([key, field]) => {
      $$(`[data-chips="${key}"] .chip`).forEach(c => {
        const v = c.dataset.value;
        const n = WORKS.filter(w => w[field] === v && matches(w, key)).length;
        const on = state[key].has(v);
        $("span", c).textContent = key === "movement" ? moveLabel[v][lang] : v;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", on);
        $("small", c).textContent = `(${n})`;
        c.disabled = !n && !on;
      });
    });
  }

  let visible = WORKS.slice(0, INITIAL);
  let applyT = null;
  function apply() {
    updateChips();
    let next = WORKS.filter(w => matches(w));
    if (!state.all && !state.artist.size && !state.movement.size) next = next.slice(0, INITIAL);   // gefiltert: alle Treffer
    const nextSet = new Set(next);
    visible.forEach(w => { if (!nextSet.has(w)) w.el.classList.add("is-out"); });
    clearTimeout(applyT);
    applyT = setTimeout(() => {
      WORKS.forEach(w => {
        const show = nextSet.has(w);
        const wasHidden = w.el.hidden;
        w.el.hidden = !show;
        w.el.classList.remove("is-out", "rise");
        w.el.style.transitionDelay = "";
        if (show && (wasHidden || !visible.includes(w))) w.el.classList.add("is-new");
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        next.forEach((w, i) => {
          if (!w.el.classList.contains("is-new")) return;
          w.el.style.transitionDelay = `${Math.min(i, 16) * 30}ms`;
          w.el.classList.remove("is-new");
        });
      }));
      visible = next;
      $("[data-count]").textContent = WORKS.filter(w => matches(w)).length;
    }, reduced ? 0 : 260);
  }

  const filter = $("[data-filter]");
  const showAll = $("[data-show-all]");
  const allLabel = () => ($("[data-all-label]").textContent = T(state.all ? "less" : "seeAll"));
  showAll.addEventListener("click", () => {
    state.all = !state.all;
    showAll.classList.toggle("is-open", state.all);
    allLabel();
    if (!state.all) { state.artist.clear(); state.movement.clear(); clearFocus(); }
    apply();
  });
  // Sammlungsschwerpunkte: setzen den Filter des Rasters darunter
  const FOCUS = {
    schiele:       { artist: ["Egon Schiele"] },
    klimt:         { artist: ["Gustav Klimt"] },
    vienna:        { movement: ["Jugendstil", "Secession", "Symbolismus"] },
    biedermeier:   { movement: ["Biedermeier", "Stimmungsimpressionismus", "Naturalismus / Realismus"] },
    expressionism: { movement: ["Expressionismus"] }
  };
  const focusBox = $("[data-focus]");
  let focusKey = null;
  function clearFocus() {
    focusKey = null;
    focusBox.classList.remove("has-on");
    $$(".focus__item", focusBox).forEach(b => { b.classList.remove("is-on"); b.setAttribute("aria-pressed", "false"); });
  }
  $$(".focus__item", focusBox).forEach(b => b.addEventListener("click", () => {
    const key = b.dataset.focusKey;
    state.artist.clear();
    state.movement.clear();
    if (focusKey === key) { clearFocus(); apply(); return; }
    clearFocus();
    focusKey = key;
    (FOCUS[key].artist || []).forEach(v => state.artist.add(v));
    (FOCUS[key].movement || []).forEach(v => state.movement.add(v));
    b.classList.add("is-on");
    b.setAttribute("aria-pressed", "true");
    focusBox.classList.add("has-on");
    if (!state.all) {                                   // alle Werke zeigen, Filterleiste einblenden
      state.all = true;
      showAll.classList.add("is-open");
      allLabel();
    }
    apply();
  }));

  const panel = $("[data-filter-panel]");
  const ft = $("[data-filter-toggle]");
  ft.addEventListener("click", () => {
    const open = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open", open);
    ft.setAttribute("aria-expanded", open);
  });

    return { textTiles, updateChips, allLabel };
  })() : null;

  /* ───────── Werkansicht ───────── */

  const sheet = $("[data-sheet]");
  const sheetImg = $("[data-sheet-img]");
  const sheetBody = $("[data-sheet-body]");
  let list = WORKS, idx = 0, lastFocus = null;
  const saved = new Set();

  function sheetText(w) {
    if (w.ext) return `
      <h3 class="sheet__title">${w.title}</h3>
      <p class="sheet__artist">${w.artist || ""}</p>
      <dl class="sheet__dl">${w.date ? `<div><dt>${T("fDate")}</dt><dd>${w.date}</dd></div>` : ""}</dl>
      <div class="sheet__actions"><a class="is-line" href="${w.url}" target="_blank" rel="noopener">${T("onlineCollection")}</a></div>`;
    const rows = [
      [T("fDate"), F(w, "date")],
      [T("fMovement"), F(w, "movement").replace(/ I /g, " / ")],
      [T("fTechnique"), F(w, "technique")],
      [T("fSize"), F(w, "size").replace("×", " × ")],
      [T("fCredit"), F(w, "credit")]
    ].filter(r => r[1]);
    const url = lang === "en" ? "https://onlinecollection.leopoldmuseum.org/en/" : `https://onlinecollection.leopoldmuseum.org/objekt/${w.slug}/`;
    return `
      <h3 class="sheet__title">${F(w, "title")}</h3>
      <p class="sheet__artist">${w.artist}<span>${F(w, "bio")}</span></p>
      <dl class="sheet__dl">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      <div class="sheet__actions">
        <button class="is-dark" data-save="${w.id}">${T(saved.has(w.id) ? "saved" : "save")}</button>
        <a class="is-line" href="${url}" target="_blank" rel="noopener">${T("onlineCollection")}</a>
      </div>`;
  }

  function render(w, swap) {
    const old = $("img", sheetImg);
    const img = new Image();
    img.alt = w.ext ? `${w.artist}, ${w.title}` : `${w.artist}, ${F(w, "title")}`;
    img.src = w.ext ? w.full : IMG(w.img);
    if (w.ext) img.onerror = () => { img.onerror = null; img.src = w.src; };
    const show = () => { if (old) old.remove(); sheetImg.appendChild(img); requestAnimationFrame(() => img.classList.add("is-loaded")); };
    const whenReady = () => (img.complete ? show() : img.addEventListener("load", show, { once: true }));
    if (old) { old.classList.add("is-leaving"); setTimeout(whenReady, 200); } else whenReady();

    sheetBody.classList.remove("is-in");
    setTimeout(() => {
      sheetBody.innerHTML = sheetText(w);
      requestAnimationFrame(() => sheetBody.classList.add("is-in"));
    }, swap ? 180 : 0);
    $("[data-sheet-pos]").textContent = `${pad(idx + 1)} / ${pad(list.length)}`;
  }

  function openSheet(id, from) {
    list = from && from.some(w => w.id === id) ? from : WORKS;
    idx = Math.max(0, list.findIndex(w => w.id === id));
    lastFocus = document.activeElement;
    sheetImg.innerHTML = "";
    render(list[idx]);
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("is-locked");
    clearTimeout(timer);
    setTimeout(() => $(".sheet__side", sheet).focus({ preventScroll: true }), 350);   // Fokus im Dialog, ohne Ring am Kreuz
  }
  // von außen: eine eigene Werkliste öffnen (z. B. Figur aus Werken)
  window.openWorks = (items, i) => {
    list = items; idx = i;
    lastFocus = document.activeElement;
    sheetImg.innerHTML = "";
    render(list[idx]);
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("is-locked");
    clearTimeout(timer);
    setTimeout(() => $(".sheet__side", sheet).focus({ preventScroll: true }), 350);
  };
  function closeSheet() {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("is-locked");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
    schedule();
  }
  function step(d) { idx = (idx + d + list.length) % list.length; render(list[idx], true); }

  $$("[data-sheet-close]", sheet).forEach(b => b.addEventListener("click", closeSheet));
  $("[data-sheet-prev]").addEventListener("click", () => step(-1));
  $("[data-sheet-next]").addEventListener("click", () => step(1));
  sheet.addEventListener("click", e => {
    const b = e.target.closest("[data-save]");
    if (!b) return;
    const id = +b.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    b.textContent = T(saved.has(id) ? "saved" : "save");
  });
  addEventListener("keydown", e => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) return setMenu(false);
    if (!sheet.classList.contains("is-open")) return;
    if (e.key === "Escape") closeSheet();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });

  /* ───────── Newsletter ───────── */

  const news = $("[data-news]");
  const newsInput = $("input", news);
  const newsMsg = $("[data-news-msg]");
  let newsState = null;
  const newsText = () => { if (newsState) newsMsg.textContent = T(newsState); };
  newsInput.addEventListener("input", () => { news.classList.remove("is-error"); newsMsg.classList.remove("is-on"); newsState = null; });
  news.addEventListener("submit", e => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newsInput.value.trim());
    news.classList.toggle("is-error", !ok);
    newsState = ok ? "newsOk" : "newsErr";
    newsText();
    newsMsg.classList.add("is-on");
  });

  /* ───────── Kalender ───────── */

  // Termine kommen aus events.js (gemeinsam mit der Unterseite event.html)
  const EVENTS = window.EVENTS;
  const MONTHS = ["2026-10", "2026-11", "2026-12"];
  const STEP = 3;                                   // Termine pro Plus
  // Masonry: feste Spaltenbreite, Höhen im Wechsel (px); der erste Termin ist der höchste
  const RATIOS = [5 / 3, 5 / 4, 1, 5 / 4, 5 / 3, 1, 5 / 4, 5 / 3, 1];   // Höhe/Breite: 3:5, 4:5, 1:1 im Wechsel
  const DAY_H = 46;                                  // Höhe der Datumszeile über der Box
  const INFO_H = 108;                                // Art und Uhrzeit unter der Box (wie bei den Ausstellungen)
  // Farben wie in den anderen Versionen: kräftiges Rot, Yves-Klein-Blau, dazu Beige, Grau und ein sehr entsättigtes Grün.
  // Auf allen steht schwarze Schrift, nur auf dem tiefen Blau weiße (Schwarz wäre dort nicht lesbar).
  const PALETTE = [
    { c: "#002fa7", fg: "#fff" },   // Yves-Klein-Blau
    { c: "#e8dfcf" },               // Beige
    { c: "#ee2131" },               // kräftiges Rot
    { c: "#cfccc5" },               // Grau
    { c: "#b5bcad" }                // sehr entsättigtes Grün
  ];
  // zwischendurch ein Bild aus der Ausstellung, zu der der Termin gehört
  const EV_IMG = Object.fromEntries(Object.entries(window.EV_META).filter(([, m]) => m.img).map(([k, m]) => [k, [m.img, m.pos]]));
  const isImgTile = i => i % 4 === 2;
  // jede Bild-Kachel zeigt einen anderen Ausschnitt (Größe, Position), damit sich nichts wiederholt
  const CROPS = [["cover", ""], ["240%", "28% 22%"], ["300%", "72% 30%"], ["210%", "50% 85%"]];
  const COL_W = 240;                                 // feste Spaltenbreite wie die Ausstellungskacheln
  const calCols = () => (innerWidth <= 760 ? 2 : Math.max(2, Math.floor((calGrid.clientWidth + 10) / (COL_W + 10))));
  // zweite Zeile unter der Kachel: Zusatz (z. B. „mit …“) oder die zugehörige Ausstellung, falls sie nicht schon der Titel ist
  const exLine = ev => {
    const m = window.EV_META[ev.key] || {};
    const line = m.sub ? T(m.sub) : m.exTitle && m.exTitle !== T(ev.key) ? m.exTitle : "";
    return line ? `<br><span>${line}</span>` : "";
  };
  const catLabel = ev => { const m = window.EV_META[ev.key]; return m && m.cat ? T(m.cat) : T(ev.type === "tour" ? "calTour" : "calProgram"); };
  const cal = { month: 0, type: "all", shown: STEP };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-ics]");
    if (!b) return;
    const found = EVENTS.find(x => window.eventId(x) === b.dataset.ics);
    if (found) window.downloadIcs(found, T);
  });
  const calGrid = $("[data-cal-grid]");
  const calMonth = $("[data-cal-month]");
  const calEmpty = $("[data-cal-empty]");
  const calFilters = $("[data-cal-filters]");
  const todayISO = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" }).format(new Date());
  const locale = () => (lang === "en" ? "en-GB" : "de-AT");

  function renderCalFilters() {
    calFilters.innerHTML = [["all", "calAll"], ["tour", "calTour"], ["program", "calProgram"]].map(([v, k]) =>
      `<button class="chip${cal.type === v ? " is-on" : ""}" data-cal-type="${v}" aria-pressed="${cal.type === v}"><span>${T(k)}</span></button>`).join("");
  }
  calFilters.addEventListener("click", e => {
    const b = e.target.closest("[data-cal-type]");
    if (!b || b.dataset.calType === cal.type) return;
    cal.type = b.dataset.calType;
    cal.shown = STEP;
    renderCalFilters();
    renderCal(true);
  });

  // animate: ganze Reihe tauscht (Monat/Filter); from: nur Karten ab diesem Index gleiten herein (Plus)
  function fitTitles(root) {
    $$(".ev__box", root).forEach(box => {
      const t = $(".ev__title", box);
      if (!t) return;
      t.style.fontSize = "";
      let size = parseFloat(getComputedStyle(t).fontSize);
      const fits = () => t.scrollWidth <= box.clientWidth - 24 && $(".ev__center", box).offsetHeight <= box.clientHeight - 56;
      while (!fits() && size > 15) { size -= 1; t.style.fontSize = size + "px"; }
    });
  }
  document.fonts.ready.then(() => fitTitles(calGrid));   // erst mit geladener Sabon richtig messen

  function renderCal(animate, from = null) {
    const ym = MONTHS[cal.month];
    const [y, mo] = ym.split("-").map(Number);
    calMonth.textContent = new Intl.DateTimeFormat(locale(), { month: "long" }).format(new Date(y, mo - 1, 1));
    $("[data-cal-prev]").disabled = cal.month === 0;
    $("[data-cal-next]").disabled = cal.month === MONTHS.length - 1;

    const all = EVENTS.filter(ev => ev.d.startsWith(ym) && ev.d >= todayISO && (cal.type === "all" || ev.type === cal.type));
    const list = all.slice(0, cal.shown);
    const more = all.length - list.length;
    const draw = () => {
      const n = calCols();
      const colW = innerWidth <= 760 ? (calGrid.clientWidth - (n - 1) * 10) / n : COL_W;
      const tiles = list.map((ev, i) => {
        const isNew = from !== null ? i >= from : animate;
        const delay = from !== null ? (i - from) * 60 : Math.min(i, 8) * 40;
        const date = new Date(ev.d + "T12:00:00");
        const dow = new Intl.DateTimeFormat(locale(), { weekday: "short" }).format(date).replace(".", "");
        const ratio = RATIOS[i % RATIOS.length], h = colW * ratio;
        const pal = PALETTE[i % PALETTE.length];
        const img = isImgTile(i) && EV_IMG[ev.key];
        const look = img ? "--fg:#fff;" : `--c:${pal.c};${pal.fg ? `--fg:${pal.fg};` : ""}`;
        // Datum steht über der Box (linksbündig), Titel und Uhrzeit zentriert in der Box
        return { h: h + DAY_H + INFO_H, html: `
          <div class="u-card ev${ratio > 1.5 ? " is-tall" : ""}${isNew ? " is-new" : ""}" style="${look}transition-delay:${delay}ms">
            <a class="ev__link" href="event.html?id=${window.eventId(ev)}">
            <div class="ev__date">
              <span class="ev__day"><b>${date.getDate()}</b> ${dow}</span>
            </div>
            <div class="u-card__box ev__box${img ? " is-img" : ""}" style="aspect-ratio:1 / ${ratio.toFixed(4)};${img ? `background-image:url('${img[0]}');background-size:${CROPS[Math.floor(i / 4) % CROPS.length][0]};background-position:${CROPS[Math.floor(i / 4) % CROPS.length][1] || img[1]}` : ""}">
              ${ev.d === todayISO ? `<span class="ev__today">${T("calToday")}</span>` : ""}
              <div class="ev__center">
                <p class="ev__title">${T(ev.key)}</p>
              </div>
            </div>
            </a>
            <div class="ev__meta">
              <span class="tag">${catLabel(ev)}</span>
            </div>
            <p class="u-card__cap"><span>${T("time")(ev.h, ev.m)}</span>${exLine(ev)}</p>
            <button class="ev__add" type="button" data-ics="${window.eventId(ev)}" aria-label="${T("addToCal")}: ${T(ev.key).replace(/­/g, "")}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>${T("addToCalShort")}</button>
          </div>` };
      });
      // Plus als letzte Kachel direkt nach dem letzten Termin, Box bündig mit den anderen Boxen
      const icon = `<span class="u-card__box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span>`;
      const plusTile = more > 0
        // noch Termine übrig: Plus hängt die nächsten an
        ? `<button class="u-card u-card--more" data-cal-more aria-label="${T("calMore")}">${icon}</button>`
        // alles gezeigt: Plus führt zum gesamten Programm
        : `<a class="u-card u-card--more" href="${T("programUrl")}" target="_blank" rel="noopener" aria-label="${T("calAllProgram")}">${icon}</a>`;
      // aufgeräumtes Raster: Zeilen von links nach rechts, jede Zeile oben bündig
      calGrid.innerHTML = tiles.map(t => t.html).join("") + (list.length ? plusTile : "");
      fitTitles(calGrid);
      calEmpty.hidden = list.length > 0;
      calEmpty.textContent = T("calEmpty");
      if (animate || from !== null) requestAnimationFrame(() => requestAnimationFrame(() => $$(".ev.is-new", calGrid).forEach(el => el.classList.remove("is-new"))));
    };
    if (animate && from === null && !reduced) {
      $$(".ev", calGrid).forEach(el => el.classList.add("is-out"));
      setTimeout(draw, 250);
    } else draw();
  }
  // bei anderer Spaltenzahl neu verteilen, sonst nur die Titel neu einpassen
  let calN = calCols();
  addEventListener("resize", () => { if (calCols() !== calN) { calN = calCols(); renderCal(false); } else fitTitles(calGrid); });
  // Plus: drei weitere Termine anhängen
  calGrid.addEventListener("click", e => {
    if (!e.target.closest("[data-cal-more]")) return;
    const from = cal.shown;
    cal.shown += STEP;
    renderCal(false, from);
  });
  function stepMonth(d) {
    const next = Math.min(MONTHS.length - 1, Math.max(0, cal.month + d));
    if (next === cal.month) return;
    cal.month = next;
    cal.shown = STEP;
    calMonth.classList.remove("is-swap"); void calMonth.offsetWidth; calMonth.classList.add("is-swap");
    renderCal(true);
  }
  // Kachel kippt der Maus folgend: Seite unter der Maus geht nach hinten, gegenüber kommt nach vorne
  const TILT = 22, TILT_X = 12;   // Grad seitlich / oben-unten; den Raum erzeugen Tiefe und Ebenen
  calGrid.addEventListener("pointermove", e => {
    if (reduced || e.pointerType !== "mouse") return;
    const card = e.target.closest(".ev");
    if (!card) return;
    const box = $(".ev__box", card);
    const r = box.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;   // 0 … 1
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    card.classList.add("is-tilting");
    box.style.setProperty("--ry", `${((x - .5) * -2 * TILT).toFixed(2)}deg`);
    box.style.setProperty("--rx", `${((y - .5) * 2 * TILT_X).toFixed(2)}deg`);
  });
  calGrid.addEventListener("pointerout", e => {
    const card = e.target.closest(".ev");
    if (!card || card.contains(e.relatedTarget)) return;
    card.classList.remove("is-tilting");
    const box = $(".ev__box", card);
    ["--rx", "--ry"].forEach(p => box.style.removeProperty(p));
  });

  $("[data-cal-prev]").addEventListener("click", () => stepMonth(-1));
  $("[data-cal-next]").addEventListener("click", () => stepMonth(1));

  /* ───────── Ausstellungen: Vorschau und Archiv per Plus ───────── */

  // Titel und Daten von der Museumsseite (Vorschau / Archiv)
  const MORE_EX = [
    { img: "7287", type: "preview", de: ["Neu. Sachlich.", "13.11.2026 – 28.02.2027"], en: ["New. Objective", "13 Nov 2026 – 28 Feb 2027"] },
    { img: "7288", type: "preview", de: ["Modern Fashion", "26.02. – 27.06.2027"], en: ["Modern Fashion", "26 Feb – 27 Jun 2027"] },
    { img: "7293", type: "archive", de: ["Gustave Courbet", "19.02. – 21.06.2026"], en: ["Gustave Courbet", "19 Feb – 21 Jun 2026"] },
    { img: "7136", type: "archive", de: ["Wege zur Wirklichkeit", "10.12.2025 – 15.02.2026"], en: ["Paths to Reality", "10 Dec 2025 – 15 Feb 2026"] },
    { img: "7185", type: "archive", de: ["Verborgene Moderne", "04.09.2025 – 18.01.2026"], en: ["Hidden Modernism", "4 Sep 2025 – 18 Jan 2026"] },
    { img: "7050", type: "archive", de: ["Biedermeier", "10.04. – 27.07.2025"], en: ["Biedermeier", "10 Apr – 27 Jul 2025"] },
    { img: "6996", type: "archive", de: ["Egon Schiele. Last Years", "28.03. – 13.07.2025"], en: ["Egon Schiele. Last Years", "28 Mar – 13 Jul 2025"] }
  ];
  const exExtra = $("[data-ex-extra]");
  const exMore = $("[data-ex-more]");
  let exOpen = false;
  function renderExtra() {
    exExtra.innerHTML = MORE_EX.map(x => {
      const [title, date] = x[lang];
      return `
        <a class="u-card ex-card${exOpen ? " is-shown" : ""}" href="${T("urlExhibitions")}" target="_blank" rel="noopener">
          <div class="u-card__box"><img src="assets/img/ex/${x.img}.jpg" alt="" loading="lazy"></div>
          <span class="tag${x.type === "archive" ? " tag--soft" : ""}">${T(x.type === "preview" ? "statusPreview" : "statusArchive")}</span>
          <p class="u-card__cap"><span>${title}</span><br><span>${date}</span></p>
        </a>`;
    }).join("");
  }
  exMore.addEventListener("click", () => {
    exOpen = !exOpen;
    exMore.setAttribute("aria-expanded", exOpen);
    exMore.closest(".updates__row").classList.toggle("is-open", exOpen);   // aufgeklappt: alle Kacheln in Zeilen statt seitlich scrollen
    exMore.setAttribute("aria-label", T(exOpen ? "lessExhibitions" : "moreExhibitions"));
    const cards = $$(".ex-card", exExtra);
    if (exOpen) {
      cards.forEach((c, i) => { c.classList.add("is-shown", "is-new"); c.style.transitionDelay = `${i * 45}ms`; });
      requestAnimationFrame(() => requestAnimationFrame(() => cards.forEach(c => c.classList.remove("is-new"))));
    } else {
      cards.forEach(c => { c.style.transitionDelay = "0ms"; c.classList.add("is-new"); });
      setTimeout(() => cards.forEach(c => c.classList.remove("is-shown", "is-new")), reduced ? 0 : 300);
    }
  });

  /* ───────── Sprache anwenden ───────── */

  function setLang(next) {
    lang = I18N[next] ? next : "de";
    store.set("lang", lang);
    document.documentElement.lang = lang;

    $$("[data-i18n]").forEach(el => (el.textContent = T(el.dataset.i18n)));
    $$("[data-i18n-html]").forEach(el => (el.innerHTML = T(el.dataset.i18nHtml)));
    $$("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", T(el.dataset.i18nAria)));
    $$("[data-i18n-ph]").forEach(el => el.setAttribute("placeholder", T(el.dataset.i18nPh)));
    $$("[data-i18n-href]").forEach(el => el.setAttribute("href", T(el.dataset.i18nHref)));
    $$("[data-lang]").forEach(b => { const on = b.dataset.lang === lang; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on); });

    textCards();
    if (coll) { coll.textTiles(); coll.updateChips(); coll.allLabel(); }
    updateStatus();
    newsText();
    splitLines();
    renderCalFilters();
    renderCal(false);
    renderExtra();
    exMore.setAttribute("aria-label", T(exOpen ? "lessExhibitions" : "moreExhibitions"));
    if (sheet.classList.contains("is-open")) sheetBody.innerHTML = sheetText(list[idx]), sheetBody.classList.add("is-in");
  }
  setLang(lang);
})();
