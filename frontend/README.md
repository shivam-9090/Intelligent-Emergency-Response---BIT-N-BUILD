# Frontend — Intelligent Emergency Response Platform

React + TypeScript application, built with Vite and styled with Tailwind CSS.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Scripts

- `npm run dev` — start the development server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run the linter

## Structure

- `src/` — application source
- `src/main.tsx` — entry point
- `src/App.tsx` — root component
- `public/` — static assets served as-is

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API |
