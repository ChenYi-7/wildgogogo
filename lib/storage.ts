import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Session } from './types';
const root = process.cwd();
export const dirs = { sessions:path.join(root,'data/sessions'), images:path.join(root,'public/uploads/images'), stickers:path.join(root,'public/uploads/stickers'), backgrounds:path.join(root,'public/uploads/backgrounds') };
export async function ensureDirs(){ await Promise.all(Object.values(dirs).map(d=>fs.mkdir(d,{recursive:true}))); }
export async function getSession(id:string):Promise<Session|null>{ try{return JSON.parse(await fs.readFile(path.join(dirs.sessions,`${id}.json`),'utf8'));}catch{return null;} }
export async function saveSession(id:string,data:Session){ await ensureDirs(); await fs.writeFile(path.join(dirs.sessions,`${id}.json`),JSON.stringify(data,null,2),'utf8'); return data; }
export async function deleteSession(id:string){ try{await fs.unlink(path.join(dirs.sessions,`${id}.json`));}catch{} }
export async function saveBuffer(folder:keyof typeof dirs, filename:string, buffer:Buffer){ await ensureDirs(); const safe=filename.replace(/[^a-zA-Z0-9._-]/g,'_'); await fs.writeFile(path.join(dirs[folder],safe),buffer); return `/uploads/${folder}/${safe}`; }
