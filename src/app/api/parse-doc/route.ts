import { parseDocumentWithAI, getProviderConfig } from '@/lib/aiProvider';
import { ParsedDocument } from '@/types/schema';

export async function POST(request: Request) {
  try {
    const { text, config, scope } = await request.json();
    if (!text?.trim()) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }
    const providerConfig = getProviderConfig();
    const parsedDoc: ParsedDocument = await parseDocumentWithAI(text, config, scope, providerConfig);
    return Response.json({ success: true, data: parsedDoc });
  } catch (error) {
    console.error('Parse error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to parse document' }, { status: 500 });
  }
}