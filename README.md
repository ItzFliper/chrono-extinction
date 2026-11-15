# ChronoExtinction

**ChronoExtinction** is an interactive deep-time logarithmic atlas exploring extinct, endangered, and recovered species across **505 million years of Earth history**—from Cambrian and Ordovician marine predators down to Pleistocene megafauna, historical losses, and present-day conservation outcomes.

---

## Key Features

### 1. Inverted Logarithmic Deep-Time Engine ($\log_{10}$)
- Transitions fluidly across nine orders of magnitude—from **505 Ma** and **450 Ma** down to **10,000 BCE**, **1500 CE**, **1900 CE**, and **The Present**—using an inverted logarithmic projection relative to the present:
  $$L = \log_{10}(\text{YearsAgo} + 1)$$
  $$x(L) = \frac{W}{2} + \left(\frac{L_{\text{center}} - L}{Z_{\text{span}}}\right) \times W$$
- Supports **cursor-anchored mouse-wheel zooming**, **pointer drag panning**, **touch pinch-to-zoom**, a **logarithmic zoom slider**, and **60fps `requestAnimationFrame` spring interpolation**.

### 2. Semantic Level of Detail (LoD) & Viewport Virtualization
- **Macro View ($Z_{\text{span}} > 4.6$):** Geological era background bands, dynamic logarithmic ruler ticks, the **"Big Five" Mass Extinction beacons** (444 Ma, 372 Ma, 252 Ma, 201 Ma, 66 Ma), and flagship evolutionary landmarks.
- **Meso View ($1.85 < Z_{\text{span}} \le 4.6$):** Smoothly promotes mid-tier species to interactive cards and compact badges with collision-free deterministic vertical lane assignment.
- **Micro View ($Z_{\text{span}} \le 1.85$):** Full specimen cards displaying Wikipedia thumbnails, scientific binomials, exact extinction dates, and extinction driver summaries.
- Only species inside the active viewport bounds (plus a small buffer) are mounted in the DOM for sustained 60fps performance.

### 3. "The Present" Split-Track Conservation Zone
At the right-most meridian (`L = 0.00`, `2026 CE`), the timeline opens into an Anthropocene split-track zone with CSS `content-visibility: auto` containment:
- **Track 1 — Endangered (*En peligro de extinción*):** Vaquita, Amur Leopard, Javan Rhinoceros, Kākāpō, Saola, Sumatran Orangutan, Axolotl, and Mountain Gorilla.
- **Track 2 — Saved / Recovered (*Salvados de la extinción*):** Iberian Lynx (*Lynx pardinus*), Bald Eagle, Giant Panda, Humpback Whale, California Condor, Arabian Oryx, Przewalski's Horse, and Black-footed Ferret.

### 4. Floating Search, Filters, Era Dock & Native `<dialog>` Detail Drawer
- **Floating Glassmorphism Control Bar:** Instant search (keyboard shortcut `/`) across common names, binomials, causes, eras, and regions; status filter pills (*All*, *Extinct*, *Endangered*, *Recovered*); and flexible Year/Age Jumper (`66 Ma`, `10000 BCE`, `1936`, `Present`).
- **Jump-to-Era Quick-Navigation Dock:** One-click camera flights to *All Time*, *Ordovician (444 Ma)*, *Permian (252 Ma)*, *Triassic (201 Ma)*, *Cretaceous (66 Ma)*, *Pleistocene (10,000 BCE)*, *1500 CE*, *1900 CE*, and *The Present*.
- **Species Detail Slide-Over Drawer:** Built on a native modal `<dialog>` (`showModal()`) with light-dismiss and `Esc` support that preserves the user's timeline zoom and pan state, displaying high-resolution Wikipedia photography, taxonomic classification, timeline coordinates, curated extinction/recovery explanations, and live Wikipedia REST API monographs paired with SVG taxonomic silhouette fallbacks.

---

## Tech Stack & Architecture

- **Framework:** Next.js 16 (App Router, Turbopack, TypeScript)
- **Styling & Motion:** Tailwind CSS v4, Framer Motion, Lucide React
- **Media & Science Data:**
  - Curated 69-species dataset in [`src/data/species.json`](src/data/species.json) and ICS geological eras in [`src/data/eras.ts`](src/data/eras.ts)
  - Concurrency-limited, `localStorage`-cached Wikipedia REST API v1 client in [`src/lib/wikipedia.ts`](src/lib/wikipedia.ts) and [`src/lib/useWikipediaSummary.ts`](src/lib/useWikipediaSummary.ts)
  - Taxonomic lineage cross-checked via UniProt and EMBL-EBI OLS (`uv` Science Skills)

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quality Checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Git & Pull Request Workflow

Built across four dedicated feature branches merged into protected `main`:
1. **PR #1 (`feat/project-setup-and-dataset`):** Next.js + Tailwind scaffold, typed schema, 69-species dataset, Wikipedia fetcher, and SVG silhouettes.
2. **PR #2 (`feat/logarithmic-timeline-engine`):** Inverted $\log_{10}$ math engine, Semantic LoD viewport virtualization, Big Five markers, and Present split-track zone.
3. **PR #3 (`feat/search-filters-and-drawer`):** Floating search/filter bar, Jump-to-Era dock, and native `<dialog>` species detail drawer.
4. **PR #4 (`feat/devtools-qa-and-polish`):** Live browser/DevTools QA verification (hydration fix, 66 Ma vertical card separation, network & 60fps zoom telemetry) and documentation.
