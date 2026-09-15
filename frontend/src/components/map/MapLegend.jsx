export const MapLegend = () => (
  <div className="absolute bottom-3 left-3 z-[400] bg-base-card/90 border border-base-border rounded-lg px-3 py-2.5 backdrop-blur-sm">
    <div className="font-mono text-xxs text-text-muted tracking-widest mb-2">RISK LEVEL</div>
    <div className="space-y-1.5">
      {[
        { color: '#ff4d4d', label: 'CRITICAL', desc: '≥ 70%' },
        { color: '#ffb020', label: 'WATCH',    desc: '40–69%' },
        { color: '#00ff9d', label: 'SAFE',     desc: '< 40%' },
      ].map(({ color, label, desc }) => (
        <div key={label} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
          <span className="font-mono text-xxs" style={{ color }}>{label}</span>
          <span className="font-mono text-xxs text-text-muted">{desc}</span>
        </div>
      ))}
    </div>
  </div>
);
