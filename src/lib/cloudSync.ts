import type {
  Attempt,
  StudySettings,
  TopicReview,
  TrainerSession,
  TrainerState,
} from '../domain/types'
import { questionById } from '../data/questions'
import { STATE_VERSION } from '../data/syllabus'
import { getActivity } from './statistics'
import { isTrainerState } from './storage'
import { supabase } from './supabase'

export interface RemoteSnapshot {
  state: TrainerState
  revision: number
}

export type CloudPushResult =
  | { kind: 'ok'; revision: number }
  | { kind: 'conflict'; revision: number }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isStudySettings(value: unknown): value is StudySettings {
  return (
    isRecord(value) &&
    typeof value.examDate === 'string' &&
    typeof value.weeklyMinutes === 'number' &&
    isStringArray(value.studyDays) &&
    typeof value.targetScore === 'number' &&
    typeof value.reducedMotion === 'boolean' &&
    typeof value.showExplanations === 'boolean'
  )
}

function isTopicReview(value: unknown): value is TopicReview {
  return (
    isRecord(value) &&
    typeof value.topicId === 'string' &&
    typeof value.level === 'number' &&
    typeof value.dueAt === 'string' &&
    (value.lastReviewedAt === undefined ||
      typeof value.lastReviewedAt === 'string') &&
    (value.lastResult === undefined ||
      value.lastResult === 'correct' ||
      value.lastResult === 'incorrect')
  )
}

function isReviews(value: unknown): value is Record<string, TopicReview> {
  return (
    isRecord(value) &&
    Object.values(value).every((review) => isTopicReview(review))
  )
}

function isSession(value: unknown): value is TrainerSession {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.mode === 'string' &&
    typeof value.title === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.startedAt === 'string' &&
    Array.isArray(value.questions) &&
    isRecord(value.answers) &&
    isStringArray(value.flagged) &&
    typeof value.immediateFeedback === 'boolean' &&
    typeof value.submitted === 'boolean'
  )
}

function isAttempt(value: unknown): value is Attempt {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.sessionId === 'string' &&
    typeof value.mode === 'string' &&
    typeof value.title === 'string' &&
    typeof value.completedAt === 'string' &&
    typeof value.durationSeconds === 'number' &&
    Array.isArray(value.questions) &&
    isRecord(value.answers) &&
    isStringArray(value.flagged) &&
    Array.isArray(value.scores) &&
    isStringArray(value.reviewTopicIds)
  )
}

function sessionTimestamp(session: TrainerSession): string {
  return session.completedAt ?? session.startedAt
}

export function mergeTrainerStates(
  local: TrainerState,
  remote: TrainerState,
): TrainerState {
  const attempts = new Map(remote.attempts.map((attempt) => [attempt.id, attempt]))
  for (const attempt of local.attempts) attempts.set(attempt.id, attempt)

  const sessions = new Map(
    remote.sessions.map((session) => [session.id, session]),
  )
  for (const session of local.sessions) {
    const current = sessions.get(session.id)
    if (!current || sessionTimestamp(session) >= sessionTimestamp(current)) {
      sessions.set(session.id, session)
    }
  }

  const reviews: Record<string, TopicReview> = { ...remote.reviews }
  for (const [topicId, localReview] of Object.entries(local.reviews)) {
    const remoteReview = reviews[topicId]
    if (
      !remoteReview ||
      (localReview.lastReviewedAt ?? '') > (remoteReview.lastReviewedAt ?? '')
    ) {
      reviews[topicId] = localReview
    }
  }

  const mergedAttempts = [...attempts.values()]
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .slice(-200)
  const mergedSessions = [...sessions.values()]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-20)
  const settings =
    local.lastSavedAt >= remote.lastSavedAt ? local.settings : remote.settings
  const lastSavedAt = [local.lastSavedAt, remote.lastSavedAt]
    .sort((a, b) => b.localeCompare(a))[0]

  return {
    version: STATE_VERSION,
    sessions: mergedSessions,
    attempts: mergedAttempts,
    reviews,
    activity: getActivity(mergedAttempts, questionById),
    settings,
    lastSavedAt,
  }
}

function remoteState(
  profile: unknown,
  sessions: unknown[],
  attempts: unknown[],
): TrainerState | null {
  if (!isRecord(profile)) return null
  if (!isStudySettings(profile.settings) || !isReviews(profile.reviews)) {
    return null
  }
  const parsedSessions = sessions.filter(isSession)
  const parsedAttempts = attempts.filter(isAttempt)
  const candidate: TrainerState = {
    version: STATE_VERSION,
    sessions: parsedSessions,
    attempts: parsedAttempts,
    reviews: profile.reviews,
    activity: [],
    settings: profile.settings,
    lastSavedAt:
      typeof profile.last_saved_at === 'string'
        ? profile.last_saved_at
        : new Date(0).toISOString(),
  }
  return isTrainerState(candidate) ? candidate : null
}

export async function pullCloudState(
  userId: string,
): Promise<RemoteSnapshot | null> {
  if (!supabase) return null
  const [profileResult, sessionsResult, attemptsResult] = await Promise.all([
    supabase
      .from('trainer_profiles')
      .select('settings, reviews, last_saved_at, revision')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('trainer_sessions').select('payload').eq('user_id', userId),
    supabase.from('trainer_attempts').select('payload').eq('user_id', userId),
  ])
  const error = profileResult.error ?? sessionsResult.error ?? attemptsResult.error
  if (error) throw new Error(error.message)
  if (!profileResult.data) return null

  const profile = profileResult.data as unknown
  const sessionRows = (sessionsResult.data ?? []) as { payload: unknown }[]
  const attemptRows = (attemptsResult.data ?? []) as { payload: unknown }[]
  const state = remoteState(
    profile,
    sessionRows.map((row) => row.payload),
    attemptRows.map((row) => row.payload),
  )
  if (!state) throw new Error('El estado remoto no tiene un formato compatible.')
  const revision = isRecord(profile) && typeof profile.revision === 'number'
    ? profile.revision
    : 0
  return { state, revision }
}

export async function pushCloudState(
  state: TrainerState,
  expectedRevision: number,
): Promise<CloudPushResult> {
  if (!supabase) throw new Error('Supabase no está configurado.')
  const { data, error } = await supabase.rpc('sync_trainer_state', {
    p_expected_revision: expectedRevision,
    p_state: state,
  })
  if (error) throw new Error(error.message)
  if (!isRecord(data)) throw new Error('La sincronización no devolvió un resultado válido.')
  const revision = typeof data.revision === 'number' ? data.revision : 0
  return data.conflict === true
    ? { kind: 'conflict', revision }
    : { kind: 'ok', revision }
}
