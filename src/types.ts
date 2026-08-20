export type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
};

export type Model = {
  id: string;
  name: string;
  description: string;
  disabled?: boolean;
};

export interface UserSettings {
  notificationsEnabled: boolean;
  pushEnabled: boolean;
  theme: 'dark' | 'light';
  soundEffects: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL?: string;
  bio?: string;
  role?: 'admin' | 'user';
  createdAt?: any;
  updatedAt?: any;
  lastSeenAt?: any;
  isBanned?: boolean;
  banReason?: string;
  settings?: UserSettings;
}

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'qwen/qwen-plus',
    name: '⚡ Hızlı',
    description: 'Qwen Plus (OpenRouter/Groq) - Anında ve akıcı hızlı yanıtlar.',
  },
  {
    id: 'deepseek/deepseek-r1',
    name: '🧠 Düşünen',
    description: 'DeepSeek R1 - Kodlama, algoritmalar ve karmaşık mantık için derin düşünme.',
  },
];

