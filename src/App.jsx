import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ISSTracker from './components/ISSTracker';
import AstronautPanel from './components/AstronautPanel';
import NewsGrid from './components/NewsGrid';
import ChatBot from './components/ChatBot';
import SpeedChart from './components/SpeedChart';
import NewsChart from './components/NewsChart';
import ToastNotification from './components/ToastNotification';
import { useISS } from './hooks/useISS';
import { useNews } from './hooks/useNews';

let toastIdCounter = 0;

export default function App() {
  // ── Theme ────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch { return 'dark'; }
  });

  // ── Toasts ───────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Theme persistence ────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // ── Data hooks — pass addToast so hooks can fire toasts ──────────────
  const issData = useISS(addToast);
  const newsData = useNews(addToast);

  // ── Category bridge (chart → news grid + scroll) ─────────────────────
  const handleSetCategory = useCallback((cat) => {
    newsData.setSelectedCategory(cat);
    setTimeout(() => {
      document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [newsData]);

  // ── Active section tracking for nav highlight ─────────────────────────
  const [activeSection, setActiveSection] = useState('iss-tracker');

  useEffect(() => {
    const sections = ['iss-tracker', 'news', 'charts'];
    const observers = sections.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.25 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, []);

  return (
    <div
      className="relative min-h-screen"
      data-theme={theme}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Background grid overlay */}
      <div className="app-bg" />

      {/* Header */}
      <Header theme={theme} toggleTheme={toggleTheme} activeSection={activeSection} />

      <main className="relative z-10 pt-20 pb-16">
        {/* ── ISS TRACKER ─────────────────────────────────────────── */}
        <section id="iss-tracker" className="px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <div
                className="w-1 h-8 rounded-full"
                style={{ background: 'linear-gradient(to bottom, #00D4FF, #7C3AED)' }}
              />
              <h1 className="section-title text-base">INTERNATIONAL SPACE STATION TRACKER</h1>
            </div>

            <ISSTracker issData={issData} addToast={addToast} />

            <AstronautPanel
              astronauts={issData.astronauts}
              count={issData.astronautCount}
              loading={issData.loading && issData.astronauts.length === 0}
              isCachedCrew={issData.isCachedCrew}
            />
          </div>
        </section>

        {/* ── NEWS ─────────────────────────────────────────────────── */}
        <section id="news" className="px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <div
                className="w-1 h-8 rounded-full"
                style={{ background: 'linear-gradient(to bottom, #F59E0B, #F43F5E)' }}
              />
              <h2 className="section-title text-base">LIVE NEWS DASHBOARD</h2>
            </div>

            <NewsGrid
              newsData={newsData}
              selectedCategory={newsData.selectedCategory}
              setSelectedCategory={newsData.setSelectedCategory}
            />
          </div>
        </section>

        {/* ── CHARTS ───────────────────────────────────────────────── */}
        <section id="charts" className="px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <div
                className="w-1 h-8 rounded-full"
                style={{ background: 'linear-gradient(to bottom, #7C3AED, #00D4FF)' }}
              />
              <h2 className="section-title text-base">DATA VISUALIZATIONS</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <SpeedChart
                  speedHistory={issData.speedHistory}
                  currentSpeed={issData.speed}
                />
              </div>
              <div className="lg:col-span-2">
                <NewsChart
                  articles={newsData.articles}
                  setSelectedCategory={handleSetCategory}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-6 text-center">
          <p className="text-xs font-space-grotesk" style={{ color: 'rgba(100,116,139,0.5)' }}>
            ⚡ ANTIGRAVITY DASHBOARD · ISS: wheretheiss.at · News: EventRegistry + NewsAPI/GNews/Guardian ·
            AI: Mistral-7B · Built with React + Vite
          </p>
        </footer>
      </main>

      {/* Floating chatbot */}
      <ChatBot
        issData={issData}
        articles={newsData.articles}
        addToast={addToast}
      />

      {/* Toast stack */}
      <ToastNotification toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
