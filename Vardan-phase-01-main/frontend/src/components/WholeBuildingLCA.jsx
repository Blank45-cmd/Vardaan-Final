import React, { useState } from 'react';
import { Building2, Layers, ShieldCheck, Zap, ArrowRight, ChevronRight, CheckCircle2 } from 'lucide-react';

const BUILDING_ZONES = [
  {
    id: 'roofing',
    title: 'Zone 1: Roofing & Thermal Deck',
    share: '12.4%',
    driver: 'Polyisocyanurate Insulation & Membrane Decay',
    substitute: 'Bio-based Polyurethane & Green Vegetative Roof Deck',
    color: '#34d399'
  },
  {
    id: 'facade',
    title: 'Zone 2: Facade & Envelope',
    share: '24.8%',
    driver: 'Aluminum Curtain Walls & Double Glazing Framing',
    substitute: 'Mass Timber Cladding & Low-E Vacuum Glass Units',
    color: '#38bdf8'
  },
  {
    id: 'superstructure',
    title: 'Zone 3: Superstructure & Framing',
    share: '42.1%',
    driver: 'Heavy Reinforced Portland Concrete Columns & Slabs',
    substitute: 'Cross-Laminated Timber (CLT) & 70% GGBS Concrete',
    color: '#a78bfa'
  },
  {
    id: 'substructure',
    title: 'Zone 4: Substructure & Foundation',
    share: '20.7%',
    driver: 'Deep Piling & Sub-grade Footings Carbon Footprint',
    substitute: 'LC3 (Limestone Calcined Clay Cement) Piles',
    color: '#fbbf24'
  }
];

export default function WholeBuildingLCA() {
  const [activeZone, setActiveZone] = useState('superstructure');
  const [horizon, setHorizon] = useState(100);

  const selectedData = BUILDING_ZONES.find(z => z.id === activeZone) || BUILDING_ZONES[2];

  return (
    <div style={{ padding: '24px', color: '#f8fafc', minHeight: '80vh' }}>
      
      {/* SECTION HEADER & HORIZON SWITCHER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="#34d399" /> Whole Building Life Cycle Assessment
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Interactive 2D structural diagram tracking century-long carbon tonnage across building assemblies.
          </p>
        </div>

        {/* TIME HORIZON TOGGLE */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(2, 9, 7, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          {[25, 50, 100].map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              style={{
                background: horizon === h ? '#10b981' : 'transparent',
                color: horizon === h ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {h} Years
            </button>
          ))}
        </div>
      </div>

      {/* 2-COLUMN MAIN CONTENT */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: SVG INTERACTIVE BUILDING */}
        <div className="bio-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '13px', color: '#34d399', textTransform: 'uppercase', marginBottom: '16px' }}>
            Click Building Zone to Filter
          </h3>

          <svg viewBox="0 0 200 320" style={{ width: '100%', maxHeight: '300px', cursor: 'pointer' }}>
            {/* Zone 1: Roofing */}
            <path
              d="M20 70 L100 20 L180 70 Z"
              fill={activeZone === 'roofing' ? '#34d399' : '#0a2218'}
              stroke="#34d399"
              strokeWidth="2"
              opacity={activeZone === 'roofing' ? 1 : 0.6}
              onClick={() => setActiveZone('roofing')}
            />

            {/* Zone 2: Facade */}
            <rect
              x="30" y="75" width="140" height="60" rx="4"
              fill={activeZone === 'facade' ? '#38bdf8' : '#0a2218'}
              stroke="#38bdf8"
              strokeWidth="2"
              opacity={activeZone === 'facade' ? 1 : 0.6}
              onClick={() => setActiveZone('facade')}
            />

            {/* Zone 3: Superstructure */}
            <rect
              x="30" y="140" width="140" height="90" rx="4"
              fill={activeZone === 'superstructure' ? '#a78bfa' : '#0a2218'}
              stroke="#a78bfa"
              strokeWidth="2"
              opacity={activeZone === 'superstructure' ? 1 : 0.6}
              onClick={() => setActiveZone('superstructure')}
            />

            {/* Zone 4: Substructure */}
            <rect
              x="15" y="235" width="170" height="50" rx="4"
              fill={activeZone === 'substructure' ? '#fbbf24' : '#0a2218'}
              stroke="#fbbf24"
              strokeWidth="2"
              opacity={activeZone === 'substructure' ? 1 : 0.6}
              onClick={() => setActiveZone('substructure')}
            />
          </svg>

          {/* CALLOUT BOX BELOW SVG */}
          <div style={{ marginTop: '16px', backgroundColor: 'rgba(2, 9, 7, 0.6)', padding: '12px', borderRadius: '10px', textAlign: 'left', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ color: selectedData.color, fontSize: '13px', fontWeight: '700' }}>{selectedData.title}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Carbon Share: <strong style={{ color: '#ffffff' }}>{selectedData.share}</strong></div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Key Driver: {selectedData.driver}</div>
          </div>
        </div>

        {/* RIGHT COLUMN: STRUCTURAL CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {BUILDING_ZONES.map(zone => {
            const isSelected = zone.id === activeZone;
            return (
              <div
                key={zone.id}
                className="bio-panel"
                onClick={() => setActiveZone(zone.id)}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  borderColor: isSelected ? zone.color : 'rgba(16, 185, 129, 0.2)',
                  boxShadow: isSelected ? `0 0 15px ${zone.color}30` : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: zone.color }} />
                    <h4 style={{ fontSize: '15px', margin: 0, color: '#ffffff' }}>{zone.title}</h4>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: zone.color }}>{zone.share} Share</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', fontSize: '12px' }}>
                  <div style={{ backgroundColor: 'rgba(2, 9, 7, 0.5)', padding: '8px 12px', borderRadius: '8px' }}>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px' }}>Primary Carbon Driver</span>
                    <strong style={{ color: '#f87171' }}>{zone.driver}</strong>
                  </div>
                  <div style={{ backgroundColor: 'rgba(2, 9, 7, 0.5)', padding: '8px 12px', borderRadius: '8px' }}>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px' }}>Recommended Green Substitute</span>
                    <strong style={{ color: '#34d399' }}>{zone.substitute}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}