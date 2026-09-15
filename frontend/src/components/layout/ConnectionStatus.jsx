import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

export const ConnectionStatus = () => {
  const { status, latency, packetsReceived } = useConnectionStatus();

  const configs = {
    connecting:   { icon: RefreshCw, color: '#ffb020', label: 'CONNECTING', pulse: true },
    connected:    { icon: Wifi,      color: '#00ff9d', label: 'WS LIVE',    pulse: false },
    reconnecting: { icon: WifiOff,   color: '#ff4d4d', label: 'RECONNECTING', pulse: true },
  };

  const cfg = configs[status];
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-3 font-mono text-xxs">
      {/* Packets counter */}
      {status === 'connected' && (
        <span className="hidden sm:flex items-center gap-1 text-text-muted">
          <span className="text-cyber">{packetsReceived.toLocaleString()}</span>
          <span>pkts</span>
        </span>
      )}
      {/* Latency */}
      {latency && status === 'connected' && (
        <span className="hidden sm:flex items-center gap-1 text-text-muted">
          <span style={{ color: latency < 30 ? '#00ff9d' : latency < 60 ? '#ffb020' : '#ff4d4d' }}>
            {latency}ms
          </span>
        </span>
      )}
      {/* Status badge */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded border"
        style={{
          color: cfg.color,
          borderColor: `${cfg.color}40`,
          background: `${cfg.color}10`,
        }}
      >
        <Icon
          size={11}
          className={cfg.pulse ? 'animate-spin' : ''}
          style={{ animationDuration: '1.5s' }}
        />
        <span className="tracking-widest">{cfg.label}</span>
      </div>
    </div>
  );
};
