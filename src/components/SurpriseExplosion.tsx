import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

export interface SurpriseExplosionHandle {
  explode: (clientX: number, clientY: number) => void;
}

interface Spark {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  symbol: string;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
  scale: number;
}

export const SurpriseExplosion = forwardRef<SurpriseExplosionHandle>((_props, ref) => {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const symbols = ['</>', '{ }', '[ ]', '编译...', 'TS', 'JS', 'React', 'BUG', '101', '010', 'NULL', 'SUCCESS', '🚀', '💻', '⚡'];
  const colors = ['#00dbe9', '#ebb2ff', '#00f0ff', '#b600f8', '#dbfcff', '#7df4ff'];

  const explode = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = clientX - rect.left;
    const startY = clientY - rect.top;

    const newSparks: Spark[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 / 24) * i + (Math.random() * 0.4 - 0.2);
      const velocity = Math.random() * 5 + 4;
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      newSparks.push({
        id: `${Date.now()}-${i}-${Math.random()}`,
        x: startX,
        y: startY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 1.5, // slightly upward gravity offset
        symbol,
        color,
        alpha: 1.0,
        rotation: Math.random() * 360,
        vRot: (Math.random() * 8) - 4,
        scale: Math.random() * 0.4 + 0.7
      });
    }

    setSparks(prev => [...prev, ...newSparks]);
  };

  useImperativeHandle(ref, () => ({
    explode
  }));

  useEffect(() => {
    if (sparks.length === 0) return;

    let animId: number;

    const updateParticles = () => {
      setSparks(prev => {
        const next = prev.map(s => ({
          ...s,
          x: s.x + s.vx,
          y: s.y + s.vy,
          vy: s.vy + 0.12, // soft terminal gravity
          alpha: s.alpha - 0.02,
          rotation: s.rotation + s.vRot
        })).filter(s => s.alpha > 0);

        if (next.length === 0) {
          cancelAnimationFrame(animId);
        }
        return next;
      });

      animId = requestAnimationFrame(updateParticles);
    };

    animId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animId);
  }, [sparks.length]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-[80] overflow-hidden"
    >
      {sparks.map(s => (
        <div
          key={s.id}
          className="absolute select-none font-mono text-xs font-bold leading-none origin-center"
          style={{
            left: s.x,
            top: s.y,
            color: s.color,
            opacity: s.alpha,
            transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
            textShadow: `0 0 8px ${s.color}aa`,
            willChange: 'transform, opacity'
          }}
        >
          {s.symbol}
        </div>
      ))}
    </div>
  );
});

SurpriseExplosion.displayName = 'SurpriseExplosion';
