/* Seite baut sich beim Scrollen auf – sehr dezent (wie in Framer): Elemente blenden ein und steigen 14 px,
   Geschwister leicht nacheinander. Nutzt die Eigenschaft „translate“, damit eigene Transforms (Kippen, 3D) unberührt bleiben.
   Nach dem Einblenden werden die Klassen wieder entfernt, damit die eigenen Übergänge der Elemente weiter gelten. */
(() => {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("shot") || !("IntersectionObserver" in window)) return;
  const SEL = [
    ".updates__label", ".quote__text", ".quote__by", ".quote__more p",
    ".plan__head", ".plan__building", ".plan__item", ".cal__side", ".focus__item", ".filter",
    ".fgrid", ".footer__mid > *", ".footer__cols > div", ".footb__say", ".footb__news",
    ".evp__back", ".evp__kicker", ".evp__title", ".evp__when", ".evp__image", ".evp__row > *", ".evp__work"
  ].join(",");
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      obs.unobserve(el);
      el.classList.add("is-in");
      const done = () => el.classList.remove("rv", "is-in");
      setTimeout(done, 1500 + (parseFloat(el.style.getPropertyValue("--rv-d")) || 0));
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

  function prepare(root = document) {
    const groups = new Map();
    root.querySelectorAll(SEL).forEach(el => {
      if (el.dataset.rv || el.classList.contains("rise") || el.closest(".menu, .sheet, .hero")) return;
      el.dataset.rv = "1";
      // schon im Bild (z. B. beim Laden): nicht verstecken, das würde flackern
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0 && scrollY > 10) return;
      const n = groups.get(el.parentElement) || 0;
      groups.set(el.parentElement, n + 1);
      el.style.setProperty("--rv-d", Math.min(n, 5) * 70 + "ms");
      el.classList.add("rv");
      obs.observe(el);
    });
  }
  prepare();
  // nachträglich eingefügte Inhalte (Unterseite, Sprache) ebenfalls erfassen
  let t = null;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(prepare, 120); }).observe(document.body, { childList: true, subtree: true });
})();
