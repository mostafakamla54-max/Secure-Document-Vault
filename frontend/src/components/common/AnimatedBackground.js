import React from 'react';

function AnimatedBackground({ variant = 'light' }) {
  const isGold = variant === 'gold';
  const particles = React.useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 12 + Math.random() * 10,
      size: 2 + Math.random() * 4,
    }));
  }, []);

  const stars = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: 100 + i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
      size: 2 + Math.random() * 3,
    }));
  }, []);

  const rings = React.useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: 500 + i,
      left: 8 + Math.random() * 84,
      top: 8 + Math.random() * 84,
      size: 60 + Math.random() * 120,
      delay: Math.random() * 10,
      duration: 20 + Math.random() * 18,
      dashed: i % 2 === 0,
    }));
  }, []);

  const waves = React.useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: 900 + i,
      top: 5 + Math.random() * 90,
      delay: Math.random() * 14,
      duration: 10 + Math.random() * 8,
    }));
  }, []);

  const emblems = React.useMemo(() => {
    return [
      { id: 600, icon: '🛡️', left: 8, top: 18, size: 30, delay: 0, duration: 26 },
      { id: 601, icon: '🔒', left: 84, top: 12, size: 24, delay: 3, duration: 22 },
      { id: 602, icon: '🔐', left: 90, top: 78, size: 28, delay: 6, duration: 28 },
      { id: 603, icon: '🛡️', left: 10, top: 80, size: 26, delay: 9, duration: 24 },
      { id: 604, icon: '💠', left: 50, top: 52, size: 20, delay: 5, duration: 30 },
    ];
  }, []);

  return (
    <div className={`background-animated ${isGold ? 'background-gold' : ''}`} aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {stars.map((s) => (
        <span
          key={s.id}
          className={isGold ? 'gold-star' : 'magic-star'}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {rings.map((r) => (
        <span
          key={r.id}
          className={isGold ? (r.dashed ? 'gold-ring-2' : 'gold-ring') : (r.dashed ? 'magic-ring-2' : 'magic-ring')}
          style={{
            left: `${r.left}%`,
            top: `${r.top}%`,
            width: `${r.size}px`,
            height: `${r.size}px`,
            animationDelay: `${r.delay}s`,
            animationDuration: `${r.duration}s`,
          }}
        />
      ))}

      {waves.map((w) => (
        <span
          key={w.id}
          className={isGold ? 'gold-wave' : 'magic-wave'}
          style={{
            left: 0,
            top: `${w.top}%`,
            width: '100%',
            animationDelay: `${w.delay}s`,
            animationDuration: `${w.duration}s`,
          }}
        />
      ))}

      {particles.map((p) => (
        <span
          key={p.id}
          className={isGold ? 'gold-particle' : 'particle-dot'}
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {isGold && emblems.map((em) => (
        <span
          key={em.id}
          className="gold-emblem"
          style={{
            left: `${em.left}%`,
            top: `${em.top}%`,
            fontSize: `${em.size}px`,
            animationDelay: `${em.delay}s`,
            animationDuration: `${em.duration}s`,
          }}
        >
          {em.icon}
        </span>
      ))}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isGold
            ? 'radial-gradient(circle at 20% 20%, rgba(212,175,55,0.16), transparent 40%), ' +
              'radial-gradient(circle at 80% 80%, rgba(124,58,237,0.16), transparent 45%), ' +
              'radial-gradient(circle at 50% 100%, rgba(255,215,0,0.12), transparent 50%), ' +
              'radial-gradient(circle at 70% 20%, rgba(212,175,55,0.10), transparent 40%)'
            : 'radial-gradient(circle at 20% 20%, rgba(0,210,255,0.14), transparent 40%), ' +
              'radial-gradient(circle at 80% 80%, rgba(118,75,162,0.14), transparent 40%), ' +
              'radial-gradient(circle at 50% 100%, rgba(240,147,251,0.14), transparent 45%), ' +
              'radial-gradient(circle at 70% 30%, rgba(0,245,160,0.12), transparent 40%)',
        }}
      />
    </div>
  );
}

export default AnimatedBackground;