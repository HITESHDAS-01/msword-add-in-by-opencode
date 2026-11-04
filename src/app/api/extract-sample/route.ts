import { extractStyleWithAI, getProviderConfig } from '@/lib/aiProvider';
import { SampleExtractionResult } from '@/types/schema';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const providerConfig = getProviderConfig();
    const extracted: SampleExtractionResult = await extractStyleWithAI(file, providerConfig);
    return Response.json({ success: true, data: extracted });
  } catch (error) {
    console.error('Sample extraction error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to extract style' }, { status: 500 });
  }
}