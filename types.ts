export type AppState = 'idle' | 'processing' | 'ready' | 'error';

export interface ClauseAnalysis {
  clause_text: string;
  explanation: string;
}

export interface GroupedClauseAnalysis {
  article: string;
  // Fix: Corrected typo from Clause-analysis to ClauseAnalysis
  items: ClauseAnalysis[];
}

export interface ActionItem {
  task: string;
  basis_clause: string;
}

export interface RecommendedActions {
  office_tasks: ActionItem[];
  field_tasks: ActionItem[];
  technical_measures: ActionItem[];
}

export interface RequiredForm {
  form_name: string;
  form_number: string;
  form_text: string;
  reason: string;
  submission_deadline: string;
  related_law: string;
}

export interface ConditionalForm extends RequiredForm {
  condition: string;
}

export interface RecommendedForm {
  form_name: string;
  reason: string;
  related_law: string;
}

export interface AnalysisResult {
  accident_summary: string;
  is_serious_accident: boolean;
  serious_accident_reason: string;
  core_regulations: ClauseAnalysis[];
  related_regulations: ClauseAnalysis[];
  reference_regulations: ClauseAnalysis[];
  recommended_actions: RecommendedActions;
  mandatory_forms: RequiredForm[];
  conditional_forms: ConditionalForm[];
  recommended_forms: RecommendedForm[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  result: AnalysisResult;
  timestamp: string;
  fileName: string;
}

export type GeminiModel = 'gemini-2.5-pro' | 'gemini-2.5-flash';