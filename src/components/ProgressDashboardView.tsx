import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Circle } from 'lucide-react';
import { MODULES, QUESTIONS_40 } from '../data/questionsAndRubric';
import { BusinessPlanState, ModuleId } from '../types/businessPlan';
import {
  calculateAcademicProgress,
  calculateRubricTotal,
  isMeaningfulAnswer,
} from '../utils/businessLogic';

interface ProgressDashboardViewProps {
  state: BusinessPlanState;
  onJumpToQuestion: (moduleId: ModuleId, questionId: string) => void;
  onGoToReport: () => void;
}

export const ProgressDashboardView: React.FC<ProgressDashboardViewProps> = ({
  state,
  onJumpToQuestion,
  onGoToReport,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const progress = calculateAcademicProgress(state);
  const rubricSummary = calculateRubricTotal(state.rubric.scores);

  const filteredQuestions = QUESTIONS_40.filter((q) => {
    const done = isMeaningfulAnswer(state.answers[q.id]);
    if (filter === 'pending') return !done;
    if (filter === 'done') return done;
    return true;
  });

  return (
    <div className="space-y-8 bg-white">
      {/* Header & Top Metrics */}
      <section className="bg-white border-2 border-purple-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#1E3A8A]">
              Prof: Liz Acuña · Seguimiento de Avance Estudiantil
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#7E22CE]">
              Progreso Académico del Plan Integral ({progress.totalQuestions} Preguntas)
            </h1>
            <p className="text-sm text-slate-600">
              {state.studentName ? `Estudiante: ${state.studentName}` : 'Estudiante sin registrar'}
              {state.companyName ? ` · Empresa: ${state.companyName}` : ''} — Revisa tus {progress.totalQuestions} preguntas resueltas y el cumplimiento por módulo.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToReport}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-blue-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Abrir Informe y Rúbrica
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border-2 border-red-200">
            <span className="text-xs text-slate-600 block">Preguntas Resueltas</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-[#DC2626]">
              {progress.answeredCount} / {progress.totalQuestions}
            </span>
            <span className="text-xs font-mono tabular-nums text-[#DC2626] block mt-1">
              {progress.percentage}% completado
            </span>
          </div>
          <div className="p-4 rounded-xl bg-white border-2 border-orange-200">
            <span className="text-xs text-slate-600 block">Empresa / Modelo</span>
            <span className="text-lg font-bold text-[#C2410C] block truncate">
              {state.companyName || (progress.hasSelectedModel ? 'Definido' : 'Pendiente')}
            </span>
            <span className="text-xs text-[#C2410C] block mt-1">
              {state.proposals.length} opciones estudiadas con Gemini
            </span>
          </div>
          <div className="p-4 rounded-xl bg-white border-2 border-blue-200">
            <span className="text-xs text-slate-600 block">Bancos de CR Investigados</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-[#1D4ED8]">
              {progress.banksResearchedCount} / 4
            </span>
            <span className="text-xs text-[#1D4ED8] block mt-1">
              {progress.hasSelectedBank ? 'Banco elegido confirmado' : 'Falta elegir banco'}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-white border-2 border-green-200">
            <span className="text-xs text-slate-600 block">Rúbrica SIG Estimada</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-[#15803D]">
              {rubricSummary.totalScore} / {rubricSummary.maxScore}
            </span>
            <span className="text-xs text-[#15803D] block mt-1">
              Nivel {rubricSummary.performanceLevel}
            </span>
          </div>
        </div>
      </section>

      {/* Module Progress Bars */}
      <section className="bg-white border-2 border-blue-200 rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-bold text-[#1D4ED8]">Avance por Módulo Temático</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map((mod) => {
            const modProg = progress.modules.find((m) => m.moduleId === mod.id);
            const firstQuestion = QUESTIONS_40.find((q) => q.moduleId === mod.id);
            return (
              <div
                key={mod.id}
                className="p-4 rounded-xl bg-white border-2 space-y-2.5 flex flex-col justify-between"
                style={{ borderColor: `${mod.accentColor}33` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold" style={{ color: mod.accentColor }}>
                      Módulo {mod.order}
                    </div>
                    <h3 className="text-sm font-bold" style={{ color: mod.accentColor }}>
                      {mod.shortTitle}
                    </h3>
                  </div>
                  <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                    {modProg?.answered ?? 0} / {modProg?.total ?? 0}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${modProg?.percentage ?? 0}%`,
                      backgroundColor: mod.accentColor,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-mono tabular-nums">{modProg?.percentage ?? 0}% completado</span>
                  {firstQuestion && (
                    <button
                      type="button"
                      onClick={() => onJumpToQuestion(mod.id, firstQuestion.id)}
                      className="font-bold hover:underline cursor-pointer"
                      style={{ color: mod.accentColor }}
                    >
                      Ir al módulo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive 51 Questions Checklist */}
      <section className="bg-white border-2 border-green-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#15803D]">
            Lista de Verificación de las {progress.totalQuestions} Preguntas
          </h2>
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'all' ? 'bg-[#1D4ED8] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({progress.totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'pending' ? 'bg-[#EA580C] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes ({progress.totalQuestions - progress.answeredCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('done')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'done' ? 'bg-[#15803D] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completadas ({progress.answeredCount})
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
          {filteredQuestions.map((q) => {
            const done = isMeaningfulAnswer(state.answers[q.id]);
            const mod = MODULES.find((m) => m.id === q.moduleId);
            return (
              <div
                key={q.id}
                className="flex items-center justify-between gap-4 px-4 py-3 bg-white hover:bg-blue-50/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      <span
                        className="font-mono tabular-nums font-bold mr-1.5"
                        style={{ color: mod?.accentColor || '#1D4ED8' }}
                      >
                        {q.number}.
                      </span>
                      {q.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {mod?.shortTitle} · {done ? 'Respondida' : 'Sin completar'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onJumpToQuestion(q.moduleId, q.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {done ? 'Editar' : 'Responder'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
