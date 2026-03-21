# ⚡ Placify AI - Placement Prediction Platform

## 📌 Project Overview
Placify AI is an intelligent, full-stack web application designed to help students predict their placement outcomes based on their technical skills, aptitude, and resume strength. By leveraging **Machine Learning (ML)** and **Natural Language Processing (NLP)**, the precise platform analyzes a candidate's profile to predict their most suitable job role, expected company tier, and highly estimated salary range.

## 🚀 Key Features
- **Smart Resume Parsing**: Uses **NLTK** (Natural Language Toolkit) to extract text from PDF resumes, perform lemmatization, strip stopwords, and intelligently identify domain-specific skills (e.g. DSA, Web Dev, Cloud).
- **Machine Learning Pipeline**: Contains 3 robust **Random Forest** models trained on a custom highly-correlated synthetic dataset of 5,000 student samples. The models predict:
  - 🎯 **Target Job Role** (e.g., Software Developer, AI/ML Engineer, Data Analyst)
  - 🏢 **Company Tier Classification** (Top-Tier, Product-Based, Fintech, Service-Based)
  - 💰 **Expected Salary (CTC) Regression** with detailed realistic breakdowns (Base, HRA, ESOPs)
- **Comprehensive Results Dashboard**: Interactive radar charts and probability bars using **Recharts** to dynamically visualize domain strengths, target companies, and FAANG probability.
- **Skill Gap Analysis**: Actionable, color-coded feedback offering specific improvement recommendations depending on current vs target skill scores.
- **Secure Authentication**: Robust JWT-based authentication system storing users and analysis history securely using **FastAPI** and **SQLite3**.
- **Downloadable Reports**: One-click generation of beautifully formatted PDF prediction summaries directly from the UI using **jsPDF**.

## 🛠️ Technology Stack
- **Frontend**: React.js, Vite, React Router DOM, Recharts, jsPDF, React-Icons
- **Backend API**: Python, FastAPI, Uvicorn, SQLite3, PyJWT, passlib
- **Machine Learning & NLP**: Scikit-Learn, Pandas, NumPy, Joblib, NLTK (Tokenization, WordNetLemmatizer)
- **Styling**: Vanilla CSS (Premium Dark Glassmorphism Aesthetic)

## 📁 Project Architecture
```text
Placify-MP/
├── client/                 # React Frontend application
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI Components (Navbar, ProtectedRoute)
│       ├── context/        # Global React Context (AuthContext)
│       ├── pages/          # Main Views (Login, Register, Dashboard, Analyze, Results)
│       └── utils/          # Axios interceptors & jsPDF report generator
├── server/                 # Python FastAPI Backend application
│   ├── database.py         # SQLite connection and table initialization
│   ├── auth.py             # JWT dependencies and Auth endpoints
│   ├── main.py             # FastAPI entry point & CORS configuration
│   ├── routes/
│   │   └── analysis.py     # Main endpoint for PDF uploading and predictions
│   ├── utils/
│   │   └── resume_parser.py # NLTK AI parsing pipeline
│   └── ml/
│       ├── generate_dataset.py # Script generating 5,000 student rows
│       ├── train_model.py      # Random Forest model trainer logic
│       ├── predictor.py        # ML Model inference logic
│       └── dataset.csv         # The generated CSV dataset
└── README.md               # This documentation file
```

## ⚙️ How to Run Locally

### 1. Start the Backend API (FastAPI)
Ensure you have Python 3.14+ installed. Open a terminal and navigate to the `server` folder:
```bash
cd server
pip install -r requirements.txt
python main.py
# Optional auto-reload:
# set UVICORN_RELOAD=1 && python main.py
# OR: python -m uvicorn main:app --host 127.0.0.1 --port 5000
```
*Note: On the first run, the backend will automatically generate the `placify.db` SQLite database and download the required NLTK language models.*

### 2. Start the Frontend (Vite + React)
Ensure you have Node.js installed. Open a completely separate terminal and navigate to the `client` folder:
```bash
cd client
npm install
npm run dev
```
*If PowerShell blocks `npm`, use `npm.cmd run dev` instead.*

### 3. Access the Application
The frontend development server will spin up on your local machine. Open your browser and navigate to:
👉 **[http://localhost:5173/](http://localhost:5173/)**
