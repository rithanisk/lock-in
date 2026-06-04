"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

function PixelLock({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 20"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
    >
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
  );
}

function TransitionLoader() {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
      style={{ background: "hsl(68,8%,6%)" }}
    >
      <style>{`
        @keyframes lock-bounce {
          0%   { transform: translateY(0px);   }
          50%  { transform: translateY(-14px); }
          100% { transform: translateY(0px);   }
        }
        @keyframes shadow-pulse {
          0%   { transform: scaleX(1);   opacity: 0.35; }
          50%  { transform: scaleX(0.7); opacity: 0.18; }
          100% { transform: scaleX(1);   opacity: 0.35; }
        }
        .lock-bounce {
          animation: lock-bounce 1s ease-in-out infinite;
        }
        .lock-shadow {
          animation: shadow-pulse 1s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-3">
        <div className="lock-bounce">
          <PixelLock size={96} />
        </div>
        <div
          className="lock-shadow w-12 h-2 rounded-full"
          style={{ background: "rgba(245,200,66,0.3)", filter: "blur(4px)" }}
        />
      </div>

    </div>,
    document.body
  );
}

export function LandingLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      router.push(href);
    }, 2000);
  };

  return (
    <>
      {loading && <TransitionLoader />}
      <div className={className} onClick={handleClick} style={{ cursor: "pointer" }}>
        {children}
      </div>
    </>
  );
}
