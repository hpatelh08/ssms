/**
 * judging/types.ts
 * ─────────────────────────────────────────────────────
 * Shared type definitions for the Innovation Marathon
 * Judging Platform.
 */

export interface Judge {
  id: string;
  name: string;
  role: 'District Education Officer' | 'Government Official' | 'Senior Judge' | 'Panel Judge';
  district?: string;
  avatar?: string;
}

export interface ProjectTeam {
  id: string;
  teamName: string;
  school: string;
  district: string;
  members: string[];
  projectTitle: string;
  projectDescription: string;
  category: string;
  thumbnailUrl: string;
  videoUrl?: string;
  prototypeUrl?: string;
  tags: string[];
}

export interface EvaluationCriteria {
  id: string;
  label: string;
  description: string;
  maxScore: number;
}

export interface EvaluationScore {
  criteriaId: string;
  score: number;
}

export interface Evaluation {
  judgeId: string;
  projectId: string;
  scores: EvaluationScore[];
  totalScore: number;
  remarks: string;
  submittedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'judge' | 'ai';
  content: string;
  timestamp: number;
}

export type JudgingRoute = 'register' | 'dashboard' | 'project';
