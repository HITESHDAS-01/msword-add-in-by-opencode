'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, Image, Send, Zap, Table, Eraser, AlignRight, Hash, Grid, RefreshCw } from 'lucide-react';
import { FormattingConfig } from '@/types/schema';
import { AIProviderSettings } from '@/components/AIProviderSettings';
import { getProviderConfig } from '@/lib/aiProvider';

interface PromptTabProps {
  config: FormattingConfig;
  onConfigChange: (config: FormattingConfig) => void;
  onPromptAction: (instruction: string, quickAction?: string) => void;
  onSampleApply: (config: Partial<FormattingConfig>) => void;
  isLoading: boolean;
}

interface SampleDropzoneProps {
  sampleFile: File | null;
  samplePreview: string | null;
  extractedConfig: Partial<FormattingConfig> | null;
  showExtracted: boolean;
  onFileSelect: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onExtract: () => void;
  onApply: () => void;
  onSaveAsPreset: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isLoading: boolean;
  onClear: () => void;
}

const quickActions = [
  { id: 'clean', label: 'Clean Spaces', icon: Eraser, desc: 'Remove extra spaces & lines' },
  { id: 'alignMarks', label: 'Align Marks', icon: AlignRight, desc: 'Right-align all marks' },
  { id: 'fixNumbering', label: 'Fix Numbering', icon: Hash, desc: 'Fix question sequence' },
  { id: 'mcqGrid', label: 'MCQ Grid', icon: Grid, desc: 'Convert to 2×2 grid' },
  { id: 'matchTable', label: 'Match Table', icon: Table, desc: 'Convert to match table' },
];

function SampleDropzone({
  sampleFile,
  samplePreview,
  extractedConfig,
  showExtracted,
  onFileSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  onExtract,
  onApply,
  onSaveAsPreset,
  fileInputRef,
  isLoading,
  onClear,
}: SampleDropzoneProps) {
  const getFileIcon = (file: File) => {
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return <FileText className="w-5 h-5 text-blue-500" />;
    if (file.type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5 text-green-500" />;
    return <FileText className="w-5 h-5 text-office-gray" />;
  };

  return (
    <div className="border-2 border-dashed border-office-gray-border rounded-md p-3 space-y-2 transition-colors">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-office-gray cursor-pointer">
          <Upload className="w-3.5 h-3.5 inline-block mr-1" />
          Upload Sample (.docx, .pdf, .png/.jpg)
          <input ref={fileInputRef} type="file" accept=".docx,.pdf,.png,.jpg,.jpeg" onChange={e => e.target.files?.[0] && onFileSelect(e.target.files[0])} className="sr-only" />
        </label>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className="border-2 border-dashed border-office-gray-border rounded-sm p-4 text-center transition-colors"
      >
        {sampleFile ? (
          <div className="flex items-center gap-3 p-2 bg-white rounded-sm border border-office-gray-border">
            {getFileIcon(sampleFile)}
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-medium text-office-black truncate">{sampleFile.name}</p>
              <p className="text-[11px] text-office-gray">{(sampleFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={onClear} className="text-office-gray hover:text-red-500">✕</button>
          </div>
        ) : (
          <div className="text-office-gray">
            <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Drag & drop or click to browse</p>
          </div>
        )}
      </div>

      {sampleFile && (
        <div className="flex items-center gap-2">
          <button
            onClick={onExtract}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-office-blue text-white text-xs font-medium rounded-sm hover:bg-office-blue-hover disabled:opacity-50 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Extract Style</span>
          </button>
        </div>
      )}

      {showExtracted && extractedConfig && (
        <div className="p-2 bg-office-blue-light border border-office-blue rounded-sm space-y-2 animate-fadeIn">
          <p className="text-xs font-medium text-office-blue">Style Extracted Successfully!</p>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <span className="text-office-gray">Paper:</span> <span className="text-office-black">{extractedConfig.pageSetup?.paperSize}</span>
            <span className="text-office-gray">Orientation:</span> <span className="text-office-black">{extractedConfig.pageSetup?.orientation}</span>
            <span className="text-office-gray">Primary Font:</span> <span className="text-office-black">{extractedConfig.typography?.primaryFont}</span>
            <span className="text-office-gray">Secondary Font:</span> <span className="text-office-black">{extractedConfig.typography?.secondaryFont}</span>
            <span className="text-office-gray">MCQ Layout:</span> <span className="text-office-black">{extractedConfig.mcqAndTables?.mcqLayout}</span>
            <span className="text-office-gray">Marks Format:</span> <span className="text-office-black">{extractedConfig.questionsAndMarks?.marksFormat}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onApply} className="flex-1 px-2 py-1.5 bg-office-blue text-white text-xs rounded-sm hover:bg-office-blue-hover">Apply to Form</button>
            <button onClick={onSaveAsPreset} className="flex-1 px-2 py-1.5 border border-office-blue text-office-blue text-xs rounded-sm hover:bg-office-blue-light">Save as Preset</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PromptTab({ config, onConfigChange, onPromptAction, onSampleApply, isLoading }: PromptTabProps) {
  const [prompt, setPrompt] = useState('');
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [samplePreview, setSamplePreview] = useState<string | null>(null);
  const [extractedConfig, setExtractedConfig] = useState<Partial<FormattingConfig> | null>(null);
  const [showExtracted, setShowExtracted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSampleFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setSamplePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setSamplePreview(file.name);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('dropzone-active');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('dropzone-active');
  }, []);

  const extractStyle = async () => {
    if (!sampleFile) return;
    const formData = new FormData();
    formData.append('file', sampleFile);
    try {
      const res = await fetch('/api/extract-sample', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setExtractedConfig(data.data.config);
        setShowExtracted(true);
      } else {
        alert(data.error || 'Extraction failed');
      }
    } catch (error) {
      alert('Failed to extract style');
    }
  };

  const applySampleStyle = () => {
    if (extractedConfig) {
      onSampleApply(extractedConfig);
    }
  };

  const saveAsPreset = () => {
    if (extractedConfig) {
      const preset = { ...config, ...extractedConfig };
      const stored = localStorage.getItem('customPresets');
      const presets = stored ? JSON.parse(stored) : [];
      presets.push({ ...preset, id: `custom-${Date.now()}`, name: 'Extracted Style', description: `From ${sampleFile?.name}`, isDefault: false, createdAt: Date.now() });
      localStorage.setItem('customPresets', JSON.stringify(presets));
      alert('Saved as preset!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onPromptAction(prompt);
    setPrompt('');
  };

  const handleQuickAction = (actionId: string) => {
    onPromptAction('', actionId);
  };

  return (
    <div className="space-y-3">
      <AIProviderSettings />
      <SampleDropzone
        sampleFile={sampleFile}
        samplePreview={samplePreview}
        extractedConfig={extractedConfig}
        showExtracted={showExtracted}
        onFileSelect={handleFileSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onExtract={extractStyle}
        onApply={applySampleStyle}
        onSaveAsPreset={saveAsPreset}
        fileInputRef={fileInputRef}
        isLoading={isLoading}
        onClear={() => { setSampleFile(null); setSamplePreview(null); }}
      />

      <div className="border border-office-gray-border rounded-md bg-white p-2.5 space-y-2">
        <label className="text-xs font-medium text-office-black">Natural Language Command</label>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={'e.g., "Convert selected questions to 2x2 MCQ grid and align marks [2] right"'}
            rows={2}
            className="w-full px-2 py-1.5 text-xs border border-office-gray-border rounded-sm focus:outline-none focus:ring-1 focus:ring-office-blue resize-none"
            disabled={isLoading}
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-office-blue text-white text-xs font-medium rounded-sm hover:bg-office-blue-hover disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
            <div className="flex-1 flex flex-wrap gap-1">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action.id)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] border border-office-gray-border rounded-sm hover:bg-office-gray-light transition-colors disabled:opacity-50"
                  title={action.desc}
                >
                  <action.icon className="w-3 h-3" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className="text-[11px] text-office-gray space-y-1 p-2 bg-office-gray-light rounded-md">
        <p className="font-medium text-office-black">Tips:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Select text in Word first, then choose "Selection" scope above</li>
          <li>Reference specific questions: "Q3-Q5 make MCQ grid"</li>
          <li>Use quick chips for common one-click fixes</li>
          <li>Upload a sample paper to clone its exact style</li>
        </ul>
      </div>
    </div>
  );
}