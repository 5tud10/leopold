/* V8 · Kopf-Varianten, Inhalte, Karte mit Menü, Strichleiste */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const V1 = "../v1/";
  // Sprache: ?lang=en oder die zuletzt gewählte
  let lang = new URLSearchParams(location.search).get("lang");
  try { lang = lang || localStorage.getItem("v8lang"); if (lang) localStorage.setItem("v8lang", lang); } catch (e) {}
  lang = lang === "en" ? "en" : "de";
  const EN = lang === "en", L = (de, en) => (EN ? en : de);
  document.documentElement.lang = lang;
  const DE = (window.I18N && window.I18N[lang]) || {};
  const has = (k) => DE[k] !== undefined;
  const T = (k) => String(has(k) ? DE[k] : k).replace(/­/g, "");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TIX = "https://www.leopoldmuseum.org/de/besuch/tickets-preise/online-ticket";
  const EXURL = "https://www.leopoldmuseum.org/de/ausstellungen";
  const COLL = "https://onlinecollection.leopoldmuseum.org/";
  const LM = "https://www.leopoldmuseum.org/de/";
  const MAPS = "https://www.google.com/maps/search/?api=1&query=Leopold+Museum%2C+Museumsplatz+1%2C+1070+Wien";
  const ext = (h) => (/^http/.test(h) ? ' target="_blank" rel="noopener"' : "");

  /* ── Zeit ── */
  const now = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayISO = iso(now), mins = now.getHours() * 60 + now.getMinutes();
  /* Öffnungszeiten laut leopoldmuseum.org (Stand 12.10.2026):
     täglich außer Dienstag 10–18 Uhr, feiertags geöffnet;
     07.12.2026–10.01.2027 täglich; 24.12. geschlossen; 31.12. bis 17 Uhr. */
  const closeAt = (d) => {
    const s = iso(d);
    if (s === "2026-12-24") return 0;
    if (s === "2026-12-31") return 17 * 60;
    if (d.getDay() === 2 && !(s >= "2026-12-07" && s <= "2027-01-10")) return 0;
    return 18 * 60;
  };
  const shut = closeAt(now), shutH = shut / 60;
  const open = shut > 0 && mins >= 600 && mins < shut;
  const WDL = EN ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] : ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const clock = (h) => (EN ? `${h % 12 || 12} ${h < 12 ? "am" : "pm"}` : `${h} Uhr`);
  // der nächste Tag, an dem geöffnet ist
  let nextDay = new Date(now), ahead = 0;
  if (!(shut > 0 && mins < 600)) do { nextDay.setDate(nextDay.getDate() + 1); ahead++; } while (!closeAt(nextDay));
  const nextName = ahead === 0 ? L("Heute", "Today") : ahead === 1 ? L("Morgen", "Tomorrow") : WDL[nextDay.getDay()];
  const daysTo = (d) => Math.round((new Date(d + "T00:00") - new Date(todayISO + "T00:00")) / 864e5);
  const WD = EN ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const dm = (d) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;
  const hm = (e) => `${String(e.h).padStart(2, "0")}:${String(e.m).padStart(2, "0")} Uhr`;
  const day = (e) => (e.d === todayISO ? L("Heute", "Today") : `${WD[new Date(e.d + "T00:00").getDay()]} ${dm(e.d)}`);
  const leftM = shut - mins, leftH = Math.floor(leftM / 60);
  const nb = (t) => `<span class="nb">${t}</span>`;
  const openShort = open ? L(`Offen bis ${shutH} Uhr`, `Open until ${clock(shutH)}`) : L(`${nextName} ab 10 Uhr`, `${nextName} from 10 am`);
  const openLong = open
    ? (leftM < 60 ? L(`Heute noch ${nb(leftM + " Minuten")} geöffnet`, `Open for another ${nb(leftM + " minutes")} today`) : L(`Heute noch ${nb(`${leftH} ${leftH === 1 ? "Stunde" : "Stunden"}`)} geöffnet, bis ${nb(shutH + " Uhr")}`, `Open for another ${nb(`${leftH} ${leftH === 1 ? "hour" : "hours"}`)} today, until ${nb(clock(shutH))}`))
    : `${shut === 0 && ahead > 0 && mins < 1080 ? L("Heute geschlossen. ", "Closed today. ") : ""}${L(`${nextName}${ahead ? " wieder" : ""} ab ${nb("10 Uhr")} geöffnet`, `Open ${ahead ? "again " : ""}${nextName.toLowerCase()} from ${nb("10 am")}`)}`;
  $("#openState").textContent = openShort;

    const lab = (...p) => `<p class="lab">${p.filter(Boolean).map((t, i) => (i ? `<span>${t}</span>` : t)).join("")}</p>`;
  const own = (p) => (p.startsWith("img/") ? p : V1 + p); // eigene Bilder von V8 oder die aus V1
  const shot = (src, alt, ratio, pos, plane) => `<div class="shot" style="aspect-ratio:${ratio}"><img src="${esc(src)}" alt="${esc(alt || "")}" loading="lazy" decoding="async"${pos ? ` style="object-position:${pos}"` : ""}>${plane ? `<span class="plane" aria-hidden="true">${plane}</span>` : ""}</div>`;

  /* ── Besuch: erst das Nötigste für den ersten Besuch, der Rest zum Aufklappen ── */
  const more = [
    ["Öffnungszeiten im Detail", `Täglich außer Dienstag 10 – 18 Uhr, feiertags geöffnet. Die Kassa schließt eine halbe Stunde vorher. Von 7.12.2026 bis 10.1.2027 täglich geöffnet, am 24.12. geschlossen, am 31.12. bis 17 Uhr.`],
    ["Ermäßigungen, Familien, Kombitickets", `Ermäßigt 16 € für alle unter 26 und ab 65, Menschen mit Behinderung und Beschäftigungslose. Familienticket 21 € (1 Erwachsener) oder 40 € (2 Erwachsene), jeweils mit bis zu 3 Jugendlichen. Mit Vienna City Card 17 €. Kombitickets mit Kunsthistorischem Museum 37 €, mumok 33 €, MAK 34 €.`, ["Alle Preise", LM + "besuch/tickets-preise"]],
    ["Jahreskarte", `49 €, ermäßigt 36 € (unter 30, über 65). 12 Monate freier Eintritt inklusive aller Sonderausstellungen und über 180 Vermittlungsprogramme im Jahr.`, ["Zur Jahreskarte", LM + "besuch/tickets-preise/jahreskarten"]],
    ["Führungen und Audioguide", `Öffentliche Führungen an Samstagen, Sonntagen, Feiertagen und ausgewählten Terminen, 5 € zuzüglich Eintritt. Audiotouren auf Deutsch, Englisch, Italienisch, Französisch, Spanisch und Koreanisch.`, ["Vermittlung", LM + "besuch/vermittlung"]],
    ["Mit Kindern", `Unter 7 Jahren ist der Eintritt frei, unter 19 Jahren kostet er 2,50 €. Das LEO Kinderatelier für 6- bis 12-Jährige findet jeden Samstag und Sonntag von 15 bis 16:30 Uhr statt.`],
    ["Barrierefrei", `Außenlift an der Rückseite des Hauses zur Ebene des Haupteingangs, alle Ausstellungen sind mit dem Lift erreichbar. Rollstuhl und Klapphocker gibt es kostenlos an der Garderobe, Assistenzhunde sind willkommen.`, ["Fragen und Antworten", LM + "besuch/fragen-und-antworten"]],
    ["Anreise und Parken", `U2 Museumsquartier, U3 Volkstheater. Straßenbahn 1, 2, D, 49, 71 und Bus 48A bis Ring, Volkstheater. Parkgarage am Museumsplatz, Fahrradständer vor dem Haus.`, ["Anreise", LM + "besuch/anreise"]],
    ["Café, Shop, Garderobe", `Café Leopold auf Ebene 2, auch von außen und ohne Ticket zugänglich. Shop auf Ebene 1. Garderobe und Schließfächer sind vorhanden. Fotografieren ohne Blitz ist in der Sammlung für private Zwecke erlaubt.`, ["Café", LM + "besuch/cafe"]],
    ["Gruppen", `Ab 10 Personen nur mit bestätigter Anmeldung, höchstens 25 Personen pro Gruppe. Gruppentarif 16 €, Jugendliche 2,50 €.`, ["Gruppe anmelden", LM + "besuch/gruppen-und-reiseveranstalter"]],
  ];
  $("#besuch").innerHTML = `${lab("Besuch")}
    <p class="big">Das Leopold Museum zeigt österreichische Kunst vom Biedermeier bis zur Moderne, darunter die größte Egon-Schiele-Sammlung der Welt. Rund 6.000 Werke auf 7 Ebenen.</p>
    <figure class="wide rv"><div class="shot" style="aspect-ratio:21 / 9"><img src="img/h3915.jpg" alt="Ein lichtdurchfluteter Ausstellungsraum im Leopold Museum" loading="lazy" style="object-position:50% 62%"></div><figcaption class="cred">Bild: Ausstellungsraum im Leopold Museum, Foto Daniel Hawelka</figcaption></figure>
    <div class="three">
      <div class="three__c">${lab("Wann")}<p class="huge">${open ? L(`Bis ${nb(shutH + " Uhr")}`, `Until ${nb(clock(shutH))}`) : `${ahead ? nextName : L("Heute", "Today")}, ${nb(L("10 Uhr", "10 am"))}`}</p><p>${open ? L("Heute geöffnet.", "Open today.") : shut === 0 && ahead > 0 ? L("Heute geschlossen.", "Closed today.") : ahead ? L("Für heute geschlossen.", "Closed for today.") : L("Öffnet heute um 10 Uhr.", "Opens today at 10 am.")} ${L(`Täglich außer Dienstag ${nb("10 – 18 Uhr")}, feiertags geöffnet.`, `Daily except Tuesday ${nb("10 am – 6 pm")}, open on public holidays.`)}</p></div>
      <div class="three__c">${lab("Wo")}<p class="huge">Im MQ</p><p>Museumsplatz 1, 1070 Wien. U2 Museumsquartier, U3 Volkstheater.</p><a class="three__go three__go--line" href="${MAPS}"${ext(MAPS)}>Route öffnen <b>→</b></a></div>
      <div class="three__c">${lab("Eintritt")}<p class="huge"><span class="nb">19 €</span></p><p>Ermäßigt 16 €, unter 19 Jahren 2,50 €, unter 7 Jahren frei.</p><a class="three__go" href="${TIX}"${ext(TIX)}>Tickets kaufen <b>→</b></a></div>
    </div>`;
  // Linke Tabelle, rechts der gewählte Inhalt: Zeile überfahren oder antippen wechselt
  function tabs(root) {
    const links = $$(".cut a", root), panes = $$("[data-pane]", root);
    const mark = (i) => { links.forEach((a, k) => { a.classList.toggle("is-on", k === i); a.setAttribute("aria-selected", k === i); }); panes.forEach((p, k) => p.classList.toggle("is-on", k === i)); };
    links.forEach((a, i) => { a.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); mark(i); }); a.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") mark(i); }); });
    $$("img", root).forEach((im) => { im.loading = "eager"; });
    mark(0);
  }
  $("#wissen").innerHTML = `${lab("Gut zu wissen", `${more.length} Antworten`)}<p class="big">Alles Weitere für den Besuch.</p>
    <div class="split"><ol class="cut">${more.map(([k], i) => `<li><a class="trow" href="#wissen" role="tab"><span class="tc tc--n"><b>${k}</b></span></a></li>`).join("")}</ol>
    <div class="panes">${more.map(([k, t, l]) => `<div class="pane ans" data-pane><p class="ans__t">${t}${l ? ` <a href="${l[1]}"${ext(l[1])}>${l[0]}</a>` : ""}</p></div>`).join("")}</div></div>`;
  tabs($("#wissen"));

  /* ── Im Haus: links bleibt der Schnitt durchs Gebäude stehen, rechts wandern die Ebenen vorbei ──
     Belegt laut leopoldmuseum.org: Wien 1900 auf 0, 3 und 4; Sonderausstellungen auf −1 und −2;
     Shop auf 1; Café auf 2; barrierefreie WCs im Erdgeschoss und auf −1; Führungstreffpunkt im Atrium. */
  const FLOORS = [
    { n: "4", name: "Wien 1900", text: "Die Dauerpräsentation beginnt ganz oben. <i>Aufbruch in die Moderne.</i>", img: "img/h4796.jpg", pos: "50% 50%", cap: "Ausstellungsansicht „Wien 1900. Aufbruch in die Moderne“, 2019" },
    { n: "3", name: "Wien 1900", text: "Die Dauerpräsentation geht hier weiter, mit Malerei, Grafik und Kunsthandwerk der Wiener Moderne.", img: "img/h4797.jpg", pos: "50% 50%", cap: "Ausstellungsansicht „Wien 1900. Aufbruch in die Moderne“, 2019" },
    { n: "2", name: "Café Leopold", text: "Auch von außen und ohne Ticket zugänglich. Frühstück gibt es von 10 bis 12 Uhr." },
    { n: "1", name: "Shop", text: "Kataloge, Bücher und Mitbringsel. Der Shop schließt eine halbe Stunde vor dem Museum." },
    { n: "0", name: "Eingang", text: "Kassa, Garderobe und Schließfächer. Im Atrium treffen sich die Führungen, hier beginnt auch ein Teil von Wien 1900.", img: "img/h3912.jpg", pos: "50% 60%", cap: "Das Atrium des Leopold Museum" },
    { n: "−1", name: "Sonderausstellung", text: "Wechselnde Ausstellungen. Derzeit: Herbert Boeckl – Hans Josephsohn. <i>Archetypen des Figuralen.</i>", img: "img/7499.jpg", pos: "50% 34%", cap: "Herbert Boeckl, Akt vor gelber Kiste, 1925" },
    { n: "−2", name: "Sonderausstellung", text: "Wechselnde Ausstellungen auf der untersten Ebene. Ab 13.11.: Neu. Sachlich. <i>Fotografie der 1920er- und 1930er-Jahre.</i>", img: "img/7287.jpg", pos: "50% 50%", cap: "Albert Renger-Patzsch, Schaffende Hände (Töpferhände), 1925–27" },
  ];
  // Einfach: links bleibt das Verzeichnis stehen, rechts stehen die Ebenen untereinander.
  $("#haus").innerHTML = `${lab("Im Haus", "7 Ebenen")}<p class="big">Rund 6.000 Kunstwerke auf sieben Ebenen. So ist das Haus aufgebaut.</p>
    <div class="split"><ol class="cut" aria-label="Ebenen">${FLOORS.map((f) => `<li><a class="trow" href="#haus" role="tab"><span class="tc tc--n"><b>Ebene ${f.n},</b><i>${f.name}</i></span></a></li>`).join("")}</ol>
    <div class="panes">${FLOORS.map((f) => `<article class="floor pane" data-pane>
        ${f.img ? `<div class="shot"><img src="${esc(f.img)}" alt="${esc(f.cap || "")}" loading="lazy" style="object-position:${f.pos}"></div>` : ""}
        <div class="floor__row"><p class="floor__n" aria-hidden="true">${f.n}</p><div>${lab(`Ebene ${f.n}`, f.name)}<p class="floor__x">${f.text}</p>${f.cap ? `<p class="cred">Bild: ${esc(f.cap)}</p>` : ""}</div></div>
      </article>`).join("")}</div></div>`;
  tabs($("#haus"));

  /* ── Zu sehen: zwei Ausstellungen und vier Bereiche der Sammlung, als große Beiträge ──
     Angaben laut leopoldmuseum.org (Stand 12.10.2026). „Premiere!“ endete am 11.10.2026. */
  const W0 = window.WORKS || [];
  const pic = (artist, n = 0) => { const w = W0.filter((x) => x.artist === artist)[n]; return w ? `assets/img/works/${w.img}.jpg` : "assets/img/ex/7185.jpg"; };
  const EX = [
    { kind: "Sonderausstellung", title: "Herbert Boeckl – Hans Josephsohn", sub: "Archetypen des Figuralen", date: "24.07.2026 – 10.01.2027", img: "img/7499.jpg", cap: "Herbert Boeckl, Akt vor gelber Kiste, 1925", pos: "50% 34%", plane: "Bis 10.01.", url: LM + "ausstellungen/155/herbert-boeckl-hans-josephsohn", text: "Ein Maler und ein Bildhauer, die einander nie begegnet sind und doch beide der menschlichen Figur treu blieben." },
    { kind: "Dauerpräsentation", title: "Wien 1900", sub: "Aufbruch in die Moderne", date: "Ebenen 0, 3 und 4", img: "img/4723.jpg", cap: "Broncia Koller-Pinell, Sitzende (Marietta), 1907", pos: "50% 30%", url: LM + "ausstellungen/107/wien-1900", text: "Secession, Wiener Werkstätte, Klimt, Schiele. Derzeit zu Gast: vier Meisterwerke aus der Stiftung Sammlung Kamm." },
    { kind: "Sammlung", title: "Egon Schiele", sub: "Die weltweit umfangreichste Sammlung", date: "Über 300 Werke", img: "img/288.jpg", cap: "Egon Schiele, „Liebkosung“ (Kardinal und Nonne), 1912", pos: "50% 35%", url: LM + "sammlung/egon-schiele", text: "Selbstbildnisse, Akte, Landschaften und Städtebilder." },
    { kind: "Sammlung", title: "Gustav Klimt", sub: "Von „Tod und Leben“ bis zum Attersee", date: "Hauptwerke", img: "img/4671.jpg", cap: "Gustav Klimt, Tod und Leben, 1910/11, umgearbeitet 1915/16", pos: "60% 30%", url: LM + "sammlung/gustav-klimt", text: "Zentrale Werke, von den frühen Porträts bis zu den Landschaften der Sommerfrische." },
    { kind: "Sammlung", title: "Biedermeier und Stimmungsrealismus", sub: "Waldmüller, Romako, Schindler, Tina Blau, Hörmann", date: "19. Jahrhundert", img: "img/3312.jpg", cap: "Theodor von Hörmann, Blumenmarkt an der Madeleine IV, 1889", pos: "50% 70%", url: LM + "sammlung/biedermeier-stimmungsrealismus", text: "Vom Rückzug ins Private bis zur Freilichtmalerei." },
    { kind: "Sammlung", title: "Expressionismus und Neue Sachlichkeit", sub: "Kokoschka, Gerstl, Egger-Lienz, Kolig", date: "1908 bis 1930er-Jahre", img: "img/3618.jpg", cap: "Anton Kolig, Sitzender Jüngling („Am Morgen“), 1919", pos: "50% 8%", url: LM + "sammlung/expressionismus-neue-sachlichkeit", text: "Die Generation nach Klimt und die Kunst der Zwischenkriegszeit." },
  ];
  const SOON = [
    ["Neu. Sachlich.", "Fotografie der 1920er- und 1930er-Jahre", "13.11.2026 – 28.02.2027", "img/7287.jpg"],
    ["Modern Fashion", "Wiener Werkstätte & Paris", "26.02. – 27.06.2027", "img/7288.jpg"],
  ];
  const small = (p) => p.replace(/^img\//, "img/sm/"); // verkleinerte Fassung für schmale Spalten
  const post = (x, i, ratio, sm) => `<a class="post rv" href="${x.url}"${ext(x.url)} data-t="${esc(x.title)}">${shot(sm ? small(x.img) : own(x.img), x.cap || "", ratio, x.pos, x.plane)}${lab(`${String(i + 1).padStart(2, "0")} / ${String(EX.length).padStart(2, "0")}`, x.kind, x.date)}<p class="big">${esc(x.title)}. <i>${esc(x.sub)}.</i> <span class="dim">${esc(x.text)}</span></p>${x.cap ? `<p class="cred">Bild: ${esc(x.cap)}</p>` : ""}</a>`;
  $("#ausstellungen").innerHTML = `${lab("Ausstellungen", `2 laufen, ${SOON.length} kommen`)}
    <p class="big">Zwei Ausstellungen sind gerade zu sehen. <a href="${LM}ausstellungen"${ext(LM)}>Alle Ausstellungen</a></p>
    <div class="pair">${post(EX[0], 0, "16 / 9", true)}${post(EX[1], 1, "16 / 9", true)}</div>
    <div class="soon">${lab("Demnächst")}${SOON.map(([t, s, d, im]) => `<a class="soon__r" href="${LM}ausstellungen/vorschau"${ext(LM)}><span class="lab">${d}</span><span class="big">${t} <i>${s}</i></span><img class="line__i" src="${im}" alt="" loading="lazy"></a>`).join("")}</div>`;
  $("#kapitel").innerHTML = `${lab("Die Sammlung", "Vier Kapitel")}
    <p class="big">Vom Biedermeier bis in die 1930er-Jahre: die Sammlung in vier Kapiteln.</p>
    <div class="quad">${EX.slice(2).map((x, k) => post(x, k + 2, "4 / 3", true)).join("")}</div>`;

  /* ── Programm ── */
  const next = (window.EVENTS || []).filter((e) => e.d > todayISO || (e.d === todayISO && e.h * 60 + e.m > mins));
  const seen = new Set();
  const evs = next.filter((e) => { const k = T(e.key); return !seen.has(k) && seen.add(k); }).slice(0, 6);
  // Wie „Im Haus“: links die Termine als Tabelle, rechts groß der gewählte Termin
  const dshort = (e) => (e.d === todayISO ? L("Heute", "Today") : `${WD[new Date(e.d + "T00:00").getDay()]} ${e.d.slice(8, 10)}.${e.d.slice(5, 7)}`);
  const tshort = (e) => `${String(e.h).padStart(2, "0")}.${String(e.m).padStart(2, "0")}`;
  $("#programm").innerHTML = `${lab("Programm", "Die nächsten Termine")}<p class="big">Führungen, Gespräche und Ateliers. <a href="https://www.leopoldmuseum.org/de/besuch/programm" target="_blank" rel="noopener">Ganzes Programm</a></p>
    <div class="split"><ol class="cut" aria-label="Termine">${evs.map((e) => `<li><a class="trow" href="#programm" role="tab" data-t="${esc(T(e.key))}"><span class="tc tc--n"><b>${dshort(e)},</b><i>${esc(T(e.key))}</i></span></a></li>`).join("")}</ol>
    <div class="panes">${evs.map((e) => {
      const m = (window.EV_META || {})[e.key] || {}, im = V1 + (m.img || "assets/img/ex/7314.jpg");
      const desc = has(e.key + "Desc") ? T(e.key + "Desc").split(/(?<=[.!?])\s/)[0].replace(/^Expert.s Choice:\s*/, "").replace(/^./, (c) => c.toUpperCase()) : (m.sub ? T(m.sub) : "");
      return `<article class="floor pane" data-pane>
        <div class="shot"><img src="${im}" alt="" loading="lazy" style="object-position:${m.pos || "50% 40%"}"></div>
        <div class="floor__row"><p class="floor__n" aria-hidden="true">${tshort(e)}</p><div>${lab(`${dshort(e)}, ${tshort(e)} Uhr`, m.cat ? esc(T(m.cat)) : "Programm")}<p class="floor__x">${esc(T(e.key))}. ${esc(desc)} <a href="${V1}event.html?id=${window.eventId(e)}">Zum Termin</a></p></div></div>
      </article>`;
    }).join("")}</div></div>`;
  tabs($("#programm"));
  
  /* ── Sammlung: Band zum Ziehen ── */
  const FIRST = [529, 629, 527, 646, 528, 164, 273, 188];
  const W = window.WORKS || [];
  const pool = [...FIRST.map((id) => W.find((w) => w.id === id)).filter(Boolean), ...W.filter((w) => !FIRST.includes(w.id))].slice(0, 16);
  $("#sammlung").innerHTML = `${lab("Sammlung", "Ziehen zum Blättern")}<p class="big">Rund 9.000 Werke österreichischer Kunst vom 19. Jahrhundert bis zur Moderne, darunter mit über 300 Werken die weltweit umfangreichste Egon-Schiele-Sammlung. Dazu Klimt, Gerstl, Kokoschka, Kubin und die Wiener Werkstätte. <a href="${COLL}" target="_blank" rel="noopener">Zur Online-Sammlung</a></p><div class="band" id="band">${pool.map((w) => `<a class="work" href="${COLL}objekt/${w.slug}/" target="_blank" rel="noopener" draggable="false"><img draggable="false" decoding="async" src="${V1}assets/img/works/${w.img}.jpg" alt="${esc(w.artist)}: ${esc(EN && w.title_en ? w.title_en : w.title)}" loading="lazy" style="aspect-ratio:${w.w} / ${w.h}">${lab(esc(EN && w.title_en ? w.title_en : w.title), `${esc(w.artist)}, ${esc(String(w.date).slice(0, 4))}`)}</a>`).join("")}</div>`;

  // Band mit der Maus ziehen: folgt dem Zeiger ohne Verzögerung und läuft nach dem Loslassen aus. Ein Zug ist kein Klick.
  const band = $("#band");
  { let down = false, moved = false, x0 = 0, s0 = 0, lastX = 0, lastT = 0, v = 0, raf = 0;
    const glide = () => { v = Math.max(-3, Math.min(3, v)) * 0.94; if (Math.abs(v) < 0.02) return; band.scrollLeft -= v * 16; raf = requestAnimationFrame(glide); };
    band.addEventListener("dragstart", (e) => e.preventDefault());
    band.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" || e.button !== 0) return; cancelAnimationFrame(raf); down = true; moved = false; x0 = lastX = e.clientX; s0 = band.scrollLeft; lastT = performance.now(); v = 0; });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 4) { moved = true; band.classList.add("is-drag"); }
      if (!moved) return;
      e.preventDefault();
      band.scrollLeft = s0 - dx;
      const t = performance.now(); if (t > lastT) { v = 0.7 * ((e.clientX - lastX) / (t - lastT)) + 0.3 * v; lastX = e.clientX; lastT = t; }
    });
    addEventListener("pointerup", () => {
      if (!down) return; down = false;
      if (!moved) return;
      band.classList.remove("is-drag");
      band.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); }, { capture: true, once: true });
      setTimeout(() => {}, 0);
      if (!calm && performance.now() - lastT < 80) raf = requestAnimationFrame(glide);
    });
  }
  
  /* ── Bilder und Zeilen kommen beim Scrollen ── */
  const rv = $$(".rv");
  if (calm || !("IntersectionObserver" in window)) rv.forEach((t) => t.classList.add("is-in", "is-done"));
  else {
    $$("#wall > *").forEach((t) => t.style.setProperty("--d", `${(Math.random() * 0.9).toFixed(2)}s`));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); if (e.target.id === "wall") setTimeout(() => e.target.classList.add("is-done"), 1700); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    rv.forEach((t) => io.observe(t));
  }

  /* ── Karte: Menü klappt nach oben auf ── */
  const card = $("#card"), menu = $("#menu"), mbtn = $("#menuBtn");
  // Höhe der offenen Karte: daran richtet sich der Text im Kopf aus (Oberkante bündig mit der Karte)
  const cardH = () => { if (!card.classList.contains("is-min") && !card.classList.contains("is-open")) document.documentElement.style.setProperty("--cardh", `${card.offsetHeight}px`); };
  cardH(); addEventListener("resize", cardH); addEventListener("load", cardH);
  const NAV = [["#besuch", "Besuch", openShort], ["#haus", "Im Haus", "7 Ebenen"], ["#ausstellungen", "Zu sehen", `${EX.length}`], ["#programm", "Programm", evs[0] ? day(evs[0]) : ""], ["#sammlung", "Sammlung", ""], ["#fuss", "Kontakt", ""]];
  const MORE = [["Museum", "museum"], ["Forschung", "forschung"], ["Presse", "presse"], ["Vermietung", "vermietung"], ["Engagement", "engagement"]];
  menu.innerHTML = `<ul>${NAV.map(([h, t, s]) => `<li><a href="${h}">${t}<small>${s}</small></a></li>`).join("")}<li class="card__more">${MORE.map(([t, p]) => `<a href="${LM}${p}" target="_blank" rel="noopener">${t}</a>`).join("")}</li><li class="card__more card__soc"><a href="https://instagram.com/leopold_museum" target="_blank" rel="noopener">Instagram ↗</a><a href="https://www.facebook.com/LeopoldMuseum" target="_blank" rel="noopener">Facebook ↗</a><a href="https://www.youtube.com/user/LeopoldMuseumWien" target="_blank" rel="noopener">YouTube ↗</a></li></ul>`;
  function setMenu(v) {
    if (v) { menu.hidden = false; void menu.offsetWidth; }
    card.classList.toggle("is-open", v);
    mbtn.setAttribute("aria-expanded", v);
    mbtn.textContent = v ? L("Zu", "Close") : L("Menü", "Menu");
    if (!v) setTimeout(() => { if (!card.classList.contains("is-open")) menu.hidden = true; }, calm ? 0 : 560);
  }
  mbtn.addEventListener("click", () => setMenu(!card.classList.contains("is-open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  addEventListener("pointerdown", (e) => { if (card.classList.contains("is-open") && !card.contains(e.target)) setMenu(false); });

  /* ── Stapel: jeder Bereich bleibt stehen, der nächste schiebt sich von unten darüber ──
     Ein Bereich, der höher ist als das Fenster, läuft erst normal durch und bleibt stehen,
     sobald sein Ende unten angekommen ist. Der überdeckte Bereich weicht leicht zurück und dunkelt ab. */
  const stack = [$("#kopf"), ...$$(".blk"), $("#fuss")];
  stack.forEach((s, i) => { s.classList.add("stk"); s.style.zIndex = i + 1; });
  const stick = () => stack.forEach((s) => { s.style.top = `${Math.min(0, innerHeight - s.offsetHeight)}px`; });
  // wo ein Element läge, wenn nichts stehen bliebe (für Sprungmarken und die Strichleiste)
  function flatTop(el) {
    document.documentElement.classList.add("no-stk");
    const t = el.getBoundingClientRect().top + scrollY;
    document.documentElement.classList.remove("no-stk");
    return t;
  }
  function cover() {
    stack.forEach((s, i) => {
      const n = stack[i + 1];
      const c = n ? Math.max(0, Math.min(1, (innerHeight - n.getBoundingClientRect().top) / innerHeight)) : 0;
      s.style.setProperty("--cover", c.toFixed(3));
    });
  }
  const snaps = stack.map(() => { const d = document.createElement("i"); d.className = "snap"; d.setAttribute("aria-hidden", "true"); document.body.appendChild(d); return d; });
  const placeSnaps = () => stack.forEach((s, i) => { snaps[i].style.top = `${Math.round(flatTop(s))}px`; });
  stick(); placeSnaps();
  if ("ResizeObserver" in window) { const ro = new ResizeObserver(() => { stick(); placeSnaps(); cover(); }); stack.forEach((s) => ro.observe(s)); }
  addEventListener("resize", () => { stick(); placeSnaps(); });
  // Sprungmarken: zur natürlichen Position des Ziels fahren
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute("href").length < 2 || a.closest(".map")) return;
    const el = document.getElementById(a.getAttribute("href").slice(1)); if (!el) return;
    e.preventDefault();
    scrollTo({ top: flatTop(el), behavior: calm ? "auto" : "smooth" });
  });
  
  /* ── Strichleiste: jeder Strich ist ein Stück der Seite ── */
  const map = $("#map");
  let pos;
  function drawMap() {
    const H = document.documentElement.scrollHeight, vh = innerHeight;
    const items = [[$("#kopf"), L("Anfang", "Top")], ...$$(".blk, .foot").map((s) => [s.querySelector(".lab"), s.dataset.name])];   // nur die Bereiche: ein Strich je Bereich, keine Kästchen für einzelne Einträge
    map.innerHTML = items.map(([el, t], i) => {
      const top = flatTop(el) / H * vh;
      return `<a href="#" data-i="${i}" data-t="${esc(t || "")}" aria-label="${esc(t || "")}" style="top:${top.toFixed(1)}px;height:1px"></a>`;
    }).join("") + `<span class="map__pos"></span>`;
    pos = $(".map__pos", map);
    map._items = items;
    onScroll();
  }
  map.addEventListener("click", (e) => { const a = e.target.closest("a"); if (!a) return; e.preventDefault(); const el = map._items[+a.dataset.i][0]; scrollTo({ top: flatTop(el) - 12, behavior: calm ? "auto" : "smooth" }); });
  function onScroll() {
    if (!pos) return;
    const H = document.documentElement.scrollHeight, vh = innerHeight;
    pos.style.top = `${(scrollY / H * vh).toFixed(1)}px`;
    pos.style.height = `${(vh / H * vh).toFixed(1)}px`;
    card.classList.toggle("is-min", scrollY > 80);
    cover();
    // Menü: aktueller Bereich
    let curId = "";
    $$(".blk, .foot").forEach((s) => { if (s.getBoundingClientRect().top <= vh * 0.5) curId = s.id; });
    $$("a", menu).forEach((a) => a.getAttribute("href") === `#${curId}` ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
  }
  let tick = false;
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; onScroll(); }); } }, { passive: true });
  addEventListener("resize", drawMap);
  addEventListener("load", drawMap);

  /* ── Kopf als Bühne mit mehreren Schwerpunkten ──
     Jeder Eintrag in STAGE ist eine Folie. Reihenfolge, Anzahl und Inhalt sind frei:
     das Museum setzt damit den Schwerpunkt (Haus, Ausstellung, Termin, Zitat …).
     Nichts läuft von selbst weiter; gewechselt wird per Reiter, Pfeil, Tastatur oder Wischen. */
  function buildStage() {
    const nx = evs[0], nm = nx ? ((window.EV_META || {})[nx.key] || {}) : {};
    const STAGE = [
      { tab: "Das Haus", title: "", img: "img/h5365.jpg", pos: "50% 58%", cred: "Das Leopold Museum im MuseumsQuartier, 2020",
        lab: ["Leopold Museum", openShort],
        text: L(`Eine der weltweit bedeutendsten Sammlungen österreichischer Kunst, mit der größten Egon-Schiele-Sammlung der Welt. ${openLong}. <a href="${TIX}"${ext(TIX)}>Tickets</a> ab ${nb("19 €")}.`, `One of the world’s most important collections of Austrian art, with the largest Egon Schiele collection anywhere. ${openLong}. <a href="${TIX}"${ext(TIX)}>Tickets</a> from ${nb("€ 19")}.`) },
      { tab: "Ausstellung", img: "img/7499.jpg", pos: "50% 30%", cred: "Herbert Boeckl, Akt vor gelber Kiste, 1925", plane: "Bis 10.01.2027",
        lab: ["Sonderausstellung", "24.07.2026 – 10.01.2027"],
        title: "Herbert Boeckl –<br>Hans Josephsohn",
        text: `<i>Archetypen des Figuralen.</i> Ein Maler und ein Bildhauer, die der menschlichen Figur treu blieben. <a href="${LM}ausstellungen/155/herbert-boeckl-hans-josephsohn"${ext(LM)}>Zur Ausstellung</a>` },
      { tab: "Wien 1900", img: "img/4723.jpg", pos: "50% 30%", cred: "Broncia Koller-Pinell, Sitzende (Marietta), 1907", plane: "Zu Gast: Sammlung Kamm",
        lab: ["Dauerpräsentation", "Ebenen 0, 3 und 4"],
        title: "Wien 1900",
        text: `<i>Aufbruch in die Moderne.</i> Derzeit mit vier Meisterwerken aus der Stiftung Sammlung Kamm, darunter zwei Landschaften von Gustav Klimt. <a href="${LM}ausstellungen/107/wien-1900"${ext(LM)}>Zur Ausstellung</a>` },
      nx && { tab: "Programm", img: V1 + (nm.img || "assets/img/ex/7314.jpg"), pos: nm.pos || "50% 40%", plane: `${day(nx)}, ${hm(nx)}`,
        lab: ["Als Nächstes", nm.cat ? esc(T(nm.cat)) : ""],
        title: esc(T(nx.key)),
        text: `${has(nx.key + "Desc") ? esc(T(nx.key + "Desc").split(/(?<=[.!?])\s/)[0].replace(/^Expert.s Choice:\s*/, "").replace(/^./, (c) => c.toUpperCase())) : ""} <a href="${V1}event.html?id=${window.eventId(nx)}">Zum Termin</a>` },
      { tab: "Demnächst", img: "img/7287.jpg", pos: "50% 50%", cred: "Albert Renger-Patzsch, Schaffende Hände (Töpferhände), 1925–27", plane: "Ab 13.11.",
        lab: ["Vorschau", "13.11.2026 – 28.02.2027"],
        title: "Neu. Sachlich.",
        text: `<i>Fotografie der 1920er- und 1930er-Jahre.</i> <a href="${LM}ausstellungen/vorschau"${ext(LM)}>Zur Vorschau</a>` },
    ].filter(Boolean);

    const tl = (t) => t.split("<br>").map((l) => `<span>${l}</span>`).join(""); // jede Zeile bekommt ihre eigene Fläche
    const head = $("#kopf"), N = STAGE.length, no = (i) => String(i + 1).padStart(2, "0");
    head.innerHTML = `<div class="slides">${STAGE.map((s, i) => `<section class="slide ${s.cls || ""}" role="group" aria-roledescription="Folie" aria-label="${no(i)} von ${no(N - 1)}: ${esc(s.tab)}"${i ? " inert" : ""}>
        <div class="segs" style="grid-template-columns:repeat(${STAGE.length}, 1fr) auto" role="tablist" aria-label="${L("Schwerpunkte", "Highlights")}">${STAGE.map((t, k) => `<button type="button" role="tab" data-i="${k}" class="${k < i ? "is-done" : ""}" aria-selected="${k === i}" aria-label="${no(k)}: ${esc(t.tab)}" title="${esc(t.tab)}"></button>`).join("")}<button type="button" class="segs__p" data-pause aria-pressed="false">${L("Pause", "Pause")}</button></div>
        ${s.img ? `<div class="head__img"><img src="${esc(s.img)}" alt="${esc(s.cred || "")}" style="object-position:${s.pos || "50% 50%"}"${i ? ' loading="lazy"' : ""}>${s.cred ? `<span class="head__cred">${esc(s.cred)}</span>` : ""}${s.title ? `<h2 class="head__title">${tl(s.title)}</h2>` : ""}</div>` : `<div class="head__img head__img--none"><h2 class="head__title">${tl(s.title)}</h2></div>`}
        <div class="slide__txt"><div class="slide__row">${lab(...s.lab)}</div>${s.text ? `<p class="big">${s.text}</p>` : ""}</div></section>`).join("")}</div>`;

    const slides = $$(".slide", head);
    let cur = 0;
    function go(i, dir) {
      i = (i + N) % N;
      if (i === cur) return;
      const from = slides[cur], to = slides[i];
      head.style.setProperty("--dir", dir >= 0 ? 1 : -1);
      slides.forEach((s) => s.classList.remove("is-off"));
      from.classList.remove("is-on"); from.classList.add("is-off"); from.inert = true;
      clearTimeout(go.t); go.t = setTimeout(() => from.classList.remove("is-off"), calm ? 0 : 950); // danach liegt nur noch die neue Folie da
      to.classList.remove("is-off"); to.classList.add("is-on"); to.inert = false;
      const im = $("img[loading]", to); if (im) im.loading = "eager";
      cur = i;
    }
    slides[0].classList.add("is-on");
    head.addEventListener("click", (e) => {
      // Anhalten und Weiterlaufen
      if (e.target.closest("[data-pause]")) { const stop = head.classList.toggle("is-stop"); $$("[data-pause]", head).forEach((b) => { b.setAttribute("aria-pressed", stop); b.textContent = stop ? L("Weiter", "Play") : L("Pause", "Pause"); }); return; }
      const s = e.target.closest(".segs button[data-i]");
      if (s) { const k = +s.dataset.i; go(k, k - cur); const nbtn = $(`.segs [data-i="${k}"]`, slides[cur]); if (nbtn) nbtn.focus({ preventScroll: true }); return; }
      // Klick ins Bild: rechts weiter, im linken Drittel zurück
      const im = e.target.closest(".head__img");
      if (im && !e.target.closest("a")) { const r = im.getBoundingClientRect(), d = e.clientX - r.left < r.width / 3 ? -1 : 1; go(cur + d, d); }
    });
    head.addEventListener("pointermove", (e) => { const im = e.target.closest(".head__img"); if (!im) return; const r = im.getBoundingClientRect(); im.classList.toggle("is-back", e.clientX - r.left < r.width / 3); });
    // wie Stories: die Linie der aktuellen Folie läuft voll, dann kommt die nächste. Hält nur an, wenn „Pause“ gedrückt ist oder der Kopf nicht zu sehen ist.
    head.addEventListener("animationend", (e) => { if (e.animationName === "seg-fill") go(cur + 1, 1); });
    const away = () => head.classList.toggle("is-away", scrollY > innerHeight * 0.4);
    addEventListener("scroll", away, { passive: true }); away();
    head.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(cur + 1, 1); if (e.key === "ArrowLeft") go(cur - 1, -1); });
    // Wischen auf Touch-Geräten
    let sx = null;
    head.addEventListener("pointerdown", (e) => { sx = e.pointerType === "mouse" ? null : e.clientX; });
    head.addEventListener("pointerup", (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
    const start = +new URLSearchParams(location.search).get("kopf");
    if (start > 1 && start <= N) go(start - 1, 1);
    requestAnimationFrame(drawMap);
  }
  /* ── Farben der geneigten Flächen kommen aus dem jeweiligen Bild ──
     Das Bild wird klein auf eine Zeichenfläche gelegt und ausgezählt: die kräftigste häufige Farbe
     und eine zweite, die sich deutlich davon absetzt. Schriftfarbe je nach Helligkeit. */
  function palette(img, onDark) {
    const n = 40, cv = document.createElement("canvas"); cv.width = cv.height = n;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    try { cx.drawImage(img, 0, 0, n, n); } catch (e) { return null; }
    let d; try { d = cx.getImageData(0, 0, n, n).data; } catch (e) { return null; }
    const bin = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2], k = (r >> 5) << 6 | (g >> 5) << 3 | (b >> 5);
      const o = bin.get(k) || { r: 0, g: 0, b: 0, c: 0 }; o.r += r; o.g += g; o.b += b; o.c++; bin.set(k, o);
    }
    const cols = [...bin.values()].map((o) => {
      const r = o.r / o.c, g = o.g / o.c, b = o.b / o.c, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      return { r, g, b, c: o.c, sat: mx ? (mx - mn) / mx : 0, lum: (0.299 * r + 0.587 * g + 0.114 * b) / 255 };
    }).filter((c) => c.c >= 6);
    if (!cols.length) return null;
    const score = (c) => Math.sqrt(c.c) * (0.2 + c.sat) * (c.lum > 0.12 && c.lum < 0.93 ? 1 : 0.35);
    // erst die Farbe, die das Bild beherrscht; die Fläche nimmt dann den Akzent, der am weitesten davon weg ist
    const dist = (x, y) => Math.hypot(x.r - y.r, x.g - y.g, x.b - y.b);
    const main = cols.slice().sort((x, y) => y.c - x.c)[0];
    cols.sort((x, y) => score(y) * (30 + dist(y, main)) - score(x) * (30 + dist(x, main)));
    const a = cols[0];
    const b2 = cols.slice(1, 14).sort((x, y) => dist(y, a) * (0.4 + Math.sqrt(y.c) / 12) - dist(x, a) * (0.4 + Math.sqrt(x.c) / 12))[0] || a;
  // Farbton aus dem Bild, aber kräftiger und in der Helligkeit gegen das Bild gesetzt,
  // damit die Fläche sich klar abhebt: auf hellen Bildern dunkel, auf dunklen hell.
  let sum = 0; for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  const light = !onDark && sum / (d.length / 4) / 255 > 0.5;
  const hue = (c) => { const r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn; if (!dl) return 0; const h = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4; return (h * 60 + 360) % 360; };
  const push = (c, L, cap) => `hsl(${Math.round(hue(c))} ${Math.round(Math.min(cap, c.sat * 0.9 + 0.06) * 100)}% ${L}%)`;
  return light ? [push(a, 17, 0.42), "#fff", push(b2, 8, 0.25), "#fff"] : [push(a, 84, 0.38), "#000", push(b2, 94, 0.2), "#000"];
}
  window.__palette = palette;
  function tint(img, target, onDark) {
    const run = () => { const p = palette(img, onDark) || (window.TINTS || {})[(img.getAttribute("src") || "").replace(/^(\.\.\/)?(v1\/)?/, "") + (onDark ? "|d" : "")]; if (!p) return; ["--c1", "--k1", "--c2", "--k2"].forEach((v, i) => target.style.setProperty(v, p[i])); return p; };
    if (img.complete && img.naturalWidth) return run();
    img.addEventListener("load", run, { once: true });
  }
  buildStage();
  $$(".slide").forEach((s) => { const im = $(".head__img img", s); if (im) { im.loading = "eager"; tint(im, s); } });
  $$(".post").forEach((p) => { const im = $(".shot img", p); if (im) tint(im, p); });
  /* ── Englische Fassung: feste Texte über das Wörterbuch (en.js) ersetzen ──
     Erst die ganze Textstelle, sonst längere Sätze und ein paar erlaubte Bausteine auch mittendrin. Uhrzeiten werden umgerechnet. */
  if (EN && window.V8_EN) {
    const D = window.V8_EN, P = window.V8_EN_PARTS || {};
    const keys = [...Object.keys(D).filter((k) => k.length >= 14), ...Object.keys(P)].sort((a, b) => b.length - a.length);
    const rx = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
    const ap = (h, mm) => { h = +h; return `${h % 12 || 12}${mm && mm !== "00" ? ":" + mm : ""} ${h < 12 ? "am" : "pm"}`; };
    const tr = (s) => {
      if (!s || !/[A-Za-zÄÖÜäöü]/.test(s)) return s;
      const t = s.trim();
      if (D[t] !== undefined) return s.replace(t, D[t]);
      return s.replace(rx, (m) => (D[m] !== undefined ? D[m] : P[m]))
        .replace(/(\d{1,2}) – (\d{1,2}) Uhr/g, (m, a, b) => `${ap(a)} – ${ap(b)}`)
        .replace(/(\d{1,2})[.:](\d{2}) Uhr/g, (m, h, mm) => ap(h, mm))
        .replace(/(\d{1,2}) Uhr/g, (m, h) => ap(h));
    };
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => { if (!n.parentElement.closest("script, style")) { const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } });
    $$("[aria-label], [alt], [data-t], [data-name]").forEach((el) => ["aria-label", "alt", "data-t", "data-name"].forEach((a) => { if (el.hasAttribute(a)) el.setAttribute(a, tr(el.getAttribute(a))); }));
  }
  $$("[data-lang]").forEach((a) => { a.classList.toggle("is-on", a.dataset.lang === lang); a.addEventListener("click", () => { try { localStorage.setItem("v8lang", a.dataset.lang); } catch (e) {} }); });
})();
