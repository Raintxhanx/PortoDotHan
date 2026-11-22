# Raihan Ahmad Fathoni — Portfolio & Entity Home

> “Manusia biasa, bahagia dengan hal-hal kecil.”
> *An ordinary human, happy with small things.*

A static portfolio and entity home for **Raihan Ahmad Fathoni** ([@Raintxhanx](https://github.com/Raintxhanx)) — AI Engineer and Backend Developer based in Jakarta Timur.

The site is generated with **Astro** and deployed as static assets on **Cloudflare Pages**. There is no Node runtime in production. The homepage keeps the Three.js galaxy; every other page is plain editorial HTML with zero 3D JavaScript.

## What is in here

- **Server-rendered static HTML** for every route: home, about, projects, three case studies, contact and 404.
- **Entity SEO**: consistent name/bio, `Person`, `WebSite`, `Organization`, `ProfilePage`, `Article`, `SoftwareApplication`, `FAQPage` and `BreadcrumbList` JSON-LD.
- **Technical SEO**: canonical URLs, absolute Open Graph/Twitter images, `robots.txt`, generated `sitemap.xml`, Cloudflare `_headers`/`_redirects`, and a build-time audit.
- **The galaxy**: a generative Three.js spiral with a scroll-driven camera and a projected DOM HUD. It is lazily loaded on the homepage only.
- **A static dossier** below the galaxy so crawlers and recruiters can read the profile, projects, skills and contact details without JavaScript.
- **Performance work**: no artificial loader, self-hosted fonts, lazy audio, deferred Three.js, and no 3D bundle on subpages.

## Stack

| Layer | Tool |
| --- | --- |
| Static site | [Astro](https://astro.build/) |
| 3D | [Three.js](https://threejs.org/) + custom GLSL |
| Styles | [Sass](https://sass-lang.com/) |
| Type | Instrument Serif, Space Grotesk, JetBrains Mono (self-hosted via Fontsource) |
| Hosting | Cloudflare Pages |
| Audit | `scripts/seo-audit.mjs` (Cheerio) |

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL.

```bash
npm run build      # static output in dist/
npm run preview    # preview the production build on :4321
npm run seo:audit  # crawl dist/ and assert titles, canonicals, schema, sitemap, links
npm run og         # regenerate the 1200×630 social cards and icons
```

The audit expects a built `dist/`. Run `npm run build` first.

With `npm run preview` running in another terminal, `npm run visual:check` uses the installed Chrome to screenshot the home, dossier, about, projects, case study and contact pages, and reports LCP/CLS, console errors, whether the audio is fetched on load, and whether subpages fetch the 3D chunk. Set `CHROME_PATH` if Chrome is not in the default Windows location.

## Deploy to Cloudflare Pages

Production is **Cloudflare Pages**, not the Node server.

```bash
npm run deploy
```

`wrangler.toml` points at `./dist`. You can also connect the Git repository in the Cloudflare dashboard and use:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 22.12 or newer (`.nvmrc` pins Node 22)

`src/public/_headers` is applied by Pages for cache and security headers. `src/public/_redirects` keeps old English URLs working and normalizes trailing slashes:

```text
/about/*    → /tentang/:splat
/work/*     → /proyek/:splat
/contact/*  → /kontak/:splat
/projects/* → /proyek/:splat
```

### Legacy local server

`server.mjs` and the Docker files are kept only as a local fallback. They are **not** part of the production path anymore.

```bash
npm start          # serves dist/ with server.mjs on :8080
docker compose up  # legacy container preview
```

## Routes

| Route | Content |
| --- | --- |
| `/` | Galaxy hero + static dossier (profile, metrics, projects, skills, contact) |
| `/tentang/` | Bio, education, experience, skills, FAQ |
| `/proyek/` | Featured case studies + other GitHub projects |
| `/proyek/ticketing-management-system/` | 687 praktikan, 1.300+ tiket |
| `/proyek/platform-chat-llm/` | 200 concurrent users, 31 active at launch |
| `/proyek/asisten-laboratorium/` | 90+ praktikan, AI / Pengolahan Citra / Algoritma |
| `/kontak/` | Email, socials, location, availability |
| `/404.html` | Noindex not-found page |
| `/sitemap.xml` | Generated from the route manifest |
| `/robots.txt` | Crawl rules + sitemap + AI crawler allowlist |

## Structure

```text
src/
├─ data/
│  ├─ site.ts              # single source of truth: name, bio, roles, socials
│  ├─ projects.ts          # featured + other projects
│  └─ faq.ts               # concise Indonesian FAQ answers
├─ lib/schema.ts           # JSON-LD builders
├─ layouts/
│  ├─ BaseLayout.astro     # head, header, menu, footer, scripts
│  ├─ PageLayout.astro     # editorial page shell
│  └─ CaseStudyLayout.astro
├─ components/             # Seo, Header, Menu, Footer, Breadcrumbs, ProjectCard, Faq
├─ pages/
│  ├─ index.astro          # galaxy + static dossier
│  ├─ tentang/index.astro
│  ├─ proyek/index.astro
│  ├─ proyek/*.md          # long-form case studies
│  ├─ kontak/index.astro
│  ├─ 404.astro
│  └─ sitemap.xml.ts
├─ scripts/
│  ├─ site.js              # UI, clock, menu, audio, lazy galaxy import
│  └─ home.js              # Three.js scene, palette, dossier hand-off
├─ js/                     # existing galaxy engine and shaders
├─ scss/                   # existing editorial styles + _pages.scss
└─ public/                 # favicon, images, audio, robots, _headers, _redirects
scripts/
├─ seo-audit.mjs
├─ make-og.mjs
└─ visual-check.mjs        # local Puppeteer smoke test
```

## SEO notes

### Entity consistency

The canonical paragraph is in `src/data/site.ts` and is reused by the homepage, `/tentang/`, `Person.description`, and the FAQ. Use the same paragraph on LinkedIn and GitHub. Keep the name **Raihan Ahmad Fathoni** everywhere; `Raihan Fathoni` and `raintxhanx` are only alternate names.

### Source of truth for facts

The case studies use the metrics from the project brief: IPK 3.99/4.00, 687 praktikan, 1.300+ tiket, 200 concurrent users, 31 active users at launch, and 90+ mentees. If a number or role changes, update the Markdown frontmatter and the data files together — the audit checks word count and schema, not factual accuracy.

The tech stack is described generically (backend, database, REST API, queue) because the original brief did not name frameworks. Add concrete tools only when they can be confirmed. The case-study periods (2025, 2026, 2024–2025) are placeholders from the brief and should be checked before publishing.

The three case studies currently use typographic covers in `src/public/og/` because original screenshots were not supplied. Replace them with real screenshots (and keep a 1200×630 version for social sharing) when available.

### Structured data

- `Person` and `WebSite` use stable `@id`s: `https://raintxhanx.uk/#person` and `https://raintxhanx.uk/#website`.
- Case studies include `Person`, `Organization`, `WebSite`, `WebPage`, `Article`, optional `SoftwareApplication`, and `BreadcrumbList`.
- `FAQPage` is only on `/tentang/`.
- `Article.publisher` uses the `Organization` node with a square logo; `author` references the `Person` node.
- `SoftwareApplication` intentionally has no fake `offers` or `aggregateRating`. It is entity markup, not a promise of a rich result.
- Google limits FAQ rich results for most sites; `FAQPage` still helps machine-readable answers.

Validate with the [Rich Results Test](https://search.google.com/test/rich-results) and [Schema Markup Validator](https://validator.schema.org/). `Person`/`ProfilePage` will not show a rich result; “no errors” is the goal.

### Core Web Vitals

The homepage dynamically imports the Three.js chunk after first paint. Subpages ship no 3D. The custom loader was removed; the H1 is visible in the first paint; fonts are self-hosted; the 6.5 MB audio file is only created when the visitor presses “Suara”.

Run PageSpeed Insights on the deployed URL. Target: mobile score ≥ 80, LCP < 2.5 s, CLS < 0.1, INP < 200 ms. The galaxy is intentionally heavy; subpages should score much higher.

### Cloudflare custom domain

Use `raintxhanx.uk` as the canonical host. Add a Cloudflare Redirect Rule (or a Page Rule) so `www.raintxhanx.uk/*` 301s to `https://raintxhanx.uk/$1`. `_redirects` only handles paths, not hosts.

### Google Search Console checklist

1. Add `raintxhanx.uk` as a **Domain property** via DNS TXT (Cloudflare DNS), or use the URL-prefix property with an HTML verification file in `src/public/`.
2. If using the meta tag, set `PUBLIC_GOOGLE_SITE_VERIFICATION` in the Pages environment and redeploy.
3. Submit `https://raintxhanx.uk/sitemap.xml`.
4. Use URL Inspection for `/`, `/tentang/`, `/proyek/`, the three case studies, and `/kontak/` (7 URLs, under the 10/day limit).
5. After 7/14/30 days, check Coverage, Performance, and Core Web Vitals.
6. Confirm `site:raintxhanx.uk` returns at least four pages.

**Cloudflare managed robots.txt:** if the dashboard has “Managed robots.txt” / AI Crawl Control enabled, it can override `src/public/robots.txt`. Check `curl https://raintxhanx.uk/robots.txt` after deploy. If it still shows the Cloudflare content-signals comment block, disable the managed file in the dashboard.

### Off-page checklist (manual)

- LinkedIn: website field → `https://raintxhanx.uk`; About uses the same bio paragraph.
- GitHub: profile bio, profile README, and pinned repositories link to the site.
- Universitas Gunadarma directory/alumni profile, if available.
- Repository READMEs link back to the portfolio.
- Verify each link is publicly visible and indexable. Do not buy backlinks.

## Controls

| Input | Action |
| --- | --- |
| Scroll | Camera flies along the galaxy spline |
| Click/tap a node | Fly to that chapter |
| Orbit CTA | Next chapter / back to origin |
| Nav links | Real page navigation (`/tentang/`, `/proyek/`, `/kontak/`) |
| Mobile | Bottom-sheet chapter card |
| Keyboard | Tab through markers and controls; Escape closes the menu |
| `prefers-reduced-motion` | Shader frozen, fly-to instant, reveals skipped |
| `?debug=1` | Exposes `window.__experience` on the homepage |

## Architecture notes

- `Experience.js` owns the renderer, scene, camera and the single `requestAnimationFrame` loop. It measures anchors only inside `#galaxy-track`, so the static dossier below cannot stretch the camera path.
- `home.js` pauses the render loop when the dossier enters the viewport and adds `body.galaxy-done` to fade the fixed scene/HUD.
- `site.js` is the only script loaded on subpages. It handles the clock, menu, cursor, copy, reveals and scroll chrome, then dynamically imports `home.js` on the homepage.
- `GalaxyEngine.js` owns GPU resources only; `CameraController.js` owns scroll interpolation, raycast picking and fly-to; `UIProjector.js` owns the DOM HUD.
- `PerformanceMonitor.js` progressively degrades quality below 45 FPS.
- GLSL is inlined as template strings, so the old glslify plugin is no longer needed.

## Contact

- Email — [raintxhanx@gmail.com](mailto:raintxhanx@gmail.com)
- GitHub — [github.com/Raintxhanx](https://github.com/Raintxhanx)
- LinkedIn — [in/raintxhanx](https://www.linkedin.com/in/raintxhanx/)

---

Built with Three.js, Astro, curiosity and too much coffee.
