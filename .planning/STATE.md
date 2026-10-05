# State

## Current Phase
Phase 2 — Explore (zoomable grid as site navigation).

## Current Focus
Explore, round 2 (2026-10-05, pushed as `fbc4de3`, live at 5tud10.github.io/leopold/explore/). Navigation
rebuilt from Figma (`Leopold Museum (Copy)` node 4139:75): logo row over SUCHEN − + ☰; the menu holds
the 9 sections (filter gone) plus a Sprache DE/EN row (highlight only). Cards: pastel colour per section
(none for Besuch), "+" on cards that open, framed "complete" cards for Öffnungszeiten, Tickets (with a
"Tickets kaufen" button, no action yet) and Social Media (icon + name rows). 3D visuals removed (Postponed).
Working mode now: **iterate on localhost:8808, push only when the owner says** (auto-memory).
Next up: answer the Open Issues below, then the content overlay (Tickets kaufen + cards that open).

## Decided
- Explore field: zoom steps 1.4 / 1 / 0.23; zoom buttons grey out at the limits; overview shows
  category + title; no text selection while dragging; a search resets the section and picking a
  section clears the search.
- Explore click: cards that open open at every zoom step (still the external museum link until the
  overlay exists); complete (framed) cards and the Tickets button open nothing; social rows link out.
- Explore navigation (Figma 4139:75): logo row 127px with the logo at 1.5× the Figma size (206px), centred
  where Figma has it; bar SUCHEN − + ☰ (Helvetica 20px, not ABC Areal — "Helvetica for everyone");
  logo click = back to the opening view. SUCHEN placeholder grey (45%), typed text black; × from the
  typeface clears. Panels match the bar (49px rows, 20px), scroll when taller than the window.
- Menu = the 9 sections (no ↗ links, no "Leopold Explorations"), then a 2px line, then "Sprache DE / EN".
  Picking a section closes the menu, shows its name in the search field (a label: it filters by
  section); clicking it again, ×, or emptying the field returns to the opening view on PREMIERE!.
- Search suggestions stay as visitor tasks under "Häufig gesucht"; Presse merged into Info.
- Filters/searches centre the middle of their results (one-card centring was tried and undone).
- Card kinds: picture cards that open (image + caption + "+"; "+" hidden when zoomed out) and framed
  complete cards (black frame like the nav, image on top, content rows below, page white — no section
  colour). Info cards are never text-only ("info cant be text only"). Frames shrink their image to fit
  `FRAME = CELL * .8` and sit near the top of their cell so they clear the card below.
- Section colours (OKLCH chroma .06, hues 40° apart, lightest tone in gamut; yellow given): Ausstellungen
  #fbf1b0, Programm #ffd7b9, Sammlung #ffcac9, Museum #b7edfe, Forschung #c0d8ff, Engagement #fed3ef,
  Vermietung #c3fcf0, Info #e2d4ff; Besuch none. A 12px panel behind image + caption (spread shadows).
- Repo stays public and low-profile: pages get `noindex`, docs describe the work only. Repo moved to
  `5tud10/leopold` (history rewritten without reference-site names; old copy in gitignored `old-history.git/`).

## Postponed
- **3D visuals in Explore** (figure + museum models) — removed 2026-10-05 ("we will find a better way to
  implement them later"). Restore: `git revert 26aa7fb`.
- **Logo overview for Explore** — built and removed 2026-10-02, kept as an option. The overview step
  becomes the logo from `grid/shape.svg` tiled (32 columns) with the posts' images; the page loads on it,
  then zooms into PREMIERE!. Restore: `git revert 54c7c0d` (re-applies commit 3ab0e05; resolve
  conflicts in `explore/index.html` if Explore changed since) — revisit when asked for "the logo view".
- Building pale on white — shadows added; darker material if it still reads too faint.
- Overview captions (2 lines) touch the card below in a few places — 1-line titles if it shows.
- Info/action cards for the other Besuch pages (Anreise, Café, Shop…) — after the owner judges the three samples.
- Same zoom steps / 3D on Browse — only if asked.

## Rejected
- Explore: filters/searches land on one card centred — "undo" — 2026-10-05
- Explore: info cards as text only (no image) — "info cant be text only" — 2026-10-05
- Fluid paint, pixel sort — "remove fluid and sort" — 2026-10-02
- Hoffmann squares, flip tiles, louvres — "i dont like them" — 2026-10-02
- Coral growth (reaction-diffusion) — removed — 2026-10-02
- Colour field (1,300 thumbs by hue) — removed — 2026-10-02
- Schiele-based ideas (process, life, letters…) — "abandon that idea" — 2026-10-02
- Open idea list: time stream, mosaic, globe/ring of thumbs, card stack, stroke rebuild, hanging
  canvases, ribbed glass, torch reveal, halftone, letters, similarity galaxy, 2.5D parallax,
  zoom-through — "dont like any of those" — 2026-10-02

## Open Issues
- **Colour when zoomed out** — provisional: colour only as a band around the image, captions on white
  (a panel around image + caption collides there). Owner to judge.
- **Row padding** — social rows got 10px; should the Tickets/Öffnungszeiten rows match?
- **No back link on Explore** — the logo now resets the view; CLAUDE.md still requires a top-left
  link to `../` on every page. Make Explore an exception, or add a link elsewhere?
- Hours and prices on the framed cards are typed in by hand (2026-10-05) — must come from the scrape.
- Overlay content: `items.json` only holds title, subtitle, date and one short excerpt per page — a real
  article overlay needs a fuller scrape (body text, more images, event times/prices) in `scrape.mjs` /
  `build.py`. Decide with the owner first: how much of each page, overlay layout (full-screen sheet vs.
  panel), what stays external (tickets/booking), close behaviour (Escape, click outside, back button?).
- Explore content is a 2026-10-02 snapshot; events/dates will go stale (re-run scrape + build).
- `figure/figure.glb` is output of a generator whose licence excludes the EU.

## Session Log
### 2026-10-05
Repo moved to `5tud10/leopold`, reference-site names scrubbed from code and history. Explore: Figma
navigation, sections in the menu, search ×/label/reset behaviour, 3D removed, section colours, framed
complete cards (hours, tickets, social), "+" on cards that open. Pushed `fbc4de3`; now localhost-first.
### 2026-10-02
Built islands, particles, ring, browse, explore (+ removed fluid, sort, hoffmann, tiles, louvres,
coral, colour). Project files created; Blender sources moved in from the Desktop. Explore iterated:
3D visuals (projection fixed to world space, black default, shadows, hover skew), search suggestions,
filter/search reset, logo overview built then parked (see Postponed). Next: owner's next direction.
