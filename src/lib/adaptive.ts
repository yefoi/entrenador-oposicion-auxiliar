import type { Attempt, Question, TopicStat } from '../domain/types'

interface QuestionHistory {
  presented: number
  correct: number
  wrong: number
  blank: number
  lastSeenAt?: string
}

function getOutcome(
  attempt: Attempt,
  question: Question,
): 'correct' | 'wrong' | 'blank' {
  const answer = attempt.answers[question.id]
  if (answer === undefined) return 'blank'
  return answer === question.correctIndex ? 'correct' : 'wrong'
}

function buildHistory(
  attempts: Attempt[],
  questionById: Map<string, Question>,
): Map<string, QuestionHistory> {
  const history = new Map<string, QuestionHistory>()
  for (const attempt of attempts) {
    for (const entry of attempt.questions) {
      const question = questionById.get(entry.questionId)
      if (!question) continue
      const current = history.get(question.id) ?? {
        presented: 0,
        correct: 0,
        wrong: 0,
        blank: 0,
      }
      const outcome = getOutcome(attempt, question)
      current.presented += 1
      if (outcome === 'correct') current.correct += 1
      if (outcome === 'wrong') current.wrong += 1
      if (outcome === 'blank') current.blank += 1
      if (!current.lastSeenAt || attempt.completedAt > current.lastSeenAt) {
        current.lastSeenAt = attempt.completedAt
      }
      history.set(question.id, current)
    }
  }
  return history
}

function topicPriority(stat: TopicStat | undefined): number {
  if (!stat || stat.status === 'untouched') return 3
  if (stat.status === 'weak') return 5
  if (stat.status === 'review') return 4
  if (stat.status === 'steady') return 2
  return 1
}

function questionPriority(
  question: Question,
  history: QuestionHistory | undefined,
  stat: TopicStat | undefined,
): number {
  const presented = history?.presented ?? 0
  const accuracy = presented === 0 ? 0 : (history?.correct ?? 0) / presented
  const errorRate = presented === 0 ? 0 : (history?.wrong ?? 0) / presented
  const unseenBonus = presented === 0 ? 5 : 0
  const weakBonus = accuracy < 0.6 && presented > 0 ? 3 : 0
  const dueBonus = stat?.status === 'review' ? 2 : 0
  const blankBonus = (history?.blank ?? 0) > 0 ? 1 : 0
  const difficultyBonus = question.difficulty === 'hard' ? 0.5 : 0
  return (
    unseenBonus +
    weakBonus +
    dueBonus +
    blankBonus +
    difficultyBonus +
    errorRate * 4
  )
}

export function selectAdaptiveQuestionIds(
  allQuestions: Question[],
  attempts: Attempt[],
  stats: TopicStat[],
  count: number,
): string[] {
  const questionById = new Map(
    allQuestions.map((question) => [question.id, question]),
  )
  const history = buildHistory(attempts, questionById)
  const statByTopic = new Map(stats.map((stat) => [stat.topicId, stat]))
  const grouped = new Map<string, Question[]>()
  for (const question of allQuestions) {
    if (!question.active) continue
    const group = grouped.get(question.topicId) ?? []
    group.push(question)
    grouped.set(question.topicId, group)
  }

  const topicOrder = [...grouped.keys()].sort((a, b) => {
    const priority =
      topicPriority(statByTopic.get(b)) - topicPriority(statByTopic.get(a))
    return priority || a.localeCompare(b)
  })
  const orderedGroups = new Map<string, Question[]>()
  for (const topicId of topicOrder) {
    const group = grouped.get(topicId) ?? []
    orderedGroups.set(
      topicId,
      group.sort((a, b) => {
        const priority =
          questionPriority(
            b,
            history.get(b.id),
            statByTopic.get(b.topicId),
          ) -
          questionPriority(
            a,
            history.get(a.id),
            statByTopic.get(a.topicId),
          )
        return priority || a.id.localeCompare(b.id)
      }),
    )
  }

  const selected: string[] = []
  let round = 0
  while (selected.length < Math.max(0, count)) {
    let added = false
    for (const topicId of topicOrder) {
      const question = orderedGroups.get(topicId)?.[round]
      if (!question) continue
      selected.push(question.id)
      added = true
      if (selected.length >= count) break
    }
    if (!added) break
    round += 1
  }
  return selected
}
