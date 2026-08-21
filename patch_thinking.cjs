const fs = require('fs');

const content = `import React from 'react';
import { motion } from 'motion/react';
import { Brain, Sparkles } from 'lucide-react';
import { WnelLogo } from '../common/WnelLogo';

interface ThinkingAnimationProps {
  query?: string;
}

export function ThinkingAnimation({ query }: ThinkingAnimationProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)] relative z-10">
            <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-sky-300 animate-pulse">
              WnelAI düşünüyor...
            </span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400/70" />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
      
      {/* Modern Shimmer Line */}
      <div className="w-48 h-0.5 rounded-full bg-indigo-500/10 overflow-hidden relative mt-1 ml-11">
        <motion.div 
          className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
          animate={{ x: ['-100%', '300%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
`;

fs.writeFileSync('src/components/chat/ThinkingAnimation.tsx', content);
console.log('ThinkingAnimation patched successfully');
