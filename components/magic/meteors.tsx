"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 20, className }: MeteorsProps) {
  const [meteors, setMeteors] = useState<Array<{ id: number; delay: number; duration: number; left: string; top: string }>>([]);

  useEffect(() => {
    const newMeteors = Array.from({ length: number }, (_, i) => ({
      id: i,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 2,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }));
    setMeteors(newMeteors);
  }, [number]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className="absolute h-px w-px rotate-[215deg] animate-meteor"
          style={{
            left: meteor.left,
            top: meteor.top,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
          }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-[#F9A825] to-transparent" />
        </div>
      ))}
      <style>{`
        @keyframes meteor {
          0% { transform: rotate(215deg) translateX(0); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: rotate(215deg) translateX(-500px); opacity: 0; }
        }
        .animate-meteor {
          animation: meteor linear infinite;
        }
      `}</style>
    </div>
  );
}