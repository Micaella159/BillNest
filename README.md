# BillNest

BillNest is a static, client-side prototype for tracking household bills and expenses. It runs in a browser and does not require a build step, backend, or package installation.

## Features

- Dashboard with monthly bill totals, upcoming bills, and recent activity
- Create and edit bills and expenses, including bill payment status
- Insights, category breakdowns, and spending comparisons when enough history exists
- Searchable, filterable transaction history grouped by date, including unpaid bills
- Notifications with confirmation for clearing or resetting prototype data
- Browser-local data persistence and a backup/restore flow for prototype resets

## Technology

- HTML, CSS, and vanilla JavaScript
- Inter is requested from Google Fonts; the stylesheet includes system-font fallbacks
- Data is stored in the browser's `localStorage`; it is not synchronized to a server or GitHub

## Project structure

```text
index.html       Application entry point
css/style.css    Layout, responsive styling, and typography
js/app.js        Screens, interactions, calculations, and localStorage handling
```

## Run locally

No build or install step is required:

1. Open the project folder in File Explorer or VS Code.
2. Open `index.html` in a browser.

For a local HTTP origin, use the VS Code Live Server extension if installed, or Python 3 if available:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000> in a browser and stop the server with Ctrl+C when finished. Browser storage is origin-specific, so data created under `http://localhost:8000` may differ from data created by opening the file directly or using another port.

## Data handling

BillNest uses the `billnest.prototype.v1` and `billnest.prototype.v1.backup` localStorage keys. Data remains in that browser profile and origin. The **Reset prototype data** action replaces the current data with demo data after saving a local backup; the Notifications screen offers a restore action while that backup exists. Clearing browser storage or changing browser/profile/origin can make the data unavailable.

## Basic validation

The JavaScript syntax can be checked with:

```powershell
node --check .\js\app.js
```

There is currently no automated test runner configured; application interactions should be checked in a browser.

BillNest is a local prototype. This repository does not claim that the application is deployed or hosted.
