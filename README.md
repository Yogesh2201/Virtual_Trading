# Virtual Trading Dashboard

A virtual trading web app built with React, Vite, Tailwind CSS, and TypeScript.

## Features

- Paper trading simulator with market and portfolio views
- Live price updates via Yahoo Finance
- Orders, portfolio, watchlist, and analytics views
- Browser-based data persistence
- Export portfolio data to Excel

## Getting Started

### Requirements

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Project Structure

- `src/` – main source files
- `src/components/` – UI components
- `src/context/` – app state and trading logic
- `src/services/` – API helpers
- `src/store/` – state management hooks
- `src/utils/` – helpers and utilities

## Notes

- The app uses a virtual trading environment and does not execute real trades.
- Data is stored locally in the browser.
