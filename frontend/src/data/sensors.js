// Mock sensor data for BhuNetra NER
// Each sensor has type, location, current reading, status

export const sensors = [
  // Assam - Dima Hasao
  { id: 'SNS-AS-001', zoneId: 'ZN-AS-001', type: 'piezometer', name: 'Pore Pressure Sensor A1', coordinates: [25.6421, 93.0912], elevation_m: 1812, status: 'online', battery_pct: 84, signal_strength: 92, lastPing: '2026-09-04T07:42:00Z', reading: { value: 48.2, unit: 'kPa', threshold: 45.0 } },
  { id: 'SNS-AS-002', zoneId: 'ZN-AS-001', type: 'raingauge', name: 'Rainfall Gauge A2', coordinates: [25.6612, 93.1134], elevation_m: 1789, status: 'online', battery_pct: 71, signal_strength: 88, lastPing: '2026-09-04T07:42:00Z', reading: { value: 147, unit: 'mm/24h', threshold: 120.0 } },
  { id: 'SNS-AS-003', zoneId: 'ZN-AS-001', type: 'inclinometer', name: 'Slope Inclinometer A3', coordinates: [25.6534, 93.0988], elevation_m: 1834, status: 'online', battery_pct: 63, signal_strength: 79, lastPing: '2026-09-04T07:42:00Z', reading: { value: 4.7, unit: '°/day', threshold: 3.5 } },
  // Assam - Karbi Anglong
  { id: 'SNS-AS-004', zoneId: 'ZN-AS-002', type: 'soilmoisture', name: 'Soil Moisture K1', coordinates: [26.0834, 93.8412], elevation_m: 1089, status: 'online', battery_pct: 91, signal_strength: 95, lastPing: '2026-09-04T07:39:00Z', reading: { value: 72, unit: '%', threshold: 80.0 } },
  { id: 'SNS-AS-005', zoneId: 'ZN-AS-002', type: 'raingauge', name: 'Rainfall Gauge K2', coordinates: [26.1123, 93.8698], elevation_m: 1102, status: 'offline', battery_pct: 12, signal_strength: 0, lastPing: '2026-09-03T14:22:00Z', reading: { value: null, unit: 'mm/24h', threshold: 100.0 } },
  // Meghalaya - Garo Hills
  { id: 'SNS-MG-001', zoneId: 'ZN-MG-001', type: 'raingauge', name: 'Rainfall Gauge G1', coordinates: [25.5612, 90.2089], elevation_m: 1498, status: 'online', battery_pct: 78, signal_strength: 87, lastPing: '2026-09-04T07:44:00Z', reading: { value: 183, unit: 'mm/24h', threshold: 150.0 } },
  { id: 'SNS-MG-002', zoneId: 'ZN-MG-001', type: 'piezometer', name: 'Pore Pressure G2', coordinates: [25.5789, 90.2231], elevation_m: 1521, status: 'online', battery_pct: 55, signal_strength: 81, lastPing: '2026-09-04T07:44:00Z', reading: { value: 52.1, unit: 'kPa', threshold: 45.0 } },
  // Meghalaya - Khasi Hills
  { id: 'SNS-MG-003', zoneId: 'ZN-MG-002', type: 'soilmoisture', name: 'Soil Moisture KH1', coordinates: [25.5698, 91.8821], elevation_m: 1934, status: 'online', battery_pct: 88, signal_strength: 93, lastPing: '2026-09-04T07:41:00Z', reading: { value: 63, unit: '%', threshold: 80.0 } },
  { id: 'SNS-MG-004', zoneId: 'ZN-MG-002', type: 'seismograph', name: 'Seismograph KH2', coordinates: [25.5912, 91.9041], elevation_m: 1978, status: 'online', battery_pct: 94, signal_strength: 97, lastPing: '2026-09-04T07:41:00Z', reading: { value: 0.8, unit: 'Richter', threshold: 3.0 } },
  // Sikkim - North
  { id: 'SNS-SK-001', zoneId: 'ZN-SK-001', type: 'seismograph', name: 'Seismograph NS1', coordinates: [27.8412, 88.4134], elevation_m: 3198, status: 'online', battery_pct: 69, signal_strength: 76, lastPing: '2026-09-04T07:45:00Z', reading: { value: 4.7, unit: 'Richter', threshold: 3.0 } },
  { id: 'SNS-SK-002', zoneId: 'ZN-SK-001', type: 'piezometer', name: 'Pore Pressure NS2', coordinates: [27.8601, 88.4378], elevation_m: 3267, status: 'online', battery_pct: 44, signal_strength: 67, lastPing: '2026-09-04T07:45:00Z', reading: { value: 67.8, unit: 'kPa', threshold: 55.0 } },
  { id: 'SNS-SK-003', zoneId: 'ZN-SK-001', type: 'raingauge', name: 'Rainfall Gauge NS3', coordinates: [27.8489, 88.4289], elevation_m: 3214, status: 'online', battery_pct: 82, signal_strength: 84, lastPing: '2026-09-04T07:45:00Z', reading: { value: 211, unit: 'mm/48h', threshold: 180.0 } },
  // Sikkim - South
  { id: 'SNS-SK-004', zoneId: 'ZN-SK-002', type: 'soilmoisture', name: 'Soil Moisture SS1', coordinates: [27.2089, 88.4034], elevation_m: 1812, status: 'online', battery_pct: 96, signal_strength: 99, lastPing: '2026-09-04T07:38:00Z', reading: { value: 55, unit: '%', threshold: 80.0 } },
  // Arunachal Pradesh
  { id: 'SNS-AR-001', zoneId: 'ZN-AR-001', type: 'inclinometer', name: 'Inclinometer WK1', coordinates: [27.2378, 92.5421], elevation_m: 2076, status: 'online', battery_pct: 73, signal_strength: 82, lastPing: '2026-09-04T07:40:00Z', reading: { value: 2.9, unit: '°/day', threshold: 3.5 } },
  { id: 'SNS-AR-002', zoneId: 'ZN-AR-001', type: 'raingauge', name: 'Rainfall Gauge WK2', coordinates: [27.2567, 92.5712], elevation_m: 2134, status: 'offline', battery_pct: 8, signal_strength: 0, lastPing: '2026-09-03T06:15:00Z', reading: { value: null, unit: 'mm/24h', threshold: 120.0 } },
  { id: 'SNS-AR-003', zoneId: 'ZN-AR-002', type: 'soilmoisture', name: 'Soil Moisture TC1', coordinates: [27.0134, 95.7198], elevation_m: 908, status: 'online', battery_pct: 87, signal_strength: 91, lastPing: '2026-09-04T07:36:00Z', reading: { value: 49, unit: '%', threshold: 80.0 } },
  // Nagaland
  { id: 'SNS-NL-001', zoneId: 'ZN-NL-001', type: 'piezometer', name: 'Pore Pressure DM1', coordinates: [25.8978, 93.7145], elevation_m: 1098, status: 'online', battery_pct: 61, signal_strength: 78, lastPing: '2026-09-04T07:43:00Z', reading: { value: 44.7, unit: 'kPa', threshold: 40.0 } },
  { id: 'SNS-NL-002', zoneId: 'ZN-NL-001', type: 'raingauge', name: 'Rainfall Gauge DM2', coordinates: [25.9212, 93.7432], elevation_m: 1167, status: 'online', battery_pct: 79, signal_strength: 85, lastPing: '2026-09-04T07:43:00Z', reading: { value: 159, unit: 'mm/24h', threshold: 120.0 } },
  // Manipur
  { id: 'SNS-MN-001', zoneId: 'ZN-MN-001', type: 'soilmoisture', name: 'Soil Moisture SP1', coordinates: [25.2589, 94.0078], elevation_m: 1756, status: 'online', battery_pct: 85, signal_strength: 89, lastPing: '2026-09-04T07:41:00Z', reading: { value: 74, unit: '%', threshold: 80.0 } },
  { id: 'SNS-MN-002', zoneId: 'ZN-MN-001', type: 'inclinometer', name: 'Inclinometer SP2', coordinates: [25.2789, 94.0289], elevation_m: 1812, status: 'online', battery_pct: 68, signal_strength: 82, lastPing: '2026-09-04T07:41:00Z', reading: { value: 1.8, unit: '°/day', threshold: 3.5 } },
  // Mizoram
  { id: 'SNS-MZ-001', zoneId: 'ZN-MZ-001', type: 'raingauge', name: 'Rainfall Gauge LR1', coordinates: [22.8812, 92.7234], elevation_m: 1318, status: 'online', battery_pct: 92, signal_strength: 94, lastPing: '2026-09-04T07:39:00Z', reading: { value: 89, unit: 'mm/24h', threshold: 120.0 } },
  // Tripura
  { id: 'SNS-TR-001', zoneId: 'ZN-TR-001', type: 'soilmoisture', name: 'Soil Moisture DH1', coordinates: [23.8234, 91.8645], elevation_m: 661, status: 'online', battery_pct: 97, signal_strength: 99, lastPing: '2026-09-04T07:37:00Z', reading: { value: 58, unit: '%', threshold: 80.0 } },
];

export const getSensorById = (id) => sensors.find(s => s.id === id);
export const getSensorsByZone = (zoneId) => sensors.filter(s => s.zoneId === zoneId);
export const getOnlineSensors = () => sensors.filter(s => s.status === 'online');
export const getOfflineSensors = () => sensors.filter(s => s.status === 'offline');

export const sensorTypeLabels = {
  piezometer: 'Pore Water Pressure',
  raingauge: 'Rainfall Gauge',
  inclinometer: 'Slope Inclinometer',
  soilmoisture: 'Soil Moisture',
  seismograph: 'Seismograph',
};

export const sensorTypeIcons = {
  piezometer: 'droplets',
  raingauge: 'cloud-rain',
  inclinometer: 'activity',
  soilmoisture: 'layers',
  seismograph: 'radio',
};
