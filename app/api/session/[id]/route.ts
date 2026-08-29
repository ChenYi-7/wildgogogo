import { NextRequest,NextResponse } from 'next/server'; import { getSession,saveSession,deleteSession } from '@/lib/storage';
export async function GET(_:NextRequest,{params}:{params:{id:string}}){const s=await getSession(params.id);return s?NextResponse.json(s):NextResponse.json({error:'not found'},{status:404})}
export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){const s=await getSession(params.id);if(!s)return NextResponse.json({error:'not found'},{status:404});const body=await req.json();const next=await saveSession(params.id,{...s,...body});return NextResponse.json(next)}
export async function DELETE(_:NextRequest,{params}:{params:{id:string}}){await deleteSession(params.id);return NextResponse.json({ok:true})}
