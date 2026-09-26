import { describe, it } from 'vitest'
import { activeQuestions } from '../data/questions'
import { auditQuestions, countByKind } from './question-quality'

/**
 * Report generator. Run it on demand with:
 *   AUDIT=1 npx vitest run src/lib/question-quality.audit.test.ts
 * It prints the worklist of questions whose distractors give them away.
 */
describe('auditoria del banco', () => {
  it.skipIf(!process.env.AUDIT)('informe', () => {
    const flagged = auditQuestions(activeQuestions)
    const totals = countByKind(activeQuestions)
    const mechanical = flagged.filter((entry) =>
      entry.issues.some(
        (issue) => issue.kind === 'longitud' || issue.kind === 'muy-corta',
      ),
    )
    const ambiguous = flagged.filter((entry) =>
      entry.issues.some((issue) => issue.kind === 'parecida'),
    )
    console.log('--- calidad del banco ---')
    console.log('preguntas:', activeQuestions.length)
    console.log('marcadas (heuristica ampla):', flagged.length)
    console.log('por tipo:', JSON.stringify(totals))
    console.log(
      'DEFECTO MECANICO (la correcta se delata por longitud):',
      mechanical.length,
    )
    for (const { question, issues } of mechanical) {
      const issue = issues.find((i) => i.kind === 'longitud')!
      console.log(`  ${question.id} ${question.difficulty} :: ${issue.detail}`)
    }
    console.log('POSIBLE AMBIGUEDAD (opciones casi iguales):', ambiguous.length)
    for (const { question, issues } of ambiguous) {
      const issue = issues.find((i) => i.kind === 'parecida')!
      console.log(`  ${question.id} :: ${issue.detail}`)
    }
  })
})
