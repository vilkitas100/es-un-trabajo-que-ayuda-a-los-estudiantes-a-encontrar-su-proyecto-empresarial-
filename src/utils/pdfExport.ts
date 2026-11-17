import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MODULES, QUESTIONS_40, SIG_RUBRIC_CRITERIA } from '../data/questionsAndRubric';
import { BusinessPlanState } from '../types/businessPlan';
import {
  calculateAcademicProgress,
  calculateBankComparisonMetrics,
  calculateFinancialSummary,
  calculateRubricTotal,
  formatCRC,
} from './businessLogic';

function formatCRCForPdf(amount: number): string {
  // Replace colón symbol with CRC in standard Helvetica PDF font to avoid missing glyph issues
  return formatCRC(amount).replace('₡', 'CRC ');
}

export function downloadReportAsPDF(state: BusinessPlanState): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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

  // Header Banner
  doc.setFillColor(49, 46, 129); // indigo-900
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informe final : Toma de decision gerencial para construir una empresa', 14, 15, {
    maxWidth: 182,
  });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${state.companyName || 'Empresa Simulada'} | Estudiante: ${state.studentName || 'Sin especificar'}`,
    14,
    27
  );

  // Meta Summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  let y = 42;
  const metaLines = [
    `Curso: Prof: Liz Acuña. Toma de Decisiones Gerenciales para crear mi empresa.`,
    `Pasion base: ${state.passionText || 'Sin definir'}`,
    `Modelo seleccionado: ${selectedModel?.name || 'Pendiente'}`,
    `Equipo: ${state.teamMembers || 'Individual'} | Docente: ${state.teacherName || 'Prof. Liz Acuña'}`,
    `Avance academico: ${progress.answeredCount}/${progress.totalQuestions} preguntas (${progress.percentage}%) | Rubrica SIG: ${rubricSummary.totalScore}/40 pts`,
  ];
  for (const line of metaLines) {
    const wrapped = doc.splitTextToSize(line, 182);
    doc.text(wrapped, 14, y);
    y += wrapped.length * 5;
  }

  // 1. Startup Costs Table
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Estructura de Costos Iniciales y Proyeccion', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [['Categoria', 'Concepto', 'Monto']],
    body: state.startupCosts.map((c) => [c.category, c.concept, formatCRCForPdf(c.amountCRC)]),
    foot: [
      ['Total Inversion Inicial', `Punto de equilibrio: ${financial.breakEvenUnits ?? 'N/A'} unid./mes`, formatCRCForPdf(financial.totalStartupCostCRC)],
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [79, 70, 229] },
    footStyles: { fillColor: [238, 242, 255], textColor: [30, 27, 75], fontStyle: 'bold' },
  });

  // 2. 4 Costa Rican Banks Table
  const afterCostY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`2. Comparativa de 4 Bancos en Costa Rica (Elegido: ${selectedBank?.shortName || 'Pendiente'})`, 14, afterCostY);

  autoTable(doc, {
    startY: afterCostY + 3,
    head: [['Banco', 'Producto PyME', 'Tasa', 'Plazo', 'Cuota Est.', 'Garantia']],
    body: state.banks.map((b) => {
      const m = bankMetrics.find((x) => x.bankId === b.id);
      const tag = b.id === state.selectedBankId ? ' (Elegido)' : '';
      return [
        `${b.shortName}${tag}`,
        b.productName,
        `${b.annualInterestRatePct.toFixed(1)}%`,
        `${b.maxTermMonths} m`,
        formatCRCForPdf(m?.monthlyPaymentCRC ?? 0),
        b.collateralRequired,
      ];
    }),
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [2, 132, 199] },
  });

  // 3. Legal & Tax Table
  const afterBankY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Permisos Legales y Obligaciones Tributarias (Costa Rica)', 14, afterBankY);

  autoTable(doc, {
    startY: afterBankY + 3,
    head: [['Institucion', 'Permiso / Obligacion', 'Frecuencia', 'Tarifa / Costo']],
    body: state.legalTaxChecklist.map((l) => [l.entity, l.obligation, l.frequency, l.estimatedCostOrRate]),
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [124, 58, 237] },
  });

  // 4. All 40 Questions
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`4. Desarrollo Completo de las ${QUESTIONS_40.length} Preguntas Estrategicas`, 14, 16);

  const qRows: Array<[string, string, string]> = [];
  for (const mod of MODULES) {
    const modQs = QUESTIONS_40.filter((q) => q.moduleId === mod.id);
    for (const q of modQs) {
      qRows.push([
        `${q.number}`,
        `${mod.shortTitle} - ${q.title}`,
        state.answers[q.id]?.trim() || 'Pendiente de responder.',
      ]);
    }
  }

  autoTable(doc, {
    startY: 20,
    head: [['#', 'Tema / Aspecto', 'Respuesta del Estudiante']],
    body: qRows,
    styles: { fontSize: 8, cellPadding: 2.2, overflow: 'linebreak' },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 48 }, 2: { cellWidth: 124 } },
    headStyles: { fillColor: [15, 23, 42] },
  });

  // 5. SIG Rubric out of 40 points
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('5. Rubrica de la propuesta de sistema de informacion gerencial (40 puntos)', 14, 16);

  autoTable(doc, {
    startY: 20,
    head: [['Criterio', 'Nivel Asignado', 'Pts']],
    body: SIG_RUBRIC_CRITERIA.map((c) => {
      const score = state.rubric.scores[c.id] ?? 1;
      return [c.title, c.levels[score], `${score} / 4`];
    }),
    foot: [['TOTAL', `Nivel ${rubricSummary.performanceLevel} (${rubricSummary.percentage}%)`, `${rubricSummary.totalScore} / 40`]],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 106 }, 2: { cellWidth: 18, halign: 'center' } },
    headStyles: { fillColor: [79, 70, 229] },
    footStyles: { fillColor: [238, 242, 255], textColor: [30, 27, 75], fontStyle: 'bold' },
  });

  const afterRubricY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Comentario final de evaluacion:', 14, afterRubricY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const commentLines = doc.splitTextToSize(finalComment, 182);
  doc.text(commentLines, 14, afterRubricY + 6);

  const safeName = (state.companyName || 'Empresa_Simulada').replace(/[^a-zA-Z0-9_-]+/g, '_');
  doc.save(`Informe_Final_${safeName}.pdf`);
}
