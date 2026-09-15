export const BhuNetraBrand = ({
  compact = false,
  large = false,
  showSubtitle = true,
  className = '',
}) => {
  const logoSize = compact
    ? 'w-9 h-9'
    : large
      ? 'w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24'
      : 'w-10 h-10';

  const titleSize = large
    ? 'text-[20px] sm:text-[22px] lg:text-[26px] xl:text-[30px]'
    : 'text-[17px]';

  const subtitleSize = large
    ? 'text-[9px] sm:text-[10px] lg:text-[11px] xl:text-[12px]'
    : 'text-[9px]';

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/BhuNetra-navbar-logo.png"
        alt="BhuNetra"
        className={`object-contain flex-shrink-0 ${logoSize}`}
        draggable="false"
      />

      {!compact && (
        <div className={`${large ? 'ml-3 sm:ml-4' : 'ml-2.5'} min-w-0 leading-none`}>
          <div
            className={`font-sans font-bold tracking-wide text-text-primary ${titleSize}`}
          >
            BHUNETRA
          </div>

          {showSubtitle && (
            <div
              className={`mt-1.5 font-mono tracking-[0.22em] text-text-muted ${subtitleSize}`}
            >
              NER · SIH 2026
            </div>
          )}
        </div>
      )}
    </div>
  );
};
