<div align="center">

# ``` fenced

### decorated code blocks, real HTML, no screenshots

A free, 100% client-side tool that turns Markdown into gorgeous, self-contained HTML.
Every code block becomes a decorated "fence", as a terminal window, a syntax-themed card, or clean plain text, and it all stays real, selectable HTML you can paste anywhere.

[**fenced.dev**](https://fenced.dev) &nbsp;·&nbsp; [report an issue](https://github.com/lars-1987/fenced/issues) &nbsp;·&nbsp; [buy me a coffee](https://ko-fi.com/larshdev)

![MIT licensed](https://img.shields.io/badge/license-MIT-d68a9c?style=flat-square)
![100% client-side](https://img.shields.io/badge/100%25-client--side-d68a9c?style=flat-square)
![no tracking](https://img.shields.io/badge/tracking-none-d68a9c?style=flat-square)
![built with Vite](https://img.shields.io/badge/built%20with-vite%20%2B%20ts-d68a9c?style=flat-square)

</div>

---

## why

Screenshots of code go stale the moment you edit, you cannot copy from them, they ignore dark mode, and they read terribly on a phone. fenced keeps your code as real, selectable text and just dresses it up. Paste or drop a `.md` file, pick a look, and download a single `.html` file that works anywhere.

The whole thing runs in your browser. Nothing is ever uploaded, there are no accounts, and there is no tracking by default. Your Markdown never leaves the tab.

## the three fences

Every fenced code block resolves to one of three modes, and all three output real, selectable HTML.

| mode | what it is |
| --- | --- |
| **terminal** | A window with traffic-light chrome and a language label. The signature look. |
| **themed** | A clean syntax-highlighted card with line numbers. |
| **plain** | Barely-there chrome, no highlighting, just the code. |

Highlighting is powered by [Shiki](https://shiki.style) with the four Catppuccin flavours plus GitHub, One Dark Pro, Tokyo Night, Nord, Dracula, Rosé Pine, Vitesse and more. Tokens are emitted as inline styles, so an exported file needs no stylesheet, just the markup.

## how it works

1. Paste Markdown, or upload / drag-drop a `.md` file.
2. Watch the live split-pane preview update as you type.
3. Switch the fence mode and syntax theme to taste.
4. Copy the HTML, or download a self-contained `.html` file.

```
markdown ──▶ markdown-it ──▶ fenced (per-block decoration via Shiki) ──▶ real HTML
```

## privacy

fenced is built the same way as its siblings: free, open source, free forever, with an optional tip jar.

- Everything parses and highlights client-side. No server, no upload, no exceptions.
- No accounts and no cookies. Your draft and settings are saved only in your browser's `localStorage`.
- Analytics is cookieless (PostHog, in-memory persistence, no autocapture, no identifiers, never your content). It honors Do Not Track and Global Privacy Control, and there is an on-device opt-out on the privacy page. When no key is configured, no analytics code is loaded at all.
- The exported HTML is fully self-contained. The only outbound request it makes is for the webfonts, and you are free to inline those too.

See [privacy](https://fenced.dev/privacy.html) and [terms](https://fenced.dev/terms.html) for the full text.

### analytics setup

Analytics is opt-in at build time. Without a key it is a no-op.

```bash
cp .env.example .env.local   # then set VITE_POSTHOG_KEY for local dev
```

For production, add a `VITE_POSTHOG_KEY` repository secret (Settings → Secrets and variables → Actions). The deploy workflow passes it into the build. The host defaults to `us.i.posthog.com`; override with `VITE_POSTHOG_HOST`.

## run it locally

```bash
git clone https://github.com/lars-1987/fenced.git
cd fenced
npm install
npm run dev
```

Then open the printed local URL. To produce a production build:

```bash
npm run build    # type-checks, then builds to dist/
npm run preview  # serve the production build locally
```

## project layout

```
src/
  main.ts            app wiring: state, events, render loop
  style.css          app chrome and design tokens
  sample.ts          the demo document
  core/
    convert.ts       markdown-it pipeline, routes fences to the decorator
    fence.ts         the three decoration modes
    highlight.ts     Shiki setup (fine-grained, JS regex engine)
    styles.ts        shared fence + prose CSS (preview and export)
    export.ts        self-contained .html document builder
```

The CSS that styles a fenced block lives in one place, `core/styles.ts`, and is shared between the live preview and the exported file so they can never drift apart.

## stack

- [Vite](https://vitejs.dev) + TypeScript, pure client-side SPA, builds to static files.
- [markdown-it](https://github.com/markdown-it/markdown-it) for Markdown parsing.
- [Shiki](https://shiki.style) for TextMate-grade syntax highlighting, in the browser.

Deploys to GitHub Pages automatically on every push to `main` (see [.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

## roadmap

- [ ] Per-block mode and language overrides from the fence info string.
- [x] Terminal and themed blocks carry their own theme background, so dark Catppuccin fences pop on any page.
- [ ] Per-snippet copy button in the export, opt-in.
- [ ] Font size and line height controls.
- [ ] Shareable settings via URL.

## license

[MIT](LICENSE). Built in Melbourne, sibling to MetaStrip and larsh.dev.

<div align="center">

☕ [buy me a coffee](https://ko-fi.com/larshdev)

</div>
