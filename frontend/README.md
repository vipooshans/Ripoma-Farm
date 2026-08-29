# RIPOMA Farm — Frontend

Shop organic free-range chicken, pasture eggs, and solar-dried fish from **RIPOMA Farm**. This app is the customer storefront and admin dashboard for the farm-to-table experience.

---

## Technology used

| Layer | Technology |
| --- | --- |
| UI library | **React 19** |
| Build tool | **Vite 8** |
| Styling | **Tailwind CSS 4** (`@tailwindcss/vite`) |
| Routing | **React Router DOM 7** |
| HTTP client | **Axios** |
| Motion | **Framer Motion** |
| Icons | **Lucide React** |
| Charts | **Recharts** |
| Lint | **ESLint 10** |
| Fonts | Inter, Manrope, Fraunces, Caveat (Google Fonts) |
| Auth (client) | Google Identity Services |

The frontend talks to the Express API at `http://localhost:5000` through Vite’s `/api` proxy (dev server on **port 3000**).

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
| --- | --- |
| `npm run dev` | Start Vite with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

<details>
<summary>More detail (setup, routes, stack notes)</summary>

### What this app covers

- **Storefront** — home, catalog, product details, cart, checkout, about, contact, profile
- **Admin** — dashboard under `/admin/*` (orders, inventory, products, workers, financials, and more)

### How the pieces fit

```
Browser (React + Vite :3000)
        │  /api  proxy
        ▼
Express API (:5000)  →  MongoDB (or JSON fallback)
```

### Vite plugins in this project

- [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react) — React Fast Refresh via Oxc
- [`@tailwindcss/vite`](https://tailwindcss.com) — Tailwind CSS 4

### Notes

- Keep the **backend** running on port 5000 so catalog, cart, and checkout can load data.
- From the repo root you can start both sides with `npm run dev` (uses `concurrently`).

</details>
