export const SectionHeader = ({ title, subtitle, accent = '#00d4ff', children }) => (
  <div className="flex items-start justify-between gap-4 mb-4">
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        <div className="w-0.5 h-5 rounded-full" style={{ background: accent }} />
        <h2 className="font-sans font-semibold text-text-primary text-base">{title}</h2>
      </div>
      {subtitle && (
        <p className="font-mono text-xxs text-text-secondary tracking-wider ml-3.5">{subtitle}</p>
      )}
    </div>
    {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
  </div>
);
