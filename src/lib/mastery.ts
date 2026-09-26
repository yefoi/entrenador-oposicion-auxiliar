import type { Attempt, BlockId } from '../domain/types'
import { activeQuestions } from '../data/questions'
import { blocks, topics } from '../data/syllabus'

export interface MasteryReport {
  actividad: {
    intentos: number
    sesiones: number
    preguntasPresentadas: number
    diasActivos: number
  }
  cobertura: {
    temasTocados: number
    temasTotales: number
    preguntasVistas: number
    preguntasTotales: number
    porBloque: { blockId: BlockId; vistos: number; total: number }[]
  }
  dominio: {
    primeras: { presented: number; correct: number; accuracy: number }
    repeticiones: { presented: number; correct: number; accuracy: number }
    retencion: {
      recuperadas: number
      pendientes: number
      ratio: number
    }
  }
}

const ratio = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100) / 100

/**
 * Activity, coverage and mastery answer different questions, and mixing them
 * flatters the user. Activity is what you did, coverage is how much of the
 * syllabus you have touched, and mastery only counts a correct answer on a
 * question you had not seen before, or on a later revisit after getting it
 * wrong. A correct answer right after seeing the explanation is weaker evidence.
 */
export function getMasteryReport(attempts: Attempt[]): MasteryReport {
  const presented = new Set<string>()
  const days = new Set<string>()
  const sessions = new Set<string>()
  const byBlock = new Map<BlockId, Set<string>>()
  for (const block of blocks) byBlock.set(block.id, new Set())

  let firstPresented = 0
  let firstCorrect = 0
  let repeatPresented = 0
  let repeatCorrect = 0

  const wrongAtLeastOnce = new Set<string>()
  const recovered = new Set<string>()

  for (const attempt of attempts) {
    sessions.add(attempt.sessionId)
    days.add(attempt.completedAt.slice(0, 10))
    for (const entry of attempt.questions) {
      const answer = attempt.answers[entry.questionId]
      if (answer === undefined) continue
      const isFirst = !presented.has(entry.questionId)
      presented.add(entry.questionId)
      const question = activeQuestions.find(
        (item) => item.id === entry.questionId,
      )
      if (question) byBlock.get(question.blockId)?.add(question.id)
      const correct = question ? answer === question.correctIndex : false
      if (isFirst) {
        firstPresented += 1
        if (correct) firstCorrect += 1
        if (!correct) wrongAtLeastOnce.add(entry.questionId)
      } else {
        repeatPresented += 1
        if (correct) {
          repeatCorrect += 1
          if (wrongAtLeastOnce.has(entry.questionId)) {
            recovered.add(entry.questionId)
          }
        }
      }
    }
  }

  const totalBlockQuestions = new Map<BlockId, number>()
  for (const question of activeQuestions) {
    totalBlockQuestions.set(
      question.blockId,
      (totalBlockQuestions.get(question.blockId) ?? 0) + 1,
    )
  }

  const pendientes = wrongAtLeastOnce.size - recovered.size

  return {
    actividad: {
      intentos: attempts.length,
      sesiones: sessions.size,
      preguntasPresentadas: presented.size,
      diasActivos: days.size,
    },
    cobertura: {
      temasTocados: new Set(
        activeQuestions
          .filter((question) => presented.has(question.id))
          .map((question) => question.topicId),
      ).size,
      temasTotales: topics.length,
      preguntasVistas: presented.size,
      preguntasTotales: activeQuestions.length,
      porBloque: blocks.map((block) => ({
        blockId: block.id,
        vistos: byBlock.get(block.id)?.size ?? 0,
        total: totalBlockQuestions.get(block.id) ?? 0,
      })),
    },
    dominio: {
      primeras: {
        presented: firstPresented,
        correct: firstCorrect,
        accuracy: ratio(firstCorrect, firstPresented),
      },
      repeticiones: {
        presented: repeatPresented,
        correct: repeatCorrect,
        accuracy: ratio(repeatCorrect, repeatPresented),
      },
      retencion: {
        recuperadas: recovered.size,
        pendientes,
        ratio: ratio(recovered.size, wrongAtLeastOnce.size),
      },
    },
  }
}

export const emptyMasteryReport = (): MasteryReport => ({
  actividad: { intentos: 0, sesiones: 0, preguntasPresentadas: 0, diasActivos: 0 },
  cobertura: {
    temasTocados: 0,
    temasTotales: topics.length,
    preguntasVistas: 0,
    preguntasTotales: activeQuestions.length,
    porBloque: blocks.map((block) => ({ blockId: block.id, vistos: 0, total: 0 })),
  },
  dominio: {
    primeras: { presented: 0, correct: 0, accuracy: 0 },
    repeticiones: { presented: 0, correct: 0, accuracy: 0 },
    retencion: { recuperadas: 0, pendientes: 0, ratio: 0 },
  },
})
