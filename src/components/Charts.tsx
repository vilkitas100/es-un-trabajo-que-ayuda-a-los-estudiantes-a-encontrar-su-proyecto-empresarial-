import React, { useState } from 'react';
import { BankMetrics, MonthlyCashflowPoint, calculateRubricTotal, formatCRC } from '../utils/businessLogic';
import { SIG_RUBRIC_CRITERIA } from '../data/questionsAndRubric';
import { RubricScoreValue } from '../types/businessPlan';

const CATEGORY_COLORS: Record<string, string> = {
  Equipamiento: '#1D4ED8',
  'Capital de Trabajo': '#15803D',
  'Inventario Inicial': '#EA580C',
  'Permisos y Legal': '#7E22CE',
  'Tecnología y SIG': '#DC2626',
  'Marketing Lanzamiento': '#7C2D12',
};

export const StartupCostDonutChart: React.FC<{
  data: Array<{ category: string; amountCRC: number; sharePct: number }>;
  totalCRC: number;
}> = ({ data, totalCRC }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const size = 176;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90" role="img" aria-label="Gráfico de distribución de costos iniciales">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />
          {totalCRC > 0 &&
            data.map((slice, idx) => {
              const fraction = slice.amountCRC / totalCRC;
              const dashLength = fraction * circumference;
              const dashOffset = -cumulativeOffset;
              cumulativeOffset += dashLength;
              const color = CATEGORY_COLORS[slice.category] || '#64748B';
              const isHovered = hoveredIdx === idx;
              return (
                <circle
                  key={slice.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${Math.max(0, dashLength - 1.5)} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
          <span className="text-[11px] font-medium text-slate-500 leading-tight">
            {hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx].category : 'Inversión Total'}
          </span>
          <span className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {hoveredIdx !== null && data[hoveredIdx]
              ? formatCRC(data[hoveredIdx].amountCRC)
              : formatCRC(totalCRC)}
          </span>
          {hoveredIdx !== null && data[hoveredIdx] && (
            <span className="text-[11px] font-mono tabular-nums text-indigo-700 font-medium">
              {data[hoveredIdx].sharePct}%
            </span>
          )}
        </div>
      </div>

      <div className="w-full min-w-0 space-y-1.5">
        {data.map((item, idx) => {
          const color = CATEGORY_COLORS[item.category] || '#64748B';
          return (
            <div
              key={item.category}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                hoveredIdx === idx ? 'bg-slate-100' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="text-xs sm:text-sm text-slate-700 truncate">{item.category}</span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 font-mono tabular-nums text-xs">
                <span className="text-slate-500">{item.sharePct}%</span>
                <span className="font-semibold text-slate-900">{formatCRC(item.amountCRC)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CashflowProjectionChart: React.FC<{
  points: MonthlyCashflowPoint[];
}> = ({ points }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const width = 680;
  const height = 260;
  const pad = { top: 24, right: 20, bottom: 36, left: 74 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allValues = points.flatMap((p) => [p.revenueCRC, p.totalCostCRC, p.cumulativeCashflowCRC, 0]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues, 100000);
  const range = Math.max(1, maxVal - minVal);

  const xPos = (i: number) => pad.left + (i / Math.max(1, points.length - 1)) * plotW;
  const yPos = (v: number) => pad.top + ((maxVal - v) / range) * plotH;

  const revPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(p.revenueCRC)}`).join(' ');
  const costPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(p.totalCostCRC)}`).join(' ');
  const cumPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(p.cumulativeCashflowCRC)}`).join(' ');
  const zeroY = yPos(0);

  const yTicks = [maxVal, maxVal * 0.5, 0, minVal].filter(
    (v, i, arr) => arr.findIndex((x) => Math.abs(x - v) < range * 0.08) === i
  );

  const activePoint = activeIdx !== null ? points[activeIdx] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-0.5 bg-indigo-600 inline-block" aria-hidden="true" />
            Ingresos mensuales
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-0.5 bg-orange-500 inline-block" aria-hidden="true" />
            Costos totales
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block" aria-hidden="true" />
            Flujo acumulado
          </span>
        </div>
        {activePoint && (
          <div className="text-xs font-mono tabular-nums text-slate-700 bg-slate-100 px-3 py-1 rounded-md">
            {activePoint.label}: Ingresos {formatCRC(activePoint.revenueCRC)} · Flujo acum.{' '}
            <span className={activePoint.cumulativeCashflowCRC >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
              {formatCRC(activePoint.cumulativeCashflowCRC)}
            </span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[460px] h-auto" role="img" aria-label="Proyección financiera a 12 meses">
          {/* Grid lines */}
          {yTicks.map((val, i) => (
            <g key={i}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={yPos(val)}
                y2={yPos(val)}
                stroke={Math.abs(val) < 1 ? '#94A3B8' : '#E2E8F0'}
                strokeDasharray={Math.abs(val) < 1 ? undefined : '4 4'}
                strokeWidth={Math.abs(val) < 1 ? 1.5 : 1}
              />
              <text
                x={pad.left - 8}
                y={yPos(val) + 4}
                textAnchor="end"
                className="fill-slate-500 text-[10px] font-mono tabular-nums"
              >
                {val >= 1000000 || val <= -1000000
                  ? `₡${(val / 1000000).toFixed(1)}M`
                  : `₡${Math.round(val / 1000)}k`}
              </text>
            </g>
          ))}

          {/* Zero baseline label */}
          {zeroY >= pad.top && zeroY <= height - pad.bottom && (
            <text x={width - pad.right} y={zeroY - 5} textAnchor="end" className="fill-slate-400 text-[10px]">
              Recuperación (₡0)
            </text>
          )}

          {/* Lines */}
          <path d={costPath} fill="none" stroke="#F97316" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={revPath} fill="none" stroke="#4F46E5" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          <path d={cumPath} fill="none" stroke="#059669" strokeWidth={2.4} strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive points */}
          {points.map((p, i) => (
            <g key={p.month} onMouseEnter={() => setActiveIdx(i)} onMouseLeave={() => setActiveIdx(null)} className="cursor-pointer">
              <rect
                x={xPos(i) - plotW / 24}
                y={pad.top}
                width={plotW / 12}
                height={plotH}
                fill="transparent"
              />
              <circle cx={xPos(i)} cy={yPos(p.revenueCRC)} r={activeIdx === i ? 5 : 3} fill="#4F46E5" />
              <circle cx={xPos(i)} cy={yPos(p.totalCostCRC)} r={activeIdx === i ? 4.5 : 2.5} fill="#F97316" />
              <circle cx={xPos(i)} cy={yPos(p.cumulativeCashflowCRC)} r={activeIdx === i ? 5 : 3} fill="#059669" />
              <text
                x={xPos(i)}
                y={height - 12}
                textAnchor="middle"
                className="fill-slate-500 text-[11px] font-mono tabular-nums"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export const BankComparisonBarChart: React.FC<{
  metrics: BankMetrics[];
  selectedBankId: string | null;
}> = ({ metrics, selectedBankId }) => {
  const maxRate = Math.max(...metrics.map((m) => m.annualInterestRatePct), 18);
  const maxPmt = Math.max(...metrics.map((m) => m.monthlyPaymentCRC), 10000);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>Comparativa de tasa de interés anual (%) y cuota mensual estimada</span>
        <span className="font-mono tabular-nums text-slate-500">4 entidades en Costa Rica</span>
      </div>
      <div className="space-y-3.5">
        {metrics.map((m) => {
          const isSelected = m.bankId === selectedBankId;
          const rateWidth = Math.min(100, Math.round((m.annualInterestRatePct / maxRate) * 100));
          const pmtWidth = Math.min(100, Math.round((m.monthlyPaymentCRC / maxPmt) * 100));
          return (
            <div
              key={m.bankId}
              className={`p-3 rounded-xl border-2 transition-colors bg-white ${
                isSelected ? 'border-[#1D4ED8] bg-blue-50/40' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{m.shortName}</span>
                  {isSelected && (
                    <span className="text-xs font-semibold text-sky-700">· Banco Elegido</span>
                  )}
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-600">
                  Requisitos: {m.checkedCount}/{m.totalRequirements} ({m.readinessPct}%)
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs text-slate-600 shrink-0">Tasa anual</span>
                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                      style={{ width: `${rateWidth}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs font-mono tabular-nums font-semibold text-slate-900">
                    {m.annualInterestRatePct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs text-slate-600 shrink-0">Cuota est.</span>
                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-200"
                      style={{ width: `${pmtWidth}%` }}
                    />
                  </div>
                  <span className="w-24 text-right text-xs font-mono tabular-nums font-semibold text-slate-900">
                    {formatCRC(m.monthlyPaymentCRC)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const RubricProfileChart: React.FC<{
  scores: Record<number, RubricScoreValue>;
}> = ({ scores }) => {
  const summary = calculateRubricTotal(scores);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <span className="text-sm font-bold text-[#1D4ED8]">Perfil de Evaluación SIG (Base 40 pts)</span>
        <span className="text-sm font-mono tabular-nums font-bold text-[#15803D]">
          {summary.totalScore} / {summary.maxScore} ({summary.percentage}%)
        </span>
      </div>
      <div className="space-y-2.5">
        {SIG_RUBRIC_CRITERIA.map((criterion) => {
          const val = scores[criterion.id] ?? 1;
          const pct = (val / 4) * 100;
          const barColor =
            val === 4 ? 'bg-emerald-600' : val === 3 ? 'bg-indigo-600' : val === 2 ? 'bg-amber-500' : 'bg-rose-500';
          return (
            <div key={criterion.id} className="grid grid-cols-12 items-center gap-3">
              <span className="col-span-6 sm:col-span-5 text-xs text-slate-700 truncate" title={criterion.title}>
                {criterion.title}
              </span>
              <div className="col-span-4 sm:col-span-5 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className={`h-full ${barColor} rounded-full transition-all duration-200`} style={{ width: `${pct}%` }} />
              </div>
              <span className="col-span-2 text-right text-xs font-mono tabular-nums font-semibold text-slate-900">
                {val} / 4
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
