import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedDocument, FormattingConfig, SampleExtractionResult } from '@/types/schema';

export type AIProvider = 'gemini' | 'nim';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  baseURL?: string; // For NIM custom endpoint
  model?: string;
  fallbackModels?: string[]; // Additional models to try on quota error
}

// Model fallback chains - ordered by preference
const GEMINI_MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

const NIM_MODEL_CHAIN = [
  'meta/llama-3.1-405b-instruct',
  'meta/llama-3.1-70b-instruct',
  'nvidia/nemotron-3-ultra',
  'meta/llama-3.1-8b-instruct',
  'mistralai/mixtral-8x7b-instruct-v0.1',
];

function getModelChain(provider: AIProvider, preferredModel?: string, customFallbacks?: string[]): string[] {
  const chain = provider === 'gemini' ? GEMINI_MODEL_CHAIN : NIM_MODEL_CHAIN;
  const custom = customFallbacks || [];
  
  // Put preferred model first if it's in the chain, otherwise add it
  const preferred = preferredModel || chain[0];
  const ordered = [preferred, ...chain.filter(m => m !== preferred), ...custom.filter(m => !chain.includes(m))];
  
  // Remove duplicates while preserving order
  return [...new Set(ordered)];
}

function isQuotaError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.status || error?.response?.status;
  
  // Check for quota/rate limit indicators
  return (
    status === 429 ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('resource exhausted') ||
    message.includes('429')
  );
}

function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

async function callNIM(apiKey: string, baseURL: string, model: string, messages: any[], responseSchema?: any) {
  const endpoint = `${baseURL.replace(/\/$/, '')}/v1/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 8192,
      response_format: responseSchema ? { type: 'json_schema', json_schema: responseSchema } : undefined,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    const error = new Error(`NIM API error: ${response.status} - ${err}`);
    (error as any).status = response.status;
    throw error;
  }
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callGeminiWithFallback(
  apiKey: string,
  modelChain: string[],
  systemPrompt: string,
  prompt: string,
  responseSchema: any
): Promise<string> {
  let lastError: Error | null = null;
  
  for (const modelName of modelChain) {
    try {
      console.log(`[AI] Trying model: ${modelName}`);
      const genAI = getGeminiClient(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any,
          temperature: 0.1,
        },
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`[AI] Success with model: ${modelName}`);
      return text;
    } catch (error: any) {
      lastError = error;
      console.warn(`[AI] Model ${modelName} failed:`, error.message);
      
      if (isQuotaError(error)) {
        console.log(`[AI] Quota error detected, trying next model...`);
        continue; // Try next model
      }
      
      // Non-quota error - throw immediately
      throw error;
    }
  }
  
  throw new Error(`All models exhausted. Last error: ${lastError?.message}`);
}

async function callNIMWithFallback(
  apiKey: string,
  baseURL: string,
  modelChain: string[],
  messages: any[],
  responseSchema?: any
): Promise<string> {
  let lastError: Error | null = null;
  
  for (const modelName of modelChain) {
    try {
      console.log(`[AI] Trying NIM model: ${modelName}`);
      const content = await callNIM(apiKey, baseURL, modelName, messages, responseSchema);
      console.log(`[AI] Success with NIM model: ${modelName}`);
      return content;
    } catch (error: any) {
      lastError = error;
      console.warn(`[AI] NIM model ${modelName} failed:`, error.message);
      
      if (isQuotaError(error)) {
        console.log(`[AI] Quota error detected, trying next NIM model...`);
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error(`All NIM models exhausted. Last error: ${lastError?.message}`);
}

// Schema definitions (shared)
const PARSE_SCHEMA = {
  type: 'object',
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          instructions: { type: 'string' },
          sectionMarksSummary: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                qNo: { type: 'string' },
                type: { type: 'string', enum: ['standard', 'mcq', 'match', 'assertion-reason', 'case-study'] },
                text: { type: 'string' },
                marks: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                subQuestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      text: { type: 'string' },
                      marks: { type: 'string' },
                    },
                    required: ['label', 'text'],
                  },
                },
                matchColumns: {
                  type: 'object',
                  properties: {
                    colAHeader: { type: 'string' },
                    colBHeader: { type: 'string' },
                    rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
                  },
                },
                hasInternalChoiceAfter: { type: 'boolean' },
                choiceAlternative: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    marks: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
              required: ['id', 'qNo', 'type', 'text'],
            },
          },
        },
        required: ['title', 'questions'],
      },
    },
    metadata: {
      type: 'object',
      properties: {
        instituteName: { type: 'string' },
        examTitle: { type: 'string' },
        className: { type: 'string' },
        subject: { type: 'string' },
        timeAllowed: { type: 'string' },
        maxMarks: { type: 'string' },
      },
    },
  },
  required: ['sections'],
};

const VISION_SCHEMA = {
  type: 'object',
  properties: {
    config: {
      type: 'object',
      properties: {
        pageSetup: {
          type: 'object',
          properties: {
            paperSize: { type: 'string', enum: ['A4', 'Legal', 'Letter'] },
            orientation: { type: 'string', enum: ['Portrait', 'Landscape'] },
            columns: { type: 'integer', enum: [1, 2] },
            margins: {
              type: 'object',
              properties: {
                top: { type: 'number' },
                bottom: { type: 'number' },
                left: { type: 'number' },
                right: { type: 'number' },
              },
            },
            pageBorder: { type: 'string', enum: ['none', 'single', 'double'] },
          },
        },
        header: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            style: { type: 'string', enum: ['boxed', 'double-line', 'minimal'] },
            instituteName: { type: 'string' },
            instituteSubtitle: { type: 'string' },
            examTitle: { type: 'string' },
            className: { type: 'string' },
            subject: { type: 'string' },
            subjectCode: { type: 'string' },
            paperSet: { type: 'string' },
            timeAllowed: { type: 'string' },
            maxMarks: { type: 'string' },
            showRollNoBoxes: { type: 'boolean' },
            rollNoBoxCount: { type: 'integer' },
            generalInstructions: { type: 'array', items: { type: 'string' } },
          },
        },
        typography: {
          type: 'object',
          properties: {
            primaryFont: { type: 'string' },
            secondaryFont: { type: 'string' },
            titleSize: { type: 'number' },
            subHeaderSize: { type: 'number' },
            sectionTitleSize: { type: 'number' },
            questionSize: { type: 'number' },
            optionSize: { type: 'number' },
            lineSpacing: { type: 'number' },
            questionGapAfter: { type: 'number' },
          },
        },
        questionsAndMarks: {
          type: 'object',
          properties: {
            sectionStyle: { type: 'string', enum: ['centered-underline', 'shaded-bar', 'boxed'] },
            questionNumberPrefix: { type: 'string', enum: ['1.', 'Q1.', '1)'] },
            subQuestionStyle: { type: 'string', enum: ['(i)', '(a)'] },
            marksFormat: { type: 'string', enum: ['[X]', '(X)', 'X Marks', 'none'] },
            marksLeader: { type: 'string', enum: ['none', 'dots'] },
            centerChoiceOr: { type: 'boolean' },
          },
        },
        mcqAndTables: {
          type: 'object',
          properties: {
            mcqLayout: { type: 'string', enum: ['auto', '1-line', '2x2-grid', '4-lines'] },
            optionLabelStyle: { type: 'string', enum: ['(a)', '(A)', '(i)', '(ক)'] },
            preserveEquationsAndImages: { type: 'boolean' },
          },
        },
        footer: {
          type: 'object',
          properties: {
            pageNumberStyle: { type: 'string', enum: ['page-x-of-y', 'center-dash', 'none'] },
            showPTO: { type: 'boolean' },
            endMarkerText: { type: 'string' },
            watermarkText: { type: 'string' },
          },
        },
      },
    },
    confidence: { type: 'number' },
  },
  required: ['config', 'confidence'],
};

const EDIT_SCHEMA = {
  type: 'object',
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          instructions: { type: 'string' },
          sectionMarksSummary: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                qNo: { type: 'string' },
                type: { type: 'string', enum: ['standard', 'mcq', 'match', 'assertion-reason', 'case-study'] },
                text: { type: 'string' },
                marks: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                subQuestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      text: { type: 'string' },
                      marks: { type: 'string' },
                    },
                    required: ['label', 'text'],
                  },
                },
                matchColumns: {
                  type: 'object',
                  properties: {
                    colAHeader: { type: 'string' },
                    colBHeader: { type: 'string' },
                    rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
                  },
                },
                hasInternalChoiceAfter: { type: 'boolean' },
                choiceAlternative: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    marks: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
              required: ['id', 'qNo', 'type', 'text'],
            },
          },
        },
        required: ['title', 'questions'],
      },
    },
    metadata: {
      type: 'object',
      properties: {
        instituteName: { type: 'string' },
        examTitle: { type: 'string' },
        className: { type: 'string' },
        subject: { type: 'string' },
        timeAllowed: { type: 'string' },
        maxMarks: { type: 'string' },
      },
    },
  },
  required: ['sections'],
};

// Prompts
const SYSTEM_PROMPT = `You are an expert Question Paper Parser. Convert raw, messy text from a teacher's Word document into a strictly structured JSON format for automated formatting.

RULES:
1. Identify sections (Section A, Part I, etc.) and their instructions.
2. Parse questions with their numbers, text, marks, and types.
3. Identify MCQs by options (a), (b), (c), (d) or similar patterns.
4. Detect sub-questions (i), (ii), (a), (b).
5. Find "OR" / "অথবা" / "अथवा" for internal choice.
6. Detect Match the Following, Assertion-Reason, Case Study patterns.
7. Preserve bilingual text (English + Hindi/Assamese/Bengali) exactly.
8. Extract metadata: institute name, exam title, class, subject, time, max marks.
9. Return ONLY valid JSON matching the schema. No markdown, no explanations.`;

const VISION_PROMPT = `You are a Document Layout Analyzer. Analyze the uploaded PDF/Image of a question paper or official document and extract its exact visual formatting rules.

Return a JSON object with FormattingConfig fields that can be directly applied. Focus on:
1. Page size, margins, orientation, columns
2. Header structure (institute name, exam title, metadata fields, roll no boxes)
3. Fonts (primary English font, secondary regional font if bilingual)
4. Font sizes for each element (title, sub-header, section, question, options)
5. Line spacing, paragraph gaps
6. Section header styles, numbering formats
7. Marks alignment (right tab-stop, format [X]/(X), leader dots)
8. MCQ layout (1-line, 2x2 grid, vertical)
9. Footer style (page numbers, P.T.O., end marker)
10. Watermark if visible

Be precise with measurements. Return ONLY valid JSON.`;

const EDIT_PROMPT = `You are a Document Editor AI. Apply the user's natural language instruction to the provided structured question paper JSON.

Rules:
1. Modify ONLY what the user asks for.
2. Preserve all other content exactly.
3. Return the complete modified ParsedDocument JSON.
4. Valid operations: reformat MCQs, fix numbering, align marks, add/remove sections, change marks, translate, restructure, etc.
5. If user says "selected text only", the input JSON contains only that selection.`;

export async function parseDocumentWithAI(
  text: string,
  config: FormattingConfig | null,
  scope: 'full' | 'selection',
  providerConfig: AIProviderConfig
): Promise<ParsedDocument> {
  const prompt = `Parse this ${scope === 'selection' ? 'selected text' : 'full document'} into structured question paper JSON.\n\nRaw Text:\n${text}\n\n${config ? `Formatting Config (for reference):\n${JSON.stringify(config, null, 2)}` : ''}`;
  
  const modelChain = getModelChain(providerConfig.provider, providerConfig.model, providerConfig.fallbackModels);
  
  if (providerConfig.provider === 'gemini') {
    const content = await callGeminiWithFallback(
      providerConfig.apiKey,
      modelChain,
      SYSTEM_PROMPT,
      prompt,
      PARSE_SCHEMA
    );
    return JSON.parse(content);
  } else {
    const content = await callNIMWithFallback(
      providerConfig.apiKey,
      providerConfig.baseURL || 'https://integrate.api.nvidia.com',
      modelChain,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      PARSE_SCHEMA
    );
    return JSON.parse(content);
  }
}

export async function extractStyleWithAI(
  file: File,
  providerConfig: AIProviderConfig
): Promise<SampleExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = file.type || 'application/pdf';
  
  const modelChain = getModelChain(providerConfig.provider, providerConfig.model, providerConfig.fallbackModels);
  
  if (providerConfig.provider === 'gemini') {
    const content = await callGeminiWithFallback(
      providerConfig.apiKey,
      modelChain,
      VISION_PROMPT,
      `Extract formatting rules from this document image/PDF.`,
      VISION_SCHEMA
    );
    // For vision, we need to handle the multimodal call differently
    // Fall back to the original method for vision since it needs inlineData
    const genAI = getGeminiClient(providerConfig.apiKey);
    for (const modelName of modelChain) {
      try {
        console.log(`[AI] Trying vision model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: VISION_SCHEMA as any,
            temperature: 0.1,
          },
          systemInstruction: VISION_PROMPT,
        });
        const result = await model.generateContent([
          { inlineData: { mimeType, data: base64 } },
          'Extract formatting rules from this document image/PDF.',
        ]);
        const parsedText = result.response.text();
        const extracted = JSON.parse(parsedText);
        extracted.source = file.type.includes('pdf') ? 'pdf' : 'image';
        console.log(`[AI] Vision success with model: ${modelName}`);
        return extracted;
      } catch (error: any) {
        console.warn(`[AI] Vision model ${modelName} failed:`, error.message);
        if (isQuotaError(error)) continue;
        throw error;
      }
    }
    throw new Error('All vision models exhausted');
  } else {
    // NIM vision - use text-only fallback for now
    const content = await callNIMWithFallback(
      providerConfig.apiKey,
      providerConfig.baseURL || 'https://integrate.api.nvidia.com',
      modelChain,
      [
        { role: 'system', content: VISION_PROMPT },
        { role: 'user', content: `Extract formatting from this ${mimeType} document (base64 encoded). Return only the JSON.` },
      ],
      VISION_SCHEMA
    );
    const extracted = JSON.parse(content);
    extracted.source = file.type.includes('pdf') ? 'pdf' : 'image';
    return extracted;
  }
}

export async function editDocumentWithAI(
  parsedDoc: ParsedDocument,
  instruction: string,
  quickAction?: string,
  providerConfig?: AIProviderConfig
): Promise<ParsedDocument> {
  if (!providerConfig) {
    providerConfig = {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY || '',
    };
  }

  let prompt = `Current Document JSON:\n${JSON.stringify(parsedDoc, null, 2)}\n\n`;
  if (quickAction) {
    prompt += `Quick Action: ${quickAction}\n`;
  } else {
    prompt += `Instruction: ${instruction}\n`;
  }
  prompt += '\nReturn the complete modified JSON.';
  
  const modelChain = getModelChain(providerConfig.provider, providerConfig.model, providerConfig.fallbackModels);
  
  if (providerConfig.provider === 'gemini') {
    const content = await callGeminiWithFallback(
      providerConfig.apiKey,
      modelChain,
      EDIT_PROMPT,
      prompt,
      EDIT_SCHEMA
    );
    return JSON.parse(content);
  } else {
    const content = await callNIMWithFallback(
      providerConfig.apiKey,
      providerConfig.baseURL || 'https://integrate.api.nvidia.com',
      modelChain,
      [
        { role: 'system', content: EDIT_PROMPT },
        { role: 'user', content: prompt },
      ],
      EDIT_SCHEMA
    );
    return JSON.parse(content);
  }
}

export function getProviderConfig(): AIProviderConfig {
  const provider = (process.env.AI_PROVIDER as AIProvider) || 'gemini';
  if (provider === 'nim') {
    return {
      provider: 'nim',
      apiKey: process.env.NIM_API_KEY || '',
      baseURL: process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com',
      model: process.env.NIM_MODEL || 'meta/llama-3.1-405b-instruct',
      fallbackModels: process.env.NIM_FALLBACK_MODELS?.split(',').map(m => m.trim()),
    };
  }
  return {
    provider: 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    fallbackModels: process.env.GEMINI_FALLBACK_MODELS?.split(',').map(m => m.trim()),
  };
}