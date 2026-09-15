import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export const DashboardUtilityDrawer = ({
  open,
  title,
  subtitle,
  icon: Icon,
  children,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[900] bg-black/50 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
            className="
              fixed right-0 top-0 bottom-0
              z-[1000]
              w-full sm:w-[420px] lg:w-[460px]
              bg-[#0b1017]
              border-l border-base-border
              shadow-2xl
              flex flex-col
              overflow-hidden
            "
          >
            <div className="flex-shrink-0 px-4 py-3 border-b border-base-border bg-[#0e141c]">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="w-9 h-9 rounded-lg bg-cyber/10 border border-cyber/20 flex items-center justify-center">
                    <Icon size={16} className="text-cyber" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="font-sans font-semibold text-sm text-text-primary truncate">
                    {title}
                  </div>

                  {subtitle && (
                    <div className="font-mono text-[9px] text-text-muted tracking-wider uppercase truncate mt-0.5">
                      {subtitle}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="
                    flex-shrink-0
                    w-8 h-8
                    rounded-md
                    border border-base-border
                    bg-base-panel/60
                    flex items-center justify-center
                    text-text-muted
                    hover:text-text-primary
                    hover:border-cyber/40
                    hover:bg-cyber/5
                    transition-colors
                  "
                  aria-label={`Close ${title}`}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
