"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface AnimatedGridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: any;
  numSquares?: number;
  className?: string;
  maxOpacity?: number;
  duration?: number;
  repeatDelay?: number;
}

export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  repeatDelay = 0.5,
  ...props
}: AnimatedGridPatternProps) {
  const id = useRef<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!id.current) {
      id.current = `grid-${Math.random().toString(36).substring(2, 9)}`;
    }
    setIsVisible(true);
  }, []);

  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id.current || "grid"}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id.current || "grid"})`} />
      {isVisible && (
        <svg className="absolute inset-0 h-full w-full">
          {Array.from({ length: numSquares }, (_, i) => (
            <rect
              key={i}
              width={width}
              height={height}
              x={Math.floor(Math.random() * 100) + "%"}
              y={Math.floor(Math.random() * 100) + "%"}
              className="transition-all duration-1000"
              style={{
                opacity: Math.random() * maxOpacity,
                animation: `pulse ${duration}s ${repeatDelay * i}s infinite`,
                transform: `scale(${0.5 + Math.random() * 0.5})`,
              }}
            />
          ))}
        </svg>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 1; }
        }
      `}</style>
    </svg>
  );
}