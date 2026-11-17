import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Scale,
  Sparkles,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import {
  isConscienceReflectionComplete,
  LEGAL_PERSON_PHILOSOPHICAL_QUESTION,
  MIN_CONSCIENCE_CHARS,
} from '../utils/businessLogic';
import { playCelebrationFanfare } from '../utils/celebrationSound';

export type PendingExportAction = 'pdf' | 'word' | 'print' | null;

interface FinalProgressCelebrationModalProps {
  isOpen: boolean;
  studentName: string;
  companyName: string;
  initialAnswer: string;
  pendingExportAction: PendingExportAction;
  onClose: () => void;
  onConfirmAnswer: (answer: string) => void;
}

const BalloonSvg: React.FC<{ color: string; className?: string }> = ({ color, className = '' }) => (
  <svg viewBox="0 0 48 80" className={className} aria-hidden="true">
    <ellipse cx="24" cy="26" rx="18" ry="22" fill={color} />
    <ellipse
      cx="18"
      cy="18"
      rx="4.5"
      ry="7"
      fill="#ffffff"
      fillOpacity="0.45"
      transform="rotate(-18 18 18)"
    />
    <polygon points="24,48 20,53 28,53" fill={color} />
    <path
      d="M24 53 Q20 62 25 69 T23 79"
      fill="none"
      stroke="#64748B"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
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

const CONFETTI = [
  { left: '7%', top: '12%', color: '#FF007F', delay: '0s', shape: 'star' },
  { left: '16%', top: '24%', color: '#0055FF', delay: '0.2s', shape: 'circle' },
  { left: '26%', top: '10%', color: '#00A33D', delay: '0.4s', shape: 'rect' },
  { left: '37%', top: '20%', color: '#FF5500', delay: '0.15s', shape: 'star' },
  { left: '50%', top: '8%', color: '#9D00FF', delay: '0.35s', shape: 'circle' },
  { left: '63%', top: '18%', color: '#F59E0B', delay: '0.1s', shape: 'rect' },
  { left: '75%', top: '10%', color: '#0D9488', delay: '0.45s', shape: 'star' },
  { left: '85%', top: '22%', color: '#008ECC', delay: '0.25s', shape: 'circle' },
  { left: '93%', top: '14%', color: '#CC00EE', delay: '0.5s', shape: 'rect' },
] as const;

export const FinalProgressCelebrationModal: React.FC<FinalProgressCelebrationModalProps> = ({
  isOpen,
  studentName,
  companyName,
  initialAnswer,
  pendingExportAction,
  onClose,
  onConfirmAnswer,
}) => {
  const [burstKey, setBurstKey] = useState(0);
  const [draft, setDraft] = useState(initialAnswer);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(initialAnswer);
      setValidationError(null);
    }
  }, [isOpen, initialAnswer]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmedLength = draft.trim().length;
  const ready = isConscienceReflectionComplete(draft);

  const exportActionLabel =
    pendingExportAction === 'pdf'
      ? 'descargar el informe en PDF'
      : pendingExportAction === 'word'
        ? 'descargar el informe en Word (.doc)'
        : pendingExportAction === 'print'
          ? 'imprimir el informe'
          : 'desbloquear la descarga de tu informe';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) {
      setValidationError(
        `Por favor escribe una reflexión filosófica genuina de al menos ${MIN_CONSCIENCE_CHARS} caracteres (llevas ${trimmedLength}).`
      );
      return;
    }
    setValidationError(null);
    playCelebrationFanfare();
    onConfirmAnswer(draft.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="final-progress-conscience-title"
      onClick={onClose}
    >
      <div
        key={burstKey}
        onClick={(e) => e.stopPropagation()}
        className="my-auto relative w-full max-w-2xl overflow-hidden bg-white border-2 border-[#7E22CE] rounded-3xl shadow-2xl animate-modal-pop"
      >
        {/* Top 6-Color Energy Ribbon */}
        <div className="relative h-3 w-full grid grid-cols-6 overflow-hidden" aria-hidden="true">
          <div className="bg-[#7E22CE]" />
          <div className="bg-[#FF007F]" />
          <div className="bg-[#FF5500]" />
          <div className="bg-[#F59E0B]" />
          <div className="bg-[#00A33D]" />
          <div className="bg-[#0055FF]" />
          <div className="absolute inset-0 w-1/3 bg-white/40 animate-energy-sweep" />
        </div>

        {/* Top Controls Row */}
        <div className="px-5 pt-3.5 pb-1.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              playCelebrationFanfare();
              setBurstKey((k) => k + 1);
            }}
            aria-label="Reproducir sonido de celebración y más energía"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FF5500] bg-white border border-orange-200 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Volume2 className="w-3.5 h-3.5" />
            ¡Más energía!
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar felicitación final"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 sm:px-8 pb-6 pt-1 space-y-4">
          {/* Festive Celebration Stage */}
          <div className="relative h-24 flex items-center justify-center gap-2 sm:gap-4 select-none overflow-hidden rounded-2xl bg-gradient-to-b from-purple-50/70 via-white to-white border border-purple-200 px-3">
            {CONFETTI.map((c, idx) => (
              <span
                key={idx}
                aria-hidden="true"
                className="absolute animate-confetti pointer-events-none"
                style={{ left: c.left, top: c.top, animationDelay: c.delay }}
              >
                {c.shape === 'star' ? (
                  <StarBurstSvg color={c.color} className="w-3.5 h-3.5" />
                ) : c.shape === 'circle' ? (
                  <span className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                ) : (
                  <span className="block w-2.5 h-1.5 rounded-xs" style={{ backgroundColor: c.color }} />
                )}
              </span>
            ))}

            <div className="animate-float-slow z-10 shrink-0">
              <BalloonSvg color="#FF007F" className="w-7 h-11 sm:w-9 sm:h-15" />
            </div>
            <div className="animate-spin-bloom z-10 shrink-0">
              <FlowerSvg petalColor="#F59E0B" centerColor="#7C2D12" className="w-7 h-7 sm:w-9 sm:h-9" />
            </div>
            <div className="animate-pulse-heart z-10 shrink-0">
              <HeartSvg color="#DB2777" className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="animate-float-alt z-10 shrink-0">
              <BalloonSvg color="#0055FF" className="w-8 h-12 sm:w-10 sm:h-16" />
            </div>
            <div className="animate-pulse-heart z-10 shrink-0">
              <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-[#7E22CE]" />
            </div>
            <div className="animate-spin-bloom z-10 shrink-0">
              <FlowerSvg petalColor="#00A33D" centerColor="#FDE047" className="w-7 h-7 sm:w-9 sm:h-9" />
            </div>
            <div className="animate-float-slow z-10 shrink-0">
              <BalloonSvg color="#FF5500" className="w-7 h-11 sm:w-9 sm:h-15" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-[#9D00FF]">
              <Zap className="w-4 h-4 text-[#FF5500]" />
              <span>Prof: Liz Acuña</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#00A33D]">¡Etapa de Progreso Culminada!</span>
            </div>

            <h2
              id="final-progress-conscience-title"
              className="text-xl sm:text-2xl font-extrabold text-[#1E3A8A] leading-tight text-balance"
            >
              ¡Felicidades por finalizar tu parte de Progreso
              {studentName ? `, ${studentName.split(' ')[0]}` : ''}!
            </h2>

            {companyName && (
              <p className="text-xs sm:text-sm font-bold text-[#0055FF]">
                Tu persona jurídica en nacimiento: {companyName}
              </p>
            )}
          </div>

          {/* Core Conscience Question + Deep Philosophical Question */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#FF007F] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF007F]">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span>Pregunta de Conciencia y Reflexión Filosófica</span>
            </div>

            <p className="text-base sm:text-lg font-extrabold text-[#DB2777] leading-snug">
              ¿Eres consciente de lo que significa la creación de una persona jurídica?
            </p>

            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {LEGAL_PERSON_PHILOSOPHICAL_QUESTION}
            </p>
          </div>

          {/* Mandatory Response Field to Unlock Report Download */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="legal-person-conscience-input"
                className="text-xs sm:text-sm font-bold text-[#7E22CE] flex items-center gap-1.5"
              >
                {ready ? (
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-[#EA580C] shrink-0" />
                )}
                <span>Tu respuesta filosófica (obligatoria para {exportActionLabel}):</span>
              </label>
              <span
                className={`text-xs font-mono tabular-nums font-bold ${
                  ready ? 'text-[#15803D]' : 'text-[#EA580C]'
                }`}
              >
                {trimmedLength} / {MIN_CONSCIENCE_CHARS}+ caracteres
              </span>
            </div>

            <textarea
              id="legal-person-conscience-input"
              rows={3}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Responde desde tu conciencia ética y tu vocación como futuro profesional: ¿qué huella justa y humana defenderá tu empresa dentro de veinte años?"
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7E22CE] leading-relaxed"
            />

            {validationError && (
              <p role="alert" className="text-xs font-semibold text-[#BE185D]">
                {validationError}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-center"
            >
              Responder después
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#15803D] hover:bg-green-800 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <span>
                {pendingExportAction
                  ? 'Guardar reflexión y descargar informe'
                  : 'Guardar reflexión e ir al Informe'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
