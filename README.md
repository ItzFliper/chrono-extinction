# ChronoExtinction

An interactive **Vertical Geological Strata Museum & Filterable Atlas** exploring extinct, endangered, and conservation-recovered animal species across deep geological time—from the Paleozoic oceans through the Present.

## Key Features

- **Vertical Geological Strata Museum (`src/components/VerticalStrataAtlas.tsx`)**: Native 120fps vertical scrolling through six curated deep-time strata (`src/data/eras.ts`), accelerated with CSS `content-visibility: auto` (`.stratum-grid-contain`) and annotated with Earth's Big Five mass extinction markers.
- **Present Conservation Split Showcase**:
  - **Track A — On the Brink (`endangered`)**: Currently threatened and critically endangered species.
  - **Track B — Brought Back (`recovered`)**: Documented conservation recovery successes.
- **Sticky Control & Filter Bar (`src/components/ControlBar.tsx`)**:
  - Instant search (`/` keyboard shortcut) across common names, scientific names, taxonomy, and extinction/recovery causes using a pre-computed index (`SEARCH_INDEX` in `src/app/page.tsx`).
  - Status tabs (*All*, *Endangered*, *Saved*, *Extinct*).
  - Taxonomic macro-group filter pills and chronological sort-order toggle (Newest to Oldest / Oldest to Newest).
- **Floating Depth / Era Elevator Rail (`src/components/StrataElevatorRail.tsx`)**: Desktop right-edge jump rail (`xl`+) and mobile bottom quick-jump navigation dock with `IntersectionObserver` active-stratum tracking.
- **Lazy Media & Species Detail Drawer (`src/components/AtlasSpeciesCard.tsx`, `src/components/SpeciesDrawer.tsx`)**: 95% (`1,137 / 1,198`) pre-cached Wikipedia thumbnails paired with an `IntersectionObserver` Wikipedia REST v1 + MediaWiki Action API fallback (`src/lib/wikipedia.ts`), SVG silhouette fallback, and an accessible `<dialog>` detail drawer with taxonomic metadata and a **Jump to Stratum** action.

## Species Dataset (`src/data/species.json`)

The atlas ships with **1,198** unique, schema-validated, Wikipedia-verified species across ten geological eras/buckets:

- **Total Species:** `1,198` (`897` extinct, `175` endangered, `126` recovered)
- **Pre-Cached Wikipedia Thumbnails:** `1,137` (`95%`)
- **Validation & Deduplication:** `scripts/validate-species.ts` enforces strict schema fields, deduplicates by `id`, `scientificName`, and `wikipediaSlug`, and batches live MediaWiki Action API resolution checks.

## Tech Stack

- **Framework:** Next.js `16.4.6` (App Router) & React `19.3.0`
- **Styling:** Tailwind CSS `4.3.3` (`@tailwindcss/turbopack`)
- **Icons & UI Utilities:** `lucide-react` & `framer-motion`
- **Language & Tooling:** TypeScript `^5`, ESLint `^9`, Node `--experimental-strip-types`

## Local Development

```bash
# Install dependencies
npm install

# Run the development server (http://localhost:3000)
npm run dev

# Validate species catalog offline (or omit --skip-wiki for live MediaWiki API check)
node --experimental-strip-types scripts/validate-species.ts --skip-wiki

# Type-check, lint, and build for production
npx tsc --noEmit
npm run lint
npm run build
```

## Architecture & Repository Layout

```text
src/
├── app/
│   ├── globals.css                # Tailwind styles & .stratum-grid-contain virtualization
│   ├── layout.tsx                 # Root metadata & typography
│   └── page.tsx                   # Atlas orchestration, SEARCH_INDEX, stratum tracking
├── components/
│   ├── AtlasSpeciesCard.tsx       # Species card with IntersectionObserver image enrichment
│   ├── ControlBar.tsx             # Sticky search, status, taxon, and sort controls
│   ├── SpeciesDrawer.tsx          # Accessible <dialog> species detail view
│   ├── StrataElevatorRail.tsx     # Floating desktop rail & mobile bottom era dock
│   └── VerticalStrataAtlas.tsx    # Six-stratum museum layout & Present Track A/B showcase
├── data/
│   ├── eras.ts                    # GEOLOGICAL_ERAS, MASS_EXTINCTION_EVENTS, ATLAS_STRATA
│   └── species.json               # 1,198 curated species entries
├── lib/
│   └── wikipedia.ts               # Wikipedia REST + MediaWiki Action API client
└── types/
    └── species.ts                 # TypeScript interfaces & filter union types
scripts/
└── validate-species.ts            # Dataset integrity & Wikipedia slug validator
```

## Scientific & External Data Attributions

- Species taxonomy and geological time definitions were cross-referenced against [EMBL-EBI Ontology Lookup Service (OLS)](https://www.ebi.ac.uk/ols4/api-docs) and [UniProt](https://www.uniprot.org/help/license).
- Species summaries and specimen imagery metadata are retrieved via the [Wikimedia / Wikipedia REST & Action APIs](https://www.mediawiki.org/wiki/API:Main_page).
