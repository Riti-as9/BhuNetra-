import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import createGlobe from 'cobe';
import { GLOBE_ZONES, GLOBE_ARCS, COMMAND_CENTER } from '../../data/features';

const RISK_COLORS = {
  critical: [1.0, 0.30, 0.30],   // #ff4d4d
  watch:    [1.0, 0.69, 0.125],  // #ffb020
  safe:     [0.0, 1.0,  0.616],  // #00ff9d
};

const toRiskHex = {
  critical: '#ff4d4d',
  watch:    '#ffb020',
  safe:     '#00ff9d',
};

export const InteractiveGlobe = () => {
  const canvasRef = useRef(null);
  const globeRef  = useRef(null);
  const phiRef    = useRef(1.8);   // rotation angle
  const thetaRef  = useRef(0.25);  // tilt
  const autoRef   = useRef(true);  // auto-rotate flag
  const pointerRef = useRef({ x: 0, down: false });
  const navigate  = useNavigate();

  const [hoveredZone, setHoveredZone] = useState(null);
  const [mousePos, setMousePos]       = useState({ x: 0, y: 0 });
  const [zoomed, setZoomed]           = useState(false);

  // Convert lat/lng to canvas coordinates for hit-testing
  const latLngToCanvas = useCallback((lat, lng, size) => {
    const phi   = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;
    const sinPhi = Math.sin(phi);
    const nx = -sinPhi * Math.cos(theta);
    const ny =  Math.cos(phi);
    const nz =  sinPhi * Math.sin(theta);

    // Apply globe rotation
    const rotatedPhi   = phiRef.current;
    const cosP = Math.cos(rotatedPhi), sinP = Math.sin(rotatedPhi);
    const rx = nx * cosP + nz * sinP;
    const rz = -nx * sinP + nz * cosP;

    // Apply tilt
    const rotatedTheta = thetaRef.current;
    const cosT = Math.cos(rotatedTheta), sinT = Math.sin(rotatedTheta);
    const ry2 = ny * cosT - rz * sinT;
    const rz2 = ny * sinT + rz * cosT;

    if (rz2 < 0) return null; // behind globe

    const cx = (rx  * 0.45 + 0.5) * size;
    const cy = (-ry2 * 0.45 + 0.5) * size;
    return { x: cx, y: cy };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const size = canvasRef.current.offsetWidth;

    // Markers: all zone dots + command center
    const markers = [
      // Command center (cyan, larger)
      {
        location: [COMMAND_CENTER.lat, COMMAND_CENTER.lng],
        size: 0.06,
        color: [0, 0.83, 1],
      },
      // Zone dots
      ...GLOBE_ZONES.map(z => ({
        location: [z.lat, z.lng],
        size: z.risk === 'critical' ? 0.05 : z.risk === 'watch' ? 0.04 : 0.03,
        color: RISK_COLORS[z.risk],
      })),
    ];

    // Arcs
    const arcs = GLOBE_ARCS.map(a => ({
      startLat: a.startLat, startLng: a.startLng,
      endLat:   a.endLat,   endLng:   a.endLng,
      arcAltitude: 0.3,
      color: [1, 0.3, 0.3, 0.8],
    }));

    let animFrame;
    globeRef.current = createGlobe(canvasRef.current, {
      devicePixelRatio: window.devicePixelRatio,
      width: size,
      height: size,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.2,
      scale: zoomed ? 1.8 : 1.2,
      mapSamples: 16000,
      mapBrightness: 3,
      baseColor: [0.05, 0.08, 0.12],
      markerColor: [0, 0.83, 1],
      glowColor: [0, 0.83, 1],
      markers,
      arcs,
      onRender(state) {
        if (autoRef.current) {
          phiRef.current += 0.003;
        }
        state.phi   = phiRef.current;
        state.theta = thetaRef.current;
        state.scale = zoomed ? 1.8 : 1.2;
      },
    });

    // Auto-zoom into NER after 3s
    const zoomTimer = setTimeout(() => {
      autoRef.current = false;
      // Animate phi to ~1.62 (pointing roughly toward NER)
      const targetPhi = 1.62;
      const targetTheta = 0.22;
      const startPhi = phiRef.current;
      const startTheta = thetaRef.current;
      const duration = 1800;
      const start = performance.now();
      const animateZoom = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        phiRef.current   = startPhi   + (targetPhi   - startPhi)   * ease;
        thetaRef.current = startTheta + (targetTheta - startTheta) * ease;
        if (t < 1) animFrame = requestAnimationFrame(animateZoom);
        else { setZoomed(true); autoRef.current = true; }
      };
      animFrame = requestAnimationFrame(animateZoom);
    }, 3000);

    return () => {
      clearTimeout(zoomTimer);
      cancelAnimationFrame(animFrame);
      globeRef.current?.destroy();
    };
  }, []); // eslint-disable-line

  // Mouse drag to rotate
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e) => {
      autoRef.current = false;
      pointerRef.current = { x: e.clientX, down: true };
    };
    const onUp = () => {
      pointerRef.current.down = false;
      setTimeout(() => { autoRef.current = true; }, 2000);
    };
    const onMove = (e) => {
      if (!pointerRef.current.down) return;
      const dx = e.clientX - pointerRef.current.x;
      phiRef.current += dx * 0.005;
      pointerRef.current.x = e.clientX;
    };
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;
      setMousePos({ x: e.clientX, y: e.clientY });

      // Hit-test zones
      const size = canvas.offsetWidth;
      const hit = GLOBE_ZONES.find(z => {
        const p = latLngToCanvas(z.lat, z.lng, size);
        if (!p) return false;
        // Scale canvas coords to actual rect size
        const scale = rect.width / size;
        const dx = mx - p.x * scale;
        const dy = my - p.y * scale;
        return Math.sqrt(dx * dx + dy * dy) < 18;
      });
      setHoveredZone(hit ?? null);
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    };
    const onClick = () => {
      if (hoveredZone) navigate(`/zone/${hoveredZone.id}`);
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('click', onClick);
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onUp);
      canvas.removeEventListener('click', onClick);
    };
  }, [hoveredZone, latLngToCanvas, navigate]);

  return (
    <div className="relative w-full flex items-center justify-center select-none">
      {/* Globe canvas */}
      <div className="relative" style={{ width: '100%', maxWidth: 600, aspectRatio: '1 / 1' }}>
        {/* Radial glow behind globe */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.04) 50%, transparent 70%)',
          }} />

        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-full"
          style={{ touchAction: 'none' }}
        />

        {/* Pulsing ring around globe */}
        <div className="absolute inset-[-2%] rounded-full pointer-events-none border border-cyber/20 animate-glow-pulse" />

        {/* Legend overlay — bottom left */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
          {[
            { color: '#ff4d4d', label: 'CRITICAL' },
            { color: '#ffb020', label: 'WATCH' },
            { color: '#00ff9d', label: 'SAFE' },
            { color: '#00d4ff', label: 'HQ' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
              <span className="font-mono text-xxs" style={{ color, textShadow: `0 0 8px ${color}80` }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Active arcs legend */}
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <div className="font-mono text-xxs text-critical flex items-center gap-1.5">
            <span className="inline-block w-4 h-px bg-critical opacity-80" />
            ALERT ARC
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredZone && (
          <motion.div
            key={hoveredZone.id}
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg border"
            style={{
              left:  mousePos.x + 16,
              top:   mousePos.y - 40,
              background: '#161b22',
              borderColor: `${toRiskHex[hoveredZone.risk]}40`,
              boxShadow: `0 0 16px ${toRiskHex[hoveredZone.risk]}25`,
              minWidth: 180,
            }}
          >
            <div className="font-sans font-semibold text-xs text-text-primary mb-0.5">{hoveredZone.name}</div>
            <div className="font-mono text-xxs text-text-muted">{hoveredZone.id}</div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="font-mono text-xs font-bold" style={{ color: toRiskHex[hoveredZone.risk] }}>
                {hoveredZone.score}% RISK
              </span>
              <span className="font-mono text-xxs text-cyber">click → detail</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
