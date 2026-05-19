import { motion } from "framer-motion";

const FLOATING_ICONS = [
  { icon: "star", x: "8%", y: "20%", size: 28, delay: 0 },
  { icon: "star", x: "88%", y: "15%", size: 24, delay: 0.5 },
  { icon: "star", x: "30%", y: "40%", size: 20, delay: 1 },
  { icon: "star", x: "70%", y: "60%", size: 26, delay: 1.5 },
  { icon: "star", x: "20%", y: "80%", size: 22, delay: 2 },
  { icon: "circle", x: "12%", y: "55%", size: 16, delay: 0.3 },
  { icon: "circle", x: "85%", y: "70%", size: 20, delay: 0.8 },
  { icon: "circle", x: "50%", y: "25%", size: 14, delay: 1.3 },
  { icon: "diamond", x: "40%", y: "75%", size: 22, delay: 0.6 },
  { icon: "diamond", x: "62%", y: "10%", size: 18, delay: 1.1 },
  { icon: "hexagon", x: "15%", y: "35%", size: 24, delay: 1.6 },
  { icon: "hexagon", x: "78%", y: "30%", size: 20, delay: 2.1 },
  { icon: "triangle", x: "35%", y: "15%", size: 22, delay: 0.4 },
  { icon: "triangle", x: "55%", y: "55%", size: 18, delay: 0.9 },
  { icon: "sparkle", x: "5%", y: "65%", size: 28, delay: 1.4 },
  { icon: "sparkle", x: "90%", y: "45%", size: 20, delay: 1.9 },
  { icon: "sparkle", x: "45%", y: "85%", size: 24, delay: 2.4 },
];

const IconSVG = ({ type, size }) => {
  const icons = {
    star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    circle: <circle cx="12" cy="12" r="10" />,
    diamond: <path d="M12 2l10 10-10 10L2 12z" />,
    hexagon: <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />,
    triangle: <path d="M12 4l10 16H2z" />,
    sparkle: <path d="M12 0l2 8h8l-6 5 2 8-6-5-6 5 2-8-6-5h8z" />,
  };
  
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      {icons[type]}
    </svg>
  );
};

function GlassPanel({ delay }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: [0.08, 0.15, 0.08],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 12,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute rounded-[40px] pointer-events-none"
      style={{
        width: "45%",
        height: "50%",
        left: `${10 + (delay * 15)}%`,
        top: `${15 + (delay * 12)}%`,
        background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "40px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
        zIndex: 1,
      }}
    />
  );
}

function FloatingIcon({ icon }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: [0.7, 1, 0.7],
        y: [0, -20, 0],
        rotate: [0, 20, 0],
      }}
      transition={{
        duration: 5,
        delay: icon.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="fixed pointer-events-none"
      style={{
        left: icon.x,
        top: icon.y,
        color: "#fbbf24",
        filter: "drop-shadow(0 0 15px #fbbf24) drop-shadow(0 0 30px #f97316)",
        zIndex: 100,
      }}
    >
      <IconSVG type={icon.icon} size={icon.size * 1.5} />
    </motion.div>
  );
}

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      {/* Glassmorphism base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-black/50" />
      
      {/* Glass panels for layered effect */}
      <GlassPanel delay={0} />
      <GlassPanel delay={1.5} />
      <GlassPanel delay={3} />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #fff 1px, transparent 1px),
            linear-gradient(to bottom, #fff 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Floating icons - scattered across the viewport */}
      {FLOATING_ICONS.map((icon, index) => (
        <FloatingIcon key={index} icon={icon} />
      ))}
      
      {/* Subtle ambient glows */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)",
        }}
      />
      
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(236, 72, 153, 0.04) 0%, transparent 40%)",
        }}
      />
    </div>
  );
}