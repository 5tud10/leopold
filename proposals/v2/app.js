/* Leopold Museum – V2. Inhalte kommen aus V1 (i18n.js, events.js, works.js), damit beide Vorschläge dieselben Daten zeigen. */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const I18N = window.I18N || {}, DE = I18N.de || {};
  // Sprache: gleiche Einstellung wie in V1 (dort gespeichert), damit auch die Unterseiten folgen
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  let lang = new URLSearchParams(location.search).get("lang") || store.get("lang") || "de";
  if (lang !== "en") lang = "de";
  const EN = lang === "en", LOC = EN ? "en-GB" : "de-AT";
  const L = (de, en) => (EN ? en : de);
  const T = k => (EN && I18N.en && I18N.en[k] !== undefined ? I18N.en[k] : DE[k] !== undefined ? DE[k] : k);
  const F = (w, k) => (EN && w[k + "_en"]) || w[k] || "";
  document.documentElement.lang = lang;
  // Hausschrift Conduit ist Standard; ?font=bureau zeigt zum Vergleich die Bureau
  if (new URLSearchParams(location.search).get("font") !== "bureau") document.documentElement.classList.add("f-lm");
  // feste Texte im HTML: englische Fassung steht in data-en
  if (EN) {
    $$("[data-en]").forEach(el => (el.innerHTML = el.dataset.en));
    $$("[data-en-ph]").forEach(el => (el.placeholder = el.dataset.enPh));
    $$("[data-en-label]").forEach(el => el.setAttribute("aria-label", el.dataset.enLabel));
  }
  $$("[data-lang]").forEach(b => {
    const on = b.dataset.lang === lang;
    b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on);
    b.addEventListener("click", () => { if (on) return; store.set("lang", b.dataset.lang); const u = new URL(location.href); u.searchParams.delete("lang"); location.replace(u); });
  });
  const V1 = "../v1/";
  const clean = s => String(s).replace(/­/g, "");
  const EVENTS = window.EVENTS || [], META = window.EV_META || {};
  const EXURL = `https://www.leopoldmuseum.org/${lang}/${EN ? "exhibitions" : "ausstellungen"}`;

  /* ───────── Kontrastansicht: die ganze Seite in Schwarz und Weiß, Wahl bleibt gespeichert ───────── */
  const bw = $("[data-bw]");
  if (bw) {
    const set = on => { document.documentElement.classList.toggle("bw", on); bw.setAttribute("aria-pressed", on); };
    set(document.documentElement.classList.contains("bw"));
    bw.addEventListener("click", () => { const on = !document.documentElement.classList.contains("bw"); set(on); store.set("v2bw", on ? "1" : "0"); });
  }

  /* ───────── Zeit in Wien ───────── */
  const iso = d => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" }).format(d);
  const todayISO = iso(new Date());
  function now() {
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Vienna", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const get = t => p.find(x => x.type === t).value;
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")), mins: (+get("hour") % 24) * 60 + +get("minute") };
  }
  const dayName = s => new Intl.DateTimeFormat(LOC, { weekday: "long" }).format(new Date(s + "T12:00:00"));
  const dayShort = s => new Intl.DateTimeFormat(LOC, { weekday: "short" }).format(new Date(s + "T12:00:00")).replace(".", "");
  const dateLong = s => new Intl.DateTimeFormat(LOC, { day: "numeric", month: "long" }).format(new Date(s + "T12:00:00"));
  const time = e => (EN ? `${e.h}:${String(e.m).padStart(2, "0")}` : e.m ? `${e.h}:${String(e.m).padStart(2, "0")} Uhr` : `${e.h} Uhr`);
  const img = src => `data-img="${src}"`;
  // woran jemand hängen bleibt, merkt sich die Seite unter diesem Namen (siehe „Und was erregt Sie?“ am Ende)
  const like = name => `data-like="${String(name).replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`;

  /* ───────── 1 · Heute im Haus: der Satz zum Tag ───────── */
  function say() {
    const { day, mins } = now();
    const open = day !== 2 && mins >= 600 && mins < 1080;

    // Status in einem Satz
    const status = EN
      ? (open ? `Today the Leopold Museum is open <em>until 6 pm</em>.`
        : day !== 2 && mins < 600 ? `Today the Leopold Museum opens <em>at 10 am</em>.`
        : day === 2 ? `Today, Tuesday, the Leopold Museum is closed. Back <em>tomorrow from 10 am</em>.`
        : day === 1 ? `The Leopold Museum is closed for today. Back <em>Wednesday from 10 am</em>.`
        : `The Leopold Museum is closed for today. Back <em>tomorrow from 10 am</em>.`)
      : (open ? `Heute ist das Leopold Museum <em>bis 18 Uhr</em> geöffnet.`
        : day !== 2 && mins < 600 ? `Heute öffnet das Leopold Museum <em>um 10 Uhr</em>.`
        : day === 2 ? `Heute, am Dienstag, ist das Leopold Museum geschlossen. <em>Morgen ab 10 Uhr</em> wieder.`
        : day === 1 ? `Für heute ist das Leopold Museum geschlossen. <em>Mittwoch ab 10 Uhr</em> wieder.`
        : `Für heute ist das Leopold Museum geschlossen. <em>Morgen ab 10 Uhr</em> wieder.`);
    // ein Wort liegt auf einer Farbfläche und kippt mit der Maus: die Ausstellung, die man nicht verpassen soll
    const hl = (w, c) => `<span class="hl" style="--plate:${c}"><i class="hl__p" aria-hidden="true"></i><span class="hl__w">${w}</span></span>`;

    // was zu sehen ist: Namen sind Links, das Bild erscheint beim Darüberfahren
    const daysLeft = Math.round((new Date("2026-10-11T12:00:00") - new Date(todayISO + "T12:00:00")) / 864e5);
    // „Premiere!“ ist eine eigene Ausstellung: mit Untertitel, damit klar ist, wovon
    const left = daysLeft === 0 ? L("Nur noch heute", "Last day today") : daysLeft === 1 ? L("Nur noch bis morgen", "Only until tomorrow") : L(`Nur noch ${daysLeft} Tage`, `Only ${daysLeft} days left`);
    const premiere = daysLeft >= 0
      ? `${left}: <a href="${EXURL}" target="_blank" rel="noopener" ${img(V1 + "assets/img/ex/7374.jpg")} ${like("Premiere!")}>${hl(L("Premiere! Die Sammlung der OeNB", "Premiere! The OeNB Collection"), "#F6FF54")}</a>. ${L("Außerdem zu sehen", "Also on view")}: ` : L("Zu sehen: ", "On view: ");
    const wien = daysLeft >= 0 ? L("Wien 1900", "Vienna 1900") : hl(L("Wien 1900", "Vienna 1900"), "#9db4e8");
    const shows = `${premiere}<a href="${EXURL}" target="_blank" rel="noopener" ${img(V1 + "assets/img/ex/7314.jpg")} ${like("Herbert Boeckl – Hans Josephsohn")}>Herbert Boeckl – Hans Josephsohn</a> ${L("und", "and")} <a href="#haus" ${img(V1 + "assets/img/works/web-lm-00630.jpg")} ${like(L("Wien 1900", "Vienna 1900"))}>${wien}</a> ${L("mit Klimt und Schiele", "with Klimt and Schiele")}.`;

    // der nächste Programmpunkt
    const next = EVENTS.find(e => e.d > todayISO || (e.d === todayISO && e.h * 60 + e.m > mins));
    let prog = "";
    if (next) {
      const m = META[next.key] || {};
      const when = next.d === todayISO ? "Heute" : `Am ${dayName(next.d)}`;
      prog = ` ${when} um ${time(next)}: <a href="${V1}event.html?id=${window.eventId(next)}" ${m.img ? img(V1 + m.img) : ""}>${clean(T(next.key))}</a>${m.cat ? ` <span class="q">${clean(T(m.cat))}</span>` : ""}`;
    }
    $("[data-say]").innerHTML = `${status} ${shows}`;
  }
  say();
  setInterval(say, 60000);

  /* ───────── 2 · Tickets: Art und Anzahl wählen, Summe rechnet mit ───────── */
  const TIX = [
    { name: L("Regulär", "Regular"), note: L("Erwachsene", "Adults"), price: 19, n: 1 },
    { name: L("Ermäßigt", "Reduced"), note: L("Studierende, Senior*innen, Menschen mit Behinderung", "Students, seniors, people with disabilities"), price: 16, n: 0 },
    { name: L("Unter 19 Jahren", "Under 19"), note: L("Kinder und Jugendliche", "Children and young people"), price: 2.5, n: 0 }
  ];
  const eur = v => "€ " + (Number.isInteger(v) ? v : v.toFixed(2).replace(".", EN ? "." : ","));
  const rows = $("[data-tix-rows]");
  rows.innerHTML = TIX.map((t, i) => `
    <li class="tix__row">
      <span>${t.name}<small>${t.note}</small></span>
      <span class="tix__price">${eur(t.price)}</span>
      <span class="qty">
        <button type="button" data-q="${i}" data-d="-1" aria-label="${t.name}: ${L("eines weniger", "one fewer")}">−</button>
        <output data-n="${i}" aria-live="polite">${t.n}</output>
        <button type="button" data-q="${i}" data-d="1" aria-label="${t.name}: ${L("eines mehr", "one more")}">+</button>
      </span>
    </li>`).join("");
  function sum() {
    const n = TIX.reduce((a, t) => a + t.n, 0), total = TIX.reduce((a, t) => a + t.n * t.price, 0);
    TIX.forEach((t, i) => { $(`[data-n="${i}"]`).textContent = t.n; $(`[data-q="${i}"][data-d="-1"]`).disabled = t.n === 0; $(`[data-q="${i}"][data-d="1"]`).disabled = t.n >= 12; });
    $("[data-tix-total]").textContent = eur(total);
    $("[data-tix-label]").textContent = n === 0 ? L("Tickets wählen", "Choose tickets") : n === 1 ? L("1 Ticket kaufen", "Buy 1 ticket") : L(`${n} Tickets kaufen`, `Buy ${n} tickets`);
    $("[data-tix-go]").classList.toggle("is-off", n === 0);
  }
  rows.addEventListener("click", e => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    const t = TIX[+b.dataset.q];
    t.n = Math.max(0, Math.min(12, t.n + +b.dataset.d));
    sum();
  });
  sum();
  $$("[data-from]").forEach(s => (s.textContent = L("ab ", "from ") + eur(Math.min(...TIX.map(t => t.price)))));
  {
    // Hinweis je nach Tag: heute noch möglich oder für den nächsten Besuch
    const { day, mins } = now();
    $("[data-tix-note]").textContent = day !== 2 && mins < 1020
      ? L("Für heute oder einen späteren Tag. Gültig für alle Ausstellungen und die Sammlung.", "For today or a later date. Valid for all exhibitions and the collection.")
      : L("Für Ihren nächsten Besuch. Gültig für alle Ausstellungen und die Sammlung.", "For your next visit. Valid for all exhibitions and the collection.");
  }

  /* ───────── 3 · Im Haus: Wegweiser nach Ebenen ───────── */
  const V19 = L("Wien 1900", "Vienna 1900"), PERM = L("Dauerausstellung", "Permanent exhibition");
  const LEVELS = [
    { n: 4, what: V19, em: L("Gustav Klimt, Tod und Leben", "Gustav Klimt, Death and Life"), note: PERM, img: "assets/img/works/web-lm-00630.jpg", href: "#sammlung", like: "Gustav Klimt" },
    { n: 3, what: V19, em: L("Egon Schiele, Kardinal und Nonne", "Egon Schiele, Cardinal and Nun"), note: PERM, img: "assets/img/works/web-lm-00455.jpg", href: "#sammlung", like: "Egon Schiele" },
    { n: 2, what: "Café Leopold", em: "", note: "", img: null, href: null, like: "Café Leopold" },
    { n: 0, what: L("Kassa, Atrium, Wien 1900", "Ticket desk, atrium, Vienna 1900"), em: "", note: L("Eingang", "Entrance"), img: null, href: "#tickets" },
    { n: -1, what: "Herbert Boeckl – Hans Josephsohn", em: L("Archetypen des Figuralen", "Archetypes of the Figural"), note: L("bis 10.01.2027", "until 10 Jan 2027"), img: "assets/img/ex/7314.jpg", href: EXURL, like: "Herbert Boeckl – Hans Josephsohn" },
    { n: -2, what: "Premiere!", em: L("Die Sammlung der Oesterreichischen Nationalbank", "The Oesterreichische Nationalbank Collection"), note: L("bis 11.10.2026", "until 11 Oct 2026"), img: "assets/img/ex/7374.jpg", href: EXURL, like: "Premiere!" }
  ];
  $("[data-levels]").innerHTML = LEVELS.map(l => {
    const inner = `<span class="lv__no"><b>${l.n < 0 ? "−" + -l.n : l.n}</b>${L("Ebene", "Level")}</span>
      <span class="lv__what">${l.what}${l.em ? ` <em>${l.em}</em>` : ""}</span><span class="lv__note">${l.note}</span>`;
    const ext = l.href && /^https?:/.test(l.href) ? ` target="_blank" rel="noopener"` : "";
    return `<li class="in" ${l.like ? like(l.like) : ""}>${l.href
      ? `<a href="${l.href}"${ext} ${l.img ? img(V1 + l.img) : ""}>${inner}</a>`
      : `<div class="lv__row">${inner}</div>`}</li>`;
  }).join("");

  /* ───────── 4 · Programm: die nächsten Termine wie im Programmheft ───────── */
  const upcoming = EVENTS.filter(e => e.d >= todayISO).slice(0, 12);
  $("[data-program]").innerHTML = upcoming.map((e, i) => {
    const m = META[e.key] || {};
    const [, mo, d] = e.d.split("-");
    const same = i > 0 && upcoming[i - 1].d === e.d;
    return `<li class="in" ${like(clean(T(e.key)))}><div class="pg__row">
      <a class="pg__link" href="${V1}event.html?id=${window.eventId(e)}" ${m.img ? img(V1 + m.img) : ""}>
        <span class="pg__cat">${m.cat ? clean(T(m.cat)) : ""}</span>
        <span class="pg__when"><span class="pg__day${same ? " is-same" : ""}">${EN ? `${+d}/${+mo}` : `${+d}.${+mo}.`} <span>${dayShort(e.d)}</span></span><span class="pg__time">${time(e)}</span></span>
        <span class="pg__title">${clean(T(e.key))}</span>
      </a>
      <button class="pg__ics" type="button" data-ics="${window.eventId(e)}">${L("In Kalender eintragen", "Add to calendar")}</button>
    </div></li>`;
  }).join("");
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-ics]");
    if (!b || !window.downloadIcs) return;
    const ev = EVENTS.find(x => window.eventId(x) === b.dataset.ics);
    if (ev) window.downloadIcs(ev, T);
  });

  /* ───────── 5 · Sammlung: ein Strom von Werken ─────────
     1300 Werke aus der Online Sammlung ziehen langsam im Raum durchs Bild: aus der Tiefe nach vorn und wieder weg.
     Ziehen, Pfeile oder Tasten blättern; Klick auf ein Werk am Rand holt es nach vorn, Klick auf das vordere öffnet es. */
  {
    const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const POOL = ((window.DATA && window.DATA.works) || []).filter(w => w.src);
    const mix = POOL.map((w, i) => [(i * 7919 + 13) % POOL.length, w]).sort((a, b) => a[0] - b[0]).map(x => x[1]);   // feste, gemischte Reihenfolge
    const stage = $("[data-stream]"), space = $("[data-space]"), bar = $("[data-wfilter]"), cap = $("[data-wcap]"), posEl = $("[data-wpos]"), pauseBtn = $("[data-wpause]");
    const NAMES = ["Egon Schiele", "Gustav Klimt", "Koloman Moser", "Oskar Kokoschka", "Max Oppenheimer", "Josef Hoffmann"];
    const by = n => POOL.filter(w => (w.artist || "").includes(n)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cur = "", q = "", list = mix;

    bar.innerHTML = [["", L("Alle", "All"), POOL.length], ...NAMES.map(n => [n, n, by(n).length])]
      .map(([k, label, n]) => `<button type="button" data-wg="${esc(k)}" aria-pressed="${k === cur}">${esc(label)} <span>${n}</span></button>`).join("");

    // 15 Plätze, die immer neu belegt werden: so laufen beliebig viele Werke durch
    const HALF = 7, SLOTS = HALF * 2 + 1;                  // Werke auf einem Bogen, alle 14 Grad eines
    const els = Array.from({ length: SLOTS }, () => { const a = document.createElement("a"); a.className = "sw"; a.target = "_blank"; a.rel = "noopener"; a.innerHTML = `<img alt="" draggable="false">`; space.appendChild(a); return a; });
    const GAP = .52;                                                        // Abstand der Werke, als Anteil der Bühnenhöhe
    let pos = 0, vel = 0, drift = reduced ? 0 : .16, paused = reduced, hover = false, drag = false, moved = 0, lastX = 0, lastT = 0, centre = -1, visible = false, prev = performance.now(), target = null;
    const scrub = $("[data-wscrub]"); let scrubbing = false;
    const wraps = () => list.length >= SLOTS;
    const real = i => ((i % list.length) + list.length) % list.length;
    const label = () => { pauseBtn.textContent = paused ? L("Weiterlaufen", "Resume") : L("Anhalten", "Pause"); pauseBtn.setAttribute("aria-pressed", paused); };
    function caption() {
      const n = list.length;
      if (!n) { cap.textContent = L("Dazu gibt es in dieser Auswahl kein Werk.", "No work in this selection matches."); posEl.textContent = "0 / 0"; return; }
      const w = list[real(centre)];
      cap.innerHTML = `<b>${esc(w.artist || "")}</b> <em>${esc(w.title || "")}</em>${w.date ? `, ${esc(w.date)}` : ""}`;
      posEl.textContent = `${real(centre) + 1} / ${n}`;
      if (!scrubbing) { scrub.max = Math.max(0, n - 1); scrub.value = real(centre); }
    }
    function frame(t) {
      const dt = Math.min(.05, (t - prev) / 1000); prev = t;
      if (!visible) return requestAnimationFrame(frame);
      const n = list.length;
      if (n) {
        if (target !== null) { pos += (target - pos) * Math.min(1, dt * 7); if (Math.abs(target - pos) < .002) { pos = target; target = null; } }
        else if (!drag) { vel *= Math.pow(.3, dt); pos += vel * dt + (paused || hover || Math.abs(vel) > .3 ? 0 : drift * dt); }   // langer Auslauf: ein Schwung trägt durch viele Werke
        if (!wraps()) pos = Math.max(0, Math.min(n - 1, pos));
      }
      // Stand „Strom im Raum“ (die Fassung, die gefallen hat): vorn groß und frontal, zu den Seiten gedreht und in die Tiefe.
      const base = Math.round(pos), gap = stage.clientHeight * GAP;
      for (let k = -HALF; k <= HALF; k++) {
        const i = base + k, el = els[((i % SLOTS) + SLOTS) % SLOTS];
        const ok = n && (wraps() || (i >= 0 && i < n));
        if (!ok) { el.style.display = "none"; el.dataset.i = ""; continue; }
        const w = list[real(i)];
        if (el.dataset.key !== w.url) { el.dataset.key = w.url; el.href = w.url; el.firstChild.src = w.src; el.dataset.like = (w.title || "").replace(/[„“”"]/g, ""); el.setAttribute("aria-label", `${w.artist || ""}, ${w.title || ""}`); }
        el.dataset.i = i;
        const d = i - pos, a = Math.abs(d);
        el.style.display = "";
        el.style.transform = `translate(-50%, -50%) translate3d(${(d * gap * (1 - Math.min(a, 6) * .045)).toFixed(1)}px, 0, ${(-Math.pow(a, 1.35) * 150).toFixed(1)}px) rotateY(${(Math.max(-62, Math.min(62, -d * 26))).toFixed(2)}deg)`;
        el.style.opacity = Math.max(0, 1 - Math.max(0, a - 5) / 1.8).toFixed(2);
        el.style.pointerEvents = "";
        el.firstChild.style.filter = "";
        el.style.zIndex = 100 - Math.round(a * 10);
        el.classList.toggle("is-front", a < .5);
        el.tabIndex = a < .5 ? 0 : -1;
      }
      if (base !== centre) { centre = base; caption(); }
      requestAnimationFrame(frame);
    }
    const step = d => { target = Math.round(target !== null ? target : pos) + d; vel = 0; };
    const apply = () => {
      let b = cur ? by(cur) : mix;
      const s = q.trim().toLowerCase();
      if (s) b = b.filter(w => `${w.artist} ${w.title} ${w.date}`.toLowerCase().includes(s));
      list = b; pos = 0; vel = 0; target = null; centre = -1;
      els.forEach(el => (el.dataset.key = ""));
      $$("[data-wg]", bar).forEach(x => x.setAttribute("aria-pressed", x.dataset.wg === cur));
    };
    bar.addEventListener("click", e => { const b = e.target.closest("[data-wg]"); if (b) { cur = b.dataset.wg; apply(); } });
    $("[data-wq]").addEventListener("input", e => { q = e.target.value; apply(); });
    $("[data-wprev]").addEventListener("click", () => step(-1));
    $("[data-wnext]").addEventListener("click", () => step(1));
    pauseBtn.addEventListener("click", () => { paused = !paused; label(); });
    // Leiste: mit einem Zug quer durch die ganze Auswahl
    scrub.addEventListener("input", () => { scrubbing = true; vel = 0; const cur = real(Math.round(pos)); target = Math.round(pos) + (+scrub.value - cur); });
    scrub.addEventListener("change", () => { scrubbing = false; });
    label();
    stage.addEventListener("keydown", e => { if (e.key === "ArrowRight") { step(1); e.preventDefault(); } if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); } });
    stage.addEventListener("pointerenter", () => { hover = true; });
    stage.addEventListener("pointerleave", () => { hover = false; });
    // ziehen mit Schwung
    stage.addEventListener("pointerdown", e => { if (e.button) return; drag = true; moved = 0; lastX = e.clientX; lastT = performance.now(); vel = 0; target = null; stage.classList.add("is-drag"); });
    addEventListener("pointermove", e => {
      if (!drag) return;
      // ziehen: der Strom folgt der Hand
      const gap = stage.clientHeight * GAP, dx = e.clientX - lastX, t = performance.now();
      const step = dx / gap * 1.6;                                             // leichtgängig: die Hand bewegt mehr als ein Werk
      moved += Math.abs(dx); pos -= step; vel = vel * .6 + (-step / Math.max(.001, (t - lastT) / 1000)) * .4; lastX = e.clientX; lastT = t;
    });
    const drop = () => { if (!drag) return; drag = false; stage.classList.remove("is-drag"); if (performance.now() - lastT > 90) vel = 0; vel = Math.max(-45, Math.min(45, vel)); };
    addEventListener("pointerup", drop); addEventListener("pointercancel", drop);
    // Klick: Werk am Rand kommt nach vorn, das vordere öffnet sich in der Online Sammlung
    stage.addEventListener("click", e => {
      const a = e.target.closest(".sw");
      if (moved > 6) { e.preventDefault(); moved = 0; return; }
      if (a && !a.classList.contains("is-front")) { e.preventDefault(); target = +a.dataset.i; vel = 0; }
    });
    stage.addEventListener("dragstart", e => e.preventDefault());
    stage.addEventListener("wheel", e => { if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; e.preventDefault(); target = null; vel += e.deltaX * .03; }, { passive: false });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "200px 0px" }).observe(stage);
    requestAnimationFrame(frame);
  }

  /* ───────── Bild beim Darüberfahren: erscheint neben der Maus und folgt ihr weich ───────── */
  const pv = $("[data-pv]"), pvImg = $("img", pv);
  if (matchMedia("(hover: hover)").matches) {
    let x = 0, y = 0, cx = 0, cy = 0, raf = null, on = false;
    const TILT_Y = 30, TILT_X = 14, sayEl = $("[data-say]"), ansEl = $("[data-answer]");
    const loop = () => {
      cx += (x - cx) * .18; cy += (y - cy) * .18;
      pv.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = on || Math.abs(x - cx) + Math.abs(y - cy) > .5 ? requestAnimationFrame(loop) : null;
    };
    document.addEventListener("pointerover", e => {
      const a = e.target.closest("[data-img]");
      if (!a) { on = false; pv.classList.remove("is-on"); return; }
      if (a.dataset.lo) {
        // erst die kleine Vorschau (lädt sofort), dann die große Fassung, sobald sie da ist
        if (pv.dataset.for !== a.dataset.img) { pv.dataset.for = a.dataset.img; pvImg.src = a.dataset.lo; const hi = new Image(); hi.onload = () => { if (pv.dataset.for === hi.src) pvImg.src = hi.src; }; hi.src = a.dataset.img; }
      } else if (pvImg.getAttribute("src") !== a.dataset.img) { pv.dataset.for = ""; pvImg.src = a.dataset.img; }
      if (!on) { cx = x; cy = y; }
      on = true; pv.classList.add("is-on");
      if (!raf) raf = requestAnimationFrame(loop);
    });
    addEventListener("pointermove", e => {
      // rechts unter der Maus, am rechten und unteren Rand nach innen ausweichen
      const w = pv.offsetWidth, h = pv.offsetHeight || w;
      x = e.clientX + 22 + w > innerWidth ? e.clientX - 22 - w : e.clientX + 22;
      y = Math.max(8, Math.min(e.clientY + 18, innerHeight - h - 8));
      // Perspektive wie beim Zitat in V1: gemessen von der Schirmmitte
      const ry = ((e.clientX / innerWidth - .5) * 2 * TILT_Y).toFixed(2) + "deg";
      const rx = ((.5 - e.clientY / innerHeight) * 2 * TILT_X).toFixed(2) + "deg";
      pv.style.setProperty("--rx", rx); pv.style.setProperty("--ry", ry);
      // die Farbfläche ist breit: deutlich sanfter kippen als das Bild
      const sp = $("[data-space]");
      if (sp) { sp.style.setProperty("--rx", ((.5 - e.clientY / innerHeight) * 2 * 7).toFixed(2) + "deg"); sp.style.setProperty("--ry", ((e.clientX / innerWidth - .5) * 2 * 9).toFixed(2) + "deg"); }
      [sayEl, ansEl].forEach(el => { if (!el) return; el.style.setProperty("--rx", (parseFloat(rx) * .5).toFixed(2) + "deg"); el.style.setProperty("--ry", (parseFloat(ry) * .3).toFixed(2) + "deg"); });
    }, { passive: true });
  }

  /* ───────── Laufband: läuft langsam, lässt sich greifen und werfen ───────── */
  const run = $("[data-run]");
  if (run) {
    const track = $(".run__track", run);
    const SPEED = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : -55;   // px pro Sekunde
    let paused = SPEED === 0;
    let pos = 0, vel = SPEED, drag = false, lastX = 0, lastT = 0, prev = performance.now();
    const tick = t => {
      const dt = Math.min(.05, (t - prev) / 1000); prev = t;
      if (!drag) { vel += ((paused ? 0 : SPEED) - vel) * Math.min(1, dt * 2.2); pos += vel * dt; }   // nach dem Wurf weich zurück ins Grundtempo
      const half = track.scrollWidth / 2;
      if (half) pos = ((pos % half) - half) % half;
      track.style.transform = `translate3d(${pos}px, 0, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Bewegung lässt sich anhalten (für alle, die Bewegtes stört)
    const pauseBtn = $("[data-run-pause]");
    const label = () => { pauseBtn.textContent = paused ? L("Laufband fortsetzen", "Resume ticker") : L("Laufband anhalten", "Pause ticker"); pauseBtn.setAttribute("aria-pressed", paused); };
    if (pauseBtn) { label(); pauseBtn.addEventListener("click", () => { paused = !paused; label(); }); }
    run.addEventListener("pointerdown", e => { drag = true; lastX = e.clientX; lastT = performance.now(); vel = 0; run.classList.add("is-grab"); run.setPointerCapture(e.pointerId); });
    run.addEventListener("pointermove", e => {
      if (!drag) return;
      const t = performance.now(), dx = e.clientX - lastX;
      pos += dx; vel = dx / Math.max(.001, (t - lastT) / 1000); lastX = e.clientX; lastT = t;
    });
    const drop = () => { if (!drag) return; drag = false; run.classList.remove("is-grab"); if (performance.now() - lastT > 80) vel = 0; vel = Math.max(-4000, Math.min(4000, vel)); };
    run.addEventListener("pointerup", drop); run.addEventListener("pointercancel", drop);
  }

  /* ───────── „Und was erregt Sie?“ – die Seite antwortet selbst ─────────
     Sie merkt sich, woran jemand hängen bleibt (Maus verweilt, Klick), und nennt am Ende die drei stärksten Dinge.
     Gilt für diesen Tab; mit ?neu in der Adresse beginnt die Zählung von vorn. */
  const ans = $("[data-answer]");
  if (ans) {
    const KEY = "v2like";
    if (new URLSearchParams(location.search).has("neu")) { try { sessionStorage.removeItem(KEY); } catch (e) {} }
    let score = {};
    try { score = JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch (e) {}
    let shown = "";
    const render = () => {
      const top = Object.entries(score).filter(([, v]) => v.n >= 1).sort((a, b) => b[1].n - a[1].n || b[1].t - a[1].t).slice(0, 3).map(([k]) => k);
      const key = top.join("|");
      if (key === shown) return;
      shown = key;
      // die Antwort als ganzer Satz, damit sie sich selbst erklärt: „Auf dieser Seite waren es A, B und C.“
      const box = (n, i) => `<span class="ans__n" style="--i:${i}"><i class="ans__p" aria-hidden="true"></i><span class="ans__w">${n.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span></span>`;
      const und = L(" und ", " and ");
      const list = top.map(box).reduce((out, b, i) => out + (i === 0 ? "" : i === top.length - 1 ? und : ", ") + b, "");
      ans.innerHTML = top.length ? `${top.length === 1 ? L("Auf dieser Seite war es", "On this page it was") : L("Auf dieser Seite waren es", "On this page it was")} ${list}.<span class="ans__ast">*</span>` : "";
      ans.closest(".bigcta").classList.toggle("has-answer", top.length > 0);
    };
    const add = (name, pts) => {
      const s = score[name] || (score[name] = { n: 0, t: 0 });
      s.n += pts; s.t = Date.now();
      try { sessionStorage.setItem(KEY, JSON.stringify(score)); } catch (e) {}
      render();
    };
    let cur = null, timer = null;
    const stop = () => { clearTimeout(timer); timer = null; cur = null; };
    const dwell = (name, ms) => { timer = setTimeout(() => { add(name, 1); dwell(name, 1600); }, ms); };
    document.addEventListener("pointerover", e => {
      if (e.pointerType === "touch") return;
      const el = e.target.closest("[data-like]"), name = el && el.dataset.like;
      if (name === cur) return;
      stop();
      if (name) { cur = name; dwell(name, 900); }
    });
    document.addEventListener("pointerleave", stop);
    addEventListener("blur", stop);
    document.addEventListener("click", e => { const el = e.target.closest("[data-like]"); if (el) add(el.dataset.like, 2); });
    render();
  }

  /* ───────── Navigation: aktiver Bereich ───────── */
  const links = $$("[data-nav]");
  const targets = links.map(a => $("#" + a.dataset.nav)).filter(Boolean);
  function mark() {
    let cur = "heute";
    targets.forEach(t => { if (t.getBoundingClientRect().top < innerHeight * .4) cur = t.id; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = "besuch";
    links.forEach(a => a.classList.toggle("is-on", a.dataset.nav === cur));
  }
  addEventListener("scroll", mark, { passive: true });
  mark();

  /* ───────── Newsletter ───────── */
  const news = $("[data-news]"), input = $("input", news), msg = $("[data-news-msg]");
  input.addEventListener("input", () => { news.classList.remove("is-error"); msg.textContent = ""; });
  news.addEventListener("submit", e => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    news.classList.toggle("is-error", !ok);
    msg.textContent = ok ? L("Danke. Bitte bestätigen Sie die E-Mail in Ihrem Postfach.", "Thank you. Please confirm the email in your inbox.") : L("Bitte eine gültige E-Mail-Adresse eingeben.", "Please enter a valid email address.");
  });

  /* ───────── Aufbau: dezent einblenden ───────── */
  $$(".today .k, .say, .tix__head, .tix__body, .sec > .h, .foot__cols > div").forEach((el, i) => { el.classList.add("in"); el.style.setProperty("--d", (i % 6) * 50 + "ms"); });
  const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); obs.unobserve(e.target); } }), { rootMargin: "0px 0px -5% 0px" });
  $$(".in").forEach(el => obs.observe(el));
})();
