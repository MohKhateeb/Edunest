'use client';

import { useEffect, useState, useRef } from 'react';

export default function AnimatedCounter({ 
  from = 0, 
  to, 
  duration = 2 
}: { 
  from?: number; 
  to: number; 
  duration?: number; 
}) {
  const [count, setCount] = useState(from);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
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

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / (duration * 1000), 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - percentage, 3);
      
      setCount(Math.floor(from + (to - from) * easeOut));
      
      if (percentage < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(to);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isVisible, from, to, duration]);

  // Format to Arabic numerals correctly if the app is in Arabic, 
  // but since we are using Arabic layout, we might just want to 
  // format it nicely with commas if needed. For now, basic formatting.
  return (
    <span ref={elementRef}>
      {count.toLocaleString('ar-EG')}
    </span>
  );
}
