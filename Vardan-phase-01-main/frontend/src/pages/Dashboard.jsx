import React, { useState } from 'react';
import {
  Leaf, Info, X, Building2, FlaskConical, ShieldCheck,
  CheckCircle2, Sparkles, Truck, Wind, BookOpen, ExternalLink
} from 'lucide-react';
import SingleMaterialLCA from '../components/SingleMaterialLCA.jsx';
import WholeBuildingLCA from '../components/WholeBuildingLCA.jsx';
import '../components/Dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('material'); // 'material' | 'building'
  const [guideDrawerOpen, setGuideDrawerOpen] = useState(false);

  return (
    <div className="dashboard dashboard-container">
      {/* ════════════ HEADER ════════════ */}
      <header className="main-header">
        <div className="header-left">
          <div className="brand-logo-wrap">
            <Leaf size={24} className="brand-icon" />
          </div>
          <div className="brand-text-block">
            <div className="brand-title-row">
              <h1 className="brand-title">Project Vardan</h1>
              <span className="platform-tag">Phase 1 Live</span>
            </div>
            <p className="brand-subtitle">
              Universal Materials Intelligence & Climate Resilience Platform
            </p>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="header-compliance-badges">
          <div className="compliance-badge" title="Inventory of Carbon and Energy Version 5.0">
            <ShieldCheck size={13} className="text-emerald" />
            <span>ICE V5 Benchmark</span>
          </div>
          <div className="compliance-badge" title="European Standard for Sustainability of Construction Works">
            <CheckCircle2 size={13} className="text-sky" />
            <span>EN 15978 Compliant</span>
          </div>
          <div className="compliance-badge" title="Core Rules for Environmental Product Declarations">
            <CheckCircle2 size={13} className="text-indigo" />
            <span>ISO 21930 Standards</span>
          </div>
        </div>

        <div className="header-right">
          <div className="api-status-pill">
            <span className="status-live-dot" />
            <span>API Engine Live</span>
          </div>
          <button
            type="button"
            className="guide-drawer-btn"
            onClick={() => setGuideDrawerOpen(true)}
            title="Read Plain English Guide & Documentation"
          >
            <BookOpen size={16} />
            <span>Info & Guide</span>
          </button>
        </div>
      </header>

      {/* ════════════ MODE SWITCHER TABS ════════════ */}
      <div className="mode-switcher-container">
        <div className="mode-tabs-wrapper">
          <button
            type="button"
            className={`mode-tab-btn ${activeTab === 'material' ? 'active' : ''}`}
            onClick={() => setActiveTab('material')}
          >
            <FlaskConical size={16} />
            <span>1. Material LCA & Green Alternatives</span>
          </button>
          <button
            type="button"
            className={`mode-tab-btn ${activeTab === 'building' ? 'active' : ''}`}
            onClick={() => setActiveTab('building')}
          >
            <Building2 size={16} />
            <span>2. Whole Building LCA (Substructure, Superstructure, Facade, Roofing)</span>
          </button>
        </div>
      </div>

      {/* ════════════ MAIN CONTENT VIEW ════════════ */}
      <main className="dashboard-content-area">
        {activeTab === 'material' ? (
          <SingleMaterialLCA />
        ) : (
          <WholeBuildingLCA />
        )}
      </main>

      {/* ════════════ INFO & GUIDE SLIDE-OVER DRAWER ════════════ */}
      {guideDrawerOpen && (
        <div className="drawer-backdrop" onClick={() => setGuideDrawerOpen(false)}>
          <aside className="guide-drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-top-bar">
              <div className="drawer-title-group">
                <BookOpen size={20} className="text-emerald" />
                <h2>Platform Guide & LCA Standards</h2>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setGuideDrawerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-scroll-content">
              {/* Introduction */}
              <div className="guide-section">
                <h3>🌿 What is Project Vardan?</h3>
                <p>
                  <strong>Project Vardan</strong> is a next-generation civil engineering intelligence system
                  that calculates both immediate embodied carbon and <strong>100-year operational climate resilience</strong> for construction materials and whole structures.
                </p>
                <p>
                  Unlike static calculators that only look at factory gate emissions, Vardan accounts for
                  logistics freight, regional weather calamities, rising sea levels, and material degradation over a century.
                </p>
              </div>

              {/* The 4 LCA Stages */}
              <div className="guide-section">
                <h3>🏗️ Life Cycle Assessment (LCA) Stages Explained</h3>
                
                <div className="guide-card-step">
                  <div className="step-tag a1a3">Stage A1–A3 (Product Stage)</div>
                  <h4>Cradle-to-Gate Embodied Carbon</h4>
                  <p>
                    Raw material extraction, processing, and manufacturing emissions before leaving the factory gate.
                    Sourced directly from the validated <strong>ICE V5 (Inventory of Carbon & Energy)</strong> benchmark covering 259+ materials.
                  </p>
                </div>

                <div className="guide-card-step">
                  <div className="step-tag a4">Stage A4 (Construction Stage — Logistics)</div>
                  <h4>Logistics Transit Emissions</h4>
                  <p>
                    Emissions produced by transporting cargo from the production facility to the jobsite.
                    Calculated dynamically based on vehicle curb weight, total payload, transit distance, and vehicle fuel/electric rates.
                  </p>
                </div>

                <div className="guide-card-step">
                  <div className="step-tag b1b7">Stage B1–B7 (Use Stage — Dynamic Calamity)</div>
                  <h4>100-Year Climate Degradation Penalty</h4>
                  <p>
                    Trained Random Forest machine learning model predicts additional carbon required for repairs,
                    structural maintenance, and weather wear under future climate scenarios (extreme storms, temperature anomalies, and sea level rise).
                  </p>
                </div>

                <div className="guide-card-step">
                  <div className="step-tag c1c4">Stage C1–C4 (End-of-Life Stage)</div>
                  <h4>Deconstruction & Circular Recovery</h4>
                  <p>
                    Deconstruction, site demolition, waste sorting, and circular recycling or landfill allocation.
                  </p>
                </div>
              </div>

              {/* Green Alternatives & XAI */}
              <div className="guide-section">
                <h3>💡 How Green Alternatives & XAI Work</h3>
                <p>
                  When you select any construction material, the platform scans for domain-matched low-carbon and carbon-negative substitutes (e.g., Pozzolanic SCMs, LC3 cements, Hempcrete, Cross-Laminated Timber).
                </p>
                <p>
                  Selecting an alternative automatically triggers the <strong>Whitebox Decision Tree (XAI)</strong> engine.
                  Because it is a transparent, explainable model with maximum tree depth of 3, you get clear natural-language explanations proving *why* the green alternative outperforms standard materials according to embodied carbon thresholds and biogenic storage.
                </p>
              </div>

              {/* Whole Building Mode */}
              <div className="guide-section">
                <h3>🏢 Whole Building LCA Mode</h3>
                <p>
                  Switch to Mode 2 to evaluate an entire building across its 4 primary assemblies:
                </p>
                <ul className="guide-list">
                  <li><strong>Substructure:</strong> Foundation footings, basement grade slabs, and subterranean moisture barriers.</li>
                  <li><strong>Superstructure:</strong> Primary load-bearing columns, girders, beams, and floor slabs.</li>
                  <li><strong>Facade:</strong> Exterior walls, cladding, architectural masonry, and glazing systems.</li>
                  <li><strong>Roofing & Insulation:</strong> Thermal acoustic insulation layers and waterproof decking.</li>
                </ul>
                <p>
                  Toggle between <strong>25, 50, and 100-year horizons</strong> to observe how upfront carbon savings compound into massive tonnage reductions over the lifespan of the facility.
                </p>
              </div>
            </div>

            <div className="drawer-footer">
              <span className="footer-doc-note">
                Complies with EN 15978 / ISO 21930 Standards · ICE V5 Verified
              </span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
