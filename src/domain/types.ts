export type BlockId = 'I' | 'II' | 'III' | 'IV'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionSource = 'generated' | 'adapted' | 'official'
export type MinigameType = 'flashcards' | 'speedrun' | 'weakness' | 'discard'
export type SessionMode = 'practice' | 'exam' | 'review' | 'minigame'
export type ExamPart = 1 | 2
export type AppView =
  | 'dashboard'
  | 'syllabus'
  | 'practice'
  | 'exam'
  | 'minigames'
  | 'reviews'
  | 'statistics'
  | 'plan'
  | 'settings'
  | 'results'

export interface Block {
  id: BlockId
  title: string
  shortTitle: string
  description: string
  accent: string
}

export interface Topic {
  id: string
  blockId: BlockId
  number: number
  title: string
  focus: string
}

export interface Question {
  id: string
  topicId: string
  blockId: BlockId
  statement: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  /**
   * One line per option saying why it is not the answer. Stored in the same
   * order as options and rotated with them, so never key this by index.
   */
  optionNotes?: [string, string, string, string]
  explanation: string
  difficulty: Difficulty
  source: QuestionSource
  sourceLabel: string
  sourceUrl?: string
  legalReference?: string
  reviewedOn: string
  active: boolean
}

export interface Scenario {
  id: 'III' | 'IV'
  blockId: 'III' | 'IV'
  title: string
  context: string
  tasks: string[]
}

export interface SessionQuestion {
  questionId: string
  part: ExamPart
}

export interface TrainerSession {
  id: string
  mode: SessionMode
  title: string
  createdAt: string
  startedAt: string
  expiresAt?: string
  completedAt?: string
  scenarioBlock?: 'III' | 'IV'
  minigameType?: MinigameType
  selectionStrategy?: 'random' | 'adaptive'
  questions: SessionQuestion[]
  reserveQuestionIds?: string[]
  scenarioReserveQuestionIds?: string[]
  answers: Record<string, number>
  flagged: string[]
  immediateFeedback: boolean
  submitted: boolean
}

export interface PartScore {
  part: ExamPart
  total: number
  correct: number
  wrong: number
  blank: number
  direct: number
  estimated: number
  threshold: number
  passed: boolean
}

export interface Attempt {
  id: string
  sessionId: string
  mode: SessionMode
  title: string
  completedAt: string
  durationSeconds: number
  scenarioBlock?: 'III' | 'IV'
  minigameType?: MinigameType
  selectionStrategy?: 'random' | 'adaptive'
  bestStreak?: number
  questions: SessionQuestion[]
  answers: Record<string, number>
  flagged: string[]
  scores: PartScore[]
  reviewTopicIds: string[]
}

export interface TopicReview {
  topicId: string
  level: number
  dueAt: string
  lastReviewedAt?: string
  lastResult?: 'correct' | 'incorrect'
}

export interface StudySettings {
  examDate: string
  weeklyMinutes: number
  studyDays: number[]
  targetScore: number
  reducedMotion: boolean
  showExplanations: boolean
}

export interface ActivityDay {
  date: string
  questions: number
  correct: number
  wrong: number
  blank: number
  minutes: number
}

export interface TrainerState {
  version: number
  /**
   * Set once the stored attempts and reviews have been recomputed against the
   * corrected answer key. Optional so states written before the regrade still
   * pass validation.
   */
  regradedAtKey?: string
  sessions: TrainerSession[]
  attempts: Attempt[]
  reviews: Record<string, TopicReview>
  activity: ActivityDay[]
  settings: StudySettings
  lastSavedAt: string
}

export interface TopicStat {
  topicId: string
  blockId: BlockId
  presented: number
  correct: number
  wrong: number
  blank: number
  adjustedScore: number
  accuracy: number
  lastPracticedAt?: string
  dueAt?: string
  status: 'untouched' | 'weak' | 'review' | 'steady' | 'strong'
}
