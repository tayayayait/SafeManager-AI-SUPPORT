import React, { useCallback, useState, useMemo } from 'react';
import { UploadCloudIcon, SparklesIcon, DocumentTextIcon, CheckIcon } from './icons';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  setProcessingError: (error: string) => void;
  onRequestApiKeySetup?: () => void;
  isUsingUserApiKey?: boolean;
}

const LAW_FILES = [
    { name: '산업안전보건법 시행규칙', id: 'enforcement-rule' },
    { name: '산업안전보건기준에 관한 규칙', id: 'standards-rule' },
];

const FileInput: React.FC<{
    file: File | null;
    onFileChange: (file: File) => void;
    setProcessingError: (error: string) => void;
    title: string;
    id: string;
}> = ({ file, onFileChange, setProcessingError, title, id }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (selectedFile: File | undefined) => {
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                setProcessingError(`'${title}' 파일 형식이 잘못되었습니다. PDF 파일을 업로드해주세요.`);
                return;
            }
            if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
                setProcessingError(`'${title}' 파일 크기가 50MB를 초과합니다.`);
                return;
            }
            onFileChange(selectedFile);
        }
    };

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files?.[0]);
    }, [onFileChange, setProcessingError, title]);

    return (
        <label
            htmlFor={`pdf-upload-${id}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ease-in-out group ${isDragging ? 'border-sky-500 bg-sky-50/50' : 'border-slate-300 bg-white hover:border-sky-400'}`}
        >
            {file ? (
                <div className="text-center p-4">
                    <CheckIcon className="w-10 h-10 mb-2 text-green-500 mx-auto"/>
                    <p className="font-semibold text-sm text-slate-800">{title}</p>
                    <p className="text-xs text-slate-500 truncate max-w-full">{file.name}</p>
                </div>
            ) : (
                <>
                    <UploadCloudIcon className="w-8 h-8 mb-2 text-slate-400 group-hover:text-sky-500 transition-colors"/>
                    <p className="text-sm font-semibold text-slate-600">{title}</p>
                    <p className="text-xs text-slate-500">클릭 또는 드래그하여 업로드</p>
                </>
            )}
            <input id={`pdf-upload-${id}`} type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileSelect(e.target.files?.[0])} />
        </label>
    );
};


const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, setProcessingError, onRequestApiKeySetup, isUsingUserApiKey = false }) => {
  const [files, setFiles] = useState<(File | null)[]>(Array(LAW_FILES.length).fill(null));

  const handleFileChange = (file: File, index: number) => {
    const newFiles = [...files];
    newFiles[index] = file;
    setFiles(newFiles);
  };
  
  const allFilesUploaded = useMemo(() => files.every(f => f !== null), [files]);

  const handleStartAnalysis = () => {
    if(allFilesUploaded) {
        onFilesSelect(files.filter(f => f !== null) as File[]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-6">
            <SparklesIcon className="w-12 h-12 text-sky-500"/>
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
            안전관리자 AI SUPPORT
        </h1>
        <p className="text-slate-600 text-center mt-4 mb-10 text-lg max-w-xl mx-auto">
            AI 기반 규정 준수 도우미. Made by 타야야야잇
        </p>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/80 border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
          <span className="text-sm text-slate-700">
            현재 모델: <strong>{isUsingUserApiKey ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}</strong>
          </span>
          {onRequestApiKeySetup && (
            <button
              onClick={onRequestApiKeySetup}
              className="px-4 py-2 text-sm font-semibold text-sky-700 bg-sky-100 rounded-lg hover:bg-sky-200 transition-colors"
            >
              {isUsingUserApiKey ? 'API 키 변경' : 'API 키 입력하고 업그레이드'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/80 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-200/50">
          <h2 className="text-lg font-semibold text-center text-slate-800 mb-2">2대 핵심 법령 업로드</h2>
          <p className="text-center text-sm text-slate-500 mb-6">정확한 분석을 위해 아래 2가지 법령 PDF 파일을 모두 업로드해주세요.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {LAW_FILES.map((law, index) => (
                  <FileInput
                      key={law.id}
                      id={law.id}
                      title={law.name}
                      file={files[index]}
                      onFileChange={(file) => handleFileChange(file, index)}
                      setProcessingError={setProcessingError}
                  />
              ))}
          </div>
          <button 
            onClick={handleStartAnalysis}
            disabled={!allFilesUploaded}
            className="w-full px-6 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            분석 시작하기
          </button>
      </div>

       <p className="text-center mt-8 text-slate-500 text-sm max-w-md mx-auto">
       국가법령정보센터에서 최신 법령 PDF를 다운로드하여 업로드하시면 가장 정확한 분석 결과를 얻을 수 있습니다.
      </p>
    </div>
  );
};

export default FileUpload;