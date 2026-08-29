'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shell, Card, Button, Badge, FadeIn } from '@/components/ui';
import { CampusMap } from '@/components/Map';

export default function Explain() {
  const id = useSearchParams().get('session') || '';
  const router = useRouter();
  const [s, setS] = useState<any>();
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => { fetch(`/api/session/${id}`).then((r) => r.json()).then(setS); }, [id]);
  if (!s) return <Shell title="正在对照真实发现…"><div className="animate-pulse rounded-3xl bg-white p-12" /></Shell>;

  const reading = s.task?.grade4?.reading || [];
  const regions = s.mapRegions || [];

  return <Shell title="AI 自然讲解" action={<Badge>{s.explanations?.length || 0} 个发现</Badge>}>
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <Card>
        <CampusMap imageUrl={s.sceneImage} mapRegions={regions}>
          {(s.placements || []).map((p: any) => <div key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#26413c] px-2 py-1 text-[10px] font-bold text-white" style={{ left: `${p.x}%`, top: `${p.y}%` }}>{p.name}</div>)}
        </CampusMap>
        <div className="mt-4 text-sm text-[#71867c]">拖拽留下的每一处，都成为今天的课堂证据。</div>
      </Card>
      <div className="space-y-4">
        <Card>
          <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-extrabold tracking-widest text-[#87a28b]">结合场景的自然知识</div><h2 className="mt-2 text-xl font-extrabold text-[#26413c]">{s.theme || '校园自然观察'}</h2></div><Badge>图片 × 主题</Badge></div>
          {s.task?.commonQuestion && <p className="mt-3 rounded-2xl bg-[#fff3da] px-4 py-3 text-sm font-bold text-[#6d684c]">{s.task.commonQuestion}</p>}
          <div className="mt-4 space-y-3">{reading.length ? reading.map((text: string, i: number) => <p key={i} className="text-sm leading-7 text-[#5c746b]">{text}</p>) : <p className="text-sm leading-7 text-[#5c746b]">观察图片中的光照、水分、土壤和植物分布，想一想不同环境为什么会成为动植物的家。</p>}</div>
          {regions.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{regions.map((region: any) => <span key={region.id} className="rounded-full bg-[#edf4ec] px-3 py-1 text-xs font-bold text-[#57775e]">{region.name}</span>)}</div>}
        </Card>
        {(s.explanations || []).map((e: any, i: number) => <FadeIn key={i} delay={i * .08}><Card><div className="flex items-start justify-between"><div><h3 className="text-lg font-extrabold">{e.name}</h3><p className="mt-1 font-bold text-[#57775e]">{e.relation}</p></div><Badge>{e.evidenceType}</Badge></div><p className="mt-3 text-sm leading-6 text-[#5c746b]">{e.detail}</p></Card></FadeIn>)}
        <Card><div className="flex gap-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="继续问问 AI，例如：为什么？" className="min-w-0 flex-1 rounded-xl border border-[#d6e1d2] px-3 py-2 text-sm" /><Button variant="soft" onClick={() => setAnswer('这是一个很好的问题！请结合今天的照片和地图，再观察一次。')}>提问</Button></div>{answer && <p className="mt-3 text-sm text-[#57775e]">{answer}</p>}</Card>
        <div className="flex justify-end"><Button onClick={() => router.push(`/grade4/journal?session=${id}`)}>进入自然日志 →</Button></div>
      </div>
    </div>
  </Shell>;
}
