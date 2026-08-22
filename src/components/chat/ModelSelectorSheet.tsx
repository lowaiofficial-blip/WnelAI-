import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, Brain, Zap, Clock, Lock } from 'lucide-react';
import { Model, AVAILABLE_MODELS } from '../../types';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface ModelSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: Model;
  onModelSelect: (model: Model) => void;
  thinkingCooldownUntil?: number;
  onThinkingLockedClick?: () => void;
}

export function ModelSelectorSheet({
  isOpen,
  onClose,
  selectedModel,
  onModelSelect,
  thinkingCooldownUntil = 0,
  onThinkingLockedClick
}: ModelSelectorSheetProps) {
  const { isGo } = useAuth();
  const isCooldownActive = !isGo && thinkingCooldownUntil > Date.now();

  const modelDetails = [
    {
      id: 'qwen/qwen-plus',
      displayName: 'Wnel3.7-Plus',
      subtitle: 'Hızlı & Çok Modlu',
      description: 'Qwen3.7 serisinde yer alan, metin ve çok modlu görevleri destekleyen yüksek performanslı büyük dil modeli.',
      icon: Zap,
      badge: 'Varsayılan',
      isThinking: false
    },
    {
      id: 'deepseek/deepseek-r1',
      displayName: 'Wnel3.8-Max (Düşünen)',
      subtitle: 'Derin Akıl Yürütme',
      description: 'En son teknoloji performans sunan, karmaşık mantık ve kodlama görevleri için özelleşmiş amiral gemisi.',
      icon: Brain,
      badge: isGo ? 'Go Sınırsız' : (isCooldownActive ? 'Kilitli (3s)' : '1 Kullanım/3s'),
      isThinking: true
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative z-10 w-full sm:max-w-md bg-[#121216] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden text-white select-none max-h-[85vh] flex flex-col"
        >
          {/* Mobile Handle Indicator */}
          <div className="sm:hidden w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-white/5">
            <h2 className="text-lg font-bold text-white tracking-wide">Modeller</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Model Options List */}
          <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
            {modelDetails.map((item) => {
              const matchedModel = AVAILABLE_MODELS.find(m => m.id === item.id) || AVAILABLE_MODELS[0];
              const isSelected = selectedModel.id === item.id;
              const isLocked = item.isThinking && isCooldownActive;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isLocked) {
                      if (onThinkingLockedClick) onThinkingLockedClick();
                      onClose();
                      return;
                    }
                    onModelSelect(matchedModel);
                    onClose();
                  }}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col gap-1.5 text-left group",
                    isSelected
                      ? "bg-[#1c1c24] border-white/20 shadow-lg shadow-black/40"
                      : "bg-[#16161b]/70 hover:bg-[#1c1c24]/50 border-white/5 hover:border-white/10",
                    isLocked && "opacity-75"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center border",
                        item.isThinking 
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      )}>
                        <item.icon className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="font-semibold text-[15px] text-white group-hover:text-sky-300 transition-colors">
                        {item.displayName}
                      </span>
                      {item.isThinking && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Selected Checkmark or Lock */}
                    <div className="flex items-center">
                      {isLocked ? (
                        <div className="flex items-center gap-1 text-amber-400 text-xs bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Kilitli</span>
                        </div>
                      ) : isSelected ? (
                        <Check className="w-5 h-5 text-blue-400 stroke-[3]" />
                      ) : null}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 font-normal leading-relaxed pr-4">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
