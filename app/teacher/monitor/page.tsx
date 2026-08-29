'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shell, Card, Button, Badge, FadeIn } from '@/components/ui';

export default function Monitor() {
  const id = useSearchParams().get('session') || '';
  const router = useRouter();
  const [s, setS] = useState<any>();
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const cameraInput = useRef<HTMLInputElement>(null);
  const localInput = useRef<HTMLInputElement>(null);

  const loadSession = () => fetch(`/api/session/${id}`).then((r) => r.json()).then(setS);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    loadSession();
    timer = setInterval(loadSession, 2000);
    return () => timer && clearInterval(timer);
  }, [id]);

  if (!s) return <Shell title="加载监控…" />;

  const done = s.evidences.length;
  const uploadEvidence = async (file?: File) => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadMessage('正在上传…');
    const form = new FormData();
    form.append('image', file);
    // Teacher-added evidence is assigned to the next available group.
    const usedGroups = new Set((s.evidences || []).map((e: any) => e.group));
    const nextGroup = [1, 2, 3, 4, 5, 6].find((group) => !usedGroups.has(group)) || 1;
    form.append('group', String(nextGroup));
    try {
      const response = await fetch(`/api/evidence/upload?session=${id}`, { method: 'POST', body: form });
      if (!response.ok) throw new Error('upload failed');
      setUploadMessage(`已添加到第 ${nextGroup} 组`);
      await loadSession();
    } catch {
      setUploadMessage('上传失败，请重试');
    } finally {
      setUploading(false);
      if (cameraInput.current) cameraInput.current.value = '';
      if (localInput.current) localInput.current.value = '';
    }
  };

  const next = async () => {
    await fetch(`/api/sticker/generate?session=${id}`, { method: 'POST' });
    router.push(`/grade4/collage?session=${id}`);
  };

  return (
    <Shell title="课堂进行中" action={<Badge>实时同步 · {done}/4 组已发现</Badge>}>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <FadeIn>
          <Card>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">一年级发现照片墙</h2>
                <p className="mt-1 text-sm text-[#71867c]">手机上传的证据会自动出现在这里，也可以由老师补充上传。</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-2xl bg-[#26413c] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#355b52]">
                  {uploading ? '上传中…' : '📷 拍摄上传'}
                  <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" disabled={uploading} onChange={(e) => uploadEvidence(e.target.files?.[0])} />
                </label>
                <label className="cursor-pointer rounded-2xl bg-[#edf4ec] px-4 py-2.5 text-xs font-extrabold text-[#31584d] transition hover:bg-[#dcebdc]">
                  ＋ 本地上传
                  <input ref={localInput} type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => uploadEvidence(e.target.files?.[0])} />
                </label>
              </div>
            </div>
            {uploadMessage && <div className="mb-4 rounded-xl bg-[#fff3da] px-3 py-2 text-xs font-bold text-[#8a6b37]">{uploadMessage}</div>}
            {s.evidences.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{s.evidences.map((e: any) => <div key={e.id} className="relative overflow-hidden rounded-2xl"><img src={e.imageUrl} className="aspect-square w-full object-cover" /><span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-extrabold">{e.analysis?.name || e.label || '识别中…'} · {e.group}组</span></div>)}</div> : <div className="flex h-72 items-center justify-center rounded-2xl bg-[#f5faf3] text-center text-sm text-[#8a9d91]"><div><div className="mb-2 text-4xl">🌾</div>等待小小侦探带回发现…<div className="mt-1 text-xs">可以点击右上角添加第一张照片</div></div></div>}
          </Card>
        </FadeIn>
        <FadeIn delay={.1}>
          <Card>
            <h2 className="text-xl font-extrabold">小组进度</h2>
            <div className="mt-5 space-y-3">{Array.from({ length: 6 }, (_, i) => { const n = i + 1; const found = s.evidences.some((e: any) => e.group === n); return <div key={n} className="flex items-center justify-between rounded-2xl bg-[#faf8f1] p-3"><span className="font-bold">第 {n} 组</span><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${found ? 'bg-[#dcebdc] text-[#477052]' : 'bg-[#f0eee7] text-[#9ba69d]'}`}>{found ? '✓ 已完成' : '○ 等待中'}</span></div>; })}</div>
            <Button disabled={done < 4} onClick={next}>{done < 4 ? `还差 ${4 - done} 组` : '进入拼贴阶段 →'}</Button>
          </Card>
        </FadeIn>
      </div>
    </Shell>
  );
}
