import React from 'react';
import { 
  Leaf, 
  ShieldAlert, 
  Truck, 
  Cpu, 
  ArrowRight, 
  FileCheck 
} from 'lucide-react';

const WelcomeLanding = ({ onEnterDashboard }) => {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HERO BANNER SECTION */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 40px 24px', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          backgroundColor: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid #10b981', 
          padding: '6px 16px', 
          borderRadius: '20px', 
          color: '#34d399', 
          fontSize: '13px', 
          fontWeight: '600',
          marginBottom: '20px'
        }}>
          <Leaf size={16} /> Universal Materials Intelligence & Climate Resilience Platform
        </div>

        <h1 style={{ 
          fontSize: '42px', 
          fontWeight: '800', 
          color: '#ffffff', 
          lineHeight: '1.2', 
          margin: '0 0 16px 0',
          letterSpacing: '-0.5px'
        }}>
          Dynamic 100-Year Life Cycle Assessment for <br />
          <span style={{ color: '#34d399' }}>Sustainable Civil Engineering</span>
        </h1>

        <p style={{ 
          fontSize: '16px', 
          color: '#94a3b8', 
          maxWidth: '780px', 
          margin: '0 auto 32px auto', 
          lineHeight: '1.6' 
        }}>
          Project Vardan is an EN 15978 and ISO 21930 compliant LCA platform that quantifies, simulates, and optimizes the carbon footprint of construction materials and whole buildings under 100-year dynamic climate stress.
        </p>

        {/* LAUNCH DASHBOARD BUTTON */}
        <button
          onClick={onEnterDashboard}
          style={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            padding: '16px 36px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
            transition: 'transform 0.2s ease, background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          Launch Vardan Intelligence Engine <ArrowRight size={20} />
        </button>

        {/* STANDARDS BADGES */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '36px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={16} color="#34d399" /> ICE V5 Benchmark (259+ Materials)
          </span>
          <span style={{ fontSize: '12px', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={16} color="#34d399" /> EN 15978 Structural Standard
          </span>
          <span style={{ fontSize: '12px', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={16} color="#34d399" /> ISO 21930 Sustainability Metric
          </span>
        </div>
      </section>

      {/* PROBLEM / MOTIVATION CARDS */}
      <section style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#34d399', textAlign: 'center', marginBottom: '8px' }}>
          Why Was Project Vardan Created?
        </h2>
        <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', marginBottom: '32px' }}>
          Traditional Life Cycle Assessment tools rely on static spreadsheets that fail to capture real-world environmental stress.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          <div className="bio-panel" style={{ padding: '24px' }}>
            <div style={{ backgroundColor: 'rgba(248, 113, 113, 0.1)', padding: '10px', borderRadius: '10px', width: 'fit-content', marginBottom: '16px' }}>
              <ShieldAlert color="#f87171" size={24} />
            </div>
            <h3 style={{ fontSize: '18px', color: '#ffffff', margin: '0 0 8px 0' }}>The Static Spreadsheet Trap</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.6' }}>
              Legacy LCA platforms evaluate embodied carbon as a fixed number from static EPD spreadsheets, ignoring 100-year decay curves and climate penalties.
            </p>
          </div>

          <div className="bio-panel" style={{ padding: '24px' }}>
            <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '10px', borderRadius: '10px', width: 'fit-content', marginBottom: '16px' }}>
              <Truck color="#34d399" size={24} />
            </div>
            <h3 style={{ fontSize: '18px', color: '#ffffff', margin: '0 0 8px 0' }}>The Stage A4 Transit Blind Spot</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.6' }}>
              Freight logistics alter sustainability rankings. Vardan dynamically calculates transit distance (0–400 km) and vehicle emissions in real-time.
            </p>
          </div>

          <div className="bio-panel" style={{ padding: '24px' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', width: 'fit-content', marginBottom: '16px' }}>
              <Cpu color="#10b981" size={24} />
            </div>
            <h3 style={{ fontSize: '18px', color: '#ffffff', margin: '0 0 8px 0' }}>Black-Box AI Confusion</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.6' }}>
              Instead of unverified black-box scores, Vardan integrates a Decision Tree Whitebox Model to explain why green alternatives outperform conventional options.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

export default WelcomeLanding;