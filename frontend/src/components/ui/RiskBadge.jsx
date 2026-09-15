import { getRiskTailwind } from '../../utils/riskUtils';

export const RiskBadge = ({ level, score, size = 'sm' }) => {
  const tw = getRiskTailwind(level);
  const label = level?.toUpperCase() ?? 'UNKNOWN';
  const textSize = size === 'lg' ? 'text-sm' : 'text-xxs';
  const px = size === 'lg' ? 'px-3 py-1' : 'px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono ${textSize} font-semibold tracking-widest uppercase rounded border ${tw.text} ${tw.bg} ${tw.border} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse-cyber`}
        style={{ backgroundColor: 'currentColor' }} />
      {label}{score != null ? ` ${score}%` : ''}
    </span>
  );
};
