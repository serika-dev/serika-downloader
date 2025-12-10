'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const shapes = [
  'circle',
  'square',
  'triangle',
  'blob1',
  'blob2',
];

const colors = [
  '#a855f7', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
];

export function BackgroundShapes() {
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    // Generate random shapes on mount to avoid hydration mismatch
    const newElements = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * 5,
      scale: 0.5 + Math.random() * 1.5,
    }));
    setElements(newElements);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className="absolute opacity-20 mix-blend-screen blur-3xl"
          style={{
            left: `${el.initialX}%`,
            top: `${el.initialY}%`,
            backgroundColor: el.color,
            width: '30vw',
            height: '30vw',
            borderRadius: el.shape === 'circle' ? '50%' : el.shape === 'blob1' ? '60% 40% 30% 70% / 60% 30% 70% 40%' : '30% 70% 70% 30% / 30% 30% 70% 70%',
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
            scale: [1, 1.2, 0.8, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: "linear",
            delay: el.delay,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
    </div>
  );
}
