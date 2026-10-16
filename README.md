# UOP Computer Laboratory Usage Monitoring and Management System

Department of Information Technology, Faculty of Arts, University of Peradeniya.
Records, verifies and reports usage of the three IT computer laboratories (QR-based
usage form, record verification, equipment issues, dashboard, PDF records and monthly reports).

The original project brief is kept in [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md).

## Tech stack

React 19, TanStack Start / Router / Query, Tailwind CSS 4, Supabase (Postgres + Auth),
jsPDF for PDF output, Vite.

## Requirements

- Node.js 20 or newer (with npm)
- A free [Supabase](https://supabase.com) project (this is the database + login)

## Setup

1. **Create a Supabase project**, then open *SQL Editor*, paste the whole of
   `docs/database-setup.sql` and run it. This creates the tables, security rules,
   functions and synthetic sample data.
2. **Configure the app**: copy `.env.example` to `.env` and fill in your project URL and
   anon/publishable key (Supabase → Project Settings → API).
3. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:8080
4. **Create the first account** through the app's login page. The first user to register
   is made `admin` automatically; later users are plain staff.
   (In Supabase → Authentication → Providers → Email you may want to turn off
   "Confirm email" while testing, and set the Site URL / redirect URLs to your app address.)

## Production build

```bash
npm run build
npm run start
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm test` | Unit tests |
| `npm run lint` | Lint |

## Logo

The UOP logo is `src/assets/uop-logo.png`. Replace it with the official high-resolution
file supplied by the university (keep the same file name).
