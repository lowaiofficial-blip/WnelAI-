import React from 'react';
import { motion } from 'motion/react';

export function TypingAnimation() {
  return (
    <div className="flex w-full justify-start py-2 px-1 select-none">
      <div className="flex items-center gap-3 py-1">
        {/* Solid white dot scaling up and down naturally without glow */}
        <motion.div
          className="w-3.5 h-3.5 rounded-full bg-white"
          animate={{
            scale: [0.75, 1.25, 0.75],
          }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}

