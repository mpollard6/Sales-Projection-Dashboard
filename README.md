# Harbinger Marketing — Sales Pipeline Dashboard v2

## Features
- **Login**: Per-rep login (sees only their data) + Admin login (sees everything)
- **My Pipeline / Full Pipeline**: Open deals with months-open badges, sortable, filterable
- **Rep Scoreboard**: Leaderboard with year/month/quarter filters
- **Admin Deep Dive**: Select any rep and see their full pipeline, opens, and closes
- **Prediction Tracker**: How deal confidence changed over time (charts + tables)
- **Predicted vs Actual**: Compare forecasted vs real close values
- **Commission Forecast**: Projected commissions with close-rate slider + "What if I close this deal" checkboxes
  - Warm leads: 2.5% commission
  - Cold leads: 3.5% commission
  - Brave Digital: 3.5% commission
  - Onboarding, one-time, and ongoing fees all shown for partnership deals

## Logins
- **Sales Reps**: Select name, password = `harbinger2025`
- **Admin**: Select "Admin", password = `harbingeradmin`

## Deploy to Vercel

1. Create a new repository on github.com called `harbinger-dashboard`
2. Upload all files from this folder to that repository
3. Go to vercel.com, sign in with GitHub
4. Click "Add New Project", select the repository
5. Click "Deploy"
6. Live at your-project.vercel.app

## Data
All data is pre-loaded from the Harbinger pipeline spreadsheets (Jan 2025 — Mar 2026).
Includes 186 assessment deals, 122 partnership deals, 1,120 prediction snapshots.
75 confirmed assessment closes and 51 confirmed partnership closes with actual values.
