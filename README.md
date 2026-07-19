# Sprint 1 — Project Foundation

A production-ready Next.js 16 project foundation.

## Tech Stack

- **Next.js 16** with App Router + Turbopack
- **TypeScript** (strict mode)
- **Tailwind CSS v4** with CSS variables
- **shadcn/ui** components
- **next-themes** for dark mode
- **lucide-react** icons

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env example
cp .env.example .env.local

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Folder Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (ThemeProvider, fonts)
│   ├── page.tsx                # Landing page
│   ├── not-found.tsx           # 404
│   └── dashboard/
│       ├── layout.tsx          # Dashboard shell (Sidebar + Navbar)
│       ├── page.tsx            # Dashboard overview
│       ├── analytics/page.tsx
│       ├── users/page.tsx
│       ├── reports/page.tsx
│       ├── notifications/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── separator.tsx
│   │   └── sheet.tsx
│   ├── layout/
│   │   ├── navbar.tsx          # Top bar with mobile menu trigger
│   │   ├── sidebar.tsx         # Desktop sidebar
│   │   └── mobile-sidebar.tsx  # Sheet-based mobile drawer
│   ├── providers/
│   │   └── theme-provider.tsx
│   └── theme-toggle.tsx        # Light/Dark toggle button
└── lib/
    ├── utils.ts                # cn() helper
    └── constants.ts            # APP_NAME, NAV_ITEMS
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## What's Next (Sprint 2)

- Authentication (NextAuth / Clerk)
- Real data / database (Prisma + Postgres)
- Charts and analytics (Recharts / Chart.js)
- Full CRUD pages
