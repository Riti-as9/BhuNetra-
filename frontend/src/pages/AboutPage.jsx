import { motion } from 'framer-motion';
import { Shield, Code2, Cpu, Map, BarChart2, Globe, Github, Linkedin, Mail } from 'lucide-react';
import { BhuNetraBrand } from '../components/brand/BhuNetraBrand';

const TECH_STACK = [
  { label: 'React 18', color: '#61dafb', desc: 'UI framework' },
  { label: 'Vite', color: '#646cff', desc: 'Build tool' },
  { label: 'Tailwind CSS', color: '#06b6d4', desc: 'Styling' },
  { label: 'Framer Motion', color: '#ff4d4d', desc: 'Animations' },
  { label: 'Recharts', color: '#00ff9d', desc: 'Data viz' },
  { label: 'Leaflet / React-Leaflet', color: '#00d4ff', desc: 'Maps' },
  { label: 'Lucide React', color: '#ffb020', desc: 'Icons' },
  { label: 'LSTM Neural Net', color: '#a855f7', desc: 'AI model (planned)' },
  { label: 'Python / FastAPI', color: '#00ff9d', desc: 'Backend (planned)' },
  { label: 'IMD API', color: '#00d4ff', desc: 'Rainfall data' },
];

const TEAM_MEMBERS = [
  { name: 'Team Member 1', role: 'AI/ML Engineer', handle: '@member1' },
  { name: 'Team Member 2', role: 'Full-Stack Developer', handle: '@member2' },
  { name: 'Team Member 3', role: 'Geo-Informatics', handle: '@member3' },
  { name: 'Team Member 4', role: 'IoT & Sensor Systems', handle: '@member4' },
  { name: 'Team Member 5', role: 'UI/UX & Frontend', handle: '@member5' },
  { name: 'Team Member 6', role: 'Data Analyst', handle: '@member6' },
];

const Section = ({ title, children, icon: Icon, color = '#00d4ff', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
    className="bg-base-card border border-base-border rounded-xl p-6"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <h2 className="font-sans font-bold text-lg text-text-primary">{title}</h2>
    </div>
    {children}
  </motion.div>
);

export const AboutPage = () => (
  <div className="max-w-5xl mx-auto px-4 lg:px-6 py-5 space-y-5">

    {/* Hero banner */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative rounded-xl border border-cyber/30 overflow-hidden p-8 text-center"
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,255,157,0.03) 100%)',
        boxShadow: '0 0 40px rgba(0,212,255,0.08)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #00d4ff60, #00ff9d40, transparent)' }} />

      <div className="flex items-center justify-center mb-5">
        <BhuNetraBrand compact={false} large={true} showSubtitle={true} />
      </div>

      <div className="font-mono text-xxs text-text-muted tracking-widest mb-4">
        v2.4.1 · AI LANDSLIDE RISK MONITORING
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {[
          { label: 'SIH 2026', color: '#00d4ff' },
          { label: 'PS#26001', color: '#ffb020' },
          { label: 'MDoNER', color: '#00ff9d' },
          { label: 'Disaster Management', color: '#a855f7' },
        ].map(b => (
          <span key={b.label} className="font-mono text-xs px-3 py-1 rounded-full border"
            style={{ color: b.color, borderColor: `${b.color}40`, background: `${b.color}10` }}>
            {b.label}
          </span>
        ))}
      </div>
    </motion.div>

    {/* Problem Statement */}
    <Section title="Problem Statement" icon={Globe} color="#ff4d4d" delay={0.05}>
      <div className="space-y-3 font-sans text-sm text-text-secondary leading-relaxed">
        <div className="flex gap-2 items-start">
          <span className="font-mono text-xxs text-critical bg-critical/10 border border-critical/20 px-2 py-0.5 rounded mt-0.5 flex-shrink-0">PS#26001</span>
          <p><span className="font-semibold text-text-primary">Ministry of Development of North Eastern Region (MDoNER)</span> â€” Theme: Disaster Management</p>
        </div>
        <p>
          The North Eastern Region (NER) of India is among the most landslide-prone areas in the world,
          experiencing 20â€“30% of all landslide fatalities in South Asia. Factors including high annual rainfall
          (up to 11,000mm in Cherrapunji), steep terrain, seismic activity, and rapid deforestation create
          persistent disaster risk for over 45 million residents across 8 states.
        </p>
        <p>
          Existing warning systems are reactive and fragmented â€” there is no unified, AI-powered, real-time
          platform to monitor landslide risk across the entire NER, fuse multi-source sensor data, and
          deliver actionable early warnings to state authorities before events occur.
        </p>
        <div className="bg-cyber/5 border border-cyber/20 rounded-lg p-4 mt-2">
          <div className="font-mono text-xxs text-cyber tracking-widest mb-2">OUR SOLUTION</div>
          <p className="text-text-secondary">
            Bhunetra NER is a unified AI-based early warning platform that fuses ground sensor data,
            IMD rainfall feeds, and satellite imagery into an LSTM risk prediction model â€” providing 8+ hours
            of advance warning with 93% accuracy, covering all 8 NER states.
          </p>
        </div>
      </div>
    </Section>

    {/* MDoNER Context */}
    <Section title="MDoNER Context & Objectives" icon={Map} color="#00d4ff" delay={0.1}>
      <ul className="space-y-2">
        {[
          'Reduce landslide-related fatalities in NER by 60% through timely early warnings',
          'Provide state SDMAs with a centralized, real-time command center for disaster preparedness',
          'Enable data-driven evacuation decisions, reducing unnecessary full-scale evacuations by 40%',
          'Build a scalable monitoring infrastructure extensible to all 8 NER states and 500+ zones',
          'Integrate with NDRF, IMD, and local civil administration for seamless disaster response',
          'Create a historical database of landslide incidents for long-term risk modeling',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 font-sans text-sm text-text-secondary">
            <span className="text-cyber mt-1 flex-shrink-0">â†’</span>
            {item}
          </li>
        ))}
      </ul>
    </Section>

    {/* Tech stack */}
    <Section title="Technology Stack" icon={Code2} color="#00ff9d" delay={0.15}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {TECH_STACK.map(({ label, color, desc }) => (
          <div key={label}
            className="flex flex-col items-center text-center p-3 rounded-lg border border-base-border bg-base-panel hover:border-opacity-60 transition-colors"
            style={{ borderColor: `${color}20` }}
          >
            <div className="w-2 h-2 rounded-full mb-1.5" style={{ backgroundColor: color }} />
            <div className="font-sans font-semibold text-xs text-text-primary">{label}</div>
            <div className="font-mono text-xxs text-text-muted mt-0.5">{desc}</div>
          </div>
        ))}
      </div>
    </Section>

    {/* AI Architecture */}
    <Section title="AI Architecture" icon={Cpu} color="#a855f7" delay={0.2}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-sm">
        {[
          { label: 'Model Type', value: 'LSTM (Long Short-Term Memory) Neural Network', color: '#a855f7' },
          { label: 'Input Features', value: '6 features: rainfall, soil moisture, slope stability, pore pressure, seismic activity, vegetation cover', color: '#00d4ff' },
          { label: 'Training Data', value: '15 years of NER landslide incidents + sensor logs', color: '#00d4ff' },
          { label: 'Prediction Window', value: 'Rolling 30-day window â†’ next 24h risk score', color: '#00ff9d' },
          { label: 'Model Accuracy', value: '93.2% accuracy, 92% precision, 94% recall, F1: 0.93', color: '#00ff9d' },
          { label: 'Update Frequency', value: 'Real-time inference every 60 seconds per zone', color: '#ffb020' },
          { label: 'Alert Lead Time', value: 'Average 8.4 hours before slope failure event', color: '#ffb020' },
          { label: 'False Positive Rate', value: '4.2% â€” calibrated for safety-critical deployment', color: '#ffb020' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex gap-3">
            <div className="w-1 rounded-full flex-shrink-0" style={{ background: color, minHeight: '100%' }} />
            <div>
              <div className="font-mono text-xxs text-text-muted tracking-widest mb-0.5">{label.toUpperCase()}</div>
              <div className="text-text-secondary text-xs">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>

    {/* Team */}
    <Section title="Our Team" icon={BarChart2} color="#ffb020" delay={0.25}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {TEAM_MEMBERS.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="bg-base-panel border border-base-border rounded-lg p-3 text-center hover:border-cyber/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-cyber/10 border border-cyber/20 flex items-center justify-center mx-auto mb-2">
              <span className="font-mono text-sm text-cyber font-bold">
                {m.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="font-sans font-semibold text-xs text-text-primary">{m.name}</div>
            <div className="font-mono text-xxs text-cyber mt-0.5">{m.role}</div>
            <div className="font-mono text-xxs text-text-muted">{m.handle}</div>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3 pt-3 border-t border-base-border">
        {[
          { icon: Github, label: 'GitHub', href: '#' },
          { icon: Linkedin, label: 'LinkedIn', href: '#' },
          { icon: Mail, label: 'Contact', href: '#' },
        ].map(({ icon: Icon, label, href }) => (
          <a key={label} href={href}
            className="flex items-center gap-2 font-mono text-xs text-text-secondary hover:text-cyber transition-colors px-3 py-1.5 rounded border border-base-border hover:border-cyber/30">
            <Icon size={13} />
            {label}
          </a>
        ))}
      </div>
    </Section>

    {/* Footer note */}
    <div className="text-center py-4">
      <p className="font-mono text-xxs text-text-muted tracking-widest">
        BHUNETRA NER Â· SMART INDIA HACKATHON 2026 Â· MDONER Â· DISASTER MANAGEMENT THEME
      </p>
      <p className="font-mono text-xxs text-text-muted mt-1">
        Built with â™¥ for India's North Eastern Region
      </p>
    </div>
  </div>
);


