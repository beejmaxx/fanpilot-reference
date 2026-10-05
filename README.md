# Fanpilot reference

A free, open-source guide to reasoning about LeetCode patterns, data structures, algorithms, and system design. Read it at **[fanpilot.app](https://fanpilot.app)**.

The first edition contains 41 pages: a 32-chapter patterns book, four subject hubs, a home page, research and attribution pages, and interactive LRU-cache and file-system lessons. The book links 125 practice problems and includes eight tested Rust examples. The design labs use original JavaScript models.

The aim is to teach the chain from a correct baseline to a bottleneck, observation, transformation, invariant, and implementation. A complete problem corpus and a full distributed-systems curriculum remain future work.

## Run locally

Requirements: Python 3.10+, Node.js 22+, and npm. Rust 1.82+ is needed only to test the printed Rust examples.

```sh
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
npm ci
npm run dev
```

Open <http://127.0.0.1:8765>. The server rebuilds when `content/` or `src/` changes; refresh the browser to see edits. Restart it after changes to the builder. Use `npm run build` for a one-time build into `dist/`.

On Windows, activate with `.venv\Scripts\activate`; use a `python3` alias for the Python interpreter or run the Python scripts directly with `python`.

## Source layout

| Path | Purpose |
| --- | --- |
| `content/patterns.md` | Canonical website manuscript; numbered chapters become separate pages. |
| `content/lessons/` | Subject hubs, design lessons, research, and attribution. |
| `src/` | HTML template, CSS, browser enhancements, and executable lab models. |
| `scripts/build.py` | Markdown-to-static-HTML build, search data, sitemap, and local server. |
| `tests/` | Independent algorithm references and regression cases. |
| `public/` | Assets copied unchanged, including the original PDF snapshot. |

This is a standalone repository. Building it does not access the original Rust solution collection or require a database, account system, or application server. The browser labs store state only in the current page's memory.

## Verify changes

```sh
npm test
npm run test:patterns
npm run build
```

`npm test` compares LRU histories with an array reference and file-system operations with full-path storage. `test:patterns` extracts the eight actual Rust code blocks from the manuscript, compiles them with overflow checks, and compares them with independent small-input references.

For browser checks, keep the local server running in another terminal:

```sh
npx playwright install chromium
npm run test:site
```

The browser checks visit every generated page, verify internal links and anchors, check desktop/mobile overflow, and exercise search, mobile navigation, both labs, and reading without JavaScript. Screenshots go into ignored `.qa/`. The script uses local Google Chrome on macOS when available; `CHROME_PATH` selects another executable. `SITE_URL=https://example.com` runs against a deployed build.

GitHub Actions runs the build, model tests, printed-example tests, and browser checks for pull requests and pushes to `main`.

## Deploy

The site uses [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) with real page routes and a 404 page. No request-handler code or storage bindings are required. Install dependencies and build before deployment:

```sh
npm run deploy:check
npm run deploy
```

Authenticate Wrangler to the intended account first. Forks must change the Worker name, remove or replace the production route, and update `https://fanpilot.app` in the builder's canonical URLs and sitemap. `CLOUDFLARE_ACCOUNT_ID` can select the account without storing credentials in the repository. The config pins the compatibility date and the lockfile pins Wrangler.

The deployment config enables observability for any future Worker execution; direct static-asset requests do not run application code. Production deployment is manual. The CI workflow needs no deployment credentials.

## Contribute and reuse

Read [CONTRIBUTING.md](CONTRIBUTING.md). Original prose is **CC BY-SA 4.0** ([LICENSE-CONTENT](LICENSE-CONTENT)); original website code, scripts, tests, and code examples are **MIT** ([LICENSE](LICENSE)). The website adapts the original *LeetCode Bible, Patterns Edition* by the LeetCode Bible contributors with new navigation, lessons, and labs. The PDF is an unchanged snapshot of that book and does not yet include the web-only lessons.

Linked problem statements, research papers, external courses, third-party code, and trademarks retain their own rights. The project provides original explanations and links to problems; it is independent of LeetCode and the referenced education providers.
