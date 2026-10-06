import React, { useState } from 'react';
import './index.css';
import './App.css';
import ParticleBackground from './components/ParticleBackground';
import WelcomeLanding from './components/WelcomeLanding';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <div className="app-shell" style={{ position: 'relative', width: '100vw', minHeight: '100vh', backgroundColor: 'transparent' }}>
      {/* Fixed canvas layer behind everything */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
        <ParticleBackground />
      </div>

      {/* Foreground content layer */}
      <div className="app-foreground" style={{ position: 'relative', zIndex: 1, backgroundColor: 'transparent' }}>
        {showWelcome ? (
          <WelcomeLanding onEnterDashboard={() => setShowWelcome(false)} />
        ) : (
          <Dashboard onBackToWelcome={() => setShowWelcome(true)} />
        )}
      </div>
    </div>
  );
}
