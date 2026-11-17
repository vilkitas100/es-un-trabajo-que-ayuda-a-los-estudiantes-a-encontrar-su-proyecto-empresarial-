import React, { useEffect, useRef, useState } from 'react';
import { Bot } from 'lucide-react';
import { createDemoBusinessPlanState, createEmptyBusinessPlanState } from './data/demoProject';
import {
  AppTab,
  BusinessModelProposal,
  BusinessPlanState,
  ChatMessage,
  CostaRicaBankResearch,
  ModuleId,
  RubricScoreValue,
  StartupCostItem,
} from './types/businessPlan';
import { calculateAcademicProgress, calculateRubricTotal } from './utils/businessLogic';
import { PassionDiscoveryView } from './components/PassionDiscoveryView';
import { PlanBuilderView } from './components/PlanBuilderView';
import { ProgressDashboardView } from './components/ProgressDashboardView';
import { FinalReportView } from './components/FinalReportView';
import { GeminiMentorDrawer } from './components/GeminiMentorDrawer';
import { CelebrationResetModal } from './components/CelebrationResetModal';

const STORAGE_KEY = 'emprendecr_studio_state_v1';

function loadInitialState(): BusinessPlanState {
  if (typeof window === 'undefined') return createEmptyBusinessPlanState();
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1' || params.get('demo') === '1') {
    return createDemoBusinessPlanState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BusinessPlanState;
      return {
        ...createEmptyBusinessPlanState(),
        ...parsed,
        aiMemoryNotes: Array.isArray(parsed.aiMemoryNotes) ? parsed.aiMemoryNotes : [],
      };
    }
  } catch {
    // ignore storage errors
  }
  return createEmptyBusinessPlanState();
}

export default function App() {
  const [state, setState] = useState<BusinessPlanState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'report') return 'report';
      if (params.get('tab') === 'progress') return 'progress';
      if (params.get('autostart') === '1') return 'builder';
    }
    return 'passion';
  });
  const [activeModule, setActiveModule] = useState<ModuleId>('m1_pasion');
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [showResetCelebration, setShowResetCelebration] = useState(false);
  const syncTimerRef = useRef<number | null>(null);

  // Persist to localStorage immediately AND sync to backend session memory
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => {
      if (!state.sessionId) return;
      fetch(`/api/session/${encodeURIComponent(state.sessionId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, lastSavedAt: new Date().toISOString() }),
      }).catch(() => {
        // silent background sync
      });
    }, 600);

    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [state]);

  const progress = calculateAcademicProgress(state);

  const appendUniqueMemory = (notes: string[], candidate: string): string[] => {
    const clean = candidate.trim();
    if (!clean || notes.includes(clean)) return notes;
    return [...notes.slice(-14), clean];
  };

  const updateField = <K extends keyof BusinessPlanState>(
    field: K,
    value: BusinessPlanState[K]
  ) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectProposal = (proposal: BusinessModelProposal) => {
    setState((prev) => ({
      ...prev,
      selectedProposalId: proposal.id,
      companyName: prev.companyName || proposal.name.split('—')[0].trim(),
      aiMemoryNotes: appendUniqueMemory(
        prev.aiMemoryNotes,
        `Modelo de negocio seleccionado: ${proposal.name}.`
      ),
      answers: {
        ...prev.answers,
        q1: prev.answers.q1 || prev.passionText,
        q10:
          prev.answers.q10 ||
          `Elegí el modelo "${proposal.name}" porque ${proposal.description} Su inversión inicial aproximada es de ₡${proposal.estimatedInitialCostCRC.toLocaleString('en-US')}.`,
      },
    }));
  };

  const handleUpdateAnswer = (questionId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value,
      },
    }));
  };

  const handleUpdateStartupCosts = (items: StartupCostItem[]) => {
    setState((prev) => ({ ...prev, startupCosts: items }));
  };

  const handleUpdateAssumptions = (patch: Partial<BusinessPlanState['financialAssumptions']>) => {
    setState((prev) => ({
      ...prev,
      financialAssumptions: { ...prev.financialAssumptions, ...patch },
    }));
  };

  const handleUpdateBanks = (banks: CostaRicaBankResearch[]) => {
    setState((prev) => ({ ...prev, banks }));
  };

  const handleSelectBank = (bankId: string) => {
    setState((prev) => {
      const bank = prev.banks.find((b) => b.id === bankId);
      return {
        ...prev,
        selectedBankId: bankId,
        aiMemoryNotes: bank
          ? appendUniqueMemory(prev.aiMemoryNotes, `Banco elegido en CR: ${bank.bankName} (${bank.annualInterestRatePct}%).`)
          : prev.aiMemoryNotes,
      };
    });
  };

  const handleToggleLegalItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      legalTaxChecklist: prev.legalTaxChecklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const handleUpdateLegalNotes = (id: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      legalTaxChecklist: prev.legalTaxChecklist.map((item) =>
        item.id === id ? { ...item, notes } : item
      ),
    }));
  };

  const handleSetRubricScore = (criterionId: number, score: RubricScoreValue) => {
    setState((prev) => {
      const nextScores = { ...prev.rubric.scores, [criterionId]: score };
      const summary = calculateRubricTotal(nextScores);
      return {
        ...prev,
        rubric: {
          ...prev.rubric,
          scores: nextScores,
          finalComment: summary.generatedComment,
        },
      };
    });
  };

  const handleSetRubricComment = (comment: string) => {
    setState((prev) => ({
      ...prev,
      rubric: { ...prev.rubric, finalComment: comment },
    }));
  };

  const handleApplyAIRubric = (
    scores: Record<number, RubricScoreValue>,
    justifications: Record<number, string>,
    finalComment: string
  ) => {
    const summary = calculateRubricTotal(scores);
    setState((prev) => ({
      ...prev,
      aiMemoryNotes: appendUniqueMemory(
        prev.aiMemoryNotes,
        `Rúbrica SIG evaluada: ${summary.totalScore}/40 puntos (${summary.performanceLevel}).`
      ),
      rubric: {
        scores,
        justifications,
        finalComment,
        evaluatedByAI: true,
      },
    }));
  };

  const handleAppendMentorMessages = (msgs: ChatMessage[], newMemoryNote?: string) => {
    setState((prev) => ({
      ...prev,
      mentorMessages: [...prev.mentorMessages, ...msgs],
      aiMemoryNotes: newMemoryNote
        ? appendUniqueMemory(prev.aiMemoryNotes, newMemoryNote)
        : prev.aiMemoryNotes,
    }));
  };

  const handleRestoreSession = async (sessionCode: string) => {
    const code = sessionCode.toUpperCase();
    if (code === 'CR-DEMO51' || code === 'CR-DEMO40') {
      setState(createDemoBusinessPlanState());
      return;
    }
    const resp = await fetch(`/api/session/${encodeURIComponent(sessionCode)}`);
    const data = await resp.json();
    if (!resp.ok || !data.state) {
      throw new Error(data.error || 'No se encontró una sesión guardada con ese código.');
    }
    setState({
      ...createEmptyBusinessPlanState(),
      ...(data.state as BusinessPlanState),
    });
  };

  const handleLoadDemo = () => {
    setState(createDemoBusinessPlanState());
    setActiveTab('builder');
  };

  const handleJumpToQuestion = (moduleId: ModuleId, questionId: string) => {
    setActiveModule(moduleId);
    setActiveTab('builder');
    setTimeout(() => {
      const el = document.getElementById(`question-${questionId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Single-line Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('passion')}
            title="Prof: Liz Acuña. Toma de Decisiones Gerenciales para crear mi empresa."
            className="text-sm sm:text-base font-bold tracking-tight text-[#1E3A8A] whitespace-nowrap shrink-0 cursor-pointer font-display truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[440px] xl:max-w-none"
          >
            Prof: Liz Acuña. Toma de Decisiones Gerenciales para crear mi empresa
          </button>

          {/* Zone 2: 4 Clean Single-line Nav Links */}
          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-5 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('passion')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'passion'
                  ? 'border-[#DC2626] text-[#DC2626]'
                  : 'border-transparent text-slate-600 hover:text-[#DC2626]'
              }`}
            >
              1. Pasión
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'builder'
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-slate-600 hover:text-[#1D4ED8]'
              }`}
            >
              2. Plan ({progress.answeredCount}/{progress.totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('progress')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'progress'
                  ? 'border-[#7E22CE] text-[#7E22CE]'
                  : 'border-transparent text-slate-600 hover:text-[#7E22CE]'
              }`}
            >
              3. Progreso
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'report'
                  ? 'border-[#15803D] text-[#15803D]'
                  : 'border-transparent text-slate-600 hover:text-[#15803D]'
              }`}
            >
              4. Informe y Rúbrica
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsMentorOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#EA580C] hover:bg-orange-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              Agente Gemini
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar (compact single row) */}
        <nav aria-label="Navegación móvil" className="flex md:hidden items-center justify-between px-4 py-2 border-t border-slate-100 text-xs font-semibold overflow-x-auto gap-3 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('passion')}
            className={`whitespace-nowrap shrink-0 px-2 py-1 rounded-md ${
              activeTab === 'passion' ? 'text-[#DC2626] underline underline-offset-4' : 'text-slate-600'
            }`}
          >
            1. Pasión
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`whitespace-nowrap shrink-0 px-2 py-1 rounded-md ${
              activeTab === 'builder' ? 'text-[#1D4ED8] underline underline-offset-4' : 'text-slate-600'
            }`}
          >
            2. Plan ({progress.answeredCount}/{progress.totalQuestions})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`whitespace-nowrap shrink-0 px-2 py-1 rounded-md ${
              activeTab === 'progress' ? 'text-[#7E22CE] underline underline-offset-4' : 'text-slate-600'
            }`}
          >
            3. Progreso
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`whitespace-nowrap shrink-0 px-2 py-1 rounded-md ${
              activeTab === 'report' ? 'text-[#15803D] underline underline-offset-4' : 'text-slate-600'
            }`}
          >
            4. Informe
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 bg-white">
        {activeTab === 'passion' && (
          <PassionDiscoveryView
            state={state}
            onUpdateField={updateField}
            onSelectProposal={handleSelectProposal}
            onLoadDemo={handleLoadDemo}
            onProceedToBuilder={() => setActiveTab('builder')}
          />
        )}

        {activeTab === 'builder' && (
          <PlanBuilderView
            state={state}
            activeModule={activeModule}
            onUpdateField={updateField}
            onChangeModule={setActiveModule}
            onUpdateAnswer={handleUpdateAnswer}
            onUpdateStartupCosts={handleUpdateStartupCosts}
            onUpdateAssumptions={handleUpdateAssumptions}
            onUpdateBanks={handleUpdateBanks}
            onSelectBank={handleSelectBank}
            onToggleLegalItem={handleToggleLegalItem}
            onUpdateLegalNotes={handleUpdateLegalNotes}
            onGoToReport={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressDashboardView
            state={state}
            onJumpToQuestion={handleJumpToQuestion}
            onGoToReport={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'report' && (
          <FinalReportView
            state={state}
            onSetRubricScore={handleSetRubricScore}
            onSetRubricComment={handleSetRubricComment}
            onApplyAIRubricEvaluation={handleApplyAIRubric}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            <strong className="text-[#1E3A8A]">Prof: Liz Acuña.</strong> Toma de Decisiones Gerenciales para crear mi empresa · Código de sesión:{' '}
            <strong className="font-mono text-[#7E22CE]">{state.sessionId}</strong> (avances guardados automáticamente)
          </span>
          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem(STORAGE_KEY);
              setState(createEmptyBusinessPlanState());
              setActiveTab('passion');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setShowResetCelebration(true);
            }}
            className="text-slate-600 hover:text-[#DC2626] font-medium transition-colors cursor-pointer"
          >
            Reiniciar proyecto
          </button>
        </div>
      </footer>

      {/* Real-time Gemini Mentor Drawer */}
      <GeminiMentorDrawer
        isOpen={isMentorOpen}
        onClose={() => setIsMentorOpen(false)}
        state={state}
        onAppendMessages={handleAppendMentorMessages}
        onRestoreSession={handleRestoreSession}
      />

      {/* Celebratory Reset Modal */}
      <CelebrationResetModal
        isOpen={showResetCelebration}
        onClose={() => setShowResetCelebration(false)}
      />
    </div>
  );
}
