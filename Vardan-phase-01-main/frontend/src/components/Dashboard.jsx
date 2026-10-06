import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MaterialSelector from '../components/MaterialSelector';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  Leaf, Thermometer, Waves, Wind, ShieldCheck,
  AlertTriangle, Loader2, Info, Zap, Truck, Fuel, Bike, 
  Navigation, Scale, CheckCircle2, Building2, Calendar, 
  Layers, FlaskConical, Globe, X
} from 'lucide-react';
import BuildingLCA from '../components/BuildingLCA.jsx';
import './Dashboard.css';

const API = (import.meta.env.VITE_API_URL || '') + '/api/v1';

/* ── Custom Recharts Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: '#020907', border: '1px solid #10b981', padding: '10px 14px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
      <p style={{ color: '#ffffff', fontWeight: 'bold', margin: '0 0 6px 0', fontSize: '12px' }}>{label}</p>
      {payload.map((p, i) => {
        if (p.value === null || p.value === undefined) return null;
        const formatted = typeof p.value === 'number' ? p.value.toFixed(4) : p.value;
        return (
          <p key={i} style={{ color: p.color || '#34d399', margin: '4px 0', fontSize: '12px' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color || '#34d399', marginRight: 6 }} />
            {p.name}: <strong>{formatted} kg CO₂e/kg</strong>
          </p>
        );
      })}
    </div>
  );
};

/* ── Slider Component ── */
const ClimateSlider = ({ icon: Icon, label, unit, value, min, max, step, color, onChange }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="transport-slider-block">
      <div className="transport-slider-header">
        <span className="transport-param-label">
          <Icon size={14} color={color} /> {label}
        </span>
        <span className="transport-param-val" style={{ color }}>
          {value > 0 && max !== 50 ? '+' : ''}{value.toFixed(1)}{unit}
        </span>
      </div>
      <div style={{ position: 'relative', width: '100%', height: '6px', background: 'rgba(2, 9, 7, 0.8)', borderRadius: '3px' }}>
        <div style={{ position: 'absolute', height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: 'absolute', top: -5, left: 0, width: '100%', height: '16px', opacity: 0, cursor: 'pointer' }}
        />
      </div>
    </div>
  );
};

/* ── Hazard Intensity Slider ── */
const HAZARD_PRESETS = [
  { label: 'Inland Baseline', value: 5 },
  { label: 'Urban Average', value: 15 },
  { label: 'Coastal Hazard Zone', value: 35 },
];

const HazardSlider = ({ value, onChange }) => {
  return (
    <div className="transport-slider-block">
      <div className="transport-slider-header">
        <span className="transport-param-label">
          <AlertTriangle size={14} color="#fbbf24" /> Extreme Hazard Intensity Index
        </span>
        <span className="transport-param-val text-amber">{value.toFixed(1)} / 50</span>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {HAZARD_PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            style={{
              flex: 1,
              background: value === p.value ? 'rgba(251, 191, 36, 0.2)' : 'rgba(2, 9, 7, 0.6)',
              border: `1px solid ${value === p.value ? '#fbbf24' : 'rgba(16, 185, 129, 0.2)'}`,
              color: value === p.value ? '#fbbf24' : '#94a3b8',
              padding: '6px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <input
        type="range" min={0} max={50} step={0.5} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#fbbf24' }}
      />
    </div>
  );
};

/* ── Metric Card ── */
const MetricCard = ({ label, value, unit, icon: Icon, color, subtitle }) => {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <div className="metric-icon" style={{ background: `${color}20`, color }}>
          <Icon size={16} />
        </div>
      </div>
      <div className="metric-value">
        {value !== null && value !== undefined ? (
          <>
            <span>{typeof value === 'number' ? value.toFixed(4) : value}</span>
            <span className="metric-unit">{unit}</span>
          </>
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        )}
      </div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
};

/* ── Vehicle Fleet Specifications ── */
const FLEET_VEHICLES = [
  { type: 'Electric Van', icon: Zap, curbKg: 1500, baseRate: 40.0, accent: '#34d399' },
  { type: 'Diesel Van', icon: Truck, curbKg: 2000, baseRate: 180.0, accent: '#fbbf24' },
  { type: 'CNG Truck', icon: Fuel, curbKg: 970, baseRate: 120.0, accent: '#38bdf8' },
  { type: 'Bike', icon: Bike, curbKg: 120, baseRate: 25.0, accent: '#f87171' },
];

export default function Dashboard() {
  const [materials, setMaterials] = useState([]);
  const [matLoading, setMatLoading] = useState(true);
  const [selected, setSelected] = useState('');

  /* Climate Parameters */
  const [params, setParams] = useState({
    extreme_weather_events: 15.0,
    temperature_anomaly: 1.2,
    sea_level_rise: 12.0,
    policy_score: 65.0,
  });

  /* Transportation Parameters (Stage A4) */
  const [transportActive, setTransportActive] = useState(true);
  const [transportParams, setTransportParams] = useState({
    vehicle_type: 'Diesel Van',
    distance_km: 50.0,
    load_weight_kg: 1000.0,
  });

  const [result, setResult] = useState(null);
  const [altResult, setAltResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [mainTab, setMainTab] = useState('material');
  const [chartMode, setChartMode] = useState('stages');

  const [alternatives, setAlternatives] = useState([]);
  const [selectedAlternative, setSelectedAlternative] = useState('');

  /* Fetch materials on mount */
  useEffect(() => {
    axios.get(`${API}/materials`)
      .then(r => { setMaterials(r.data.materials); setMatLoading(false); })
      .catch(() => { setError('Could not connect to backend server.'); setMatLoading(false); });
  }, []);

  /* Fetch green alternatives */
  useEffect(() => {
    if (!selected) {
      setAlternatives([]);
      setSelectedAlternative('');
      return;
    }
    axios.get(`${API}/materials/${encodeURIComponent(selected)}/alternatives`)
      .then(r => setAlternatives(r.data.alternatives))
      .catch(e => console.error("Failed to fetch alternatives", e));
  }, [selected]);

  /* Live transport emissions math */
  const selectedVehicleObj = FLEET_VEHICLES.find(v => v.type === transportParams.vehicle_type) || FLEET_VEHICLES[1];
  const totalWeight = selectedVehicleObj.curbKg + transportParams.load_weight_kg;
  const weightFactor = totalWeight / selectedVehicleObj.curbKg;
  const estTransportEmissionsKg = (selectedVehicleObj.baseRate * transportParams.distance_km * weightFactor) / 1000.0;
  const estPerKgTransportCo2e = transportParams.load_weight_kg > 0 ? (estTransportEmissionsKg / transportParams.load_weight_kg) : 0;

  /* Predict function */
  const predict = async () => {
    if (!selected) return;
    setPredicting(true);
    setError(null);
    try {
      const payload = {
        material_name: selected,
        ...params,
        transport: transportActive ? {
          vehicle_type: transportParams.vehicle_type,
          distance_km: transportParams.distance_km,
          load_weight_kg: transportParams.load_weight_kg,
        } : null,
      };

      const req1 = axios.post(`${API}/predict`, payload);
      let req2 = null;
      if (selectedAlternative) {
        req2 = axios.post(`${API}/predict`, { ...payload, material_name: selectedAlternative });
      }

      if (req2) {
        const [res1, res2] = await Promise.all([req1, req2]);
        setResult(res1.data);
        setAltResult(res2.data);
      } else {
        const res = await req1;
        setResult(res.data);
        setAltResult(null);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed.');
    } finally {
      setPredicting(false);
    }
  };

  /* Auto-recalculate when sliders change */
  useEffect(() => {
    if (selected && result) {
      predict();
    }
  }, [transportParams, params, transportActive, selectedAlternative]);

  /* Chart data building */
  let chartData = [];
  if (result) {
    chartData = [
      {
        shortName: 'A1–A3 Embodied',
        Original: Number(result.base_gwp_A1A3 ?? 0),
        ...(altResult ? { Alternative: Number(altResult.base_gwp_A1A3 ?? 0) } : {}),
      },
      {
        shortName: 'A4 Transport',
        Original: Number(result.transport?.per_kg_transport_co2e ?? estPerKgTransportCo2e),
        ...(altResult ? { Alternative: Number(altResult.transport?.per_kg_transport_co2e ?? estPerKgTransportCo2e) } : {}),
      },
      {
        shortName: '100-yr Calamity',
        Original: Number(result.predicted_100yr_gwp ?? 0),
        ...(altResult ? { Alternative: Number(altResult.predicted_100yr_gwp ?? 0) } : {}),
      },
      {
        shortName: 'Net Lifecycle',
        Original: Number(result.total_lifecycle_carbon || (result.predicted_100yr_gwp + (result.transport?.per_kg_transport_co2e || 0))),
        ...(altResult ? { Alternative: Number(altResult.total_lifecycle_carbon || (altResult.predicted_100yr_gwp + (altResult.transport?.per_kg_transport_co2e || 0))) } : {}),
      },
    ];
  }

  /* 100-Year Dynamic Trajectory Data */
  let trajectoryData = [];
  if (result) {
    const origBase = Number(result.base_gwp_A1A3 ?? 0);
    const origTransport = Number(result.transport?.per_kg_transport_co2e ?? estPerKgTransportCo2e);
    const origPred = Number(result.predicted_100yr_gwp ?? origBase);
    const origPenalty = Math.max(0, origPred - origBase);
    const origYr0 = origBase + origTransport;

    trajectoryData = [
      { year: 'Year 0', Original: Number(origYr0.toFixed(4)) },
      { year: 'Year 25', Original: Number((origYr0 + origPenalty * 0.25).toFixed(4)) },
      { year: 'Year 50', Original: Number((origYr0 + origPenalty * 0.50).toFixed(4)) },
      { year: 'Year 75', Original: Number((origYr0 + origPenalty * 0.75).toFixed(4)) },
      { year: 'Year 100', Original: Number((origYr0 + origPenalty).toFixed(4)) },
    ];
  }

  return (
    <div className="dashboard">

      {/* HEADER */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo"><Leaf size={22} /></div>
          <div>
            <div className="header-title-row">
              <h1 className="header-title">Project Vardan</h1>
              <span className="phase-badge"><Zap size={11} /> Phase 3 <span className="phase-badge-active">Active</span></span>
            </div>
            <p className="header-sub">Universal Dynamic GWP Platform · ICE V5 Database</p>
          </div>
        </div>

        <nav className="header-nav-tabs">
          <button className={`nav-tab-btn ${mainTab === 'material' ? 'active' : ''}`} onClick={() => setMainTab('material')}>
            <FlaskConical size={14} /> Material LCA & Alternatives
          </button>
          <button className={`nav-tab-btn ${mainTab === 'building' ? 'active' : ''}`} onClick={() => setMainTab('building')}>
            <Building2 size={14} /> Complete Building LCA (100 Years)
          </button>
        </nav>

        <div className="header-right">
          <div className="header-badge"><span className="badge-dot" /> API Live</div>
          <button className="info-btn" onClick={() => setDrawerOpen(true)}><Info size={16} /></button>
        </div>
      </header>

      {mainTab === 'building' ? (
        <BuildingLCA />
      ) : (
        <main className="main-grid">

          {/* LEFT PANEL: CONTROLS */}
          <aside className="panel">

            {/* 1. MATERIAL SELECTION */}
            <section className="panel-section">
              <h2 className="section-title"><FlaskConical size={15} /> Stage A1–A3: Procurement</h2>
              <MaterialSelector materials={materials} selected={selected} onSelect={setSelected} loading={matLoading} />

              {alternatives.length > 0 && (
                <div className="alternatives-wrap">
                  <h3 className="alternatives-title">🌿 Green Alternatives (Optional)</h3>
                  <div className="alternatives-list">
                    {alternatives.map(alt => (
                      <div 
                        key={alt.material_name} 
                        className={`alternative-card ${selectedAlternative === alt.material_name ? 'selected' : ''}`}
                        onClick={() => setSelectedAlternative(alt.material_name === selectedAlternative ? '' : alt.material_name)}
                      >
                        <span className="alt-name">{alt.material_name}</span>
                        <span className="alt-carbon">{alt.embodied_carbon.toFixed(3)} kgCO₂e</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <div className="divider" />

            {/* 2. TRANSPORTATION & LOGISTICS */}
            <section className="panel-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 className="section-title" style={{ margin: 0 }}><Truck size={15} /> Stage A4: Transport Fleet</h2>
                <input type="checkbox" checked={transportActive} onChange={e => setTransportActive(e.target.checked)} />
              </div>

              {transportActive && (
                <div>
                  <div className="fleet-grid">
                    {FLEET_VEHICLES.map(v => {
                      const VIcon = v.icon;
                      return (
                        <button
                          key={v.type}
                          className={`fleet-card ${transportParams.vehicle_type === v.type ? 'active' : ''}`}
                          onClick={() => setTransportParams(p => ({ ...p, vehicle_type: v.type }))}
                          style={{ '--vehicle-accent': v.accent }}
                        >
                          <div className="fleet-card-top">
                            <VIcon size={16} color={v.accent} />
                            <span className="fleet-card-rate">{v.baseRate} g/km</span>
                          </div>
                          <div className="fleet-card-title">{v.type}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="transport-slider-block">
                    <div className="transport-slider-header">
                      <span className="transport-param-label"><Navigation size={13} /> Distance</span>
                      <span className="transport-param-val text-amber">{transportParams.distance_km} km</span>
                    </div>
                    <input
                      type="range" min={0} max={400} step={1} value={transportParams.distance_km}
                      onChange={e => setTransportParams(p => ({ ...p, distance_km: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#fbbf24' }}
                    />
                  </div>

                  <div className="transport-slider-block">
                    <div className="transport-slider-header">
                      <span className="transport-param-label"><Scale size={13} /> Cargo Weight</span>
                      <span className="transport-param-val text-teal">{transportParams.load_weight_kg} kg</span>
                    </div>
                    <input
                      type="range" min={10} max={5000} step={10} value={transportParams.load_weight_kg}
                      onChange={e => setTransportParams(p => ({ ...p, load_weight_kg: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#34d399' }}
                    />
                  </div>

                  <div className="transport-live-pill">
                    <div className="pill-item"><span className="pill-lbl">Weight Factor:</span><span className="pill-val">{weightFactor.toFixed(2)}×</span></div>
                    <div className="pill-item"><span className="pill-lbl">Trip CO₂:</span><span className="pill-val text-amber">{estTransportEmissionsKg.toFixed(2)} kg</span></div>
                    <div className="pill-item"><span className="pill-lbl">Normalized:</span><span className="pill-val text-teal">{estPerKgTransportCo2e.toFixed(4)} kg/kg</span></div>
                  </div>
                </div>
              )}
            </section>

            <div className="divider" />

            {/* 3. CLIMATE PARAMETERS */}
            <section className="panel-section">
              <h2 className="section-title"><Wind size={15} /> Stage B1–B7: Climate Stress</h2>
              <HazardSlider value={params.extreme_weather_events} onChange={v => setParams(p => ({ ...p, extreme_weather_events: v }))} />
              <ClimateSlider icon={Thermometer} label="Temp Anomaly" unit="°C" color="#f87171" value={params.temperature_anomaly} min={-2.0} max={5.0} step={0.1} onChange={v => setParams(p => ({ ...p, temperature_anomaly: v }))} />
              <ClimateSlider icon={Waves} label="Sea Level Rise" unit=" cm" color="#38bdf8" value={params.sea_level_rise} min={-5.0} max={50.0} step={0.5} onChange={v => setParams(p => ({ ...p, sea_level_rise: v }))} />
              <ClimateSlider icon={ShieldCheck} label="Grid Policy Score" unit="" color="#34d399" value={params.policy_score} min={0} max={100} step={1} onChange={v => setParams(p => ({ ...p, policy_score: v }))} />
            </section>

            <button className="predict-btn" onClick={predict} disabled={!selected || predicting}>
              {predicting ? <Loader2 size={18} className="spin" /> : <><Zap size={18} /> Calculate Full Lifecycle Carbon</>}
            </button>
          </aside>

          {/* RIGHT PANEL: RESULTS */}
          <section className="panel">

            <div className="metrics-grid">
              <MetricCard label="Initial Embodied (A1–A3)" value={result?.base_gwp_A1A3 ?? null} unit="kg CO₂e/kg" icon={Leaf} color="#34d399" subtitle="Manufacturing" />
              <MetricCard label="Transport Carbon (A4)" value={result?.transport?.per_kg_transport_co2e ?? estPerKgTransportCo2e} unit="kg CO₂e/kg" icon={Truck} color="#fbbf24" subtitle="Transit to Site" />
              <MetricCard label="100-Yr Dynamic GWP" value={result?.predicted_100yr_gwp ?? null} unit="kg CO₂e/kg" icon={Zap} color="#38bdf8" subtitle="Climate Stress" />
              <MetricCard label="Net Footprint" value={result?.total_lifecycle_carbon || (result ? result.predicted_100yr_gwp + estPerKgTransportCo2e : null)} unit="kg CO₂e/kg" icon={CheckCircle2} color="#a78bfa" subtitle="Total Lifecycle" />
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h2 className="chart-title">Lifecycle Carbon Assessment Canvas</h2>
                  <p className="chart-subtitle">Comparative breakdown across Upfront, Logistics, and 100-Year Climate Stress</p>
                </div>
                {result && (
                  <div className="chart-view-toggle">
                    <button className={`chart-toggle-btn ${chartMode === 'stages' ? 'active' : ''}`} onClick={() => setChartMode('stages')}><Layers size={12} /> Stage Breakdown</button>
                    <button className={`chart-toggle-btn ${chartMode === 'trajectory' ? 'active' : ''}`} onClick={() => setChartMode('trajectory')}><Calendar size={12} /> 100-Yr Trajectory</button>
                  </div>
                )}
              </div>

              {result ? (
                <ResponsiveContainer width="100%" height={300}>
                  {chartMode === 'stages' ? (
                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.1)" />
                      <XAxis dataKey="shortName" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Original" name={result.material_name} fill="#10b981" radius={[6, 6, 0, 0]} />
                      {altResult && <Bar dataKey="Alternative" name={altResult.material_name} fill="#38bdf8" radius={[6, 6, 0, 0]} />}
                    </BarChart>
                  ) : (
                    <AreaChart data={trajectoryData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.1)" />
                      <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Original" stroke="#34d399" fill="rgba(52, 211, 153, 0.2)" strokeWidth={3} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  <div className="chart-empty-icon"><Zap size={36} /></div>
                  <p>Select a material and click Calculate Full Lifecycle Carbon</p>
                </div>
              )}
            </div>

          </section>
        </main>
      )}

      {/* DRAWER */}
      {drawerOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }} onClick={() => setDrawerOpen(false)} />
          <aside style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '380px', background: '#0a1c14', borderLeft: '1px solid #10b981', padding: '24px', zIndex: 101, color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Model Architecture</h2>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '16px' }}>
              Project Vardan combines 259+ material entries from the ICE V5 database with Random Forest ensemble ML models to simulate 100-year carbon trajectories under regional climate stress.
            </p>
          </aside>
        </>
      )}

    </div>
  );
}