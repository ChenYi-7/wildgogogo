import Replicate from 'replicate';
import { Theme, MapRegion } from './types';
import { promises as fs } from 'node:fs';
import path from 'node:path';
const replicate = new Replicate({ auth:process.env.REPLICATE_API_TOKEN || 'missing-token' });
// openai-next exposes an OpenAI-compatible API. gpt-4o-mini is a low-cost
// multimodal default; override it with OPENAI_MODEL when needed.
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai-next.com').replace(/\/$/, '').replace(/\/v1$/, '');
const API_KEY = process.env.OPENAI_API_KEY;
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
const STYLE_REFERENCE = process.env.OPENAI_STYLE_REFERENCE || 'pic/dym.png';

function apiUrl(pathname: string) { return `${BASE_URL}/v1/${pathname.replace(/^\//, '')}`; }

function extractJson(payload: any): any {
  const text = payload.output_text
    || payload.output?.flatMap((x: any) => x.content || []).map((x: any) => x.text || '').join('')
    || payload.choices?.[0]?.message?.content
    || '';
  const cleaned = String(text).replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

async function chatJson(system: string, user: string, imageDataUrl?: string): Promise<any> {
  if (!API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), imageDataUrl ? 180_000 : 60_000);
  try {
    const userContent = imageDataUrl
      ? [{ type: 'text', text: user }, { type: 'image_url', image_url: { url: imageDataUrl, detail: 'low' } }]
      : user;
    const response = await fetch(apiUrl('chat/completions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }],
        temperature: imageDataUrl ? 0.1 : 0.7,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`AI request failed: ${response.status} ${await response.text()}`);
    return extractJson(await response.json());
  } finally { clearTimeout(timer); }
}

async function imageUrlToDataUrl(imageUrl: string) {
  if (imageUrl.startsWith('data:')) return imageUrl;
  const localPath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
  const image = await fs.readFile(localPath);
  const ext = path.extname(localPath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${image.toString('base64')}`;
}

function resolveLocalImagePath(imageUrl: string) {
  if (path.isAbsolute(imageUrl)) return imageUrl;
  const relative = imageUrl.replace(/^\//, '');
  return path.join(process.cwd(), relative.startsWith('uploads/') ? 'public' : '', relative);
}

async function readImageBlob(imageUrl: string) {
  const filePath = resolveLocalImagePath(imageUrl);
  const buffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return { buffer, mime, name: path.basename(filePath) || 'image.jpg' };
}

/**
 * Convert a classroom photo into the hand-painted nature-sticker style used
 * by pic/dym.png. The original photo is never overwritten; callers save the
 * returned bytes as a sibling asset and can fall back to the original when
 * the image gateway is unavailable.
 */
export async function stylizeImage(imageUrl: string, subjectName?: string): Promise<{ buffer: Buffer; mime: string } | null> {
  if (!API_KEY) return null;
  const source = await readImageBlob(imageUrl);
  const style = await readImageBlob(STYLE_REFERENCE);
  const form = new FormData();
  form.append('model', IMAGE_MODEL);
  form.append('prompt', [
    '把输入照片转换成儿童自然课堂贴纸风格的涂鸦插画。',
    '参考 pic/dym.png 的画风：明亮自然的绿色和暖黄色、手绘笔触、圆润清晰的轮廓、轻微纸张质感、适合一年级学生理解。',
    subjectName ? `主体是“${subjectName}”，保留主体的关键外形和颜色。` : '保留照片中最明显的动植物或场景主体。',
    '去除杂乱背景，主体居中，生成可放入拼贴托盘的单张素材；不要添加文字、标签、水印或人物脸部。',
  ].join(' '));
  form.append('size', '1024x1024');
  form.append('quality', process.env.OPENAI_IMAGE_QUALITY || 'low');
  form.append('output_format', 'png');
  // The gateway follows the OpenAI multipart convention: repeated image
  // fields provide the edit target and the style reference.
  form.append('image', new Blob([source.buffer], { type: source.mime }), source.name);
  form.append('image', new Blob([style.buffer], { type: style.mime }), style.name);
  const response = await fetch(apiUrl('images/edits'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(Number(process.env.OPENAI_IMAGE_TIMEOUT_MS || 45_000)),
  });
  if (!response.ok) throw new Error(`AI image edit failed: ${response.status} ${await response.text()}`);
  const payload: any = await response.json();
  const item = payload.data?.[0];
  if (item?.b64_json) return { buffer: Buffer.from(item.b64_json, 'base64'), mime: 'image/png' };
  if (item?.url) return { buffer: Buffer.from(await (await fetch(item.url)).arrayBuffer()), mime: 'image/png' };
  throw new Error('AI image edit returned no image');
}

export async function analyzeImageRegions(imageUrl: string): Promise<MapRegion[]> {
  const dataUrl = await imageUrlToDataUrl(imageUrl);
  const result = await chatJson(
    '你是校园自然观察视觉分析师。只返回JSON，不要Markdown。',
    '识别图片中可用于自然课堂拼贴的区域，重点寻找池塘/水池、林地/树丛、花园/花坛、菜园。返回 {regions:[{id,name,x,y,description,color}]}。x/y 是区域中心相对图片宽高的百分比(0-100)，必须落在对应区域内部；看不到的区域不要编造。至少返回你能确认的2个区域。',
    dataUrl,
  );
  if (!Array.isArray(result.regions)) throw new Error('invalid region result');
  return result.regions.map((region: MapRegion, index: number) => ({
    ...region,
    id: region.id || `region-${index}`,
    x: Math.max(0, Math.min(100, Number(region.x))),
    y: Math.max(0, Math.min(100, Number(region.y))),
    color: region.color || '#78b779',
  }));
}

export async function analyzeMapRegions(): Promise<MapRegion[]> {
  const mapPath = path.join(process.cwd(), 'public', 'school-map.jpg');
  const image = await fs.readFile(mapPath);
  const dataUrl = `data:image/jpeg;base64,${image.toString('base64')}`;
  const prompt = '识别这张校园地图中可用于自然课堂拼贴的区域。只返回JSON：{regions:[{id,name,x,y,description,color}]}。至少识别林地、池塘或水池、花坛、菜园；x和y是区域中心相对于图片宽高的百分比(0-100)，不要猜测图片外的区域。name使用中文，color返回适合覆盖标签的十六进制颜色。';
  try {
    const result = await chatJson(prompt, '请基于真实图片像素判断区域中心位置，确保每个坐标落在对应区域内部。', dataUrl);
    if (!Array.isArray(result.regions) || result.regions.length < 3) throw new Error('invalid region result');
    return result.regions.map((region: MapRegion, index: number) => ({ ...region, id: region.id || `region-${index}`, x: Math.max(0, Math.min(100, Number(region.x))), y: Math.max(0, Math.min(100, Number(region.y))), color: region.color || '#78b779' }));
  } catch (error) {
    // The UI will show this as an AI recognition failure; these are not used as
    // a hidden layout fallback. The caller may let the teacher retry.
    throw error;
  }
}
const fallbackTask = (theme:Theme)=>({ commonQuestion:`在校园里，${theme}和我们的生活有什么关系？`, grade1:{title:'小小自然侦探出发！',target:'花坛、池塘和林地里的自然朋友',steps:['找到一个有趣的自然对象','拍一张清晰的照片','说说你在哪里发现它']}, grade4:{reading:[`今天我们从“${theme}”出发观察校园。不同区域的光照、水分和土壤，会影响生物的生长和活动。`,`请把一年级同学发现的对象放到合适的区域，思考它们为什么喜欢那里。`],questions:[{question:'植物生长最需要什么？',options:['阳光和水','糖果','玩具'],answer:0},{question:'池塘边通常有什么？',options:['鱼和水草','沙漠','雪山'],answer:0},{question:'观察时我们应该？',options:['轻轻观察并记录','随意踩踏','带走所有东西'],answer:0}]}});
export async function generateTask(theme:Theme, imageUrl?:string){
  if(!process.env.OPENAI_API_KEY) return fallbackTask(theme);
  try{
    const imageDataUrl = imageUrl ? await imageUrlToDataUrl(imageUrl) : undefined;
    return await chatJson(
      '你是乡村自然课堂课程设计师。只返回JSON，字段 commonQuestion, grade1{title,target,steps[]}, grade4{reading[],questions[{question,options[],answer}]}。',
      `主题：${theme}。请结合教师上传的校园场景图片设计任务；如果图片中没有清晰场景，也要生成适合校园自然观察的任务。`,
      imageDataUrl,
    );
  }catch{return fallbackTask(theme);}
}
export async function judgeAnswer(question:string, answer:string){
  if(!process.env.OPENAI_API_KEY) return {correct:answer.length>1, feedback:answer.length>1?'很棒！':'再想想，可以加上它的用处哦'};
  try{return await chatJson('判断小学生自然课堂回答是否合理，返回JSON {correct:boolean,feedback:string}',`问题：${question}\n回答：${answer}`);}catch{return {correct:false,feedback:'AI暂时没有回应，请再试一次。'};}
}
export async function generateExplanations(theme:string, placements:any[], evidences:any[]){
  if(!process.env.OPENAI_API_KEY) return placements.map((p:any)=>({name:p.name,relation:`${p.name}适合在${p.area||'校园'}里生长或活动`,detail:`今天我们在真实校园里发现了它。结合${theme}的知识，这个区域的环境为它提供了需要的条件。`,evidenceType:evidences.length?'今天观察到了':'课程知识'}));
  try{const result=await chatJson('为自然课堂拼贴生成JSON {items:[{name,relation,detail,evidenceType}]}，证据类型只能是今天观察到了或课程知识。',JSON.stringify({theme,placements,evidences})); return result.items||[];}catch{return []}
}

export async function analyzeEvidenceImage(imageUrl: string) {
  const dataUrl = await imageUrlToDataUrl(imageUrl);
  const result = await chatJson(
    '你是一年级自然课堂的视觉识别助手。只返回JSON，不要Markdown。',
    '识别孩子上传照片中的主要自然对象，并为拼贴素材整理信息。返回 {name,category,confidence,description,areaSuggestion,stickerPrompt}。category 只能是 flower, insect, leaf, tree, pond, soil, other；name 用简短中文；areaSuggestion 只能是花园、池塘、林地、菜园或校园。若主体不清晰也要如实返回 other。',
    dataUrl,
  );
  return { ...result, confidence: Math.max(0, Math.min(1, Number(result.confidence ?? 0.5))) };
}
export async function generateStickerImage(sourceUrl:string, name:string){
  if(!process.env.REPLICATE_API_TOKEN) return null;
  try{const output:any=await replicate.run('851-labs/architecture-turbo-aesthetic-design:latest',{input:{prompt:`cute hand drawn nature classroom sticker of ${name}, transparent background`,image:sourceUrl}}); return Array.isArray(output)?output[0]:output;}catch{return null;}
}
