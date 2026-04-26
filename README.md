# Placify AI — Placement Prediction Platform

AI-driven full-stack platform that analyzes a student's resume and competency scores to predict their target job role, company tier, and expected salary.

---

## Features

- **Resume Analysis** — PDF upload with NLTK-based skill extraction (tokenization, lemmatization, domain classification)
- **ML Predictions** — 3 Random Forest models: role classifier, company tier classifier, salary regressor
- **Results Dashboard** — Radar charts, tier probability bars, ATS score, skill gap analysis, CTC breakdown, interview tips
- **Auth System** — Email/password + Google OAuth + GitHub OAuth; JWT access tokens with rotating refresh token sessions stored in MongoDB
- **Theme** — Dark/light mode toggle with localStorage persistence
- **PDF Export** — One-click downloadable prediction report via jsPDF
- **Analysis History** — All past analyses stored per user in MongoDB

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Tailwind CSS |
| Charts | Recharts |
| HTTP | Axios (with JWT interceptor + silent refresh) |
| Backend | Python, FastAPI, Uvicorn |
| Database | MongoDB Atlas (PyMongo) |
| Auth | python-jose (JWT), bcrypt, httpx (OAuth) |
| ML / NLP | scikit-learn, pandas, numpy, joblib, NLTK, PyPDF2 |
| PDF | jsPDF |

---

## Project Structure

```
Placify-MP/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── assets/                 # Logo, images
│   │   ├── components/             # Navbar, LandingNavbar, ProtectedRoute, ui/
│   │   ├── context/                # AuthContext, ThemeContext
│   │   ├── pages/                  # Landing, Login, Register, Dashboard, Analyze, Results, OAuthCallback
│   │   └── utils/                  # api.js (Axios), pdfReport.js, authErrors.js
│   ├── .env                        # VITE_API_BASE_URL
│   └── tailwind.config.js
├── server/                         # FastAPI backend
│   ├── main.py                     # App entry, CORS, lifespan startup
│   ├── auth.py                     # Auth routes + JWT + OAuth (Google, GitHub)
│   ├── database.py                 # MongoDB singleton
│   ├── routes/
│   │   └── analysis.py             # POST /api/analysis, GET /api/analysis/history
│   ├── utils/
│   │   └── resume_parser.py        # NLTK PDF parsing pipeline
│   ├── ml/
│   │   ├── predictor.py            # Model inference + skill gap analysis
│   │   ├── train_model.py          # Model trainer
│   │   ├── generate_dataset.py     # Synthetic dataset generator
│   │   └── models/                 # Trained .joblib files (committed)
│   ├── requirements.txt
│   └── Procfile                    # Railway deployment start command
└── .gitignore
```

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)

### 1. Backend

```bash
cd server
pip install -r requirements.txt
```

Create `server/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/placify
PLACIFY_SECRET_KEY=your-secret-key-here
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Optional OAuth (leave blank to disable)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Start the server:

```bash
python main.py
# or with auto-reload:
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

The server starts on `http://localhost:5000`. On first run it downloads NLTK models automatically.

### 2. Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/refresh` | Rotate refresh token, return new access token |
| POST | `/api/auth/logout` | Revoke session |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/auth/oauth/{provider}/start` | Begin Google/GitHub OAuth flow |
| GET | `/api/auth/oauth/{provider}/callback` | OAuth callback handler |
| POST | `/api/analysis` | Upload PDF + scores → run prediction |
| GET | `/api/analysis/history` | User's analysis history |
| GET | `/api/analysis/{id}` | Single analysis result |
| GET | `/api/health` | Health check |

---

## ML Pipeline

1. Resume PDF → PyPDF2 text extraction → NLTK tokenization/lemmatization → skill keyword matching
2. Features: extracted skills + `aptitude_score`, `communication_score`, `coding_problems_solved`
3. Three Random Forest models trained on 5,000 synthetic student samples:
   - **Role classifier** → predicted job role + top alternatives
   - **Tier classifier** → company tier (FAANG / Product / Fintech / Service)
   - **Salary regressor** → CTC range with component breakdown
4. Output also includes: ATS score, domain scores, skill gaps, peer percentile, interview tips, target companies

---

## Deployment

**Frontend → Vercel**

1. Import repo on vercel.com, set root directory to `client`
2. Add env var: `VITE_API_BASE_URL=https://your-backend.up.railway.app/api`
3. Deploy

**Backend → Railway**

1. Import repo on railway.app, set root directory to `server`
2. Railway uses the `Procfile` automatically
3. Add environment variables (same as `.env` above, with production values)
4. Set `FRONTEND_URL` to your Vercel URL and `COOKIE_SECURE=true`

**OAuth redirect URIs** (update in Google Cloud Console / GitHub OAuth App):
```
https://your-backend.up.railway.app/api/auth/oauth/google/callback
https://your-backend.up.railway.app/api/auth/oauth/github/callback
```
