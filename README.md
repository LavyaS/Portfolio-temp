# Lavya Singh Chauhan — Portfolio

A personal developer portfolio built with plain HTML, CSS, and JavaScript. No frameworks, no build step, no dependencies beyond Google Fonts.

## Project structure

```
.
├── index.html              All markup, in section order (hero → work → about → skills → experience → contact)
├── css/
│   ├── style.css            Design tokens, base styles, layout, components
│   ├── responsive.css       Breakpoints and mobile navigation
│   └── animations.css       Keyframes, scroll reveals, prefers-reduced-motion
├── js/
│   ├── navigation.js        Sticky header state, mobile menu, active-link tracking
│   ├── animations.js        IntersectionObserver-driven scroll reveals
│   └── main.js               Footer year, small progressive-enhancement setup
├── assets/
│   ├── images/               General site images (e.g. og-image.png)
│   ├── icons/                 Reserved for standalone icon files (icons are currently inline SVG)
│   └── projects/              Project screenshots (see below)
└── README.md
```

## Running it locally

No build tools or installation required.

**Option 1 — just open it:**
Double-click `index.html`, or open it directly in a browser.

**Option 2 — local server (recommended, avoids any browser file:// restrictions):**

```bash
# Python 3
python3 -m http.server 8000

# or Node, if you have it
npx serve .
```

Then visit `http://localhost:8000`.

## Where to edit things

### Personal links (required before publishing)
Search the project for these placeholders and replace them:

| Placeholder | Where | Replace with |
|---|---|---|
| `YOUR_GITHUB_URL` | Contact section, footer, each project card | Your GitHub profile / repo URL |
| `YOUR_LINKEDIN_URL` | Contact section, footer | Your LinkedIn profile URL |
| `YOUR_EMAIL` | Contact section, footer | Your email address |
| `YOUR_SITE_URL` | `<head>` Open Graph tag in `index.html` | Your deployed site URL |

They're intentionally left as literal, obviously-fake placeholders rather than working links — grep for `YOUR_` to find every instance.

### Project screenshots
Each project card in `index.html` currently renders a CSS-built placeholder visual inside a `.project-card__media` block, marked with an HTML comment like:

```html
<!-- Replace this placeholder with assets/projects/deepfake-detection.png -->
```

Recommended screenshot filenames (drop them into `assets/projects/`):

```
assets/projects/deepfake-detection.png
assets/projects/automation-dashboard.png
assets/projects/web-scraper.png
assets/projects/portfolio.png
```

To swap a placeholder for a real screenshot, replace the `.project-visual` div inside the relevant `.project-card__media` with an `<img>`:

```html
<div class="project-card__media">
	<img src="assets/projects/deepfake-detection.png" alt="Deepfake Detection interface showing frame analysis and confidence score" loading="lazy">
</div>
```

### Colors, type, spacing
All design tokens live at the top of `css/style.css` under `:root`. The accent color, fonts, spacing scale, and radii are all CSS custom properties — change them once and they propagate everywhere:

```css
--accent: #d9a441;      /* primary accent color */
--font-display: 'Space Grotesk', ...;  /* headings */
--font-body: 'Inter', ...;             /* body copy */
--font-mono: 'JetBrains Mono', ...;    /* labels, badges, technical UI */
```

To change fonts, also update the Google Fonts `<link>` in `index.html`'s `<head>`.

### Project content
Each project is a self-contained `<article class="project-card">` block in `index.html` under `#work`. Title, description, problem/approach copy, stack badges, and links are all plain markup — edit directly.

### Skills
Grouped under `#skills` in `index.html` as four `.skill-group` blocks (Languages, Development, Data & AI, Web & Automation). Add or remove `<li class="badge">` items as your toolkit changes.

## Deployment

Since this is a static site with no build step, any static host works:

- **GitHub Pages** — push to a repo, enable Pages on the `main` branch (or `/docs`), done.
- **Netlify / Vercel** — drag-and-drop the folder, or connect the repo. No build command needed; publish directory is the project root.
- **Any static host** (S3, Cloudflare Pages, etc.) — upload the files as-is.

## Browser support

Built against modern evergreen browsers (Chrome, Firefox, Safari, Edge — last two versions). Uses `IntersectionObserver`, CSS custom properties, and CSS Grid; all core content and navigation still work without JavaScript, with animations degrading gracefully.
