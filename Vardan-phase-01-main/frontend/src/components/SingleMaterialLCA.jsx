import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MaterialSelector from './MaterialSelector';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import {
  Leaf, Thermometer, Waves, Wind, ShieldCheck,
  AlertTriangle, Loader2, TrendingUp, TrendingDown, Minus,
  Truck, Fuel, Zap, Navigation, Scale, CheckCircle2,
  Calendar, Layers, Sparkles, HelpCircle, Check, ArrowDownRight,
  Info
} from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || '') + '/api/v1';

/* ── Fallback Curated Green Alternatives ── */
const FALLBACK_GREEN_ALTERNATIVES = [
  {
    material_name: 'Natural Calcined Zeolitic Pozzolan',
    embodied_carbon: 0.035,
    description: 'Low-temperature calcined natural zeolite replacing 40% Portland clinker.',
    category: 'cement_scm'
  },
  {
    material_name: 'Biochar-Pozzolan Carbon-Negative SCM',
    embodied_carbon: -0.150,
    description: 'Pyrolyzed biomass biochar pozzolan with permanent carbon sequestration.',
    category: 'cement_scm'
  },
  {
    material_name: 'Activated Micro-fine Rice Husk Ash',
    embodied_carbon: 0.024,
    description: 'Agricultural byproduct silica SCM with high pozzolanic strength reactivity.',
    category: 'cement_scm'
  },
  {
    material_name: 'Hempcrete block, density 300 kg/m3',
    embodied_carbon: -0.410,
    description: 'Bio-composite hemp shiv and hydrated lime block locking biogenic carbon.',
    category: 'wall'
  },
  {
    material_name: 'Low-carbon concrete with LC3',
    embodied_carbon: 0.048,
    description: 'Limestone calcined clay ternary binder with 50% lower clinker content.',
    category: 'concrete'
  },
  {
    material_name: 'Wood fiberboard insulation',
    embodied_carbon: -0.450,
    description: 'FSC-certified circular timber insulation capturing biogenic carbon.',
    category: 'insulation'
  }
];

/* ── Supported Fleet Vehicles ── */
const VEHICLE_OPTIONS = [
  {
    type: 'Electric Freight',
    icon: Zap,
    curbKg: 1500,
    baseRate: 40.0,
    badge: 'EV Zero-Tailpipe',
    accent: '#10b981',
    desc: 'Electric Commercial Vehicle (1,500 kg curb, 40 g/km)'
  },
  {
    type: 'Rigid Truck',
    icon: Truck,
    curbKg: 8000,
    baseRate: 280.0,
    badge: 'Standard Hauler',
    accent: '#f59e0b',
    desc: 'Medium Rigid Heavy Goods Vehicle (8,000 kg curb, 280 g/km)'
  },
  {
    type: 'Articulated Lorry',
    icon: Fuel,
    curbKg: 15000,
    baseRate: 450.0,
    badge: 'Heavy Freight',
    accent: '#f87171',
    desc: 'Large Multi-Axle Articulated Lorry (15,000 kg curb, 450 g/km)'
  },
  {
    type: 'Cargo Van',
    icon: Truck,
    curbKg: 2000,
    baseRate: 180.0,
    badge: 'Delivery Van',
    accent: '#38bdf8',
    desc: 'Light Commercial Diesel Van (2,000 kg curb, 180 g/km)'
  }
];

/* ── Per-km-per-kg Emission Factors (kg CO₂e / km / kg) ── */
const VEHICLE_EMISSION_FACTORS = {
  'Rigid Truck':        0.00018,  // Diesel rigid HGV
  'Articulated Lorry':  0.00012,  // Multi-axle artic
  'Electric Freight':   0.00004,  // EV zero-tailpipe
  'Cargo Van':          0.00015,  // Light commercial diesel van (interpolated)
};

/* ── Hazard Presets ── */
const HAZARD_PRESETS = [
  { label: 'Inland Baseline', value: 5.0, title: 'Low exposure — continental interior, minimal storm risk' },
  { label: 'Urban Average', value: 15.0, title: 'Moderate exposure — typical metropolitan conditions' },
  { label: 'Coastal Hazard Zone', value: 35.0, title: 'High exposure — typhoon corridor with storm surge' },
];

/* ── Recharts Custom Tooltip ── */
const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip-box">
      <div className="tooltip-title">{label}</div>
      {payload.map((item, index) => {
        if (item.value === null || item.value === undefined) return null;
        const valFormatted = typeof item.value === 'number' ? item.value.toFixed(4) : item.value;
        return (
          <div key={index} className="tooltip-entry" style={{ color: item.color || '#10b981' }}>
            <span className="tooltip-bullet" style={{ backgroundColor: item.color || '#10b981' }} />
            <span className="tooltip-name">{item.name}:</span>
            <span className="tooltip-value">{valFormatted} kg CO₂e/kg</span>
          </div>
        );
      })}
    </div>
  );
};

export default function SingleMaterialLCA() {
  const [materials, setMaterials] = useState([]);
  const [matLoading, setMatLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  
  // Green Alternatives state
  const [alternativesList, setAlternativesList] = useState([]);
  const [selectedGreen, setSelectedGreen] = useState(null); // object or null
  const [altLoading, setAltLoading] = useState(false);

  // Stage A4 Transport state
  const [transportActive, setTransportActive] = useState(true);
  const [transportState, setTransportState] = useState({
    vehicle_type: 'Rigid Truck',
    distance_km: 50.0,
    load_weight_kg: 1000.0,
  });

  // Stage B1-B7 Climate parameters
  const [climateParams, setClimateParams] = useState({
    extreme_weather_events: 15.0,
    temperature_anomaly: 1.2,
    sea_level_rise: 12.0,
    policy_score: 65.0,
  });

  // Predictions & Reasoning
  const [predicting, setPredicting] = useState(false);
  const [baseResult, setBaseResult] = useState(null);
  const [greenResult, setGreenResult] = useState(null);
  const [reasoningData, setReasoningData] = useState(null);
  const [reasoningLoading, setReasoningLoading] = useState(false);
  const [error, setError] = useState(null);

  // Visualization Mode
  const [chartMode, setChartMode] = useState('stages'); // 'stages' | 'trajectory'

  // Fetch materials on mount
  useEffect(() => {
    axios.get(`${API}/materials`)
      .then(r => {
        setMaterials(r.data.materials || []);
        if (r.data.materials?.length > 0) {
          // Preselect a representative baseline material
          const defaultMat = r.data.materials.find(m => m.includes('Portland cement') || m.includes('CEM I')) || r.data.materials[0];
          setSelectedMaterial(defaultMat);
        }
        setMatLoading(false);
      })
      .catch(() => {
        setError('Unable to fetch materials from backend. Ensure FastAPI is running on port 8000.');
        setMatLoading(false);
      });
  }, []);

  // Fetch alternatives when selectedMaterial changes
  useEffect(() => {
    if (!selectedMaterial) {
      setAlternativesList(FALLBACK_GREEN_ALTERNATIVES);
      setSelectedGreen(null);
      return;
    }
    setAltLoading(true);
    axios.get(`${API}/materials/${encodeURIComponent(selectedMaterial)}/alternatives`)
      .then(r => {
        if (r.data?.alternatives && r.data.alternatives.length > 0) {
          setAlternativesList(r.data.alternatives);
        } else {
          setAlternativesList(FALLBACK_GREEN_ALTERNATIVES);
        }
      })
      .catch(() => {
        setAlternativesList(FALLBACK_GREEN_ALTERNATIVES);
      })
      .finally(() => {
        setAltLoading(false);
      });
  }, [selectedMaterial]);

  // Live client-side calculation for Transport A4
  const currentVehicle = VEHICLE_OPTIONS.find(v => v.type === transportState.vehicle_type) || VEHICLE_OPTIONS[1];
  const grossWeight = currentVehicle.curbKg + transportState.load_weight_kg;
  const weightFactor = grossWeight / currentVehicle.curbKg;
  const estTripEmissionsG = currentVehicle.baseRate * transportState.distance_km * weightFactor;
  const estTripEmissionsKg = estTripEmissionsG / 1000.0;
  const estPerKgTransport = transportState.load_weight_kg > 0 ? (estTripEmissionsKg / transportState.load_weight_kg) : 0;

  // Reactive Stage A4 carbon using per-km-per-kg emission factors
  // Formula: transitKm × vehicleEmissionFactor (kg CO₂e / km / kg)
  const vehicleEmissionFactor = VEHICLE_EMISSION_FACTORS[transportState.vehicle_type] ?? 0.00018;
  const a4Carbon = transportActive
    ? transportState.distance_km * vehicleEmissionFactor
    : 0;

  // Predict function
  const runPrediction = async (overrideGreen = undefined) => {
    if (!selectedMaterial) return;
    setPredicting(true);
    setError(null);

    const activeGreenObj = overrideGreen !== undefined ? overrideGreen : selectedGreen;

    const basePayload = {
      material_name: selectedMaterial,
      ...climateParams,
      transport: transportActive ? {
        vehicle_type: transportState.vehicle_type,
        distance_km: transportState.distance_km,
        load_weight_kg: transportState.load_weight_kg,
      } : null,
    };

    try {
      const baseReq = axios.post(`${API}/predict`, basePayload);
      let greenReq = null;
      if (activeGreenObj) {
        greenReq = axios.post(`${API}/predict`, {
          ...basePayload,
          material_name: activeGreenObj.material_name,
        });
      }

      if (greenReq) {
        const [resBase, resGreen] = await Promise.all([baseReq, greenReq]);
        setBaseResult(resBase.data);
        setGreenResult(resGreen.data);
      } else {
        const resBase = await baseReq;
        setBaseResult(resBase.data);
        setGreenResult(null);
      }

      // If green alternative is selected, trigger XAI Reasoning
      if (activeGreenObj) {
        fetchReasoning(activeGreenObj, selectedMaterial);
      } else {
        setReasoningData(null);
      }
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || 'Prediction failed. Check backend console logs.');
    } finally {
      setPredicting(false);
    }
  };

  // Fetch reasoning
  const fetchReasoning = async (greenObj, baseName) => {
    if (!greenObj || !baseName) return;
    setReasoningLoading(true);
    try {
      // Get base GWP if available or estimate
      let baseCarbon = 0.85;
      if (baseResult?.base_gwp_A1A3 !== undefined) {
        baseCarbon = baseResult.base_gwp_A1A3;
      } else {
        try {
          const bRes = await axios.get(`${API}/materials/${encodeURIComponent(baseName)}/base-gwp`);
          baseCarbon = bRes.data.base_gwp_A1A3;
        } catch {
          baseCarbon = 0.85;
        }
      }

      const res = await axios.post(`${API}/reason`, {
        mat1_name: greenObj.material_name,
        mat1_carbon: greenObj.embodied_carbon,
        mat2_name: baseName,
        mat2_carbon: baseCarbon
      });
      setReasoningData(res.data);
    } catch (err) {
      console.error('Failed to fetch XAI reasoning:', err);
    } finally {
      setReasoningLoading(false);
    }
  };

  // Run initial calculation when material or primary settings are ready
  useEffect(() => {
    if (selectedMaterial) {
      runPrediction();
    }
  }, [selectedMaterial]);

  // Handle toggling green alternative
  const handleSelectGreen = (alt) => {
    const isSame = selectedGreen?.material_name === alt.material_name;
    const nextGreen = isSame ? null : alt;
    setSelectedGreen(nextGreen);
    // Re-run prediction with the updated alternative
    runPrediction(nextGreen);
  };

  // Build Recharts data for "Stage Breakdown"
  let stageBreakdownData = [];
  if (baseResult) {
    const bA1A3 = Number(baseResult.base_gwp_A1A3 ?? 0);
    const gA1A3 = greenResult ? Number(greenResult.base_gwp_A1A3 ?? 0) : null;
    const bB1B7 = Number(baseResult.predicted_100yr_gwp ?? 0);
    const gB1B7 = greenResult ? Number(greenResult.predicted_100yr_gwp ?? 0) : null;

    stageBreakdownData = [
      {
        stageName: 'Stage A1–A3',
        description: 'Upfront Embodied Carbon',
        Baseline: Number(bA1A3.toFixed(4)),
        ...(gA1A3 !== null ? { 'Green Alternative': Number(gA1A3.toFixed(4)) } : {}),
      },
      {
        stageName: 'Stage A4',
        description: 'Logistics Transport Transit',
        Baseline: Number(a4Carbon.toFixed(4)),
        ...(gA1A3 !== null ? { 'Green Alternative': Number(a4Carbon.toFixed(4)) } : {}),
      },
      {
        stageName: 'Stage B1–B7',
        description: '100-Yr Calamity GWP',
        Baseline: Number(bB1B7.toFixed(4)),
        ...(gB1B7 !== null ? { 'Green Alternative': Number(gB1B7.toFixed(4)) } : {}),
      },
      {
        stageName: 'Total Lifecycle',
        description: 'Cradle-to-Lifespan Footprint',
        Baseline: Number((bA1A3 + a4Carbon + bB1B7).toFixed(4)),
        ...(gA1A3 !== null ? {
          'Green Alternative': Number((gA1A3 + a4Carbon + gB1B7).toFixed(4))
        } : {}),
      },
    ];
  }

  // Build Recharts data for "100-Yr Trajectory"
  let trajectoryData = [];
  if (baseResult) {
    const bBase = Number(baseResult.base_gwp_A1A3 ?? 0);
    const bTrans = Number(baseResult.transport?.per_kg_transport_co2e ?? 0);
    const bPred = Number(baseResult.predicted_100yr_gwp ?? bBase);
    const bPenalty = Math.max(0, bPred - bBase);
    const bYr0 = bBase + bTrans;

    const gBase = greenResult ? Number(greenResult.base_gwp_A1A3 ?? 0) : null;
    const gTrans = greenResult?.transport ? Number(greenResult.transport.per_kg_transport_co2e ?? 0) : 0;
    const gPred = greenResult ? Number(greenResult.predicted_100yr_gwp ?? gBase) : null;
    const gPenalty = gPred !== null ? Math.max(0, gPred - gBase) : 0;
    const gYr0 = gBase !== null ? gBase + gTrans : null;

    trajectoryData = [
      {
        year: 'Year 0 (Handover)',
        milestone: 'As-Built Baseline',
        Baseline: Number(bYr0.toFixed(4)),
        ...(gYr0 !== null ? { 'Green Alternative': Number(gYr0.toFixed(4)) } : {})
      },
      {
        year: 'Year 25 (Horizon I)',
        milestone: 'Quarter-Century',
        Baseline: Number((bYr0 + bPenalty * 0.25).toFixed(4)),
        ...(gYr0 !== null ? { 'Green Alternative': Number((gYr0 + gPenalty * 0.25).toFixed(4)) } : {})
      },
      {
        year: 'Year 50 (Renovation)',
        milestone: 'Mid-Life Retrofit',
        Baseline: Number((bYr0 + bPenalty * 0.50).toFixed(4)),
        ...(gYr0 !== null ? { 'Green Alternative': Number((gYr0 + gPenalty * 0.50).toFixed(4)) } : {})
      },
      {
        year: 'Year 75 (Refit)',
        milestone: 'Deep Decarbonization',
        Baseline: Number((bYr0 + bPenalty * 0.75).toFixed(4)),
        ...(gYr0 !== null ? { 'Green Alternative': Number((gYr0 + gPenalty * 0.75).toFixed(4)) } : {})
      },
      {
        year: 'Year 100 (End of Life)',
        milestone: 'Full Resilience Span',
        Baseline: Number((bYr0 + bPenalty).toFixed(4)),
        ...(gYr0 !== null ? { 'Green Alternative': Number((gYr0 + gPenalty).toFixed(4)) } : {})
      },
    ];
  }

  // Calculate comparative carbon savings if green is selected
  const baselineTotal = baseResult ? (baseResult.total_lifecycle_carbon || (baseResult.predicted_100yr_gwp + (baseResult.transport?.per_kg_transport_co2e || 0))) : 0;
  const greenTotal = greenResult ? (greenResult.total_lifecycle_carbon || (greenResult.predicted_100yr_gwp + (greenResult.transport?.per_kg_transport_co2e || 0))) : null;
  const savingsKg = (greenTotal !== null && baselineTotal > 0) ? (baselineTotal - greenTotal) : 0;
  const savingsPct = (greenTotal !== null && baselineTotal > 0) ? ((savingsKg / baselineTotal) * 100) : 0;

  return (
    <div className="single-material-lca main-grid">
      {/* ════════════ LEFT COLUMN: GRID CONTROLS ════════════ */}
      <div className="controls-column">

        {/* ── CARD 1: STAGE A1–A3 MATERIAL SELECTION & GREEN ALTERNATIVES ── */}
        <div className="control-card panel">
          <div className="card-header">
            <div className="card-badge a1a3">Stage A1–A3</div>
            <h2 className="card-title">Material Procurement & Manufacturing</h2>
          </div>
          <p className="card-description">
            Select baseline material from the ICE V5 database to calculate cradle-to-gate embodied carbon.
          </p>

          <div className="selector-container">
            <MaterialSelector
              materials={materials}
              selected={selectedMaterial}
              onSelect={setSelectedMaterial}
              loading={matLoading}
            />
          </div>

          {/* 🌿 Restored Green Alternatives Panel */}
          <div className="green-alternatives-panel">
            <div className="panel-title-row">
              <span className="panel-title">🌿 Green Alternatives (Optional)</span>
              <span className="panel-badge-sub">Category-Matched</span>
            </div>
            <p className="panel-helper-text">
              Click any verified substitute to bind its low-carbon profile directly to the comparative charts and Decision Tree reasoning.
            </p>

            {altLoading ? (
              <div className="alt-loading-state">
                <Loader2 size={16} className="spin text-emerald" />
                <span>Loading domain-matched green substitutes…</span>
              </div>
            ) : (
              <div className="green-cards-grid">
                {alternativesList.map((alt) => {
                  const isSelected = selectedGreen?.material_name === alt.material_name;
                  return (
                    <div
                      key={alt.material_name}
                      className={`green-alt-card ${isSelected ? 'active-emerald' : ''}`}
                      onClick={() => handleSelectGreen(alt)}
                    >
                      <div className="alt-card-top">
                        <span className="alt-card-name">{alt.material_name}</span>
                        {isSelected && (
                          <span className="check-indicator">
                            <CheckCircle2 size={16} className="text-emerald" />
                          </span>
                        )}
                      </div>
                      <div className="alt-card-carbon-row">
                        <span className="carbon-label">Initial Embodied:</span>
                        <span className="carbon-value-pill">
                          {alt.embodied_carbon > 0 ? '+' : ''}{alt.embodied_carbon.toFixed(3)} kgCO₂e/kg
                        </span>
                      </div>
                      {alt.description && (
                        <p className="alt-card-desc">{alt.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── CARD 2: STAGE A4 TRANSPORT LOGISTICS ── */}
        <div className="control-card panel">
          <div className="card-header-with-toggle">
            <div>
              <div className="card-badge a4">Stage A4</div>
              <h2 className="card-title">Transport Fleet & Logistics</h2>
            </div>
            <label className="switch-toggle" title="Toggle Stage A4 Transit Calculation">
              <input
                type="checkbox"
                checked={transportActive}
                onChange={e => setTransportActive(e.target.checked)}
              />
              <span className="slider round" />
              <span className="toggle-state-text">{transportActive ? 'Active' : 'Off'}</span>
            </label>
          </div>
          <p className="card-description">
            Simulate logistics emissions from manufacturing facility to construction site based on gross payload and fleet vehicle curb weight.
          </p>

          {transportActive ? (
            <div className="transport-body">
              {/* Vehicle Options Grid */}
              <div className="vehicle-grid">
                {VEHICLE_OPTIONS.map((v) => {
                  const VIcon = v.icon;
                  const isSelected = transportState.vehicle_type === v.type;
                  return (
                    <button
                      key={v.type}
                      type="button"
                      className={`vehicle-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setTransportState(prev => ({ ...prev, vehicle_type: v.type }))}
                      style={{ '--accent-color': v.accent }}
                    >
                      <div className="vehicle-card-header">
                        <div className="vehicle-icon-wrap">
                          <VIcon size={16} />
                        </div>
                        <span className="vehicle-rate">{v.baseRate} g/km</span>
                      </div>
                      <div className="vehicle-name">{v.type}</div>
                      <div className="vehicle-curb">Curb: {v.curbKg.toLocaleString()} kg</div>
                    </button>
                  );
                })}
              </div>

              {/* Transit Distance Slider */}
              <div className="slider-group">
                <div className="slider-header-row">
                  <span className="slider-title">
                    <Navigation size={14} className="slider-icon-amber" /> Transit Distance
                  </span>
                  <span className="slider-value-badge text-amber">
                    {transportState.distance_km.toFixed(0)} km
                  </span>
                </div>
                <div className="slider-track-container">
                  <input
                    type="range"
                    min="0"
                    max="400"
                    step="5"
                    value={transportState.distance_km}
                    onChange={e => setTransportState(p => ({ ...p, distance_km: parseFloat(e.target.value) }))}
                    className="custom-range range-amber"
                  />
                  <div className="slider-ticks">
                    <span>0 km (Local)</span>
                    <span>200 km</span>
                    <span>400 km (Regional)</span>
                  </div>
                </div>
              </div>

              {/* Cargo Weight Slider */}
              <div className="slider-group">
                <div className="slider-header-row">
                  <span className="slider-title">
                    <Scale size={14} className="slider-icon-emerald" /> Material Cargo Payload
                  </span>
                  <span className="slider-value-badge text-emerald">
                    {transportState.load_weight_kg.toLocaleString()} kg
                  </span>
                </div>
                <div className="slider-track-container">
                  <input
                    type="range"
                    min="10"
                    max="5000"
                    step="25"
                    value={transportState.load_weight_kg}
                    onChange={e => setTransportState(p => ({ ...p, load_weight_kg: parseFloat(e.target.value) }))}
                    className="custom-range range-emerald"
                  />
                  <div className="slider-ticks">
                    <span>10 kg (Sample)</span>
                    <span>2,500 kg</span>
                    <span>5,000 kg (Full Batch)</span>
                  </div>
                </div>
              </div>

              {/* Live Transit Calculation Summary Pill */}
              <div className="transit-math-pill">
                <div className="math-col">
                  <span className="math-label">Gross Factor</span>
                  <span className="math-val">{weightFactor.toFixed(3)}×</span>
                </div>
                <div className="math-divider" />
                <div className="math-col">
                  <span className="math-label">Estimated Trip CO₂</span>
                  <span className="math-val text-amber">{estTripEmissionsKg.toFixed(2)} kg</span>
                </div>
                <div className="math-divider" />
                <div className="math-col">
                  <span className="math-label">Normalized Factor</span>
                  <span className="math-val text-emerald">{estPerKgTransport.toFixed(4)} kg/kg</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="transport-bypassed-notice">
              <Truck size={16} className="text-muted" />
              <span>Logistics calculations bypassed. Results represent Cradle-to-Gate only.</span>
            </div>
          )}
        </div>

        {/* ── CARD 3: STAGE B1–B7 CLIMATE STRESS PARAMETERS ── */}
        <div className="control-card panel">
          <div className="card-header">
            <div className="card-badge b1b7">Stage B1–B7</div>
            <h2 className="card-title">Climate Stress & Hazard Calamity</h2>
          </div>
          <p className="card-description">
            Stress-test structural resilience over 100 years under environmental shocks using pre-trained Random Forest ML inference.
          </p>

          {/* Hazard Index Slider with Presets */}
          <div className="slider-group">
            <div className="slider-header-row">
              <span className="slider-title">
                <AlertTriangle size={14} className="slider-icon-red" /> Hazard Intensity Index (0–50)
              </span>
              <span className="slider-value-badge text-red">
                {climateParams.extreme_weather_events.toFixed(1)} / 50
              </span>
            </div>

            <div className="hazard-preset-buttons">
              {HAZARD_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`hazard-preset-btn ${climateParams.extreme_weather_events === preset.value ? 'active' : ''}`}
                  onClick={() => setClimateParams(p => ({ ...p, extreme_weather_events: preset.value }))}
                  title={preset.title}
                >
                  {preset.label} ({preset.value})
                </button>
              ))}
            </div>

            <div className="slider-track-container">
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={climateParams.extreme_weather_events}
                onChange={e => setClimateParams(p => ({ ...p, extreme_weather_events: parseFloat(e.target.value) }))}
                className="custom-range range-red"
              />
              <div className="slider-ticks">
                <span>0 (Calm)</span>
                <span>25 (Severe)</span>
                <span>50 (Catastrophic)</span>
              </div>
            </div>
          </div>

          {/* Temperature Anomaly Slider */}
          <div className="slider-group">
            <div className="slider-header-row">
              <span className="slider-title">
                <Thermometer size={14} className="slider-icon-rose" /> Temperature Anomaly
              </span>
              <span className="slider-value-badge text-rose">
                +{climateParams.temperature_anomaly.toFixed(1)} °C
              </span>
            </div>
            <div className="slider-track-container">
              <input
                type="range"
                min="-2.0"
                max="5.0"
                step="0.1"
                value={climateParams.temperature_anomaly}
                onChange={e => setClimateParams(p => ({ ...p, temperature_anomaly: parseFloat(e.target.value) }))}
                className="custom-range range-rose"
              />
              <div className="slider-ticks">
                <span>-2.0 °C</span>
                <span>+1.5 °C (IPCC Target)</span>
                <span>+5.0 °C</span>
              </div>
            </div>
          </div>

          {/* Sea Level Rise Slider */}
          <div className="slider-group">
            <div className="slider-header-row">
              <span className="slider-title">
                <Waves size={14} className="slider-icon-sky" /> Coastal Sea Level Rise
              </span>
              <span className="slider-value-badge text-sky">
                {climateParams.sea_level_rise.toFixed(1)} cm
              </span>
            </div>
            <div className="slider-track-container">
              <input
                type="range"
                min="-5.0"
                max="50.0"
                step="0.5"
                value={climateParams.sea_level_rise}
                onChange={e => setClimateParams(p => ({ ...p, sea_level_rise: parseFloat(e.target.value) }))}
                className="custom-range range-sky"
              />
              <div className="slider-ticks">
                <span>-5 cm</span>
                <span>+25 cm</span>
                <span>+50 cm</span>
              </div>
            </div>
          </div>

          {/* Policy Score Slider */}
          <div className="slider-group">
            <div className="slider-header-row">
              <span className="slider-title">
                <ShieldCheck size={14} className="slider-icon-emerald" /> Grid Decarbonization Score
              </span>
              <span className="slider-value-badge text-emerald">
                {climateParams.policy_score.toFixed(0)} / 100
              </span>
            </div>
            <div className="slider-track-container">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={climateParams.policy_score}
                onChange={e => setClimateParams(p => ({ ...p, policy_score: parseFloat(e.target.value) }))}
                className="custom-range range-emerald"
              />
              <div className="slider-ticks">
                <span>0 (Fossil Grid)</span>
                <span>50</span>
                <span>100 (100% Clean)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTON: CALCULATE FULL LIFECYCLE CARBON ── */}
        <button
          type="button"
          className={`primary-calculate-btn ${predicting ? 'loading' : ''}`}
          onClick={() => runPrediction()}
          disabled={!selectedMaterial || predicting}
        >
          {predicting ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Simulating 100-Year Climate Trajectory…</span>
            </>
          ) : (
            <>
              <TrendingUp size={18} />
              <span>Calculate Full Lifecycle Carbon</span>
            </>
          )}
        </button>

        {error && (
          <div className="error-message-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ════════════ RIGHT COLUMN: DYNAMIC RESULTS CANVAS ════════════ */}
      <div className="results-column">

        {/* ── KPI METRIC CARDS ── */}
        <div className="kpi-grid">
          {/* Card 1: Initial Embodied Carbon (A1-A3) */}
          <div className="kpi-card metric-card">
            <div className="kpi-top">
              <span className="kpi-label">Initial Embodied Carbon (A1–A3)</span>
              <div className="kpi-icon-wrap baseline">
                <Leaf size={16} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-number text-baseline">
                {baseResult ? (baseResult.base_gwp_A1A3 ?? 0).toFixed(4) : '—'}
              </span>
              <span className="kpi-unit">kg CO₂e/kg</span>
            </div>
            {greenResult && (
              <div className="kpi-sub-comparison">
                <span className="text-emerald">
                  Green: {(greenResult.base_gwp_A1A3 ?? 0).toFixed(4)} kgCO₂e/kg
                </span>
              </div>
            )}
            <div className="kpi-footer-sub">Cradle-to-Gate Manufacturing</div>
          </div>

          {/* Card 2: Transport Carbon (A4) */}
          <div className="kpi-card metric-card">
            <div className="kpi-top">
              <span className="kpi-label">A4 Transport Carbon</span>
              <div className="kpi-icon-wrap amber">
                <Truck size={16} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-number text-amber">
                {baseResult?.transport ? baseResult.transport.per_kg_transport_co2e.toFixed(4) : '0.0000'}
              </span>
              <span className="kpi-unit">kg CO₂e/kg</span>
            </div>
            <div className="kpi-sub-comparison">
              <span className="text-secondary">
                {baseResult?.transport ? `${baseResult.transport.vehicle_type} (${baseResult.transport.distance_km} km)` : 'Transit Bypassed'}
              </span>
            </div>
            <div className="kpi-footer-sub">Logistics Transit to Jobsite</div>
          </div>

          {/* Card 3: Predicted 100-Yr Dynamic GWP */}
          <div className="kpi-card metric-card">
            <div className="kpi-top">
              <span className="kpi-label">Predicted 100-Yr Dynamic GWP</span>
              <div className="kpi-icon-wrap sky">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-number text-sky">
                {baseResult ? (baseResult.predicted_100yr_gwp ?? 0).toFixed(4) : '—'}
              </span>
              <span className="kpi-unit">kg CO₂e/kg</span>
            </div>
            {baseResult && (
              <div className="kpi-sub-comparison">
                <span className="text-rose">
                  +{Math.max(0, (baseResult.calamity_carbon_penalty ?? 0)).toFixed(4)} calamity penalty
                </span>
              </div>
            )}
            <div className="kpi-footer-sub">100-Year Climate Degradation</div>
          </div>

          {/* Card 4: Net Project Footprint */}
          <div className="kpi-card metric-card featured">
            <div className="kpi-top">
              <span className="kpi-label">Net Project Footprint</span>
              <div className="kpi-icon-wrap emerald">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-number text-white">
                {baselineTotal > 0 ? baselineTotal.toFixed(4) : '—'}
              </span>
              <span className="kpi-unit">kg CO₂e/kg</span>
            </div>
            {greenResult && savingsPct > 0 && (
              <div className="kpi-sub-comparison">
                <span className="text-emerald font-semibold">
                  🌿 {savingsPct.toFixed(1)}% Net Carbon Avoidance
                </span>
              </div>
            )}
            <div className="kpi-footer-sub">A1–A3 + A4 + B1–B7 Total</div>
          </div>
        </div>

        {/* ── RECHARTS DUAL-INFERENCE CANVAS ── */}
        <div className="canvas-card chart-card">
          <div className="canvas-header">
            <div>
              <h3 className="canvas-title">Life Cycle Carbon Assessment Canvas</h3>
              <p className="canvas-subtitle">
                {chartMode === 'stages'
                  ? 'Comparative breakdown across Upfront Embodied (A1–A3), Logistics (A4), and 100-Year Operational Calamity (B1–B7)'
                  : 'Cumulative lifecycle emissions trajectory tracked from Handover (Year 0) through 100-Year End-of-Life'}
              </p>
            </div>

            {/* View Toggle Tabs */}
            <div className="canvas-view-toggle">
              <button
                type="button"
                className={`toggle-tab-btn ${chartMode === 'stages' ? 'active' : ''}`}
                onClick={() => setChartMode('stages')}
              >
                <Layers size={14} /> Stage Breakdown
              </button>
              <button
                type="button"
                className={`toggle-tab-btn ${chartMode === 'trajectory' ? 'active' : ''}`}
                onClick={() => setChartMode('trajectory')}
              >
                <Calendar size={14} /> 100-Yr Trajectory
              </button>
            </div>
          </div>

          {/* Active Material Tags */}
          <div className="canvas-tags-row">
            <div className="material-tag baseline-tag">
              <span className="tag-dot baseline" />
              <span>Baseline: <strong>{selectedMaterial || 'Not selected'}</strong></span>
            </div>
            {selectedGreen && (
              <div className="material-tag green-tag">
                <span className="tag-dot emerald" />
                <span>Green Alt: <strong>{selectedGreen.material_name}</strong></span>
              </div>
            )}
          </div>

          {/* Chart Rendering */}
          <div className="chart-render-wrap">
            {baseResult ? (
              chartMode === 'stages' ? (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={stageBreakdownData} margin={{ top: 20, right: 25, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="gradBaselineRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#f87171" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="gradGreenAlt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="stageName"
                      tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Inter' }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                      label={{ value: 'kg CO₂e / kg', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11, dy: 50 }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ color: '#94a3b8', fontSize: 12 }}
                    />
                    <Bar
                      dataKey="Baseline"
                      name={`Baseline: ${selectedMaterial.slice(0, 30)}…`}
                      fill="url(#gradBaselineRed)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={55}
                    />
                    {greenResult && (
                      <Bar
                        dataKey="Green Alternative"
                        name={`Green: ${selectedGreen.material_name.slice(0, 30)}…`}
                        fill="url(#gradGreenAlt)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={55}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={trajectoryData} margin={{ top: 20, right: 25, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="areaBaseline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#f87171" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                      label={{ value: 'Cumulative kg CO₂e / kg', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11, dy: 60 }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ color: '#94a3b8', fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Baseline"
                      name={`Baseline: ${selectedMaterial.slice(0, 30)}…`}
                      stroke="#f87171"
                      strokeWidth={3}
                      fill="url(#areaBaseline)"
                      dot={{ r: 4, fill: '#f87171' }}
                    />
                    {greenResult && (
                      <Area
                        type="monotone"
                        dataKey="Green Alternative"
                        name={`Green: ${selectedGreen.material_name.slice(0, 30)}…`}
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#areaGreen)"
                        dot={{ r: 4, fill: '#10b981' }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )
            ) : (
              <div className="chart-empty-state">
                <Loader2 size={32} className="spin text-emerald" />
                <p>Configuring baseline calculation…</p>
              </div>
            )}
          </div>
        </div>

        {/* ── WHITEBOX XAI REASONING PANEL ── */}
        <div className="reasoning-card chart-card">
          <div className="reasoning-header">
            <div className="reasoning-badge">
              <Sparkles size={14} className="text-emerald" />
              <span>Whitebox Explainable AI (XAI)</span>
            </div>
            <span className="reasoning-engine-tag">Interpretable Decision Tree (Depth ≤ 3)</span>
          </div>

          {selectedGreen ? (
            reasoningLoading ? (
              <div className="reasoning-loading">
                <Loader2 size={16} className="spin text-emerald" />
                <span>Evaluating decision branch thresholds…</span>
              </div>
            ) : reasoningData ? (
              <div className="reasoning-content">
                <div className="reasoning-bubble green">
                  <div className="bubble-label text-emerald">
                    <Check size={14} /> Green Alternative Path:
                  </div>
                  <p className="bubble-text">
                    {reasoningData.material_1_reasoning || reasoningData.material_1}
                  </p>
                </div>

                <div className="reasoning-bubble baseline">
                  <div className="bubble-label text-red">
                    <Minus size={14} /> Baseline Material Path:
                  </div>
                  <p className="bubble-text">
                    {reasoningData.material_2_reasoning || reasoningData.material_2}
                  </p>
                </div>

                <div className="reasoning-conclusion-box">
                  <div className="conclusion-title">
                    <Sparkles size={15} className="text-emerald" /> Algorithmic Verdict:
                  </div>
                  <p className="conclusion-text">
                    {reasoningData.comparison_conclusion || reasoningData.comparison}
                  </p>
                  {savingsKg > 0 && (
                    <div className="savings-highlight">
                      <span>Direct Carbon Reduction: </span>
                      <strong className="text-emerald">-{savingsKg.toFixed(4)} kg CO₂e / kg ({savingsPct.toFixed(1)}% savings)</strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="reasoning-placeholder">
                <p>Generating comparative reasoning between {selectedGreen.material_name} and {selectedMaterial}…</p>
              </div>
            )
          ) : (
            <div className="reasoning-empty-prompt">
              <HelpCircle size={20} className="text-muted" />
              <div>
                <strong>Want an explainable AI comparison?</strong>
                <p>Select any item from the <strong>🌿 Green Alternatives (Optional)</strong> panel above to automatically reveal the model's decision path explaining why the eco-substitute is superior.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
