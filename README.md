# garrettnunes.com

Personal site for **Garrett Nunes** — founder building autonomous AI systems and
auto-parts e-commerce (Fazer Tech · OEM Wheel · Factory Parts). Based in Maryville, TN.

A single-page, self-contained static site. No backend, no framework — hand-written
HTML/CSS/JS with a tasteful animated background, scroll reveals, and a typewriter
hero flourish. Loads fast, degrades gracefully, and fully respects
`prefers-reduced-motion`.

## What's in here

```
index.html            The site (one page)
404.html              Not-found page
robots.txt            Crawler directives
sitemap.xml           Single-URL sitemap
render.yaml           Render static-site deploy manifest
package.json          Scripts (build check + local preview server)
assets/
  css/styles.css      All styling (dark theme, motion, responsive, mobile nav)
  js/main.js          Reveals, header state, mobile nav, scroll-spy, card glow,
                      terminal typewriter, background canvas
  img/og.svg          Source for the social-share card (1200×630)
  img/og.png          Rendered OpenGraph/Twitter image (referenced by meta tags)
scripts/
  check.mjs           Zero-dep build check (assets/anchors/tags/JSON-LD) — runs on deploy
  serve.mjs           Zero-dep local preview server
```

No third-party runtime dependencies. The only external load is Google Fonts (with
`preconnect`); everything else is in-repo.

## Preview locally

Pick whichever you have. Either serves the repo root at a local URL.

**Python (no install):**
```bash
python -m http.server 8000
# open http://localhost:8000
```

**Node (built-in script):**
```bash
npm run preview
# open http://localhost:4321
```

> Open `index.html` via a server, not `file://` — the relative asset paths and the
> background canvas behave correctly when served over HTTP.

## Build check (optional but wired)

A zero-dependency validator confirms referenced assets resolve, in-page anchors have
matching targets, and the major structural tags are balanced — so a broken edit can't
deploy silently:

```bash
npm run check
```

Render runs this automatically on deploy (see `render.yaml`). To skip the build
entirely, set `buildCommand: ""` in `render.yaml`.

## Deploy to Render

This repo ships a ready `render.yaml` (Blueprint) for a **static site** serving the
repo root. It has not been deployed — there is no remote yet.

**One-time setup (Garrett — this is the unblock):**

1. **Create a remote and push.** This site lives in a brand-new local git repo with
   **no remote**. Create an empty repo (e.g. on GitHub: `garrettnunes-site`), then from
   `C:/Users/Admin/repos/garrettnunes-site`:
   ```bash
   git remote add origin <your-new-repo-url>
   git push -u origin develop      # or rename to main first if you prefer
   ```
2. **Connect it to Render.** In the Render dashboard → **New +** → **Blueprint**, pick
   this repo. Render reads `render.yaml` and provisions the static site automatically.
   (Or **New + → Static Site**, point it at the repo, set Publish Directory to `.` and
   Build Command to `npm ci && npm run check`.)
3. **Point the domain.** In the Render service → **Settings → Custom Domains**, add
   `garrettnunes.com` (and `www`), then set the DNS records Render shows at your
   registrar.

That's it — pushes to the connected branch auto-deploy, and PRs get preview URLs.

### Multi-site note
If you already run a multi-site setup on Render and want this served there instead of as
its own service, the same static build (`publish = repo root`, `build = npm run check`)
slots in — just add it as another static site/route under the existing account.

## Before launch — quick edits

- **Contact email:** `index.html` uses a placeholder `hello@garrettnunes.com`
  (search for it — it appears once in the contact section). Swap in the real inbox.
  There's a visible note on the page reminding you to do this.
- **Social card:** `assets/img/og.png` is the OpenGraph/Twitter preview (1200×630,
  rendered from `assets/img/og.svg`). To re-render after editing the SVG:
  `npx sharp-cli -i assets/img/og.svg -o assets/img/og.png resize 1200 630`.
- Everything else (copy, ventures, links) is public-safe and ready as-is.

---

Built lean. Static by design.
