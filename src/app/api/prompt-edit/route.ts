import { editDocumentWithAI, getProviderConfig } from '@/lib/aiProvider';
import { ParsedDocument } from '@/types/schema';

export async function POST(request: Request) {
  try {
    const { parsedDoc, instruction, quickAction } = await request.json();
    if (!parsedDoc || (!instruction && !quickAction)) {
      return Response.json({ error: 'Missing parsedDoc or instruction' }, { status: 400 });
    }
    const providerConfig = getProviderConfig();
    const modifiedDoc: ParsedDocument = await editDocumentWithAI(parsedDoc, instruction, quickAction, providerConfig);
    return Response.json({ success: true, data: modifiedDoc });
  } catch (error) {
    console.error('Prompt edit error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to apply prompt' }, { status: 500 });
  }
}