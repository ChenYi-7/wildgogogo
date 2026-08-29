import { NextRequest, NextResponse } from 'next/server';
import { analyzeMapRegions, analyzeImageRegions } from '@/lib/ai';
import { getSession, saveSession } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('session') || '';
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });
  try {
    const regions = session.sceneImage ? await analyzeImageRegions(session.sceneImage) : await analyzeMapRegions();
    await saveSession(id, { ...session, mapRegions: regions });
    return NextResponse.json({ regions });
  } catch {
    return NextResponse.json({ error: '地图识别失败，请检查 OPENAI_API_KEY 后重试' }, { status: 502 });
  }
}
