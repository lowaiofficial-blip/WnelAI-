import React from 'react';
import { motion } from 'motion/react';
import { WnelLogo } from '../common/WnelLogo';

export function TypingAnimation() {
  return (
    <div className="flex w-full justify-start mt-2">
      <div className="max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 bg-transparent text-zinc-200">
        <div className="flex items-center gap-2 mb-2">
          <WnelLogo size="sm" />
          <span className="text-sm font-medium text-zinc-400">WnelAI</span>
        </div>
        <div className="flex items-center h-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5"
          >
            <span className="text-[15px] font-medium text-zinc-300">Yazıyor</span>
            <span className="flex gap-0.5 mt-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 h-1 bg-zinc-300 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
