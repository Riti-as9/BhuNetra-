import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { TERRAIN_SENSORS, TERRAIN_UNSTABLE_REGION } from '../../data/features';

// ── Low-poly terrain mesh ─────────────────────────────────────
const TerrainMesh = () => {
  const meshRef = useRef();

  // Generate a low-poly hillside via PlaneGeometry with randomised heights
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10, 8, 24, 20);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;

    const unstable = TERRAIN_UNSTABLE_REGION;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Base hillside: slope rises toward -z
      const base = (z / 8) * 3.5;
      // Ridge running NE-SW
      const ridge = Math.exp(-Math.pow(x - 0.5, 2) * 0.4) * 0.8;
      // Noise
      const noise = (Math.sin(x * 2.3) * Math.cos(z * 1.8) * 0.3)
                  + (Math.cos(x * 4.1 + z * 3.7) * 0.15);
      const y = base + ridge + noise;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    // Per-vertex coloring: unstable region → red, rest → dark teal
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(
        Math.pow(x - unstable.center[0], 2) +
        Math.pow(y - unstable.center[1], 2) +
        Math.pow(z - unstable.center[2], 2)
      );
      const t = Math.max(0, 1 - dist / unstable.radius);
      const ease = t * t;
      // Blend from dark teal (#0d2a2a) to red (#ff4d4d)
      colors[i * 3 + 0] = 0.05 + ease * (1.0 - 0.05);
      colors[i * 3 + 1] = 0.16 - ease * 0.16;
      colors[i * 3 + 2] = 0.16 - ease * 0.16;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Subtle idle rotation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        vertexColors
        wireframe={false}
        roughness={0.85}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Wireframe overlay
const WireframeOverlay = () => {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10, 8, 24, 20);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const base  = (z / 8) * 3.5;
      const ridge = Math.exp(-Math.pow(x - 0.5, 2) * 0.4) * 0.8;
      const noise = (Math.sin(x * 2.3) * Math.cos(z * 1.8) * 0.3)
                  + (Math.cos(x * 4.1 + z * 3.7) * 0.15);
      pos.setY(i, base + ridge + noise);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} position={[0, 0.01, 0]}>
      <meshBasicMaterial color="#232b3a" wireframe opacity={0.45} transparent />
    </mesh>
  );
};

// ── Sensor dot ────────────────────────────────────────────────
const SensorDot = ({ sensor }) => {
  const meshRef = useRef();
  const ringRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    // Pulsing glow scale
    const s = 1 + Math.sin(t * 3 + sensor.pos[0]) * 0.25;
    if (ringRef.current) {
      ringRef.current.scale.setScalar(s);
      ringRef.current.material.opacity = 0.4 - s * 0.1;
    }
  });

  const [r, g, b] = hexToRgb(sensor.color);

  return (
    <group position={sensor.pos}>
      {/* Core dot */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color={sensor.color}
          emissive={sensor.color}
          emissiveIntensity={sensor.alert ? 2.5 : 1.2}
        />
      </mesh>

      {/* Pulsing ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.12, 0.18, 16]} />
        <meshBasicMaterial color={sensor.color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical line to ground */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, -sensor.pos[1], 0]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color={sensor.color} opacity={0.35} transparent />
      </line>
    </group>
  );
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

// ── Unstable region glow ──────────────────────────────────────
const UnstableGlow = () => {
  const meshRef = useRef();
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.material.opacity = 0.1 + Math.sin(t * 1.8) * 0.06;
  });
  const c = TERRAIN_UNSTABLE_REGION;
  return (
    <mesh ref={meshRef} position={[c.center[0], c.center[1] + 0.05, c.center[2]]}>
      <sphereGeometry args={[c.radius * 0.9, 24, 24]} />
      <meshBasicMaterial color="#ff4d4d" transparent opacity={0.12} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ── Loading fallback ──────────────────────────────────────────
const TerrainFallback = () => (
  <div className="w-full h-full flex items-center justify-center bg-base-card rounded-xl border border-base-border">
    <div className="font-mono text-xs text-text-muted">
      <span className="text-cyber animate-pulse">▶</span>
      {' '}LOADING TERRAIN MODEL...
    </div>
  </div>
);

// ── Main export ───────────────────────────────────────────────
export const TerrainDigitalTwin = ({ zoneName = 'Zone', riskLevel = 'critical' }) => {
  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-base-border"
      style={{ background: '#070b10' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-base-border flex-shrink-0">
        <div className="font-mono text-xs text-cyber tracking-widest">TERRAIN DIGITAL TWIN</div>
        <div className="flex items-center gap-3 text-xxs font-mono text-text-muted">
          <span className="text-safe">● LIVE</span>
          <span>drag·scroll to explore</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 min-h-0" style={{ minHeight: 280 }}>
        <Suspense fallback={<TerrainFallback />}>
          <Canvas
            camera={{ position: [4, 5, 8], fov: 45, near: 0.1, far: 100 }}
            style={{ background: '#070b10' }}
            shadows
          >
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 8, 5]} intensity={0.7} color="#ffffff" castShadow />
            <pointLight position={[-3, 4, 2]} intensity={0.5} color="#00d4ff" />
            <pointLight position={[2, 2, -3]} intensity={0.4} color="#ff4d4d" />

            {/* Fog for depth */}
            <fog attach="fog" args={['#070b10', 18, 35]} />

            {/* Terrain */}
            <TerrainMesh />
            <WireframeOverlay />
            <UnstableGlow />

            {/* Sensor dots */}
            {TERRAIN_SENSORS.map(s => <SensorDot key={s.id} sensor={s} />)}

            {/* Orbit controls */}
            <OrbitControls
              enablePan={false}
              minDistance={4}
              maxDistance={18}
              maxPolarAngle={Math.PI / 2.1}
              autoRotate={false}
              enableDamping
              dampingFactor={0.05}
            />
          </Canvas>
        </Suspense>
      </div>

      {/* Sensor legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 border-t border-base-border flex-shrink-0">
        {TERRAIN_SENSORS.map(s => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: s.color, boxShadow: `0 0 5px ${s.color}` }} />
            <span className="font-mono text-xxs text-text-muted">{s.id}</span>
            <span className="font-mono text-xxs" style={{ color: s.color }}>{s.label}</span>
            {s.alert && <span className="font-mono text-xxs text-critical">⚠</span>}
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-2 h-2 rounded-full inline-block bg-critical/60" />
          <span className="font-mono text-xxs text-critical">Unstable region</span>
        </div>
      </div>
    </div>
  );
};
