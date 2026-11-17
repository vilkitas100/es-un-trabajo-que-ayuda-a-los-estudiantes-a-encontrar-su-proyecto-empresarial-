import { MODULES, QUESTIONS_40, SIG_RUBRIC_CRITERIA } from '../data/questionsAndRubric';
import {
  BusinessPlanState,
  CostaRicaBankResearch,
  FinancialAssumptions,
  ModuleId,
  QuestionDefinition,
  RubricScoreValue,
  StartupCostItem,
} from '../types/businessPlan';

export interface ModuleProgress {
  moduleId: ModuleId;
  shortTitle: string;
  order: number;
  answered: number;
  total: number;
  percentage: number;
  accentColor: string;
}

export interface AcademicProgressSummary {
  answeredCount: number;
  totalQuestions: number;
  percentage: number;
  isAll40Complete: boolean;
  modules: ModuleProgress[];
  banksResearchedCount: number;
  hasSelectedModel: boolean;
  hasSelectedBank: boolean;
}

export interface MonthlyCashflowPoint {
  month: number;
  label: string;
  unitsSold: number;
  revenueCRC: number;
  totalCostCRC: number;
  netCashflowCRC: number;
  cumulativeCashflowCRC: number;
}

export interface FinancialSummary {
  totalStartupCostCRC: number;
  capitalGapCRC: number;
  unitContributionMarginCRC: number;
  contributionMarginPct: number;
  monthlyRevenueCRC: number;
  monthlyVariableCostCRC: number;
  monthlyTotalCostCRC: number;
  monthlyNetProfitCRC: number;
  breakEvenUnits: number | null;
  paybackMonths: number | null;
  costByCategory: Array<{ category: string; amountCRC: number; sharePct: number }>;
  cashflow12Months: MonthlyCashflowPoint[];
}

export interface BankMetrics {
  bankId: string;
  shortName: string;
  annualInterestRatePct: number;
  maxTermMonths: number;
  monthlyPaymentCRC: number;
  totalInterestCRC: number;
  readinessPct: number;
  checkedCount: number;
  totalRequirements: number;
}

export interface RubricSummary {
  totalScore: number;
  maxScore: number;
  percentage: number;
  performanceLevel: 'Sobresaliente' | 'Satisfactorio' | 'En Desarrollo' | 'Inicial';
  generatedComment: string;
}

export function formatCRC(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₡${safe.toLocaleString('en-US')}`;
}

export function isMeaningfulAnswer(text: string | undefined): boolean {
  return Boolean(text && text.trim().length >= 12);
}

export function calculateAcademicProgress(state: Pick<BusinessPlanState, 'answers' | 'banks' | 'selectedProposalId' | 'selectedBankId'>): AcademicProgressSummary {
  let answeredCount = 0;

  const modules: ModuleProgress[] = MODULES.map((mod) => {
    const modQuestions = QUESTIONS_40.filter((q) => q.moduleId === mod.id);
    const modAnswered = modQuestions.filter((q) => isMeaningfulAnswer(state.answers[q.id])).length;
    answeredCount += modAnswered;
    const total = modQuestions.length;
    return {
      moduleId: mod.id,
      shortTitle: mod.shortTitle,
      order: mod.order,
      answered: modAnswered,
      total,
      percentage: total > 0 ? Math.round((modAnswered / total) * 100) : 0,
      accentColor: mod.accentColor,
    };
  });

  const totalQuestions = QUESTIONS_40.length;
  const percentage = Math.round((answeredCount / totalQuestions) * 100);
  const banksResearchedCount = state.banks.filter(
    (b) => b.studentNotes.trim().length >= 10 || b.checkedRequirements.length > 0
  ).length;

  return {
    answeredCount,
    totalQuestions,
    percentage,
    isAll40Complete: answeredCount === totalQuestions,
    modules,
    banksResearchedCount,
    hasSelectedModel: Boolean(state.selectedProposalId),
    hasSelectedBank: Boolean(state.selectedBankId),
  };
}

export function calculateFinancialSummary(
  startupCosts: StartupCostItem[],
  assumptions: FinancialAssumptions
): FinancialSummary {
  const totalStartupCostCRC = startupCosts.reduce((sum, item) => sum + Math.max(0, item.amountCRC || 0), 0);
  const capitalGapCRC = Math.max(0, totalStartupCostCRC - Math.max(0, assumptions.ownCapitalCRC || 0));

  const unitPrice = Math.max(0, assumptions.unitPriceCRC || 0);
  const unitVar = Math.max(0, assumptions.unitVariableCostCRC || 0);
  const fixedOp = Math.max(0, assumptions.fixedMonthlyOpCostCRC || 0);
  const units = Math.max(0, assumptions.estimatedMonthlyUnits || 0);

  const unitContributionMarginCRC = unitPrice - unitVar;
  const contributionMarginPct = unitPrice > 0 ? Math.round((unitContributionMarginCRC / unitPrice) * 1000) / 10 : 0;

  const monthlyRevenueCRC = unitPrice * units;
  const monthlyVariableCostCRC = unitVar * units;
  const monthlyTotalCostCRC = fixedOp + monthlyVariableCostCRC;
  const monthlyNetProfitCRC = monthlyRevenueCRC - monthlyTotalCostCRC;

  const breakEvenUnits =
    unitContributionMarginCRC > 0 ? Math.ceil(fixedOp / unitContributionMarginCRC) : null;

  const paybackMonths =
    monthlyNetProfitCRC > 0 && totalStartupCostCRC > 0
      ? Math.ceil(totalStartupCostCRC / monthlyNetProfitCRC)
      : null;

  const categoryTotals = new Map<string, number>();
  for (const item of startupCosts) {
    const val = Math.max(0, item.amountCRC || 0);
    categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + val);
  }

  const costByCategory = Array.from(categoryTotals.entries())
    .map(([category, amountCRC]) => ({
      category,
      amountCRC,
      sharePct: totalStartupCostCRC > 0 ? Math.round((amountCRC / totalStartupCostCRC) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amountCRC - a.amountCRC);

  // Ramp-up curve over 12 months (starts at 55% of target volume in Month 1, hits 100% by Month 6, grows to 118% by Month 12)
  const rampFactors = [0.55, 0.65, 0.75, 0.85, 0.92, 1.0, 1.03, 1.06, 1.09, 1.12, 1.15, 1.18];
  let cumulative = -totalStartupCostCRC;
  const cashflow12Months: MonthlyCashflowPoint[] = rampFactors.map((factor, idx) => {
    const monthUnits = Math.round(units * factor);
    const rev = monthUnits * unitPrice;
    const cost = fixedOp + monthUnits * unitVar;
    const net = rev - cost;
    cumulative += net;
    return {
      month: idx + 1,
      label: `M${idx + 1}`,
      unitsSold: monthUnits,
      revenueCRC: Math.round(rev),
      totalCostCRC: Math.round(cost),
      netCashflowCRC: Math.round(net),
      cumulativeCashflowCRC: Math.round(cumulative),
    };
  });

  return {
    totalStartupCostCRC,
    capitalGapCRC,
    unitContributionMarginCRC,
    contributionMarginPct,
    monthlyRevenueCRC,
    monthlyVariableCostCRC,
    monthlyTotalCostCRC,
    monthlyNetProfitCRC,
    breakEvenUnits,
    paybackMonths,
    costByCategory,
    cashflow12Months,
  };
}

export function calculateMonthlyLoanPayment(
  principalCRC: number,
  annualInterestRatePct: number,
  termMonths: number
): number {
  const principal = Math.max(0, principalCRC);
  const months = Math.max(1, Math.round(termMonths));
  if (principal === 0) return 0;

  const monthlyRate = Math.max(0, annualInterestRatePct) / 100 / 12;
  if (monthlyRate === 0) {
    return Math.round(principal / months);
  }
  const factor = Math.pow(1 + monthlyRate, months);
  const pmt = (principal * (monthlyRate * factor)) / (factor - 1);
  return Math.round(pmt);
}

export function calculateBankComparisonMetrics(
  banks: CostaRicaBankResearch[],
  loanAmountCRC: number
): BankMetrics[] {
  return banks.map((bank) => {
    const payment = calculateMonthlyLoanPayment(
      loanAmountCRC,
      bank.annualInterestRatePct,
      bank.maxTermMonths
    );
    const totalPaid = payment * Math.max(1, bank.maxTermMonths);
    const totalInterestCRC = Math.max(0, totalPaid - Math.max(0, loanAmountCRC));
    const totalRequirements = bank.keyRequirements.length;
    const checkedCount = bank.checkedRequirements.length;
    const readinessPct =
      totalRequirements > 0 ? Math.round((checkedCount / totalRequirements) * 100) : 0;

    return {
      bankId: bank.id,
      shortName: bank.shortName,
      annualInterestRatePct: bank.annualInterestRatePct,
      maxTermMonths: bank.maxTermMonths,
      monthlyPaymentCRC: payment,
      totalInterestCRC,
      readinessPct,
      checkedCount,
      totalRequirements,
    };
  });
}

export function calculateRubricTotal(scores: Record<number, RubricScoreValue>): RubricSummary {
  let totalScore = 0;
  const strengths: string[] = [];
  const improvements: string[] = [];

  for (const criterion of SIG_RUBRIC_CRITERIA) {
    const score = scores[criterion.id] ?? 1;
    totalScore += score;
    const cleanTitle = criterion.title.replace(/^\d+\.\s*/, '');
    if (score >= 4) {
      strengths.push(cleanTitle);
    } else if (score <= 2) {
      improvements.push(cleanTitle);
    }
  }

  const maxScore = SIG_RUBRIC_CRITERIA.length * 4; // 40 puntos exactos
  const percentage = Math.round((totalScore / maxScore) * 100);

  let performanceLevel: RubricSummary['performanceLevel'] = 'Inicial';
  if (totalScore >= 35) performanceLevel = 'Sobresaliente';
  else if (totalScore >= 28) performanceLevel = 'Satisfactorio';
  else if (totalScore >= 20) performanceLevel = 'En Desarrollo';

  const strengthText =
    strengths.length > 0
      ? `Destaca con nivel óptimo (4/4) en: ${strengths.slice(0, 4).join(', ')}.`
      : 'Se recomienda profundizar las evidencias estratégicas y tecnológicas para alcanzar el nivel 4 en los criterios clave.';

  const improvementText =
    improvements.length > 0
      ? ` Como oportunidad de mejora prioritaria, conviene fortalecer: ${improvements.join(', ')}.`
      : ' Todos los criterios mantienen un desempeño sólido y equilibrado respecto a los objetivos del Sistema de Información Gerencial.';

  const generatedComment = `La propuesta obtiene un puntaje total de ${totalScore}/${maxScore} puntos (${percentage}% — Nivel ${performanceLevel}). ${strengthText}${improvementText}`;

  return {
    totalScore,
    maxScore,
    percentage,
    performanceLevel,
    generatedComment,
  };
}

export const MIN_CONSCIENCE_CHARS = 20;

export const LEGAL_PERSON_PHILOSOPHICAL_QUESTION =
  'Si tu empresa pudiera hablar dentro de veinte años sobre la huella que dejó en la dignidad de las personas, en sus familias y en la sociedad costarricense, ¿qué justicia, verdad y legado humano defenderá tu persona jurídica incluso cuando nadie esté mirando, y cómo responderás éticamente por el poder que hoy le das al crearla?';

export function isConscienceReflectionComplete(answer: string | undefined | null): boolean {
  return (answer ?? '').trim().length >= MIN_CONSCIENCE_CHARS;
}

export function getPendingQuestions(state: BusinessPlanState): QuestionDefinition[] {
  return QUESTIONS_40.filter((q) => !isMeaningfulAnswer(state.answers[q.id]));
}

export function getModulePendingQuestions(
  state: BusinessPlanState,
  moduleId: ModuleId
): QuestionDefinition[] {
  return QUESTIONS_40.filter(
    (q) => q.moduleId === moduleId && !isMeaningfulAnswer(state.answers[q.id])
  );
}

export function buildReportMarkdown(state: BusinessPlanState): string {
  const progress = calculateAcademicProgress(state);
  const financial = calculateFinancialSummary(state.startupCosts, state.financialAssumptions);
  const rubricSummary = calculateRubricTotal(state.rubric.scores);
  const selectedModel = state.proposals.find((p) => p.id === state.selectedProposalId);
  const selectedBank = state.banks.find((b) => b.id === state.selectedBankId);

  const lines: string[] = [];
  lines.push(`# Informe final : Toma de decision gerencial para construir una empresa`);
  lines.push(`**Curso:** Prof: Liz Acuña. Toma de Decisiones Gerenciales para crear mi empresa.`);
  lines.push(`## Empresa Simulada: ${state.companyName || 'Por definir'}`);
  if (state.companySlogan) lines.push(`> *${state.companySlogan}*`);
  lines.push('');
  lines.push(`- **Estudiante:** ${state.studentName || 'Sin especificar'}`);
  if (state.teamMembers) lines.push(`- **Equipo Colaborativo:** ${state.teamMembers}`);
  lines.push(`- **Docente:** ${state.teacherName || 'Prof. Liz Acuña'}`);
  lines.push(`- **Pasión Base:** ${state.passionText || 'Sin especificar'}`);
  if (state.corporateCitizenVision.trim()) {
    lines.push(`- **Ciudadano Corporativo (Persona Jurídica):** ${state.corporateCitizenVision.trim()}`);
  }
  if (state.legalPersonConscienceAnswer.trim()) {
    lines.push(
      `- **Conciencia Filosófica de la Persona Jurídica:** ${state.legalPersonConscienceAnswer.trim()}`
    );
  }
  if (selectedModel) lines.push(`- **Modelo Seleccionado:** ${selectedModel.name}`);
  lines.push(`- **Progreso Académico:** ${progress.answeredCount}/${progress.totalQuestions} preguntas resueltas (${progress.percentage}%)`);
  lines.push('');

  lines.push('## 1. Resumen Financiero Inicial');
  lines.push(`- **Inversión Inicial Estimada:** ${formatCRC(financial.totalStartupCostCRC)}`);
  lines.push(`- **Capital Propio:** ${formatCRC(state.financialAssumptions.ownCapitalCRC)}`);
  lines.push(`- **Brecha a Financiar:** ${formatCRC(financial.capitalGapCRC)}`);
  lines.push(`- **Punto de Equilibrio:** ${financial.breakEvenUnits ?? 'N/A'} unidades/mes`);
  lines.push(`- **Utilidad Neta Mensual Objetivo:** ${formatCRC(financial.monthlyNetProfitCRC)}`);
  lines.push('');
  lines.push('| Categoría | Concepto | Monto (CRC) |');
  lines.push('| --- | --- | ---: |');
  for (const item of state.startupCosts) {
    lines.push(`| ${item.category} | ${item.concept} | ${formatCRC(item.amountCRC)} |`);
  }
  lines.push('');

  lines.push('## 2. Comparativa de 4 Bancos en Costa Rica');
  if (selectedBank) {
    lines.push(`**Banco Elegido:** ${selectedBank.bankName} — ${selectedBank.productName}`);
    lines.push('');
  }
  lines.push('| Banco | Producto PyME | Tasa Anual | Plazo Máx. | Garantía |');
  lines.push('| --- | --- | ---: | ---: | --- |');
  for (const bank of state.banks) {
    lines.push(
      `| ${bank.bankName} | ${bank.productName} | ${bank.annualInterestRatePct}% | ${bank.maxTermMonths} meses | ${bank.collateralRequired} |`
    );
  }
  lines.push('');

  lines.push(`## 3. Desarrollo de las ${progress.totalQuestions} Preguntas Estratégicas`);
  for (const mod of MODULES) {
    lines.push(`### ${mod.title}`);
    const modQuestions = QUESTIONS_40.filter((q) => q.moduleId === mod.id);
    for (const q of modQuestions) {
      lines.push(`**${q.number}. ${q.title}**`);
      lines.push(`*Pregunta:* ${q.prompt}`);
      lines.push(`*Respuesta:* ${state.answers[q.id]?.trim() || 'Pendiente de completar.'}`);
      lines.push('');
    }
  }

  lines.push('## 4. Rúbrica de la Propuesta de Sistema de Información Gerencial');
  lines.push('| Criterio | Puntaje (1-4) | Nivel Aplicado |');
  lines.push('| --- | ---: | --- |');
  for (const crit of SIG_RUBRIC_CRITERIA) {
    const score = state.rubric.scores[crit.id] ?? 1;
    lines.push(`| ${crit.title} | ${score} / 4 | ${crit.levels[score]} |`);
  }
  lines.push(`| **TOTAL** | **${rubricSummary.totalScore} / 40** | **${rubricSummary.performanceLevel}** |`);
  lines.push('');
  lines.push('### Comentario Final de Evaluación');
  lines.push(state.rubric.finalComment || rubricSummary.generatedComment);

  return lines.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildWordReportHtml(state: BusinessPlanState): string {
  const progress = calculateAcademicProgress(state);
  const financial = calculateFinancialSummary(state.startupCosts, state.financialAssumptions);
  const bankMetrics = calculateBankComparisonMetrics(
    state.banks,
    Math.max(500000, financial.capitalGapCRC || financial.totalStartupCostCRC)
  );
  const rubricSummary = calculateRubricTotal(state.rubric.scores);
  const selectedModel = state.proposals.find((p) => p.id === state.selectedProposalId);
  const selectedBank = state.banks.find((b) => b.id === state.selectedBankId);
  const finalComment = state.rubric.finalComment.trim() || rubricSummary.generatedComment;

  const costRows = state.startupCosts
    .map(
      (c) => `
      <tr>
        <td>${escapeHtml(c.category)}</td>
        <td>${escapeHtml(c.concept)}</td>
        <td style="text-align:right;">${escapeHtml(formatCRC(c.amountCRC))}</td>
      </tr>`
    )
    .join('');

  const bankRows = state.banks
    .map((b) => {
      const m = bankMetrics.find((x) => x.bankId === b.id);
      const isChosen = b.id === state.selectedBankId;
      return `
      <tr style="${isChosen ? 'background:#e0f2fe;font-weight:bold;' : ''}">
        <td>${escapeHtml(b.bankName)}${isChosen ? ' (ELEGIDO)' : ''}</td>
        <td>${escapeHtml(b.productName)}</td>
        <td style="text-align:right;">${b.annualInterestRatePct.toFixed(1)}%</td>
        <td style="text-align:right;">${b.maxTermMonths} meses</td>
        <td style="text-align:right;">${escapeHtml(formatCRC(m?.monthlyPaymentCRC ?? 0))}</td>
        <td>${escapeHtml(b.collateralRequired)}</td>
      </tr>`;
    })
    .join('');

  const legalRows = state.legalTaxChecklist
    .map(
      (l) => `
      <tr>
        <td>${escapeHtml(l.entity)}</td>
        <td>${escapeHtml(l.obligation)}</td>
        <td>${escapeHtml(l.frequency)}</td>
        <td>${escapeHtml(l.estimatedCostOrRate)}</td>
      </tr>`
    )
    .join('');

  const questionsHtml = MODULES.map((mod) => {
    const qs = QUESTIONS_40.filter((q) => q.moduleId === mod.id);
    const rows = qs
      .map(
        (q) => `
        <tr>
          <td style="width:36px;font-weight:bold;text-align:center;">${q.number}</td>
          <td style="width:200px;"><strong>${escapeHtml(q.title)}</strong><br/><span style="color:#475569;font-size:10pt;">${escapeHtml(q.prompt)}</span></td>
          <td>${escapeHtml(state.answers[q.id]?.trim() || 'Pendiente de completar.')}</td>
        </tr>`
      )
      .join('');
    return `
      <h3>${escapeHtml(mod.title)}</h3>
      <table>
        <thead><tr><th>#</th><th>Pregunta Estratégica</th><th>Decisión y Respuesta del Estudiante</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }).join('');

  const rubricRows = SIG_RUBRIC_CRITERIA.map((crit) => {
    const score = state.rubric.scores[crit.id] ?? 1;
    return `
      <tr>
        <td><strong>${escapeHtml(crit.title)}</strong></td>
        <td style="${score === 4 ? 'background:#e0e7ff;font-weight:bold;' : ''}">${escapeHtml(crit.levels[4])}</td>
        <td style="${score === 3 ? 'background:#e0e7ff;font-weight:bold;' : ''}">${escapeHtml(crit.levels[3])}</td>
        <td style="${score === 2 ? 'background:#e0e7ff;font-weight:bold;' : ''}">${escapeHtml(crit.levels[2])}</td>
        <td style="${score === 1 ? 'background:#e0e7ff;font-weight:bold;' : ''}">${escapeHtml(crit.levels[1])}</td>
        <td style="text-align:center;font-weight:bold;">${score} / 4</td>
      </tr>`;
  }).join('');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>Informe final : Toma de decision gerencial para construir una empresa</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; color: #0f172a; font-size: 11pt; line-height: 1.45; }
  h1 { color: #312e81; font-size: 18pt; border-bottom: 2px solid #4f46e5; padding-bottom: 6px; }
  h2 { color: #1e293b; font-size: 14pt; margin-top: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }
  h3 { color: #4338ca; font-size: 12pt; margin-top: 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; font-size: 10pt; }
  th { background: #1e293b; color: #ffffff; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left; }
  td { padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top; }
  .kpi { background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; margin-bottom: 12px; }
</style>
</head>
<body>
  <h1>Informe final : Toma de decision gerencial para construir una empresa</h1>
  <p style="color:#1E3A8A;font-weight:bold;margin-top:0;">Prof: Liz Acuña. Toma de Decisiones Gerenciales para crear mi empresa.</p>
  <div class="kpi">
    <p><strong>Empresa Simulada:</strong> ${escapeHtml(state.companyName || 'Sin definir')} ${state.companySlogan ? `— <em>${escapeHtml(state.companySlogan)}</em>` : ''}</p>
    <p><strong>Estudiante:</strong> ${escapeHtml(state.studentName || 'Sin especificar')} | <strong>Docente:</strong> ${escapeHtml(state.teacherName || 'Prof. Liz Acuña')}</p>
    ${state.teamMembers ? `<p><strong>Equipo Colaborativo:</strong> ${escapeHtml(state.teamMembers)}</p>` : ''}
    <p><strong>Pasión de Origen:</strong> ${escapeHtml(state.passionText || 'Sin definir')}</p>
    ${state.corporateCitizenVision.trim() ? `<p><strong>Ciudadano Corporativo (Persona Jurídica):</strong> ${escapeHtml(state.corporateCitizenVision.trim())}</p>` : ''}
    ${state.legalPersonConscienceAnswer.trim() ? `<p><strong>Conciencia Filosófica de la Persona Jurídica:</strong> ${escapeHtml(state.legalPersonConscienceAnswer.trim())}</p>` : ''}
    <p><strong>Modelo de Negocio Elegido:</strong> ${escapeHtml(selectedModel?.name || 'Pendiente')} | <strong>Avance Académico:</strong> ${progress.answeredCount}/${progress.totalQuestions} preguntas (${progress.percentage}%)</p>
  </div>

  <h2>1. Resumen Financiero e Inversión Inicial</h2>
  <p><strong>Inversión Total:</strong> ${escapeHtml(formatCRC(financial.totalStartupCostCRC))} | <strong>Capital Propio:</strong> ${escapeHtml(formatCRC(state.financialAssumptions.ownCapitalCRC))} | <strong>Brecha a Financiar:</strong> ${escapeHtml(formatCRC(financial.capitalGapCRC))} | <strong>Punto de Equilibrio:</strong> ${financial.breakEvenUnits ?? 'N/A'} unidades/mes</p>
  <table>
    <thead><tr><th>Categoría</th><th>Concepto</th><th style="text-align:right;">Monto (CRC)</th></tr></thead>
    <tbody>${costRows}</tbody>
  </table>

  <h2>2. Investigación Comparativa de 4 Bancos en Costa Rica</h2>
  <p><strong>Banco Elegido:</strong> ${escapeHtml(selectedBank?.bankName || 'Pendiente de seleccionar')}</p>
  <table>
    <thead><tr><th>Banco</th><th>Producto PyME</th><th style="text-align:right;">Tasa</th><th style="text-align:right;">Plazo</th><th style="text-align:right;">Cuota Est.</th><th>Garantía</th></tr></thead>
    <tbody>${bankRows}</tbody>
  </table>

  <h2>3. Obligaciones Legales y Tributarias en Costa Rica</h2>
  <table>
    <thead><tr><th>Institución</th><th>Permiso / Obligación</th><th>Frecuencia</th><th>Tarifa / Costo</th></tr></thead>
    <tbody>${legalRows}</tbody>
  </table>

  <h2>4. Desarrollo Completo de las ${progress.totalQuestions} Preguntas Estratégicas</h2>
  ${questionsHtml}

  <h2>5. Rúbrica de la propuesta de sistema de información gerencial</h2>
  <table>
    <thead><tr><th>CRITERIOS</th><th>4</th><th>3</th><th>2</th><th>1</th><th>Puntaje</th></tr></thead>
    <tbody>${rubricRows}</tbody>
    <tfoot>
      <tr style="background:#e0e7ff;font-weight:bold;">
        <td colspan="5">TOTAL (El puntaje se calcula con base en 40 puntos)</td>
        <td style="text-align:center;">${rubricSummary.totalScore} / 40</td>
      </tr>
    </tfoot>
  </table>
  <p><strong>Comentario final explicativo:</strong> ${escapeHtml(finalComment)}</p>
</body>
</html>`;
}

