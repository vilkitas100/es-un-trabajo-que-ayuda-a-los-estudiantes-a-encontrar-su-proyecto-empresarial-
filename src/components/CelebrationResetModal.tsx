import React, { useEffect } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';

interface CelebrationResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BalloonSvg: React.FC<{ color: string; className?: string }> = ({ color, className = '' }) => (
  <svg viewBox="0 0 48 80" className={className} aria-hidden="true">
    <ellipse cx="24" cy="26" rx="18" ry="22" fill={color} />
    <ellipse cx="18" cy="18" rx="4.5" ry="7" fill="#ffffff" fillOpacity="0.35" transform="rotate(-18 18 18)" />
    <polygon points="24,48 20,53 28,53" fill={color} />
    <path d="M24 53 Q20 62 25 69 T23 79" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
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
        rx="8"
        ry="13"
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
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />
  </svg>
);

export const CelebrationResetModal: React.FC<CelebrationResetModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-modal-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white border-2 border-blue-200 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar felicitación"
          className="absolute top-4 right-4 z-20 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative festive stage: Balloons, Flowers & Hearts */}
        <div className="relative h-28 flex items-center justify-center gap-3 sm:gap-5 mb-4 select-none">
          <div className="animate-float-slow">
            <BalloonSvg color="#1D4ED8" className="w-10 h-16 sm:w-12 sm:h-20" />
          </div>

          <div className="animate-float-alt">
            <FlowerSvg petalColor="#F59E0B" centerColor="#7C2D12" className="w-11 h-11 sm:w-12 sm:h-12" />
          </div>

          <div className="animate-pulse-heart">
            <HeartSvg color="#E11D48" className="w-9 h-9 sm:w-10 sm:h-10" />
          </div>

          <div className="animate-float-alt">
            <BalloonSvg color="#15803D" className="w-11 h-18 sm:w-13 sm:h-22" />
          </div>

          <div className="animate-pulse-heart">
            <HeartSvg color="#7E22CE" className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>

          <div className="animate-float-slow">
            <FlowerSvg petalColor="#EA580C" centerColor="#FACC15" className="w-11 h-11 sm:w-12 sm:h-12" />
          </div>

          <div className="animate-float-alt">
            <BalloonSvg color="#DC2626" className="w-10 h-16 sm:w-12 sm:h-20" />
          </div>
        </div>

        {/* Message Content */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7E22CE]">
            <Sparkles className="w-4 h-4 text-[#EA580C]" />
            <span>Prof: Liz Acuña · Nuevo Impulso Emprendedor</span>
          </div>

          <h2 id="celebration-modal-title" className="text-2xl sm:text-3xl font-bold text-[#1E3A8A] leading-tight">
            ¡Felicidades por dar este gran paso!
          </h2>

          <div className="p-5 rounded-2xl bg-white border-2 border-green-200 space-y-3">
            <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
              Hoy has dado el primer paso, ahora vamos a materializar tus ideas! Te acompaño, vamos, hacia adelante, un paso atrás sólo se permite para tomar impulso.
            </p>
          </div>

          {/* Bottom flowers & hearts accent row */}
          <div className="flex items-center justify-center gap-4 pt-1" aria-hidden="true">
            <FlowerSvg petalColor="#EC4899" centerColor="#FDE047" className="w-6 h-6" />
            <HeartSvg color="#DC2626" className="w-5 h-5" />
            <FlowerSvg petalColor="#7E22CE" centerColor="#FACC15" className="w-6 h-6" />
            <HeartSvg color="#15803D" className="w-5 h-5" />
            <FlowerSvg petalColor="#1D4ED8" centerColor="#FDE047" className="w-6 h-6" />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-bold text-white bg-[#1D4ED8] hover:bg-blue-800 rounded-xl transition-colors cursor-pointer"
            >
              ¡Vamos hacia adelante!
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
