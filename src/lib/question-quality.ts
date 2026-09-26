import type { Question } from '../domain/types'

export type IssueKind =
  | 'absoluto'
  | 'longitud'
  | 'negacion'
  | 'muy-corta'
  | 'parecida'

export interface DistractorIssue {
  kind: IssueKind
  detail: string
  optionIndexes: number[]
}

const ABSOLUTOS =
  /\b(siempre|nunca|jam[aá]s|ningun[ao]s?|tod[oa]s|exclusivamente|[uú]nicamente|absolutamente|para siempre|imposible|indiscutible|evita por completo)\b/iu

const NEGACION = /\b(no|nunca|jam[aá]s|sin|ningun[ao])\b/iu

export const normalizeOption = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const median = (values: number[]) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const similarity = (a: string, b: string) => {
  const left = new Set(normalizeOption(a).split(' '))
  const right = new Set(normalizeOption(b).split(' '))
  if (!left.size || !right.size) return 0
  let shared = 0
  for (const word of left) if (right.has(word)) shared += 1
  return shared / Math.min(left.size, right.size)
}

const LITERAL = /^[A-Za-z][\w-]*\s*:|^[\d.,\s]+\s*(?:s|ms|bit|bits|bytes|Hz|kHz|MHz|GHz)?$|^[A-Z]{2,}$/

/** Headers, ports, commands and plain numbers cannot be shortened without
 * becoming a different answer, so the length rule does not apply to them. */
const allLiterals = (options: string[]) => options.every((text) => LITERAL.test(text.trim()))

/**
 * Detects distractors that can be eliminated without reading the statement,
 * which is what makes a question feel guessable.
 */
export function auditQuestion(question: Question): DistractorIssue[] {
  const issues: DistractorIssue[] = []
  const options = question.options
  const wrong = options
    .map((text, index) => ({ text, index }))
    .filter(({ index }) => index !== question.correctIndex)

  for (const { text, index } of wrong) {
    if (ABSOLUTOS.test(text)) {
      issues.push({
        kind: 'absoluto',
        detail: `Opción ${index + 1} usa un absoluto: "${text.slice(0, 60)}"`,
        optionIndexes: [index],
      })
    }
  }

  const correctLength = options[question.correctIndex].length
  const wrongLengths = wrong.map(({ text }) => text.length)
  const reference = median(wrongLengths)
  if (
    !allLiterals(options) &&
    reference > 0 &&
    correctLength > reference * 1.7 &&
    correctLength - reference > 18
  ) {
    issues.push({
      kind: 'longitud',
      detail: `La correcta mide ${correctLength} caracteres frente a ${Math.round(reference)} de media: se descarta por extensión`,
      optionIndexes: [question.correctIndex],
    })
  }

  const longest = Math.max(...options.map((text) => text.length))
  const shortest = Math.min(...options.map((text) => text.length))
  if (longest - shortest > 60 && shortest < 18) {
    const index = options.findIndex((text) => text.length === shortest)
    if (index !== question.correctIndex) {
      issues.push({
        kind: 'muy-corta',
        detail: `La opción ${index + 1} es demasiado breve (${shortest} caracteres)`,
        optionIndexes: [index],
      })
    }
  }

  const negated = options
    .map((text, index) => ({ text, index }))
    .filter(({ text }) => NEGACION.test(text))
  if (negated.length === 1) {
    issues.push({
      kind: 'negacion',
      detail: `Solo la opción ${negated[0].index + 1} está en negativo: se detecta por forma`,
      optionIndexes: [negated[0].index],
    })
  }

  for (let i = 0; i < options.length; i += 1) {
    for (let j = i + 1; j < options.length; j += 1) {
      if (similarity(options[i], options[j]) > 0.8) {
        issues.push({
          kind: 'parecida',
          detail: `Las opciones ${i + 1} y ${j + 1} son casi idénticas`,
          optionIndexes: [i, j],
        })
      }
    }
  }

  return issues
}

export const questionHasWeakDistractors = (question: Question) =>
  auditQuestion(question).length > 0

export const auditQuestions = (questions: Question[]) =>
  questions
    .map((question) => ({ question, issues: auditQuestion(question) }))
    .filter((entry) => entry.issues.length > 0)

export const countByKind = (questions: Question[]) => {
  const totals: Record<IssueKind, number> = {
    absoluto: 0,
    longitud: 0,
    negacion: 0,
    'muy-corta': 0,
    parecida: 0,
  }
  for (const question of questions) {
    for (const issue of auditQuestion(question)) totals[issue.kind] += 1
  }
  return totals
}
