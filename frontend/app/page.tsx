import { LandingLink } from "@/components/custom/LandingLink";

export default async function LandingPage() {

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background locks/keys */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/6 blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-violet-500/8 blur-3xl translate-y-1/3 -translate-x-1/4" />
        {[
          { size: 72, top: "44px",    right: "12px",  rotate: "12deg",  opacity: 0.22, type: "lock" },
          { size: 42, top: "160px",   right: "64px",  rotate: "-8deg",  opacity: 0.13, type: "key"  },
          { size: 52, top: "42%",     left: "4px",    rotate: "22deg",  opacity: 0.12, type: "lock" },
          { size: 80, bottom:"140px", right: "4px",   rotate: "-15deg", opacity: 0.18, type: "key"  },
          { size: 36, bottom:"86px",  left: "24px",   rotate: "8deg",   opacity: 0.10, type: "lock" },
          { size: 56, top: "26%",     right: "22px",  rotate: "18deg",  opacity: 0.12, type: "lock" },
          { size: 30, top: "68%",     left: "40px",   rotate: "-10deg", opacity: 0.08, type: "key"  },
        ].map((c, i) => (
          <div key={i} style={{
            position: "absolute",
            top: c.top, bottom: c.bottom, left: c.left, right: c.right,
            opacity: c.opacity,
            transform: `rotate(${c.rotate})`,
            imageRendering: "pixelated",
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
          }}>
            {c.type === "lock" ? (
              <svg width={c.size} height={c.size} viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
                <rect x="4" y="0" width="8" height="2" fill="#9a9a9a"/>
                <rect x="3" y="1" width="2" height="7" fill="#b0b0b0"/>
                <rect x="11" y="1" width="2" height="7" fill="#b0b0b0"/>
                <rect x="4" y="0" width="1" height="1" fill="#c8c8c8"/>
                <rect x="11" y="0" width="1" height="1" fill="#c8c8c8"/>
                <rect x="1" y="6" width="14" height="1" fill="#f5c842"/>
                <rect x="0" y="7" width="16" height="12" fill="#d4960f"/>
                <rect x="1" y="7" width="14" height="11" fill="#e8aa18"/>
                <rect x="2" y="7" width="12" height="10" fill="#f0bc28"/>
                <rect x="1" y="7" width="2" height="10" fill="#f5cc44"/>
                <rect x="2" y="7" width="11" height="2" fill="#f8d458"/>
                <rect x="6" y="11" width="4" height="3" fill="#5a3000"/>
                <rect x="5" y="12" width="6" height="2" fill="#5a3000"/>
                <rect x="7" y="13" width="2" height="3" fill="#5a3000"/>
                <rect x="0" y="18" width="16" height="1" fill="#8b6000"/>
                <rect x="1" y="19" width="14" height="1" fill="#5a3e00"/>
                <rect x="14" y="7" width="2" height="11" fill="#c08010"/>
              </svg>
            ) : (
              <svg width={c.size * 0.5} height={c.size} viewBox="0 0 8 20" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
                <rect x="1" y="0" width="6" height="2" fill="#f5c842"/>
                <rect x="0" y="1" width="2" height="6" fill="#f0bc28"/>
                <rect x="6" y="1" width="2" height="6" fill="#c08010"/>
                <rect x="1" y="6" width="6" height="2" fill="#d4960f"/>
                <rect x="2" y="2" width="4" height="4" fill="#1a1008"/>
                <rect x="1" y="2" width="2" height="4" fill="#f8d458"/>
                <rect x="3" y="7" width="2" height="10" fill="#e8aa18"/>
                <rect x="3" y="7" width="1" height="10" fill="#f5cc44"/>
                <rect x="4" y="7" width="1" height="10" fill="#c08010"/>
                <rect x="5" y="11" width="2" height="2" fill="#d4960f"/>
                <rect x="5" y="15" width="2" height="2" fill="#d4960f"/>
                <rect x="3" y="17" width="2" height="2" fill="#c08010"/>
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        <span className="font-display text-xl font-bold text-foreground">
          Lock<span className="text-accent">In</span>
        </span>
        <LandingLink href="/login">
          <button className="px-4 py-2 text-sm font-medium text-foreground/80 rounded-xl border border-white/10 transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
            Sign in
          </button>
        </LandingLink>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col px-5 pt-10 pb-8">
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="font-display text-[2.75rem] font-bold tracking-tight leading-[1.08] mb-8">
            Place your stakes.{" "}
            <span className="text-accent">Accountability that pays off.</span>
          </h1>

          <LandingLink href="/register" className="w-full">
            <button className="w-full rounded-2xl bg-accent text-accent-foreground font-semibold py-4 text-base active:scale-[0.98] transition-transform">
              Start Now
            </button>
          </LandingLink>
        </div>

        {/* Features */}
        <div className="mt-8 border-t border-border/50">
          {[
            { n: "01", label: "Stake Money", desc: "Put 1–50 LC on the line. Real stakes = real motivation." },
            { n: "02", label: "Get Verified", desc: "A friend confirms your proof before you earn it back." },
            { n: "03", label: "Complete Your Goals", desc: "Finally follow through. No excuses, no extensions." },
          ].map((f) => (
            <div key={f.n} className="flex items-start gap-5 py-5 border-b border-border/50">
              <span className="font-number text-xs text-muted-foreground/40 mt-0.5 w-6 shrink-0">{f.n}</span>
              <div className="flex-1">
                <p className="font-display text-base font-bold text-foreground">{f.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
