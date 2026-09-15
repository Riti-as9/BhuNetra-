import { useState, useEffect } from 'react';

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace('/api/v1', '');

// Reports the actual Bhunetra backend health instead of simulating a socket.
export const useConnectionStatus = () => {
  const [status, setStatus] = useState('connecting');
  const [latency, setLatency] = useState(null);
  const [packetsReceived, setPacketsReceived] = useState(0);
  useEffect(() => {
    let active = true;
    const check = async () => {
      const started = performance.now();
      try {
        const response = await fetch(`${API_ROOT}/health`);
        if (!response.ok) throw new Error('Health check failed');
        if (active) { setStatus('connected'); setLatency(Math.round(performance.now() - started)); setPacketsReceived(n => n + 1); }
      } catch { if (active) setStatus('reconnecting'); }
    };
    check();
    const id = setInterval(check, 15000);
    return () => { active = false; clearInterval(id); };
  }, []);
  return { status, latency, packetsReceived };
};
