// ─────────────────────────────────────────────────────────────
// Central mock data for all 4 new visual features
// ─────────────────────────────────────────────────────────────

// ── Feature 1: Globe ─────────────────────────────────────────
// NER bounding center (AI Command HQ marker)
export const COMMAND_CENTER = { lat: 26.2, lng: 92.8, label: 'Bhunetra HQ' };

// Zone dots on globe (subset with risk level)
export const GLOBE_ZONES = [
  { id: 'ZN-SK-001', lat: 27.8528, lng: 88.4252, name: 'North Sikkim Range',    risk: 'critical', score: 91 },
  { id: 'ZN-AS-001', lat: 25.6532, lng: 93.1028, name: 'Dima Hasao Highland',   risk: 'critical', score: 82 },
  { id: 'ZN-MG-001', lat: 25.5707, lng: 90.2167, name: 'Garo Hills West',       risk: 'critical', score: 74 },
  { id: 'ZN-NL-001', lat: 25.9091, lng: 93.7289, name: 'Naga Hills Dimapur',    risk: 'critical', score: 73 },
  { id: 'ZN-AR-001', lat: 27.2489, lng: 92.5541, name: 'West Kameng Slopes',    risk: 'watch',    score: 67 },
  { id: 'ZN-AS-002', lat: 26.0967, lng: 93.8525, name: 'Karbi Anglong Hills',   risk: 'watch',    score: 61 },
  { id: 'ZN-MN-001', lat: 25.2678, lng: 94.0165, name: 'Senapati Highland',     risk: 'watch',    score: 56 },
  { id: 'ZN-MZ-001', lat: 22.8892, lng: 92.7347, name: 'Lunglei Range South',   risk: 'watch',    score: 48 },
  { id: 'ZN-MG-002', lat: 25.5788, lng: 91.8933, name: 'Khasi Hills Central',   risk: 'watch',    score: 45 },
  { id: 'ZN-TR-001', lat: 23.8315, lng: 91.8732, name: 'Dhalai River Basin',    risk: 'safe',     score: 33 },
  { id: 'ZN-SK-002', lat: 27.2146, lng: 88.4120, name: 'South Sikkim Valley',   risk: 'safe',     score: 38 },
  { id: 'ZN-AR-002', lat: 27.0219, lng: 95.7321, name: 'Tirap-Changlang Belt',  risk: 'safe',     score: 29 },
];

// Active alert arcs: from command center to critical zones
export const GLOBE_ARCS = [
  { startLat: 26.2, startLng: 92.8, endLat: 27.8528, endLng: 88.4252, color: '#ff4d4d', label: 'ALERT → North Sikkim' },
  { startLat: 26.2, startLng: 92.8, endLat: 25.6532, endLng: 93.1028, color: '#ff4d4d', label: 'ALERT → Dima Hasao' },
  { startLat: 26.2, startLng: 92.8, endLat: 25.5707, endLng: 90.2167, color: '#ff4d4d', label: 'ALERT → Garo Hills' },
  { startLat: 26.2, startLng: 92.8, endLat: 25.9091, endLng: 93.7289, color: '#ff4d4d', label: 'ALERT → Naga Hills' },
  { startLat: 26.2, startLng: 92.8, endLat: 27.2489, endLng: 92.5541, color: '#ffb020', label: 'WATCH → W. Kameng' },
];

// ── Feature 2: AI Terminal Feed ───────────────────────────────
export const TERMINAL_SEQUENCES = [
  [
    { text: '> Running terrain stability analysis...', color: '#8892a4', delay: 0 },
    { text: '  Sensor SNS-SK-001 · Seismic: ', color: '#8892a4', delay: 600,
      append: { text: '4.7 M  ⚠ ABOVE THRESHOLD', color: '#ff4d4d' } },
    { text: '  Rainfall accumulation (48h): ', color: '#8892a4', delay: 1200,
      append: { text: '211 mm  [EXTREME]', color: '#ff4d4d' } },
    { text: '  Pore water pressure: ', color: '#8892a4', delay: 1800,
      append: { text: '67.8 kPa → CRITICAL', color: '#ff4d4d' } },
    { text: '  Slope stability index: ', color: '#8892a4', delay: 2400,
      append: { text: '0.21  [FAILURE IMMINENT]', color: '#ff4d4d' } },
    { text: '> LSTM inference complete. Risk score: ', color: '#00d4ff', delay: 3200,
      append: { text: '91%', color: '#ff4d4d' } },
    { text: '> Triggering CRITICAL alert for ZN-SK-001 (North Sikkim Range)', color: '#ff4d4d', delay: 4000 },
    { text: '> Notifying SDMA Sikkim · NDRF Bn-19 · DC North Sikkim...', color: '#ffb020', delay: 4800 },
    { text: '  [OK] 3 authorities notified · ETA response: 2.4h', color: '#00ff9d', delay: 5600 },
  ],
  [
    { text: '> Polling sensor network — 20/22 nodes online...', color: '#8892a4', delay: 0 },
    { text: '  SNS-AS-002 · Rainfall gauge: ', color: '#8892a4', delay: 700,
      append: { text: '147 mm/24h  [HIGH]', color: '#ffb020' } },
    { text: '  SNS-AS-001 · Pore pressure: ', color: '#8892a4', delay: 1400,
      append: { text: '48.2 kPa → ABOVE SAFE LIMIT', color: '#ff4d4d' } },
    { text: '  SNS-AS-003 · Slope tilt rate: ', color: '#8892a4', delay: 2100,
      append: { text: '4.7°/day  ⚠', color: '#ffb020' } },
    { text: '> Model update — ZN-AS-001 risk score: ', color: '#00d4ff', delay: 2900,
      append: { text: '82%  CRITICAL', color: '#ff4d4d' } },
    { text: '> Issuing debris-flow advisory for Haflong corridor...', color: '#ffb020', delay: 3700 },
    { text: '  NH-27 monitoring activated · patrol interval: 30 min', color: '#8892a4', delay: 4500 },
    { text: '  [OK] ASDMA alerted · PWD Assam on standby', color: '#00ff9d', delay: 5300 },
  ],
  [
    { text: '> IMD rainfall feed sync...', color: '#8892a4', delay: 0 },
    { text: '  Station TURA · 24h total: ', color: '#8892a4', delay: 600,
      append: { text: '183 mm  [RECORD HIGH]', color: '#ff4d4d' } },
    { text: '  Soil moisture (SNS-MG-001): ', color: '#8892a4', delay: 1200,
      append: { text: '91%  [SATURATED]', color: '#ff4d4d' } },
    { text: '  Cross-referencing historical slip catalog...', color: '#8892a4', delay: 1900 },
    { text: '  Match found: 2025-06-30 event (M=major) · same precursors', color: '#ffb020', delay: 2600 },
    { text: '> LSTM confidence: ', color: '#00d4ff', delay: 3400,
      append: { text: '91%  risk=74%  CRITICAL', color: '#ff4d4d' } },
    { text: '> Escalating ZN-MG-001 (Garo Hills West) to RED', color: '#ff4d4d', delay: 4100 },
    { text: '  [OK] MeSDMA EOC activated · 5 villages on advisory', color: '#00ff9d', delay: 4900 },
  ],
  [
    { text: '> Routine scan — all NER zones...', color: '#8892a4', delay: 0 },
    { text: '  Zones nominal: ZN-SK-002, ZN-AR-002, ZN-TR-001', color: '#00ff9d', delay: 800 },
    { text: '  Zones elevated: ZN-AR-001 (', color: '#8892a4', delay: 1500,
      append: { text: '67%', color: '#ffb020' }, suffix: ') · ZN-MN-001 (' },
    { text: '  Model heartbeat: ', color: '#8892a4', delay: 2200,
      append: { text: 'HEALTHY', color: '#00ff9d' }, suffix: ' · inference latency: 38ms' },
    { text: '  Sensor network uptime: ', color: '#8892a4', delay: 2900,
      append: { text: '99.1%', color: '#00ff9d' }, suffix: ' (30d)' },
    { text: '> No new CRITICAL threshold breaches detected', color: '#00ff9d', delay: 3700 },
    { text: '> Next full inference cycle in: ', color: '#00d4ff', delay: 4400,
      append: { text: '60s', color: '#00d4ff' } },
    { text: '  [SYSTEM] All watchdogs nominal · WebSocket relay active', color: '#8892a4', delay: 5100 },
  ],
];

// ── Feature 3: Terrain Digital Twin ──────────────────────────
// Sensor positions in local 3D space (x, z = horizontal, y = elevation)
export const TERRAIN_SENSORS = [
  { id: 'SNS-A', type: 'piezometer',   pos: [-2.1,  0.9,  0.8], color: '#00d4ff', alert: true,  label: 'Pore Pressure' },
  { id: 'SNS-B', type: 'raingauge',    pos: [ 0.5,  2.1,  1.2], color: '#00d4ff', alert: false, label: 'Rainfall' },
  { id: 'SNS-C', type: 'inclinometer', pos: [-0.8,  1.4, -0.3], color: '#ffb020', alert: true,  label: 'Slope Tilt' },
  { id: 'SNS-D', type: 'soilmoisture', pos: [ 1.8,  0.6, -1.1], color: '#00ff9d', alert: false, label: 'Soil Moisture' },
  { id: 'SNS-E', type: 'seismograph',  pos: [-1.5,  0.3, -2.0], color: '#a855f7', alert: false, label: 'Seismic' },
];

// Unstable slope region: set of vertex groups to highlight in red
export const TERRAIN_UNSTABLE_REGION = { center: [-1.8, 1.1, 0.5], radius: 1.6 };

// ── Feature 4: Data-Flow Network ─────────────────────────────
export const FLOW_NODES = {
  sensors: [
    { id: 's1', label: 'SNS-SK-001', sub: 'Seismograph',   x: 80,  y: 120 },
    { id: 's2', label: 'SNS-AS-001', sub: 'Piezometer',    x: 80,  y: 220 },
    { id: 's3', label: 'SNS-MG-001', sub: 'Rain Gauge',    x: 80,  y: 320 },
    { id: 's4', label: 'SNS-NL-002', sub: 'Inclinometer',  x: 80,  y: 420 },
    { id: 's5', label: 'IMD Feed',   sub: 'Rainfall API',  x: 80,  y: 520 },
  ],
  ai: { id: 'ai', label: 'AI ENGINE', sub: 'LSTM v3.1', x: 420, y: 320 },
  outputs: [
    { id: 'o1', label: 'SDMA Sikkim', sub: 'Authority',   x: 760, y: 120 },
    { id: 'o2', label: 'NDRF Bn-19',  sub: 'Response',    x: 760, y: 220 },
    { id: 'o3', label: 'Dashboard',   sub: 'Live UI',     x: 760, y: 320 },
    { id: 'o4', label: 'SMS Alert',   sub: 'Villages',    x: 760, y: 420 },
    { id: 'o5', label: 'ASDMA',       sub: 'Authority',   x: 760, y: 520 },
  ],
};

export const FLOW_EDGES = [
  // sensors → ai
  { from: 's1', to: 'ai', color: '#ff4d4d' },
  { from: 's2', to: 'ai', color: '#ff4d4d' },
  { from: 's3', to: 'ai', color: '#00d4ff' },
  { from: 's4', to: 'ai', color: '#ffb020' },
  { from: 's5', to: 'ai', color: '#00d4ff' },
  // ai → outputs
  { from: 'ai', to: 'o1', color: '#ff4d4d' },
  { from: 'ai', to: 'o2', color: '#ffb020' },
  { from: 'ai', to: 'o3', color: '#00d4ff' },
  { from: 'ai', to: 'o4', color: '#ffb020' },
  { from: 'ai', to: 'o5', color: '#00ff9d' },
];
