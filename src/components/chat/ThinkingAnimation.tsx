import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WnelLogo } from '../common/WnelLogo';

const THINKING_STEPS = [
  { text: "Analiz ediyorum..." },
  { text: "Çözümü planlıyorum..." },
  { text: "Kaynakları inceliyorum..." },
  { text: "Cevabı hazırlıyorum..." }
];

export function ThinkingAnimation() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, THINKING_STEPS.length - 1));
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const currentStep = THINKING_STEPS[currentIndex];

  return (
    <div className="flex w-full justify-center mt-6 mb-2">
      <div className="flex flex-col items-center gap-3">
        <WnelLogo size="md" withGlow={true} />
        <div className="relative h-6 w-64 overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex items-center justify-center absolute w-full"
            >
              <span className="animate-shimmer text-[15px] font-medium tracking-wide text-zinc-300 whitespace-nowrap">
                {currentStep.text}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
