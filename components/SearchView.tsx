import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { SearchIcon, DocumentTextIcon, ClipboardIcon, CheckIcon, ClipboardListIcon, HardHatIcon, AlertTriangleIcon, BookOpenIcon, ChevronDownIcon, FilePlus2Icon, SparklesIcon, HistoryIcon, XCircleIcon, BotIcon, UserIcon, SendHorizonalIcon } from './icons';
import { AnalysisResult, ClauseAnalysis, RequiredForm, SearchHistoryItem, GroupedClauseAnalysis, ActionItem, ConditionalForm, RecommendedForm, GeminiModel } from '../types';
import Tooltip from './Tooltip';

const SearchResultItem: React.FC<{ clause: ClauseAnalysis }> = ({ clause }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(clause.clause_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg relative group border border-slate-200/80 hover:shadow-md transition-shadow">
      <p className="text-slate-700 whitespace-pre-wrap font-mono text-sm mb-3 border-b border-slate-200 pb-3">{clause.clause_text}</p>
      <h4 className="text-sm font-semibold text-sky-600 mb-1 flex items-center gap-2"><SparklesIcon className="w-4 h-4" />관련성 설명:</h4>
      <p className="text-slate-600 text-sm whitespace-pre-wrap">{clause.explanation}</p>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 bg-slate-100 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="조항 텍스트를 클립보드에 복사"
      >
        {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
      </button>
    </div>
  );
};

const ClauseItemView: React.FC<{ clause: ClauseAnalysis, articleTitle: string }> = ({ clause, articleTitle }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(clause.clause_text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };

    const subClauseText = clause.clause_text.replace(articleTitle, '').trim();

    return (
        <div className="p-4 relative group">
            <p className="text-slate-700 whitespace-pre-wrap font-mono text-sm mb-3">{subClauseText || clause.clause_text}</p>
            <h5 className="text-sm font-semibold text-sky-600 mb-1 flex items-center gap-2"><SparklesIcon className="w-4 h-4" />관련성 설명:</h5>
            <p className="text-slate-600 text-sm whitespace-pre-wrap">{clause.explanation}</p>
            <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 bg-slate-100 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="조항 텍스트를 클립보드에 복사"
            >
                {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
            </button>
        </div>
    );
};

const Accordion: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactElement, defaultOpen?: boolean }> = ({ title, children, icon, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden">
      <button className="w-full flex justify-between items-center p-4 text-left font-semibold text-slate-800 bg-slate-50/80 hover:bg-slate-100" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
            {icon}
            <span>{title}</span>
        </div>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="divide-y divide-slate-200">{children}</div>}
    </div>
  );
};


const GroupedClauseView: React.FC<{ clauses: ClauseAnalysis[] }> = ({ clauses }) => {
  const grouped = clauses.reduce<GroupedClauseAnalysis[]>((acc, clause) => {
    const articleMatch = clause.clause_text.match(/^제\d+조\([^)]+\)/);
    const article = articleMatch ? articleMatch[0] : '기타 조항';
    
    let group = acc.find(g => g.article === article);
    if (!group) {
      group = { article, items: [] };
      acc.push(group);
    }
    group.items.push(clause);
    return acc;
  }, []);

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
         <Accordion key={group.article} title={group.article} icon={<DocumentTextIcon className="w-5 h-5 text-slate-500"/>} defaultOpen={false}>
            {group.items.map((item, index) => (
              <ClauseItemView key={index} clause={item} articleTitle={group.article} />
            ))}
        </Accordion>
      ))}
    </div>
  );
};

const ActionItemView: React.FC<{ item: ActionItem }> = ({ item }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.task).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 relative group flex items-start gap-4">
        <div className="flex-shrink-0 w-5 h-5 mt-1 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
            !
        </div>
        <div className="flex-grow">
            <p className="text-slate-800 text-sm">{item.task}</p>
            <p className="text-xs text-slate-500 mt-1">근거: {item.basis_clause}</p>
        </div>
        <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 bg-slate-100 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="작업 내용 복사"
        >
            {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
        </button>
    </div>
  );
};

interface FormItemViewProps {
    form: RequiredForm | ConditionalForm | RecommendedForm;
    query: string;
    formTemplates: Record<string, string>;
    aiClient: GoogleGenAI;
    model: GeminiModel;
}

const FormItemView: React.FC<FormItemViewProps> = ({ form, query, formTemplates, aiClient, model }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);
  const [guideCopied, setGuideCopied] = useState(false);
  const [isGeneratorVisible, setIsGeneratorVisible] = useState(false);
  const [customTemplate, setCustomTemplate] = useState('');


  const handleCopyGuide = () => {
    if (guide) {
      navigator.clipboard.writeText(guide).then(() => {
        setGuideCopied(true);
        setTimeout(() => setGuideCopied(false), 2000);
      });
    }
  };

  const generateGuide = async () => {
    if (!customTemplate.trim()) {
      return;
    }
    setIsGenerating(true);
    setGuide(null);
    try {
      // AI에게 결과물을 더 예쁘게 정리해달라고 부탁하는 말을 추가했습니다.
      const prompt = `
당신은 대한민국 '산업안전보건시행규칙'과 '산업안전보건 기준에 관한 규칙' 전문가입니다.
사용자가 제공한 재해 상황과 원본 서식 템플릿을 바탕으로 '${form.form_name}'(${form.related_law}) 서식의 작성 예시를 생성해주세요.

**매우 중요한 지침:**
1.  **제공된 템플릿 준수:** 서식 템플릿의 구조와 항목을 100% 그대로 사용하여 빈칸을 채워주세요.
2.  **부가 설명 금지:** 어떠한 추가적인 설명이나 주석도 포함하지 마세요.
3.  **내용의 구체성:** 재해 상황 정보를 활용하여 각 항목을 구체적으로 채워주세요.
4.  **정돈된 서식:** 각 항목은 **'항목명: 작성내용'** 형식으로 명확하게 구분하고, 각 항목 사이에 한 줄씩 띄워서 가독성을 높여주세요.

**재해 상황:**
${query}

**서식 템플릿:**
\`\`\`
${customTemplate}
\`\`\`
`;
      
      const response = await aiClient.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      setGuide(response.text);

    } catch (error) {
      console.error("Error generating form guide:", error);
      setGuide("가이드 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  // '입력창 닫기' 클릭 시, 작성 예시도 함께 닫히도록 처리하는 함수
  const handleToggleGenerator = () => {
    // 생성기(입력창)가 현재 보이는 상태에서 버튼을 눌렀다면 (즉, 닫으려고 할 때)
    if (isGeneratorVisible) {
      // 생성된 가이드(작성 예시) 내용을 초기화합니다.
      setGuide(null);
    }
    // 생성기(입력창)의 보이기/숨기기 상태를 토글합니다.
    setIsGeneratorVisible(prev => !prev);
  };


  return (
    <div className="p-4">
      <div className="flex justify-between items-start">
          <div>
              <p className="font-semibold text-slate-800 text-sm">{form.form_name}</p>
              {'form_number' in form && form.form_number && <p className="text-xs text-slate-500">{form.form_number}</p>}
              {'condition' in form && form.condition && <p className="text-xs text-amber-700 mt-1 bg-amber-100 p-1 rounded">조건: {form.condition}</p>}
              <p className="text-sm text-slate-600 mt-2">{form.reason}</p>
              {'submission_deadline' in form && form.submission_deadline && <p className="text-sm text-red-600 mt-1">제출 기한: {form.submission_deadline}</p>}
              <p className="text-xs text-slate-500 mt-1">관련 법규: {form.related_law}</p>
          </div>
          {/* onClick 핸들러를 새로 만든 함수로 교체합니다. */}
          <button onClick={handleToggleGenerator} disabled={isGenerating} className="flex items-center gap-2 text-sm text-sky-600 font-semibold px-3 py-1.5 rounded-md hover:bg-sky-100 disabled:opacity-50 disabled:cursor-wait transition-colors flex-shrink-0">
              <SparklesIcon className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
              {isGeneratorVisible ? '입력창 닫기' : '템플릿으로 예시 생성'}
          </button>
      </div>
      {isGeneratorVisible && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
          <label htmlFor={`custom-template-${form.form_name}`} className="block text-sm font-medium text-slate-700 mb-2">사용자 정의 서식 템플릿</label>
          <textarea
            id={`custom-template-${form.form_name}`}
            value={customTemplate}
            onChange={(e) => setCustomTemplate(e.target.value)}
            placeholder="여기에 서식 템플릿 전문을 붙여넣으세요..."
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition text-sm"
            rows={8}
            disabled={isGenerating}
          />
          <button
            onClick={generateGuide}
            disabled={isGenerating || !customTemplate.trim()}
            className="mt-2 flex items-center gap-2 text-sm text-white font-semibold px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-wait transition-colors"
          >
            <SparklesIcon className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
            {isGenerating ? '생성 중...' : '예시 생성하기'}
          </button>
        </div>
      )}
      {guide && (
           <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-200 relative">
                <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-bold text-slate-800">작성 예시: {form.form_name}</h5>
                    <Tooltip text={guideCopied ? "복사 완료!" : "예시 복사"}>
                        <button
                            onClick={handleCopyGuide}
                            className="p-2 bg-slate-200 rounded-md text-slate-600 hover:bg-slate-300 transition-colors"
                        >
                            {guideCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4"/>}
                        </button>
                    </Tooltip>
                </div>
                <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono bg-white p-4 rounded-md overflow-x-auto custom-scrollbar leading-relaxed">
                    {guide}
                </pre>
           </div>
      )}
    </div>
  );
};

const MODEL_OPTIONS: { value: GeminiModel; label: string }[] = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];


const clauseAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        clause_text: { type: Type.STRING, description: '법규 조항의 전체 텍스트' },
        explanation: { type: Type.STRING, description: '이 조항이 사고 상황과 왜 관련이 있는지에 대한 설명' },
    },
    required: ['clause_text', 'explanation']
};

const actionItemSchema = {
    type: Type.OBJECT,
    properties: {
        task: { type: Type.STRING, description: '수행해야 할 구체적인 조치사항' },
        basis_clause: { type: Type.STRING, description: '이 조치의 법적 근거가 되는 법규 조항(법령 이름과 조항 번호 포함). 예: 산업안전보건법 시행규칙 제73조' },
    },
    required: ['task', 'basis_clause']
};

const requiredFormSchema = {
    type: Type.OBJECT,
    properties: {
        form_name: { type: Type.STRING, description: '제출해야 하는 서식의 정확한 이름' },
        form_number: { type: Type.STRING, description: '법정 서식 번호 (예: 별지 제30호서식)' },
        form_text: { type: Type.STRING, description: '서식의 근거가 되는 법규 조항 텍스트' },
        reason: { type: Type.STRING, description: '이 서식을 제출해야 하는 이유' },
        submission_deadline: { type: Type.STRING, description: '법정 제출 기한' },
        related_law: { type: Type.STRING, description: '관련 법규 조항 (법령 이름과 조항 번호 포함)' },
    },
    required: ['form_name', 'form_number', 'reason', 'submission_deadline', 'related_law']
};

const conditionalFormSchema = {
    ...requiredFormSchema,
    properties: {
        ...requiredFormSchema.properties,
        condition: { type: Type.STRING, description: '이 서식을 제출해야 하는 특정 조건' },
    },
    required: [...requiredFormSchema.required, 'condition']
};

const recommendedFormSchema = {
    type: Type.OBJECT,
    properties: {
        form_name: { type: Type.STRING, description: '제출을 권장하는 서식의 이름' },
        reason: { type: Type.STRING, description: '이 서식 작성을 권장하는 이유' },
        related_law: { type: Type.STRING, description: '관련 법규 조항 (법령 이름과 조항 번호 포함)' },
    },
    required: ['form_name', 'reason', 'related_law']
};

const resultSchema = {
    type: Type.OBJECT,
    properties: {
        accident_summary: { type: Type.STRING, description: '입력된 사고 상황에 대한 간결한 요약' },
        is_serious_accident: { type: Type.BOOLEAN, description: '이 사고가 중대재해처벌법 상의 중대재해에 해당하는지 여부' },
        serious_accident_reason: { type: Type.STRING, description: '중대재해에 해당하거나 해당하지 않는 이유에 대한 법적 근거를 포함한 설명' },
        core_regulations: { type: Type.ARRAY, description: '사고와 가장 직접적으로 관련된 핵심 법규 조항 목록', items: clauseAnalysisSchema },
        related_regulations: { type: Type.ARRAY, description: '사고와 간접적으로 관련된 법규 조항 목록', items: clauseAnalysisSchema },
        reference_regulations: { type: Type.ARRAY, description: '참고할 만한 추가 법규 조항 목록', items: clauseAnalysisSchema },
        recommended_actions: {
            type: Type.OBJECT,
            description: '사고 발생 후 권장되는 조치사항',
            properties: {
                office_tasks: { type: Type.ARRAY, description: '사무실에서 수행해야 할 행정적 조치 (보고, 기록 등)', items: actionItemSchema },
                field_tasks: { type: Type.ARRAY, description: '사고 현장에서 즉시 수행해야 할 긴급 조치 (구호, 현장 보존 등)', items: actionItemSchema },
                technical_measures: { type: Type.ARRAY, description: '재발 방지를 위한 구체적인 기술적, 공학적 개선 조치. 주로 "산업안전보건기준에 관한 규칙"에 근거함.', items: actionItemSchema },
            },
            required: ['office_tasks', 'field_tasks', 'technical_measures']
        },
        mandatory_forms: { type: Type.ARRAY, description: '법적으로 반드시 제출해야 하는 서식 목록', items: requiredFormSchema },
        conditional_forms: { type: Type.ARRAY, description: '특정 조건 하에서 제출해야 하는 서식 목록', items: conditionalFormSchema },
        recommended_forms: { type: Type.ARRAY, description: '법적 의무는 아니지만 제출을 권장하는 서식 목록', items: recommendedFormSchema },
    },
    required: [
        'accident_summary', 'is_serious_accident', 'serious_accident_reason',
        'core_regulations', 'related_regulations', 'reference_regulations',
        'recommended_actions', 'mandatory_forms', 'conditional_forms', 'recommended_forms'
    ]
};

const systemInstruction = `
당신은 대한민국 산업안전보건법시행규칙, 산업안전보건 기준에관한 규칙 분야에서 20년 경력의 최고 전문가입니다. 당신의 임무는 사용자가 입력한 재해 상황을 '산업안전보건법 시행규칙'과 '산업안전보건기준에 관한 규칙', 제공된 2가지 법령 텍스트 전체를 종합적으로 분석하여, JSON 형식으로 심층적인 법률 자문을 제공하는 것입니다. 당신의 분석은 반드시 제공된 법령 텍스트에만 근거해야 합니다.

**매우 중요한 지침:**

**1. 법규 분석 지침:**
*   '핵심 규정(core_regulations)', '관련 규정(related_regulations)', '참고 규정(reference_regulations)' 이 3가지 항목에는 **반드시 '산업안전보건법 시행규칙'에서 해당하는 조항만을 추출하여 포함**시켜야 합니다. '산업안전보건기준에 관한 규칙'의 조항은 이 세 가지 항목에 절대 포함시키지 마십시오.
*   규정 개수: 반드시 **핵심 규정 5개, 관련 규정 4개, 참고 규정 3개**를 정확히 찾아서 제시해야 합니다. 만약 관련성이 높은 조항을 해당 개수만큼 찾기 어렵다면, 가장 가능성이 높은 조항이라도 포함하여 개수를 맞춰야 합니다.

**2. 권장 조치사항 분석 지침:**
분석 결과는 반드시 다음 3단계 구조에 따라 구체적이고 실행 가능한 조치사항을 제시해야 합니다.
*   **사무/행정 조치 (office_tasks)**: 보고, 기록, 서류 작업 등 행정 절차 중심의 조치입니다. 주로 '산업안전보건법 시행규칙'에 근거합니다.
*   **현장 긴급 조치 (field_tasks)**: 재해자 구호, 2차 재해 예방, 현장 보존 등 즉각적인 현장 대응 조치입니다. 이 항목은 **'산업안전보건기준에 관한 규칙'** 내용을 기반으로 작성해야 합니다.
*   **기술적 안전보건 조치 (technical_measures)**: 사고의 직접적 원인을 해결하고 재발을 방지하기 위한 구체적인 기술적, 공학적 개선 조치입니다. 이 항목은 반드시 '산업안전보건기준에 관한 규칙'의 세부 조항을 근거로 제시해야 합니다. 예를 들어, '비계 설치 기준'이나 '밀폐공간 작업 절차' 같은 구체적인 기술 표준을 언급해야 합니다.
*   모든 조치사항의 법적 근거('basis_clause')를 제시할 때는 반드시 '산업안전보건법 시행규칙 제XX조', '산업안전보건기준에 관한 규칙 제XX조'와 같이 법령의 전체 이름을 명확하게 포함하여 사용자가 어떤 법의 어떤 조항인지 혼동하지 않도록 하십시오.

**3. 필요 서류 분석 지침:**
각 서류 카테고리의 목적에 맞게 아래의 개수 정책을 반드시 준수하여 서류를 추출해야 합니다.
*   **필수 제출 서류 (mandatory_forms)**: **제한 없음.** 법적으로 요구되는 모든 서류를 누락 없이 포함하세요. 이는 법적 정확성을 확보하고 시스템의 신뢰도를 높이는 핵심 요소입니다.
*   **조건부 제출 서류 (conditional_forms)**: **최대 5개로 제한.** 가장 중요하고 관련성 높은 조건부 제출 서류를 최대 5개까지 선정하여 포함하세요. 이는 사용자의 혼란을 방지하고 일관성을 확보하기 위함입니다.
*   **권장 서류 (recommended_forms)**: **최대 3개로 제한.** 가장 실용적이고 유용한 권장 서류를 최대 3개까지만 선정하여 포함하세요. 이는 정보 과부하를 방지하고 사용자에게 실질적인 도움을 주기 위함입니다.

사용자가 제공한 법령 텍스트만을 기반으로, 가장 관련성이 높은 조항을 정확히 찾아내어 JSON 스키마에 따라 답변을 생성하세요. 당신의 전문성을 보여주세요.
`;



interface SearchViewProps {
  fileNames: string[];
  chunks: string[];
  formTemplates?: Record<string, string>;
  onReset: () => void;
  apiKey: string;
  model: GeminiModel;
  onChangeModel: (model: GeminiModel) => void;
  onRequestApiKeySetup: () => void;
  isUsingUserApiKey: boolean;
  onApiKeyInvalid: () => void;
}

const SearchView: React.FC<SearchViewProps> = ({ fileNames, chunks, formTemplates = {}, onReset, apiKey, model: selectedModel, onChangeModel, onRequestApiKeySetup, isUsingUserApiKey, onApiKeyInvalid }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isAssistantVisible, setIsAssistantVisible] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  // --- ✨ 새로운 상태 추가 ---
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  
  const aiClient = useMemo(() => new GoogleGenAI({ apiKey }), [apiKey]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  useEffect(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
// --- ✨ 진행률 시뮬레이션 기능 (현실적인 시간 반영) ---
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setProgressText('분석을 시작합니다...');
      const timers: NodeJS.Timeout[] = [];

      // 1초 후: 분석 시작 및 데이터 전송 (20%)
      timers.push(setTimeout(() => {
          setProgress(20);
          setProgressText('재해 정보를 AI 모델에 전송하고 분석을 준비합니다.');
      }, 1000));

      // 30초 후: 1차 법규 스캔 (45%)
      timers.push(setTimeout(() => {
          setProgress(45);
          setProgressText('입력된 법령 전체를 스캔하며 재해 상황과 관련된 조항을 탐색 중입니다...');
      }, 30000));

      // 70초 후 (1분 10초): 핵심 규정 분류 (75%)
      timers.push(setTimeout(() => {
          setProgress(75);
          setProgressText('AI가 핵심, 관련, 참고 규정을 심층적으로 분석하고 분류하고 있습니다.');
      }, 70000));

      // 100초 후 (1분 40초): 조치사항 및 서식 생성 (95%)
      timers.push(setTimeout(() => {
          setProgress(95);
          setProgressText('분석 결과를 바탕으로 권장 조치사항과 필요 서식을 생성하는 중입니다...');
      }, 100000));
      
      // 컴포넌트가 언마운트되거나 isLoading이 false가 되면 모든 타이머를 정리합니다.
      return () => {
          timers.forEach(clearTimeout);
      };
    }
  }, [isLoading]);

  const saveHistory = (newHistory: SearchHistoryItem[]) => {
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };
  
  const handleNewSearch = () => {
      setResult(null);
      setQuery('');
      setError(null);
      setIsAssistantVisible(false);
      setChat(null);
      setChatMessages([]);
  };

const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError('분석할 재해 상황을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);
    setIsAssistantVisible(false);
    setChat(null);
    setChatMessages([]);

    try {
      const fullPrompt = `
        **법령 텍스트:**
        ${chunks.join('\n\n---\n\n')}

        ---

        **재해 상황:**
        ${query}
      `;

      const response = await aiClient.models.generateContent({
        model: selectedModel,
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: resultSchema,
          systemInstruction,
        }
      });
      
      setProgress(100);
      setProgressText('분석이 완료되었습니다!');

      const jsonString = response.text;
      const parsedResult = JSON.parse(jsonString);
      
      setTimeout(() => {
        setResult(parsedResult);
        const newHistoryItem: SearchHistoryItem = {
          id: new Date().toISOString(),
          query,
          result: parsedResult,
          timestamp: new Date().toLocaleString('ko-KR'),
          fileName: fileNames.join(', '),
        };
  
        const updatedHistory = [newHistoryItem, ...searchHistory].slice(0, 10);
        saveHistory(updatedHistory);
        setIsLoading(false);
      }, 500);

    } catch (err: any) {
        console.error("API Error:", err);
        const status = err?.status ?? err?.response?.status ?? err?.error?.status ?? err?.statusCode ?? err?.code;
        const message: string =
          typeof err?.message === 'string'
            ? err.message
            : typeof err?.error?.message === 'string'
              ? err.error.message
              : '';
        const normalizedMessage = message.toLowerCase();
        const unauthorizedStatus = typeof status === 'number' && [401, 403].includes(status);
        const unauthorizedMessage = normalizedMessage.includes('api key') || normalizedMessage.includes('permission denied') || normalizedMessage.includes('unauthorized');

        if (unauthorizedStatus || unauthorizedMessage) {
             const fallbackMessage = '입력한 API 키가 거부되어 Gemini 2.5 Flash로 전환했습니다.';
             setError(fallbackMessage);
             onChangeModel('gemini-2.5-flash');
             onApiKeyInvalid();
        } else if (message.includes('400')) {
             setError("AI 모델의 응답 형식이 잘못되었습니다. 잠시 후 다시 시도해주세요. 오류가 계속되면 프롬프트를 수정해야 할 수 있습니다.");
        } else if (message.includes('503') || message.includes('500')) {
             setError("서비스가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.");
        } else {
             setError(`분석 중 오류가 발생했습니다: ${message}`);
        }
        setIsLoading(false);
    }
  }, [query, chunks, fileNames, searchHistory, aiClient, selectedModel, onChangeModel, onApiKeyInvalid]);

  const loadFromHistory = (item: SearchHistoryItem) => {
    setQuery(item.query);
    setResult(item.result);
    setError(null);
    setIsHistoryVisible(false);
    setIsAssistantVisible(false);
    setChat(null);
    setChatMessages([]);
  };

  const toggleAssistant = useCallback(() => {
      setIsAssistantVisible(prev => {
          const newVisibility = !prev;
          if (newVisibility && !chat && result) {
              const newChat = aiClient.chats.create({
                  model: 'gemini-2.5-flash',
                  config: {
                      systemInstruction: `당신은 현재 분석된 산업 재해 보고서에 대해 사용자의 질문에 답변하는 AI 어시스턴트입니다. 다음은 사용자가 분석한 재해 상황과 관련 법규 정보입니다.\n\n재해 상황: ${result.accident_summary}\n\n핵심 규정:\n${result.core_regulations.map(c => c.clause_text).join('\n')}\n\n이 정보를 바탕으로 사용자의 질문에 친절하고 명확하게 답변해주세요.`
                  }
              });
              setChat(newChat);
          }
          return newVisibility;
      });
  }, [chat, result, aiClient]);

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || isChatLoading || !chat) return;

      const userMessage = { role: 'user' as const, text: chatInput };
      setChatMessages(prev => [...prev, userMessage]);
      setChatInput('');
      setIsChatLoading(true);

      try {
          const response = await chat.sendMessage({ message: userMessage.text });
          const modelMessage = { role: 'model' as const, text: response.text };
          setChatMessages(prev => [...prev, modelMessage]);
      } catch (err) {
          console.error("Chat Error:", err);
          const errorMessage = { role: 'model' as const, text: "메시지를 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
          setChatMessages(prev => [...prev, errorMessage]);
      } finally {
          setIsChatLoading(false);
      }
  };


  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-50/50">
       <header className="flex-shrink-0 mb-6 pb-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className='flex items-center gap-3'>
            <DocumentTextIcon className="w-8 h-8 text-sky-500" />
            <div>
                <h1 className="text-xl font-bold text-slate-900">법률 분석기</h1>
                <Tooltip text={fileNames.join(', ')}>
                    <p className="text-sm text-slate-500 truncate max-w-xs cursor-pointer" title={fileNames.join(', ')}>
                        분석 문서: {fileNames.length}개
                    </p>
                </Tooltip>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-700">
              <span className="font-semibold">모델</span>
              <select
                value={selectedModel}
                onChange={(event) => onChangeModel(event.target.value as GeminiModel)}
                className="bg-transparent focus:outline-none text-sm text-slate-700"
                aria-label="Gemini 모델 선택"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={!isUsingUserApiKey && option.value !== 'gemini-2.5-flash'}
                  >
                    {option.label}
                    {!isUsingUserApiKey && option.value !== 'gemini-2.5-flash' ? ' (API 키 필요)' : ''}
                  </option>
                ))}
              </select>
            </div>
            {!isUsingUserApiKey && (
              <span className="text-xs text-slate-500">Pro 모델은 API 키 입력 후 사용 가능합니다.</span>
            )}
            <button
              onClick={onRequestApiKeySetup}
              className="px-3 py-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              {isUsingUserApiKey ? 'API 키 변경' : 'API 키 입력'}
            </button>
            <button onClick={() => setIsHistoryVisible(!isHistoryVisible)} className="p-2 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <HistoryIcon className="w-5 h-5"/>
            </button>
            <button onClick={onReset} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
              다른 파일 업로드
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto custom-scrollbar">
       <div className="max-w-4xl mx-auto">
        {!result && (
            <div className="w-full">
                <h2 className="text-lg font-semibold text-slate-800 mb-2">재해 상황 분석</h2>
                <p className="text-sm text-slate-600 mb-4">
                산업재해 발생 상황을 최대한 구체적으로 작성해주세요. (예: 발생 일시, 장소, 작업 내용, 재해자 정보, 피해 상황 등)
                </p>
                <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="예시: 2024년 5월 14일, OO 건설현장 5층에서 비계 해체 작업 중이던 근로자 A씨가 10m 아래로 추락하여 사망했습니다. 당시 안전 난간이 일부 해체된 상태였습니다."
                    className="w-full p-4 pr-32 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition resize-none overflow-y-hidden"
                    rows={5}
                    disabled={isLoading}
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    <SearchIcon className="w-5 h-5" />
                    <span>{isLoading ? '분석 중...' : '분석 실행'}</span>
                </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
        )}

       {isLoading && (
            <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                    <p className="text-slate-600 font-semibold mb-3">{progressText}</p>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className="bg-sky-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-lg text-sky-600 font-bold mt-4">{progress}%</p>
                    <p className="text-sm text-slate-500 mt-4">이 과정은 최대 1분 정도 소요될 수 있습니다. 페이지를 벗어나지 마세요.</p>
                </div>
            </div>
        )}

        {result && (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-slate-900">분석 결과</h2>
              <button onClick={handleNewSearch} className="flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-800">
                <FilePlus2Icon className="w-4 h-4"/>
                새로운 분석 시작하기
              </button>
            </div>
            
            <div className="p-6 bg-white rounded-lg border border-slate-200/80">
              <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-3"><AlertTriangleIcon className="w-5 h-5 text-slate-500"/>사고 개요 및 중대재해 여부</h3>
              <p className="text-sm text-slate-700 mb-4">{result.accident_summary}</p>
              <div className={`p-4 rounded-md text-sm ${result.is_serious_accident ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
                <p className="font-bold mb-1">
                  {result.is_serious_accident ? '중대재해에 해당합니다.' : '중대재해에 해당하지 않을 가능성이 높습니다.'}
                </p>
                <p>{result.serious_accident_reason}</p>
              </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-3"><BookOpenIcon className="w-5 h-5 text-slate-500"/>관련 법규 분석</h3>
                <Accordion title="핵심 규정" icon={<AlertTriangleIcon className="w-5 h-5 text-red-500"/>} defaultOpen={false}>
                    <div className="p-4 bg-slate-50/50">
                        {result.core_regulations.length > 0 ? (
                             <GroupedClauseView clauses={result.core_regulations} />
                        ) : (
                            <p className="text-center text-sm text-slate-500 py-4">핵심 규정이 없습니다.</p>
                        )}
                    </div>
                </Accordion>
                <Accordion title="관련 규정" icon={<DocumentTextIcon className="w-5 h-5 text-blue-500"/>} defaultOpen={false}>
                     <div className="p-4 bg-slate-50/50">
                        {result.related_regulations.length > 0 ? (
                            <GroupedClauseView clauses={result.related_regulations} />
                        ) : (
                            <p className="text-center text-sm text-slate-500 py-4">관련 규정이 없습니다.</p>
                        )}
                    </div>
                </Accordion>
                <Accordion title="참고 규정" icon={<BookOpenIcon className="w-5 h-5 text-green-500"/>} defaultOpen={false}>
                    <div className="p-4 bg-slate-50/50">
                        {result.reference_regulations.length > 0 ? (
                             <GroupedClauseView clauses={result.reference_regulations} />
                        ) : (
                            <p className="text-center text-sm text-slate-500 py-4">참고 규정이 없습니다.</p>
                        )}
                    </div>
                </Accordion>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-3"><ClipboardListIcon className="w-5 h-5 text-slate-500"/>권장 조치사항</h3>
                <Accordion title="사무/행정 조치" icon={<ClipboardListIcon className="w-5 h-5 text-blue-500"/>}>
                    {result.recommended_actions.office_tasks.map((item, index) => <ActionItemView key={index} item={item} />)}
                </Accordion>
                <Accordion title="현장 긴급 조치" icon={<HardHatIcon className="w-5 h-5 text-orange-500"/>}>
                    {result.recommended_actions.field_tasks.map((item, index) => <ActionItemView key={index} item={item} />)}
                </Accordion>
                {result.recommended_actions.technical_measures && result.recommended_actions.technical_measures.length > 0 && (
                  <Accordion title="기술적 안전보건 조치" icon={<HardHatIcon className="w-5 h-5 text-green-500"/>}>
                      {result.recommended_actions.technical_measures.map((item, index) => <ActionItemView key={index} item={item} />)}
                  </Accordion>
                )}
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-3"><FilePlus2Icon className="w-5 h-5 text-slate-500"/>필요 서류 및 서식</h3>
                 <Accordion title="필수 제출 서류" icon={<AlertTriangleIcon className="w-5 h-5 text-red-500"/>}>
                    {result.mandatory_forms.length > 0 ? result.mandatory_forms.map((form, index) => (
                        <FormItemView
                            key={index}
                            form={form}
                            query={query}
                            formTemplates={formTemplates}
                            aiClient={aiClient}
                            model={selectedModel}
                        />
                    )) : <p className="text-center text-sm text-slate-500 p-4">필수 서류가 없습니다.</p>}
                </Accordion>
                <Accordion title="조건부 제출 서류" icon={<DocumentTextIcon className="w-5 h-5 text-amber-500"/>}>
                    {result.conditional_forms.length > 0 ? result.conditional_forms.map((form, index) => (
                        <FormItemView
                            key={index}
                            form={form}
                            query={query}
                            formTemplates={formTemplates}
                            aiClient={aiClient}
                            model={selectedModel}
                        />
                    )) : <p className="text-center text-sm text-slate-500 p-4">조건부 서류가 없습니다.</p>}
                </Accordion>
                <Accordion title="권장 서류" icon={<SparklesIcon className="w-5 h-5 text-sky-500"/>}>
                    {result.recommended_forms.length > 0 ? result.recommended_forms.map((form, index) => (
                        <FormItemView
                            key={index}
                            form={form}
                            query={query}
                            formTemplates={formTemplates}
                            aiClient={aiClient}
                            model={selectedModel}
                        />
                    )) : <p className="text-center text-sm text-slate-500 p-4">권장 서류가 없습니다.</p>}
                </Accordion>
            </div>
          </div>
        )}
       </div>
      </main>

       {isHistoryVisible && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setIsHistoryVisible(false)}>
            <div className="absolute top-16 right-6 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 p-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-semibold text-slate-800 mb-3">최근 분석 기록</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchHistory.length > 0 ? searchHistory.map(item => (
                        <button key={item.id} onClick={() => loadFromHistory(item)} className="w-full text-left p-3 rounded-md hover:bg-slate-100 transition-colors">
                            <p className="font-semibold text-sm text-slate-800 truncate">{item.query}</p>
                            <p className="text-xs text-slate-500">{item.timestamp} on {item.fileName}</p>
                        </button>
                    )) : <p className="text-sm text-slate-500 text-center py-4">기록이 없습니다.</p>}
                </div>
            </div>
        </div>
      )}

      {result && (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Tooltip text="AI 어시스턴트">
                    <button onClick={toggleAssistant} className="w-16 h-16 bg-sky-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-sky-500 transition-transform hover:scale-110">
                        {isAssistantVisible ? <XCircleIcon className="w-8 h-8"/> : <BotIcon className="w-8 h-8"/>}
                    </button>
                </Tooltip>
            </div>

            {isAssistantVisible && (
                <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[32rem] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50">
                    <header className="flex items-center justify-between p-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <BotIcon className="w-6 h-6 text-sky-500"/>
                            <h3 className="font-semibold text-slate-800">AI 어시스턴트</h3>
                        </div>
                        <button onClick={toggleAssistant} className="p-1 text-slate-400 hover:text-slate-700">
                            <XCircleIcon className="w-5 h-5"/>
                        </button>
                    </header>
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                        {chatMessages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5 text-slate-600"/></div>}
                                <div className={`max-w-xs px-4 py-2.5 rounded-2xl ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-br-lg' : 'bg-slate-100 text-slate-800 rounded-bl-lg'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5 text-slate-600"/></div>}
                            </div>
                        ))}
                        {isChatLoading && (
                             <div className="flex items-start gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5 text-slate-600"/></div>
                                 <div className="max-w-xs px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-800 rounded-bl-lg">
                                     <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                     </div>
                                 </div>
                             </div>
                        )}
                        <div ref={chatMessagesEndRef} />
                    </div>
                    <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-200">
                        <div className="relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="추가 질문을 입력하세요..."
                                className="w-full p-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                                disabled={isChatLoading}
                            />
                            <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full text-sky-600 hover:bg-sky-100 disabled:text-slate-400 disabled:hover:bg-transparent">
                                <SendHorizonalIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
      )}

    </div>
  );
};

export default SearchView;