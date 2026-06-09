import { useEffect, useRef, useState } from 'react';
import { Shield, Sparkles, RefreshCw, Trophy, Heart } from 'lucide-react';

interface FallingItem {
  x: number;
  y: number;
  type: 'code' | 'bug';
  name: string;
  speed: number;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export default function RetroGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('siyam_game_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');

  // Audio Context synthesis for retro sounds
  const playSoundRef = useRef<(type: 'catch' | 'damage' | 'gameover' | 'start') => void>(() => {});

  useEffect(() => {
    // Lazy initialize Web Audio to comply with browser unlock standards
    const playAudioNode = (type: 'catch' | 'damage' | 'gameover' | 'start') => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'catch') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'damage') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
          osc.frequency.linearRampToValueAtTime(55.00, ctx.currentTime + 0.35); // A1
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } else if (type === 'start') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440.00, ctx.currentTime); // A4
          osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } else if (type === 'gameover') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(146.83, ctx.currentTime); // D3
          osc.frequency.linearRampToValueAtTime(73.42, ctx.currentTime + 0.7);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.8);
          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        }
      } catch (e) {
        // Safe fail silently if AudioContext not supported or permission denied
      }
    };

    playSoundRef.current = playAudioNode;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let paddleX = canvas.width / 2;
    const paddleWidth = 72;
    const paddleHeight = 10;
    const paddleY = canvas.height - 24;

    let items: FallingItem[] = [];
    let particles: Particle[] = [];
    let speedMultiplier = 1.0;
    let itemSpawnTimer = 0;

    const codeNames = ['TS', 'React', 'Vite', 'CSS', 'JS', 'JSON', 'HTML', 'API'];
    const bugNames = ['BUG', 'GLITCH', 'DDoS', '404', 'CRASH', 'NULL'];

    // Align rendering dimensions inside parent bounding rect
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth || 400;
      canvas.width = w;
      canvas.height = 360;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse & Touch controls
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      paddleX = Math.max(paddleWidth / 2, Math.min(canvas.width - paddleWidth / 2, x));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      paddleX = Math.max(paddleWidth / 2, Math.min(canvas.width - paddleWidth / 2, x));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Left/Right buttons support on screens
    const handleLeftMove = () => {
      paddleX = Math.max(paddleWidth / 2, paddleX - 25);
    };
    const handleRightMove = () => {
      paddleX = Math.min(canvas.width - paddleWidth / 2, paddleX + 25);
    };

    // Make functions globally available for mobile arrows
    (window as any)._siyamGameLeft = handleLeftMove;
    (window as any)._siyamGameRight = handleRightMove;

    const spawnExplosion = (x: number, y: number, color: string) => {
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1.0,
          size: Math.random() * 4 + 2
        });
      }
    };

    // Primary loop
    const frameLoop = () => {
      if (gameState !== 'playing') return;

      // Clear Screen
      ctx.fillStyle = '#101b33'; // Matches surface-container-low
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background effect
      ctx.strokeStyle = 'rgba(0, 220, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Spawn falling pieces
      itemSpawnTimer++;
      if (itemSpawnTimer > Math.max(25, 60 - Math.floor(score / 5))) {
        itemSpawnTimer = 0;
        const isBug = Math.random() < 0.35; // 35% glitch virus density
        const name = isBug 
          ? bugNames[Math.floor(Math.random() * bugNames.length)]
          : codeNames[Math.floor(Math.random() * codeNames.length)];

        items.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -10,
          type: isBug ? 'bug' : 'code',
          name,
          speed: (Math.random() * 1.5 + 2) * speedMultiplier,
          size: isBug ? 8 : 10
        });
      }

      // Draw and Update Items
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;

        // Draw falling objects
        if (item.type === 'code') {
          // Glass box styling
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00F0FF';
          ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 1.5;

          // Round Rect or Rounded box for tech tag
          const textWidth = ctx.measureText(item.name).width;
          const boxW = Math.max(35, textWidth + 10);
          const boxH = 18;
          ctx.beginPath();
          ctx.rect(item.x - boxW / 2, item.y - boxH / 2, boxW, boxH);
          ctx.fill();
          ctx.stroke();

          // Code Tag text
          ctx.fillStyle = '#dbfcff';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.name, item.x, item.y);
          ctx.shadowBlur = 0; // Reset shadow
        } else {
          // Virus glitch label
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ffb4ab';
          ctx.fillStyle = 'rgba(255, 180, 171, 0.15)';
          ctx.strokeStyle = '#ffb4ab';
          ctx.lineWidth = 1.5;

          const boxW = 40;
          const boxH = 18;
          ctx.beginPath();
          ctx.rect(item.x - boxW / 2, item.y - boxH / 2, boxW, boxH);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffb4ab';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('☣ ' + item.name, item.x, item.y);
          ctx.shadowBlur = 0;
        }

        // Collision logic
        const itemBottom = item.y + 8;
        const isCollidingY = itemBottom >= paddleY && item.y - 8 <= paddleY + paddleHeight;
        const isCollidingX = item.x >= paddleX - paddleWidth / 2 && item.x <= paddleX + paddleWidth / 2;

        if (isCollidingY && isCollidingX) {
          items.splice(i, 1);
          if (item.type === 'code') {
            // Success Catch
            setScore(prev => {
              const next = prev + 1;
              if (next > highScore) {
                setHighScore(next);
                localStorage.setItem('siyam_game_highscore', next.toString());
              }
              // Speed slider ramp-up
              speedMultiplier = 1.0 + Math.min(0.8, next * 0.03);
              return next;
            });
            playSoundRef.current('catch');
            spawnExplosion(item.x, paddleY, '#00F0FF');
          } else {
            // GLITCH Collision Penalty
            setLives(prev => {
              const next = prev - 1;
              if (next <= 0) {
                setGameState('gameover');
                playSoundRef.current('gameover');
              } else {
                playSoundRef.current('damage');
              }
              return next;
            });
            spawnExplosion(item.x, paddleY, '#ffb4ab');
          }
          continue;
        }

        // Missed item exits bottom
        if (item.y > canvas.height + 20) {
          items.splice(i, 1);
          // If missed code, no explicit penalty, keep it light and satisfying!
        }
      }

      // Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Paddle (Interactive Electric Grid Shield)
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00F0FF';
      
      const grad = ctx.createLinearGradient(paddleX - paddleWidth/2, 0, paddleX + paddleWidth/2, 0);
      grad.addColorStop(0, '#00F0FF');
      grad.addColorStop(0.5, '#b600f8');
      grad.addColorStop(1, '#00F0FF');

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Rounded ends paddle
      ctx.roundRect 
        ? ctx.roundRect(paddleX - paddleWidth / 2, paddleY, paddleWidth, paddleHeight, 5)
        : ctx.rect(paddleX - paddleWidth / 2, paddleY, paddleWidth, paddleHeight);
      ctx.fill();
      
      // Top line sheen
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(paddleX - paddleWidth / 3, paddleY + 1.5);
      ctx.lineTo(paddleX + paddleWidth / 3, paddleY + 1.5);
      ctx.stroke();

      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(frameLoop);
    };

    if (gameState === 'playing') {
      animId = requestAnimationFrame(frameLoop);
    } else {
      // Draw static board
      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameState, score, highScore]);

  const startGame = () => {
    playSoundRef.current('start');
    setScore(0);
    setLives(3);
    setGameState('playing');
  };

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col h-full min-h-[460px] relative overflow-hidden">
      {/* Header controls */}
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
        <h3 className="font-title-md text-title-md text-on-surface flex items-center gap-2">
          <Shield className="text-surface-tint w-5 h-5 animate-pulse" />
          Siyam's Code Shield
        </h3>
        <div className="flex gap-4 text-xs font-code-sm">
          <span className="flex items-center gap-1 text-surface-tint">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            Hi: <span className="text-white font-bold">{highScore}</span>
          </span>
          <span className="text-on-surface-variant bg-surface-variant px-2.5 py-1 rounded-full uppercase text-[10px] tracking-wider font-bold border border-white/5">
            Arcade v1.1
          </span>
        </div>
      </div>

      {/* Screen area structure */}
      <div 
        ref={containerRef}
        className="flex-grow rounded-lg border border-outline-variant/30 flex flex-col items-center justify-center relative overflow-hidden bg-surface-container"
        style={{ minHeight: '300px' }}
      >
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-surface-container/95 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-16 h-16 bg-surface-tint/10 rounded-full flex items-center justify-center mb-4 border border-surface-tint/30">
              <Sparkles className="w-8 h-8 text-surface-tint animate-spin" />
            </div>
            <h4 className="font-title-md text-white font-bold mb-2 uppercase tracking-wide">BUG Catcher Terminal</h4>
            <p className="text-sm text-on-surface-variant max-w-xs mb-6 font-sans">
              Catch glowing script tags to construct codebase. Slide with cursor or press arrow keys. Dodge red glitch <span className="text-[#ffb4ab]">BUGS</span>!
            </p>
            <button
              id="game-start-btn"
              onClick={startGame}
              className="bg-gradient-to-r from-surface-tint to-secondary-container text-on-primary-fixed font-title-md px-6 py-2.5 rounded-lg active:scale-95 duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(0,219,233,0.45)]"
            >
              Start Compiler Sync.
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-surface-dim/95 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
              <Heart className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
            <h4 className="font-title-md text-[#ffb4ab] font-bold mb-1 uppercase tracking-wide">Stack Overflow!</h4>
            <div className="text-sm text-on-surface-variant mb-6 font-code-sm">
              <p>Compiler collapsed. Captured {score} blocks.</p>
              {score >= highScore && score > 0 && (
                <span className="text-yellow-400 font-bold block mt-1">🎉 NEW PERSONAL OUTFLOW RECORD!</span>
              )}
            </div>
            <button
              id="game-restart-btn"
              onClick={startGame}
              className="bg-transparent border border-surface-tint text-surface-tint hover:bg-surface-tint hover:text-on-primary-fixed flex items-center gap-2 font-title-md px-5 py-2.5 rounded-lg duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Re-Compile Pipeline
            </button>
          </div>
        )}

        {/* Live Canvas renderer */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair relative"
          style={{ visibility: gameState === 'playing' ? 'visible' : 'hidden' }}
        />

        {/* Floating live score panel during gameplay */}
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none text-white z-10 px-2">
            <div className="font-mono bg-surface-bright/80 backdrop-blur border border-white/10 px-3 py-1 rounded-md text-xs flex items-center gap-1.5">
              <span className="text-cyan-400 font-bold">score:</span> 
              <span className="font-bold text-sm tracking-wider text-white select-none">{score}</span>
            </div>
            <div className="flex gap-1 text-red-500 bg-surface-bright/80 backdrop-blur border border-white/10 px-2.5 py-1 rounded-md">
              {Array.from({ length: 3 }).map((_, index) => (
                <Heart
                  key={index}
                  className={`w-3.5 h-3.5 ${index < lives ? 'fill-red-500 text-red-500 animate-heartbeat' : 'text-zinc-600/50'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tactile manual triggers for easy phone inputs */}
      <div className="flex gap-4 mt-4 w-full">
        <button
          onClick={() => {
            if ((window as any)._siyamGameLeft) {
              (window as any)._siyamGameLeft();
            }
          }}
          className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-white/5 py-2.5 rounded-lg text-lg flex items-center justify-center font-bold text-surface-tint select-none duration-150 active:scale-95"
        >
          ◀ Slide Left
        </button>
        <button
          onClick={() => {
            if ((window as any)._siyamGameRight) {
              (window as any)._siyamGameRight();
            }
          }}
          className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-white/5 py-2.5 rounded-lg text-lg flex items-center justify-center font-bold text-surface-tint select-none duration-150 active:scale-95"
        >
          Slide Right ▶
        </button>
      </div>
    </div>
  );
}
