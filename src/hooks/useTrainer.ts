import { useCallback, useEffect, useMemo, useState } from 'react'
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

const MAX_ATTEMPTS = 200
const MAX_SESSIONS = 20

function uniqueIds(values: string[]): string[] {
  return [...new Set(values)]
}

export function useTrainer() {
  const initial = useMemo(() => loadTrainerState(), [])
  const [state, setState] = useState<TrainerState>(initial.state)
  const [recovered, setRecovered] = useState(initial.recovered)
  const storageAvailable = useMemo(() => storageIsAvailable(), [])

  useEffect(() => {
    saveTrainerState(state)
  }, [state])

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
    setState((current) => ({
      ...current,
      sessions: [
        ...current.sessions.filter((item) => item.id !== session.id),
        session,
      ].slice(-MAX_SESSIONS),
    }))
  }, [])

  const answerQuestion = useCallback(
    (sessionId: string, questionId: string, answer?: number) => {
      setState((current) => ({
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
    [],
  )

  const toggleFlag = useCallback((sessionId: string, questionId: string) => {
    setState((current) => ({
      ...current,
      sessions: current.sessions.map((session) => {
        if (session.id !== sessionId || session.submitted) return session
        const flagged = session.flagged.includes(questionId)
          ? session.flagged.filter((id) => id !== questionId)
          : [...session.flagged, questionId]
        return { ...session, flagged }
      }),
    }))
  }, [])

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
      setState((current) => {
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
    [state.sessions],
  )

  const updateSettings = useCallback((settings: Partial<StudySettings>) => {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, ...settings },
    }))
  }, [])

  const clearData = useCallback(() => {
    setState(createDefaultState())
    setRecovered(false)
  }, [])

  const importData = useCallback((text: string) => {
    const imported = parseImportedState(text)
    setState(imported)
    setRecovered(false)
  }, [])

  return {
    state,
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
    questionCount: activeQuestions.length,
  }
}
