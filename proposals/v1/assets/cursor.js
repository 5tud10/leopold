/* Mauszeiger: schwarzer Punkt im Differenz-Modus (weißer Punkt + mix-blend-mode: difference
   wirkt auf Weiß schwarz und kehrt Bilder darunter um). Nur mit Maus, nicht auf Touch. */
(() => {
  "use strict";
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const dot = document.createElement("div");
  dot.className = "cursor";
  dot.setAttribute("aria-hidden", "true");
  document.body.appendChild(dot);
  document.documentElement.classList.add("has-cursor");
  let x = -100, y = -100, cx = x, cy = y, raf = null;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loop = () => {
    cx += (x - cx) * (reduced ? 1 : .35); cy += (y - cy) * (reduced ? 1 : .35);
    dot.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > .1 ? requestAnimationFrame(loop) : null;
  };
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY;
    dot.classList.add("is-on");
    // größer über allem, was klickbar ist; im Textfeld verschwindet der Punkt zugunsten des Textcursors
    const t = e.target instanceof Element ? e.target : document.body;
    dot.classList.toggle("is-link", !!t.closest("a, button, [role=button], label, .chip, .fgrid.is-pointing, .card, .ev__link"));
    dot.classList.toggle("is-text", !!t.closest("input, textarea"));
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener("pointerleave", () => dot.classList.remove("is-on"));
  addEventListener("pointerdown", () => dot.classList.add("is-down"));
  addEventListener("pointerup", () => dot.classList.remove("is-down"));
})();
