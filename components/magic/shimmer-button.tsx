"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  background?: string;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      className,
      children,
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      background = "linear-gradient(90deg, #1B5E20, #2E7D32)",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-md px-6 py-2 text-white transition-all hover:scale-105",
          className
        )}
        style={{ background }}
        {...props}
      >
        <div
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          style={{
            background: `linear-gradient(90deg, transparent, ${shimmerColor}${shimmerSize}, transparent)`,
            width: "100%",
            height: "100%",
          }}
        />
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";