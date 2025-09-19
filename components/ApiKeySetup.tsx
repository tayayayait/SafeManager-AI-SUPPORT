import React, { useEffect, useRef, useState } from 'react';
import { GeminiModel } from '../types';

interface ApiKeySetupProps {
  onSubmit: (apiKey: string, model: GeminiModel) => void;
  initialModel?: GeminiModel;
  defaultFlashApiKey?: string;
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

const verifyApiKey = async (apiKey: string) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const message = error?.error?.message ?? 'API 키 확인에 실패했습니다. 다시 시도해주세요.';
    throw new Error(message);
  }
};

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({
  onSubmit,
  initialModel = 'gemini-2.5-flash',
  defaultFlashApiKey = ''
}) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(initialModel);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const hasHandledInitialFlash = useRef(false);

  useEffect(() => {
    if (hasHandledInitialFlash.current) {
      return;
    }

    if (initialModel !== 'gemini-2.5-flash') {
      hasHandledInitialFlash.current = true;
      return;
    }

    hasHandledInitialFlash.current = true;

    if (!defaultFlashApiKey) {
      setError(
        '기본 Flash API 키가 설정되어 있지 않습니다. .env.local 파일에서 GEMINI_API_KEY를 설정해주세요.'
      );
      return;
    }

    onSubmit(defaultFlashApiKey, 'gemini-2.5-flash');
  }, [defaultFlashApiKey, initialModel, onSubmit]);

  const handleModelSelect = (model: GeminiModel) => {
    setSelectedModel(model);
    setApiKey('');
    setError(null);

    if (model === 'gemini-2.5-flash') {
      if (!defaultFlashApiKey) {
        setError('기본 Flash API 키가 설정되어 있지 않습니다. .env.local 파일에서 GEMINI_API_KEY를 설정해주세요.');
        return;
      }

      onSubmit(defaultFlashApiKey, model);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedModel !== 'gemini-2.5-pro') {
      return;
    }

    if (!apiKey.trim()) {
      setError('Gemini API 키를 입력해주세요.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await verifyApiKey(apiKey.trim());
      onSubmit(apiKey.trim(), selectedModel);
      setApiKey('');
    } catch (verificationError) {
      const message =
        verificationError instanceof Error
          ? verificationError.message
          : 'API 키 확인에 실패했습니다. 다시 시도해주세요.';
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-6 border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Gemini API 설정</h1>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        앱은 API 키를 저장하지 않습니다. Microsoft Store 보안 정책을 준수하기 위해 사용자가 직접 입력한 키만 즉시 호출에 사용하며, 페이지를 새로고침하면 키는 사라집니다.
      </p>

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
                onChange={() => handleModelSelect(option.value)}
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

      {selectedModel === 'gemini-2.5-pro' && (
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isVerifying}
          >
            {isVerifying ? 'API 키 확인 중...' : 'API 키 확인 후 계속'}
          </button>
        </form>
      )}

      {selectedModel === 'gemini-2.5-flash' && error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default ApiKeySetup;
