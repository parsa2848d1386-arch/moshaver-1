// ===== MESSAGE TYPES =====
export interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
  mood?: string;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  reactions?: Record<string, string[]>; // emoji -> userId[]
  isPinned?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  memoryTag?: string;
  toneScore?: ToneScore;
}

export interface ToneScore {
  level: 'safe' | 'caution' | 'danger';
  score: number; // 0-100
  suggestion?: string;
  nvcVersion?: string;
}

// ===== USER TYPES =====
export interface UserSettings {
  aiModel: string;
  customApiKey: string;
  customModelName: string;
  theme: 'dark' | 'light';
  dndEnabled?: boolean;
  dndStart?: string;
  dndEnd?: string;
  notificationsEnabled?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  role: 'parsa' | 'melika';
  avatar: string;
  email: string;
  createdAt?: string;
  settings?: UserSettings;
  isTyping?: boolean;
  lastSeen?: string;
  moodStatus?: string;
}

// ===== CHAT TYPES =====
export type ChatType = 'shared' | 'private';
export type ActiveTab = 'chat' | 'settings' | 'insights' | 'engagement';

export interface ChatState {
  messages: Message[];
  inputText: string;
  chatType: ChatType;
  aiTyping: boolean;
  selectedMood: string;
  isConflictMode: boolean;
}

// ===== INSIGHTS TYPES =====
export interface RelationshipMemory {
  id?: string;
  date: string;
  createdAt: string;
  messageCount: number;
  memory: MemoryData;
}

export interface MemoryData {
  summary: string;
  dominant_emotions: {
    parsa: string[];
    melika: string[];
  };
  behavioral_patterns: string[];
  health_score: number;
  unresolved_issues: string[];
  positive_highlights: string[];
  gottman_ratio?: {
    positive: number;
    negative: number;
    ratio: number;
  };
}

// ===== ENGAGEMENT TYPES =====
export interface DailyQuestion {
  id: string;
  question: string;
  category: string;
  date: string;
  answers?: Record<string, string>;
}

export interface SharedGoal {
  id?: string;
  title: string;
  description: string;
  createdAt: string;
  deadline?: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  createdBy: string;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  date: string;
  type: 'anniversary' | 'birthday' | 'therapy' | 'date' | 'custom';
  recurring?: boolean;
  reminder?: boolean;
  createdBy: string;
}

export interface MemoryTag {
  id?: string;
  messageId: string;
  messageText: string;
  tag: string;
  date: string;
  taggedBy: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: 'breathing' | 'meditation' | 'communication' | 'gratitude' | 'conflict';
  duration: string;
  steps: string[];
}

// ===== CONFLICT MODE =====
export interface ConflictSession {
  id?: string;
  status: 'active' | 'resolved' | 'paused';
  topic: string;
  currentSpeaker: 'parsa' | 'melika';
  round: number;
  startedAt: string;
  messages: Message[];
}

// ===== TOAST =====
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  exiting?: boolean;
}

// ===== API TYPES =====
export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  lastId?: string;
}
