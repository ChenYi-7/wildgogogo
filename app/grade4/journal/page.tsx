'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shell, Card, Button, Badge } from '@/components/ui';
import { CampusMap } from '@/components/Map';

export default function Journal() {
  const id = useSearchParams().get('session') || '';
  const router = useRouter();
  const [s, setS] = useState<any>();
  const [tab, setTab] = useState('全部');
  const [area, setArea] = useState<string>();

  useEffect(() => { fetch(`/api/session/${id}`).then((r) => r.json()).then(setS); }, [id]);
  const placements = s?.placements || [];
  const evidences = s?.evidences || [];
  const explanations = s?.explanations || [];
  const logs = useMemo(() => {
    // Evidence is the source of truth: every uploaded image remains in the
    // journal, even if it was not placed or AI explanation failed.
    const evidenceRecords = evidences.map((evidence: any, index: number) => {
      const name = evidence.analysis?.name || evidence.label || `自然发现 ${index + 1}`;
      const placement = placements.find((item: any) => item.id === `sticker-${evidence.id}` || item.sourceUrl === evidence.imageUrl || item.name === name) || {};
      const explanation = explanations.find((item: any) => item.name === name) || {
        name,
        relation: `${name}适合在${placement.area || evidence.analysis?.areaSuggestion || '校园'}里生长或活动。`,
        detail: evidence.analysis?.description || '这张照片记录了今天的自然发现。',
        evidenceType: '今天观察到了',
      };
      return { explanation, placement, evidence, index, areaName: placement.area || evidence.analysis?.areaSuggestion || '尚未放置' };
    });
    // Keep compatibility with sessions created before evidence records were
    // added, where only placements may exist.
    const records = evidenceRecords.length ? evidenceRecords : placements.map((placement: any, index: number) => ({
      explanation: { name: placement.name || '自然发现', relation: `${placement.name || '这个发现'}适合在${placement.area || '校园'}里生长或活动。`, detail: `我们把${placement.name || '它'}放到了${placement.area || '校园'}。`, evidenceType: '今天观察到了' },
      placement,
      evidence: {},
      index,
      areaName: placement.area || '尚未放置',
    }));
    return records.filter((record: any) => !area || record.areaName === area);
  }, [explanations, placements, evidences, area]);
  if (!s) return <Shell title="加载自然日志…" />;

  const end = async () => {
    if (confirm('结束课程并删除本地课堂记录吗？图片会保留。')) {
      await fetch(`/api/session/${id}`, { method: 'DELETE' });
      router.push('/');
    }
  };

  return <Shell title="我们的自然日志" action={<Badge>{s.theme}</Badge>}>
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-[#e7e2d1] bg-[#fffdf6] px-4 py-3"><div className="text-xs text-[#8ca091]">记录</div><div className="mt-1 text-xl font-extrabold text-[#31584d]">{logs.length} 条</div></div>
      <div className="rounded-2xl border border-[#e7e2d1] bg-[#fffdf6] px-4 py-3"><div className="text-xs text-[#8ca091]">区域</div><div className="mt-1 text-xl font-extrabold text-[#31584d]">{new Set(logs.map((record: any) => record.areaName).filter((name: string) => name && name !== '尚未放置')).size} 处</div></div>
      <div className="rounded-2xl border border-[#e7e2d1] bg-[#fffdf6] px-4 py-3"><div className="text-xs text-[#8ca091]">共同完成</div><div className="mt-1 text-xl font-extrabold text-[#31584d]">低龄组 + 高龄组</div></div>
    </div>

    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <Card>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-extrabold text-[#31584d]">探索地图</h2><span className="text-xs text-[#8ca091]">点击区域筛选</span></div>
        <CampusMap imageUrl={s.sceneImage} mapRegions={s.mapRegions} selected={area} onAreaClick={setArea}>
          {placements.map((p: any) => <div key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#26413c] px-2 py-1 text-[10px] font-bold text-white shadow" style={{ left: `${p.x}%`, top: `${p.y}%` }}>{p.name}</div>)}
        </CampusMap>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#71867c]"><span>✓ 已记录区域</span><span>— 探索路线</span><span>▣ AI 提取的证据</span></div>
      </Card>

      <Card>
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-extrabold text-[#31584d]">自然日志</h2><p className="mt-1 text-xs text-[#8ca091]">时间 / 区域　　证据（AI提取）　　一年级观察　　四年级讲解</p></div></div>
        <div className="mb-4 flex gap-2">{['全部', '低龄贡献', '高龄贡献'].map((x) => <button key={x} onClick={() => setTab(x)} className={`rounded-full px-4 py-2 text-xs font-extrabold ${tab === x ? 'bg-[#6f9f70] text-white' : 'bg-[#edf4ec] text-[#57775e]'}`}>{x}</button>)}</div>
        <div className="space-y-3">
          {logs.length ? logs.map((record: any) => <div key={record.explanation.name + record.index} className="rounded-2xl border border-[#e8e5d8] bg-[#fffef9] p-3">
            <div className="grid gap-3 md:grid-cols-[86px_120px_1fr_1fr] md:items-center">
              <div className="text-xs text-[#668071]"><div>{record.evidence.createdAt ? new Date(record.evidence.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '今天'}</div><div className="mt-1 font-bold">{record.areaName}</div><div className="mt-1 text-[10px]">{record.placement.x != null ? `位置 ${Math.round(record.placement.x)}%, ${Math.round(record.placement.y)}%` : '尚未定位'}</div></div>
              <div className="flex items-center gap-2 rounded-xl bg-[#f2f7ed] p-2">{record.evidence.imageUrl ? <img src={record.evidence.stylizedImageUrl || record.evidence.imageUrl} className="h-12 w-12 rounded-lg object-cover" alt="" /> : <span className="text-2xl">🌿</span>}<span className="text-xs font-extrabold text-[#57775e]">{record.evidence.analysis?.name || record.explanation.name}</span></div>
              <div className="rounded-xl bg-[#edf5e8] px-3 py-2 text-xs leading-5 text-[#55705c]">{record.evidence.analysis?.description || `拍到${record.explanation.name}，留下今天的观察。`}</div>
              <div className="rounded-xl bg-[#eef7fb] px-3 py-2 text-xs leading-5 text-[#557078]">{record.explanation.detail || record.explanation.relation}</div>
            </div>
          </div>) : <div className="py-12 text-center text-sm text-[#8a9d91]">还没有匹配的记录</div>}
        </div>
      </Card>
    </div>

    <div className="mt-6 flex justify-between"><Button variant="outline" onClick={() => router.push('/')}>继续探索</Button><Button variant="danger" onClick={end}>结束课程</Button></div>
  </Shell>;
}
