export interface FormattingConfig {
  presetName?: string;
  pageSetup: {
    paperSize: 'A4' | 'Legal' | 'Letter';
    orientation: 'Portrait' | 'Landscape';
    columns: 1 | 2;
    margins: { top: number; bottom: number; left: number; right: number };
    pageBorder: 'none' | 'single' | 'double';
  };
  header: {
    enabled: boolean;
    style: 'boxed' | 'double-line' | 'minimal';
    instituteName: string;
    instituteSubtitle: string;
    examTitle: string;
    className: string;
    subject: string;
    subjectCode: string;
    paperSet: string;
    timeAllowed: string;
    maxMarks: string;
    showRollNoBoxes: boolean;
    rollNoBoxCount: number;
    generalInstructions: string[];
  };
  typography: {
    primaryFont: string;
    secondaryFont: string;
    titleSize: number;
    subHeaderSize: number;
    sectionTitleSize: number;
    questionSize: number;
    optionSize: number;
    lineSpacing: number;
    questionGapAfter: number;
  };
  questionsAndMarks: {
    sectionStyle: 'centered-underline' | 'shaded-bar' | 'boxed';
    questionNumberPrefix: '1.' | 'Q1.' | '1)';
    subQuestionStyle: '(i)' | '(a)';
    marksFormat: '[X]' | '(X)' | 'X Marks' | 'none';
    marksLeader: 'none' | 'dots';
    centerChoiceOr: boolean;
  };
  mcqAndTables: {
    mcqLayout: 'auto' | '1-line' | '2x2-grid' | '4-lines';
    optionLabelStyle: '(a)' | '(A)' | '(i)' | '(ক)';
    preserveEquationsAndImages: boolean;
  };
  footer: {
    pageNumberStyle: 'page-x-of-y' | 'center-dash' | 'none';
    showPTO: boolean;
    endMarkerText: string;
    watermarkText: string;
  };
}

export interface ParsedQuestion {
  id: string;
  qNo: string;
  type: 'standard' | 'mcq' | 'match' | 'assertion-reason' | 'case-study';
  text: string;
  marks?: string;
  options?: string[];
  subQuestions?: { label: string; text: string; marks?: string }[];
  matchColumns?: { colAHeader: string; colBHeader: string; rows: [string, string][] };
  hasInternalChoiceAfter?: boolean;
  choiceAlternative?: { text: string; marks?: string; options?: string[] };
}

export interface ParsedSection {
  title: string;
  instructions?: string;
  sectionMarksSummary?: string;
  questions: ParsedQuestion[];
}

export interface ParsedDocument {
  sections: ParsedSection[];
  metadata?: {
    instituteName?: string;
    examTitle?: string;
    className?: string;
    subject?: string;
    timeAllowed?: string;
    maxMarks?: string;
  };
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  config: FormattingConfig;
  isDefault: boolean;
  createdAt: number;
}

export interface InstituteProfile {
  id: string;
  name: string;
  subtitle: string;
  logoBase64?: string;
  logoAlignment: 'left' | 'center' | 'top-both';
}

export type ScopeMode = 'full' | 'selection';

export interface SampleExtractionResult {
  config: Partial<FormattingConfig>;
  confidence: number;
  source: 'docx' | 'pdf' | 'image';
}