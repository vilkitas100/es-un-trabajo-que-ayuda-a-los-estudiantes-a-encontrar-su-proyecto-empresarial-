export type AppTab = 'passion' | 'builder' | 'progress' | 'report';

export type ModuleId =
  | 'm1_pasion'
  | 'm2_operacion_sig'
  | 'm3_costos_socios'
  | 'm4_legal_tributario'
  | 'm5_bancos_financiamiento'
  | 'm6_marketing_cierre';

export interface ModuleDefinition {
  id: ModuleId;
  order: number;
  shortTitle: string;
  title: string;
  description: string;
  accentColor: string; // hex
  accentBgClass: string;
  accentTextClass: string;
  accentBorderClass: string;
}

export interface QuestionDefinition {
  id: string;
  number: number; // 1 to 40
  moduleId: ModuleId;
  title: string;
  prompt: string;
  helperHint: string;
  placeholder: string;
  rubricCriterionIndex: number; // 1..10
}

export interface BusinessModelProposal {
  id: string;
  name: string;
  tagline: string;
  description: string;
  valueProposition: string;
  targetAudience: string;
  revenueStreams: string[];
  estimatedInitialCostCRC: number;
  estimatedMonthlyRevenueCRC: number;
  timeToBreakevenMonths: number;
  difficulty: 'Baja' | 'Media' | 'Alta';
  keyTools: string[];
  recommendedLegalForm: string;
}

export interface StartupCostItem {
  id: string;
  category: 'Equipamiento' | 'Permisos y Legal' | 'Inventario Inicial' | 'Marketing Lanzamiento' | 'Tecnología y SIG' | 'Capital de Trabajo';
  concept: string;
  amountCRC: number;
  essential: boolean;
}

export interface FinancialAssumptions {
  unitPriceCRC: number;
  unitVariableCostCRC: number;
  fixedMonthlyOpCostCRC: number;
  estimatedMonthlyUnits: number;
  ownCapitalCRC: number;
}

export interface CostaRicaBankResearch {
  id: string;
  bankName: string;
  shortName: string;
  productName: string;
  annualInterestRatePct: number;
  maxTermMonths: number;
  minAmountCRC: number;
  maxAmountCRC: number;
  collateralRequired: string;
  keyRequirements: string[];
  checkedRequirements: string[];
  studentNotes: string;
  prosAndCons: string;
}

export interface LegalTaxItem {
  id: string;
  entity: string;
  obligation: string;
  frequency: string;
  estimatedCostOrRate: string;
  completed: boolean;
  notes: string;
}

export interface RubricCriterion {
  id: number; // 1..10
  title: string;
  levels: {
    4: string;
    3: string;
    2: string;
    1: string;
  };
}

export type RubricScoreValue = 1 | 2 | 3 | 4;

export interface RubricEvaluationState {
  scores: Record<number, RubricScoreValue>;
  justifications: Record<number, string>;
  finalComment: string;
  evaluatedByAI: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface BusinessPlanState {
  sessionId: string;
  lastSavedAt: string;
  aiMemoryNotes: string[];
  studentName: string;
  teamMembers: string;
  teacherName: string;
  passionText: string;
  passionAnalysis: string;
  proposals: BusinessModelProposal[];
  selectedProposalId: string | null;
  companyName: string;
  companySlogan: string;
  answers: Record<string, string>;
  startupCosts: StartupCostItem[];
  financialAssumptions: FinancialAssumptions;
  banks: CostaRicaBankResearch[];
  selectedBankId: string | null;
  extraBankConsiderations: string[];
  legalTaxChecklist: LegalTaxItem[];
  rubric: RubricEvaluationState;
  mentorMessages: ChatMessage[];
}
