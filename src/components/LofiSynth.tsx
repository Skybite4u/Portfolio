import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Disc, Volume2, Music, Check } from 'lucide-react';
import { LOFI_TRACKS, Track } from '../types';

export default function LofiSynth() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track>(LOFI_TRACKS[0]);
  const [volume, setVolume] = useState(0.4);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
  const beatIntervalRef = useRef<number | null>(null);

  // Synced track loop scheduler
  const triggerNotes = (frequencies: number[]) => {
    try {
      if (!audioCtxRef.current || !gainNodeRef.current) return;
      const ctx = audioCtxRef.current;

      // Close previous oscillators
      activeOscillatorsRef.current.forEach(osc => {
        try { osc.stop(); } catch {}
      });
      activeOscillatorsRef.current = [];

      // Arpeggiate chord notes
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();

        // Muffled chord oscillators
        osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.125);

        // Low volume ambient vibe with soft envelope
        oGain.gain.setValueAtTime(0, ctx.currentTime);
        oGain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + idx * 0.125 + 0.3);
        oGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.125 + 1.9);

        osc.connect(oGain);
        
        if (filterNodeRef.current) {
          oGain.connect(filterNodeRef.current);
        } else {
          oGain.connect(gainNodeRef.current!);
        }

        osc.start(ctx.currentTime + idx * 0.125);
        osc.stop(ctx.currentTime + 2.0);
        
        activeOscillatorsRef.current.push(osc);
      });

      // Synthesize a very subtle warm low kick drum beat
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.frequency.setValueAtTime(100, ctx.currentTime);
      kickOsc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.15);
      
      kickGain.gain.setValueAtTime(0.12, ctx.currentTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      
      kickOsc.connect(kickGain);
      kickGain.connect(gainNodeRef.current!);
      kickOsc.start();
      kickOsc.stop(ctx.currentTime + 0.3);

    } catch (err) {
      console.warn('Audio note scheduling failed:', err);
    }
  };

  const startSynthesizer = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioCtxRef.current) {
        const ctx = new AudioCtxClass();
        audioCtxRef.current = ctx;

        // Visualizer analyser setup
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const mainVolume = ctx.createGain();
        mainVolume.gain.setValueAtTime(volume, ctx.currentTime);
        gainNodeRef.current = mainVolume;

        // Muffle cutoff filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(540, ctx.currentTime); // Low pass filter frequency (for dynamic warm lofi feel)
        filterNodeRef.current = filter;

        // Path routing: osc -> Filter -> Volume -> Analyser -> Output
        filter.connect(mainVolume);
        mainVolume.connect(analyser);
        analyser.connect(ctx.destination);
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      setIsPlaying(true);
      
      // Trigger immediately then start interval loop
      triggerNotes(currentTrack.freqs);
      
      if (beatIntervalRef.current) {
        window.clearInterval(beatIntervalRef.current);
      }
      
      beatIntervalRef.current = window.setInterval(() => {
        triggerNotes(currentTrack.freqs);
      }, 2000); // 2 second bar rhythm loop

    } catch (e) {
      console.error('Synthesizer boot error:', e);
    }
  };

  const stopSynthesizer = () => {
    setIsPlaying(false);
    if (beatIntervalRef.current) {
      window.clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    activeOscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    activeOscillatorsRef.current = [];
  };

  // Adjust volume levels dynamically
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Handle live track shifting
  const switchTrack = (track: Track) => {
    setCurrentTrack(track);
    if (isPlaying) {
      // Trigger notes of new track instantly if playing
      triggerNotes(track.freqs);
      if (beatIntervalRef.current) {
        window.clearInterval(beatIntervalRef.current);
      }
      beatIntervalRef.current = window.setInterval(() => {
        triggerNotes(track.freqs);
      }, 2000);
    }
  };

  // Canvas Waveform Visualizer loop
  useEffect(() => {
    let animId: number;
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 120;
    canvas.height = 36;

    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isPlaying && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgba(0, 219, 233, 0.45)';
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const barHeight = percent * canvas.height * 0.9;

          // Draws glowing visualizer bars
          ctx.beginPath();
          ctx.roundRect 
            ? ctx.roundRect(x, canvas.height - barHeight, barWidth - 1, barHeight, 1)
            : ctx.rect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          ctx.fill();

          x += barWidth;
        }
      } else {
        // Draw idle wave line
        ctx.strokeStyle = 'rgba(0, 219, 233, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        for (let i = 0; i < canvas.width; i++) {
          const y = (canvas.height / 2) + Math.sin(i * 0.1) * 2;
          ctx.lineTo(i, y);
        }
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  // Cleanup on dismount
  useEffect(() => {
    return () => {
      if (beatIntervalRef.current) {
        window.clearInterval(beatIntervalRef.current);
      }
      activeOscillatorsRef.current.forEach(osc => {
        try { osc.stop(); } catch {}
      });
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="glass-card rounded-xl p-6 relative overflow-hidden flex flex-col h-full">
      <h3 className="font-title-md text-title-md text-on-surface mb-3 flex items-center gap-2">
        <Music className="text-secondary w-5 h-5 animate-bounce" />
        Siyam's Audio Station
      </h3>
      <p className="text-xs text-on-surface-variant font-sans mb-4">
        Play synthesized atmospheric chord sequences made by browser's Audio Oscillators.
      </p>

      {/* Media Board */}
      <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30 flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-secondary/15 rounded-full flex items-center justify-center border border-secondary/30 relative">
            <Disc className={`w-6 h-6 text-secondary-fixed ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
          </div>
          <div className="flex-grow select-none overflow-hidden">
            <div className="font-semibold text-xs text-white truncate max-w-[130px]" id="track-title-label">
              {currentTrack.title}
            </div>
            <div className="font-code-sm text-[10px] text-on-surface-variant tracking-widest mt-0.5">
              FM SYNTH CHORDS
            </div>
          </div>
          
          <button
            onClick={isPlaying ? stopSynthesizer : startSynthesizer}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow ${
              isPlaying 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
              : 'bg-surface-tint hover:bg-cyan-500 text-on-primary-fixed hover:shadow-[0_0_12px_rgba(0,219,233,0.5)]'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Volume & Equalizer lines */}
        <div className="flex items-center gap-4 border-t border-white/5 pt-3">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <Volume2 className="w-3.5 h-3.5" />
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-surface-variant rounded-full outline-none accent-surface-tint opacity-80 hover:opacity-100 cursor-pointer"
            />
          </div>
          <div className="flex-grow flex justify-end">
            <canvas ref={visualizerCanvasRef} className="opacity-90 block" />
          </div>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="flex-grow flex flex-col gap-1.5 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {LOFI_TRACKS.map(track => {
          const isSelected = track.id === currentTrack.id;
          return (
            <button
              key={track.id}
              onClick={() => switchTrack(track)}
              className={`w-full flex items-center justify-between text-left p-2 rounded-lg text-xs transition-colors duration-150 group border ${
                isSelected 
                ? 'bg-surface-variant/40 text-surface-tint border-surface-tint/30 font-semibold' 
                : 'bg-transparent text-on-surface-variant border-transparent hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Music className={`w-3.5 h-3.5 ${isSelected ? 'text-surface-tint' : 'text-on-surface-variant/40 group-hover:text-surface-tint/60'}`} />
                {track.title}
              </span>
              <span className="flex items-center gap-1 font-code-sm text-[10px] opacity-75">
                {isSelected ? <Check className="w-3 h-3 text-surface-tint" /> : track.durationString}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
