'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shell, Button, Badge, FadeIn } from '@/components/ui';

// Static regions aligned to the supplied dym.png artwork (no AI map call).
const staticRegions = [
  { id: 'garden', name: '花坛', x: 23, y: 32, color: '#ef8a86' },
  { id: 'pond', name: '池塘', x: 70, y: 28, color: '#75bde4' },
  { id: 'farm', name: '菜园', x: 22, y: 67, color: '#78b779' },
  { id: 'woods', name: '林地', x: 84, y: 71, color: '#f0a33d' },
];

export default function Collage() {
  const id = useSearchParams().get('session') || '';
  const router = useRouter();
  const [session, setSession] = useState<any>();
  const [placed, setPlaced] = useState<any[]>([]);
  const [dragging, setDragging] = useState<any>();
  const regions: any[] = session?.mapRegions?.length ? session.mapRegions : staticRegions;

  useEffect(() => {
    fetch(`/api/session/${id}`).then((r) => r.json()).then((data) => {
      setSession(data);
      setPlaced(data.placements || []);
    });
  }, [id]);

  const nearestRegion = (x: number, y: number) => regions.reduce((nearest: { region: any; distance: number }, region: any) => {
    const current = Math.hypot(region.x - x, region.y - y);
    return current < nearest.distance ? { region, distance: current } : nearest;
  }, { region: regions[0], distance: Number.POSITIVE_INFINITY }).region;

  const drop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!dragging || !regions.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const region = nearestRegion(x, y);
    setPlaced((items) => [...items.filter((item) => item.id !== dragging.id), { ...dragging, x, y, area: region.name, placed: true }]);
    setDragging(undefined);
  };

  const tray = useMemo(() => session?.stickers || [], [session]);
  const submit = async () => {
    await fetch(`/api/placement/submit?session=${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placements: placed }),
    });
    router.push(`/grade4/explain?session=${id}`);
  };

  if (!session) return <Shell title="准备拼贴…"><div className="animate-pulse rounded-3xl bg-white p-12" /></Shell>;

  return <Shell eyebrow="四年级 · 观察与推理" title="花 · 拼贴区" action={<Badge>探索进度　{placed.length} / 5</Badge>}>
    <FadeIn>
      <section className="overflow-hidden rounded-[2rem] border border-[#e9dfc9] bg-[#fff9ea] shadow-soft">
        <div className="flex gap-3 overflow-x-auto border-b border-[#eadfc5] px-4 py-3 md:px-6">
          {tray.map((sticker: any) => {
            const isPlaced = placed.some((item) => item.id === sticker.id);
            return <div key={sticker.id} draggable onDragStart={() => setDragging(sticker)} className={`flex min-w-[104px] cursor-grab flex-col items-center rounded-2xl border px-3 py-2 transition active:cursor-grabbing ${isPlaced ? 'border-[#b7d3b0] bg-[#edf5e8]' : 'border-[#e8dec7] bg-white hover:-translate-y-0.5'}`}>
              <img src={sticker.imageUrl} alt={sticker.name} className="h-12 w-12 rounded-xl object-cover" />
              <span className="mt-1 text-xs font-extrabold text-[#54705a]">{sticker.name}</span>
            </div>;
          })}
          <div className="flex min-w-[104px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#b9cfaf] px-3 py-2 text-center text-xs font-bold text-[#70936d]">＋<br />更多图标<br />待解锁</div>
        </div>
        <div className="px-4 pb-5 pt-3 text-center text-sm font-bold text-[#668160]">☆　把图标放到合适的位置</div>
      </section>
    </FadeIn>

    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <FadeIn delay={.08}>
        <section className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-[#dce8ca] shadow-soft">
          <div onDragOver={(event) => event.preventDefault()} onDrop={drop} className="relative aspect-[4/3] w-full bg-cover bg-center" style={{ backgroundImage: `url(${session.stylizedSceneImage || session.sceneImage || '/school-map.png'})` }}>
            <div className="absolute inset-0 bg-[#fff4c8]/10" />
            <div className="absolute left-4 top-4 rounded-2xl bg-white/95 px-4 py-2 text-sm font-extrabold text-[#668160] shadow">☆ 探索进度　<span className="text-[#26413c]">{placed.length} / 5</span></div>
            {regions.map((region) => <div key={region.id} title={region.description} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl px-6 py-2 text-sm font-extrabold text-white shadow-md" style={{ left: `${region.x}%`, top: `${region.y}%`, background: region.color }}>{region.name}</div>)}
            {placed.map((item) => <motion.div key={item.id} drag dragMomentum={false} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-2xl border-2 border-white bg-white/90 p-1 shadow-lg" style={{ left: `${item.x}%`, top: `${item.y}%` }}>
              <img src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-xl object-cover" /><div className="px-1 text-center text-[10px] font-extrabold text-[#54705a]">{item.name}</div>
            </motion.div>)}
          </div>
          <div className="flex items-center justify-end bg-[#fff9ea] px-4 py-3"><Button disabled={placed.length < 3} onClick={submit}>{placed.length < 3 ? `再放 ${3 - placed.length} 张` : '提交拼贴 → AI 对照'}</Button></div>
        </section>
      </FadeIn>

      <FadeIn delay={.16}>
        <aside className="rounded-[2rem] border border-[#e9dfc9] bg-[#fffdf6] p-5 shadow-soft">
          <h2 className="text-xl font-extrabold text-[#6b9a69]">一年级任务</h2>
          <div className="mt-3 rounded-2xl border border-[#e5e3d5] bg-white p-4 text-sm leading-7 text-[#55705c]">找到身边的自然小伙伴<br /><span className="font-extrabold">花　蝴蝶　树叶</span><br />看 → 拍 → 带回</div>
          <h2 className="mt-6 text-xl font-extrabold text-[#6b9a69]">一年级带回</h2>
          <div className="mt-3 space-y-2">{tray.slice(0, 5).map((sticker: any) => <div key={sticker.id} className="flex items-center gap-2 rounded-2xl border border-[#e8e5d8] bg-white p-2"><img src={sticker.imageUrl} className="h-10 w-10 rounded-xl object-cover" /><span className="flex-1 text-xs font-bold text-[#5c746b]">{sticker.name}</span><span className="text-[#87a980]">→</span><span className="rounded-xl bg-[#edf5e8] px-3 py-2 text-xs font-extrabold text-[#6b9a69]">{placed.find((item) => item.id === sticker.id)?.area || '待放置'}</span></div>)}</div>
          <div className="mt-4 rounded-xl bg-[#edf5e8] px-3 py-2 text-center text-xs font-bold text-[#6b9a69]">AI 已转换为可用图标</div>
        </aside>
      </FadeIn>
    </div>
  </Shell>;
}
