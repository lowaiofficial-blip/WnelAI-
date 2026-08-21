import React from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Edit2, RotateCcw, Check, AlertCircle, Sparkles, Terminal, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { Message } from '../../types';
import { cn } from '../../lib/utils';
import { WnelLogo } from '../common/WnelLogo';

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
}

function CodeBlock({ match, children, className, ...props }: any) {
  const [copied, setCopied] = React.useState(false);
  const language = match?.[1] || 'code';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative my-4 bg-[#080d1a]/95 backdrop-blur-md rounded-2xl overflow-hidden border border-sky-500/20 shadow-xl shadow-black/50">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          {/* Terminal Dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70 border border-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70 border border-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 border border-emerald-500/40" />
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-mono lowercase">
            <Terminal className="w-3 h-3 text-sky-400" />
            <span>{language}</span>
          </div>
        </div>

        <button 
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer border",
            copied 
              ? "text-emerald-300 bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
              : "text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/10"
          )}
          title="Kodu Kopyala"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              <span className="font-semibold">Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Kopyala</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto text-[13.5px] font-mono leading-relaxed text-zinc-200">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
}

export function MessageBubble({ message, onRegenerate }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);
  const [liked, setLiked] = React.useState(false);
  const [disliked, setDisliked] = React.useState(false);
  const isSafetyViolation = !isUser && message.content.includes('[[SAFETY_VIOLATION_ERROR]]');

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (!disliked) setLiked(false);
  };

  if (isSafetyViolation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full justify-start group"
      >
        <div className="max-w-[90%] md:max-w-[78%]">
          <div className="flex items-center gap-2 mb-2">
            <WnelLogo size="sm" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">WnelAI</span>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">✦</span>
            </div>
          </div>

          <div className="flex items-start gap-3.5 bg-red-500/10 border border-red-500/25 text-red-100 rounded-2xl p-4.5 shadow-xl shadow-red-950/30 backdrop-blur-xl">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mt-0.5">
              <AlertCircle className="w-5 h-5 text-red-400 stroke-[2.2]" />
            </div>
            <div className="flex-1 text-[14px] leading-relaxed">
              <p className="font-semibold text-red-300 text-[14.5px] m-0 mb-1">
                Oops! Something went wrong.
              </p>
              <p className="text-red-200/90 text-[13px] leading-normal m-0">
                Please try refreshing the page, and if the issue persists, contact support.
              </p>
              <p className="text-red-400/80 text-[12px] m-0 mt-2.5 pt-2 border-t border-red-500/15">
                (Güvenlik ve topluluk kuralları gereğince oyun hilesi, cinsel, yasa dışı veya zararlı içerik talepleri işlenememektedir.)
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full group transition-all",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[88%] md:max-w-[76%] transition-all",
          isUser 
            ? "bg-gradient-to-br from-sky-900/30 via-blue-900/35 to-indigo-900/35 border border-sky-500/25 text-white rounded-3xl rounded-tr-md px-5 py-3.5 shadow-lg shadow-sky-950/20 backdrop-blur-md" 
            : "bg-transparent text-zinc-100 px-1 py-1"
        )}
      >
        {/* AI Signature Header */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2.5 select-none">
            <WnelLogo size="sm" withGlow={true} />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-wide">WnelAI</span>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-full border border-sky-500/25 flex items-center gap-0.5 shadow-sm shadow-sky-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                <span>✦</span>
              </span>
            </div>
          </div>
        )}
        
        {/* Markdown Content */}
        <div className={cn(
          "prose prose-invert max-w-none text-[15px] leading-relaxed",
          isUser && "prose-p:leading-relaxed prose-p:text-white"
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed m-0 font-normal">{message.content}</p>
          ) : (
            <>
              {message.content ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, ...props}: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <CodeBlock match={match} className={className} {...props}>{children}</CodeBlock>
                      ) : (
                        <code className="bg-sky-500/10 border border-sky-500/20 rounded-md px-1.5 py-0.5 text-[13.5px] font-mono text-sky-200" {...props}>
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="mb-3 leading-relaxed text-zinc-200">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc pl-5 my-2.5 space-y-1 text-zinc-200">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal pl-5 my-2.5 space-y-1 text-zinc-200">{children}</ol>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-2 border-sky-500/50 pl-4 py-1 my-3 bg-sky-500/5 rounded-r-xl italic text-zinc-300">
                          {children}
                        </blockquote>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-4 rounded-xl border border-white/10">
                          <table className="min-w-full divide-y divide-white/10 text-xs text-zinc-300">{children}</table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return <th className="px-4 py-2.5 bg-white/[0.05] text-left font-semibold text-white">{children}</th>;
                    },
                    td({ children }) {
                      return <td className="px-4 py-2 border-t border-white/5">{children}</td>;
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : null}
              {message.isStreaming && (
                <motion.span
                  className="inline-block w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] align-middle ml-1"
                  animate={{
                    scale: [0.85, 1.35, 0.85],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Action Buttons for AI (Like, Dislike, Copy, Regenerate) */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center flex-wrap gap-1.5 mt-3.5 pt-1.5 border-t border-white/[0.04] select-none">
            {/* Like Button */}
            <button 
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border",
                liked
                  ? "text-sky-300 bg-sky-500/20 border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.25)]"
                  : "text-zinc-400 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/10"
              )}
              title={liked ? "Beğeniyi Kaldır" : "Beğen"}
              aria-label="Beğen"
            >
              <ThumbsUp className={cn("w-3.5 h-3.5", liked ? "fill-sky-400 text-sky-300" : "text-zinc-400")} />
              <span className="hidden sm:inline text-[11px]">{liked ? "Beğenildi" : "Beğen"}</span>
            </button>

            {/* Dislike Button */}
            <button 
              onClick={handleDislike}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border",
                disliked
                  ? "text-red-300 bg-red-500/20 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                  : "text-zinc-400 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/10"
              )}
              title={disliked ? "Beğenmemeyi Kaldır" : "Beğenme"}
              aria-label="Beğenme"
            >
              <ThumbsDown className={cn("w-3.5 h-3.5", disliked ? "fill-red-400 text-red-300" : "text-zinc-400")} />
              <span className="hidden sm:inline text-[11px]">{disliked ? "Beğenilmedi" : "Beğenme"}</span>
            </button>

            {/* Copy Button */}
            <button 
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border",
                copied
                  ? "text-emerald-300 bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "text-zinc-400 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/10"
              )}
              title="Cevabı Kopyala"
              aria-label="Kopyala"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                  <span className="text-[11px] font-semibold text-emerald-300">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline text-[11px]">Kopyala</span>
                </>
              )}
            </button>

            {/* Regenerate Button */}
            {onRegenerate && (
              <button 
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/10 transition-all duration-200 cursor-pointer"
                title="Cevabı Yeniden Oluştur"
                aria-label="Yeniden Oluştur"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline text-[11px]">Yeniden Oluştur</span>
              </button>
            )}
          </div>
        )}
        
        {/* Action Buttons for User */}
        {isUser && (
          <div className="flex items-center justify-end gap-1.5 mt-2 select-none">
            <button 
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer",
                copied 
                  ? "text-emerald-300 bg-emerald-500/20" 
                  : "text-sky-200/70 hover:text-white hover:bg-white/10"
              )}
              title="Mesajı Kopyala"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300" />
                  <span className="text-[10px]">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px]">Kopyala</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
