import React from 'react';
import { XCircleIcon } from './icons';

interface ErrorViewProps {
  error: string;
  onReset: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ error, onReset }) => {
  return (
    <div className="w-full max-w-lg mx-auto text-center bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-red-300/50">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircleIcon className="w-10 h-10 text-red-500"/>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">오류가 발생했습니다</h2>
        <p className="text-red-700 bg-red-100 p-4 rounded-md mb-8 text-sm">{error}</p>
        <button
            onClick={onReset}
            className="px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-sky-500 transition-colors"
        >
            다른 파일 업로드하기
        </button>
    </div>
  );
};

export default ErrorView;