import React, { useState } from 'react';
import { Bot, BookmarkCheck, Loader2, RotateCcw, Send, X } from 'lucide-react';
import { BusinessPlanState, ChatMessage } from '../types/businessPlan';
import { calculateAcademicProgress, calculateFinancialSummary } from '../utils/businessLogic';

interface GeminiMentorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state: BusinessPlanState;
  onAppendMessages: (msgs: ChatMessage[], newMemoryNote?: string) => void;
  onRestoreSession: (sessionCode: string) => Promise<void>;
}

const QUICK_PROMPTS = [
  '¿Cómo convenzo a posibles socios de que mi negocio es rentable?',
  'Explícame los requisitos clave de los 4 bancos en Costa Rica y el MEIC',
  '¿Qué debo incluir en el Sistema de Información Gerencial (SIG) para sacar 40/40?',
  'Ayúdame a redactar mis 10 principios de filosofía empresarial y mi liderazgo',
];

export const GeminiMentorDrawer: React.FC<GeminiMentorDrawerProps> = ({
  isOpen,
  onClose,
  state,
  onAppendMessages,
  onRestoreSession,
}) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen) return null;

  const progress = calculateAcademicProgress(state);
  const financial = calculateFinancialSummary(state.startupCosts, state.financialAssumptions);
  const selectedModel = state.proposals.find((p) => p.id === state.selectedProposalId);
  const selectedBank = state.banks.find((b) => b.id === state.selectedBankId);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...state.mentorMessages, userMsg];
    onAppendMessages([userMsg]);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const resp = await fetch('/api/gemini/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          projectContext: {
            sessionId: state.sessionId,
            studentName: state.studentName,
            companyName: state.companyName,
            passion: state.passionText,
            corporateCitizenVision: state.corporateCitizenVision,
            selectedBusinessModel: selectedModel?.name ?? null,
            progressAnswered: `${progress.answeredCount}/${progress.totalQuestions}`,
            totalStartupCostCRC: financial.totalStartupCostCRC,
            breakEvenUnits: financial.breakEvenUnits,
            selectedBank: selectedBank?.bankName ?? null,
            aiMemoryNotes: state.aiMemoryNotes,
          },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'No se pudo contactar al agente Gemini.');
      }
      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };
      onAppendMessages([botMsg], data.memoryNote || undefined);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de comunicación con Gemini.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreCode.trim()) return;
    setRestoreStatus(null);
    setIsRestoring(true);
    try {
      await onRestoreSession(restoreCode.trim());
      setRestoreStatus('Avances recuperados correctamente.');
      setRestoreCode('');
    } catch (err: unknown) {
      setRestoreStatus(err instanceof Error ? err.message : 'No se encontró ese código.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Agente Mentor conectado con Gemini con memoria persistente"
    >
      <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-slate-200 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D4ED8]">Agente Mentor Gemini</h2>
              <p className="text-xs text-slate-600 font-mono tabular-nums">
                Sesión {state.sessionId} · {progress.answeredCount}/{progress.totalQuestions}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel del agente Gemini"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persistent Memory Snapshot Section */}
        <div className="px-4 py-3 bg-white border-b border-purple-200 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#7E22CE]">
              <BookmarkCheck className="w-3.5 h-3.5 text-[#15803D]" />
              Memoria Persistente Activa
            </span>
            <span className="font-mono text-[11px] text-[#15803D] font-semibold">
              Guardado automático
            </span>
          </div>
          {state.aiMemoryNotes.length > 0 ? (
            <ul className="space-y-1.5 text-[11px] text-slate-700 list-disc pl-4 pr-1 max-h-28 overflow-y-auto leading-snug">
              {state.aiMemoryNotes.slice(-4).map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-slate-600">
              Tus avances se guardan automáticamente bajo el código <strong>{state.sessionId}</strong> para continuar en cualquier momento sin perder datos.
            </p>
          )}
          <form onSubmit={handleRestore} className="flex items-center gap-1.5 pt-1">
            <label htmlFor="restore-session-code" className="sr-only">
              Código de sesión para recuperar avances
            </label>
            <input
              id="restore-session-code"
              type="text"
              value={restoreCode}
              onChange={(e) => setRestoreCode(e.target.value)}
              placeholder="Recuperar código (ej. CR-DEMO51)"
              className="flex-1 px-2.5 py-1 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
            <button
              type="submit"
              disabled={isRestoring || !restoreCode.trim()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#7E22CE] bg-white hover:bg-purple-50 border border-purple-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              Cargar
            </button>
          </form>
          {restoreStatus && (
            <p className="text-[11px] font-medium text-[#15803D]">{restoreStatus}</p>
          )}
        </div>

        <div className="px-4 py-2.5 bg-white border-b border-slate-200">
          <p className="text-xs font-bold text-[#7C2D12] mb-1.5">Consultas rápidas:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={isSending}
                onClick={() => sendMessage(q)}
                className="text-left text-[11px] text-[#1D4ED8] bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {state.mentorMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-white text-slate-800 border border-slate-200'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-slate-600 text-sm border border-slate-200">
                <Loader2 className="w-4 h-4 animate-spin text-[#1D4ED8]" />
                <span>Gemini está analizando y memorizando tu avance...</span>
              </div>
            </div>
          )}
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-white border border-red-300 text-xs text-[#DC2626]">
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-4 border-t border-slate-200 bg-white flex items-center gap-2"
        >
          <label htmlFor="mentor-chat-input" className="sr-only">
            Escribe tu consulta al agente Gemini
          </label>
          <input
            id="mentor-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre costos, bancos CR, permisos o SIG..."
            className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="Enviar mensaje al mentor"
            className="p-2.5 bg-[#1D4ED8] hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
