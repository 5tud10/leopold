/* Leopold Museum – Termine, gemeinsam für Startseite (Kalender) und Unterseite (event.html)
   Quelle: Programm der Museumsseite (leopoldmuseum.org/de/besuch/programm), Stand Oktober 2026. */
const evt = (d, h, m, type, key) => ({ d, h, m, type, key });
window.EVENTS = [
  evt("2026-10-03", 14, 0, "tour", "evPremiere"),
  evt("2026-10-03", 15, 0, "program", "evFigur"),
  evt("2026-10-03", 15, 30, "tour", "evBoeckl"),
  evt("2026-10-04", 15, 0, "program", "evFigur"),
  evt("2026-10-04", 15, 0, "tour", "ev25"),
  evt("2026-10-10", 14, 0, "tour", "evPremiere"),
  evt("2026-10-10", 15, 0, "program", "evFigur"),
  evt("2026-10-10", 15, 30, "tour", "evBoeckl"),
  evt("2026-10-11", 15, 0, "program", "evFigur"),
  evt("2026-10-11", 15, 0, "tour", "ev25"),
  evt("2026-10-14", 13, 0, "tour", "evFavorites"),
  evt("2026-10-17", 15, 0, "program", "evFigur"),
  evt("2026-10-17", 15, 30, "tour", "evBoeckl"),
  evt("2026-10-18", 15, 0, "program", "evFigur"),
  evt("2026-10-18", 15, 0, "tour", "ev25"),
  evt("2026-10-19", 15, 0, "tour", "evKlimtSchiele"),
  evt("2026-10-24", 15, 0, "program", "evFigur"),
  evt("2026-10-24", 15, 30, "tour", "evBoeckl"),
  evt("2026-10-25", 15, 0, "program", "evFigur"),
  evt("2026-10-25", 15, 0, "tour", "ev25"),
  evt("2026-10-26", 15, 0, "tour", "ev25"),
  evt("2026-10-28", 13, 0, "tour", "evFavorites"),
  evt("2026-10-29", 16, 30, "tour", "evCurator"),
  evt("2026-10-31", 15, 0, "program", "evFigur"),
  evt("2026-10-31", 15, 30, "tour", "evBoeckl"),
  evt("2026-10-31", 16, 30, "tour", "evMorbid"),
  evt("2026-11-11", 13, 0, "tour", "evFavorites"),
  evt("2026-11-14", 15, 0, "program", "evFarben"),
  evt("2026-11-14", 15, 30, "tour", "evBoeckl"),
  evt("2026-11-15", 15, 0, "tour", "ev25"),
  evt("2026-11-15", 15, 30, "program", "evFarben"),
  evt("2026-11-16", 15, 0, "tour", "evKlimtSchiele"),
  evt("2026-11-21", 15, 0, "program", "evFarben"),
  evt("2026-11-21", 15, 30, "tour", "evBoeckl"),
  evt("2026-11-22", 15, 0, "program", "evFarben"),
  evt("2026-11-22", 15, 0, "tour", "ev25"),
  evt("2026-11-25", 13, 0, "tour", "evFavorites"),
  evt("2026-11-28", 15, 0, "program", "evFarben"),
  evt("2026-11-28", 15, 30, "tour", "evBoeckl"),
  evt("2026-11-29", 15, 0, "program", "evFarben"),
  evt("2026-12-03", 18, 0, "program", "evPorr"),
  evt("2026-12-05", 15, 0, "program", "evGestalt"),
  evt("2026-12-05", 15, 30, "tour", "evBoeckl"),
  evt("2026-12-06", 15, 0, "program", "evGestalt"),
  evt("2026-12-06", 15, 0, "tour", "ev25")
].sort((a, b) => a.d.localeCompare(b.d) || a.h * 60 + a.m - (b.h * 60 + b.m));

// Pro Programmpunkt: Kategorie (wie auf der Museumsseite), Bild, Farbe, zugehörige Ausstellung, Zusatzzeile
const EX_BOECKL = { exTitle: "Herbert Boeckl – Hans Josephsohn", exSub: "subBoeckl", exDate: "dateBoeckl" };
const EX_VIENNA = { exTitle: "Wien 1900", exSub: "subVienna", exDate: "statusPermanent" };
window.EV_META = {
  evPremiere:     { cat: "catHighlights", img: "assets/img/ex/7374.jpg", pos: "55% 25%", color: "#ee2131", exTitle: "Premiere!", exSub: "subPremiere", exDate: "datePremiere" },
  evBoeckl:       { cat: "catHighlights", img: "assets/img/ev/7499.jpg", pos: "50% 40%", color: "#e8dfcf", ...EX_BOECKL },
  evCurator:      { cat: "catCurator", sub: "subCurator", img: "assets/img/ex/7314.jpg", pos: "35% 40%", color: "#002fa7", ...EX_BOECKL },
  evFigur:        { cat: "catKids", img: "assets/img/ev/366.jpg", pos: "50% 50%", color: "#002fa7", ...EX_BOECKL },
  ev25:           { cat: "cat25", img: "assets/img/ev/6028.jpg", pos: "50% 40%", color: "#b5bcad", ...EX_VIENNA },
  evFavorites:    { cat: "catExpert", sub: "subFavorites", img: "assets/img/ev/6585.jpg", pos: "50% 40%", color: "#cfccc5", ...EX_VIENNA },
  evKlimtSchiele: { cat: "catVienna", sub: "subKlimtSchiele", img: "assets/img/ev/6583.jpg", pos: "50% 40%", color: "#e8dfcf", ...EX_VIENNA },
  evMorbid:       { cat: "catSpecialTour", sub: "subMorbid", img: "assets/img/ev/5368.jpg", pos: "50% 40%", color: "#ee2131", ...EX_VIENNA },
  evFarben:       { cat: "catKids", img: "assets/img/ev/366.jpg", pos: "30% 50%", color: "#ee2131" },
  evGestalt:      { cat: "catKids", img: "assets/img/ev/366.jpg", pos: "70% 50%", color: "#b5bcad" },
  evPorr:         { cat: "catSpecial", sub: "subPorr", color: "#111111" }
};

// eindeutiger Schlüssel eines Termins, z. B. für event.html?id=2026-10-10-1530-evBoeckl
window.eventId = ev => `${ev.d}-${String(ev.h).padStart(2, "0")}${String(ev.m).padStart(2, "0")}-${ev.key}`;

// Werke aus der Sammlung zum Programmpunkt (Online Sammlung, offizielle Titel DE/EN)
window.EV_WORKS = {
  boeckl: [
    { img: "web-lm-01264", slug: "1405-selbstbildnis-als-akt-vor-staffelei", de: ["Selbstbildnis als Akt vor Staffelei", "1919", "Aquarell auf Papier"], en: ["Nude Self-Portrait in Front of Easel", "1919", "Watercolor on paper"] },
    { img: "web-lm-01257", slug: "1398-sturzender-mannerakt", de: ["Stürzender Männerakt", "1919", "Schwarze Kreide auf Papier"], en: ["Falling Male Nude", "1919", "Black chalk on paper"] },
    { img: "web-lm-01269", slug: "1410-sitzender-frauenakt", de: ["Sitzender Frauenakt", "1920", "Kohle, Kreide auf Papier"], en: ["Female Nude, Sitting", "1920", "Charcoal, chalk on paper"] },
    { img: "web-lm-01274", slug: "1415-obstgarten", de: ["Obstgarten", "1918/19", "Bleistift, Aquarell, Öl auf Papier"], en: ["Orchard", "1918/19", "Pencil, watercolor, oil on paper"] },
    { img: "web-lm-01282", slug: "1423-blick-vom-atelier-auf-die-stadt", de: ["Blick vom Atelier auf die Stadt", "1930", "Tusche auf Papier"], en: ["View from Studio over the City", "1930", "India ink on paper"] },
    { img: "web-lm-01280", slug: "1421-stillleben-mit-fruchten-und-fischen", de: ["Stillleben mit Früchten und Fischen", "1922", "Kohle, Kreide auf Papier"], en: ["Still Life with Fruits and Fish", "1922", "Charcoal, chalk on paper"] }
  ]
};
window.EV_META.evBoeckl.works = "boeckl";
window.EV_META.evFigur.works = "boeckl";
window.EV_META.evCurator.works = "boeckl";

// In Kalender eintragen: echte .ics-Datei (Apple, Google, Outlook), Dauer 1 Stunde angenommen
window.downloadIcs = (ev, T) => {
  const pad = n => String(n).padStart(2, "0");
  const stamp = (d, h, m) => d.replace(/-/g, "") + "T" + pad(h) + pad(m) + "00";
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Leopold Museum//Konzeptentwurf//DE",
    "BEGIN:VEVENT",
    `UID:${window.eventId(ev)}@leopoldmuseum-entwurf`,
    `DTSTART;TZID=Europe/Vienna:${stamp(ev.d, ev.h, ev.m)}`,
    `DTEND;TZID=Europe/Vienna:${stamp(ev.d, ev.h + 1, ev.m)}`,
    `SUMMARY:${T(ev.key).replace(/­/g, "")} (${T(ev.type === "tour" ? "calTour" : "calProgram")})`,
    `LOCATION:${T("placeText")}`,
    `DESCRIPTION:${T(ev.key + "Desc")}`,
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `${window.eventId(ev)}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
