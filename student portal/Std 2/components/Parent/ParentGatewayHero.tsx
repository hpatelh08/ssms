// ParentGatewayHero.tsx — Premium hero panel with shield glow, animated gradient, lock pulse
import React from 'react';
import { motion } from 'framer-motion';

interface ParentGatewayHeroProps {
  safeMode: boolean;
  totalActivities: number;
}

export const ParentGatewayHero: React.FC<ParentGatewayHeroProps> = React.memo(({ safeMode, totalActivities }) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-[24px] shadow-2xl shadow-blue-900/20"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(135deg, #0F172A 0%, #1E3A5F 40%, #1E293B 100%)',
            'linear-gradient(135deg, #1E293B 0%, #0F3460 40%, #0F172A 100%)',
            'linear-gradient(135deg, #0F172A 0%, #1E3A5F 40%, #1E293B 100%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Shield glow effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating reassurance icons */}
      {[
        { icon: '🔒', x: '8%', y: '15%', delay: 0 },
        { icon: '✅', x: '85%', y: '20%', delay: 1.2 },
        { icon: '👁️', x: '12%', y: '75%', delay: 0.6 },
        { icon: '📊', x: '88%', y: '70%', delay: 1.8 },
        { icon: '🤝', x: '50%', y: '10%', delay: 2.4 },
      ].map((item, i) => (
        <motion.span
          key={i}
          className="absolute text-lg opacity-20 pointer-events-none select-none"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.1, 0.25, 0.1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: item.delay,
            ease: 'easeInOut',
          }}
        >
          {item.icon}
        </motion.span>
      ))}

      {/* Animated lock pulse */}
      <motion.div
        className="absolute top-8 right-8 w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
        animate={{
          boxShadow: [
            '0 0 0 0px rgba(34,197,94,0.2)',
            '0 0 0 12px rgba(34,197,94,0)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.span
          className="text-2xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔐
        </motion.span>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 p-8 lg:p-10">
        <div className="flex items-start gap-5">
          {/* Shield icon */}
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.1))',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
            }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.4))' }}>
              🛡️
            </span>
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Parent Control Center
              </h2>
              {/* Parent Mode Active badge */}
              <motion.div
                className="flex items-center gap-1.5 bg-green-500/15 backdrop-blur-sm px-3 py-1 rounded-full border border-green-400/20"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-[10px] font-bold text-green-300 uppercase tracking-wider">Active</span>
              </motion.div>
            </div>

            <p className="text-blue-200/70 text-sm font-medium max-w-lg leading-relaxed">
              Monitoring with transparency. No ranking. No prediction.
            </p>

            {/* Quick stats row */}
            <div className="flex items-center gap-4 mt-4">
              {[
                { label: 'Activities', value: totalActivities, icon: '📊' },
                { label: 'Mode', value: safeMode ? 'Safe' : 'Standard', icon: '🛡️' },
                { label: 'Status', value: 'Secure', icon: '✅' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/[0.06]"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <span className="text-sm">{stat.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">{stat.value}</span>
                    <span className="text-[8px] text-blue-300/50 font-medium uppercase">{stat.label}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom edge glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), rgba(147,51,234,0.2), transparent)' }}
      />
    </motion.div>
  );
});

ParentGatewayHero.displayName = 'ParentGatewayHero';
