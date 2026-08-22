// Speech Recognition & Speech Synthesis Utility for WnelAI

// Helper to strip markdown, HTML, and code blocks for clean text-to-speech
export function cleanMarkdownForSpeech(markdownText: string): string {
  if (!markdownText) return '';
  return markdownText
    // Remove thinking blocks
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    // Remove emojis or special bracketed system tokens
    .replace(/\[\[.*?\]\]/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, 'Kod bloğu.')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove image tags
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove links
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove headers (# Header)
    .replace(/#{1,6}\s+(.*)/g, '$1')
    // Remove bold and italic (*text*, **text**, _text_)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove blockquotes
    .replace(/^\s*>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^---$/gm, '')
    // Remove list markers (*, -, 1.)
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Replace URL patterns
    .replace(/https?:\/\/\S+/gi, 'web bağlantısı')
    // Clean multiple line breaks and normalize spaces
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Split text into speakable sentence units for smooth progressive playback
export function splitIntoSentences(text: string): string[] {
  const cleaned = cleanMarkdownForSpeech(text);
  if (!cleaned) return [];

  // Match sentences ending in punctuation or clause boundaries
  const rawSentences = cleaned.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g) || [cleaned];
  
  return rawSentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// Check Speech Recognition support
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

// Check Speech Synthesis (TTS) support
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Find the best real Turkish voice - prioritizing calm, natural, masculine / deep Turkish voices
export function getBestVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const trVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('tr'));

  if (trVoices.length > 0) {
    // 1. Natural / Neural Male Turkish voices (e.g. Microsoft Tolga, Ahmet, Google tr Male)
    const maleNaturalVoice = trVoices.find(v => {
      const name = v.name.toLowerCase();
      return (
        name.includes('tolga') || 
        name.includes('ahmet') || 
        name.includes('male') || 
        name.includes('erkek') ||
        (name.includes('natural') && !name.includes('yelda') && !name.includes('emel'))
      );
    });
    if (maleNaturalVoice) return maleNaturalVoice;

    // 2. Google / Microsoft Turkish voice
    const naturalVoice = trVoices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes('natural') || name.includes('google') || name.includes('premium');
    });
    if (naturalVoice) return naturalVoice;

    // 3. Any Turkish voice
    return trVoices[0];
  }

  // Fallback to default system voice
  return voices.find(v => v.default) || voices[0] || null;
}

// Robust TTS Queue Manager to prevent race conditions and handle multi-chunk audio cleanly
export class TTSQueue {
  private queue: string[] = [];
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;
  private onErrorCallback?: (err: any) => void;
  private isDestroyed: boolean = false;

  constructor(options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }) {
    this.onStartCallback = options?.onStart;
    this.onEndCallback = options?.onEnd;
    this.onErrorCallback = options?.onError;

    // Pre-load voices if needed
    if (isSpeechSynthesisSupported() && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded into browser cache
      };
    }
  }

  public enqueueText(text: string): void {
    if (this.isDestroyed || !isSpeechSynthesisSupported()) return;

    const sentences = splitIntoSentences(text);
    if (sentences.length === 0) return;

    this.queue.push(...sentences);

    if (!this.isSpeaking) {
      this.playNext();
    }
  }

  private playNext(): void {
    if (this.isDestroyed || !isSpeechSynthesisSupported()) {
      this.isSpeaking = false;
      return;
    }

    if (this.queue.length === 0) {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
      return;
    }

    const nextSentence = this.queue.shift();
    if (!nextSentence) {
      this.playNext();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextSentence);
    utterance.lang = 'tr-TR';
    
    // Natural, deep, calm masculine vocal parameters
    utterance.pitch = 0.90; // Deep, calm, relaxed pitch
    utterance.rate = 0.98;  // Natural conversational rhythm
    utterance.volume = 1.0;

    const selectedVoice = getBestVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      if (this.isDestroyed) return;
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        if (this.onStartCallback) {
          this.onStartCallback();
        }
      }
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (this.isDestroyed) return;
      // Play next sentence seamlessly
      this.playNext();
    };

    utterance.onerror = (e: any) => {
      this.currentUtterance = null;
      // If speech was explicitly canceled via stop(), do not treat as fatal error
      if (e?.error === 'interrupted' || e?.error === 'canceled') {
        return;
      }
      console.warn('TTS item warning:', e);
      if (this.isDestroyed) return;
      this.playNext();
    };

    this.currentUtterance = utterance;
    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('SpeechSynthesis.speak failed:', err);
      if (this.onErrorCallback) this.onErrorCallback(err);
      this.playNext();
    }
  }

  public stop(): void {
    this.queue = [];
    this.isSpeaking = false;
    this.currentUtterance = null;

    if (isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.stop();
    this.onStartCallback = undefined;
    this.onEndCallback = undefined;
    this.onErrorCallback = undefined;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

// Standalone one-shot speech function for single messages
let standaloneUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(
  text: string, 
  onStart?: () => void, 
  onEnd?: () => void, 
  onError?: (err: any) => void
): () => void {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError(new Error('Tarayıcınız ses sentezleme (TTS) özelliğini desteklemiyor.'));
    return () => {};
  }

  stopSpeaking();

  const cleanText = cleanMarkdownForSpeech(text);
  if (!cleanText) {
    if (onEnd) onEnd();
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'tr-TR';
  utterance.pitch = 0.90; // Calm, deep masculine tone
  utterance.rate = 0.98;
  utterance.volume = 1.0;

  const selectedVoice = getBestVoice();
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    standaloneUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e: any) => {
    standaloneUtterance = null;
    if (e?.error !== 'interrupted' && e?.error !== 'canceled') {
      if (onError) onError(e);
    }
  };

  standaloneUtterance = utterance;
  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    if (onError) onError(err);
  }

  return () => {
    if (standaloneUtterance === utterance) {
      stopSpeaking();
    }
  };
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
      standaloneUtterance = null;
    } catch (err) {
      console.error('Error stopping speech:', err);
    }
  }
}

