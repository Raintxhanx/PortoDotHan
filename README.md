# Raihan Fathoni — 3D Portfolio

> “Hanya manusia biasa yang bahagia dengan hal-hal kecil.”
> *Just an ordinary human, happy with small things.*

An interactive 3D portfolio for **Raihan Fathoni** ([@Raintxhanx](https://github.com/Raintxhanx)) — a student and beginner developer working across AI, backend engineering and data.

The centrepiece is a generative spiral galaxy built in Three.js. Six chapter nodes (hero, about, toolkit, work, now, contact) sit on spiral arms, and a scroll-driven camera flies along a `CatmullRomCurve3` spline through them. Chapter markers project into the DOM as a floating HUD card, with a collapsed bottom sheet on phones. Portfolio content stays as normal HTML — the galaxy is a navigational background, not a replacement for the copy.

- **One draw call for the galaxy** — a single `BufferGeometry` + `ShaderMaterial` renders ~100k dust particles (28k on mobile). Radius, branches, randomness, randomness power, thickness, spiral winding and inside/outside colours are all exposed in `src/js/galaxy/galaxyConfig.js`.
- **Scroll-driven camera** — measured `<section>` anchors map scroll position to a point on the camera/look spline, so the camera reaches each node exactly when its chapter is centred.
- **Raycast fly-to** — click or tap a chapter node (`THREE.Raycaster` against generous hit spheres) and the camera eases to that waypoint; scroll is temporarily locked mid-flight so chapters don't flash past.
- **Projected DOM HUD** — 3D nodes are projected with `vector.project(camera)` and rendered as ordinary HTML markers/card via `translate3d`; the card auto-anchors left/right/top/bottom so it never clips off a viewport edge.
- **Rich chapter card** — each chapter injects its own copy (bio, honest toolkit levels, six projects, current focus, contact links) into the orbit card; the CTA walks to the next chapter and loops home from Contact.
- **Mobile** (`<768px`) — fewer particles, DPR capped at 2, projected markers hidden, the card becomes a bottom sheet that is invisible at Origin, shows a compact chapter title, expands on tap/swipe, and keeps a sticky next-chapter CTA.
- **Intro marquee** — six identical flex groups make a pixel-perfect `-50%` loop at any width; the strip is vertically centred in the intro and fades out as soon as the hero leaves the viewport, returning when you scroll home.
- **Performance watchdog** — degrades below 45 FPS: tier 1 cuts particles to 65k and DPR to 1; tier 2 cuts to 40k and hides the starfield. Never restores quality (avoids oscillation).
- **Accessibility** — keyboard focus on markers and card, `inert` on collapsed card body, dynamic ARIA labels, reduced-motion support (frozen shader time, instant fly-to), skip-to-content link, no-WebGL fallback.
- The rest of the portfolio is unchanged: editorial layout (Instrument Serif + Space Grotesk + JetBrains Mono), Gravida case studies, Jakarta clock, wish easter egg, generative ambient audio.

## ⚙️ Stack

| Layer | Tool |
| --- | --- |
| 3D | [Three.js](https://threejs.org/) + custom GLSL |
| Build | [Vite](https://vitejs.dev/) |
| Styles | [Sass](https://sass-lang.com/) |
| Type | Instrument Serif, Space Grotesk, JetBrains Mono |
| Audio | WebAudio API (no files) |
| Deploy | `gh-pages` / Docker (Node) |

## 🚀 Run it

```bash
npm install
npm run dev
```

Open the printed local URL. To build for production:

```bash
npm run build
npm start     # serves dist/ on http://localhost:8080
```

### Debug hook

Add `?debug=1` to the URL to expose `window.__experience` (the `Experience` instance) for browser-console testing of camera state, galaxy nodes and the UI projector.

```bash
# production build, served from dist/
npm run build
npm start
# open http://localhost:8080/?debug=1
```

Deploy to GitHub Pages:

```bash
npm run deploy
```

The build uses relative asset paths (`base: './'`), so it also works from a subdirectory or any static host.

### 🐳 Docker (production)

The image is a multi-stage build: Vite compiles the site, then a small dependency-free Node server (`server.mjs`) serves the static output as a non-root user on port `8080`. Use `npm run dev` for hot reload; the container always serves the production build.

```bash
docker compose build
docker compose up -d
```

The port is published to `127.0.0.1:8091` only, so the site is not exposed to the network. Point your Cloudflare Tunnel at it:

```bash
cloudflared tunnel --url http://localhost:8091
```

Or in a tunnel config (`~/.cloudflared/config.yml`):

```yaml
ingress:
  - hostname: example.com
    service: http://localhost:8080
  - service: http_status:404
```

If `cloudflared` later runs as a container on this Compose network, point it at the service directly (`http://web:8080`) and skip the host port entirely.

Set `APP_PORT` to publish a different port. If the tunnel or a proxy runs in another container/network and needs to reach it from outside the host, set `BIND_ADDR=0.0.0.0`:

```dotenv
APP_PORT=3000
BIND_ADDR=0.0.0.0
```

Stop it with `docker compose down`. Without Compose:

```bash
docker build -t portodothan .
docker run --rm -p 127.0.0.1:8091:8080 portodothan
```

The container runs with a read-only filesystem, no Linux capabilities and a health check on `/healthz`. `server.mjs` handles SPA routing, long-lived caching for hashed assets, ETags and byte ranges for audio; TLS and compression are handled by Cloudflare.

## 🗂 Structure

```
src/
├─ index.html            # content + semantic structure; #orbit HUD markup
├─ js/
│  ├─ index.js           # boot, loader, scroll state, interactions, nav
│  ├─ components/
│  │  ├─ Experience.js   # Three.js renderer/scene/render loop, anchor measure
│  │  ├─ Cursor.js       # custom cursor + magnetic elements; Fly ✦ state
│  │  └─ Ambient.js      # generative WebAudio pad
│  └─ galaxy/
│     ├─ CameraController.js   # CatmullRom spline, scroll interp, fly-to, raycast
│     ├─ GalaxyEngine.js       # dust buffer, shaders, nodes, nebula, starfield
│     ├─ UIProjector.js        # 3D→DOM projection, compact card, mobile bottom sheet
│     ├─ PerformanceMonitor.js # FPS watchdog + progressive quality degradation
│     ├─ PortfolioState.js     # active-chapter store + events
│     ├─ galaxyConfig.js       # galaxy constants, spiral math, six chapter defs
│     ├─ shaders.js            # galaxy + node GLSL
│     └─ index.js (not present; galaxy modules imported by Experience)
├─ scss/
│  ├─ style.scss         # entry
│  ├─ _tokens.scss       # colour, type, motion tokens
│  ├─ _base.scss         # reset, ambient backdrop, marquee
│  ├─ _chrome.scss       # loader, nav, menu, cursor, toast
│  ├─ _hero.scss
│  ├─ _about.scss
│  ├─ _toolkit.scss
│  ├─ _work.scss
│  ├─ _now.scss
│  ├─ _contact.scss
│  ├─ _responsive.scss
│  └─ _galaxy.scss       # orbit HUD, markers, card, mobile sheet, scene veil
└─ public/img/           # avatar, favicon, optimised project stills
```

## 🎮 Controls

| Input | Action |
| --- | --- |
| Scroll | Camera flies along the galaxy spline through the chapters |
| Click/tap a node | Smooth fly-to that chapter (scroll locked mid-flight) |
| Click a nav link / anchor | Same fly-to via `focusSection` |
| Hover/focus a marker | Marker expands into a labeled pill; cursor shows `Fly ✦` |
| Hover/focus the card | Compact card expands to show blurb, meta and CTA |
| Mobile | Bottom sheet: tap toggle to expand/collapse chapter details |
| Keyboard | `Tab` moves focus between markers and card controls; `Escape` closes menu/wish |
| `prefers-reduced-motion` | Shader animation frozen, fly-to instant, reveals skip animation |

## 🧠 Architecture notes

- `Experience.js` owns the renderer, scene, camera and the single `requestAnimationFrame` loop. It measures `<section data-scene>` anchors (never `body[data-scene]`) and hands them to `CameraController`. Nothing is allocated inside the render loop.
- `GalaxyEngine.js` builds the one dust `BufferGeometry` + `ShaderMaterial`, plus the node points, nebula sprites and starfield. It owns GPU resources only — no DOM, no camera.
- `CameraController.js` builds camera/look `CatmullRomCurve3` paths from node positions, interpolates `u` from scroll, performs `THREE.Raycaster` picking, and eases fly-to with a custom `easeInOutCubic` (no GSAP).
- `UIProjector.js` projects node positions into screen space each frame, writes `translate3d` to markers/card, auto-anchors the card, and manages compact/expanded card state plus the mobile bottom sheet and `inert`/ARIA handling.
- `PortfolioState.js` is the single active-chapter store; `PerformanceMonitor.js` progressively degrades quality below 45 FPS.
- GLSL is inlined as template strings (no glslify). `?debug=1` exposes `window.__experience` for testing.

Project screenshots were converted from the originals in the [Raintxhanx profile repo](https://github.com/Raintxhanx/Raintxhanx) to lightweight WebP stills (the source GIFs were 12–43 MB). Skill levels are deliberately honest — “beginner” and “learning” are part of the story, not a disclaimer.

## 📬 Contact

- Email — [raintxhanx@gmail.com](mailto:raintxhanx@gmail.com)
- GitHub — [github.com/Raintxhanx](https://github.com/Raintxhanx)
- LinkedIn — [in/raintxhanx](https://www.linkedin.com/in/raintxhanx/)

---

Built with Three.js, curiosity and too much coffee.
