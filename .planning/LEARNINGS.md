# Learnings

Hard-won, project-specific. Kept here instead of the vault (self-contained project, decided 2026-10-02).

## Museum data & assets
- **No CORS on either museum server** — `curl -sI -H "Origin: …" <image>` shows no
  `access-control-allow-origin`. `<img>` works; a WebGL texture from the same URL fails. Bundle local
  copies for anything shader-sampled. `[tested 2026-10-02]`
- **leopoldmuseum.org scraping**: pages are JS-rendered (plain curl gets ~nothing) → use Playwright.
  The cookie banner's `<p>` text pollutes naive paragraph grabs — filter `/Cookie/`. Exhibition pages:
  `.precontent-h1` / `.precontent-h2` / `.precontent-p` (title / subtitle / dates). Event pages: `p.cat`,
  `h1`, `p.eventdate`; `document.title` = `DATE - TITLE | Programm | BESUCH | …`. Only the `c950x576`
  crop and `original` sizes exist under `/media/image/`. `[tested 2026-10-02]`

## 3D
- **Triplanar projection is in world space** (`modelMatrix` in the shader, as in `figure/`): rotating the
  model makes the artwork slide over the body. Keep the model still and orbit the camera. `[tested 2026-10-02]`
- A canvas inside a CSS-scaled container must be re-rendered at the scale
  (`renderer.setPixelRatio(dpr * scale)`) or it blurs/wastes pixels. `[tested 2026-10-02]`

## Interaction
- **Drag-to-rotate on an object inside a drag-to-pan field doesn't work for this page** — OrbitControls
  on the model canvases fought the field's pan (owner rejected it); a hover-only skew does the job
  without competing for the drag. `[tested 2026-10-02]`
- `setPointerCapture` on the pan container sends the `click` to the container, not to buttons inside
  it — resolve buttons via `document.elementsFromPoint()` in `pointerup`. `[tested 2026-10-02]`
- Centring a filtered set: sort cells by their centre (not top-left corner — that biased the set
  down-right), then centre the view on the bounding box of what is visible. `[tested 2026-10-02]`

## Colour
- **Pastel palette for many categories**: at a fixed high lightness, pinks/blues/purples run out of
  gamut long before yellow/green, so equal-L palettes come out faint and near-identical (pairs ~1–2 ΔE).
  Fix the chroma instead (OKLCH .06), space hues 40° apart, and per hue take the lightest L that is
  still in sRGB gamut → every pair ≥ 4.2 ΔE (×100, OKLab), ≥ 6.8 from the page white, black text
  ≥ 12.4:1. `[tested 2026-10-05]`

## Process
- **GitHub keeps rewritten commits reachable by SHA**: after `git filter-repo` + force-push, the old
  commit still answered `gh api repos/<o>/<r>/commits/<old-sha>`. Only deleting and recreating the repo
  removed it ("No commit found for SHA"). `[tested 2026-10-05]`
- Keep a rejected-but-liked feature as an option with `git revert` instead of deleting it by hand: the
  revert commit is the restore handle (`git revert <revert-sha>`), and a `git revert --no-commit … &&
  git revert --abort` dry run proves it still applies. Record it under Postponed. `[tested 2026-10-02]`

## CSS
- **`place-items: center` also centres block children** in current Chrome (CSS alignment in block layout):
  overriding an inherited `display: grid` with `display: block` left the rows centred and shrink-wrapped.
  Reset `place-items: normal` as well. `[modern ticket cards, tested 2026-10-09]`
- **A generalised selector can lose to the rule it should override**: `[aria-expanded="true"] > .lines span`
  (0,2,1) lost to `.head-btns .lines span:first-child` (0,3,1), so the two lines rotated at their resting
  heights and the × drew as ">". Measure both lines' `top`, not just the transform. And grep a new class
  name first: `.info` for a tooltip icon also hit the existing `.card.info`. `[modern header, 2026-10-09]`

## Verification
- **Headless WebGL**: the shared Playwright MCP browser collides with parallel agents, and
  `chrome --headless --screenshot` hangs on always-animating pages. A standalone Playwright works:
  `npm i playwright && npx playwright install chromium`, launch with
  `['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']`. `[tested 2026-10-02]`
- Prefer measured checks over eyeballing for checkable claims (offset from centre in px, overlap of
  boxes, canvas sizes, fps over rAF) — and run each new check once against a known-bad version first
  (the overlap and text-selection checks both caught the bug before passing the fix). `[tested 2026-10-02]`
- **Touching reads as clear**: an overlap check with a ">1px" threshold passed a frame whose bottom
  sat exactly on the next card (0px gap). Check for a minimum *gap*, not for overlap. And a control
  must reproduce the old layout exactly — the first control kept the new positioning and also passed.
  `[tested 2026-10-05]`
- **Playwright ignores unknown `newPage` options**: `viewportSize:` is silently dropped (the option is
  `viewport:`), so every run used the default 1280×720. Assert `innerWidth`/`innerHeight` in the
  script. `[tested 2026-10-05]`
- **Playwright MCP writes only inside the repo**, to the gitignored `.playwright-mcp/`; it refuses the
  scratchpad. That folder also holds earlier sessions' screenshots, so never `rm` it whole: list it,
  then delete only this session's files. Reference screenshots that name sites go in `modern/`
  (local only). `[2026-10-08: about 100 older captures lost]`
- **A horizontal-overflow check doesn't catch vertical spill**: fixed-height cards whose content ran into the
  next card passed "no overflow". Check each block's content bounds against its own box (control: the
  broken style showed 55–109px of spill). **Playwright leaves the pointer where it clicked**: once the page
  narrowed, it rested on a sidebar card and screenshots showed the hover state; move the mouse away before
  measuring or capturing. `[modern, tested 2026-10-09]`
