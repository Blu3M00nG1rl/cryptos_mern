# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A personal cryptocurrency portfolio tracker, MERN stack (MongoDB, Express 5, React 19, Node), fully in French (UI text, variable names, commit messages). Users record buy/sell transactions (`achatCoin`, in EUR or in BTC), the backend enriches them with market data pulled from an external price source (CoinGecko, via daily import scripts), and the frontend renders wallet valuation, evolution %, recap, and buy/sell history.

## Commands

There is no root-level script; backend and frontend are separate npm projects with no shared tooling (no lint/test scripts are defined in either `package.json`).

```bash
# Backend (from backend/)
npm start                 # nodemon server.js — requires backend/config/.env and a running MongoDB

# Frontend (from frontend/)
npm start                 # react-scripts start (dev server on :3000)
npm run build              # production build
npm test                   # react-scripts test (CRA default; no custom test suites currently exist)

# Full stack via Docker
docker compose up -d                          # starts db (mongo), backend (:5001), frontend (:3000)
docker compose down && docker compose build --no-cache && docker compose up -d   # after any npm install, per project convention
```

There is no linter configured beyond CRA's default `eslintConfig: { extends: ["react-app", "react-app/jest"] } ` in `frontend/package.json`.

## Environment configuration

- `backend/config/.env`: `MONGO_URI`, `API_URL` (backend's own base URL, used for server-to-server calls between its own routes), `ROUTES_PREFIX` (mounted in front of every route group in `server.js`, e.g. `/backend`), `PORT`, `CLIENT_URL` (for CORS), `CONFIG_APP_PATH`, `MARKETCAP_MIN_EUR`.
- `frontend/.env`: `REACT_APP_API_URL`, `REACT_APP_INVESTISSEMENT`.
- Frontend calls are hardcoded as `` `${process.env.REACT_APP_API_URL}/backend/<resource>` `` — the `/backend` segment must match `ROUTES_PREFIX` on the backend. If you rename `ROUTES_PREFIX`, every frontend page (`Wallet.js`, `Achats.js`, `Ventes.js`, `Coins.js`, `Recap.js`, `CoinsAdmin.js`) needs updating.
- In Docker, `MONGO_URI` and `REACT_APP_API_URL` are overridden in `docker-compose.yml` rather than `.env`.

## Architecture

### Backend (`backend/`)

Standard Express layering: `routes/` → `controllers/` → `models/` (mongoose), plus a `services/` layer that is only lightly used (`coin.service.js`). `server.js` wires each route group under `process.env.ROUTES_PREFIX + '/<resource>'` and calls `connectDB()` before listening.

Key domain models:
- `coin.model.js` — catalogue of tracked coins (coinId, symbol, name, rank, picture, stockage).
- `achatCoin.model.js` / `achatCoinEnBtc.model.js` — individual buy transactions, priced in EUR and in BTC respectively. Portfolio quantity/avg price per symbol is computed on the fly via mongoose aggregation (see `getAllCoins` in `coin.controller.js`), not stored.
- `history.model.js` — daily price snapshots per coin (`coinId`, `journee`, `prix`, `market_cap`, `total_volume`), used both for "today's price" and for "evolution vs N days ago" (N = `maxDiff`, the largest `diff` recorded in `bitcoin.model.js`).
- `bitcoin.model.js` — BTC-specific price history plus a `diff` field that drives the evolution comparison date used across the whole app (`getMaxDiffValue()` is duplicated in `coin.controller.js` and `history.controller.js`).
- `coins_non_trouve.model.js` / `coins_non_importe.model.js` — side tables populated during CSV import when a coin symbol from the CSV isn't matched or fails to import (see below).
- `note.model.js`, `params.model.js` — free-text notes and app-wide config values (e.g. market cap floor) editable from the UI.

### Data import pipeline (`backend/uploads/*.js`)

Standalone Node scripts (not part of the Express app process) that are executed via `child_process.exec()` from controllers rather than imported as modules:
- `history.controller.js` → `runImportJ` / `runImportH` exec `uploads/import.js` and (implicitly) related importers to fetch/parse daily price CSVs and coin lists, writing into `History`/`Coin`/`Params`, and logging unmatched/failed symbols into `coins_non_trouve` / `coins_non_importe`.
- `bitcoin.controller.js` → `runImportB` reads `backend/storage/*.csv` (e.g. `detailBtc.csv`) via `csv-parser`.
- `maintenance.controller.js` → `runMaj` is the "update everything" orchestrator: it calls its own API (`process.env.API_URL`) sequentially — `bitcoin/importB` → `history/importH` → `history/importJ` — over HTTP (self-referential axios calls), not direct function calls. When touching import order/behavior, this is the entry point that ties the three importers together.
- Raw data lives in `backend/storage/` (large CSVs, including a 40MB `historique_prix.csv` and a `historique/` directory) — treat this as generated/data content, not source to review line by line.

### Frontend (`frontend/src/`)

- `components/Routes/index.js` defines all page routes; `Navbar` + `LeftNav` are persistent chrome around a `<main className="coin-page">` outlet. Search state is lifted to `RoutesLayout` and passed down as a `search` prop to every page.
- `pages/` — one file per view, each independently fetching its own data with axios directly in `useEffect` (no shared API client, no state management library, no React Query — every page repeats its own fetch/loading/sort boilerplate). `Wallet.js` is the largest and most central page (portfolio table, EUR/BTC mode toggle, inline add/edit/delete of `achatCoin` and `achatCoinEnBtc` "detail" rows, note editing).
- `styles/` — Sass partials (`_coins.scss`, `_navbar.scss`, `_leftnav.scss`, `_settings.scss`) imported into `index.scss`.
- Coin images are expected at `frontend/public/img/coins/<symbol>.png`, sourced from CoinGecko's `assets.coingecko.com/coins/images/no/standard/coinId.png` convention (see root `Readme.md`).

### Cross-cutting conventions to preserve

- Money/quantity aggregation (avg buy price, totals) is always computed server-side per request rather than cached — replicate this pattern (mongoose `.aggregate()` grouping by lowercased `symbol`) rather than introducing a stored running total.
- "Evolution" percentages everywhere compare today's `history` price against the price at `today - maxDiff` days, where `maxDiff` is read from the `Bitcoin` collection's max `diff` value — this is a shared, implicit convention across `coin.controller.js`, `history.controller.js`, and the Wallet page, not a per-feature constant.
- Routes distinguish plain EUR-denominated data from BTC-denominated data by suffixing endpoints/fields with `EnBtc` (e.g. `/coin/enBtc`, `/coin/detailEnBtc`, `achatCoinEnBtc` model) rather than by a query parameter — follow this suffix convention when adding parallel BTC variants of a feature.
