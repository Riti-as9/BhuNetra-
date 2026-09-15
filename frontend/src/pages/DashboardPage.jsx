import { useState, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers,
  Maximize2,
  Terminal,
  Radio,
  CloudRain,
  ScanSearch,
  Mountain,
  Network,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Database,
  Clock3,
  X,
} from 'lucide-react';

import { NERMap } from '../components/map/NERMap';
import { MapLegend } from '../components/map/MapLegend';
import { StatsStrip } from '../components/dashboard/StatsStrip';
import { ZoneListPanel } from '../components/dashboard/ZoneListPanel';
import { SensorFeed } from '../components/dashboard/SensorFeed';
import { LiveDot } from '../components/ui/LiveDot';
import { useLiveData } from '../hooks/useLiveData';
import { LocationSelector } from '../components/location/LocationSelector';
import { DashboardUtilityDrawer } from '../components/dashboard/DashboardUtilityDrawer';
import { TerrainDigitalTwin } from '../components/terrain/TerrainDigitalTwin';

// Lazy-load heavy components
const AITerminalFeed = lazy(() =>
  import('../components/terminal/AITerminalFeed').then((m) => ({
    default: m.AITerminalFeed,
  }))
);

const DataFlowNetwork = lazy(() =>
  import('../components/dataflow/DataFlowNetwork').then((m) => ({
    default: m.DataFlowNetwork,
  }))
);

const API =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const TerminalFallback = () => (
  <div className="h-full flex items-center justify-center bg-[#070b10]">
    <span className="font-mono text-xs text-cyber animate-pulse">
      ▶ LOADING AI TERMINAL...
    </span>
  </div>
);

const FlowFallback = () => (
  <div className="h-32 flex items-center justify-center border border-base-border rounded-xl">
    <span className="font-mono text-xs text-cyber animate-pulse">
      ▶ LOADING DATA-FLOW...
    </span>
  </div>
);

const TerrainFallback = () => (
  <div className="h-[420px] flex items-center justify-center bg-[#070b10] rounded-xl border border-base-border">
    <span className="font-mono text-xs text-cyber animate-pulse">
      ▶ LOADING TERRAIN MODEL...
    </span>
  </div>
);

export const DashboardPage = () => {
  const { zones, sensors, tickCount } = useLiveData(3500);

  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [alertMode, setAlertMode] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [utilityOpen, setUtilityOpen] = useState(null);

  const [syncData, setSyncData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const [scanData, setScanData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const navigate = useNavigate();

  const selectedZone =
    zones.find((zone) => zone.id === selectedZoneId) ||
    zones[0] ||
    null;

  const handleZoneClick = (id) => {
    setSelectedZoneId((prev) => (prev === id ? null : id));
  };

  const handleZoneDetail = (id) => {
    navigate(`/zone/${id}`);
  };

  // Called by AI terminal when it emits a critical line
  const handleNewAlert = useCallback((text) => {
    if (!text) return;

    const isCritical =
      /CRITICAL|FAILURE|IMMINENT/.test(text);

    setAlertMode(isCritical);

    if (isCritical) {
      setPulseCount((c) => c + 1);

      setTimeout(() => {
        setAlertMode(false);
      }, 8000);
    }
  }, []);

  // ---------------------------------------------------------
  // IMD SYNC
  // ---------------------------------------------------------
  const runIMDSync = async () => {
    setSyncing(true);
    setSyncError('');

    try {
      const response = await fetch(
        `${API}/monitoring/dashboard`
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned HTTP ${response.status}`
        );
      }

      const data = await response.json();

      setSyncData({
        ...data,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('IMD sync failed:', error);
      setSyncError(
        error?.message || 'Unable to connect to monitoring backend.'
      );
    } finally {
      setSyncing(false);
    }
  };

  // ---------------------------------------------------------
  // ROUTINE SCAN
  // ---------------------------------------------------------
  const runRoutineScan = async () => {
    setScanning(true);
    setScanError('');

    try {
      const response = await fetch(
        `${API}/monitoring/dashboard`
      );

      if (!response.ok) {
        throw new Error(
          `Scan request failed with HTTP ${response.status}`
        );
      }

      const data = await response.json();

      const critical = data.zones.filter(
        (zone) => zone.risk_level === 'critical'
      );

      const high = data.zones.filter(
        (zone) =>
          zone.risk_level === 'high' ||
          zone.risk_level === 'watch'
      );

      setScanData({
        completedAt: new Date(),
        totalZones: data.zones.length,
        criticalZones: critical.length,
        highRiskZones: high.length,
        activeAlerts: data.alerts?.length || 0,
        sensorsOnline: data.stats?.sensors_online || 0,
        sensorsTotal: data.stats?.sensors_total || 0,
        historicalEvents: data.stats?.historical_events || 0,
        dataMode: data.data_mode,
        topRiskZone:
          [...data.zones].sort(
            (a, b) => b.risk_score - a.risk_score
          )[0] || null,
      });
    } catch (error) {
      console.error('Routine scan failed:', error);
      setScanError(
        error?.message || 'Routine scan could not be completed.'
      );
    } finally {
      setScanning(false);
    }
  };

  const closeUtility = () => {
    setUtilityOpen(null);
  };

  return (
    <div className="flex flex-col min-h-[calc(100svh-120px)] overflow-y-auto overflow-x-hidden">

      {/* =====================================================
          TOP BAR
      ====================================================== */}
      <div className="flex-shrink-0 px-4 lg:px-6 py-3 border-b border-base-border flex items-center justify-between">

        <div className="flex items-center gap-3">
          <Layers size={16} className="text-cyber" />

          <div>
            <div className="font-sans font-semibold text-sm text-text-primary">
              Live Dashboard
            </div>

            <div className="font-mono text-xxs text-text-muted tracking-widest">
              NER COMMAND CENTER · REAL-TIME MONITORING
            </div>
          </div>
        </div>

        <LiveDot label="LIVE" />
      </div>

      {/* =====================================================
          KPI + LOCATION
      ====================================================== */}
      <div className="flex-shrink-0 px-3 sm:px-4 lg:px-6 py-2 border-b border-base-border bg-base-panel/20">

        <div className="space-y-2">

          <StatsStrip
            zones={zones}
            sensors={sensors}
          />

          <div className="w-full">
            <LocationSelector />
          </div>

        </div>
      </div>

      {/* =====================================================
          COMMAND TOOLS
      ====================================================== */}
      <div className="flex-shrink-0 px-3 lg:px-4 py-2 border-b border-base-border bg-base-panel/20">

        <div className="flex items-center justify-between gap-3">

          <div className="min-w-0">
            <div className="font-mono text-[9px] text-text-muted tracking-[0.2em] uppercase">
              Command Tools
            </div>

            <div className="hidden sm:block font-mono text-[8px] text-text-muted/60 mt-0.5">
              MONITOR · ANALYZE · VERIFY
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">

            {[
              {
                id: 'location',
                label: 'LOCATION',
                icon: MapPin,
              },
              {
                id: 'ai',
                label: 'AI LOG',
                icon: Terminal,
              },
              {
                id: 'sensors',
                label: 'SENSORS',
                icon: Radio,
              },
              {
                id: 'imd',
                label: 'IMD SYNC',
                icon: CloudRain,
              },
              {
                id: 'scan',
                label: 'ROUTINE SCAN',
                icon: ScanSearch,
              },
              {
                id: 'terrain',
                label: 'TERRAIN',
                icon: Mountain,
              },
              {
                id: 'flow',
                label: 'DATA FLOW',
                icon: Network,
              },
            ].map(({ id, label, icon: Icon }) => (

              <button
                key={id}
                type="button"
                onClick={() => {
                  setUtilityOpen(id);

                  if (id === 'imd' && !syncData) {
                    runIMDSync();
                  }

                  if (id === 'scan') {
                    runRoutineScan();
                  }
                }}
                className={`
                  flex-shrink-0
                  flex items-center gap-1.5
                  px-2.5 py-1.5
                  rounded-md
                  border
                  font-mono text-[9px]
                  tracking-wider uppercase
                  transition-all
                  ${
                    utilityOpen === id
                      ? 'border-cyber/40 bg-cyber/10 text-cyber'
                      : 'border-base-border bg-base-panel/60 text-text-secondary hover:text-cyber hover:border-cyber/30 hover:bg-cyber/5'
                  }
                `}
              >
                <Icon size={11} />
                <span>{label}</span>
              </button>

            ))}

          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN BODY
      ====================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[420px]">

        {/* ===================================================
            ZONE LIST
        ==================================================== */}
        <div className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 border-r border-base-border overflow-hidden">

          <div className="flex-1 overflow-hidden p-3">

            <ZoneListPanel
              zones={zones}
              selectedZoneId={selectedZoneId}
              onZoneClick={handleZoneClick}
            />

          </div>

          {selectedZoneId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 p-3 border-t border-base-border"
            >

              <button
                onClick={() =>
                  handleZoneDetail(selectedZoneId)
                }
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyber/30 bg-cyber/5 text-cyber font-mono text-xs tracking-widest hover:bg-cyber/10 transition-colors"
              >
                <Maximize2 size={13} />
                OPEN ZONE DETAIL
              </button>

            </motion.div>
          )}

        </div>

        {/* ===================================================
            MAP
        ==================================================== */}
        <div className="flex-1 relative min-w-0 min-h-[420px] lg:min-h-0 overflow-hidden">

          <NERMap
            zones={zones}
            selectedZoneId={selectedZoneId}
            onZoneClick={(id) => {

              handleZoneClick(id);

              if (window.innerWidth < 1024) {
                navigate(`/zone/${id}`);
              }

            }}
          />

          <MapLegend />

          {selectedZoneId &&
            (() => {

              const z = zones.find(
                (zone) => zone.id === selectedZoneId
              );

              if (!z) return null;

              return (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-3 right-3 z-[400] bg-base-card/95 border border-base-border rounded-lg p-3 w-52 backdrop-blur-sm cursor-pointer"
                  onClick={() =>
                    handleZoneDetail(z.id)
                  }
                >

                  <div className="font-mono text-xxs text-text-muted mb-1">
                    SELECTED ZONE
                  </div>

                  <div className="font-sans font-semibold text-sm text-text-primary">
                    {z.name}
                  </div>

                  <div className="font-mono text-xxs text-text-secondary">
                    {z.state}
                  </div>

                  <div className="flex items-center justify-between mt-2">

                    <span
                      className="font-mono text-xs font-bold"
                      style={{
                        color:
                          z.riskLevel === 'critical'
                            ? '#ff4d4d'
                            : z.riskLevel === 'watch'
                              ? '#ffb020'
                              : '#00ff9d',
                      }}
                    >
                      {z.riskScore}% RISK
                    </span>

                    <span className="font-mono text-xxs text-cyber">
                      → Detail
                    </span>

                  </div>

                </motion.div>
              );

            })()}

        </div>

        {/* ===================================================
            DESKTOP SIDE PANEL
        ==================================================== */}
        <div className="hidden border-l border-base-border overflow-hidden">

          <div className="flex-1 min-h-0 overflow-hidden border-b border-base-border">

            <Suspense fallback={<TerminalFallback />}>
              <AITerminalFeed
                onNewAlert={handleNewAlert}
              />
            </Suspense>

          </div>

          <div className="h-48 flex-shrink-0 overflow-hidden p-2">

            <SensorFeed
              sensors={sensors}
              tickCount={tickCount}
            />

          </div>

        </div>

      </div>

      {/* =====================================================
          MOBILE ZONE LIST
      ====================================================== */}
      <div className="lg:hidden flex-shrink-0 border-t border-base-border h-48 overflow-hidden">

        <div className="h-full p-3 overflow-y-auto">

          <ZoneListPanel
            zones={zones}
            selectedZoneId={selectedZoneId}
            onZoneClick={(id) =>
              navigate(`/zone/${id}`)
            }
          />

        </div>

      </div>

      {/* =====================================================
          LOCATION DRAWER
      ====================================================== */}
      <DashboardUtilityDrawer
        open={utilityOpen === 'location'}
        title="Location Intelligence"
        subtitle="Location-aware NER monitoring context"
        icon={MapPin}
        onClose={closeUtility}
      >

        <div className="space-y-3">

          <LocationSelector />

          <div className="rounded-lg border border-cyber/20 bg-cyber/5 p-3">

            <div className="flex items-center gap-2 text-cyber">
              <Activity size={14} />

              <span className="font-mono text-[10px] tracking-wider">
                LOCATION PIPELINE
              </span>
            </div>

            <p className="mt-2 font-mono text-[9px] leading-relaxed text-text-muted">
              Selected coordinates are resolved against the NER
              administrative boundaries and mapped to the nearest
              monitored BhuNetra zone.
            </p>

          </div>

        </div>

      </DashboardUtilityDrawer>

      {/* =====================================================
          AI DRAWER
      ====================================================== */}
      <DashboardUtilityDrawer
        open={utilityOpen === 'ai'}
        title="AI Inference Log"
        subtitle="Real-time model decisions and alerts"
        icon={Terminal}
        onClose={closeUtility}
      >

        <div className="h-[calc(100vh-90px)] min-h-[400px]">

          <Suspense fallback={<TerminalFallback />}>
            <AITerminalFeed
              onNewAlert={handleNewAlert}
            />
          </Suspense>

        </div>

      </DashboardUtilityDrawer>

      {/* =====================================================
          SENSOR DRAWER
      ====================================================== */}
      <DashboardUtilityDrawer
        open={utilityOpen === 'sensors'}
        title="Sensor Feed"
        subtitle="Live monitoring telemetry"
        icon={Radio}
        onClose={closeUtility}
      >

        <div className="h-full min-h-[400px]">

          <SensorFeed
            sensors={sensors}
            tickCount={tickCount}
          />

        </div>

      </DashboardUtilityDrawer>

      {/* =====================================================
          IMD SYNC DRAWER
      ====================================================== */}
      <DashboardUtilityDrawer
        open={utilityOpen === 'imd'}
        title="IMD Sync"
        subtitle="Monitoring data synchronization"
        icon={CloudRain}
        onClose={closeUtility}
      >

        <div className="space-y-3">

          {/* Status */}
          <div className="rounded-xl border border-base-border bg-base-card/50 p-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                {syncing ? (
                  <RefreshCw
                    size={16}
                    className="text-cyber animate-spin"
                  />
                ) : syncError ? (
                  <AlertTriangle
                    size={16}
                    className="text-red-400"
                  />
                ) : (
                  <CheckCircle2
                    size={16}
                    className="text-emerald-400"
                  />
                )}

                <span className="font-sans text-sm font-semibold text-text-primary">
                  {syncing
                    ? 'Synchronizing...'
                    : syncError
                      ? 'Sync Failed'
                      : 'Monitoring Backend Connected'}
                </span>

              </div>

              <button
                type="button"
                onClick={runIMDSync}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-md border border-base-border px-2.5 py-1.5 font-mono text-[9px] text-text-secondary hover:text-cyber hover:border-cyber/30 disabled:opacity-50"
              >
                <RefreshCw
                  size={11}
                  className={
                    syncing ? 'animate-spin' : ''
                  }
                />
                SYNC
              </button>

            </div>

            {syncError && (
              <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/5 p-2.5 font-mono text-[9px] text-red-300">
                {syncError}
              </div>
            )}

          </div>

          {/* Data source */}
          {syncData && (

            <>

              <div className="grid grid-cols-2 gap-2">

                <div className="rounded-lg border border-base-border bg-base-card/50 p-3">

                  <Database
                    size={14}
                    className="text-cyber"
                  />

                  <div className="mt-2 font-mono text-[8px] text-text-muted">
                    DATA MODE
                  </div>

                  <div className="mt-1 font-mono text-[10px] text-text-primary">
                    {syncData.data_mode}
                  </div>

                </div>

                <div className="rounded-lg border border-base-border bg-base-card/50 p-3">

                  <Activity
                    size={14}
                    className="text-emerald-400"
                  />

                  <div className="mt-2 font-mono text-[8px] text-text-muted">
                    SENSORS
                  </div>

                  <div className="mt-1 font-mono text-[10px] text-text-primary">
                    {syncData.stats?.sensors_online ?? 0}/
                    {syncData.stats?.sensors_total ?? 0}
                  </div>

                </div>

              </div>

              <div className="rounded-lg border border-base-border bg-base-card/50 p-3">

                <div className="flex items-center gap-2">

                  <Clock3
                    size={13}
                    className="text-text-muted"
                  />

                  <span className="font-mono text-[9px] text-text-muted">
                    LAST SYNCHRONIZATION
                  </span>

                </div>

                <div className="mt-2 font-mono text-[10px] text-text-primary">
                  {new Date(
                    syncData.syncedAt
                  ).toLocaleString()}
                </div>

              </div>

              <div className="rounded-lg border border-amber-400/15 bg-amber-400/[0.03] p-3">

                <div className="flex items-center gap-2 text-amber-300">

                  <CloudRain size={14} />

                  <span className="font-mono text-[9px] tracking-wider">
                    DATA SOURCE STATUS
                  </span>

                </div>

                <p className="mt-2 font-mono text-[9px] leading-relaxed text-text-muted">
                  Current dashboard response is marked as{' '}
                  <span className="text-text-primary">
                    {syncData.data_mode}
                  </span>
                  . This panel does not claim that live IMD
                  observations are being received unless an
                  external IMD integration is connected.
                </p>

              </div>

            </>

          )}

        </div>

      </DashboardUtilityDrawer>

      {/* =====================================================
          ROUTINE SCAN DRAWER
      ====================================================== */}
      <DashboardUtilityDrawer
        open={utilityOpen === 'scan'}
        title="Routine Scan"
        subtitle="Fresh zone risk verification"
        icon={ScanSearch}
        onClose={closeUtility}
      >

        <div className="space-y-3">

          <div className="rounded-xl border border-base-border bg-base-card/50 p-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                {scanning ? (
                  <RefreshCw
                    size={16}
                    className="text-cyber animate-spin"
                  />
                ) : (
                  <ScanSearch
                    size={16}
                    className="text-cyber"
                  />
                )}

                <span className="font-sans text-sm font-semibold text-text-primary">
                  {scanning
                    ? 'Running scan...'
                    : 'Risk verification scan'}
                </span>

              </div>

              <button
                type="button"
                onClick={runRoutineScan}
                disabled={scanning}
                className="flex items-center gap-1.5 rounded-md border border-cyber/30 bg-cyber/5 px-2.5 py-1.5 font-mono text-[9px] text-cyber hover:bg-cyber/10 disabled:opacity-50"
              >

                <RefreshCw
                  size={11}
                  className={
                    scanning
                      ? 'animate-spin'
                      : ''
                  }
                />

                RUN SCAN

              </button>

            </div>

            {scanning && (
              <div className="mt-4">

                <div className="h-1 overflow-hidden rounded-full bg-base-border">

                  <motion.div
                    className="h-full bg-cyber"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                    }}
                  />

                </div>

                <div className="mt-2 font-mono text-[8px] text-text-muted">
                  QUERYING MONITORED ZONES...
                </div>

              </div>
            )}

          </div>

          {scanError && (

            <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 font-mono text-[9px] text-red-300">
              {scanError}
            </div>

          )}

          {scanData && !scanning && (

            <>

              <div className="grid grid-cols-2 gap-2">

                <div className="rounded-lg border border-critical/20 bg-critical/5 p-3">

                  <div className="font-mono text-[8px] text-text-muted">
                    CRITICAL
                  </div>

                  <div className="mt-1 font-mono text-xl font-bold text-critical">
                    {scanData.criticalZones}
                  </div>

                </div>

                <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">

                  <div className="font-mono text-[8px] text-text-muted">
                    HIGH / WATCH
                  </div>

                  <div className="mt-1 font-mono text-xl font-bold text-amber-300">
                    {scanData.highRiskZones}
                  </div>

                </div>

                <div className="rounded-lg border border-base-border bg-base-card/50 p-3">

                  <div className="font-mono text-[8px] text-text-muted">
                    ACTIVE ALERTS
                  </div>

                  <div className="mt-1 font-mono text-xl font-bold text-text-primary">
                    {scanData.activeAlerts}
                  </div>

                </div>

                <div className="rounded-lg border border-base-border bg-base-card/50 p-3">

                  <div className="font-mono text-[8px] text-text-muted">
                    SENSOR HEALTH
                  </div>

                  <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
                    {scanData.sensorsOnline}/
                    {scanData.sensorsTotal}
                  </div>

                </div>

              </div>

              {scanData.topRiskZone && (

                <div className="rounded-xl border border-critical/20 bg-critical/5 p-4">

                  <div className="font-mono text-[8px] tracking-wider text-text-muted">
                    HIGHEST CURRENT RISK
                  </div>

                  <div className="mt-1 font-sans text-sm font-semibold text-text-primary">
                    {scanData.topRiskZone.name}
                  </div>

                  <div className="mt-1 font-mono text-[9px] text-text-secondary">
                    {scanData.topRiskZone.state}
                  </div>

                  <div className="mt-3 flex items-center justify-between">

                    <span className="font-mono text-2xl font-bold text-critical">
                      {scanData.topRiskZone.risk_score}%
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleZoneDetail(
                          scanData.topRiskZone.id
                        )
                      }
                      className="font-mono text-[9px] text-cyber hover:underline"
                    >
                      OPEN ZONE →
                    </button>

                  </div>

                </div>

              )}

              <div className="font-mono text-[8px] text-text-muted">
                Completed:{' '}
                {scanData.completedAt.toLocaleString()}
              </div>

            </>

          )}

        </div>

      </DashboardUtilityDrawer>

      {/* =====================================================
          TERRAIN DRAWER
      ====================================================== */}
      <DashboardUtilityDrawer
        open={utilityOpen === 'terrain'}
        title="Terrain Digital Twin"
        subtitle={
          selectedZone
            ? selectedZone.name
            : 'Monitored terrain model'
        }
        icon={Mountain}
        onClose={closeUtility}
      >

        <div className="space-y-3">

          <div className="grid grid-cols-3 gap-2">

            <div className="rounded-lg border border-base-border bg-base-card/50 p-2.5">

              <div className="font-mono text-[8px] text-text-muted">
                RISK
              </div>

              <div className="mt-1 font-mono text-sm font-bold text-critical">
                {selectedZone
                  ? `${selectedZone.riskScore}%`
                  : '--'}
              </div>

            </div>

            <div className="rounded-lg border border-base-border bg-base-card/50 p-2.5">

              <div className="font-mono text-[8px] text-text-muted">
                SLOPE
              </div>

              <div className="mt-1 font-mono text-sm font-bold text-text-primary">
                {selectedZone
                  ? `${selectedZone.slope}°`
                  : '--'}
              </div>

            </div>

            <div className="rounded-lg border border-base-border bg-base-card/50 p-2.5">

              <div className="font-mono text-[8px] text-text-muted">
                SOIL
              </div>

              <div className="mt-1 font-mono text-sm font-bold text-text-primary">
                {selectedZone
                  ? `${selectedZone.soilMoisture}%`
                  : '--'}
              </div>

            </div>

          </div>

          <div className="h-[520px] min-h-[420px]">

            <Suspense fallback={<TerrainFallback />}>

              <TerrainDigitalTwin
                zoneName={
                  selectedZone?.name || 'BhuNetra Zone'
                }
                riskLevel={
                  selectedZone?.riskLevel || 'critical'
                }
              />

            </Suspense>

          </div>

        </div>

      </DashboardUtilityDrawer>

      {/* =====================================================
          DATA FLOW DRAWER
      ====================================================== */}
      <DashboardUtilityDrawer
        open={utilityOpen === 'flow'}
        title="Data Flow Network"
        subtitle="BhuNetra monitoring pipeline"
        icon={Network}
        onClose={closeUtility}
      >

        <div className="min-h-[400px]">

          <Suspense fallback={<FlowFallback />}>

            <DataFlowNetwork
              alertMode={alertMode}
              pulseCount={pulseCount}
            />

          </Suspense>

        </div>

      </DashboardUtilityDrawer>

    </div>
  );
};

export default DashboardPage;