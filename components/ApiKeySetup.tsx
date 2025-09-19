import React, { useState } from 'react';
import { GeminiModel } from '../types';

interface ApiKeySetupProps {
  onSubmit: (apiKey: string, model: GeminiModel) => void;
  initialModel?: GeminiModel;
}

const modelOptions: { value: GeminiModel; label: string; description: string }[] = [
  {
    value: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: '최고 품질의 분석 결과가 필요한 경우에 적합합니다.'
  },
  {
    value: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: '빠른 응답 속도가 필요한 경우에 적합합니다.'
  }
];

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSubmit, initialModel = 'gemini-2.5-flash' }) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(initialModel);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiKey.trim()) {
      setError('Gemini API 키를 입력해주세요.');
      return;
    }

    setError(null);
    onSubmit(apiKey.trim(), selectedModel);
    setApiKey('');
  };

  return (
    <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-6 border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Gemini API 설정</h1>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        앱은 API 키를 저장하지 않습니다. Microsoft Store 보안 정책을 준수하기 위해 사용자가 직접 입력한 키만
        즉시 호출에 사용하며, 페이지를 새로고침하면 키는 사라집니다.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="gemini-api-key" className="block text-sm font-medium text-slate-700 mb-2">
            Gemini API 키
          </label>
          <input
            id="gemini-api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="AIza..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            autoComplete="off"
          />
          <p className="mt-2 text-xs text-slate-500">
            키는 클라이언트 번들에 포함되지 않으며, 이 세션 동안만 메모리에 유지됩니다.
          </p>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-slate-700 mb-2">사용할 모델</legend>
          <div className="space-y-3">
            {modelOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedModel === option.value ? 'border-sky-500 bg-sky-50/80' : 'border-slate-200 hover:border-sky-200'
                }`}
              >
                <input
                  type="radio"
                  name="gemini-model"
                  value={option.value}
                  checked={selectedModel === option.value}
                  onChange={() => setSelectedModel(option.value)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{option.label}</p>
                  <p className="text-xs text-slate-600 mt-1">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors"
        >
          저장하고 시작하기
        </button>
      </form>
    </div>
  );
};

export default ApiKeySetup;