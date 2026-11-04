'use client';

import { useState } from 'react';
import { ChevronDown, Save, Play, Loader2 } from 'lucide-react';
import { FormattingConfig } from '@/types/schema';

interface FormTabProps {
  config: FormattingConfig;
  onConfigChange: (config: FormattingConfig) => void;
  onFormat: () => void;
  isLoading: boolean;
}

const sections = [
  { id: 'pageSetup', label: 'Page & Layout Setup', icon: '📄' },
  { id: 'header', label: 'Header, Metadata & Instructions', icon: '🏫' },
  { id: 'typography', label: 'Typography & Bilingual Fonts', icon: '🔤' },
  { id: 'questionsAndMarks', label: 'Sections, Numbering & Marks', icon: '🔢' },
  { id: 'mcqAndTables', label: 'MCQs, Tables & Special Types', icon: '☑️' },
  { id: 'footer', label: 'Footer, Watermark & Finishing', icon: '🔖' },
];

export function FormTab({ config, onConfigChange, onFormat, isLoading }: FormTabProps) {
  const [openSections, setOpenSections] = useState<string[]>(['pageSetup', 'header']);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  const toggleSection = (id: string) => {
    setOpenSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const updateConfig = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = JSON.parse(JSON.stringify(config));
    let obj: any = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    onConfigChange(newConfig);
  };

  const handleSaveAsPreset = () => {
    if (!saveName.trim()) return;
    const preset = { ...config, presetName: saveName };
    const stored = localStorage.getItem('customPresets');
    const presets = stored ? JSON.parse(stored) : [];
    presets.push({ ...preset, id: `custom-${Date.now()}`, name: saveName, description: '', isDefault: false, createdAt: Date.now() });
    localStorage.setItem('customPresets', JSON.stringify(presets));
    setShowSaveModal(false);
    setSaveName('');
  };

  return (
    <div className="space-y-2">
      {sections.map(section => (
        <AccordionSection
          key={section.id}
          id={section.id}
          label={section.label}
          icon={section.icon}
          isOpen={openSections.includes(section.id)}
          onToggle={() => toggleSection(section.id)}
        >
          {renderSectionContent(section.id, config, updateConfig)}
        </AccordionSection>
      ))}

      <div className="flex items-center gap-2 pt-2 border-t border-office-gray-border">
        <button
          onClick={onFormat}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-office-blue text-white text-sm font-medium rounded-sm hover:bg-office-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isLoading ? 'Formatting...' : 'Format Document'}</span>
        </button>
        <button
          onClick={() => { setSaveName(''); setShowSaveModal(true); }}
          className="px-3 py-2 border border-office-gray-border text-sm text-office-gray rounded-sm hover:bg-office-gray-light transition-colors"
          title="Save current settings as preset"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h4 className="text-sm font-semibold mb-3">Save as Preset</h4>
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Preset Name"
              className="w-full px-2 py-1.5 text-sm border border-office-gray-border rounded-sm focus:outline-none focus:ring-1 focus:ring-office-blue mb-3"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveModal(false)} className="px-3 py-1.5 text-xs text-office-gray hover:bg-office-gray-light rounded-sm">Cancel</button>
              <button onClick={handleSaveAsPreset} className="px-3 py-1.5 text-xs bg-office-blue text-white rounded-sm hover:bg-office-blue-hover">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccordionSection({ id, label, icon, isOpen, onToggle, children }: { id: string; label: string; icon: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-office-gray-border rounded-md overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2.5 py-2 bg-office-gray-light hover:bg-office-gray-border transition-colors"
      >
        <span className="text-base">{icon}</span>
        <span className="flex-1 text-left text-xs font-medium text-office-black">{label}</span>
        <ChevronDown className={`w-4 h-4 text-office-gray transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        <div className="p-2.5 space-y-2">{children}</div>
      </div>
    </div>
  );
}

function renderSectionContent(id: string, config: FormattingConfig, update: (path: string, value: any) => void) {
  switch (id) {
    case 'pageSetup':
      return (
        <>
          <SelectField label="Paper Size" path="pageSetup.paperSize" value={config.pageSetup.paperSize} options={['A4', 'Legal', 'Letter']} onChange={update} />
          <SelectField label="Orientation" path="pageSetup.orientation" value={config.pageSetup.orientation} options={['Portrait', 'Landscape']} onChange={update} />
          <SelectField label="Columns" path="pageSetup.columns" value={config.pageSetup.columns} options={[1, 2]} onChange={update} />
          <div className="grid grid-cols-2 gap-2">
            {['top', 'bottom', 'left', 'right'].map(side => (
              <NumberField key={side} label={`Margin ${side.charAt(0).toUpperCase() + side.slice(1)} (pt)`} path={`pageSetup.margins.${side}`} value={config.pageSetup.margins[side as keyof typeof config.pageSetup.margins]} onChange={update} min={0} max={200} step={6} />
            ))}
          </div>
          <SelectField label="Page Border" path="pageSetup.pageBorder" value={config.pageSetup.pageBorder} options={['none', 'single', 'double']} onChange={update} />
        </>
      );
    case 'header':
      return (
        <>
          <CheckboxField label="Enable Header" path="header.enabled" checked={config.header.enabled} onChange={update} />
          <SelectField label="Header Style" path="header.style" value={config.header.style} options={['boxed', 'double-line', 'minimal']} onChange={update} />
          <TextField label="Institute Name" path="header.instituteName" value={config.header.instituteName} onChange={update} placeholder="School/Institute Name" />
          <TextField label="Subtitle / Address" path="header.instituteSubtitle" value={config.header.instituteSubtitle} onChange={update} placeholder="Address, City - PIN" />
          <TextField label="Exam Title" path="header.examTitle" value={config.header.examTitle} onChange={update} placeholder="HALF-YEARLY EXAMINATION 2026-27" />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Class" path="header.className" value={config.header.className} onChange={update} placeholder="Class X" />
            <TextField label="Subject" path="header.subject" value={config.header.subject} onChange={update} placeholder="MATHEMATICS" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Subject Code" path="header.subjectCode" value={config.header.subjectCode} onChange={update} placeholder="041" />
            <TextField label="Paper Set" path="header.paperSet" value={config.header.paperSet} onChange={update} placeholder="Set-A" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Time Allowed" path="header.timeAllowed" value={config.header.timeAllowed} onChange={update} placeholder="3 Hours" />
            <TextField label="Max Marks" path="header.maxMarks" value={config.header.maxMarks} onChange={update} placeholder="80" />
          </div>
          <CheckboxField label="Show Roll No. Boxes" path="header.showRollNoBoxes" checked={config.header.showRollNoBoxes} onChange={update} />
          <NumberField label="Roll No. Box Count" path="header.rollNoBoxCount" value={config.header.rollNoBoxCount} onChange={update} min={0} max={20} />
          <div className="pt-1">
            <label className="text-xs font-medium text-office-gray block mb-1">General Instructions (one per line)</label>
            <textarea
              value={config.header.generalInstructions.join('\n')}
              onChange={e => update('header.generalInstructions', e.target.value.split('\n').filter(l => l.trim()))}
              rows={4}
              className="w-full px-2 py-1.5 text-xs border border-office-gray-border rounded-sm focus:outline-none focus:ring-1 focus:ring-office-blue"
              placeholder="1. All questions are compulsory&#10;2. Marks indicated against each question"
            />
          </div>
        </>
      );
    case 'typography':
      return (
        <>
          <TextField label="Primary Font (English)" path="typography.primaryFont" value={config.typography.primaryFont} onChange={update} placeholder="Times New Roman" />
          <TextField label="Secondary Font (Regional)" path="typography.secondaryFont" value={config.typography.secondaryFont} onChange={update} placeholder="Nirmala UI" />
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Title Size (pt)" path="typography.titleSize" value={config.typography.titleSize} onChange={update} min={8} max={24} step={0.5} />
            <NumberField label="Sub-header Size" path="typography.subHeaderSize" value={config.typography.subHeaderSize} onChange={update} min={8} max={18} step={0.5} />
            <NumberField label="Section Title Size" path="typography.sectionTitleSize" value={config.typography.sectionTitleSize} onChange={update} min={8} max={18} step={0.5} />
            <NumberField label="Question Text Size" path="typography.questionSize" value={config.typography.questionSize} onChange={update} min={8} max={16} step={0.5} />
            <NumberField label="Option Size" path="typography.optionSize" value={config.typography.optionSize} onChange={update} min={8} max={14} step={0.5} />
          </div>
          <NumberField label="Line Spacing" path="typography.lineSpacing" value={config.typography.lineSpacing} onChange={update} min={1} max={2} step={0.05} />
          <NumberField label="Gap After Question (pt)" path="typography.questionGapAfter" value={config.typography.questionGapAfter} onChange={update} min={0} max={12} step={1} />
        </>
      );
    case 'questionsAndMarks':
      return (
        <>
          <SelectField label="Section Header Style" path="questionsAndMarks.sectionStyle" value={config.questionsAndMarks.sectionStyle} options={['centered-underline', 'shaded-bar', 'boxed']} onChange={update} optionLabels={{ 'centered-underline': 'Centered + Underline', 'shaded-bar': 'Shaded Bar', 'boxed': 'Boxed' }} />
          <SelectField label="Question Numbering" path="questionsAndMarks.questionNumberPrefix" value={config.questionsAndMarks.questionNumberPrefix} options={['1.', 'Q1.', '1)']} onChange={update} />
          <SelectField label="Sub-question Style" path="questionsAndMarks.subQuestionStyle" value={config.questionsAndMarks.subQuestionStyle} options={['(i)', '(a)']} onChange={update} />
          <SelectField label="Marks Format" path="questionsAndMarks.marksFormat" value={config.questionsAndMarks.marksFormat} options={['[X]', '(X)', 'X Marks']} onChange={update} />
          <SelectField label="Tab Leader" path="questionsAndMarks.marksLeader" value={config.questionsAndMarks.marksLeader} options={['none', 'dots']} onChange={update} />
          <CheckboxField label="Center 'OR' Choice" path="questionsAndMarks.centerChoiceOr" checked={config.questionsAndMarks.centerChoiceOr} onChange={update} />
        </>
      );
    case 'mcqAndTables':
      return (
        <>
          <SelectField label="MCQ Layout" path="mcqAndTables.mcqLayout" value={config.mcqAndTables.mcqLayout} options={['auto', '1-line', '2x2-grid', '4-lines']} onChange={update} optionLabels={{ 'auto': 'Smart Auto-Fit', '1-line': '1 Line (4 Col)', '2x2-grid': '2×2 Grid', '4-lines': '4 Vertical' }} />
          <SelectField label="Option Labels" path="mcqAndTables.optionLabelStyle" value={config.mcqAndTables.optionLabelStyle} options={['(a)', '(A)', '(i)', '(ক)']} onChange={update} />
          <CheckboxField label="Preserve Equations & Images" path="mcqAndTables.preserveEquationsAndImages" checked={config.mcqAndTables.preserveEquationsAndImages} onChange={update} />
        </>
      );
    case 'footer':
      return (
        <>
          <SelectField label="Page Numbers" path="footer.pageNumberStyle" value={config.footer.pageNumberStyle} options={['page-x-of-y', 'center-dash', 'none']} onChange={update} optionLabels={{ 'page-x-of-y': 'Page X of Y', 'center-dash': '- 1 -', 'none': 'None' }} />
          <CheckboxField label="Show P.T.O." path="footer.showPTO" checked={config.footer.showPTO} onChange={update} />
          <TextField label="End Marker Text" path="footer.endMarkerText" value={config.footer.endMarkerText} onChange={update} placeholder="*** END OF QUESTION PAPER ***" />
          <TextField label="Watermark Text" path="footer.watermarkText" value={config.footer.watermarkText} onChange={update} placeholder="CONFIDENTIAL" />
        </>
      );
    default:
      return null;
  }
}

function SelectField({ label, path, value, options, onChange, optionLabels }: { label: string; path: string; value: any; options: any[]; onChange: (path: string, value: any) => void; optionLabels?: Record<string, string> }) {
  return (
    <div>
      <label className="text-xs font-medium text-office-gray block mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(path, e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-office-gray-border rounded-sm focus:outline-none focus:ring-1 focus:ring-office-blue bg-white"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{optionLabels?.[opt] || opt}</option>
        ))}
      </select>
    </div>
  );
}

function TextField({ label, path, value, onChange, placeholder }: { label: string; path: string; value: string; onChange: (path: string, value: any) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-office-gray block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(path, e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 text-xs border border-office-gray-border rounded-sm focus:outline-none focus:ring-1 focus:ring-office-blue"
      />
    </div>
  );
}

function NumberField({ label, path, value, onChange, min, max, step = 1 }: { label: string; path: string; value: number; onChange: (path: string, value: any) => void; min: number; max: number; step?: number }) {
  return (
    <div>
      <label className="text-xs font-medium text-office-gray block mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(path, parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-full px-2 py-1.5 text-xs border border-office-gray-border rounded-sm focus:outline-none focus:ring-1 focus:ring-office-blue"
      />
    </div>
  );
}

function CheckboxField({ label, path, checked, onChange }: { label: string; path: string; checked: boolean; onChange: (path: string, value: any) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(path, e.target.checked)}
        className="w-3.5 h-3.5 text-office-blue border-office-gray-border rounded focus:ring-office-blue"
      />
      <span className="text-xs text-office-black">{label}</span>
    </label>
  );
}