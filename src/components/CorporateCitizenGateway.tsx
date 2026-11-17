import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Flame,
  Scale,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react';
import { playCelebrationFanfare } from '../utils/celebrationSound';

interface CorporateCitizenGatewayProps {
  studentName: string;
  companyName: string;
  value: string;
  onChange: (value: string) => void;
  onConfirmAndStartPlan: () => void;
  onBackToPassion: () => void;
}

const CITIZEN_SPARKS = [
  'Íntegro, transparente con sus impuestos y leal con sus clientes',
  'Rentable, innovador y respetuoso del bienestar de su equipo',
  'Sostenible, generador de empleo digno y orgullo de su comunidad',
];

export const CorporateCitizenGateway: React.FC<CorporateCitizenGatewayProps> = ({
  studentName,
  companyName,
  value,
  onChange,
  onConfirmAndStartPlan,
  onBackToPassion,
}) => {
  const [validationHint, setValidationHint] = useState<string | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().length < 10) {
      setValidationHint(
        'Esta pregunta es obligatoria: describe en al menos 10 caracteres cómo quieres que sea tu ciudadano corporativo antes de iniciar el plan.'
      );
      return;
    }
    setValidationHint(null);
    playCelebrationFanfare();
    onConfirmAndStartPlan();
  };

  const handleSparkAdd = (spark: string) => {
    setValidationHint(null);
    const trimmed = value.trim();
    if (!trimmed) {
      onChange(`Quiero que mi ciudadano corporativo sea ${spark.toLowerCase()}.`);
    } else if (!trimmed.includes(spark)) {
      onChange(`${trimmed} Además, ${spark.toLowerCase()}.`);
    }
  };

  return (
    <section
      key={pulseKey}
      aria-labelledby="corporate-citizen-heading"
      className="max-w-4xl mx-auto bg-white border-2 border-amber-400 rounded-3xl shadow-xl overflow-hidden animate-modal-pop"
    >
      {/* Top 6-Color Dopamine Energy Ribbon */}
      <div className="relative h-3 w-full grid grid-cols-6 overflow-hidden" aria-hidden="true">
        <div className="bg-[#FF007F]" />
        <div className="bg-[#FF5500]" />
        <div className="bg-[#F59E0B]" />
        <div className="bg-[#00A33D]" />
        <div className="bg-[#0055FF]" />
        <div className="bg-[#9D00FF]" />
        <div className="absolute inset-0 w-1/3 bg-white/40 animate-energy-sweep" />
      </div>

      <div className="p-6 sm:p-10 space-y-7 bg-white">
        {/* Top Row: Clean Unboxed Metadata + Energy Sound Boost */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#1E3A8A]">
            <Zap className="w-4 h-4 text-[#FF5500]" />
            <span>Prof: Liz Acuña</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9D00FF]">Momento Clave Antes de Iniciar el Plan</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#00A33D]">Nacimiento Jurídico</span>
          </div>

          <button
            type="button"
            onClick={() => {
              playCelebrationFanfare();
              setPulseKey((k) => k + 1);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FF5500] bg-white border border-orange-300 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Volume2 className="w-3.5 h-3.5" />
            ¡Sentir impulso!
          </button>
        </div>

        {/* High-Energy Festive Celebration Stage */}
        <div className="relative rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-amber-50/60 via-white to-white p-6 text-center space-y-4 overflow-hidden">
          <div className="flex items-center justify-center gap-4 sm:gap-6 select-none" aria-hidden="true">
            <div className="animate-float-slow">
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#0055FF]" />
            </div>
            <div className="animate-pulse-heart">
              <Sparkles className="w-7 h-7 sm:w-9 sm:h-9 text-[#F59E0B]" />
            </div>
            <div className="animate-float-alt">
              <Scale className="w-9 h-9 sm:w-11 sm:h-11 text-[#9D00FF]" />
            </div>
            <div className="animate-pulse-heart">
              <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-[#FF007F]" />
            </div>
            <div className="animate-float-slow">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#00A33D]" />
            </div>
          </div>

          <h1
            id="corporate-citizen-heading"
            className="text-2xl sm:text-3xl font-extrabold text-[#1E3A8A] leading-tight text-balance"
          >
            ¡Acabas de dar vida a un nuevo Ciudadano Corporativo!
          </h1>

          {(studentName || companyName) && (
            <p className="text-xs sm:text-sm font-bold text-[#0055FF]">
              {studentName ? `Creador(a): ${studentName}` : ''}
              {studentName && companyName ? ' · ' : ''}
              {companyName ? `Persona Jurídica: ${companyName}` : ''}
            </p>
          )}

          {/* Exact Dopamine Intermediate Message */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#00A33D] shadow-sm">
            <p className="text-base sm:text-xl font-bold text-slate-900 leading-relaxed">
              Hoy has creado una persona, un ciudadano corporativo —sí, una persona jurídica—, con responsabilidades y derechos que se incorporará a la sociedad humana. ¿Tienes conciencia de lo que eso significa?
            </p>
          </div>
        </div>

        {/* Interactive Space to Answer the Corporate Citizen Design Question */}
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="corporate-citizen-vision"
              className="block text-lg sm:text-xl font-extrabold leading-snug"
              style={{
                color: '#FF007F',
                textShadow: '0 0 10px rgba(255, 0, 127, 0.2)',
              }}
            >
              ¿Eres el creador de un nuevo ciudadano, un ciudadano corporativo: cómo quieres que sea esa persona jurídica?
            </label>
            <p className="text-sm sm:text-base font-bold text-[#0055FF]">
              Debes idearlo, para que no vayas a crear un Frankenstein o un ciudadano corporativo fracasado.
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Define su carácter moral, su respeto a la ley y a las personas, su disciplina financiera y la huella positiva que dejará en Costa Rica.
            </p>
          </div>

          <textarea
            id="corporate-citizen-vision"
            rows={4}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (validationHint && e.target.value.trim().length >= 10) {
                setValidationHint(null);
              }
            }}
            placeholder="Ej. Quiero que mi empresa sea un ciudadano corporativo íntegro, ético y admirado: puntual con sus impuestos y proveedores, justo con sus trabajadores, respetuoso del ambiente y comprometido con resolver necesidades reales sin engañar nunca al cliente..."
            className="w-full px-4 py-3 text-sm sm:text-base bg-white border-2 border-purple-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#9D00FF] focus:border-[#9D00FF]"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Chispas de diseño:</span>
            {CITIZEN_SPARKS.map((spark) => (
              <button
                key={spark}
                type="button"
                onClick={() => handleSparkAdd(spark)}
                className="text-xs font-bold text-[#9D00FF] bg-white border border-purple-200 hover:bg-purple-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                + {spark}
              </button>
            ))}
          </div>

          {validationHint && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-pink-300 text-xs sm:text-sm text-[#BE185D] font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#BE185D]" />
              <span>{validationHint}</span>
            </div>
          )}

          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onBackToPassion}
              className="px-4 py-3 text-xs sm:text-sm font-semibold text-[#0F766E] hover:bg-teal-50 bg-white border border-teal-300 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              Volver a 1. Pasión
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-bold text-white bg-[#1D4ED8] hover:bg-blue-800 rounded-xl shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              ¡Dar vida a mi Ciudadano Corporativo e Iniciar el Plan!
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
