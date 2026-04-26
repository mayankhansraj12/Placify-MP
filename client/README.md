# Placify AI — Frontend

React + Vite frontend for the Placify AI placement prediction platform.

## Stack

- **React 18** with React Router v6
- **Vite** (dev server + build)
- **Tailwind CSS** with dark/light mode (`darkMode: 'class'`)
- **Recharts** for radar and bar charts
- **Axios** with JWT interceptor and silent token refresh
- **Lucide React** for icons
- **jsPDF** for PDF report generation

## Setup

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

```bash
npm run dev       # dev server on http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

## Key Directories

```
src/
├── assets/           # logo.png
├── components/       # Navbar, LandingNavbar, ProtectedRoute, PublicOnlyRoute, ui/
├── context/          # AuthContext.jsx, ThemeContext.jsx
├── pages/            # Landing, Login, Register, Dashboard, Analyze, Results, OAuthCallback
└── utils/            # api.js, pdfReport.js, authErrors.js
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `https://your-backend.up.railway.app/api`) |

## Theme

Theme preference persists in `localStorage` under key `placify-theme`. The `.dark` class is toggled on `<html>` — all dark mode styles use Tailwind's `dark:` prefix.

## Auth Flow

- Email/password login → JWT access token stored in `localStorage` + httpOnly refresh token cookie
- Google / GitHub OAuth → backend redirect → `/auth/callback` → silent `/auth/refresh`
- Axios interceptor auto-refreshes expired access tokens transparently
