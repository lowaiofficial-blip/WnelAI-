import React from 'react';
import { motion } from 'motion/react';

export function TypingAnimation() {
  return (
    <div className="flex w-full justify-start py-2 px-1 select-none">
      <div className="flex items-center gap-3 py-1">
        {/* ChatGPT style breathing/pulsing white dot */}
        <motion.div
          className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
          animate={{
            scale: [0.85, 1.35, 0.85],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}

