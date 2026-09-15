import { useEffect, useState } from 'react';
import { BrainCircuit, MapPin, RefreshCw } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const initial = {
  latitude: 25.6532,
  longitude: 93.1028,
  rainfall_1h: 18,
  rainfall_6h: 58,
  rainfall_24h: 142,
  rainfall_3d: 287,
  rainfall_7d: 420,
  soil_moisture: 0.76,
  elevation: 920,
  slope: 38,
  aspect: 180,
  historical_landslides: 8,
  land_cover_risk: 0.72,
};

const fields = [
  ['latitude', 'Latitude'],
  ['longitude', 'Longitude'],
  ['rainfall_1h', 'Rainfall · 1 hour (mm)'],
  ['rainfall_6h', 'Rainfall · 6 hours (mm)'],
  ['rainfall_24h', 'Rainfall · 24 hours (mm)'],
  ['rainfall_3d', 'Rainfall · 3 days (mm)'],
  ['rainfall_7d', 'Rainfall · 7 days (mm)'],
  ['soil_moisture', 'Soil moisture (0–1)'],
  ['elevation', 'Elevation (m)'],
  ['slope', 'Slope (°)'],
  ['aspect', 'Aspect (°)'],
  ['historical_landslides', 'Historical landslides'],
  ['land_cover_risk', 'Land cover risk (0–1)'],
];

const normalizeZone = zone => ({
  ...zone,
  riskScore: Number(zone.risk_score ?? zone.riskScore ?? 0),
  rainfall24h: Number(
    zone.rainfall_24h ??
    zone.rainfall_mm ??
    zone.rainfall ??
    0
  ),
  soilMoisture: Number(
    zone.soil_moisture ??
    zone.soilMoisture_pct ??
    0
  ),
});

export const RiskAnalysisPage = () => {
  const [form, setForm] = useState(initial);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [zonesLoading, setZonesLoading] = useState(true);

  const loadZones = async () => {
    try {
      setZonesLoading(true);

      const response = await fetch(`${API}/monitoring/zones`);

      if (!response.ok) {
        throw new Error('Unable to load zones');
      }

      const data = await response.json();
      const incomingZones = (data.zones || []).map(normalizeZone);

      setZones(incomingZones);

      if (incomingZones.length && !selectedZone) {
        setSelectedZone(incomingZones[0].id);
      }
    } catch (err) {
      console.error('Failed to load monitoring zones:', err);
    } finally {
      setZonesLoading(false);
    }
  };

  useEffect(() => {
    loadZones();

    const interval = setInterval(loadZones, 10000);

    return () => clearInterval(interval);
  }, []);

  const applyZone = zone => {
    if (!zone) return;

    const latitude = Number(zone.coordinates?.[0] ?? zone.latitude ?? initial.latitude);
    const longitude = Number(zone.coordinates?.[1] ?? zone.longitude ?? initial.longitude);

    setForm(current => ({
      ...current,
      latitude,
      longitude,
      rainfall_24h: zone.rainfall24h,
      soil_moisture: Math.min(
        Math.max(
          zone.soilMoisture > 1
            ? zone.soilMoisture / 100
            : zone.soilMoisture,
          0
        ),
        1
      ),
      historical_landslides: Number(
        zone.historical_landslides ??
        zone.historicalLandslides ??
        0
      ),
    }));

    setResult(null);
    setError('');
  };

  const handleZoneChange = event => {
    const zoneId = event.target.value;
    setSelectedZone(zoneId);

    const zone = zones.find(item => item.id === zoneId);

    if (zone) {
      applyZone(zone);
    }
  };

  const submit = async event => {
    event.preventDefault();

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API}/risk/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || 'Risk prediction failed');
      }

      setResult(await response.json());
    } catch (err) {
      console.error('Risk prediction failed:', err);
      setError(
        'Risk engine unavailable. Start the Bhunetra backend on port 8000.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selected = zones.find(zone => zone.id === selectedZone);

  const color =
    result?.risk_level === 'CRITICAL'
      ? '#ff4d4d'
      : result?.risk_level === 'HIGH'
        ? '#ffb020'
        : result?.risk_level === 'MODERATE'
          ? '#00d4ff'
          : '#00ff9d';

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 lg:px-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-base-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyber/20 bg-cyber/10">
            <BrainCircuit size={20} className="text-cyber" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-sans text-xl font-bold tracking-tight text-text-primary">
                Risk Intelligence
              </h1>
              <span className="rounded border border-cyber/20 bg-cyber/5 px-2 py-0.5 font-mono text-[9px] tracking-widest text-cyber">
                XGBOOST
              </span>
            </div>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
              AI-powered landslide risk assessment
            </p>
          </div>
        </div>

        <div className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
          11 FEATURES · MONITORED NER
        </div>
      </div>
      <section className="mb-5 rounded-xl border border-base-border bg-base-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyber/20 bg-cyber/10">
              <MapPin size={16} className="text-cyber" />
            </div>
            <div>
              <div className="font-mono text-[10px] font-semibold tracking-widest text-text-primary">
                MONITORED ZONE
              </div>
              <div className="mt-0.5 text-[11px] text-text-muted">
                Select a NER zone to prefill the risk model
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadZones}
            disabled={zonesLoading}
            className="flex w-fit items-center gap-2 rounded-lg border border-base-border bg-base-panel px-3 py-2 font-mono text-[9px] tracking-widest text-text-secondary transition hover:border-cyber hover:text-cyber disabled:opacity-50"
          >
            <RefreshCw size={12} className={zonesLoading ? "animate-spin" : ""} />
            REFRESH
          </button>
        </div>


        <div className="mt-4">
          <select
            value={selectedZone}
            onChange={handleZoneChange}
            disabled={zonesLoading || !zones.length}
            className="w-full rounded-lg border border-base-border bg-base-panel px-3 py-3 text-sm text-text-primary outline-none transition focus:border-cyber focus:ring-1 focus:ring-cyber/20"
          >
            {zonesLoading ? (
              <option>Loading monitored zones...</option>
            ) : (
              <>
                <option value="">Manual assessment</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name || zone.id} — {zone.riskScore.toFixed(1)}% risk
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {selected && (
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <div>
              <span className="text-text-muted">Live risk</span>
              <div className="font-mono text-text-primary">
                {selected.riskScore.toFixed(1)}%
              </div>
            </div>

            <div>
              <span className="text-text-muted">Rainfall</span>
              <div className="font-mono text-text-primary">
                {selected.rainfall24h.toFixed(1)} mm
              </div>
            </div>

            <div>
              <span className="text-text-muted">Soil moisture</span>
              <div className="font-mono text-text-primary">
                {selected.soilMoisture > 1
                  ? selected.soilMoisture.toFixed(1)
                  : `${(selected.soilMoisture * 100).toFixed(1)}%`}
              </div>
            </div>

            <div>
              <span className="text-text-muted">Historical events</span>
              <div className="font-mono text-text-primary">
                {selected.historical_landslides ??
                  selected.historicalLandslides ??
                  0}
              </div>
            </div>
          </div>
        )}
      </section>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <form
          onSubmit={submit}
          className="rounded-xl border border-base-border bg-base-card p-5 lg:col-span-2"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map(([key, label]) => (
              <label
                key={key}
                className="font-mono text-xxs text-text-secondary"
              >
                {label}

                <input
                  required
                  type="number"
                  step="any"
                  value={form[key]}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      [key]: Number(event.target.value),
                    }))
                  }
                  className="mt-1.5 w-full rounded border border-base-border bg-base-panel px-3 py-2 text-sm text-text-primary outline-none focus:border-cyber"
                />
              </label>
            ))}
          </div>

          <button
            disabled={loading}
            className="mt-5 w-full rounded-lg border border-cyber/40 bg-cyber/15 py-2.5 font-mono text-xs tracking-widest text-cyber hover:bg-cyber/25 disabled:opacity-50"
          >
            {loading ? 'ANALYSING...' : 'RUN XGBOOST RISK ANALYSIS'}
          </button>

          {error && (
            <p className="mt-3 font-mono text-xs text-critical">
              {error}
            </p>
          )}
        </form>

        <aside className="h-fit rounded-xl border border-base-border bg-base-card p-5">
          <div className="mb-4 flex items-center gap-2 font-mono text-xxs text-text-muted">
            <BrainCircuit size={13} className="text-cyber" />
            XGBOOST RESULT
          </div>

          {result ? (
            <>
              <div
                className="font-mono text-5xl font-bold"
                style={{ color }}
              >
                {Number(result.risk_score).toFixed(2)}
                <span className="text-lg text-text-muted">/100</span>
              </div>

              <div
                className="mt-2 font-mono text-sm"
                style={{ color }}
              >
                {result.risk_level}
              </div>

              <div className="mt-5 text-xs text-text-secondary">
                Confidence{' '}
                <b className="text-cyber">
                  {(Number(result.confidence) * 100).toFixed(0)}%
                </b>
              </div>

              <div className="mt-4 font-mono text-xxs text-text-muted">
                RISK DRIVERS
              </div>

              <ul className="mt-2 space-y-2 font-sans text-xs text-text-secondary">
                {(result.drivers || []).map(driver => (
                  <li key={driver}>• {driver}</li>
                ))}
              </ul>

              <p className="mt-5 border-t border-base-border pt-4 font-sans text-sm text-text-primary">
                {result.recommendation}
              </p>
            </>
          ) : (
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Select a monitored zone or enter environmental conditions
              manually, then run an assessment. The result is generated by
              the Bhunetra XGBoost risk API.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

