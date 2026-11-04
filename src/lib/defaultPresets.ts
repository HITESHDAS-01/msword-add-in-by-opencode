import { FormattingConfig } from '@/types/schema';

const baseConfig: FormattingConfig = {
  pageSetup: {
    paperSize: 'A4',
    orientation: 'Portrait',
    columns: 1,
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    pageBorder: 'none',
  },
  header: {
    enabled: true,
    style: 'boxed',
    instituteName: 'YOUR SCHOOL NAME',
    instituteSubtitle: 'Address Line 1, City - PIN',
    examTitle: 'HALF-YEARLY EXAMINATION, 2026–27',
    className: 'Class X',
    subject: 'MATHEMATICS',
    subjectCode: '041',
    paperSet: 'Set-A',
    timeAllowed: '3 Hours',
    maxMarks: '80',
    showRollNoBoxes: true,
    rollNoBoxCount: 5,
    generalInstructions: [
      'All questions are compulsory.',
      'Section A: Q1-Q10 carry 1 mark each.',
      'Section B: Q11-Q20 carry 2 marks each.',
      'Section C: Q21-Q30 carry 3 marks each.',
      'Section D: Q31-Q35 carry 5 marks each.',
    ],
  },
  typography: {
    primaryFont: 'Times New Roman',
    secondaryFont: 'Nirmala UI',
    titleSize: 16,
    subHeaderSize: 12,
    sectionTitleSize: 12,
    questionSize: 11.5,
    optionSize: 11,
    lineSpacing: 1.15,
    questionGapAfter: 4,
  },
  questionsAndMarks: {
    sectionStyle: 'centered-underline',
    questionNumberPrefix: '1.',
    subQuestionStyle: '(i)',
    marksFormat: '[X]',
    marksLeader: 'dots',
    centerChoiceOr: true,
  },
  mcqAndTables: {
    mcqLayout: 'auto',
    optionLabelStyle: '(a)',
    preserveEquationsAndImages: true,
  },
  footer: {
    pageNumberStyle: 'page-x-of-y',
    showPTO: true,
    endMarkerText: '*** END OF QUESTION PAPER ***',
    watermarkText: '',
  },
};

export const defaultPresets: Omit<FormattingConfig, 'presetName'>[] = [
  {
    ...baseConfig,
    pageSetup: { ...baseConfig.pageSetup, margins: { top: 54, bottom: 54, left: 54, right: 54 } },
    header: {
      ...baseConfig.header,
      examTitle: 'UNIT TEST / PERIODIC TEST',
      maxMarks: '40',
      timeAllowed: '1.5 Hours',
      generalInstructions: [
        'All questions are compulsory.',
        'Marks are indicated against each question.',
        'Write answers in the space provided.',
      ],
    },
  },
  {
    ...baseConfig,
    header: {
      ...baseConfig.header,
      examTitle: 'HALF-YEARLY / TERM EXAMINATION',
      maxMarks: '80',
      timeAllowed: '3 Hours',
    },
  },
  {
    ...baseConfig,
    header: {
      ...baseConfig.header,
      examTitle: 'FINAL / BOARD PATTERN PAPER',
      subject: 'SCIENCE (Bilingual)',
      subjectCode: '086',
      generalInstructions: [
        'This paper has 4 Sections: A, B, C, D.',
        'Section A: 1-mark questions (Q1-Q20).',
        'Section B: 2-mark questions (Q21-Q26).',
        'Section C: 3-mark questions (Q27-Q33).',
        'Section D: 5-mark questions (Q34-Q36).',
        'Internal choice provided in select questions.',
      ],
    },
    typography: {
      ...baseConfig.typography,
      secondaryFont: 'Nirmala UI',
    },
  },
  {
    ...baseConfig,
    pageSetup: { ...baseConfig.pageSetup, columns: 2 },
    header: {
      ...baseConfig.header,
      examTitle: 'MCQ / OMR TEST SHEET',
      maxMarks: '50',
      timeAllowed: '1 Hour',
      generalInstructions: [
        'Each question carries 1 mark.',
        'Darken the correct circle in the OMR sheet.',
        'No negative marking.',
      ],
      showRollNoBoxes: true,
      rollNoBoxCount: 10,
    },
    mcqAndTables: {
      ...baseConfig.mcqAndTables,
      mcqLayout: '2x2-grid',
    },
    footer: {
      ...baseConfig.footer,
      endMarkerText: '--- END OF TEST ---',
    },
  },
  {
    ...baseConfig,
    pageSetup: { ...baseConfig.pageSetup, margins: { top: 108, bottom: 72, left: 72, right: 72 } },
    header: {
      ...baseConfig.header,
      style: 'minimal',
      examTitle: 'NOTICE / CIRCULAR',
      className: '',
      subject: '',
      subjectCode: '',
      paperSet: '',
      timeAllowed: '',
      maxMarks: '',
      showRollNoBoxes: false,
      rollNoBoxCount: 0,
      generalInstructions: [],
    },
    typography: {
      ...baseConfig.typography,
      titleSize: 18,
      subHeaderSize: 13,
      questionSize: 12,
    },
    questionsAndMarks: {
      ...baseConfig.questionsAndMarks,
      marksFormat: 'none',
      marksLeader: 'none',
    },
    footer: {
      ...baseConfig.footer,
      pageNumberStyle: 'none',
      showPTO: false,
      endMarkerText: '',
    },
  },
];

export const presetNames = [
  'Unit Test / Periodic Test (40 Marks — Compact Single Page)',
  'Half-Yearly / Term Exam (80 Marks — Standard A4 with Instructions)',
  'Final / Board Pattern Paper (Bilingual Support + Section A/B/C/D)',
  'Pure MCQ / OMR Test Sheet (2-Column Page + 2x2 Option Grid)',
  'Official School Notice / Circular Format',
];

export function getPresetConfig(index: number): FormattingConfig {
  return { ...defaultPresets[index], presetName: presetNames[index] };
}