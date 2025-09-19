import React, { useState, useEffect, useCallback } from 'react';
import { AppState, GeminiModel } from './types';
import FileUpload from './components/FileUpload';
import ProcessingView from './components/ProcessingView';
import SearchView from './components/SearchView';
import ErrorView from './components/ErrorView';
import Footer from './components/Footer';
import ApiKeySetup from './components/ApiKeySetup';

declare const pdfjsLib: any;

if (typeof window !== 'undefined' && 'pdfjsLib' in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
}

const chunkText = (text: string, chunkSize: number = 2000, overlap: number = 200): string[] => {
  const chunks: string[] = [];
  if (!text) return chunks;

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 10);

  for (const paragraph of paragraphs) {
    if (paragraph.length <= chunkSize) {
      chunks.push(paragraph.trim());
    } else {
      let startIndex = 0;
      while (startIndex < paragraph.length) {
        const endIndex = Math.min(startIndex + chunkSize, paragraph.length);
        const chunk = paragraph.substring(startIndex, endIndex).trim();
        if (chunk) chunks.push(chunk);
        startIndex += (chunkSize - overlap);
        if (startIndex >= paragraph.length) break;
      }
    }
  }
  return chunks.filter(c => c.length > 0);
};

const processSinglePdf = (pdfFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(pdfFile);
        fileReader.onload = async (e) => {
            try {
                if (!e.target?.result) {
                    throw new Error("파일을 읽는 데 실패했습니다.");
                }
                const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.0 });
                    const textContent = await page.getTextContent();
                    
                    const pageHeight = viewport.height;
                    const filteredItems = textContent.items.filter((item:any) => {
                        const y = item.transform[5];
                        return y > pageHeight * 0.08 && y < pageHeight * 0.92;
                    });

                    const items = filteredItems.sort((a: any, b: any) => {
                        if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
                            return b.transform[5] - a.transform[5];
                        }
                        return a.transform[4] - b.transform[4];
                    });
                    
                    let pageText = '';
                    for (let j = 0; j < items.length; j++) {
                        const item = items[j];
                        if (j > 0) {
                            const prevItem = items[j - 1];
                            const yDiff = Math.abs(item.transform[5] - prevItem.transform[5]);
                            if (yDiff > (item.height * 1.5)) {
                                pageText += '\n\n';
                            } else if (yDiff > 2) {
                                pageText += '\n';
                            } else {
                                const xDiff = item.transform[4] - (prevItem.transform[4] + prevItem.width);
                                if (xDiff > 1) {
                                    pageText += ' ';
                                }
                            }
                        }
                        pageText += item.str;
                    }
                    fullText += pageText + '\n\n';
                }
                resolve(fullText.replace(/\n{3,}/g, '\n\n'));
            } catch (err) {
                reject(err);
            }
        };
        fileReader.onerror = () => {
            reject(new Error('업로드된 파일을 읽는 데 실패했습니다.'));
        }
    });
};

const defaultModel: GeminiModel = 'gemini-2.5-flash';

const readEnvValue = (key: string): string | null => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const value = (import.meta.env as Record<string, string | undefined>)[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
  } catch (error) {
    // import.meta.env is only available in the browser build; ignore reference errors during SSR.
  }

  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
};

const getEnvironmentApiKey = (): string | null => {
  const possibleKeys = [
    'VITE_GEMINI_FLASH_API_KEY',
    'VITE_GEMINI_FLASH_KEY',
    'GEMINI_FLASH_API_KEY',
    'GEMINI_API_KEY',
    'API_KEY',
  ];

  for (const key of possibleKeys) {
    const value = readEnvValue(key);
    if (value) {
      return value;
    }
  }

  return null;
};

const fallbackApiKey = getEnvironmentApiKey();

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [chunks, setChunks] = useState<string[]>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [model, setModel] = useState<GeminiModel>(defaultModel);
  const [isApiKeySetupVisible, setIsApiKeySetupVisible] = useState<boolean>(() => !fallbackApiKey);

  const resetWorkflows = () => {
    setFiles([]);
    setChunks([]);
    setProcessingError(null);
    setAppState('idle');
  };

  const handleApiSetup = (key: string) => {
    setApiKey(key);
    setModel('gemini-2.5-pro');
    resetWorkflows();
    setIsApiKeySetupVisible(false);
  };

  const handleSkipApiSetup = () => {
    setApiKey(null);
    setModel(defaultModel);
    resetWorkflows();
    setIsApiKeySetupVisible(false);
  };

  const handleRequestApiKeySetup = () => {
    setIsApiKeySetupVisible(true);
  };

  const handleCancelApiSetup = () => {
    if (!fallbackApiKey && !apiKey) {
      return;
    }
    setIsApiKeySetupVisible(false);
  };

  const handleModelChange = (nextModel: GeminiModel) => {
    if (!apiKey && nextModel !== defaultModel) {
      return;
    }
    setModel(nextModel);
  };

  const handleApiKeyInvalid = useCallback(() => {
    setApiKey(null);
    setModel(defaultModel);
    setIsApiKeySetupVisible(true);
  }, []);

  const processAllPdfs = useCallback(async (pdfFiles: File[]) => {
    try {
      const allTexts = await Promise.all(pdfFiles.map(file => processSinglePdf(file)));
      
      const allChunks = allTexts.flatMap((text, index) => {
        const fileChunks = chunkText(text);
        if (fileChunks.length === 0) {
            throw new Error(`'${pdfFiles[index].name}' 파일에서 텍스트를 추출할 수 없습니다. 문서가 비어있거나 이미지 기반일 수 있습니다.`);
        }
        // Add a header to the first chunk of each document
        fileChunks[0] = `--- START OF ${pdfFiles[index].name} ---\n${fileChunks[0]}`;
        return fileChunks;
      });

      if (allChunks.length === 0) {
        throw new Error("모든 PDF에서 텍스트를 추출할 수 없습니다.");
      }

      setChunks(allChunks);
      setAppState('ready');
    } catch (err: any) {
      setProcessingError(err.message || 'PDF 문서 처리 중 오류가 발생했습니다.');
      setAppState('error');
    }
  }, []);

  useEffect(() => {
    if (files.length > 0 && appState === 'processing') {
      processAllPdfs(files);
    }
  }, [files, appState, processAllPdfs]);
  
  const handleFilesSelect = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setAppState('processing');
    setProcessingError(null);
  };
  
  const handleSetError = (error: string) => {
      setProcessingError(error);
      setAppState('error');
  };

  const handleReset = () => {
    setFiles([]);
    setChunks([]);
    setProcessingError(null);
    setAppState('idle');
  };
  
  const effectiveApiKey = apiKey ?? fallbackApiKey;
  const shouldForceApiSetup = !effectiveApiKey;
  const shouldShowApiKeySetup = shouldForceApiSetup || isApiKeySetupVisible;

  const renderContent = () => {
    if (shouldShowApiKeySetup) {
      return (
        <ApiKeySetup
          onSubmit={handleApiSetup}
          allowSkip={Boolean(fallbackApiKey)}
          onSkip={fallbackApiKey ? handleSkipApiSetup : undefined}
          onCancel={isApiKeySetupVisible ? handleCancelApiSetup : undefined}
        />
      );
    }

    switch (appState) {
      case 'processing':
        return <ProcessingView fileName={`${files.length}개의 문서를`} />;
      case 'ready':
        return (
          <SearchView
            fileNames={files.map(f => f.name)}
            chunks={chunks}
            onReset={handleReset}
            apiKey={effectiveApiKey}
            model={model}
            onChangeModel={handleModelChange}
            onRequestApiKeySetup={handleRequestApiKeySetup}
            isUsingUserApiKey={Boolean(apiKey)}
            onApiKeyInvalid={handleApiKeyInvalid}
          />
        );
      case 'error':
        return <ErrorView error={processingError || '알 수 없는 오류가 발생했습니다.'} onReset={handleReset} />;
      case 'idle':
      default:
        return (
          <FileUpload
            onFilesSelect={handleFilesSelect}
            setProcessingError={handleSetError}
            onRequestApiKeySetup={handleRequestApiKeySetup}
            isUsingUserApiKey={Boolean(apiKey)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-200">
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </div>
      <Footer />
    </div>
  );
};

export default App;