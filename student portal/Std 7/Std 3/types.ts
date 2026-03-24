
export enum AppView {
  HOME = 'HOME',
  HOMEWORK = 'HOMEWORK',
  GAMES = 'GAMES',
  ATTENDANCE = 'ATTENDANCE',
  PARENT_DASHBOARD = 'PARENT_DASHBOARD',
  REPORT_CARD = 'REPORT_CARD'
}

export type SkillLevel = 'Developing' | 'Improving' | 'Active' | 'Star';

export type PlantStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface HomeworkItem {
  id: string;
  title: string;
  subject: 'English' | 'Math';
  isDone: boolean;
  completedAt?: string;
  attachments?: string[];
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  badges: Badge[];
  attendance: string[]; // ISO Dates
  skills: {
    reading: SkillLevel;
    writing: SkillLevel;
    participation: SkillLevel;
  };
  lastActiveDate?: string;
}

export interface BadgeCondition {
  type: 'xp' | 'streak' | 'homework' | 'games' | 'attendance';
  threshold: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
  condition?: BadgeCondition;
}

export interface TextbookChunk {
  id: string;
  subject: 'English' | 'Math' | 'Hindi' | 'Gujarati' | 'Activities';
  content: string;
  page: number;
  chapter: string;
  /** Optional: which book this chunk belongs to */
  bookId?: string;
}

/** RAG pipeline status exposed to the UI */
export interface RAGStatus {
  initialized: boolean;
  chunkCount: number;
  embeddingsReady: boolean;
  embeddingCount: number;
  embeddingProgress?: { done: number; total: number };
}

export interface TeacherMessage {
  id: string;
  sender: string;
  text: string;
  date: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  category: 'ai' | 'homework' | 'game' | 'attendance' | 'parent' | 'navigation';
  details: Record<string, unknown>;
  userId?: string;
}

export interface AppState {
  view: AppView;
  stats: UserStats;
  knowledgeBase: TextbookChunk[];
}
