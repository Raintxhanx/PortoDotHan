# Raihan Fathoni — 3D Portfolio

> “Hanya manusia biasa yang bahagia dengan hal-hal kecil.”
> *Just an ordinary human, happy with small things.*

An interactive 3D portfolio for **Raihan Fathoni** ([@Raintxhanx](https://github.com/Raintxhanx)) — a student and beginner developer working across AI, backend engineering and data.

The site is a small, hand-built universe: a living shader orb, a drifting starfield, editorial typography and a quiet soundtrack. No templates, no UI kit — just Three.js, SCSS and a lot of care.

## ✦ What’s inside

- **Custom WebGL scene** — an iridescent, noise-displaced glass core built with a bespoke GLSL shader, orbital rings, 1,700 stars and a particle swarm.
- **Scroll-reactive direction** — the core changes position, scale, colour and mood for every chapter; the ambient palette blends between gold, cyan and violet.
- **Editorial layout** — Instrument Serif + Space Grotesk + JetBrains Mono, hairline rules, oversized type and generous negative space.
- **Micro-interactions** — magnetic buttons, a custom cursor with contextual labels, 3D card tilt, hover-filled skill rows and a rotating “open to collaborate” stamp.
- **Gravida case studies** — six real projects from the GitHub profile, with imagery and honest descriptions.
- **A wish easter egg** — a small nod to the Genshin Impact pull simulator. Pull a 5★ insight.
- **Generative ambient audio** — a WebAudio drone, generated in the browser. Off by default; toggle it in the nav.
- **Details** — live Jakarta clock, loading sequence, scroll progress, copy-to-clipboard, reduced-motion support, keyboard focus states and a no-WebGL fallback.

## ⚙️ Stack

| Layer | Tool |
| --- | --- |
| 3D | [Three.js](https://threejs.org/) + custom GLSL |
| Build | [Vite](https://vitejs.dev/) |
| Styles | [Sass](https://sass-lang.com/) |
| Type | Instrument Serif, Space Grotesk, JetBrains Mono |
| Audio | WebAudio API (no files) |
| Deploy | `gh-pages` |

## 🚀 Run it

```bash
npm install
npm run dev
```

Open the printed local URL. To build for production:

```bash
npm run build
npm run preview
```

Deploy to GitHub Pages:

```bash
npm run deploy
```

The build uses relative asset paths (`base: './'`), so it also works from a subdirectory or any static host.

## 🗂 Structure

```
src/
├─ index.html            # content + semantic structure
├─ js/
│  ├─ index.js           # boot, loader, scroll state, interactions
│  └─ components/
│     ├─ Experience.js   # Three.js scene, shaders, render loop
│     ├─ Cursor.js       # custom cursor + magnetic elements
│     └─ Ambient.js      # generative WebAudio pad
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
│  └─ _responsive.scss
└─ public/img/           # avatar, favicon, optimised project stills
```

## 🧠 Notes

- Project screenshots were converted from the originals in the [Raintxhanx profile repo](https://github.com/Raintxhanx/Raintxhanx) to lightweight WebP stills (the source GIFs were 12–43 MB).
- Skill levels are deliberately honest — “beginner” and “learning” are part of the story, not a disclaimer.
- The core is `FrontSide`, transparent and depth-write-free: a rim-lit glass shell rather than a solid planet, so the content always stays readable.
- Everything you see is generated: the stars are points, the nebula is CSS, the audio is oscillators, the orb is maths.

## 📬 Contact

- Email — [raintxhanx@gmail.com](mailto:raintxhanx@gmail.com)
- GitHub — [github.com/Raintxhanx](https://github.com/Raintxhanx)
- LinkedIn — [in/raintxhanx](https://www.linkedin.com/in/raintxhanx/)

---

Built with Three.js, curiosity and too much coffee.
