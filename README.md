<h1 align="center">🩸 BloodSense</h1>

---

<h3 align="center">AI-Powered Blood Report Analyzer</h3>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js" alt="Next.js"/></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-REST_API-black?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-DATABASE-3178C6?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/></a>
  <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Google_Gemini-AI-F4B400?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"/></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-AUTH-black?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-UI-0ea5e9?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/></a>
</p>

---

<p align="center">
  <em>A full-stack web application that transforms raw blood test reports into actionable health insights using advanced AI extraction and clinical reference ranges.</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#deployment">Deployment</a>
</p>

---

<h2 id="features">✨ Features</h2>

| Feature | Description |
|:---|:---|
| 📄 **Smart Extraction** | Upload a PDF or image — Gemini Vision automatically reads and extracts biomarker values |
| 🏷️ **Deterministic Classification** | Each biomarker is classified as **Normal**, **Borderline**, **High**, or **Critical** using clinically-sourced reference ranges |
| 💬 **Plain-English Explanations** | Gemini 2.5 Flash generates patient-friendly explanations for every result |
| 📈 **Historical Trends** | Track biomarker changes over time with interactive Recharts visualizations |
| 🔐 **Secure Auth** | User authentication and row-level security powered by Supabase Auth |
| 📱 **Responsive Design** | Fully responsive UI built with Tailwind CSS — works on desktop, tablet, and mobile |

---

<h2 id="tech-stack">🛠️ Tech Stack</h2>

<table>
  <tr>
    <td align="center" width="140"><strong>Frontend</strong></td>
    <td>Next.js 15 &nbsp;•&nbsp; TypeScript &nbsp;•&nbsp; Tailwind CSS &nbsp;•&nbsp; Recharts</td>
  </tr>
  <tr>
    <td align="center"><strong>Backend</strong></td>
    <td>FastAPI &nbsp;•&nbsp; Python 3.12 &nbsp;•&nbsp; Pydantic v2</td>
  </tr>
  <tr>
    <td align="center"><strong>Database</strong></td>
    <td>PostgreSQL via Supabase</td>
  </tr>
  <tr>
    <td align="center"><strong>Auth & Storage</strong></td>
    <td>Supabase Auth &nbsp;•&nbsp; Supabase Storage</td>
  </tr>
  <tr>
    <td align="center"><strong>AI</strong></td>
    <td>Google Gemini 2.5 Flash (Vision + Text)</td>
  </tr>
  <tr>
    <td align="center"><strong>Deployment</strong></td>
    <td>Vercel (frontend) &nbsp;•&nbsp; Render (backend)</td>
  </tr>
</table>

---

<h2 id="project-structure">📁 Project Structure</h2>

```
bloodsense/
│
├── frontend/                 # Next.js 15 application
│   ├── app/                  # App Router — pages & layouts
│   │   ├── auth/             # Login / signup flows
│   │   └── dashboard/        # Main dashboard UI
│   ├── components/           # Reusable React components
│   ├── lib/                  # API client, types, Supabase helpers
│   └── public/               # Static assets
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/              # Route handlers (reports, trends, user)
│   │   ├── services/         # Extraction, analysis, explanation logic
│   │   ├── data/             # Reference ranges (JSON)
│   │   ├── schemas.py        # Pydantic models
│   │   ├── database.py       # Supabase client
│   │   └── main.py           # App entry point
│   └── migrations/           # SQL schema & policies
│
└── README.md
```

---

<h2 id="getting-started">🚀 Getting Started</h2>

### Prerequisites

- **Node.js** ≥ 18 &nbsp;&nbsp;|&nbsp;&nbsp; **Python** ≥ 3.12
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google Gemini API key](https://aistudio.google.com) (free tier works)

---

### 1️⃣ &nbsp; Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and run:
   ```
   backend/migrations/001_initial.sql
   ```
3. Create a **Storage bucket** named `reports` (set to **private**)
4. Apply the storage policies from the comments at the bottom of the SQL file

---

### 2️⃣ &nbsp; Backend

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate              # Windows
# source venv/bin/activate         # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# ✏️  Fill in your Supabase & Gemini credentials in .env

# Start the server
uvicorn app.main:app --reload --port 8000
```

> **💡 Windows — Tesseract OCR** *(optional fallback for scanned PDFs)*
>
> Download from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) and set in your `.env`:
> ```
> TESSERACT_CMD=C:/Program Files/Tesseract-OCR/tesseract.exe
> ```

---

### 3️⃣ &nbsp; Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# ✏️  Fill in your Supabase & API URL in .env.local

# Start dev server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

<h2 id="api-reference">📡 API Reference</h2>

All endpoints are prefixed with `/api/v1`. Interactive Swagger docs are available at [`/docs`](http://localhost:8000/docs).

### Reports

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/reports/upload` | Upload a blood test report (PDF / image) |
| `GET` | `/reports` | List all reports for the authenticated user |
| `GET` | `/reports/{id}` | Get a single report with extracted biomarkers |
| `DELETE` | `/reports/{id}` | Delete a report |
| `PATCH` | `/reports/{id}/biomarkers/{bid}` | Edit a biomarker value |

### Trends

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/trends` | Get trend data for all biomarkers |
| `GET` | `/trends/{biomarker}` | Get trend data for a specific biomarker |

### User

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/user/me` | Get the current user's profile |
| `POST` | `/user/me` | Create a user profile |
| `PATCH` | `/user/me` | Update the user's profile |

---

<h2 id="deployment">🌐 Deployment</h2>

### 🟢 Live Demo
The frontend is currently deployed and live on Vercel at:
**[https://bloodsense.vercel.app](https://bloodsense.vercel.app)**

*(Note: If your Vercel project generated a slightly different URL with a suffix, please update this link accordingly).*

---

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`) in the **Vercel dashboard**.

### Backend → Render

1. Push the `backend/` directory to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set environment variables in the Render dashboard
4. Use `render.yaml` for auto-configuration

> **⚠️ Note:** Render's free tier has ~50s cold starts. The frontend handles this gracefully with a loading state.

---

## ⚠️ Medical Disclaimer

> **This application is for educational and health-literacy purposes only.**
>
> BloodSense does **not**:
> - Diagnose diseases or medical conditions
> - Recommend medications or treatments
> - Replace consultation with a qualified healthcare professional
>
> **Always consult a licensed physician for medical advice.**

---

<p align="center">
  Built with ❤️ using Google Gemini, Next.js, FastAPI & Supabase
</p>

