/* Zitat Rudolf Leopold: das Wort „erregt“ dreht sich beim Darüberfahren sanft mit der Maus (wie die Kalender-Kacheln);
   erst ein Klick dreht wie eine Würfelseite das nächste Wort herein: provoziert, fasziniert, berührt …
   Die Umbruchstelle ist fest („Was mich nicht ___, / interessiert mich nicht.“), es bricht nichts um. */
(() => {
  "use strict";
  const box = document.querySelector("[data-quote]");
  if (!box) return;
  const slot = box.querySelector("[data-quote-word]");
  const text = box.querySelector("[data-quote-text]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const words = () => {
    const I = window.I18N || {}, lang = document.documentElement.lang === "en" ? "en" : "de";
    return (I[lang] && I[lang].quoteWords) || ["erregt"];
  };
  let i = 0, busy = false;
  // Farbfläche hinter dem Wort: wechselt mit jedem Wort, Schrift hell oder dunkel je nach Fläche
  const PLATES = [["#F6FF54", "#111"], ["#9db4e8", "#111"], ["#f2a48c", "#111"], ["#c9a65a", "#111"], ["#b9dcc4", "#111"],
                  ["#d8b1a6", "#111"], ["#cdb9ef", "#111"], ["#e8c25a", "#111"], ["#9aa07a", "#111"], ["#f0b8d0", "#111"]];   // hell genug für schwarze Schrift beim Multiplizieren
  // eigene Ebene neben dem Wort (nicht darin), damit sie mit der Seite multipliziert und das Wort trotzdem 3D bleibt
  const nb = slot.parentElement;
  const plate = document.createElement("span");
  plate.className = "quote__plate";
  plate.setAttribute("aria-hidden", "true");
  nb.prepend(plate);
  const setW = w => nb.style.setProperty("--w", w + "px");
  const paint = () => nb.style.setProperty("--plate", PLATES[i % PLATES.length][0]);
  paint();

  // Würfel-Dreh: altes Wort klappt nach oben weg, neues kommt von unten aus der Tiefe; Breite folgt weich
  function show(n) {
    const list = words();
    i = (n + list.length) % list.length;
    paint();
    const old = slot.querySelector(".quote__w.is-in");
    const next = document.createElement("span");
    next.className = "quote__w";
    next.textContent = list[i];
    slot.appendChild(next);
    setW(old ? old.offsetWidth : next.offsetWidth);
    busy = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setW(next.offsetWidth);
      next.classList.add("is-in");
      if (old) { old.classList.remove("is-in"); old.classList.add("is-out"); setTimeout(() => old.remove(), 1100); }
      setTimeout(() => (busy = false), 700);
    }));
  }

  // Schrift so groß wie möglich, aber die Zeile mit dem längsten Wort muss passen
  function fit() {
    text.style.fontSize = "";
    const probe = document.createElement("span");
    probe.className = "quote__w is-in";
    probe.style.cssText = "position:absolute;visibility:hidden";
    slot.appendChild(probe);
    let max = 0;
    words().forEach(w => { probe.textContent = w; max = Math.max(max, probe.offsetWidth); });
    probe.remove();
    const need = box.querySelector(".quote__l1").getBoundingClientRect().width - slot.offsetWidth + max;
    const avail = box.clientWidth - 2 * parseFloat(getComputedStyle(box).paddingLeft || 0);
    if (need > avail) text.style.fontSize = (parseFloat(getComputedStyle(text).fontSize) * avail / need).toFixed(1) + "px";
  }

  // kräftiges Mitdrehen in die Perspektive, je nachdem wo die Maus auf dem Bildschirm ist (solange das Zitat zu sehen ist)
  const TILT_Y = 50, TILT_X = 24;
  let inView = false, raf = null, mx = innerWidth / 2, my = innerHeight / 2;
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (!inView) { nb.style.setProperty("--ry", "0deg"); nb.style.setProperty("--rx", "0deg"); }
  }).observe(box);
  const tilt = () => {
    raf = null;
    // von der Bildschirmmitte aus gemessen: in alle Richtungen gleich stark
    const dx = Math.max(-1, Math.min(1, (mx - innerWidth / 2) / (innerWidth / 2)));
    const dy = Math.max(-1, Math.min(1, (my - innerHeight / 2) / (innerHeight / 2)));
    nb.style.setProperty("--ry", (dx * TILT_Y).toFixed(2) + "deg");
    nb.style.setProperty("--rx", (-dy * TILT_X).toFixed(2) + "deg");
  };
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || reduced || !inView) return;
    mx = e.clientX; my = e.clientY;
    slot.classList.add("is-tilting");
    if (!raf) raf = requestAnimationFrame(tilt);
  }, { passive: true });
  addEventListener("scroll", () => { if (inView && !reduced && !raf) raf = requestAnimationFrame(tilt); }, { passive: true });

  // erst der Klick zeigt das nächste Wort
  box.addEventListener("click", () => { if (!busy) show(i + 1); });

  // beim Laden gleich das Wort der eingestellten Sprache (z. B. „excite“), nicht das deutsche aus dem HTML
  slot.querySelector(".quote__w.is-in").textContent = words()[0];
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { setW(slot.querySelector(".quote__w.is-in").offsetWidth); fit(); });
  addEventListener("resize", fit);
  new MutationObserver(() => { slot.querySelectorAll(".quote__w").forEach(w => w.remove()); i = -1; show(0); requestAnimationFrame(fit); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
