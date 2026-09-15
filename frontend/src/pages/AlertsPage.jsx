import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Filter,
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { alerts as fallbackAlerts } from '../data/alerts';
import { RiskBadge } from '../components/ui/RiskBadge';
import { LiveDot } from '../components/ui/LiveDot';
import { formatTimestamp, formatTimeAgo, getRiskColor } from '../utils/riskUtils';

const NER_STATES = [
  'Assam',
  'Meghalaya',
  'Sikkim',
  'Arunachal Pradesh',
  'Nagaland',
  'Manipur',
  'Mizoram',
  'Tripura',
];

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const toAlert = alert => ({
  ...alert,
  zoneId: alert.zone_id ?? alert.zoneId,
  zoneName: alert.zone_name ?? alert.zoneName ?? 'Unknown Zone',
  severity:
    String(alert.severity || 'watch').toLowerCase() === 'high'
      ? 'watch'
      : String(alert.severity || 'watch').toLowerCase(),
  type: String(
    alert.title ?? alert.type ?? 'LANDSLIDE RISK'
  )
    .replace(/\s+/g, '_')
    .toUpperCase(),
  recommendedAction:
    alert.recommended_action ??
    alert.recommendedAction ??
    'Continue monitoring the affected zone.',
  aiConfidence: Number(
    alert.confidence ??
    alert.aiConfidence ??
    0
  ),
  timestamp: alert.timestamp ?? new Date().toISOString(),
  status:
    String(alert.status || 'active').toLowerCase() === 'active'
      ? 'active'
      : 'resolved',
  affectedAreas: alert.affected_areas ?? alert.affectedAreas ?? [],
  triggerFactors: alert.trigger_factors ?? alert.triggerFactors ?? [],
  notifiedAuthorities:
    alert.notified_authorities ?? alert.notifiedAuthorities ?? [],
});

const AlertCard = ({ alert, navigate }) => {
  const [expanded, setExpanded] = useState(false);
  const color = getRiskColor(alert.severity);
  const isActive = alert.status === 'active';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="overflow-hidden rounded-xl border transition-all duration-200"
      style={{
        borderColor: isActive ? `${color}40` : '#232b3a',
        background: isActive ? `${color}05` : '#161b22',
      }}
    >
      {isActive && (
        <div
          className="h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
          }}
        />
      )}

      <div className="p-4">
        <div className="mb-3 flex items-start gap-3">
          <div
            className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}30`,
            }}
          >
            {isActive ? (
              <AlertTriangle size={15} style={{ color }} />
            ) : (
              <CheckCircle size={15} className="text-text-muted" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <RiskBadge level={alert.severity} />

              <span className="font-mono text-xxs text-text-muted">
                {alert.id}
              </span>

              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-xxs ${
                  isActive
                    ? 'border-safe/30 bg-safe/10 text-safe'
                    : 'border-base-border bg-base-hover text-text-muted'
                }`}
              >
                {isActive ? '● ACTIVE' : '✓ RESOLVED'}
              </span>

              <span className="ml-auto flex items-center gap-1 font-mono text-xxs text-text-muted">
                <Clock size={10} />
                {formatTimeAgo(alert.timestamp)}
              </span>
            </div>

            <div className="mb-0.5 font-sans text-sm font-semibold text-text-primary">
              {alert.zoneName}
            </div>

            <div className="font-mono text-xxs text-text-muted">
              {alert.state} · {alert.type.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        <p className="mb-3 font-sans text-sm leading-relaxed text-text-secondary">
          {alert.message}
        </p>

        <div className="mb-3 flex items-start gap-2 rounded-lg border border-base-border bg-base-panel p-3">
          <span className="mt-0.5 flex-shrink-0 font-mono text-xxs text-watch">
            REC:
          </span>

          <p className="font-sans text-xs text-text-secondary">
            {alert.recommendedAction}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xxs text-cyber">
            AI Confidence: {alert.aiConfidence.toFixed(0)}%
          </span>

          <div className="flex items-center gap-3">
            {alert.zoneId && (
              <button
                onClick={() => navigate(`/zone/${alert.zoneId}`)}
                className="flex items-center gap-1 font-mono text-xxs text-cyber transition-colors hover:text-white"
              >
                <ExternalLink size={11} />
                Zone Detail
              </button>
            )}

            <button
              onClick={() => setExpanded(value => !value)}
              className="flex items-center gap-1 font-mono text-xxs text-text-muted transition-colors hover:text-text-primary"
            >
              {expanded ? (
                <ChevronUp size={11} />
              ) : (
                <ChevronDown size={11} />
              )}
              {expanded ? 'Less' : 'More'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 border-t border-base-border pt-4">
                <div>
                  <div className="mb-1.5 font-mono text-xxs tracking-widest text-text-muted">
                    AFFECTED AREAS
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {alert.affectedAreas.length ? (
                      alert.affectedAreas.map(area => (
                        <span
                          key={area}
                          className="rounded border border-base-border bg-base-hover px-2 py-0.5 font-mono text-xxs text-text-secondary"
                        >
                          {area}
                        </span>
                      ))
                    ) : (
                      <span className="font-mono text-xxs text-text-muted">
                        No affected areas reported
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 font-mono text-xxs tracking-widest text-text-muted">
                    TRIGGER FACTORS
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {alert.triggerFactors.length ? (
                      alert.triggerFactors.map(factor => (
                        <span
                          key={factor}
                          className="rounded px-2 py-0.5 font-mono text-xxs"
                          style={{
                            background: `${color}10`,
                            border: `1px solid ${color}30`,
                            color,
                          }}
                        >
                          {String(factor).replace(/_/g, ' ')}
                        </span>
                      ))
                    ) : (
                      <span className="font-mono text-xxs text-text-muted">
                        No trigger factors reported
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 font-mono text-xxs tracking-widest text-text-muted">
                    NOTIFIED AUTHORITIES
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {alert.notifiedAuthorities.length ? (
                      alert.notifiedAuthorities.map(authority => (
                        <span
                          key={authority}
                          className="rounded border border-cyber/20 bg-cyber/10 px-2 py-0.5 font-mono text-xxs text-cyber"
                        >
                          {authority}
                        </span>
                      ))
                    ) : (
                      <span className="font-mono text-xxs text-text-muted">
                        No authority notification recorded
                      </span>
                    )}
                  </div>
                </div>

                <div className="font-mono text-xxs text-text-muted">
                  Issued: {formatTimestamp(alert.timestamp)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const Select = ({ value, onChange, options, label }) => (
  <select
    value={value}
    onChange={event => onChange(event.target.value)}
    aria-label={label}
    className="cursor-pointer appearance-none rounded border border-base-border bg-base-card px-2 py-1.5 pr-6 font-mono text-xxs text-text-secondary outline-none transition-colors hover:border-cyber/40 focus:border-cyber/60"
  >
    {options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const AlertsPage = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    state: 'all',
    severity: 'all',
    status: 'all',
  });

  const [alerts, setAlerts] = useState(
    fallbackAlerts.map(toAlert)
  );

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/monitoring/alerts`);

      if (!response.ok) {
        throw new Error('Alert API request failed');
      }

      const data = await response.json();

      setAlerts((data.alerts || []).map(toAlert));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load live alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    const interval = setInterval(loadAlerts, 10000);

    return () => clearInterval(interval);
  }, []);

  const filtered = alerts
    .filter(alert => {
      if (
        filters.state !== 'all' &&
        alert.state !== filters.state
      ) {
        return false;
      }

      if (
        filters.severity !== 'all' &&
        alert.severity !== filters.severity
      ) {
        return false;
      }

      if (
        filters.status !== 'all' &&
        alert.status !== filters.status
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }

      return new Date(b.timestamp) - new Date(a.timestamp);
    });

  const activeCount = alerts.filter(
    alert => alert.status === 'active'
  ).length;

  const criticalCount = alerts.filter(
    alert =>
      alert.severity === 'critical' &&
      alert.status === 'active'
  ).length;

  const resolvedCount = alerts.filter(
    alert => alert.status === 'resolved'
  ).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 lg:px-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <AlertTriangle size={18} className="text-critical" />

            <h1 className="font-sans text-xl font-bold text-text-primary">
              Early Warning Alerts
            </h1>
          </div>

          <div className="font-mono text-xxs tracking-widest text-text-muted">
            {activeCount} active · {criticalCount} critical · AI-GENERATED WARNINGS
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden font-mono text-xxs text-text-muted sm:block">
              Updated {formatTimeAgo(lastUpdated)}
            </span>
          )}

          <button
            type="button"
            onClick={loadAlerts}
            disabled={loading}
            className="rounded border border-base-border p-1.5 text-text-muted transition-colors hover:border-cyber hover:text-cyber disabled:opacity-50"
            title="Refresh alerts"
          >
            <RefreshCw
              size={13}
              className={loading ? 'animate-spin' : ''}
            />
          </button>

          <LiveDot label="LIVE" color="#ff4d4d" />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Active', value: activeCount, color: '#00ff9d' },
          { label: 'Critical', value: criticalCount, color: '#ff4d4d' },
          { label: 'Resolved', value: resolvedCount, color: '#8892a4' },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-lg border border-base-border bg-base-card p-3 text-center"
          >
            <div
              className="font-mono text-2xl font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>

            <div className="mt-1 font-mono text-xxs tracking-widest text-text-muted">
              {stat.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-base-border bg-base-card p-3">
        <Filter size={13} className="text-text-muted" />

        <span className="font-mono text-xxs text-text-muted">
          FILTER:
        </span>

        <Select
          value={filters.state}
          onChange={value =>
            setFilters(current => ({
              ...current,
              state: value,
            }))
          }
          label="State filter"
          options={[
            { value: 'all', label: 'All States' },
            ...NER_STATES.map(state => ({
              value: state,
              label: state,
            })),
          ]}
        />

        <Select
          value={filters.severity}
          onChange={value =>
            setFilters(current => ({
              ...current,
              severity: value,
            }))
          }
          label="Severity filter"
          options={[
            { value: 'all', label: 'All Severities' },
            { value: 'critical', label: 'Critical' },
            { value: 'watch', label: 'Watch' },
          ]}
        />

        <Select
          value={filters.status}
          onChange={value =>
            setFilters(current => ({
              ...current,
              status: value,
            }))
          }
          label="Status filter"
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'resolved', label: 'Resolved' },
          ]}
        />

        <span className="ml-auto font-mono text-xxs text-text-muted">
          {filtered.length} results
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              navigate={navigate}
            />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-16 text-center font-mono text-sm text-text-muted">
            No alerts match the current filters.
          </div>
        )}
      </div>
    </div>
  );
};
