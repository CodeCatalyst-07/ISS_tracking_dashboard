# ⚡ ANTIGRAVITY DASHBOARD

> 🚀 **Live Demo:** [iss-tracking-dashboard.vercel.app](https://iss-tracking-dashboard.vercel.app)

A real-time space dashboard featuring ISS live tracking, breaking news, AI chatbot, and data visualizations.

## Features
- 🛸 **Live ISS tracking** with interactive Leaflet map (updates every 16s)
- 👨‍🚀 **Real-time astronaut data** with offline fallback
- 📰 **Live news** from multiple sources (cascade fallback system)
- 🤖 **AI chatbot** powered by Mistral-7B — answers only from live dashboard data
- 📊 **ISS speed line chart** + **news distribution doughnut chart**
- 🌙 **Dark/Light mode** with localStorage persistence
- 🔔 **Toast notifications** + shimmer skeleton loaders

## Tech Stack
- **React + Vite** — frontend framework
- **Tailwind CSS** — styling
- **Leaflet.js + react-leaflet** — interactive maps
- **Chart.js + react-chartjs-2** — data charts
- **HuggingFace Mistral-7B** — AI chatbot

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/CodeCatalyst-07/ISS_tracking_dashboard.git
cd ISS_tracking_dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create your `.env` file
```bash
cp .env.example .env
```
Then fill in your API keys in `.env`

### 4. Get free API keys

| Key | Service | Free Tier |
|-----|---------|-----------|
| `VITE_NEWS_API_KEY` | [NewsAPI](https://newsapi.org/register) | 100 req/day |
| `VITE_GNEWS_KEY` | [GNews](https://gnews.io) | 500 req/day |
| `VITE_GUARDIAN_KEY` | [The Guardian](https://open-platform.theguardian.com/access/) | Unlimited |
| `VITE_AI_TOKEN` | [HuggingFace](https://huggingface.co/settings/tokens) | Free tier |

### 5. Run the app
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## APIs Used

| Data | Endpoint |
|------|----------|
| ISS Position | `https://api.wheretheiss.at/v1/satellites/25544` |
| Astronauts | `https://api.open-notify.org/astros.json` (via CORS proxy) |
| Breaking News | `https://eventregistry.org` |
| Top Headlines | NewsAPI → GNews → The Guardian (cascade fallback) |
| AI Model | `mistralai/Mistral-7B-Instruct-v0.2` via HuggingFace |

## Project Structure
```
src/
  components/
    Header.jsx          # Logo, theme toggle, nav tabs
    ISSTracker.jsx      # Map + stats panel
    AstronautPanel.jsx  # People in space
    NewsGrid.jsx        # News articles grid
    ChatBot.jsx         # Floating AI chatbot
    SpeedChart.jsx      # ISS speed line chart
    NewsChart.jsx       # News category doughnut chart
    ToastNotification.jsx
    SkeletonLoader.jsx
  hooks/
    useISS.js           # ISS polling with retry/fallback
    useNews.js          # News fetch with cascade fallback
  utils/
    api.js              # safeFetch with CORS proxy fallback
    haversine.js        # Speed calculation utility
    geocode.js          # Reverse geocoding with cache
  App.jsx
  main.jsx
  index.css
```

## Environment Variables

See `.env.example` for all required keys with registration links.

---
Built for FOAI End Sem Project · [ISS Tracker](https://api.wheretheiss.at) · [React](https://react.dev) · [Vite](https://vitejs.dev)
