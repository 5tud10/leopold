/* Leopold Museum – Unterseite eines Programmpunkts (event.html?id=…)
   Kopf, Menü, Laufband und Fuß verhalten sich wie auf der Startseite. */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const pad = n => String(n).padStart(2, "0");
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  let lang = params.get("lang") || store.get("lang") || "de";
  if (!window.I18N[lang]) lang = "de";
  const T = k => window.I18N[lang][k];
  const locale = () => (lang === "en" ? "en-GB" : "de-AT");

  const EVENTS = window.EVENTS;
  const ev = EVENTS.find(e => window.eventId(e) === params.get("id")) || null;
  const todayISO = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" }).format(new Date());

  // Kalender-Farben wie auf der Startseite
  const PALETTE = [
    { c: "#2f3d7a", fg: "#fff" }, { c: "#c9a65a" }, { c: "#2f5c60", fg: "#fff" }, { c: "#d8b1a6" },
    { c: "#6e2a32", fg: "#fff" }, { c: "#9aa07a" }, { c: "#b35f3f", fg: "#fff" }
  ];

  /* ───────── Kopf: Pille wird beim Scrollen breit ───────── */

  const top = $("[data-top]");
  const onScroll = () => {
    top.classList.toggle("is-compact", scrollY > 40);
    $(".pill__fig").tabIndex = scrollY > 40 ? 0 : -1;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ───────── Menü: Logo liegt beim Öffnen exakt auf dem Kopf-Logo ───────── */

  const menu = $("[data-menu]");
  function anchorMenu() {
    const panel = $(".menu__panel"), src = $(".top__logo img"), dst = $(".menu__logo img"), link = $(".menu__logo");
    panel.classList.remove("is-anchored"); panel.style.left = panel.style.top = ""; link.style.transform = "";
    const s = src.getBoundingClientRect();
    if (s.width < 10 || $(".top").classList.contains("is-compact")) {   // Kopf eingeklappt: Panel klappt genau aus der Pille auf
      const pill = $(".pill").getBoundingClientRect();
      panel.classList.add("is-anchored", "is-from-pill");
      panel.style.left = pill.left + "px"; panel.style.top = pill.top + "px"; panel.style.width = pill.width + "px";
      return;
    }
    panel.classList.remove("is-from-pill"); panel.style.width = "";
    const p = panel.getBoundingClientRect(), d = dst.getBoundingClientRect();
    panel.classList.add("is-anchored");
    panel.style.left = Math.max(12, Math.min(s.left - (d.left - p.left), innerWidth - p.width - 12)) + "px";
    panel.style.top = (s.top - (d.top - p.top)) + "px";
    const d2 = dst.getBoundingClientRect();
    link.style.transform = `translate(${s.left - d2.left}px, ${s.top - d2.top}px)`;
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
  addEventListener("keydown", e => { if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false); });
  $$("[data-lang]").forEach(b => b.addEventListener("click", () => { lang = b.dataset.lang; store.set("lang", lang); render(); }));

  /* ───────── Öffnungsstatus (Wiener Zeit): Menü, Laufband, Besuch planen ───────── */

  function updateStatus() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Vienna", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    const mins = (+get("hour") % 24) * 60 + +get("minute");
    const open = day !== 2 && mins >= 600 && mins < 1080;
    let long, ticker;
    if (open) { long = T("statusOpen"); ticker = T("tickerOpen"); }
    else if (day !== 2 && mins < 600) { long = T("statusOpensToday"); ticker = T("tickerOpensToday"); }
    else if (day === 2 || day === 1) { long = T("statusClosedWed"); ticker = T("tickerClosedWed"); }
    else { long = T("statusClosedTomorrow"); ticker = T("tickerClosedTomorrow"); }
    $("[data-status-line]").textContent = long;
    const big = open ? "bigOpen" : (day !== 2 && mins < 600) ? "bigOpensToday" : (day === 2 || day === 1) ? "bigClosedWed" : "bigClosedTomorrow";
    $$("[data-status-big]").forEach(s => (s.textContent = T(big)));
    $$("[data-plan-dot]").forEach(d => d.classList.toggle("is-closed", !open));
    $$("[data-ticker]").forEach(s => (s.textContent = ticker));
    const today = $("[data-ev-today-status]");
    if (today) today.textContent = long;
  }
  setInterval(updateStatus, 30000);

  /* ───────── Bausteine ───────── */

  // Kachel im Stil des Kalenders: Datum über der Box, Titel in Sabon zentriert
  const addBtn = e => `<button class="ev__add" type="button" data-ics="${window.eventId(e)}" aria-label="${T("addToCal")}: ${T(e.key).replace(/­/g, "")}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>${T("addToCalShort")}</button>`;
  document.addEventListener("click", ev2 => {
    const b = ev2.target.closest("[data-ics]");
    if (!b) return;
    const found = EVENTS.find(x => window.eventId(x) === b.dataset.ics);
    if (found) window.downloadIcs(found, T);
  });
  function tile(e, i) {
    const d = new Date(e.d + "T12:00:00");
    const dow = new Intl.DateTimeFormat(locale(), { weekday: "short" }).format(d).replace(".", "");
    const pal = PALETTE[i % PALETTE.length];
    return `
      <div class="u-card ev evp__tile" style="--c:${pal.c};${pal.fg ? `--fg:${pal.fg};` : ""}">
        <a class="ev__link" href="event.html?id=${window.eventId(e)}">
        <div class="ev__date"><span class="ev__day"><b>${d.getDate()}</b> ${dow}</span></div>
        <div class="u-card__box ev__box" style="aspect-ratio:1 / ${[5 / 3, 5 / 4, 1][i % 3].toFixed(4)}">
          ${e.d === todayISO ? `<span class="ev__today">${T("calToday")}</span>` : ""}
          <div class="ev__center">
            <p class="ev__title">${T(e.key)}</p>
          </div>
        </div>
        </a>
        <div class="ev__meta"><span class="tag">${(window.EV_META[e.key] || {}).cat ? T(window.EV_META[e.key].cat) : T(e.type === "tour" ? "calTour" : "calProgram")}</span></div>
        <p class="u-card__cap"><span>${T("time")(e.h, e.m)}</span></p>
        ${addBtn(e)}
      </div>`;
  }
  // Titel so lange verkleinern, bis er in die Kachel passt (wie auf der Startseite)
  function fitTitles() {
    requestAnimationFrame(() => $$(".evp__tile .ev__box").forEach(box => {
      const t = $(".ev__title", box);
      t.style.fontSize = "";
      let size = parseFloat(getComputedStyle(t).fontSize);
      const fits = () => t.scrollWidth <= box.clientWidth - 24 && $(".ev__center", box).offsetHeight <= box.clientHeight - 56;
      while (!fits() && size > 15) { size -= 1; t.style.fontSize = size + "px"; }
    }));
  }
  // Titel und Fläche drehen sich mit der Maus in die Perspektive (je nach Position auf dem Bildschirm)
  if (matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let raf = null, mx = 0, my = 0;
    addEventListener("pointermove", e2 => {
      if (e2.pointerType !== "mouse") return;
      mx = e2.clientX; my = e2.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const tt = $(".evp__tt");
        if (!tt) return;
        const dx = Math.max(-1, Math.min(1, (mx - innerWidth / 2) / (innerWidth / 2)));
        const dy = Math.max(-1, Math.min(1, (my - innerHeight / 2) / (innerHeight / 2)));
        tt.style.setProperty("--ry", (dx * 26).toFixed(2) + "deg");
        tt.style.setProperty("--rx", (-dy * 16).toFixed(2) + "deg");
      });
    }, { passive: true });
  }
  const hideRow = (sel, hide) => { const r = $(sel); if (r) r.hidden = hide; };

  /* ───────── Inhalt ───────── */

  function render() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach(el => (el.textContent = T(el.dataset.i18n)));
    $$("[data-i18n-html]").forEach(el => (el.innerHTML = T(el.dataset.i18nHtml)));
    $$("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", T(el.dataset.i18nAria)));
    $$("[data-i18n-ph]").forEach(el => el.setAttribute("placeholder", T(el.dataset.i18nPh)));
    $$("[data-i18n-href]").forEach(el => el.setAttribute("href", T(el.dataset.i18nHref)));
    $$("[data-lang]").forEach(b => { const on = b.dataset.lang === lang; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on); });

    if (!ev) {
      $("[data-ev-detail]").innerHTML = `<section class="evp__hero"><p class="evp__missing">${T("evNotFound")} <a href="index.html#kalender">${T("backToCalendar")}</a></p></section>`;
      updateStatus();
      return;
    }
    const meta = window.EV_META[ev.key];
    const date = new Date(ev.d + "T12:00:00");
    const typeLabel = T(ev.type === "tour" ? "calTour" : "calProgram");
    document.title = `${T(ev.key)} · ${new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long" }).format(date)} · Leopold Museum`;

    // Kopf
    $("[data-ev-type]").textContent = meta.cat ? T(meta.cat) : typeLabel;
    $("[data-ev-exname]").textContent = meta.exTitle || (meta.cat ? T(meta.cat) : "");
    // Titel mit Farbfläche dahinter (wie das Zitat auf der Startseite): Farbe je Programmpunkt gleichbleibend
    const PLATES = ["#F6FF54", "#9db4e8", "#f2a48c", "#c9a65a", "#b9dcc4", "#d8b1a6", "#cdb9ef", "#e8c25a", "#9aa07a", "#f0b8d0"];
    const hash = [...ev.key].reduce((a, c) => a + c.charCodeAt(0), 0);
    const tt = $("[data-ev-title]");
    tt.innerHTML = `<span class="evp__tt" style="--plate:${PLATES[hash % PLATES.length]}"><span class="evp__plate" aria-hidden="true"></span><span class="evp__tw"></span></span>`;
    $(".evp__tw", tt).textContent = T(ev.key);
    $("[data-ev-date]").textContent = new Intl.DateTimeFormat(locale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
    $("[data-ev-time]").textContent = T("time")(ev.h, ev.m);

    // Bild über die volle Breite
    const media = $("[data-ev-media]");
    media.style.backgroundImage = meta.img ? `url('${meta.img}')` : "none";
    media.style.backgroundPosition = meta.pos;
    media.style.backgroundColor = meta.color;

    // Über den Programmpunkt
    $("[data-ev-desc]").textContent = T(ev.key + "Desc");
    $("[data-ev-facts]").innerHTML = [[T("evType"), meta.cat ? T(meta.cat) : typeLabel], [T("evExhibition"), meta.exTitle], [T("evPlace"), T("placeText")]].filter(([, v]) => v)
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

    // Ausstellung (nur wenn der Programmpunkt zu einer gehört)
    const exEl = $("[data-ev-ex]");
    if (exEl.closest(".evp__row")) exEl.closest(".evp__row").hidden = !meta.exTitle;
    const EX = {
      "Herbert Boeckl – Hans Josephsohn": ["assets/img/ex/7314.jpg", "35% 50%", "statusNow", ""],
      "Premiere!": ["assets/img/ex/7374.jpg", "58% 50%", "tagLastDays", " tag--hot"],
      "Wien 1900": ["assets/img/works/web-lm-00630.jpg", "75% 30%", "statusPermanent", ""]
    };
    if (meta.exTitle) {
      const [src, pos, status, cls] = EX[meta.exTitle] || [meta.img, meta.pos, "statusNow", ""];
      exEl.innerHTML = `
        <div class="u-card__box"><img src="${src}" alt="" style="object-position:${pos}" loading="lazy"></div>
        <span class="tag${cls}">${T(status)}</span>
        <p class="u-card__cap"><span>${meta.exTitle}</span><br><span>${T(meta.exSub)}</span></p>`;
    }

    // Am selben Tag (andere Programmpunkte) und weitere Termine desselben Programmpunkts
    const same = EVENTS.filter(e => e.d === ev.d && e !== ev);
    const more = EVENTS.filter(e => e.key === ev.key && e !== ev && e.d >= todayISO);
    $("[data-ev-sameday]").innerHTML = same.map(tile).join("");
    $("[data-ev-more]").innerHTML = more.map((e, i) => tile(e, i + same.length)).join("");
    hideRow("[data-ev-sameday-row]", !same.length);
    hideRow("[data-ev-more-row]", !more.length);
    fitTitles();

    // Aus der Sammlung
    const works = meta.works ? window.EV_WORKS[meta.works] : null;
    hideRow("[data-ev-works-row]", !works);
    if (works) {
      $("[data-ev-works-lead]").textContent = T("worksLeadBoeckl");
      const base = lang === "en" ? "https://onlinecollection.leopoldmuseum.org/en/" : "https://onlinecollection.leopoldmuseum.org/objekt/";
      $("[data-ev-works]").innerHTML = works.map(w => {
        const [title, d, tech] = w[lang];
        return `<a class="evp__work" href="${lang === "en" ? base : base + w.slug + "/"}" target="_blank" rel="noopener" title="${T("toOnline")}">
          <span class="evp__work-img"><img src="assets/img/works/${w.img}.jpg" alt="Herbert Boeckl, ${title}" loading="lazy"></span>
          <span class="evp__work-title">${title}</span>
          <span class="evp__work-meta">Herbert Boeckl, ${d}. <span>${tech}</span></span>
        </a>`;
      }).join("");
    }
    updateStatus();
  }

  // In Kalender eintragen (gemeinsame Funktion aus events.js)
  const icsBtn = $("[data-ev-ics]");
  if (icsBtn && ev) icsBtn.addEventListener("click", () => window.downloadIcs(ev, T));

  // Newsletter im Fuß (wie auf der Startseite)
  const news = $("[data-news]");
  if (news) {
    const input = $("input", news), msg = $("[data-news-msg]");
    input.addEventListener("input", () => { news.classList.remove("is-error"); msg.classList.remove("is-on"); });
    news.addEventListener("submit", e => {
      e.preventDefault();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      news.classList.toggle("is-error", !ok);
      msg.textContent = T(ok ? "newsOk" : "newsErr");
      msg.classList.add("is-on");
    });
  }

  render();
  requestAnimationFrame(() => document.body.classList.add("is-in"));
})();
