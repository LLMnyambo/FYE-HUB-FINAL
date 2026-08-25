"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface NumberTickerProps {
  value: number;
  className?: string;
  duration?: number;
}

export function NumberTicker({
  value,
  className,
  duration = 2,
}: NumberTickerProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const endValue = value;
    const startValue = countRef.current;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const currentCount = Math.floor(progress * (endValue - startValue) + startValue);
      
      setCount(currentCount);
      countRef.current = currentCount;

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(endValue);
        countRef.current = endValue;
      }
    };

    requestAnimationFrame(updateCount);
  }, [isVisible, value, duration]);

  return (
    <span ref={elementRef} className={cn("font-bold", className)}>
      {count}
    </span>
  );
}