import { useState, useEffect } from 'react';
import { zones as fallbackZones } from '../data/zones';
import { sensors as fallbackSensors } from '../data/sensors';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
const toRiskLevel = level => level === 'critical' ? 'critical' : level === 'high' || level === 'moderate' ? 'watch' : 'safe';
const toZone = zone => ({
  ...zone,
  coordinates: zone.coordinates,
  riskScore: zone.risk_score,
  riskLevel: toRiskLevel(zone.risk_level),
  rainfall_mm: zone.rainfall_24h,
  soilMoisture_pct: zone.soil_moisture,
  slopeStabilityIndex: Math.max(.15, Number((1 - zone.slope / 100).toFixed(2))),
  seismicActivity: 0,
  affectedVillages: [],
  lastUpdated: new Date().toISOString(),
});

// Polls the Bhunetra command-centre API. Local fixtures remain only as an
// offline-development fallback, so the Bhunetra dashboard stays usable.
export const useLiveData = (intervalMs = 15000) => {
  const [zones, setZones] = useState(fallbackZones);
  const [sensors, setSensors] = useState(fallbackSensors);
  const [lastTick, setLastTick] = useState(Date.now());
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/monitoring/dashboard`);
        if (!response.ok) throw new Error('Monitoring API unavailable');
        const data = await response.json();
        if (!active) return;
        setZones((data.zones || []).map(toZone));
        const online = data.stats?.sensors_online || 0;
        const total = data.stats?.sensors_total || online;
        setSensors(Array.from({ length: total }, (_, index) => ({
          id: `API-SNS-${String(index + 1).padStart(3, '0')}`,
          name: 'Bhunetra sensor feed', type: 'raingauge', zoneId: data.zones?.[index % Math.max(data.zones.length, 1)]?.id,
          status: index < online ? 'online' : 'offline', battery_pct: 100, signal_strength: 100,
          lastPing: data.generated_at, reading: { value: null, unit: 'mm', threshold: 150 },
        })));
        setLastTick(Date.now());
        setTickCount(value => value + 1);
      } catch { /* keep local fallback visible if the API is stopped */ }
    };
    load();
    const timer = setInterval(load, intervalMs);
    return () => { active = false; clearInterval(timer); };
  }, [intervalMs]);
  return { zones, sensors, lastTick, tickCount };
};
