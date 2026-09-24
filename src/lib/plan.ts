import type { BlockId, StudySettings, TopicStat } from '../domain/types'
import { blocks, topics } from '../data/syllabus'

export interface PlanTask {
  id: string
  type: 'review' | 'learn' | 'test'
  title: string
  blockId: BlockId
  topicId?: string
  minutes: number
  completed: boolean
}

const blockOrder: BlockId[] = ['I', 'II', 'III', 'IV']

export function buildStudyPlan(
  settings: StudySettings,
  stats: TopicStat[],
  dayCount = 14,
  now = new Date(),
): PlanTask[] {
  const tasks: PlanTask[] = []
  const dueTopics = stats.filter(
    (stat) => stat.status === 'review' || stat.status === 'weak',
  )
  const untouched = topics.filter((topic) => {
    const stat = stats.find((item) => item.topicId === topic.id)
    return !stat || stat.presented === 0
  })
  const dailyMinutes = Math.max(
    20,
    Math.round(settings.weeklyMinutes / Math.max(1, settings.studyDays.length)),
  )
  const topicPool = [
    ...untouched,
    ...dueTopics
      .map((stat) => topics.find((topic) => topic.id === stat.topicId))
      .filter((topic): topic is (typeof topics)[number] => Boolean(topic)),
  ]

  for (let day = 0; day < dayCount; day += 1) {
    const date = new Date(now.getTime() + day * 24 * 60 * 60 * 1000)
    const weekday = date.getDay()
    if (!settings.studyDays.includes(weekday)) continue
    const firstTask = tasks.length
    const dueCount = Math.min(2, dueTopics.length)
    if (dueCount > 0 && day % 2 === 0) {
      dueTopics.slice(0, dueCount).forEach((stat, index) => {
        const topic = topics.find((item) => item.id === stat.topicId)
        if (topic) {
          tasks.push({
            id: `review-${day}-${index}`,
            type: 'review',
            title: `Repaso · ${topic.title}`,
            blockId: topic.blockId,
            topicId: topic.id,
            minutes: Math.max(8, Math.round(dailyMinutes * 0.25)),
            completed: false,
          })
        }
      })
    }
    if (tasks.length === firstTask) {
      const topic = topicPool[(day * 2) % Math.max(1, topicPool.length)]
      if (topic) {
        tasks.push({
          id: `learn-${day}`,
          type: 'learn',
          title: `Estudio · ${topic.title}`,
          blockId: topic.blockId,
          topicId: topic.id,
          minutes: Math.round(dailyMinutes * 0.6),
          completed: false,
        })
      }
    }
    if (day % 3 === 0) {
      const block = blockOrder[(day / 3) % blockOrder.length] ?? 'I'
      tasks.push({
        id: `test-${day}`,
        type: 'test',
        title: `Test de ${blocks.find((item) => item.id === block)?.shortTitle ?? 'repaso'}`,
        blockId: block,
        minutes: Math.max(8, Math.round(dailyMinutes * 0.3)),
        completed: false,
      })
    }
  }
  return tasks.slice(0, 24)
}

export function getPlanProgress(tasks: PlanTask[]): number {
  if (tasks.length === 0) return 0
  return Math.round(
    (tasks.filter((task) => task.completed).length / tasks.length) * 100,
  )
}
