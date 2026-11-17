import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReportMarkdown,
  buildWordReportHtml,
  calculateAcademicProgress,
  calculateBankComparisonMetrics,
  calculateFinancialSummary,
  calculateMonthlyLoanPayment,
  calculateRubricTotal,
} from './businessLogic';
import { createDemoBusinessPlanState, createEmptyBusinessPlanState } from '../data/demoProject';

test('calculateAcademicProgress returns 0/51 for empty state and 51/51 for demo state', () => {
  const empty = createEmptyBusinessPlanState();
  const emptyProgress = calculateAcademicProgress(empty);
  assert.equal(emptyProgress.answeredCount, 0);
  assert.equal(emptyProgress.totalQuestions, 51);
  assert.equal(emptyProgress.percentage, 0);
  assert.equal(emptyProgress.isAll40Complete, false);

  const demo = createDemoBusinessPlanState();
  const demoProgress = calculateAcademicProgress(demo);
  assert.equal(demoProgress.answeredCount, 51);
  assert.equal(demoProgress.totalQuestions, 51);
  assert.equal(demoProgress.percentage, 100);
  assert.equal(demoProgress.isAll40Complete, true);
  assert.equal(demoProgress.banksResearchedCount, 4);
  assert.equal(demoProgress.hasSelectedModel, true);
  assert.equal(demoProgress.hasSelectedBank, true);
});

test('calculateFinancialSummary accurately calculates startup cost, break-even, and 12-month cashflow', () => {
  const summary = calculateFinancialSummary(
    [
      { id: '1', category: 'Equipamiento', concept: 'Horno', amountCRC: 600000, essential: true },
      { id: '2', category: 'Permisos y Legal', concept: 'Patente', amountCRC: 200000, essential: true },
    ],
    {
      unitPriceCRC: 10000,
      unitVariableCostCRC: 4000,
      fixedMonthlyOpCostCRC: 300000,
      estimatedMonthlyUnits: 100,
      ownCapitalCRC: 300000,
    }
  );

  assert.equal(summary.totalStartupCostCRC, 800000);
  assert.equal(summary.capitalGapCRC, 500000);
  assert.equal(summary.unitContributionMarginCRC, 6000);
  assert.equal(summary.contributionMarginPct, 60);
  assert.equal(summary.monthlyRevenueCRC, 1000000);
  assert.equal(summary.monthlyNetProfitCRC, 300000);
  assert.equal(summary.breakEvenUnits, 50); // 300,000 / 6,000 = 50
  assert.equal(summary.paybackMonths, 3); // ceil(800,000 / 300,000) = 3
  assert.equal(summary.cashflow12Months.length, 12);
});

test('calculateMonthlyLoanPayment and bank metrics compute accurate PMT installments', () => {
  const pmtZero = calculateMonthlyLoanPayment(1200000, 0, 12);
  assert.equal(pmtZero, 100000);

  const pmt10 = calculateMonthlyLoanPayment(1000000, 12, 12);
  // Monthly rate 1%, 12 months => ~88,849
  assert.ok(pmt10 >= 88800 && pmt10 <= 88900);

  const demo = createDemoBusinessPlanState();
  const bankMetrics = calculateBankComparisonMetrics(demo.banks, 1095000);
  assert.equal(bankMetrics.length, 4);
  const bncr = bankMetrics.find((b) => b.bankId === 'bncr');
  assert.ok(bncr);
  assert.equal(bncr.readinessPct, 100);
  assert.ok(bncr.monthlyPaymentCRC > 20000 && bncr.monthlyPaymentCRC < 26000);
});

test('calculateRubricTotal computes exact sum out of 40 and explanatory comment', () => {
  const rubricMax = calculateRubricTotal({
    1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4,
  });
  assert.equal(rubricMax.totalScore, 40);
  assert.equal(rubricMax.maxScore, 40);
  assert.equal(rubricMax.percentage, 100);
  assert.equal(rubricMax.performanceLevel, 'Sobresaliente');
  assert.ok(rubricMax.generatedComment.includes('40/40'));

  const rubricMid = calculateRubricTotal({
    1: 3, 2: 3, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 2, 9: 3, 10: 3,
  });
  assert.equal(rubricMid.totalScore, 27);
  assert.equal(rubricMid.performanceLevel, 'En Desarrollo');
  assert.ok(rubricMid.generatedComment.includes('27/40'));
  assert.ok(rubricMid.generatedComment.includes('Determinación de recursos tecnológicos'));
});

test('buildReportMarkdown and buildWordReportHtml include official title, 4 banks, 51 questions, and rubric total', () => {
  const demo = createDemoBusinessPlanState();
  const md = buildReportMarkdown(demo);
  assert.ok(md.includes('Informe final : Toma de decision gerencial para construir una empresa'));
  assert.ok(md.includes('Prof: Liz Acuña. Toma de Decisiones Gerenciales para crear mi empresa.'));
  assert.ok(md.includes('Cacao Vivo CR'));
  assert.ok(md.includes('51/51 preguntas resueltas'));
  assert.ok(md.includes('Banco Nacional de Costa Rica'));
  assert.ok(md.includes('40 / 40'));

  const wordHtml = buildWordReportHtml(demo);
  assert.ok(wordHtml.includes('Informe final : Toma de decision gerencial para construir una empresa'));
  assert.ok(wordHtml.includes('51/51 preguntas'));
  assert.ok(wordHtml.includes('urn:schemas-microsoft-com:office:word'));
  assert.ok(wordHtml.includes('40 / 40'));
});
