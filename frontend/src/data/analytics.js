// Mock analytics data for Bhunetra NER charts

// Risk trend by state over 12 months
export const riskTrendByState = [
  { month: 'Oct', Assam: 42, Meghalaya: 38, Sikkim: 51, Arunachal: 35, Nagaland: 40, Manipur: 32, Mizoram: 29, Tripura: 22 },
  { month: 'Nov', Assam: 35, Meghalaya: 31, Sikkim: 44, Arunachal: 29, Nagaland: 33, Manipur: 27, Mizoram: 24, Tripura: 18 },
  { month: 'Dec', Assam: 28, Meghalaya: 25, Sikkim: 38, Arunachal: 23, Nagaland: 27, Manipur: 22, Mizoram: 19, Tripura: 14 },
  { month: 'Jan', Assam: 22, Meghalaya: 20, Sikkim: 31, Arunachal: 18, Nagaland: 21, Manipur: 17, Mizoram: 15, Tripura: 11 },
  { month: 'Feb', Assam: 24, Meghalaya: 22, Sikkim: 29, Arunachal: 20, Nagaland: 23, Manipur: 18, Mizoram: 16, Tripura: 12 },
  { month: 'Mar', Assam: 31, Meghalaya: 27, Sikkim: 35, Arunachal: 26, Nagaland: 29, Manipur: 23, Mizoram: 21, Tripura: 16 },
  { month: 'Apr', Assam: 44, Meghalaya: 41, Sikkim: 48, Arunachal: 38, Nagaland: 42, Manipur: 35, Mizoram: 32, Tripura: 25 },
  { month: 'May', Assam: 58, Meghalaya: 54, Sikkim: 62, Arunachal: 51, Nagaland: 56, Manipur: 47, Mizoram: 43, Tripura: 34 },
  { month: 'Jun', Assam: 71, Meghalaya: 67, Sikkim: 78, Arunachal: 63, Nagaland: 69, Manipur: 58, Mizoram: 54, Tripura: 45 },
  { month: 'Jul', Assam: 79, Meghalaya: 74, Sikkim: 86, Arunachal: 70, Nagaland: 76, Manipur: 64, Mizoram: 59, Tripura: 51 },
  { month: 'Aug', Assam: 74, Meghalaya: 71, Sikkim: 89, Arunachal: 66, Nagaland: 73, Manipur: 61, Mizoram: 56, Tripura: 47 },
  { month: 'Sep', Assam: 72, Meghalaya: 68, Sikkim: 91, Arunachal: 67, Nagaland: 73, Manipur: 56, Mizoram: 48, Tripura: 33 },
];

// Rainfall vs Risk correlation (last 30 days, NER average)
export const rainfallRiskCorrelation = Array.from({ length: 30 }, (_, i) => {
  const dayOffset = 29 - i;
  const date = new Date('2026-09-04');
  date.setDate(date.getDate() - dayOffset);
  const rainfall = Math.round(30 + Math.sin(i / 4) * 40 + Math.random() * 30);
  const risk = Math.round(30 + rainfall * 0.28 + Math.random() * 10);
  return {
    date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    rainfall_mm: rainfall,
    riskScore: Math.min(100, risk),
  };
});

// Model confidence over time
export const modelConfidenceHistory = [
  { month: 'Oct \'25', accuracy: 81, precision: 78, recall: 84, f1: 81 },
  { month: 'Nov \'25', accuracy: 83, precision: 80, recall: 85, f1: 82 },
  { month: 'Dec \'25', accuracy: 82, precision: 79, recall: 84, f1: 81 },
  { month: 'Jan \'26', accuracy: 85, precision: 83, recall: 87, f1: 85 },
  { month: 'Feb \'26', accuracy: 86, precision: 84, recall: 88, f1: 86 },
  { month: 'Mar \'26', accuracy: 87, precision: 85, recall: 89, f1: 87 },
  { month: 'Apr \'26', accuracy: 88, precision: 87, recall: 90, f1: 88 },
  { month: 'May \'26', accuracy: 89, precision: 88, recall: 91, f1: 89 },
  { month: 'Jun \'26', accuracy: 91, precision: 90, recall: 92, f1: 91 },
  { month: 'Jul \'26', accuracy: 90, precision: 89, recall: 92, f1: 90 },
  { month: 'Aug \'26', accuracy: 92, precision: 91, recall: 93, f1: 92 },
  { month: 'Sep \'26', accuracy: 93, precision: 92, recall: 94, f1: 93 },
];

// Historical landslide incidents by month
export const historicalIncidentsByMonth = [
  { month: 'Jan', incidents: 2, fatalities: 0, displacedFamilies: 12 },
  { month: 'Feb', incidents: 1, fatalities: 0, displacedFamilies: 5 },
  { month: 'Mar', incidents: 4, fatalities: 1, displacedFamilies: 28 },
  { month: 'Apr', incidents: 8, fatalities: 2, displacedFamilies: 67 },
  { month: 'May', incidents: 14, fatalities: 5, displacedFamilies: 142 },
  { month: 'Jun', incidents: 23, fatalities: 11, displacedFamilies: 287 },
  { month: 'Jul', incidents: 31, fatalities: 19, displacedFamilies: 412 },
  { month: 'Aug', incidents: 27, fatalities: 14, displacedFamilies: 356 },
  { month: 'Sep', incidents: 19, fatalities: 8, displacedFamilies: 241 },
  { month: 'Oct', incidents: 11, fatalities: 3, displacedFamilies: 134 },
  { month: 'Nov', incidents: 5, fatalities: 1, displacedFamilies: 48 },
  { month: 'Dec', incidents: 2, fatalities: 0, displacedFamilies: 18 },
];

// Risk distribution by state (for pie/bar)
export const riskDistributionByState = [
  { state: 'Sikkim', avgRisk: 64.5, zones: 2, criticalZones: 1 },
  { state: 'Assam', avgRisk: 71.5, zones: 2, criticalZones: 1 },
  { state: 'Meghalaya', avgRisk: 59.5, zones: 2, criticalZones: 1 },
  { state: 'Nagaland', avgRisk: 73, zones: 1, criticalZones: 1 },
  { state: 'Arunachal', avgRisk: 48, zones: 2, criticalZones: 0 },
  { state: 'Manipur', avgRisk: 56, zones: 1, criticalZones: 0 },
  { state: 'Mizoram', avgRisk: 48, zones: 1, criticalZones: 0 },
  { state: 'Tripura', avgRisk: 33, zones: 1, criticalZones: 0 },
];

// Factor weight for AI model explainer
export const modelFactors = [
  { factor: 'Rainfall (24h/72h)', weight: 32, color: '#00d4ff', description: 'Real-time rainfall from sensor network + IMD data fusion' },
  { factor: 'Soil Moisture', weight: 24, color: '#00ff9d', description: 'Volumetric soil water content measured by field sensors' },
  { factor: 'Slope Stability Index', weight: 21, color: '#ffb020', description: 'Geotechnical pore pressure and slope angle analysis' },
  { factor: 'Historical Incidents', weight: 13, color: '#ff4d4d', description: 'Spatial frequency of past landslide events in zone' },
  { factor: 'Seismic Activity', weight: 7, color: '#a855f7', description: 'Recent seismic events and ground vibration data' },
  { factor: 'Vegetation Loss', weight: 3, color: '#f97316', description: 'NDVI change detection from satellite imagery' },
];

// Summary KPIs
export const systemStats = {
  totalLandslidesPrevented: 14,
  successfulEarlyWarnings: 31,
  livesProtected: 2847,
  averageLeadTime_hours: 8.4,
  modelAccuracy_pct: 93,
  falsePositiveRate_pct: 4.2,
  zonesMonitored: 12,
  statesCovered: 8,
};
