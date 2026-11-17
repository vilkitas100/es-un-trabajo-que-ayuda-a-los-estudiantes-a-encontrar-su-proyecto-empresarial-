import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  MODULES,
  QUESTIONS_40,
  SIG_RUBRIC_CRITERIA,
} from '../data/questionsAndRubric';
import {
  BusinessPlanState,
  CostaRicaBankResearch,
  ModuleId,
  StartupCostItem,
} from '../types/businessPlan';
import {
  calculateAcademicProgress,
  calculateBankComparisonMetrics,
  calculateFinancialSummary,
  formatCRC,
  getModulePendingQuestions,
  getPendingQuestions,
  isMeaningfulAnswer,
} from '../utils/businessLogic';
import { getQuestionElectricColor } from '../utils/questionColors';
import {
  BankComparisonBarChart,
  CashflowProjectionChart,
  StartupCostDonutChart,
} from './Charts';

interface PlanBuilderViewProps {
  state: BusinessPlanState;
  activeModule: ModuleId;
  onUpdateField: <K extends keyof BusinessPlanState>(field: K, value: BusinessPlanState[K]) => void;
  onChangeModule: (mod: ModuleId) => void;
  onUpdateAnswer: (questionId: string, value: string) => void;
  onUpdateStartupCosts: (items: StartupCostItem[]) => void;
  onUpdateAssumptions: (patch: Partial<BusinessPlanState['financialAssumptions']>) => void;
  onUpdateBanks: (banks: CostaRicaBankResearch[]) => void;
  onSelectBank: (bankId: string) => void;
  onToggleLegalItem: (id: string) => void;
  onUpdateLegalNotes: (id: string, notes: string) => void;
  onEditCorporateCitizen: () => void;
  onGoToReport: () => void;
}

interface CoachSuggestion {
  suggestedDraft: string;
  tips: string[];
}

export const PlanBuilderView: React.FC<PlanBuilderViewProps> = ({
  state,
  activeModule,
  onUpdateField,
  onChangeModule,
  onUpdateAnswer,
  onUpdateStartupCosts,
  onUpdateAssumptions,
  onUpdateBanks,
  onSelectBank,
  onToggleLegalItem,
  onUpdateLegalNotes,
  onEditCorporateCitizen,
  onGoToReport,
}) => {
  const [coachLoadingId, setCoachLoadingId] = useState<string | null>(null);
  const [coachResults, setCoachResults] = useState<Record<string, CoachSuggestion>>({});
  const [coachError, setCoachError] = useState<Record<string, string>>({});
  const [mandatoryNotice, setMandatoryNotice] = useState<{
    message: string;
    targetModuleId: ModuleId;
    targetQuestionId: string;
    targetQuestionNumber: number;
  } | null>(null);

  const progress = calculateAcademicProgress(state);
  const financial = calculateFinancialSummary(state.startupCosts, state.financialAssumptions);
  const bankMetrics = calculateBankComparisonMetrics(
    state.banks,
    Math.max(500000, financial.capitalGapCRC || financial.totalStartupCostCRC)
  );

  const currentModuleIdx = MODULES.findIndex((m) => m.id === activeModule);
  const currentModule = MODULES[currentModuleIdx] ?? MODULES[0];
  const moduleQuestions = QUESTIONS_40.filter((q) => q.moduleId === currentModule.id);

  const selectedModel = state.proposals.find((p) => p.id === state.selectedProposalId);

  const handleAskQuestionCoach = async (qId: string) => {
    const q = QUESTIONS_40.find((item) => item.id === qId);
    if (!q) return;
    setCoachLoadingId(qId);
    setCoachError((prev) => ({ ...prev, [qId]: '' }));
    try {
      const resp = await fetch('/api/gemini/question-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionNumber: q.number,
          questionTitle: q.title,
          questionPrompt: q.prompt,
          currentAnswer: state.answers[q.id] || '',
          companyContext: {
            studentName: state.studentName,
            companyName: state.companyName,
            passion: state.passionText,
            selectedModel: selectedModel?.name,
            totalStartupCostCRC: financial.totalStartupCostCRC,
          },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Error al obtener guía de Gemini.');
      }
      setCoachResults((prev) => ({ ...prev, [qId]: data }));
    } catch (err: unknown) {
      setCoachError((prev) => ({
        ...prev,
        [qId]: err instanceof Error ? err.message : 'Error de conexión.',
      }));
    } finally {
      setCoachLoadingId(null);
    }
  };

  const handleAddCostRow = () => {
    const newItem: StartupCostItem = {
      id: `cost-${Date.now()}`,
      category: 'Equipamiento',
      concept: 'Nuevo insumo o herramienta',
      amountCRC: 50000,
      essential: true,
    };
    onUpdateStartupCosts([...state.startupCosts, newItem]);
  };

  const handleCostChange = (id: string, patch: Partial<StartupCostItem>) => {
    onUpdateStartupCosts(
      state.startupCosts.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleDeleteCostRow = (id: string) => {
    onUpdateStartupCosts(state.startupCosts.filter((item) => item.id !== id));
  };

  const handleBankFieldChange = (
    bankId: string,
    patch: Partial<CostaRicaBankResearch>
  ) => {
    onUpdateBanks(
      state.banks.map((b) => (b.id === bankId ? { ...b, ...patch } : b))
    );
  };

  const handleToggleBankRequirement = (bankId: string, reqText: string) => {
    onUpdateBanks(
      state.banks.map((b) => {
        if (b.id !== bankId) return b;
        const exists = b.checkedRequirements.includes(reqText);
        return {
          ...b,
          checkedRequirements: exists
            ? b.checkedRequirements.filter((r) => r !== reqText)
            : [...b.checkedRequirements, reqText],
        };
      })
    );
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Top Progress Strip */}
      <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#7E22CE]">
              {state.companyName || 'Tu Empresa Simulada'}
              {state.studentName ? ` · Estudiante: ${state.studentName}` : ''}
              {selectedModel ? ` · ${selectedModel.name}` : ''}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1D4ED8]">
              Taller del Plan de Negocios ({progress.totalQuestions} Preguntas)
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-600">Progreso total</div>
              <div className="text-lg font-bold font-mono tabular-nums text-[#15803D]">
                {progress.answeredCount} / {progress.totalQuestions} ({progress.percentage}%)
              </div>
            </div>
            <div className="w-32 h-3 bg-white rounded-full overflow-hidden border border-slate-300">
              <div
                className="h-full bg-[#15803D] transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Inline Student & Company Name Inputs when missing */}
        {(!state.studentName.trim() || !state.companyName.trim()) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white border-2 border-orange-300 rounded-xl">
            <div>
              <label htmlFor="builder-student-name" className="block text-xs font-semibold text-[#C2410C] mb-1">
                Nombre del estudiante *
              </label>
              <input
                id="builder-student-name"
                type="text"
                value={state.studentName}
                onChange={(e) => onUpdateField('studentName', e.target.value)}
                placeholder="Ingresa tu nombre completo"
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label htmlFor="builder-company-name" className="block text-xs font-semibold text-[#15803D] mb-1">
                Nombre de tu empresa *
              </label>
              <input
                id="builder-company-name"
                type="text"
                value={state.companyName}
                onChange={(e) => onUpdateField('companyName', e.target.value)}
                placeholder="Ingresa el nombre de tu empresa"
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Corporate Citizen Summary Strip (editable anytime) */}
      <div className="bg-white border-2 border-purple-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-extrabold" style={{ color: '#FF007F' }}>
            Ciudadano Corporativo (Antes de Iniciar el Plan)
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {state.corporateCitizenVision.trim()
              ? state.corporateCitizenVision
              : 'Aún no has redactado cómo quieres que sea tu persona jurídica ante la sociedad.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onEditCorporateCitizen}
          className="px-4 py-2 text-xs font-bold text-[#9D00FF] bg-white border border-purple-300 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {state.corporateCitizenVision.trim() ? 'Editar ciudadano corporativo' : 'Idear ciudadano corporativo'}
        </button>
      </div>

      {/* Main 2-column Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Module Navigation Sidebar */}
        <aside className="lg:col-span-3 bg-white border-2 border-slate-200 rounded-2xl p-3 space-y-1.5 lg:sticky lg:top-20">
          <div className="px-3 py-2 text-xs font-bold text-[#7C2D12]">
            6 Módulos del Plan Integral
          </div>
          {MODULES.map((mod) => {
            const modProg = progress.modules.find((m) => m.moduleId === mod.id);
            const isActive = mod.id === activeModule;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onChangeModule(mod.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl transition-colors cursor-pointer border-2 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-white border-transparent hover:border-slate-200 text-slate-700'
                }`}
                style={isActive ? { borderColor: mod.accentColor } : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-sm font-bold truncate"
                    style={{ color: mod.accentColor }}
                  >
                    {mod.order}. {mod.shortTitle}
                  </span>
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-700 shrink-0">
                    {modProg?.answered ?? 0}/{modProg?.total ?? 0}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${modProg?.percentage ?? 0}%`,
                      backgroundColor: mod.accentColor,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </aside>

        {/* Active Module Content */}
        <div className="lg:col-span-9 space-y-6">
          <div
            className="bg-white border-2 rounded-2xl p-6 space-y-2"
            style={{ borderColor: `${currentModule.accentColor}40` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className="text-xs font-bold"
                style={{ color: currentModule.accentColor }}
              >
                Módulo {currentModule.order} de {MODULES.length}
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                Preguntas {moduleQuestions[0]?.number}–{moduleQuestions[moduleQuestions.length - 1]?.number}
              </span>
            </div>
            <h2
              className="text-2xl font-bold"
              style={{ color: currentModule.accentColor }}
            >
              {currentModule.title}
            </h2>
            <p className="text-sm text-slate-700">{currentModule.description}</p>
          </div>

          {/* Interactive Workbench for Module 3: Startup Costs & Break-Even */}
          {activeModule === 'm3_costos_socios' && (
            <section className="bg-white border-2 border-green-200 rounded-2xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#15803D]">
                    Calculadora Interactiva: Costo para Comenzar en Pequeño
                  </h3>
                  <p className="text-sm text-slate-600">
                    Ajusta tus rubros de inversión inicial, precio unitario y gastos fijos para calcular tu punto de equilibrio.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCostRow}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-green-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Agregar rubro
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b-2 border-green-200 text-xs font-bold text-[#15803D]">
                      <th className="py-2.5 px-3">Categoría</th>
                      <th className="py-2.5 px-3">Concepto</th>
                      <th className="py-2.5 px-3 text-right">Monto (₡)</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {state.startupCosts.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3">
                          <select
                            aria-label={`Categoría para ${item.concept}`}
                            value={item.category}
                            onChange={(e) =>
                              handleCostChange(item.id, {
                                category: e.target.value as StartupCostItem['category'],
                              })
                            }
                            className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          >
                            <option value="Equipamiento">Equipamiento</option>
                            <option value="Tecnología y SIG">Tecnología y SIG</option>
                            <option value="Permisos y Legal">Permisos y Legal</option>
                            <option value="Inventario Inicial">Inventario Inicial</option>
                            <option value="Marketing Lanzamiento">Marketing Lanzamiento</option>
                            <option value="Capital de Trabajo">Capital de Trabajo</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            aria-label="Concepto del costo"
                            value={item.concept}
                            onChange={(e) => handleCostChange(item.id, { concept: e.target.value })}
                            className="w-full min-w-[200px] px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min={0}
                            step={5000}
                            aria-label={`Monto en colones para ${item.concept}`}
                            value={item.amountCRC}
                            onChange={(e) =>
                              handleCostChange(item.id, { amountCRC: Number(e.target.value) || 0 })
                            }
                            className="w-32 text-right px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCostRow(item.id)}
                            aria-label={`Eliminar rubro ${item.concept}`}
                            className="p-1.5 text-slate-400 hover:text-[#DB2777] rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-white border-t-2 border-slate-200 font-semibold text-sm">
                      <td colSpan={2} className="py-3 px-3 text-slate-800">
                        Total Inversión Inicial Mínima
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#15803D]">
                        {formatCRC(financial.totalStartupCostCRC)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Unit economics & capital inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label htmlFor="unit-price" className="block text-xs font-medium text-slate-700 mb-1">
                    Precio unitario (₡)
                  </label>
                  <input
                    id="unit-price"
                    type="number"
                    min={0}
                    value={state.financialAssumptions.unitPriceCRC}
                    onChange={(e) => onUpdateAssumptions({ unitPriceCRC: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="unit-var-cost" className="block text-xs font-medium text-slate-700 mb-1">
                    Costo variable unit. (₡)
                  </label>
                  <input
                    id="unit-var-cost"
                    type="number"
                    min={0}
                    value={state.financialAssumptions.unitVariableCostCRC}
                    onChange={(e) =>
                      onUpdateAssumptions({ unitVariableCostCRC: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="fixed-op-cost" className="block text-xs font-medium text-slate-700 mb-1">
                    Gastos fijos/mes (₡)
                  </label>
                  <input
                    id="fixed-op-cost"
                    type="number"
                    min={0}
                    value={state.financialAssumptions.fixedMonthlyOpCostCRC}
                    onChange={(e) =>
                      onUpdateAssumptions({ fixedMonthlyOpCostCRC: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="est-units" className="block text-xs font-medium text-slate-700 mb-1">
                    Meta unidades/mes
                  </label>
                  <input
                    id="est-units"
                    type="number"
                    min={0}
                    value={state.financialAssumptions.estimatedMonthlyUnits}
                    onChange={(e) =>
                      onUpdateAssumptions({ estimatedMonthlyUnits: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="own-cap" className="block text-xs font-medium text-slate-700 mb-1">
                    Capital propio (₡)
                  </label>
                  <input
                    id="own-cap"
                    type="number"
                    min={0}
                    value={state.financialAssumptions.ownCapitalCRC}
                    onChange={(e) => onUpdateAssumptions({ ownCapitalCRC: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs text-slate-500 block">Margen Contribución</span>
                  <span className="text-base font-bold font-mono tabular-nums text-[#7E22CE]">
                    {formatCRC(financial.unitContributionMarginCRC)} ({financial.contributionMarginPct}%)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs text-slate-500 block">Punto de Equilibrio</span>
                  <span className="text-base font-bold font-mono tabular-nums text-[#1D4ED8]">
                    {financial.breakEvenUnits !== null ? `${financial.breakEvenUnits} unid./mes` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs text-slate-500 block">Utilidad Neta Meta/mes</span>
                  <span
                    className={`text-base font-bold font-mono tabular-nums ${
                      financial.monthlyNetProfitCRC >= 0 ? 'text-[#15803D]' : 'text-[#5C2808]'
                    }`}
                  >
                    {formatCRC(financial.monthlyNetProfitCRC)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs text-slate-500 block">Brecha a Financiar</span>
                  <span className="text-base font-bold font-mono tabular-nums text-[#C2410C]">
                    {formatCRC(financial.capitalGapCRC)}
                  </span>
                </div>
              </div>

              {/* Visual Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
                <div className="p-4 border border-slate-200 rounded-xl bg-white">
                  <h4 className="text-sm font-bold text-[#1D4ED8] mb-4">Distribución de Costos Iniciales</h4>
                  <StartupCostDonutChart
                    data={financial.costByCategory}
                    totalCRC={financial.totalStartupCostCRC}
                  />
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-white">
                  <h4 className="text-sm font-bold text-[#7E22CE] mb-3">Proyección de Flujo a 12 Meses</h4>
                  <CashflowProjectionChart points={financial.cashflow12Months} />
                </div>
              </div>
            </section>
          )}

          {/* Interactive Workbench for Module 4: Costa Rica Legal & Tax Matrix */}
          {activeModule === 'm4_legal_tributario' && (
            <section className="bg-white border-2 border-purple-200 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#7E22CE]">
                  Matriz de Permisos Legales y Obligaciones Tributarias en Costa Rica
                </h3>
                <p className="text-sm text-slate-600">
                  Verifica cada trámite obligatorio antes de redactar tus preguntas 33 a 38.
                </p>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b-2 border-purple-200 text-xs font-bold text-[#7E22CE]">
                      <th className="py-2.5 px-3">Listo</th>
                      <th className="py-2.5 px-3">Institución</th>
                      <th className="py-2.5 px-3">Permiso / Obligación</th>
                      <th className="py-2.5 px-3">Frecuencia</th>
                      <th className="py-2.5 px-3">Costo / Tarifa Ref.</th>
                      <th className="py-2.5 px-3">Notas para tu empresa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                    {state.legalTaxChecklist.map((item) => (
                      <tr key={item.id} className={item.completed ? 'bg-green-50/40' : 'bg-white'}>
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            aria-label={`Marcar ${item.obligation}`}
                            checked={item.completed}
                            onChange={() => onToggleLegalItem(item.id)}
                            className="w-4 h-4 accent-[#7E22CE] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{item.entity}</td>
                        <td className="py-3 px-3 text-slate-700">{item.obligation}</td>
                        <td className="py-3 px-3 text-slate-600">{item.frequency}</td>
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-700">
                          {item.estimatedCostOrRate}
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            aria-label={`Nota para ${item.entity}`}
                            value={item.notes}
                            onChange={(e) => onUpdateLegalNotes(item.id, e.target.value)}
                            className="w-full min-w-[160px] px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Interactive Workbench for Module 5: 4 Costa Rican Banks Investigation */}
          {activeModule === 'm5_bancos_financiamiento' && (
            <section className="bg-white border-2 border-blue-200 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#1D4ED8]">
                  Investigación Comparativa: 4 Bancos en Costa Rica
                </h3>
                <p className="text-sm text-slate-600">
                  Investiga las condiciones reales de 4 bancos costarricenses, marca los requisitos que cumplirías y selecciona cuál elegirías si contaras con todos los requisitos.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {state.banks.map((bank) => {
                  const isChosen = state.selectedBankId === bank.id;
                  const metric = bankMetrics.find((m) => m.bankId === bank.id);
                  return (
                    <div
                      key={bank.id}
                      className={`rounded-2xl border-2 p-5 space-y-4 transition-colors bg-white ${
                        isChosen
                          ? 'border-[#1D4ED8] ring-2 ring-blue-600/20'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-bold text-[#1D4ED8]">{bank.bankName}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{bank.collateralRequired}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectBank(bank.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            isChosen
                              ? 'bg-[#1D4ED8] text-white'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-blue-50'
                          }`}
                        >
                          {isChosen ? 'Banco Elegido' : 'Elegir este banco'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Producto PyME
                          </label>
                          <input
                            type="text"
                            value={bank.productName}
                            onChange={(e) =>
                              handleBankFieldChange(bank.id, { productName: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Tasa anual (%)
                          </label>
                          <input
                            type="number"
                            step={0.1}
                            min={0}
                            value={bank.annualInterestRatePct}
                            onChange={(e) =>
                              handleBankFieldChange(bank.id, {
                                annualInterestRatePct: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Plazo máx. (meses)
                          </label>
                          <input
                            type="number"
                            min={6}
                            max={180}
                            value={bank.maxTermMonths}
                            onChange={(e) =>
                              handleBankFieldChange(bank.id, {
                                maxTermMonths: Number(e.target.value) || 12,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-slate-700">
                          Requisitos investigados ({metric?.checkedCount ?? 0}/{metric?.totalRequirements ?? 0}):
                        </div>
                        <div className="space-y-1">
                          {bank.keyRequirements.map((reqText) => {
                            const checked = bank.checkedRequirements.includes(reqText);
                            return (
                              <label
                                key={reqText}
                                className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleToggleBankRequirement(bank.id, reqText)}
                                  className="mt-0.5 accent-[#1D4ED8]"
                                />
                                <span>{reqText}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Notas de tu investigación bancaria
                          </label>
                          <textarea
                            rows={2}
                            value={bank.studentNotes}
                            onChange={(e) =>
                              handleBankFieldChange(bank.id, { studentNotes: e.target.value })
                            }
                            placeholder="Ej. Acepta aval del SBD sin hipoteca, requiere certificación CPA..."
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      {metric && (
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className="text-slate-600">Cuota est. sobre brecha:</span>
                          <span className="font-bold text-slate-900">
                            {formatCRC(metric.monthlyPaymentCRC)} / mes
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                <div className="lg:col-span-7 p-4 border border-slate-200 rounded-xl bg-white">
                  <BankComparisonBarChart metrics={bankMetrics} selectedBankId={state.selectedBankId} />
                </div>
                <div className="lg:col-span-5 p-4 border-2 border-orange-200 rounded-xl bg-white space-y-2.5">
                  <h4 className="text-sm font-bold text-[#C2410C]">
                    Requisitos Adicionales Clave a Considerar en Costa Rica
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    {state.extraBankConsiderations.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Questions List for Current Module */}
          <div className="space-y-4">
            {moduleQuestions.map((q) => {
              const answer = state.answers[q.id] || '';
              const answered = isMeaningfulAnswer(answer);
              const linkedCriterion = SIG_RUBRIC_CRITERIA.find(
                (c) => c.id === q.rubricCriterionIndex
              );
              const coach = coachResults[q.id];
              const isCoachLoading = coachLoadingId === q.id;
              const qCoachErr = coachError[q.id];
              const qColor = getQuestionElectricColor(q.number);

              return (
                <article
                  key={q.id}
                  id={`question-${q.id}`}
                  className="bg-white border-2 rounded-2xl p-5 sm:p-6 space-y-3 transition-colors"
                  style={{ borderColor: answered ? '#22C55E' : `${qColor.hex}55` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className="font-mono tabular-nums font-extrabold"
                          style={{ color: qColor.hex }}
                        >
                          Pregunta {q.number} de {progress.totalQuestions}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className={answered ? 'font-semibold text-[#15803D]' : 'font-semibold text-[#BE185D]'}>
                          {answered ? 'Completada' : 'Obligatoria · Pendiente (mín. 12 caracteres)'}
                        </span>
                        {linkedCriterion && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-slate-600">
                              Aporta a Rúbrica: {linkedCriterion.title}
                            </span>
                          </>
                        )}
                      </div>
                      <label
                        htmlFor={`input-${q.id}`}
                        className="block text-base sm:text-lg font-extrabold tracking-tight"
                        style={{
                          color: qColor.hex,
                          textShadow: `0 0 10px ${qColor.glow}`,
                        }}
                      >
                        {q.title} <span className="text-[#DB2777]">*</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAskQuestionCoach(q.id)}
                      disabled={isCoachLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isCoachLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Guía Gemini
                    </button>
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed">{q.prompt}</p>
                  <p className="text-xs text-slate-500">{q.helperHint}</p>

                  <textarea
                    id={`input-${q.id}`}
                    rows={3}
                    value={answer}
                    onChange={(e) => {
                      onUpdateAnswer(q.id, e.target.value);
                      if (mandatoryNotice) setMandatoryNotice(null);
                    }}
                    placeholder={q.placeholder}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />

                  {qCoachErr && (
                    <p className="text-xs text-[#BE185D]">{qCoachErr}</p>
                  )}

                  {coach && (
                    <div className="p-4 rounded-xl bg-white border-2 border-purple-200 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#7E22CE]">Borrador sugerido por Gemini</span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateAnswer(
                              q.id,
                              answer.trim() ? `${answer.trim()}\n\n${coach.suggestedDraft}` : coach.suggestedDraft
                            )
                          }
                          className="px-2.5 py-1 font-semibold text-white bg-[#7E22CE] hover:bg-purple-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Usar como base
                        </button>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{coach.suggestedDraft}</p>
                      <ul className="space-y-1 text-slate-600 list-disc pl-4">
                        {coach.tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {mandatoryNotice && (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border-2 border-pink-400 text-sm text-[#BE185D] font-semibold"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DB2777]" />
                <span>{mandatoryNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onChangeModule(mandatoryNotice.targetModuleId);
                  window.setTimeout(() => {
                    const el = document.getElementById(`question-${mandatoryNotice.targetQuestionId}`);
                    const input = document.getElementById(`input-${mandatoryNotice.targetQuestionId}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (input) input.focus();
                  }, 80);
                }}
                className="px-3.5 py-2 text-xs font-bold text-white bg-[#0D9488] hover:bg-teal-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Ir a Pregunta #{mandatoryNotice.targetQuestionNumber}
              </button>
            </div>
          )}

          {/* Module Pagination Footer */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              disabled={currentModuleIdx <= 0}
              onClick={() => {
                setMandatoryNotice(null);
                if (currentModuleIdx > 0) onChangeModule(MODULES[currentModuleIdx - 1].id);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <ChevronLeft className="w-4 h-4" />
              Módulo anterior
            </button>

            {currentModuleIdx < MODULES.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  const modulePending = getModulePendingQuestions(state, currentModule.id);
                  if (modulePending.length > 0) {
                    const first = modulePending[0];
                    const nums = modulePending.map((item) => `#${item.number}`).join(', ');
                    setMandatoryNotice({
                      message: `Todas las preguntas son obligatorias. Completa las pendientes de este módulo antes de continuar: ${nums}.`,
                      targetModuleId: currentModule.id,
                      targetQuestionId: first.id,
                      targetQuestionNumber: first.number,
                    });
                    const el = document.getElementById(`question-${first.id}`);
                    const input = document.getElementById(`input-${first.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (input) input.focus();
                    return;
                  }
                  setMandatoryNotice(null);
                  onChangeModule(MODULES[currentModuleIdx + 1].id);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0055FF] hover:bg-blue-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Siguiente módulo
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const allPending = getPendingQuestions(state);
                  if (allPending.length > 0) {
                    const first = allPending[0];
                    const mod = MODULES.find((m) => m.id === first.moduleId);
                    setMandatoryNotice({
                      message: `Debes responder las ${progress.totalQuestions} preguntas de forma obligatoria antes de pasar al Informe Final. Faltan ${allPending.length} (primera pendiente: Pregunta #${first.number} en ${mod?.shortTitle || 'Módulo'}).`,
                      targetModuleId: first.moduleId,
                      targetQuestionId: first.id,
                      targetQuestionNumber: first.number,
                    });
                    return;
                  }
                  setMandatoryNotice(null);
                  onGoToReport();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#15803D] hover:bg-green-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Ver Informe Final y Rúbrica
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
