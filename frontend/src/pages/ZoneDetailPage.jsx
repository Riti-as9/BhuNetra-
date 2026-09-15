import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle,
  Clock,
  CloudRain,
  Layers,
  MapPin,
  Mountain,
  PhoneCall,
  Radio,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getZoneById } from '../data/zones';
import { getAlertsByZone } from '../data/alerts';
import { getSensorsByZone } from '../data/sensors';
import { RiskBadge } from '../components/ui/RiskBadge';
import { GlowCard } from '../components/ui/GlowCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { BhuNetraBrand } from '../components/brand/BhuNetraBrand';
import {
  getRiskColor,
  formatTimeAgo,
} from '../utils/riskUtils';

const TerrainDigitalTwin = lazy(() =>
  import('../components/terrain/TerrainDigitalTwin').then((module) => ({
    default: module.TerrainDigitalTwin,
  }))
);

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const TerrainFallback = () => (
  <div className="h-80 flex items-center justify-center rounded-xl border border-base-border bg-base-card">
    <div className="text-center">
      <Activity size={20} className="mx-auto mb-2 text-cyber animate-pulse" />
      <span className="font-mono text-xs text-cyber tracking-widest">
        LOADING TERRAIN MODEL...
      </span>
    </div>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-base-border bg-base-card px-3 py-2 font-mono text-xs shadow-xl">
      <div className="mb-1 text-text-muted">{label}</div>

      {payload.map((item) => (
        <div key={item.name} style={{ color: item.color }}>
          {item.name}:{' '}
          <span className="font-semibold">
            {typeof item.value === 'number'
              ? item.value.toFixed(1)
              : item.value}
          </span>
          {item.name === 'riskScore' ? '%' : ''}
          {item.name === 'rainfall_mm' ? ' mm' : ''}
          {item.name === 'soilMoisture_pct' ? '%' : ''}
        </div>
      ))}
    </div>
  );
};

const SensorCard = ({ sensor }) => {
  const isOnline = sensor.status === 'online';
  const reading = sensor.reading || {};
  const isAlert =
    reading.value != null && reading.threshold != null
      ? reading.value > reading.threshold
      : false;

  const valueColor = !isOnline
    ? '#4a5568'
    : isAlert
      ? '#ff4d4d'
      : '#00ff9d';

  return (
    <div
      className="rounded-xl border border-base-border bg-base-card p-4"
      style={{
        borderColor: isAlert
          ? 'rgba(255,77,77,0.3)'
          : '#232b3a',
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[9px] text-text-muted">
            {sensor.id}
          </div>

          <div className="mt-1 font-sans text-sm font-medium text-text-primary">
            {sensor.name}
          </div>
        </div>

        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] ${
            isOnline
              ? isAlert
                ? 'border-critical/30 bg-critical/10 text-critical'
                : 'border-safe/30 bg-safe/10 text-safe'
              : 'border-base-border bg-base-hover text-text-muted'
          }`}
        >
          {isOnline
            ? isAlert
              ? '[!] ALERT'
              : 'ONLINE'
            : 'OFFLINE'}
        </span>
      </div>

      {isOnline && reading.value != null ? (
        <>
          <div
            className="mb-1 font-mono text-2xl font-bold"
            style={{ color: valueColor }}
          >
            {typeof reading.value === 'number'
              ? reading.value.toFixed(1)
              : reading.value}

            <span className="ml-1 text-sm text-text-muted">
              {reading.unit}
            </span>
          </div>

          {reading.threshold != null && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between font-mono text-[9px] text-text-muted">
                <span>0</span>
                <span>Threshold: {reading.threshold}</span>
              </div>

              <div className="h-1 overflow-hidden rounded-full bg-base-panel">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (reading.value /
                        (reading.threshold * 1.5)) *
                        100
                    )}%`,
                    background: isAlert
                      ? 'linear-gradient(90deg, #ffb020, #ff4d4d)'
                      : 'linear-gradient(90deg, #00d4ff, #00ff9d)',
                  }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-2 font-mono text-sm text-text-muted">
          No data
        </div>
      )}

      <div className="mt-3 border-t border-base-border pt-2 font-mono text-[9px] text-text-muted">
        Battery:{' '}
        <span
          className={
            sensor.battery_pct > 30
              ? 'text-safe'
              : 'text-critical'
          }
        >
          {sensor.battery_pct}%
        </span>

        <span className="mx-2">·</span>

        Signal:{' '}
        <span className="text-cyber">
          {sensor.signal_strength}%
        </span>
      </div>
    </div>
  );
};

const IncidentRow = ({ incident }) => {
  const colors = {
    catastrophic: '#ff4d4d',
    major: '#ff4d4d',
    moderate: '#ffb020',
    minor: '#ffb020',
  };

  const color = colors[incident.severity] || '#8892a4';

  return (
    <div className="flex gap-3 border-b border-base-border py-3 last:border-0">
      <div className="mt-1 shrink-0">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="font-mono text-[9px] font-semibold uppercase tracking-widest"
            style={{ color }}
          >
            {incident.severity}
          </span>

          <span className="font-mono text-[9px] text-text-muted">
            ·
          </span>

          <span className="font-sans text-xs text-text-secondary">
            {incident.type}
          </span>

          <span className="ml-auto font-mono text-[9px] text-text-muted">
            {incident.date}
          </span>
        </div>

        <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">
          {incident.description}
        </p>

        {incident.casualties > 0 && (
          <span className="mt-1 block font-mono text-[9px] text-critical">
            [!] {incident.casualties} casualties reported
          </span>
        )}
      </div>
    </div>
  );
};

const MetricRow = ({ label, value, color, alert }) => (
  <div className="flex items-center gap-3">
    <div className="w-3 shrink-0">
      {alert && (
        <AlertTriangle
          size={10}
          style={{ color }}
        />
      )}
    </div>

    <span className="w-36 font-mono text-[9px] text-text-muted">
      {label}
    </span>

    <span
      className="font-mono text-xs font-semibold"
      style={{ color }}
    >
      {value}
    </span>
  </div>
);

const Legend = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div
      className="h-px w-3"
      style={{ backgroundColor: color }}
    />

    <span className="font-mono text-[9px] text-text-muted">
      {label}
    </span>
  </div>
);

const ActionButton = ({ icon: Icon, label, color, desc }) => (
  <button
    type="button"
    className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all hover:brightness-110"
    style={{
      borderColor: `${color}30`,
      background: `${color}08`,
      color,
    }}
  >
    <Icon size={14} className="mt-0.5 shrink-0" />

    <div>
      <div className="font-sans text-xs font-semibold">
        {label}
      </div>

      <div className="mt-0.5 font-mono text-[9px] text-text-muted">
        {desc}
      </div>
    </div>
  </button>
);

export const ZoneDetailPage = () => {
  const { zoneId } = useParams();
  const navigate = useNavigate();

  const [liveZone, setLiveZone] = useState(null);
  const [liveError, setLiveError] = useState('');

  const zone = getZoneById(zoneId);

  useEffect(() => {
    let active = true;

    const loadZone = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/monitoring/zones/${zoneId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const incoming = data.zone || data;

        if (!active) return;

        setLiveZone({
          ...incoming,
          riskScore:
            incoming.risk_score ??
            incoming.riskScore,

          riskLevel: (
            incoming.risk_level ??
            incoming.riskLevel ??
            ''
          ).toLowerCase(),

          rainfall_mm:
            incoming.rainfall_24h ??
            incoming.rainfall_mm,

          soilMoisture_pct:
            incoming.soil_moisture ??
            incoming.soilMoisture_pct,

          historical_landslides:
            incoming.historical_landslides ??
            incoming.historicalLandslides ??
            0,

          lastUpdated:
            incoming.generated_at ??
            incoming.lastUpdated,
        });

        setLiveError('');
      } catch (error) {
        if (active) {
          setLiveError(
            error.message ||
              'Live zone data unavailable'
          );
        }
      }
    };

    loadZone();

    const interval = window.setInterval(
      loadZone,
      10000
    );

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [zoneId]);

  if (!zone) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-text-secondary">
        Zone not found: {zoneId}
      </div>
    );
  }

  const displayZone = liveZone
    ? { ...zone, ...liveZone }
    : zone;

  const alerts = getAlertsByZone(displayZone.id);
  const sensors = getSensorsByZone(displayZone.id);
  const riskColor = getRiskColor(
    displayZone.riskLevel
  );

  const hist30 = displayZone.history.slice(-31);
  const hist7 = displayZone.history.slice(-8);

  const onlineSensors = sensors.filter(
    (sensor) => sensor.status === 'online'
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 lg:px-6">

      {/* Header */}
      <div className="mb-5 border-b border-base-border pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex min-w-0 items-start gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-1 flex shrink-0 items-center gap-1.5 font-mono text-xs text-text-secondary transition-colors hover:text-cyber"
            >
              <ArrowLeft size={14} />
              Dashboard
            </button>

            <div className="min-w-0">
              <div className="mb-2">
                <BhuNetraBrand
                  compact={false}
                  showSubtitle={false}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h1 className="font-sans text-xl font-bold leading-tight tracking-tight text-text-primary">
                    {zone.name}
                  </h1>

                  <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-text-muted">
                    {zone.state} · {zone.district} · {zone.id}
                  </div>
                </div>

                <RiskBadge
                  level={displayZone.riskLevel}
                  score={displayZone.riskScore}
                  size="lg"
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="rounded border border-safe/20 bg-safe/5 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-safe">
              Monitoring Active
            </span>

            <span className="rounded border border-cyber/20 bg-cyber/5 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-cyber">
              XGBoost · 11 Features
            </span>
          </div>
        </div>

        {liveError && (
          <div className="mt-3 rounded-lg border border-watch/20 bg-watch/5 px-3 py-2 font-mono text-[9px] text-watch">
            Live API warning: {liveError}
          </div>
        )}
      </div>

      {/* Zone overview */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: MapPin,
            label: 'Coordinates',
            value: `${zone.coordinates[0].toFixed(4)}°N, ${zone.coordinates[1].toFixed(4)}°E`,
          },
          {
            icon: Mountain,
            label: 'Elevation',
            value: `${zone.elevation_m.toLocaleString()} m`,
          },
          {
            icon: Layers,
            label: 'Terrain',
            value: zone.terrainType,
          },
          {
            icon: Clock,
            label: 'Last Updated',
            value: formatTimeAgo(
              displayZone.lastUpdated
            ),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-base-border bg-base-card p-3"
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              <Icon size={12} className="text-cyber" />

              <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
                {label}
              </span>
            </div>

            <div className="font-mono text-xs text-text-primary">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
            Zone Intelligence
          </div>

          <div className="mt-1 font-sans text-sm text-text-secondary">
            Current risk, monitoring context and terrain intelligence
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <span className="font-mono text-[9px] text-text-muted">
            DATA MODE
          </span>

          <span className="rounded border border-watch/20 bg-watch/5 px-2 py-1 font-mono text-[9px] text-watch">
            DEMO MONITORING
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Main column */}
        <div className="space-y-5 xl:col-span-2">

          {/* AI Risk */}
          <GlowCard
            riskLevel={displayZone.riskLevel}
            className="p-5"
          >
            <SectionHeader
              title="AI Risk Assessment"
              subtitle="XGBoost prediction · monitoring refresh 10s"
              accent={riskColor}
            />

            <div className="mb-6 grid gap-6 lg:grid-cols-[180px_1fr_auto] lg:items-end">

              <div>
                <div
                  className="font-mono text-5xl font-black leading-none"
                  style={{ color: riskColor }}
                >
                  {displayZone.riskScore}

                  <span className="text-2xl text-text-muted">
                    %
                  </span>
                </div>

                <div className="mt-2 font-mono text-[9px] uppercase tracking-widest text-text-muted">
                  Current Risk Score
                </div>

                <div
                  className="mt-2 inline-flex rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-widest"
                  style={{
                    color: riskColor,
                    borderColor: `${riskColor}30`,
                    background: `${riskColor}08`,
                  }}
                >
                  {displayZone.riskLevel}
                </div>
              </div>

              <div className="space-y-2">
                <MetricRow
                  label="Slope Stability"
                  value={zone.slopeStabilityIndex.toFixed(2)}
                  color={
                    zone.slopeStabilityIndex < 0.4
                      ? '#ff4d4d'
                      : '#ffb020'
                  }
                  alert={
                    zone.slopeStabilityIndex < 0.4
                  }
                />

                <MetricRow
                  label="Pore Water Pressure"
                  value={`${zone.poreWaterPressure_kPa} kPa`}
                  color={
                    zone.poreWaterPressure_kPa > 45
                      ? '#ff4d4d'
                      : '#00d4ff'
                  }
                  alert={
                    zone.poreWaterPressure_kPa > 45
                  }
                />

                <MetricRow
                  label="Vegetation Cover"
                  value={`${zone.vegetationCover_pct}%`}
                  color={
                    zone.vegetationCover_pct < 40
                      ? '#ffb020'
                      : '#00ff9d'
                  }
                />

                <MetricRow
                  label="Seismic Activity"
                  value={`M${zone.seismicActivity}`}
                  color={
                    zone.seismicActivity > 3
                      ? '#ff4d4d'
                      : '#a855f7'
                  }
                  alert={
                    zone.seismicActivity > 3
                  }
                />
              </div>

              <div className="rounded-xl border border-cyber/15 bg-cyber/5 p-4 lg:min-w-[150px]">
                <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-text-muted">
                  Model
                </div>

                <div className="font-mono text-lg font-bold text-cyber">
                  XGBoost
                </div>

                <div className="mt-1 font-mono text-[9px] leading-relaxed text-text-muted">
                  Probability-based risk classification
                </div>
              </div>
            </div>

            {/* Trend */}
            <div className="mb-2 flex items-center justify-between">
              <div className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
                30-Day Risk Trend
              </div>

              <div className="font-mono text-[9px] text-text-muted">
                Historical / reference trend
              </div>
            </div>

            <ResponsiveContainer width="100%" height={150}>
              <AreaChart
                data={hist30}
                margin={{
                  top: 4,
                  right: 4,
                  left: -28,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="riskGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={riskColor}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={riskColor}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#232b3a"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fill: '#4a5568',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono',
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fill: '#4a5568',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono',
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  content={<ChartTooltip />}
                />

                <ReferenceLine
                  y={70}
                  stroke="#ff4d4d"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />

                <ReferenceLine
                  y={40}
                  stroke="#ffb020"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />

                <Area
                  type="monotone"
                  dataKey="riskScore"
                  stroke={riskColor}
                  strokeWidth={2}
                  fill="url(#riskGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlowCard>

          {/* Sensor history */}
          <div className="rounded-xl border border-base-border bg-base-card p-5">
            <SectionHeader
              title="7-Day Monitoring History"
              subtitle="Rainfall · Soil Moisture"
            />

            <ResponsiveContainer width="100%" height={160}>
              <LineChart
                data={hist7}
                margin={{
                  top: 4,
                  right: 4,
                  left: -28,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#232b3a"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fill: '#4a5568',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono',
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{
                    fill: '#4a5568',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono',
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  content={<ChartTooltip />}
                />

                <Line
                  type="monotone"
                  dataKey="rainfall_mm"
                  stroke="#00d4ff"
                  strokeWidth={1.5}
                  dot={false}
                  name="rainfall_mm"
                />

                <Line
                  type="monotone"
                  dataKey="soilMoisture_pct"
                  stroke="#00ff9d"
                  strokeWidth={1.5}
                  dot={false}
                  name="soilMoisture_pct"
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-2 flex gap-4">
              <Legend
                color="#00d4ff"
                label="Rainfall (mm)"
              />

              <Legend
                color="#00ff9d"
                label="Soil Moisture (%)"
              />
            </div>

            <div className="mt-3 border-t border-base-border pt-2 font-mono text-[9px] text-watch">
              DEMO MONITORING DATA · Values are simulated for system demonstration.
            </div>
          </div>

          {/* Sensors */}
          <div>
            <div className="mb-3 flex items-end justify-between">
              <SectionHeader
                title={`Monitoring Sensors (${sensors.length})`}
                subtitle={`${onlineSensors} online`}
              />

              <span className="font-mono text-[9px] uppercase tracking-widest text-watch">
                Simulation
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sensors.map((sensor) => (
                <SensorCard
                  key={sensor.id}
                  sensor={sensor}
                />
              ))}
            </div>
          </div>

          {/* Terrain */}
          <div>
            <SectionHeader
              title="Terrain Digital Twin"
              subtitle="3D slope model · drag and scroll to explore"
              accent="#00d4ff"
            />

            <div className="overflow-hidden rounded-xl border border-base-border">
              <Suspense fallback={<TerrainFallback />}>
                <TerrainDigitalTwin
                  zoneName={zone.name}
                  riskLevel={zone.riskLevel}
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">

          {/* Affected areas */}
          <div className="rounded-xl border border-base-border bg-base-card p-4">
            <SectionHeader
              title="Affected Areas"
              subtitle="Potential exposure"
            />

            <div className="space-y-4">
              <div>
                <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-text-muted">
                  Villages
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {zone.affectedVillages.map(
                    (village) => (
                      <span
                        key={village}
                        className="rounded border border-base-border bg-base-hover px-2 py-1 font-mono text-[9px] text-text-secondary"
                      >
                        {village}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-text-muted">
                  Roads at Risk
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {zone.affectedRoads.map(
                    (road) => (
                      <span
                        key={road}
                        className="rounded border border-watch/30 bg-watch/10 px-2 py-1 font-mono text-[9px] text-watch"
                      >
                        {road}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active alerts */}
          {alerts.length > 0 && (
            <div className="rounded-xl border border-critical/20 bg-base-card p-4">
              <SectionHeader
                title="Active Alerts"
                subtitle="Current response context"
                accent="#ff4d4d"
              />

              <div className="space-y-3">
                {alerts
                  .filter(
                    (alert) =>
                      alert.status === 'active'
                  )
                  .map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-critical/20 bg-critical/5 p-3"
                    >
                      <div className="mb-1.5 flex items-start gap-2">
                        <AlertTriangle
                          size={13}
                          className="mt-0.5 shrink-0 text-critical"
                        />

                        <div className="font-mono text-[9px] font-semibold uppercase tracking-widest text-critical">
                          {alert.type.replace(
                            /_/g,
                            ' '
                          )}
                        </div>
                      </div>

                      <p className="mb-2 font-sans text-xs leading-relaxed text-text-secondary">
                        {alert.message}
                      </p>

                      <div className="font-mono text-[9px] text-watch">
                        → {alert.recommendedAction}
                      </div>

                      <div className="mt-2 border-t border-critical/10 pt-2 font-mono text-[9px] text-text-muted">
                        Confidence:{' '}
                        <span className="text-cyber">
                          {alert.aiConfidence}%
                        </span>

                        <span className="mx-2">
                          ·
                        </span>

                        {formatTimeAgo(
                          alert.timestamp
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {/* Response actions */}
          <div className="rounded-xl border border-base-border bg-base-card p-4">
            <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-text-muted">
              Response Actions
            </div>

            <div className="mb-3 font-sans text-xs text-text-secondary">
              Preparedness workflow · demonstration only
            </div>

            <div className="space-y-2">
              <ActionButton
                icon={Bell}
                label="Public Alert Workflow"
                color="#ff4d4d"
                desc="Simulate village warning escalation"
              />

              <ActionButton
                icon={PhoneCall}
                label="Authority Notification"
                color="#ffb020"
                desc="Simulate district response notification"
              />

              <ActionButton
                icon={Radio}
                label="Emergency Deployment"
                color="#00d4ff"
                desc="Simulate rapid-response request"
              />
            </div>
          </div>

          {/* Incident history */}
          <div className="rounded-xl border border-base-border bg-base-card p-4">
            <SectionHeader
              title="Incident History"
              subtitle="Historical reference"
            />

            {zone.incidentHistory.length > 0 ? (
              <div>
                {zone.incidentHistory.map(
                  (incident, index) => (
                    <IncidentRow
                      key={index}
                      incident={incident}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 py-3 text-safe">
                <CheckCircle size={14} />

                <span className="font-mono text-xs">
                  No recorded incidents
                </span>
              </div>
            )}
          </div>

          {/* System status */}
          <div className="rounded-xl border border-cyber/15 bg-cyber/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CloudRain
                size={14}
                className="text-cyber"
              />

              <span className="font-mono text-[9px] uppercase tracking-widest text-cyber">
                Monitoring Status
              </span>
            </div>

            <div className="space-y-2 font-mono text-[9px]">
              <div className="flex justify-between">
                <span className="text-text-muted">
                  Risk engine
                </span>

                <span className="text-safe">
                  XGBOOST READY
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-text-muted">
                  Refresh cycle
                </span>

                <span className="text-cyber">
                  10 SECONDS
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-text-muted">
                  Data source
                </span>

                <span className="text-watch">
                  DEMO SIMULATION
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-text-muted">
                  Historical inventory
                </span>

                <span className="text-text-primary">
                  GSI / 9,300 FEATURES
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-6 flex flex-col gap-2 border-t border-base-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
          BHUNETRA NER · PS#26001 · SIH 2026
        </div>

        <div className="font-mono text-[9px] text-text-muted">
          Zone monitoring · XGBoost · 11 features
        </div>
      </div>
    </div>
  );
};