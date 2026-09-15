import { motion } from 'framer-motion';

export const StatTile = ({
  label,
  value,
  sub,
  icon: Icon,
  color = '#00d4ff',
  trend
}) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    className="
      min-w-0
      h-[76px]
      flex items-center gap-3
      bg-base-panel
      border border-base-border
      rounded-lg
      px-3 py-2.5
      overflow-hidden
    "
    style={{
      boxShadow: `0 0 16px ${color}08`
    }}
  >
    {/* Icon */}
    {Icon && (
      <div
        className="
          flex-shrink-0
          w-8 h-8
          rounded-md
          flex items-center justify-center
        "
        style={{
          background: `${color}12`,
          border: `1px solid ${color}25`
        }}
      >
        <Icon size={16} style={{ color }} />
      </div>
    )}

    {/* Value + Label */}
    <div className="min-w-0 flex-1 overflow-hidden">

      {/* Main number */}
      <div
        className="
          font-mono
          text-xl
          font-bold
          leading-none
          tabular-nums
          truncate
        "
        style={{ color }}
      >
        {value}
      </div>

      {/* Label */}
      <div
        className="
          font-mono
          text-[9px]
          text-text-secondary
          tracking-wider
          uppercase
          mt-1
          truncate
        "
      >
        {label}
      </div>

      {/* Small description */}
      {sub && (
        <div
          className="
            font-mono
            text-[8px]
            text-text-muted
            mt-0.5
            truncate
          "
        >
          {sub}
        </div>
      )}

    </div>

    {/* Trend */}
    {trend != null && (
      <div
        className={`
          flex-shrink-0
          font-mono
          text-[10px]
          ${trend >= 0 ? 'text-critical' : 'text-safe'}
        `}
      >
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}
      </div>
    )}
  </motion.div>
);