import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/storage';

/** Lightweight polling endpoint used by the preparation screen. */
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('session') || '';
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ status: session.status, ready: Boolean(session.task) });
}
