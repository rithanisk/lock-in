"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return val;
}

function BarChart({ value, max, label }: { value: number; max: number; label: string }) {
  const [h, setH] = useState(0);
  const pct = Math.min(value / Math.max(max, 1), 1);

  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const dur = 1600;
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setH(pct * ease * 100);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 200);
    return () => clearTimeout(timer);
  }, [pct]);

  const count = useCountUp(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-number text-2xl font-bold text-accent">{count.toLocaleString()}</p>
      <div className="w-full h-14 rounded-xl overflow-hidden flex items-end" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="w-full rounded-xl transition-none"
          style={{
            height: `${Math.max(h, 4)}%`,
            background: "linear-gradient(to top, hsl(55,100%,50%), hsl(55,100%,35%))",
            opacity: 0.7,
          }} />
      </div>
      <p className="text-[10px] text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

function AnimatedLC({ value }: { value: number }) {
  const count = useCountUp(value);
  const segments = 12;
  const filled = Math.round((value / Math.max(value * 1.5, 1)) * segments);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-number text-2xl font-bold text-accent">{count.toLocaleString()}</p>
      <div className="flex gap-0.5 h-14 items-end w-full">
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className="flex-1 rounded-sm transition-none"
            style={{
              height: `${20 + Math.sin(i * 0.8) * 30 + (i % 3) * 15}%`,
              background: i < filled ? "hsl(55,100%,50%)" : "rgba(255,255,255,0.06)",
              opacity: i < filled ? 0.65 + i * 0.02 : 1,
              transitionDelay: `${i * 60}ms`,
            }} />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center leading-tight">LC on the line</p>
    </div>
  );
}

export function StatsSection({ completedStakes, resolvedStakes, totalUsers, totalLC }: {
  completedStakes: number;
  resolvedStakes: number;
  totalUsers: number;
  totalLC: number;
}) {
  return (
    <div className="mt-10 rounded-2xl border border-white/8 p-4"
      style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)" }}>
      <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground/50 mb-4">Live stats</p>
      <div className="grid grid-cols-3 gap-4 items-start">
        <BarChart value={completedStakes} max={resolvedStakes || 1} label="Stakes completed" />

        <div className="flex flex-col items-center gap-2">
          <div className="h-14 flex items-center justify-center">
            <PlainStat value={totalUsers} />
          </div>
          <p className="text-[10px] text-muted-foreground text-center leading-tight">Users joined</p>
        </div>

        <AnimatedLC value={totalLC} />
      </div>
    </div>
  );
}

function PlainStat({ value }: { value: number }) {
  const count = useCountUp(value);
  return <p className="font-number text-4xl font-bold text-accent">{count}</p>;
}
