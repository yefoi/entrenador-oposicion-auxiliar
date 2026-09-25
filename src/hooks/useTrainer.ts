import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type {
  Attempt,
  StudySettings,
  TrainerSession,
  TrainerState,
} from '../domain/types'
import { activeQuestions, questionById } from '../data/questions'
import {
  createDefaultState,
  loadTrainerState,
  parseImportedState,
  saveTrainerState,
  storageIsAvailable,
} from '../lib/storage'
import { scoreSession } from '../lib/scoring'
import { calculateBestStreak } from '../lib/minigames'
import {
  buildTopicStats,
  getActivity,
  getReviewQueue,
  getWeakTopics,
  updateTopicReviews,
} from '../lib/statistics'
import { selectAdaptiveQuestionIds } from '../lib/adaptive'
import { trackEvent } from '../lib/analytics'

const MAX_ATTEMPTS = 200
const MAX_SESSIONS = 20

type TrainerStore = {
  ownerId?: string | null
  state: TrainerState
  recovered: boolean
}

type TrainerAction =
  | {
      type: 'load'
      ownerId?: string | null
      state: TrainerState
      recovered: boolean
    }
  | {
      type: 'update'
      updater: (state: TrainerState) => TrainerState
      stamp?: boolean
    }

function trainerReducer(store: TrainerStore, action: TrainerAction): TrainerStore {
  if (action.type === 'load') {
    return {
      ownerId: action.ownerId,
      state: action.state,
      recovered: action.recovered,
    }
  }
  const next = action.updater(store.state)
  return {
    ...store,
    recovered: false,
    state: action.stamp === false
      ? next
      : { ...next, lastSavedAt: new Date().toISOString() },
  }
}

function uniqueIds(values: string[]): string[] {
  return [...new Set(values)]
}

export function useTrainer(ownerId?: string | null) {
  const initial = useMemo(() => loadTrainerState(ownerId), [ownerId])
  const [store, dispatch] = useReducer(trainerReducer, {
    ownerId,
    state: initial.state,
    recovered: initial.recovered,
  })
  const { state, recovered } = store
  const storageAvailable = useMemo(() => storageIsAvailable(), [])

  useEffect(() => {
    if (store.ownerId === ownerId) return
    const next = loadTrainerState(ownerId)
    dispatch({
      type: 'load',
      ownerId,
      state: next.state,
      recovered: next.recovered,
    })
  }, [ownerId, store.ownerId])

  useEffect(() => {
    if (store.ownerId !== ownerId) return
    saveTrainerState(state, ownerId)
  }, [ownerId, state, store.ownerId])

  const updateState = useCallback(
    (updater: (state: TrainerState) => TrainerState, stamp = true) => {
      dispatch({ type: 'update', updater, stamp })
    },
    [],
  )

  const stats = useMemo(
    () => buildTopicStats(state.attempts, questionById, state.reviews),
    [state.attempts, state.reviews],
  )
  const weakTopics = useMemo(() => getWeakTopics(stats), [stats])
  const adaptiveQuestionIds = useMemo(
    () => selectAdaptiveQuestionIds(activeQuestions, state.attempts, stats, 30),
    [state.attempts, stats],
  )
  const reviewQueue = useMemo(
    () => getReviewQueue(state.reviews),
    [state.reviews],
  )
  const activity = useMemo(
    () => getActivity(state.attempts, questionById),
    [state.attempts],
  )
  const activeSession = useMemo(
    () => state.sessions.find((session) => !session.submitted) ?? null,
    [state.sessions],
  )

  const addSession = useCallback((session: TrainerSession) => {
    updateState((current) => ({
      ...current,
      sessions: [
        ...current.sessions.filter((item) => item.id !== session.id),
        session,
      ].slice(-MAX_SESSIONS),
    }))
  }, [updateState])

  const answerQuestion = useCallback(
    (sessionId: string, questionId: string, answer?: number) => {
      updateState((current) => ({
        ...current,
        sessions: current.sessions.map((session) => {
          if (session.id !== sessionId || session.submitted) return session
          const answers = { ...session.answers }
          if (answer === undefined) delete answers[questionId]
          else answers[questionId] = answer
          return { ...session, answers }
        }),
      }))
    },
    [updateState],
  )

  const toggleFlag = useCallback((sessionId: string, questionId: string) => {
    updateState((current) => ({
      ...current,
      sessions: current.sessions.map((session) => {
        if (session.id !== sessionId || session.submitted) return session
        const flagged = session.flagged.includes(questionId)
          ? session.flagged.filter((id) => id !== questionId)
          : [...session.flagged, questionId]
        return { ...session, flagged }
      }),
    }))
  }, [updateState])

  const submitSession = useCallback(
    (sessionId: string, durationSeconds: number) => {
      const session = state.sessions.find((item) => item.id === sessionId)
      if (!session || session.submitted) return null
      const completedAt = new Date().toISOString()
      const scores = scoreSession(session, questionById)
      const reviewTopicIds = uniqueIds(
        session.questions
          .map((entry) => questionById.get(entry.questionId)?.topicId)
          .filter((topicId): topicId is string => Boolean(topicId)),
      )
      const attempt: Attempt = {
        id: `attempt-${sessionId}`,
        sessionId,
        mode: session.mode,
        title: session.title,
        completedAt,
        durationSeconds,
        scenarioBlock: session.scenarioBlock,
        minigameType: session.minigameType,
        selectionStrategy: session.selectionStrategy,
        ...(session.mode === 'minigame'
          ? {
              bestStreak: calculateBestStreak(
                session.questions,
                session.answers,
                questionById,
              ),
            }
          : {}),
        questions: session.questions,
        answers: { ...session.answers },
        flagged: [...session.flagged],
        scores,
        reviewTopicIds,
      }
      trackEvent('session_completed', {
        mode: session.mode,
        selection: session.selectionStrategy ?? 'random',
      })
      updateState((current) => {
        const attempts = [...current.attempts, attempt].slice(-MAX_ATTEMPTS)
        return {
          ...current,
          sessions: current.sessions.map((item) =>
            item.id === sessionId
              ? { ...item, submitted: true, completedAt }
              : item,
          ),
          attempts,
          activity: getActivity(attempts, questionById),
          reviews: updateTopicReviews(current.reviews, attempt, questionById),
        }
      })

      return attempt
    },
    [state.sessions, updateState],
  )

  const updateSettings = useCallback((settings: Partial<StudySettings>) => {
    updateState((current) => ({
      ...current,
      settings: { ...current.settings, ...settings },
    }))
  }, [updateState])

  const clearData = useCallback(() => {
    updateState(() => createDefaultState())
  }, [updateState])

  const importData = useCallback((text: string) => {
    const imported = parseImportedState(text)
    updateState(() => imported)
  }, [updateState])

  const replaceState = useCallback((next: TrainerState) => {
    updateState(() => next, false)
  }, [updateState])

  return {
    state,
    lastSavedAt: state.lastSavedAt,
    activeSession,
    stats,
    weakTopics,
    adaptiveQuestionIds,
    reviewQueue,
    reviews: Object.values(state.reviews),
    activity,
    recovered,
    storageAvailable,
    addSession,
    answerQuestion,
    toggleFlag,
    submitSession,
    updateSettings,
    clearData,
    importData,
    replaceState,
    questionCount: activeQuestions.length,
  }
}
