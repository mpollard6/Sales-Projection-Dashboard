# Harbinger Marketing — Sales Pipeline Dashboard

A web dashboard for Harbinger Marketing sales reps to view their pipeline, forecasts, commissions, and performance metrics.

## Features
- **My Pipeline** — Open deals, 30/60-day weighted revenue forecasts
- **Scoreboard** — All-rep comparison with revenue charts and leaderboard
- **Prediction Tracker** — See how deal confidence changed over time
- **Predicted vs Actual** — Compare forecasted vs real close values
- **Commission Forecast** — Projected commissions with adjustable close rate slider (warm 2.5%, cold 3.5%)
- **Per-rep login** — Each rep sees only their own data

## Default Login
All reps use password: `harbinger2025`

## Deploy to Vercel (No Code Required)

1. Go to github.com and create a new repository called `harbinger-dashboard`
2. Upload all these files to that repository
3. Go to vercel.com and sign in with your GitHub account
4. Click "New Project" and select the `harbinger-dashboard` repository
5. Click "Deploy" — Vercel handles everything automatically
6. Your dashboard will be live at a URL like `harbinger-dashboard.vercel.app`

## Tech Stack
- Next.js 14 (React framework)
- Tailwind CSS (styling)
- Recharts (charts)
- Static data from pipeline spreadsheet (no database needed)
