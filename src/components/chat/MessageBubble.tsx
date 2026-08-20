import React from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Edit2, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Message } from '../../types';
import { cn } from '../../lib/utils';
import { WnelLogo } from '../common/WnelLogo';

interface MessageBubbleProps {
  message: Message;
}

function CodeBlock({ match, children, className, ...props }: any) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative mt-4 mb-4 bg-[#18181b] rounded-xl overflow-hidden border border-white/10 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-xs text-zinc-400 font-mono lowercase">{match[1]}</span>
        <button 
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-all duration-300",
            copied 
              ? "text-green-400 bg-green-400/10 shadow-[0_0_10px_rgba(74,222,128,0.2)]" 
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          )}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Kopyala</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-[14px] leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);
  const isSafetyViolation = !isUser && message.content.includes('[[SAFETY_VIOLATION_ERROR]]');

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isSafetyViolation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full justify-start group"
      >
        <div className="max-w-[88%] md:max-w-[78%]">
          <div className="flex items-center gap-2 mb-2">
            <WnelLogo size="sm" />
            <span className="text-sm font-medium text-zinc-400">WnelAI</span>
          </div>

          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 text-red-100 rounded-2xl p-4 shadow-lg shadow-red-950/20 backdrop-blur-md">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mt-0.5">
              <AlertCircle className="w-5 h-5 text-red-400 stroke-[2.2]" />
            </div>
            <div className="flex-1 text-[14px] leading-relaxed">
              <p className="font-semibold text-red-300 text-[14.5px] m-0 mb-1">
                Oops! Something went wrong.
              </p>
              <p className="text-red-200/90 text-[13.5px] leading-normal m-0">
                Please try refreshing the page, and if the issue persists, contact support.
              </p>
              <p className="text-red-400/80 text-[12px] m-0 mt-2 pt-2 border-t border-red-500/15">
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4",
          isUser 
            ? "bg-white/10 text-white rounded-br-sm" 
            : "bg-transparent text-zinc-200"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <WnelLogo size="sm" />
            <span className="text-sm font-medium text-zinc-400">WnelAI</span>
          </div>
        )}
        
        <div className={cn("prose prose-invert max-w-none", isUser && "prose-p:leading-relaxed")}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed m-0">{message.content}</p>
          ) : (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock match={match} className={className} {...props}>{children}</CodeBlock>
                  ) : (
                    <code className="bg-white/10 rounded-md px-1.5 py-0.5 text-sm font-mono text-blue-200" {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Action Buttons for AI */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 p-1.5 rounded-lg transition-all duration-300",
                copied
                  ? "text-green-400 bg-green-400/10 shadow-[0_0_10px_rgba(74,222,128,0.2)]"
                  : "text-zinc-500 hover:text-white hover:bg-white/10"
              )}
              title="Kopyala"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-medium">Kopyalandı</span>
                </>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button 
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Yeniden oluştur"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Action Buttons for User */}
        {isUser && (
          <div className="flex items-center justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="p-1 text-zinc-400 hover:text-white transition-colors"
              title="Düzenle"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
