import React from 'react';

function AnimatedBackground() {
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

  return (
    <div className="background-animated" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {stars.map((s) => (
        <span
          key={s.id}
          className="magic-star"
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
          className={r.dashed ? 'magic-ring-2' : 'magic-ring'}
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
          className="magic-wave"
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
          className="particle-dot"
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

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 20%, rgba(0,210,255,0.14), transparent 40%), ' +
            'radial-gradient(circle at 80% 80%, rgba(118,75,162,0.14), transparent 40%), ' +
            'radial-gradient(circle at 50% 100%, rgba(240,147,251,0.14), transparent 45%), ' +
            'radial-gradient(circle at 70% 30%, rgba(0,245,160,0.12), transparent 40%)',
        }}
      />
    </div>
  );
}

export default AnimatedBackground;