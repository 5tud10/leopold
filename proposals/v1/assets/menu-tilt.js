/* Offenes Menü kippt räumlich zur Maus (wie Kalender-Kacheln und Zitat), dezent, damit es bedienbar bleibt. */
(() => {
  "use strict";
  const menu = document.querySelector("[data-menu]") || document.querySelector(".menu");
  const panel = menu && menu.querySelector(".menu__panel");
  if (!panel || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
  const TILT_Y = 20, TILT_X = 14;
  let raf = null, mx = 0, my = 0, ready = false, readyT = null;
  const apply = () => {
    raf = null;
    const r = panel.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, (mx - (r.left + r.width / 2)) / (r.width / 2)));
    const dy = Math.max(-1, Math.min(1, (my - (r.top + r.height / 2)) / (r.height / 2)));
    panel.style.setProperty("--ty", (dx * TILT_Y).toFixed(2) + "deg");
    panel.style.setProperty("--tx", (-dy * TILT_X).toFixed(2) + "deg");
  };
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || !menu.classList.contains("is-open") || !ready) return;   // erst aufklappen, dann kippen
    mx = e.clientX; my = e.clientY;
    panel.classList.add("is-tilting");
    if (!raf) raf = requestAnimationFrame(apply);
  }, { passive: true });
  // beim Schließen wieder gerade
  new MutationObserver(() => {
    clearTimeout(readyT);
    if (menu.classList.contains("is-open")) {
      // nach dem Aufklappen setzt das Kippen weich ein (langsamer Übergang beim ersten Mal)
      ready = false;
      readyT = setTimeout(() => {
        ready = true;
        panel.classList.add("is-tilt-in");
        setTimeout(() => panel.classList.remove("is-tilt-in"), 700);
      }, 450);
      return;
    }
    ready = false;
    panel.classList.remove("is-tilting");
    panel.style.setProperty("--ty", "0deg"); panel.style.setProperty("--tx", "0deg");
  }).observe(menu, { attributes: true, attributeFilter: ["class"] });
})();
