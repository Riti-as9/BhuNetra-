// Blinking LIVE indicator dot

export const LiveDot = ({ label = 'LIVE', color = '#00ff9d' }) => (
  <span className="inline-flex items-center gap-1.5 font-mono text-xxs tracking-widest" style={{ color }}>
    <span
      className="inline-block w-2 h-2 rounded-full animate-pulse"
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
    />
    {label}
  </span>
);
