// Utility helpers for risk display logic

export const getRiskColor = (level) => {
  switch (level) {
    case 'critical': return '#ff4d4d';
    case 'watch':    return '#ffb020';
    case 'safe':     return '#00ff9d';
    default:         return '#8892a4';
  }
};

export const getRiskGlow = (level) => {
  switch (level) {
    case 'critical': return '0 0 16px rgba(255,77,77,0.5)';
    case 'watch':    return '0 0 16px rgba(255,176,32,0.5)';
    case 'safe':     return '0 0 16px rgba(0,255,157,0.5)';
    default:         return 'none';
  }
};

export const getRiskBg = (level) => {
  switch (level) {
    case 'critical': return 'rgba(255,77,77,0.1)';
    case 'watch':    return 'rgba(255,176,32,0.1)';
    case 'safe':     return 'rgba(0,255,157,0.08)';
    default:         return 'rgba(136,146,164,0.08)';
  }
};

export const getRiskBorder = (level) => {
  switch (level) {
    case 'critical': return 'rgba(255,77,77,0.3)';
    case 'watch':    return 'rgba(255,176,32,0.3)';
    case 'safe':     return 'rgba(0,255,157,0.3)';
    default:         return '#232b3a';
  }
};

export const getRiskTailwind = (level) => {
  switch (level) {
    case 'critical': return { text: 'text-critical', bg: 'bg-critical/10', border: 'border-critical/30' };
    case 'watch':    return { text: 'text-watch', bg: 'bg-watch/10', border: 'border-watch/30' };
    case 'safe':     return { text: 'text-safe', bg: 'bg-safe/10', border: 'border-safe/30' };
    default:         return { text: 'text-text-secondary', bg: 'bg-base-hover', border: 'border-base-border' };
  }
};

export const riskLevelFromScore = (score) => {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'watch';
  return 'safe';
};

export const formatTimestamp = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'Asia/Kolkata',
  }) + ' IST';
};

export const formatTimeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const severityRank = { critical: 3, watch: 2, safe: 1 };
