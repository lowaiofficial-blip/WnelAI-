import React from 'react';
import { cn } from '../../lib/utils';
import { Zap } from 'lucide-react';

interface GoBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showSparkle?: boolean;
}

export function GoBadge({ size = 'sm', className, showSparkle = true }: GoBadgeProps) {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2'
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold tracking-wide rounded-full select-none",
        "bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20",
        "text-amber-300 border border-amber-500/40",
        "shadow-[0_0_12px_rgba(245,158,11,0.2)]",
        sizeClasses[size],
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        {showSparkle && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        )}
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
      </span>
      <span>🚀 Go</span>
    </span>
  );
}
