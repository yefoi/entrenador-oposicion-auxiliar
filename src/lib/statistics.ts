import type {
  ActivityDay,
  Attempt,
  BlockId,
  Question,
  TopicReview,
  TopicStat,
} from '../domain/types'
import { topics } from '../data/syllabus'

const DAY = 24 * 60 * 60 * 1000
const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60]

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY)
}

export function getQuestionOutcome(
  attempt: Attempt,
  questionId: string,
  questionById: Map<string, Question>,
): 'correct' | 'wrong' | 'blank' {
  const answer = attempt.answers[questionId]
  if (answer === undefined) return 'blank'
  const question = questionById.get(questionId)
  if (!question) return 'blank'
  return answer === question.correctIndex ? 'correct' : 'wrong'
}

export function buildTopicStats(
  attempts: Attempt[],
  questionById: Map<string, Question>,
  reviews: Record<string, TopicReview>,
  now = new Date(),
): TopicStat[] {
  return topics.map((topic) => {
    let presented = 0
    let correct = 0
    let wrong = 0
    let blank = 0
    let lastPracticedAt: string | undefined
    for (const attempt of attempts) {
      for (const entry of attempt.questions) {
        const question = questionById.get(entry.questionId)
        if (!question || question.topicId !== topic.id) continue
        presented += 1
        const outcome = getQuestionOutcome(attempt, question.id, questionById)
        if (outcome === 'correct') correct += 1
        if (outcome === 'wrong') wrong += 1
        if (outcome === 'blank') blank += 1
        if (!lastPracticedAt || attempt.completedAt > lastPracticedAt) {
          lastPracticedAt = attempt.completedAt
        }
      }
    }
    const adjustedScore =
      presented === 0 ? 0 : (correct - wrong / 3) / presented
    const accuracy = presented === 0 ? 0 : correct / presented
    const review = reviews[topic.id]
    const due = review ? new Date(review.dueAt) <= now : false
    let status: TopicStat['status'] = 'untouched'
    if (presented > 0) {
      if (adjustedScore < 0.4) status = 'weak'
      else if (adjustedScore < 0.6) status = due ? 'review' : 'steady'
      else if (adjustedScore >= 0.8) status = 'strong'
      else status = due ? 'review' : 'steady'
    }
    return {
      topicId: topic.id,
      blockId: topic.blockId,
      presented,
      correct,
      wrong,
      blank,
      adjustedScore,
      accuracy,
      lastPracticedAt,
      dueAt: review?.dueAt,
      status,
    }
  })
}

export function getWeakTopics(stats: TopicStat[]): TopicStat[] {
  return stats
    .filter((stat) => stat.status === 'weak' || stat.status === 'review')
    .sort(
      (a, b) => a.adjustedScore - b.adjustedScore || b.presented - a.presented,
    )
}

export function updateTopicReviews(
  reviews: Record<string, TopicReview>,
  attempt: Attempt,
  questionById: Map<string, Question>,
  now = new Date(),
): Record<string, TopicReview> {
  const next = { ...reviews }
  const topicResults = new Map<string, 'correct' | 'incorrect'>()
  for (const entry of attempt.questions) {
    const question = questionById.get(entry.questionId)
    if (!question) continue
    const outcome = getQuestionOutcome(attempt, question.id, questionById)
    const previous = topicResults.get(question.topicId)
    topicResults.set(
      question.topicId,
      outcome === 'correct' && previous !== 'incorrect'
        ? 'correct'
        : 'incorrect',
    )
  }
  for (const [topicId, result] of topicResults) {
    const current = next[topicId] ?? {
      topicId,
      level: 0,
      dueAt: dateKey(now),
    }
    const level =
      result === 'correct'
        ? Math.min(current.level + 1, REVIEW_INTERVALS.length - 1)
        : 0
    next[topicId] = {
      topicId,
      level,
      dueAt: dateKey(addDays(now, REVIEW_INTERVALS[level] ?? 1)),
      lastReviewedAt: now.toISOString(),
      lastResult: result,
    }
  }
  return next
}

export function getReviewQueue(
  reviews: Record<string, TopicReview>,
  now = new Date(),
): TopicReview[] {
  return Object.values(reviews)
    .filter((review) => new Date(review.dueAt) <= now)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
}

export function getActivity(
  attempts: Attempt[],
  questionById: Map<string, Question>,
): ActivityDay[] {
  const byDate = new Map<string, ActivityDay>()
  for (const attempt of attempts) {
    const key = attempt.completedAt.slice(0, 10)
    const day = byDate.get(key) ?? {
      date: key,
      questions: 0,
      correct: 0,
      wrong: 0,
      blank: 0,
      minutes: 0,
    }
    for (const entry of attempt.questions) {
      const questionId = entry.questionId
      const answer = attempt.answers[questionId]
      day.questions += 1
      if (answer === undefined) day.blank += 1
      else if (answer === questionById.get(questionId)?.correctIndex)
        day.correct += 1
      else day.wrong += 1
    }
    day.minutes += Math.max(1, Math.round(attempt.durationSeconds / 60))
    byDate.set(key, day)
  }
  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
}

export function getBlockStats(
  stats: TopicStat[],
): Record<BlockId, { total: number; correct: number; answered: number }> {
  const result: Record<
    BlockId,
    { total: number; correct: number; answered: number }
  > = {
    I: { total: 0, correct: 0, answered: 0 },
    II: { total: 0, correct: 0, answered: 0 },
    III: { total: 0, correct: 0, answered: 0 },
    IV: { total: 0, correct: 0, answered: 0 },
  }
  for (const stat of stats) {
    result[stat.blockId].total += 1
    result[stat.blockId].correct += stat.correct
    result[stat.blockId].answered += stat.presented
  }
  return result
}

export function calculateStreak(activity: ActivityDay[]): number {
  let streak = 0
  const current = new Date()
  for (let offset = 0; offset < 365; offset += 1) {
    const key = dateKey(new Date(current.getTime() - offset * DAY))
    const day = activity.find((item) => item.date === key)
    if (!day || day.questions === 0) {
      if (offset === 0) continue
      break
    }
    streak += 1
  }
  return streak
}
