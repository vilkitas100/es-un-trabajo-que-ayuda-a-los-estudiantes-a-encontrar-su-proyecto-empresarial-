import React, { useEffect, useState } from 'react';
import { ArrowRight, Compass, Flame, Rocket, Sparkles, Volume2, X, Zap } from 'lucide-react';
import { playCelebrationFanfare } from '../utils/celebrationSound';

interface CelebrationResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPassion: () => void;
  onGoToModule1: () => void;
}

const BalloonSvg: React.FC<{ color: string; className?: string }> = ({ color, className = '' }) => (
  <svg viewBox="0 0 48 80" className={className} aria-hidden="true">
    <ellipse cx="24" cy="26" rx="18" ry="22" fill={color} />
    <ellipse cx="18" cy="18" rx="4.5" ry="7" fill="#ffffff" fillOpacity="0.45" transform="rotate(-18 18 18)" />
    <polygon points="24,48 20,53 28,53" fill={color} />
    <path d="M24 53 Q20 62 25 69 T23 79" fill="none" stroke="#64748B" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const FlowerSvg: React.FC<{ petalColor: string; centerColor: string; className?: string }> = ({
  petalColor,
  centerColor,
  className = '',
}) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    {[0, 60, 120, 180, 240, 300].map((angle) => (
      <ellipse
        key={angle}
        cx="32"
        cy="16"
        rx="8.5"
        ry="13.5"
        fill={petalColor}
        transform={`rotate(${angle} 32 32)`}
      />
    ))}
    <circle cx="32" cy="32" r="8.5" fill={centerColor} />
  </svg>
);

const HeartSvg: React.FC<{ color: string; className?: string }> = ({ color, className = '' }) => (
  <svg viewBox="0 0 48 44" className={className} aria-hidden="true">
    <path
      d="M24 41.5C24 41.5 4 28.8 4 14.5C4 7.8 9.2 3 15.5 3C19.4 3 22.5 5 24 7.7C25.5 5 28.6 3 32.5 3C38.8 3 44 7.8 44 14.5C44 28.8 24 41.5 24 41.5Z"
      fill={color}
    />
    <path
      d="M12.5 11.5C12.5 9.6 14 8.2 15.8 8.2"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeOpacity="0.65"
    />
  </svg>
);

const StarBurstSvg: React.FC<{ color: string; className?: string }> = ({ color, className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <path
      d="M16 2 L19.6 11.4 L29.5 12.2 L21.8 18.7 L24.3 28.5 L16 23 L7.7 28.5 L10.2 18.7 L2.5 12.2 L12.4 11.4 Z"
      fill={color}
    />
  </svg>
);

const CONFETTI_PIECES = [
  { left: '6%', top: '10%', color: '#0D9488', delay: '0s', shape: 'rect' },
  { left: '14%', top: '24%', color: '#F59E0B', delay: '0.25s', shape: 'star' },
  { left: '22%', top: '8%', color: '#0055FF', delay: '0.5s', shape: 'circle' },
  { left: '31%', top: '18%', color: '#15803D', delay: '0.15s', shape: 'rect' },
  { left: '40%', top: '6%', color: '#7E22CE', delay: '0.4s', shape: 'star' },
  { left: '50%', top: '16%', color: '#FF007F', delay: '0.1s', shape: 'circle' },
  { left: '60%', top: '8%', color: '#EC4899', delay: '0.35s', shape: 'rect' },
  { left: '69%', top: '22%', color: '#0055FF', delay: '0.2s', shape: 'star' },
  { left: '78%', top: '9%', color: '#15803D', delay: '0.45s', shape: 'circle' },
  { left: '86%', top: '20%', color: '#0D9488', delay: '0.05s', shape: 'rect' },
  { left: '93%', top: '12%', color: '#F59E0B', delay: '0.3s', shape: 'star' },
  { left: '11%', top: '68%', color: '#7E22CE', delay: '0.6s', shape: 'circle' },
  { left: '89%', top: '66%', color: '#5C2808', delay: '0.55s', shape: 'star' },
] as const;

export const CelebrationResetModal: React.FC<CelebrationResetModalProps> = ({
  isOpen,
  onClose,
  onStartPassion,
  onGoToModule1,
}) => {
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBoostEnergy = () => {
    playCelebrationFanfare();
    setBurstKey((prev) => prev + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/55"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-modal-title"
      onClick={onClose}
    >
      <div
        key={burstKey}
        onClick={(e) => e.stopPropagation()}
        className="my-auto relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white border-2 border-amber-400 rounded-3xl shadow-2xl animate-modal-pop"
      >
        {/* Top Vibrant 6-Color Energy Ribbon */}
        <div className="relative h-3 w-full grid grid-cols-6 overflow-hidden" aria-hidden="true">
          <div className="bg-[#0D9488]" />
          <div className="bg-[#FF007F]" />
          <div className="bg-[#5C2808]" />
          <div className="bg-[#00A33D]" />
          <div className="bg-[#0055FF]" />
          <div className="bg-[#7E22CE]" />
          <div className="absolute inset-0 w-1/3 bg-white/40 animate-energy-sweep" />
        </div>

        {/* Clean Top Controls Row (never overlaps festive stage) */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleBoostEnergy}
            aria-label="Reproducir sonido de celebración y más energía"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#EA580C] bg-white border border-orange-200 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Volume2 className="w-3.5 h-3.5" />
            ¡Más energía!
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar felicitación"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 sm:px-8 pb-7 pt-1 space-y-5">
          {/* High-Energy Festive Stage: Confetti, Balloons, Flowers & Hearts */}
          <div className="relative h-36 flex items-center justify-center gap-2 sm:gap-4 select-none overflow-hidden rounded-2xl bg-gradient-to-b from-amber-50/70 via-white to-white border border-amber-200 px-3">
            {/* Confetti Shower */}
            {CONFETTI_PIECES.map((c, idx) => (
              <span
                key={idx}
                aria-hidden="true"
                className="absolute animate-confetti pointer-events-none"
                style={{ left: c.left, top: c.top, animationDelay: c.delay }}
              >
                {c.shape === 'star' ? (
                  <StarBurstSvg color={c.color} className="w-3.5 h-3.5" />
                ) : c.shape === 'circle' ? (
                  <span
                    className="block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                ) : (
                  <span
                    className="block w-2.5 h-1.5 rounded-xs"
                    style={{ backgroundColor: c.color }}
                  />
                )}
              </span>
            ))}

            {/* 4 Balloons + 2 Flowers + 3 Hearts (fit cleanly on mobile & desktop) */}
            <div className="animate-float-slow z-10 shrink-0">
              <BalloonSvg color="#1D4ED8" className="w-7 h-12 sm:w-12 sm:h-20" />
            </div>

            <div className="animate-spin-bloom z-10 shrink-0">
              <FlowerSvg petalColor="#F59E0B" centerColor="#7C2D12" className="w-8 h-8 sm:w-12 sm:h-12" />
            </div>

            <div className="animate-pulse-heart z-10 shrink-0">
              <HeartSvg color="#DB2777" className="w-7 h-7 sm:w-11 sm:h-11" />
            </div>

            <div className="animate-float-alt z-10 shrink-0">
              <BalloonSvg color="#15803D" className="w-8 h-14 sm:w-14 sm:h-24" />
            </div>

            <div className="animate-pulse-heart z-10 shrink-0">
              <HeartSvg color="#7E22CE" className="w-6 h-6 sm:w-10 sm:h-10" />
            </div>

            <div className="animate-float-slow z-10 shrink-0">
              <BalloonSvg color="#F59E0B" className="w-7 h-12 sm:w-12 sm:h-20" />
            </div>

            <div className="animate-spin-bloom z-10 shrink-0">
              <FlowerSvg petalColor="#EA580C" centerColor="#FDE047" className="w-8 h-8 sm:w-12 sm:h-12" />
            </div>

            <div className="animate-pulse-heart z-10 hidden sm:block shrink-0">
              <HeartSvg color="#FF007F" className="w-9 h-9" />
            </div>

            <div className="animate-float-alt z-10 shrink-0">
              <BalloonSvg color="#0D9488" className="w-7 h-12 sm:w-12 sm:h-20" />
            </div>
          </div>

          {/* Energetic Headline & Kicker */}
          <div className="text-center space-y-3">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-[#7E22CE]">
              <Zap className="w-4 h-4 text-[#0055FF]" />
              <span>Prof: Liz Acuña</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#0D9488]">¡Nuevo Impulso Activado!</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#15803D]">Energía Emprendedora 100%</span>
            </div>

            <h2
              id="celebration-modal-title"
              className="text-2xl sm:text-3xl font-extrabold text-[#1E3A8A] leading-tight text-balance"
            >
              ¡Felicidades por dar este gran paso! ¡Tu empresa despega hoy!
            </h2>

            {/* Exact Required Message Highlighted Cleanly */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#15803D] shadow-sm space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#7E22CE]">
                <Flame className="w-4 h-4 text-[#FF007F]" />
                <span>¡A conquistar tu meta!</span>
                <Sparkles className="w-4 h-4 text-[#0D9488]" />
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                Hoy has dado el primer paso, ahora vamos a materializar tus ideas! Te acompaño, vamos, hacia adelante, un paso atrás sólo se permite para tomar impulso.
              </p>
            </div>

            {/* Bottom Flowers & Hearts Celebration Accent */}
            <div className="flex items-center justify-center gap-3 sm:gap-5 pt-1" aria-hidden="true">
              <div className="animate-spin-bloom">
                <FlowerSvg petalColor="#EC4899" centerColor="#FDE047" className="w-7 h-7" />
              </div>
              <div className="animate-pulse-heart">
                <HeartSvg color="#FF007F" className="w-6 h-6" />
              </div>
              <div className="animate-spin-bloom">
                <FlowerSvg petalColor="#7E22CE" centerColor="#FACC15" className="w-7 h-7" />
              </div>
              <div className="animate-pulse-heart">
                <HeartSvg color="#15803D" className="w-6 h-6" />
              </div>
              <div className="animate-spin-bloom">
                <FlowerSvg petalColor="#1D4ED8" centerColor="#FDE047" className="w-7 h-7" />
              </div>
              <div className="animate-pulse-heart">
                <HeartSvg color="#EA580C" className="w-6 h-6" />
              </div>
            </div>

            {/* Clear Forward Navigation Actions (Never Stuck!) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStartPassion}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-bold text-white bg-[#1D4ED8] hover:bg-blue-800 rounded-xl shadow-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <Rocket className="w-4 h-4" />
                ¡Vamos hacia adelante! Empezar Paso 1
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onGoToModule1}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold text-[#15803D] bg-white border-2 border-[#15803D] hover:bg-green-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Compass className="w-4 h-4" />
                Ir directo al Módulo 1 del Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
