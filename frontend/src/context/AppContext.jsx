import { createContext, useContext, useState, useCallback } from 'react';
import { alerts as initialAlerts } from '../data/alerts';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [alerts] = useState(initialAlerts);
  const [alertFilters, setAlertFilters] = useState({ state: 'all', severity: 'all', status: 'all' });
  const [bootComplete, setBootComplete] = useState(false);

  const selectZone = useCallback((id) => setSelectedZoneId(id), []);
  const clearZone = useCallback(() => setSelectedZoneId(null), []);

  const filteredAlerts = alerts.filter(a => {
    if (alertFilters.state !== 'all' && a.state !== alertFilters.state) return false;
    if (alertFilters.severity !== 'all' && a.severity !== alertFilters.severity) return false;
    if (alertFilters.status !== 'all' && a.status !== alertFilters.status) return false;
    return true;
  });

  return (
    <AppContext.Provider value={{
      selectedZoneId, selectZone, clearZone,
      alerts, filteredAlerts, alertFilters, setAlertFilters,
      bootComplete, setBootComplete,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
