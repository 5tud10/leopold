# Roadmap

## Phase 1 — Collection explorations
Try many key-visual and browsing ideas quickly; keep what works.
- [x] Grid, Figure, Museum (before 2026-10-02)
- [x] Islands — flowing shapes with artworks
- [x] Particles — painting as square-pixel particle cloud
- [x] Ring — 3D circular slideshow, works fly out on click
- [x] Browse — zoomable collection grid with overlaid search/filter/menu

## Phase 2 — Explore: zoomable grid as site navigation
The museum's site content (exhibitions, programme, visit, collection…) as one explorable field,
mixed with interactive 3D visuals.
- [x] Content crawl + cards, categories, search, 3 zoom steps, opens on PREMIERE!
- [x] Figure (switchable projections) and museum model as big interactive visuals (hover skew) — removed 2026-10-05, postponed
- [x] Search suggestions ("Häufig gesucht"); category and search reset each other
- [x] Navigation from Figma: logo row, search with ×, zoom, menu with sections + Sprache (2026-10-05)
- [x] Cards that open vs. complete cards: "+" marker, framed cards (hours, tickets, social), section colours (2026-10-05)
- [ ] Content opens as an overlay above the canvas (cards that open + "Tickets kaufen"), not as an external link
- [ ] Deeper scrape: body text, images, hours/prices for complete cards and overlays
- [ ] Further steps — to be decided (logo overview parked as an option)

## Phase 3 — Modern layout (working title)
A full site prototype that mixes a classic website layout with modern UI/UX elements — a calmer
counterpart to the experimental phases. Lives in `modern/`; on Pages since 2026-10-09 by direct link
only (references and drafts stay local via `.git/info/exclude`). Content: the Explore crawl (`explore/items.json` + `images/`).
- [x] Init: folder, local exclude, stub page, planning (2026-10-08)
- [x] References from the owner — part 1 noted 2026-10-08 in `modern/REFERENCES.md`; build started from
  the owner's spec 2026-10-09 (part 2 only if needed)
- [ ] Page types and navigation agreed (home + which detail/listing pages)
- [ ] Page shape decided (one page with routing vs. one HTML per page type)
- [ ] Home page, one component at a time
  - [x] Hero (full-bleed exhibition, ticket + more buttons) — 2026-10-09
  - [x] Sidebar navigation of cards — 2026-10-09
  - [x] Ticket sidebar (one basket, offers) + Tickets pill; phone toggle — 2026-10-09
  - [ ] Content below the hero
- [ ] Further page types
