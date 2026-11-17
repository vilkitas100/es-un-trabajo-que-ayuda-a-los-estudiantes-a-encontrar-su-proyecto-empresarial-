import React, { useState } from 'react';
import { ArrowRight, Check, Compass, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { BusinessModelProposal, BusinessPlanState } from '../types/businessPlan';
import { formatCRC } from '../utils/businessLogic';

interface PassionDiscoveryViewProps {
  state: BusinessPlanState;
  onUpdateField: <K extends keyof BusinessPlanState>(field: K, value: BusinessPlanState[K]) => void;
  onSelectProposal: (proposal: BusinessModelProposal) => void;
  onLoadDemo: () => void;
  onProceedToBuilder: () => void;
}

const PASSION_IDEAS = [
  'Repostería artesanal saludable sin azúcar',
  'Fotografía y creación de video para marcas locales',
  'Diseño de jardines urbanos y plantas ornamentales',
  'Desarrollo de automatizaciones y sitios web para PyMEs',
];

export const PassionDiscoveryView: React.FC<PassionDiscoveryViewProps> = ({
  state,
  onUpdateField,
  onSelectProposal,
  onLoadDemo,
  onProceedToBuilder,
}) => {
  const [region, setRegion] = useState('Gran Área Metropolitana, Costa Rica');
  const [budgetPref, setBudgetPref] = useState('Empezar en pequeño con inversión baja');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [atelierImgFailed, setAtelierImgFailed] = useState(false);

  const handleAnalyzePassion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.passionText || state.passionText.trim().length < 5) {
      setErrorMsg('Por favor describe con al menos unas palabras qué es lo que más amas hacer.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const resp = await fetch('/api/gemini/passion-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passion: state.passionText,
          studentName: state.studentName,
          budgetPreference: budgetPref,
          region,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'No se pudo obtener la propuesta de Gemini.');
      }
      onUpdateField('passionAnalysis', data.passionAnalysis || '');
      onUpdateField('proposals', Array.isArray(data.businessModels) ? data.businessModels : []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión con Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-indigo-700">
              <span>Paso 1 de 4</span>
              <span aria-hidden="true">·</span>
              <span>Simulador Académico de Emprendimiento</span>
              <span aria-hidden="true">·</span>
              <span>Costa Rica</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-slate-900 leading-[1.12] text-balance">
              Construye tu empresa simulada partiendo de lo que amas hacer
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
              Describe tu pasión y envíala a Gemini para realizar un estudio de modelos de negocio viables.
              Elige tu favorito, desarrolla las 40 preguntas estratégicas, compara 4 bancos de Costa Rica y
              genera tu informe integral con la Rúbrica SIG de 40 puntos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#formulario-pasion"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Comenzar con mi pasión
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cargar ejemplo completo (40/40)
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-200 min-h-[240px] bg-indigo-50">
          {!heroImgFailed ? (
            <img
              src="/src/assets/images/hero_latino_founders_1794926967059.jpg"
              alt="Hombre y mujer latinos diseñando su plan de negocios en estudio universitario"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-50 via-white to-orange-50">
              <Compass className="w-10 h-10 text-indigo-600 mb-2" />
              <span className="text-sm font-semibold text-slate-800">Laboratorio de Emprendimiento CR</span>
            </div>
          )}
        </div>
      </section>

      {/* Paso 1: Formulario de Pasión -> Gemini */}
      <section id="formulario-pasion" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900">1. Tu Pasión y Datos del Proyecto</h2>
            <p className="text-sm text-slate-600">
              Todo gran plan de negocios nace de una actividad que disfrutas profundamente. Cuéntanos quién eres y qué amas hacer.
            </p>
          </div>

          <form onSubmit={handleAnalyzePassion} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="student-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nombre del estudiante
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={state.studentName}
                  onChange={(e) => onUpdateField('studentName', e.target.value)}
                  placeholder="Ej. Valeria Rojas"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="team-members" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Equipo colaborativo (opcional)
                </label>
                <input
                  id="team-members"
                  type="text"
                  value={state.teamMembers}
                  onChange={(e) => onUpdateField('teamMembers', e.target.value)}
                  placeholder="Ej. Valeria R., Mateo S."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="teacher-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Docente guía (opcional)
                </label>
                <input
                  id="teacher-name"
                  type="text"
                  value={state.teacherName}
                  onChange={(e) => onUpdateField('teacherName', e.target.value)}
                  placeholder="Ej. Prof. Carlos Jiménez"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="passion-input" className="block text-sm font-semibold text-slate-800 mb-1.5">
                ¿Qué es lo que más amas hacer? (Tu talento, hobby o vocación)
              </label>
              <textarea
                id="passion-input"
                rows={3}
                value={state.passionText}
                onChange={(e) => onUpdateField('passionText', e.target.value)}
                placeholder="Ej. Amo preparar postres saludables sin azúcar refinada usando cacao costarricense, y enseñar a otros cómo cuidarse sin dejar de disfrutar..."
                className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Ideas rápidas:</span>
                {PASSION_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => onUpdateField('passionText', idea)}
                    className="text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="region-select" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Zona de operación en Costa Rica
                </label>
                <input
                  id="region-select"
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="budget-pref" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Enfoque de arranque
                </label>
                <select
                  id="budget-pref"
                  value={budgetPref}
                  onChange={(e) => setBudgetPref(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Empezar en pequeño con inversión baja">Empezar en pequeño con inversión baja</option>
                  <option value="Modelo digital o híbrido escalable">Modelo digital o híbrido escalable</option>
                  <option value="Local comercial pequeño con financiamiento PyME">Local comercial pequeño con financiamiento PyME</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Gemini estudiará 4 posibles modelos de negocio adaptados a Costa Rica.
              </span>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando con Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar estudio con Gemini
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
            {!atelierImgFailed ? (
              <img
                src="/src/assets/images/passion_craft_atelier_1794885834572.jpg"
                alt="Elementos de distintas pasiones estudiantiles convertidas en emprendimientos"
                referrerPolicy="no-referrer"
                onError={() => setAtelierImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                De la vocación al modelo rentable
              </div>
            )}
          </div>
          <div className="p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900">Ruta del Taller Emprendedor</h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li>1. Define tu pasión y solicita el estudio de opciones a Gemini.</li>
              <li>2. Compara inversión, ingresos y elige tu modelo de negocio.</li>
              <li>3. Resuelve las 40 preguntas, costos, permisos CR y 4 bancos.</li>
              <li>4. Consolida tu informe final, hoja de ruta y Rúbrica SIG (/40).</li>
            </ol>
          </div>
        </aside>
      </section>

      {/* Resultados del estudio de Gemini: Tabla comparativa + Tarjetas seleccionables */}
      {state.proposals.length > 0 && (
        <section className="space-y-6">
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              Estudio de Modelos de Negocio Generado por Gemini
            </h2>
            {state.passionAnalysis && (
              <p className="text-sm text-slate-700 leading-relaxed">{state.passionAnalysis}</p>
            )}
          </div>

          {/* Tabla comparativa de posibles negocios */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <h3 className="text-base font-bold text-slate-900">
                Tabla Comparativa de Opciones Relacionadas con tu Pasión
              </h3>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {state.proposals.length} alternativas evaluadas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Modelo de Negocio</th>
                    <th className="py-3 px-4 text-right">Inversión Inicial Est.</th>
                    <th className="py-3 px-4 text-right">Ingreso Mensual Est.</th>
                    <th className="py-3 px-4 text-right">Recuperación</th>
                    <th className="py-3 px-4">Complejidad</th>
                    <th className="py-3 px-4">Forma Legal Sugerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {state.proposals.map((prop) => {
                    const isSelected = prop.id === state.selectedProposalId;
                    return (
                      <tr key={prop.id} className={isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{prop.name}</td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800">
                          {formatCRC(prop.estimatedInitialCostCRC)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                          {formatCRC(prop.estimatedMonthlyRevenueCRC)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                          {prop.timeToBreakevenMonths} meses
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{prop.difficulty}</td>
                        <td className="py-3.5 px-4 text-slate-600">{prop.recommendedLegalForm}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tarjetas para elegir el negocio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.proposals.map((prop) => {
              const isSelected = prop.id === state.selectedProposalId;
              return (
                <article
                  key={prop.id}
                  className={`flex flex-col justify-between bg-white rounded-2xl p-6 border transition-all ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-500">
                          {prop.difficulty} · Recuperación en {prop.timeToBreakevenMonths} meses
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{prop.name}</h3>
                        <p className="text-sm font-medium text-indigo-700">{prop.tagline}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">{prop.description}</p>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-500 block">Inversión Inicial</span>
                        <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                          {formatCRC(prop.estimatedInitialCostCRC)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Ingreso Mensual Est.</span>
                        <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                          {formatCRC(prop.estimatedMonthlyRevenueCRC)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div>
                        <strong className="text-slate-800">Propuesta de valor:</strong> {prop.valueProposition}
                      </div>
                      <div>
                        <strong className="text-slate-800">Cliente ideal:</strong> {prop.targetAudience}
                      </div>
                      <div>
                        <strong className="text-slate-800">Herramientas SIG clave:</strong>{' '}
                        {prop.keyTools.join(' · ')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectProposal(prop)}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          Modelo elegido para mi empresa
                        </>
                      ) : (
                        'Elegir este negocio'
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {state.selectedProposalId && (
            <div className="bg-white border border-emerald-300 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 flex-1 w-full">
                <h3 className="text-lg font-bold text-slate-900">
                  Personaliza el nombre de tu empresa simulada y avanza a las 40 preguntas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company-name" className="block text-xs font-medium text-slate-600 mb-1">
                      Nombre comercial de tu empresa
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      value={state.companyName}
                      onChange={(e) => onUpdateField('companyName', e.target.value)}
                      placeholder="Ej. Cacao Vivo CR"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="company-slogan" className="block text-xs font-medium text-slate-600 mb-1">
                      Eslogan (opcional)
                    </label>
                    <input
                      id="company-slogan"
                      type="text"
                      value={state.companySlogan}
                      onChange={(e) => onUpdateField('companySlogan', e.target.value)}
                      placeholder="Ej. Dulzura real con cacao tico"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onProceedToBuilder}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Ir al Plan (40 Preguntas)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
