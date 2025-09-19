import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

interface ApiKeySetupProps {
  onSubmit: (apiKey: string) => void;
  allowSkip?: boolean;
  onSkip?: () => void;
  onCancel?: () => void;
  noticeMessage?: string;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSubmit, allowSkip = false, onSkip, onCancel, noticeMessage }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setError('Gemini API 키를 입력해주세요.');
      return;
    }

    setError(null);
    setIsValidating(true);

    try {
      const client = new GoogleGenAI({ apiKey: trimmedKey });
      await client.models.list({ pageSize: 1 });

      onSubmit(trimmedKey);
      setApiKey('');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'API 키를 확인하는 중 알 수 없는 오류가 발생했습니다.';
      setError(`API 키 확인에 실패했습니다: ${message}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-6 border border-slate-200">
      {noticeMessage && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {noticeMessage}
        </div>
      )}
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Gemini API 설정</h1>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        앱은 API 키를 저장하지 않습니다. 사용자가 직접 입력한 키만 즉시 호출에 사용하며, 페이지를 새로고침하면 키는
        사라집니다. 키를 입력하면 <strong>Gemini 2.5 Pro</strong> 모델이 활성화됩니다.
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isValidating}
            className="w-full py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? '검증 중...' : 'Pro 모델로 계속하기'}
          </button>
          {allowSkip && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="w-full py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Flash 모델로 계속 사용하기
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ApiKeySetup;
