import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BhuNetraBrand } from '../components/brand/BhuNetraBrand';
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CloudRain,
  Database,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Waves,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

/*
 * DataFlowNetwork is loaded only when the Analytics page needs it.
 * The fallback supports both default and named exports.
 */
const DataFlowNetwork = lazy(async () => {
  const module = await import("../components/dataflow/DataFlowNetwork");

  return {
    default: module.default || module.DataFlowNetwork,
  };
});

/* -------------------------------------------------------
   Risk configuration
------------------------------------------------------- */

const RISK_COLORS = {
  low: "#22c55e",
  moderate: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

const RISK_ORDER = ["low", "moderate", "high", "critical"];

const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "10px",
  color: "#e2e8f0",
};

const GRID_STYLE = {
  stroke: "#263449",
  strokeDasharray: "3 3",
};

const AXIS_TICK = {
  fill: "#94a3b8",
  fontSize: 11,
};

/* -------------------------------------------------------
   Historical/reference datasets
   These are clearly separated from live monitoring data.
------------------------------------------------------- */

const HISTORICAL_RISK_DATA = [
  { month: "Jan", risk: 48 },
  { month: "Feb", risk: 51 },
  { month: "Mar", risk: 55 },
  { month: "Apr", risk: 59 },
  { month: "May", risk: 64 },
  { month: "Jun", risk: 61 },
  { month: "Jul", risk: 69 },
  { month: "Aug", risk: 73 },
  { month: "Sep", risk: 67 },
  { month: "Oct", risk: 62 },
  { month: "Nov", risk: 57 },
  { month: "Dec", risk: 53 },
];

const HISTORICAL_INCIDENT_DATA = [
  { month: "Jan", incidents: 18 },
  { month: "Feb", incidents: 21 },
  { month: "Mar", incidents: 24 },
  { month: "Apr", incidents: 28 },
  { month: "May", incidents: 34 },
  { month: "Jun", incidents: 31 },
  { month: "Jul", incidents: 39 },
  { month: "Aug", incidents: 44 },
  { month: "Sep", incidents: 37 },
  { month: "Oct", incidents: 29 },
  { month: "Nov", incidents: 25 },
  { month: "Dec", incidents: 20 },
];

/* -------------------------------------------------------
   Utility functions
------------------------------------------------------- */

function getRiskLevel(score) {
  const value = Number(score) || 0;

  if (value >= 80) return "critical";
  if (value >= 60) return "high";
  if (value >= 40) return "moderate";
  return "low";
}

function normalizeZone(zone) {
  const riskScore = Number(
    zone?.risk_score ??
      zone?.riskScore ??
      zone?.score ??
      0
  );

  const rainfall = Number(
    zone?.rainfall_24h ??
      zone?.rainfall_mm ??
      zone?.rainfall ??
      0
  );

  const soilMoisture = Number(
    zone?.soil_moisture ??
      zone?.soilMoisture_pct ??
      zone?.soil_moisture_pct ??
      0
  );

  const historicalLandslides = Number(
    zone?.historical_landslides ??
      zone?.historicalLandslides ??
      0
  );

  const riskLevel = (
    zone?.risk_level ??
    zone?.riskLevel ??
    getRiskLevel(riskScore)
  ).toLowerCase();

  const coordinates = Array.isArray(zone?.coordinates)
    ? zone.coordinates
    : [0, 0];

  return {
    ...zone,
    id: zone?.id ?? zone?.zone_id ?? "UNKNOWN",
    name: zone?.name ?? zone?.zone_name ?? "Unknown Zone",
    state: zone?.state ?? "NER",
    riskScore,
    riskLevel,
    rainfall,
    soilMoisture,
    historicalLandslides,
    latitude: Number(
      zone?.latitude ??
        zone?.lat ??
        coordinates?.[0] ??
        0
    ),
    longitude: Number(
      zone?.longitude ??
        zone?.lng ??
        coordinates?.[1] ??
        0
    ),
    generatedAt:
      zone?.generated_at ??
      zone?.lastUpdated ??
      zone?.updated_at ??
      null,
  };
}

async function fetchJSON(url, signal) {
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

function formatNumber(value, digits = 1) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toFixed(digits);
}

function formatTime(value) {
  if (!value) return "Unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/* -------------------------------------------------------
   Small reusable components
------------------------------------------------------- */

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass = "text-cyan-400",
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`rounded-xl bg-slate-900 p-3 ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      <div className="h-[320px]">
        {children}
      </div>
    </section>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      className="rounded-xl px-3 py-2 shadow-xl"
      style={TOOLTIP_STYLE}
    >
      <p className="mb-2 text-xs font-semibold text-white">
        {label}
      </p>

      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-5 text-xs"
        >
          <span className="text-slate-400">
            {entry.name}
          </span>

          <span className="font-semibold text-slate-100">
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionBadge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-400">
      {children}
    </span>
  );
}

/* -------------------------------------------------------
   Main Analytics Page
------------------------------------------------------- */

export function AnalyticsPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAnalytics = useCallback(async (manual = false) => {
    const controller = new AbortController();

    if (manual) {
      setRefreshing(true);
    }

    try {
      const data = await fetchJSON(
        `${API_BASE}/monitoring/zones`,
        controller.signal
      );

      const rawZones = Array.isArray(data)
        ? data
        : Array.isArray(data?.zones)
          ? data.zones
          : [];

      const normalized = rawZones.map(normalizeZone);

      setZones(normalized);
      setLastUpdated(
        data?.generated_at ??
          data?.generatedAt ??
          new Date().toISOString()
      );

      setError("");
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Analytics data error:", err);
        setError(
          "Unable to load live monitoring data. Showing available reference data."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;
      await loadAnalytics(false);
    };

    load();

    const interval = setInterval(() => {
      if (!cancelled) {
        load();
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadAnalytics]);

  /* -------------------------------------------------------
     Live KPI calculations
  ------------------------------------------------------- */

  const averageRisk = useMemo(() => {
    if (!zones.length) return 0;

    return (
      zones.reduce(
        (total, zone) => total + zone.riskScore,
        0
      ) / zones.length
    );
  }, [zones]);

  const highRiskZones = useMemo(
    () =>
      zones.filter(
        (zone) =>
          zone.riskLevel === "high" ||
          zone.riskLevel === "critical"
      ).length,
    [zones]
  );

  const criticalZones = useMemo(
    () =>
      zones.filter(
        (zone) => zone.riskLevel === "critical"
      ).length,
    [zones]
  );

  const averageRainfall = useMemo(() => {
    if (!zones.length) return 0;

    return (
      zones.reduce(
        (total, zone) => total + zone.rainfall,
        0
      ) / zones.length
    );
  }, [zones]);

  /* -------------------------------------------------------
     Risk distribution
  ------------------------------------------------------- */

  const riskDistribution = useMemo(() => {
    return RISK_ORDER.map((level) => ({
      level: level.toUpperCase(),
      count: zones.filter(
        (zone) => zone.riskLevel === level
      ).length,
      fill: RISK_COLORS[level],
    }));
  }, [zones]);

  /* -------------------------------------------------------
     Rainfall vs risk
  ------------------------------------------------------- */

  const rainfallRiskData = useMemo(() => {
    return [...zones]
      .sort((a, b) => b.riskScore - a.riskScore)
      .map((zone) => ({
        name:
          zone.name.length > 18
            ? `${zone.name.slice(0, 18)}…`
            : zone.name,
        rainfall: Number(zone.rainfall.toFixed(1)),
        risk: Number(zone.riskScore.toFixed(1)),
      }));
  }, [zones]);

  /* -------------------------------------------------------
     Highest-risk zone
  ------------------------------------------------------- */

  const highestRiskZone = useMemo(() => {
    if (!zones.length) return null;

    return [...zones].sort(
      (a, b) => b.riskScore - a.riskScore
    )[0];
  }, [zones]);

  /* -------------------------------------------------------
     Loading state
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <RefreshCw
                className="mx-auto mb-4 animate-spin text-cyan-400"
                size={32}
              />

              <p className="text-sm text-slate-400">
                Loading BhuNetra analytics...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     Page
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <header className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <BhuNetraBrand compact={false} showSubtitle={false} />

            <div className="hidden h-10 w-px bg-slate-800 sm:block" />

            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Analytics
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Live landslide risk intelligence for the North Eastern Region
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">
                Monitoring Active
              </span>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2">
              <span className="text-xs text-slate-400">
                Refresh: 10s
              </span>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* KPI cards */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-4 transition-all duration-200 hover:border-cyan-400/40">
              <KpiCard
                title="Average Risk"
                value={`${formatNumber(averageRisk)}%`}
                subtitle="Across monitored zones"
                icon={Activity}
                iconClass="text-cyan-400"
              />
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-slate-950/80 p-4 transition-all duration-200 hover:border-amber-400/40">
              <KpiCard
                title="High Risk Zones"
                value={highRiskZones}
                subtitle="Risk score ≥ 60"
                icon={AlertTriangle}
                iconClass="text-amber-400"
              />
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-slate-950/80 p-4 transition-all duration-200 hover:border-red-400/40">
              <KpiCard
                title="Critical Zones"
                value={criticalZones}
                subtitle="Risk score ≥ 80"
                icon={AlertTriangle}
                iconClass="text-red-400"
              />
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-slate-950/80 p-4 transition-all duration-200 hover:border-blue-400/40">
              <KpiCard
                title="Average Rainfall"
                value={`${formatNumber(averageRainfall)} mm`}
                subtitle="24-hour monitored rainfall"
                icon={CloudRain}
                iconClass="text-blue-400"
              />
            </div>

          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Zones</p>
              <p className="mt-1 text-lg font-semibold">{zones.length}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Highest Risk</p>
              <p className="mt-1 text-lg font-semibold text-red-400">
                {highestRiskZone
                  ? `${formatNumber(highestRiskZone.riskScore)}%`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Rainfall</p>
              <p className="mt-1 text-lg font-semibold text-blue-400">
                {highestRiskZone
                  ? `${formatNumber(highestRiskZone.rainfall)} mm`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Last Update</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">
                {formatTime(lastUpdated)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Highest-Risk Zone
              </p>

              <h3 className="mt-2 text-lg font-semibold text-white">
                {highestRiskZone?.name || "No data"}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {highestRiskZone?.state || "—"}
              </p>
            </div>

            <AlertTriangle size={22} className="text-red-400" />
          </div>

          <div className="mt-5">
            <span className="text-3xl font-bold text-red-400">
              {highestRiskZone
                ? `${formatNumber(highestRiskZone.riskScore)}%`
                : "—"}
            </span>

            <span className="ml-2 text-xs uppercase tracking-wider text-slate-500">
              risk score
            </span>
          </div>
        </div>
        {/* Current charts */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

          {/* Risk distribution */}
          <ChartCard
            title="Current Risk Distribution"
            subtitle="Live classification of monitored zones"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskDistribution}
                margin={{
                  top: 10,
                  right: 10,
                  left: -10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  {...GRID_STYLE}
                />

                <XAxis
                  dataKey="level"
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    fill: "rgba(148, 163, 184, 0.05)",
                  }}
                />

                <Bar
                  dataKey="count"
                  name="Zones"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={70}
                >
                  {riskDistribution.map((entry) => (
                    <Cell
                      key={entry.level}
                      fill={entry.fill}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Rainfall vs Risk */}
          <ChartCard
            title="Rainfall vs Risk"
            subtitle="Current 24-hour rainfall compared with live risk score"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={rainfallRiskData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -10,
                  bottom: 25,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  {...GRID_STYLE}
                />

                <XAxis
                  dataKey="name"
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />

                <YAxis
                  yAxisId="rainfall"
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Rainfall (mm)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  yAxisId="risk"
                  orientation="right"
                  domain={[0, 100]}
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Risk (%)",
                    angle: 90,
                    position: "insideRight",
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: "11px",
                    color: "#94a3b8",
                  }}
                />

                <Bar
                  yAxisId="rainfall"
                  dataKey="rainfall"
                  name="Rainfall"
                  fill="#06b6d4"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />

                <Line
                  yAxisId="risk"
                  type="monotone"
                  dataKey="risk"
                  name="Risk"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#f97316",
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Historical/reference section */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg">
          <div className="mb-5 flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-500" />
                <h2 className="text-base font-semibold tracking-tight text-white">
                  Historical Reference Trends
                </h2>
              </div>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Contextual reference patterns only — not live sensor measurements.
              </p>
            </div>

            <SectionBadge>
              HISTORICAL / REFERENCE
            </SectionBadge>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

            {/* Historical risk */}
            <ChartCard
              title="Historical Risk Trend"
              subtitle="Reference monthly risk pattern"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={HISTORICAL_RISK_DATA}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    vertical={false}
                    {...GRID_STYLE}
                  />

                  <XAxis
                    dataKey="month"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                  />

                  <Line
                    type="monotone"
                    dataKey="risk"
                    name="Risk"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{
                      r: 3,
                      fill: "#8b5cf6",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Historical incidents */}
            <ChartCard
              title="Historical Incident Reference"
              subtitle="Reference incident pattern"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={HISTORICAL_INCIDENT_DATA}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    vertical={false}
                    {...GRID_STYLE}
                  />

                  <XAxis
                    dataKey="month"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                  />

                  <Bar
                    dataKey="incidents"
                    name="Incidents"
                    fill="#64748b"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>

        {/* Model information */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10 text-purple-400">
                <BrainCircuit size={20} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight text-white">
                    AI Risk Model
                  </h2>
                  <SectionBadge>XGBOOST</SectionBadge>
                </div>

                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">
                  Environmental, terrain, rainfall, soil and historical-landslide features are combined to estimate landslide risk for monitored zones.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[520px]">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5">
                <p className="text-lg font-bold text-white">11</p>
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Features</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5">
                <p className="text-lg font-bold text-white">XGB</p>
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Model</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5">
                <p className="text-lg font-bold text-emerald-400">LIVE</p>
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Monitoring</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5">
                <p className="text-lg font-bold text-cyan-400">10s</p>
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Refresh</p>
              </div>
            </div>
          </div>
        </section>

        {/* Data flow */}
        {/* Data flow */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-400">
                <Waves size={20} />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-white">
                  BhuNetra Data Flow
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Monitoring pipeline and AI decision flow
                </p>
              </div>
            </div>

            <SectionBadge>
              PIPELINE
            </SectionBadge>
          </div>
          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                Loading data-flow visualization...
              </div>
            }
          >
            <DataFlowNetwork />
          </Suspense>
        </section>
        {/* Footer information */}
        <div className="flex flex-col gap-2 border-t border-slate-800 pt-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            BHUNETRA NER v2.4.1 · SIH 2026 · PS#26001
          </span>

          <span className="flex items-center gap-2">
            <TrendingUp size={14} />
            Analytics refresh · 10 seconds
          </span>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;









