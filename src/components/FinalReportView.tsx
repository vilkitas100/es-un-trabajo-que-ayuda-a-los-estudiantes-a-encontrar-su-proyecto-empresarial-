import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Lock,
  Printer,
  Scale,
  Sparkles,
} from 'lucide-react';
import { MODULES, QUESTIONS_40, SIG_RUBRIC_CRITERIA } from '../data/questionsAndRubric';
import { BusinessPlanState, RubricScoreValue } from '../types/businessPlan';
import {
  buildWordReportHtml,
  calculateAcademicProgress,
  calculateBankComparisonMetrics,
  calculateFinancialSummary,
  calculateRubricTotal,
  formatCRC,
  isConscienceReflectionComplete,
} from '../utils/businessLogic';
import { downloadReportAsPDF } from '../utils/pdfExport';
import { getQuestionElectricColor } from '../utils/questionColors';
import { PendingExportAction } from './FinalProgressCelebrationModal';
import {
  BankComparisonBarChart,
  CashflowProjectionChart,
  RubricProfileChart,
  StartupCostDonutChart,
} from './Charts';

interface FinalReportViewProps {
  state: BusinessPlanState;
  onSetRubricScore: (criterionId: number, score: RubricScoreValue) => void;
  onSetRubricComment: (comment: string) => void;
  onApplyAIRubricEvaluation: (
    scores: Record<number, RubricScoreValue>,
    justifications: Record<number, string>,
    finalComment: string
  ) => void;
  onRequestConscienceModal: (pendingAction: PendingExportAction) => void;
}

export const FinalReportView: React.FC<FinalReportViewProps> = ({
  state,
  onSetRubricScore,
  onSetRubricComment,
  onApplyAIRubricEvaluation,
  onRequestConscienceModal,
}) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [bannerImgFailed, setBannerImgFailed] = useState(false);

  const progress = calculateAcademicProgress(state);
  const financial = calculateFinancialSummary(state.startupCosts, state.financialAssumptions);
  const bankMetrics = calculateBankComparisonMetrics(
    state.banks,
    Math.max(500000, financial.capitalGapCRC || financial.totalStartupCostCRC)
  );
  const rubricSummary = calculateRubricTotal(state.rubric.scores);
  const selectedModel = state.proposals.find((p) => p.id === state.selectedProposalId);
  const selectedBank = state.banks.find((b) => b.id === state.selectedBankId);

  const activeFinalComment =
    state.rubric.finalComment.trim() || rubricSummary.generatedComment;

  const handleEvaluateWithGemini = async () => {
    setEvalError(null);
    setIsEvaluating(true);
    try {
      const resp = await fetch('/api/gemini/evaluate-rubric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSummary: {
            studentName: state.studentName,
            teamMembers: state.teamMembers,
            companyName: state.companyName,
            passion: state.passionText,
            selectedModel: selectedModel?.name,
            answeredCount: `${progress.answeredCount}/${progress.totalQuestions}`,
            totalStartupCostCRC: financial.totalStartupCostCRC,
            selectedBank: selectedBank?.bankName,
            answersSample: QUESTIONS_40.map((q) => ({
              n: q.number,
              title: q.title,
              answer: state.answers[q.id] || '',
            })),
          },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'No se pudo evaluar con Gemini.');
      }

      const nextScores: Record<number, RubricScoreValue> = { ...state.rubric.scores };
      const nextJustifications: Record<number, string> = { ...state.rubric.justifications };

      if (Array.isArray(data.criteria)) {
        for (const item of data.criteria) {
          const clamped = Math.min(4, Math.max(1, Number(item.score) || 1)) as RubricScoreValue;
          nextScores[item.id] = clamped;
          if (item.justification) {
            nextJustifications[item.id] = item.justification;
          }
        }
      }

      onApplyAIRubricEvaluation(
        nextScores,
        nextJustifications,
        data.finalComment || calculateRubricTotal(nextScores).generatedComment
      );
    } catch (err: unknown) {
      setEvalError(err instanceof Error ? err.message : 'Error al evaluar la rúbrica.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const reflectionComplete = isConscienceReflectionComplete(state.legalPersonConscienceAnswer);

  const handleDownloadWord = () => {
    if (!reflectionComplete) {
      onRequestConscienceModal('word');
      return;
    }
    const htmlContent = buildWordReportHtml(state);
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (state.companyName || 'Empresa_Simulada').replace(/[^a-zA-Z0-9_-]+/g, '_');
    a.download = `Informe_Final_${safeName}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!reflectionComplete) {
      onRequestConscienceModal('pdf');
      return;
    }
    downloadReportAsPDF(state);
  };

  const handlePrintReport = () => {
    if (!reflectionComplete) {
      onRequestConscienceModal('print');
      return;
    }
    window.print();
  };

  const roadmapPhases = [
    {
      phase: 'Fase 1 · Mes 0 (Formalización y Prototipo)',
      color: '#DC2626',
      items: [
        'Inscripción en Hacienda (ATV/TRIBU-CR) y activación de Facturación Electrónica.',
        'Solicitud de Uso de Suelo, Permiso Sanitario del Ministerio de Salud y Patente Municipal.',
        'Registro en CCSS, póliza de Riesgos del Trabajo INS y registro PYME ante el MEIC.',
        `Formalización de financiamiento con ${selectedBank?.shortName || 'entidad elegida'} y compra de equipamiento.`,
      ],
    },
    {
      phase: 'Fase 2 · Mes 1 (Lanzamiento Comercial)',
      color: '#C2410C',
      items: [
        'Activación de canales digitales (Instagram, TikTok, Google Perfil y WhatsApp Business).',
        'Ejecución de campaña de primeros 30 días y oferta gancho para clientes pioneros.',
        'Puesta en marcha del Sistema de Información Gerencial (POS, inventarios y flujo de caja).',
      ],
    },
    {
      phase: 'Fase 3 · Meses 2–3 (Punto de Equilibrio)',
      color: '#15803D',
      items: [
        `Alcanzar la meta mínima de ${financial.breakEvenUnits ?? 'N/A'} unidades/servicios mensuales.`,
        'Revisión semanal de métricas (CAC, recompra, tiempos de entrega) con el equipo.',
        'Primer cierre mensual de declaración IVA (D-104) sin atrasos.',
      ],
    },
    {
      phase: 'Fase 4 · Meses 4–6 (Consolidación y Escala)',
      color: '#1D4ED8',
      items: [
        'Implementación de programa de fidelización y alianzas estratégicas B2B.',
        'Evaluación de capacidad instalada y reinversión de utilidades según pacto de socios.',
        'Auditoría de respaldo técnico y actualización del plan estratégico semestral.',
      ],
    },
  ];

  return (
    <div className="space-y-8 bg-white">
      {/* Executive Header */}
      <section className="bg-white border-2 border-blue-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 p-6 sm:p-8 space-y-5 flex flex-col justify-between bg-white">
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-bold text-[#1E3A8A]">
                Prof: Liz Acuña. Toma de Decisiones Gerenciales para crear mi empresa.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#7E22CE]">
                <span>{state.companyName || 'Empresa Simulada'}</span>
                <span aria-hidden="true">·</span>
                <span>{state.studentName || 'Estudiante Emprendedor'}</span>
                {state.teacherName && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Docente: {state.teacherName}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1D4ED8] text-balance">
                Informe final : Toma de decision gerencial para construir una empresa
              </h1>
              {state.companySlogan && (
                <p className="text-base font-semibold text-[#7E22CE]">{state.companySlogan}</p>
              )}
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong>Pasión origen:</strong> {state.passionText || 'Sin definir'}
                {selectedModel ? ` · Modelo: ${selectedModel.name}` : ''}
              </p>
              {state.corporateCitizenVision.trim() && (
                <p className="text-sm text-slate-800 leading-relaxed">
                  <strong style={{ color: '#FF007F' }}>Ciudadano Corporativo:</strong>{' '}
                  {state.corporateCitizenVision}
                </p>
              )}

              {reflectionComplete ? (
                <div className="p-3.5 rounded-xl bg-white border border-purple-200 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803D]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Conciencia Filosófica de la Persona Jurídica (Descarga desbloqueada)
                    </span>
                    <button
                      type="button"
                      onClick={() => onRequestConscienceModal(null)}
                      className="text-xs font-semibold text-[#7E22CE] hover:underline cursor-pointer no-print"
                    >
                      Editar reflexión
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {state.legalPersonConscienceAnswer}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-white border-2 border-[#FF007F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
                    <Scale className="w-4 h-4 text-[#FF007F] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#DC2626]">
                        ¿Eres consciente de lo que significa la creación de una persona jurídica?
                      </strong>{' '}
                      Responde la pregunta profunda y filosófica para desbloquear la descarga del informe.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequestConscienceModal(null)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#7E22CE] hover:bg-purple-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Responder pregunta filosófica
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 no-print">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#DC2626] hover:bg-red-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                {reflectionComplete ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Descargar en PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadWord}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-blue-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                {reflectionComplete ? <FileText className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Descargar en Word (.doc)
              </button>
              <button
                type="button"
                onClick={handlePrintReport}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#7C2D12] bg-white border-2 border-amber-300 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                {reflectionComplete ? <Printer className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Imprimir
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 min-h-[180px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
            {!bannerImgFailed ? (
              <img
                src="/src/assets/images/roadmap_growth_banner_1794885835598.jpg"
                alt="Hoja de ruta estratégica y crecimiento del emprendimiento"
                referrerPolicy="no-referrer"
                onError={() => setBannerImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6 text-center text-sm font-semibold text-slate-700">
                Hoja de Ruta Estratégica
              </div>
            )}
          </div>
        </div>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-t border-slate-200 bg-white">
          <div className="p-4">
            <span className="text-xs text-slate-500 block">Preguntas Resueltas</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#DC2626]">
              {progress.answeredCount} / {progress.totalQuestions}
            </span>
          </div>
          <div className="p-4">
            <span className="text-xs text-slate-500 block">Inversión Inicial</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#7C2D12]">
              {formatCRC(financial.totalStartupCostCRC)}
            </span>
          </div>
          <div className="p-4">
            <span className="text-xs text-slate-500 block">Brecha Crédito</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#C2410C]">
              {formatCRC(financial.capitalGapCRC)}
            </span>
          </div>
          <div className="p-4">
            <span className="text-xs text-slate-500 block">Punto Equilibrio</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#7E22CE]">
              {financial.breakEvenUnits ?? 'N/A'} unid./mes
            </span>
          </div>
          <div className="p-4">
            <span className="text-xs text-slate-500 block">Banco Elegido</span>
            <span className="text-lg font-bold text-[#1D4ED8] truncate block">
              {selectedBank?.shortName || 'Pendiente'}
            </span>
          </div>
          <div className="p-4">
            <span className="text-xs text-slate-500 block">Nota Rúbrica SIG</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#15803D]">
              {rubricSummary.totalScore} / 40 pts
            </span>
          </div>
        </div>
      </section>

      {/* Financial Charts & Table */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 print-break-inside-avoid">
        <div className="xl:col-span-5 bg-white border-2 border-green-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-[#15803D]">1. Estructura de Costos Iniciales</h2>
          <StartupCostDonutChart
            data={financial.costByCategory}
            totalCRC={financial.totalStartupCostCRC}
          />
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white border-b-2 border-green-200 text-[#15803D] font-bold">
                  <th className="py-2 px-3">Rubro</th>
                  <th className="py-2 px-3">Concepto</th>
                  <th className="py-2 px-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {state.startupCosts.map((c) => (
                  <tr key={c.id} className="bg-white">
                    <td className="py-2 px-3 font-medium text-slate-800">{c.category}</td>
                    <td className="py-2 px-3 text-slate-600">{c.concept}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900">
                      {formatCRC(c.amountCRC)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-7 bg-white border-2 border-blue-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#1D4ED8]">2. Proyección Financiera (12 Meses)</h2>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              Recuperación est.: {financial.paybackMonths ? `${financial.paybackMonths} meses` : 'N/A'}
            </span>
          </div>
          <CashflowProjectionChart points={financial.cashflow12Months} />
        </div>
      </section>

      {/* 4 Costa Rican Banks Table & Chart */}
      <section className="bg-white border-2 border-purple-200 rounded-2xl p-6 space-y-5 print-break-inside-avoid">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[#7E22CE]">
            3. Comparativa de Financiamiento en 4 Bancos de Costa Rica
          </h2>
          <span className="text-xs font-bold text-[#1D4ED8]">
            Banco Seleccionado: {selectedBank?.bankName || 'Sin seleccionar'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 overflow-x-auto border border-slate-200 rounded-xl bg-white">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-white border-b-2 border-purple-200 text-xs font-bold text-[#7E22CE]">
                  <th className="py-2.5 px-3">Banco</th>
                  <th className="py-2.5 px-3">Producto PyME</th>
                  <th className="py-2.5 px-3 text-right">Tasa</th>
                  <th className="py-2.5 px-3 text-right">Plazo</th>
                  <th className="py-2.5 px-3 text-right">Cuota Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {state.banks.map((bank) => {
                  const m = bankMetrics.find((x) => x.bankId === bank.id);
                  const isChosen = bank.id === state.selectedBankId;
                  return (
                    <tr key={bank.id} className={isChosen ? 'bg-blue-50/50 font-semibold' : 'bg-white'}>
                      <td className="py-2.5 px-3 text-slate-900">
                        {bank.shortName} {isChosen ? '(Elegido)' : ''}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{bank.productName}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {bank.annualInterestRatePct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {bank.maxTermMonths} m
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">
                        {formatCRC(m?.monthlyPaymentCRC ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="lg:col-span-5">
            <BankComparisonBarChart metrics={bankMetrics} selectedBankId={state.selectedBankId} />
          </div>
        </div>
      </section>

      {/* Professional Roadmap */}
      <section className="bg-white border-2 border-orange-200 rounded-2xl p-6 space-y-5 print-break-inside-avoid">
        <h2 className="text-lg font-bold text-[#C2410C]">
          4. Hoja de Ruta Profesional de Implementación
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roadmapPhases.map((phase) => (
            <div
              key={phase.phase}
              className="p-4 rounded-xl border-2 bg-white space-y-3"
              style={{ borderColor: `${phase.color}33` }}
            >
              <div className="text-xs font-bold" style={{ color: phase.color }}>
                {phase.phase}
              </div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc pl-4">
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Consolidated 51 Answers */}
      <section className="bg-white border-2 border-amber-300 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#7C2D12]">
            5. Consolidado Completo de las {progress.totalQuestions} Decisiones del Plan de Negocios
          </h2>
          <span className="text-xs font-mono tabular-nums font-bold text-[#15803D]">
            {progress.answeredCount} / {progress.totalQuestions} respondidas
          </span>
        </div>

        <div className="space-y-6">
          {MODULES.map((mod) => {
            const modQuestions = QUESTIONS_40.filter((q) => q.moduleId === mod.id);
            return (
              <div key={mod.id} className="space-y-3">
                <h3
                  className="text-sm font-bold pb-2 border-b-2"
                  style={{ color: mod.accentColor, borderColor: `${mod.accentColor}40` }}
                >
                  {mod.title}
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-700">
                        <th className="py-2.5 px-3 w-12">#</th>
                        <th className="py-2.5 px-3 w-64">Aspecto Evaluado</th>
                        <th className="py-2.5 px-3">Decisión y Respuesta del Estudiante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {modQuestions.map((q) => {
                        const ans = state.answers[q.id]?.trim();
                        const qColor = getQuestionElectricColor(q.number);
                        return (
                          <tr key={q.id} className="bg-white">
                            <td
                              className="py-2.5 px-3 font-mono tabular-nums font-extrabold align-top"
                              style={{ color: qColor.hex }}
                            >
                              {q.number}
                            </td>
                            <td
                              className="py-2.5 px-3 font-extrabold align-top"
                              style={{ color: qColor.hex, textShadow: `0 0 8px ${qColor.glow}` }}
                            >
                              {q.title}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 whitespace-pre-wrap align-top">
                              {ans || (
                                <span className="text-slate-400 italic">Pendiente de responder</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mandatory SIG Rubric (10 Criteria x 4 Points = 40 Points) */}
      <section id="rubrica-sig" className="bg-white border-2 border-red-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#7E22CE]">
              Instrumento Oficial de Evaluación (Base 40 Puntos)
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#DC2626]">
              Rúbrica de la propuesta de sistema de información gerencial
            </h2>
            <p className="text-sm text-slate-600">
              Selecciona el nivel (4, 3, 2 o 1) en cada criterio o solicita a Gemini una evaluación automatizada. El total suma exactamente sobre 40 puntos.
            </p>
          </div>
          <button
            type="button"
            onClick={handleEvaluateWithGemini}
            disabled={isEvaluating}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#7E22CE] hover:bg-purple-800 disabled:opacity-60 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 no-print"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluando con Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Evaluar propuesta con Gemini
              </>
            )}
          </button>
        </div>

        {evalError && (
          <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-red-300 text-sm text-[#DC2626]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
            <span>{evalError}</span>
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1D4ED8] text-white">
                <th className="py-3 px-3 w-52">CRITERIOS</th>
                <th className="py-3 px-3 text-center w-48">4</th>
                <th className="py-3 px-3 text-center w-48">3</th>
                <th className="py-3 px-3 text-center w-48">2</th>
                <th className="py-3 px-3 text-center w-48">1</th>
                <th className="py-3 px-3 text-right w-24">Puntaje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {SIG_RUBRIC_CRITERIA.map((criterion) => {
                const currentScore = state.rubric.scores[criterion.id] ?? 1;
                const justification = state.rubric.justifications[criterion.id];
                return (
                  <tr key={criterion.id} className="align-top bg-white">
                    <td className="py-3 px-3 font-semibold text-slate-900 bg-white">
                      <div>{criterion.title}</div>
                      {justification && (
                        <p className="mt-1.5 text-[11px] font-normal text-[#1D4ED8] leading-snug">
                          {justification}
                        </p>
                      )}
                    </td>
                    {([4, 3, 2, 1] as RubricScoreValue[]).map((level) => {
                      const isSelected = currentScore === level;
                      return (
                        <td
                          key={level}
                          className={`py-2.5 px-2.5 border-l border-slate-200 transition-colors ${
                            isSelected ? 'bg-blue-50/50 ring-1 ring-inset ring-[#1D4ED8]' : 'bg-white hover:bg-slate-50/50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSetRubricScore(criterion.id, level)}
                            aria-pressed={isSelected}
                            aria-label={`${criterion.title}: asignar ${level} puntos`}
                            className="w-full text-left space-y-1.5 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-mono tabular-nums font-bold ${
                                  isSelected ? 'text-[#1D4ED8]' : 'text-slate-500'
                                }`}
                              >
                                {level} pts
                              </span>
                              {isSelected && (
                                <span className="text-[11px] font-semibold text-[#15803D]">
                                  Seleccionado
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 leading-relaxed">{criterion.levels[level]}</p>
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[#15803D] border-l border-slate-200 bg-white">
                      {currentScore} / 4
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-white border-t-2 border-[#1D4ED8] font-bold text-sm">
                <td colSpan={5} className="py-3.5 px-4 text-slate-900">
                  TOTAL (El puntaje se calcula con base en 40 puntos — suma exacta de cada criterio evaluado)
                </td>
                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-lg text-[#15803D]">
                  {rubricSummary.totalScore} / 40
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Visual Rubric Chart + Explanatory Final Comment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 p-5 border border-slate-200 rounded-xl bg-white">
            <RubricProfileChart scores={state.rubric.scores} />
          </div>

          <div className="lg:col-span-6 p-5 border-2 border-purple-200 rounded-xl bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="rubric-final-comment" className="text-sm font-bold text-[#7E22CE]">
                Comentario Final Explicativo de la Puntuación ({rubricSummary.totalScore}/40)
              </label>
              <button
                type="button"
                onClick={() => onSetRubricComment(rubricSummary.generatedComment)}
                className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer no-print"
              >
                Regenerar resumen automático
              </button>
            </div>
            <textarea
              id="rubric-final-comment"
              rows={5}
              value={activeFinalComment}
              onChange={(e) => onSetRubricComment(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <p className="text-xs text-slate-600">
              Nivel alcanzado: <strong>{rubricSummary.performanceLevel}</strong> ({rubricSummary.percentage}%). Puedes editar este comentario docente manualmente o generarlo automáticamente.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
