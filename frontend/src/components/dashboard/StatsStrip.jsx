import { Activity, AlertTriangle, Radio, Users, MapPin } from 'lucide-react';
import { StatTile } from '../ui/StatTile';

export const StatsStrip = ({ zones, sensors }) => {
  const total    = zones.length;
  const critical = zones.filter(z => z.riskLevel === 'critical').length;
  const watch    = zones.filter(z => z.riskLevel === 'watch').length;
  const online   = sensors.filter(s => s.status === 'online').length;
  const offline  = sensors.filter(s => s.status === 'offline').length;
  const villages = zones.filter(z => z.riskLevel !== 'safe')
    .reduce((acc, z) => acc + z.affectedVillages.length, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <StatTile label="Zones Monitored"    value={total}             icon={MapPin}       color="#00d4ff" />
      <StatTile label="Critical Alerts"    value={critical}          icon={AlertTriangle} color="#ff4d4d" trend={1} />
      <StatTile label="Watch Zones"        value={watch}             icon={Activity}     color="#ffb020" />
      <StatTile label="Villages Advisory"  value={villages}          icon={Users}        color="#ffb020" sub="under active advisory" />
      <StatTile
        label="Sensors Online"
        value={`${online}/${online + offline}`}
        icon={Radio}
        color={offline > 0 ? '#ffb020' : '#00ff9d'}
        sub={offline > 0 ? `${offline} offline` : 'All nominal'}
      />
    </div>
  );
};
