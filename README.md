# Progress Map

A civic platform for collectively imagining improvements to Britain. Find what needs fixing, dream up what could be, and celebrate what's already beautiful.

## Getting started

### Prerequisites

- Node.js 18+
- A free [MapTiler](https://cloud.maptiler.com/) API key

### Setup

```bash
npm install
```

Create a `.env` file in the project root:

```
VITE_MAPTILER_KEY=your_maptiler_api_key_here
```

### Run locally

```bash
npm start
```

The app will be available at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Project structure

```
src/
  services/       # Data layer (localStorage, swappable to real API)
  components/     # Reusable UI: MapView, SplitLayout, ItemCard, SocialBar
  pages/          # Route-level views (Home, Town, Journey 1–3)
  config.js       # Constants, categories, map config
```

### Key architectural decisions

- **Service layer pattern** — all reads and writes go through `src/services/`, never directly from components. Currently backed by localStorage. Swap the implementation to a real backend without touching UI code.
- **Three journeys** — Fix (opportunities), Imagine (visions), Celebrate (celebrations) — each with its own service, submission flow, and detail page.
- **Social layer** — backing, comments, and sharing work across all three item types via `src/services/social.js`.

## Routes

| Path | Page |
|------|------|
| `/` | Home — postcode input |
| `/town/:slug` | Town hub — three journey buttons + map |
| `/town/:slug/improve` | Browse improvement opportunities |
| `/town/:slug/improve/submit` | Report a new issue |
| `/town/:slug/improve/:id` | Opportunity detail |
| `/town/:slug/imagine` | Browse and create visions |
| `/town/:slug/imagine/:id` | Vision detail |
| `/town/:slug/celebrate` | Browse celebrations |
| `/town/:slug/celebrate/submit` | Add a celebration |
| `/town/:slug/celebrate/:id` | Celebration detail |

## Seed data

On first load the app seeds Stoke Newington, London with 10 local landmarks (Clissold Park, Abney Park Cemetery, Church Street, etc.) and 2 sample improvement opportunities so the app has content immediately.
