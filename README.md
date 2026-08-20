# Lavya Singh Chauhan — Portfolio

My personal developer portfolio — a static site built by hand with no framework, no build
step and no dependencies.

**Live site → [lavyas.github.io/Portfolio-temp](https://lavyas.github.io/Portfolio-temp/)**

---

## About

A single-page portfolio structured like a technical specification document: a hairline
drafting grid as the visual spine, numbered sections, monospace metadata and oversized
display type, with one accent colour used for structure rather than decoration.

Written in plain HTML, CSS and JavaScript. The interaction work — command palette, scroll
state, disclosure panels, cursor-tracked hero grid — is all hand-written vanilla JS.

## Stack

| | |
|---|---|
| Markup | Semantic HTML |
| Styling | CSS with custom properties, grid and container-free fluid type |
| Behaviour | Vanilla JavaScript, no libraries |
| Type | Archivo, Newsreader, IBM Plex Mono |
| Hosting | GitHub Pages, deployed by GitHub Actions |

## Structure

```
index.html          all page copy
css/main.css        design tokens and styles, sectioned and commented
js/app.js           behaviour, as independent modules
assets/resume.html  print-to-PDF résumé template
assets/og.svg       social share image
```

## Running locally

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly from the filesystem also
works — nothing depends on ES modules or `fetch`.

## Accessibility and browser support

- No horizontal overflow from 320px to 2560px
- All text meets WCAG AA contrast on its background
- Ordered heading levels, labelled landmarks, skip link, visible focus states
- Full `prefers-reduced-motion`, `forced-colors` and print stylesheets
- All content renders with JavaScript disabled

## Status

Layout, content and the two project case studies are complete and accurate — both are
real, verifiable repositories: [World Coffee Atlas](https://github.com/LavyaS/world-coffee-atlas)
and [Anti-Gravity Simulation](https://github.com/LavyaS/anti-gravity-simulation). A handful
of fields remain unfilled by design rather than oversight — location, LinkedIn, and the
"next up" stack slots — because no fabricated placeholder is better than an honest gap.
They're marked with `data-slot` in the markup, and the browser console prints how many
remain.

## Deployment

Pushes to `claude/lavya-portfolio-site-yz82bf` trigger
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml), which publishes
the repository root to GitHub Pages.
