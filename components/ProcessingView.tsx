import React, { useState, useEffect } from 'react';

interface ProcessingViewProps {
  fileName: string;
}

const processingSteps = [
  "문서 분석 중...",
  "텍스트를 청크로 분할 중...",
  "검색 가능한 인덱스 생성 중...",
  "거의 완료되었습니다...",
];

const ProcessingView: React.FC<ProcessingViewProps> = ({ fileName }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prevStep => (prevStep + 1) % processingSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto text-center bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200/50">
      <div className="w-16 h-16 flex items-center justify-center gap-1.5 mb-8 mx-auto">
        <div className="w-2.5 h-10 bg-sky-400 rounded-full bounce-1"></div>
        <div className="w-2.5 h-10 bg-sky-500 rounded-full bounce-2"></div>
        <div className="w-2.5 h-10 bg-sky-400 rounded-full bounce-3"></div>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">문서 처리 중</h2>
      <p className="text-slate-600 mt-2 truncate w-full max-w-md mx-auto">"{fileName}"</p>
      <div className="mt-8 text-sky-600 font-medium h-8 flex items-center justify-center w-full bg-slate-200/50 rounded-full overflow-hidden relative p-1">
        <div className="absolute inset-0 bg-sky-500/10 animate-pulse"></div>
        <p className="relative z-10 text-sm">{processingSteps[currentStep]}</p>
      </div>
    </div>
  );
};

export default ProcessingView;