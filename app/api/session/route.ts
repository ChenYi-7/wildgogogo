import { NextResponse } from 'next/server'; import { randomUUID } from 'node:crypto'; import { saveSession } from '@/lib/storage';
export async function POST(){const id=`NATURE-${randomUUID().slice(0,4).toUpperCase()}`;const s:any={id,createdAt:new Date().toISOString(),status:'prep',evidences:[],stickers:[],placements:[]};await saveSession(id,s);return NextResponse.json(s)}
