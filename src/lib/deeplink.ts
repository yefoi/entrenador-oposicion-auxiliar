import type { AppView, BlockId } from '../domain/types'
import { topics } from '../data/syllabus'

const VIEWS: Record<string, AppView> = {
  panel: 'dashboard',
  temario: 'syllabus',
  practica: 'practice',
  test: 'practice',
  simulacro: 'exam',
  examen: 'exam',
  repasos: 'reviews',
  estadisticas: 'statistics',
  plan: 'plan',
  ajustes: 'settings',
  resultados: 'results',
  minijuegos: 'minigames',
}

const BLOCK_IDS = new Set<string>(['I', 'II', 'III', 'IV'])

export interface DeepLink {
  view?: AppView
  topicId?: string
  blockId?: BlockId
}

export function readDeepLink(search: string): DeepLink {
  if (typeof search !== 'string' || !search) return {}
  const params = new URLSearchParams(search)
  const link: DeepLink = {}

  const view = params.get('vista')
  if (view) {
    const mapped = VIEWS[view.toLowerCase()]
    if (mapped) link.view = mapped
  }

  const topic = params.get('tema')
  if (topic) {
    const match = topics.find(
      (item) => item.id.toLowerCase() === topic.trim().toLowerCase(),
    )
    if (match) link.topicId = match.id
  }

  const block = params.get('bloque')
  if (block) {
    const normalized = block.trim().toUpperCase()
    const roman = /^(I|II|III|IV)$/.test(normalized)
      ? normalized
      : ({ '1': 'I', '2': 'II', '3': 'III', '4': 'IV' } as const)[
          normalized as '1' | '2' | '3' | '4'
        ]
    if (roman && BLOCK_IDS.has(roman)) link.blockId = roman as BlockId
  }

  if (link.topicId && !link.view) link.view = 'practice'
  if (link.blockId && !link.view) link.view = 'practice'

  return link
}

export function currentSearch(): string {
  return typeof window === 'undefined' ? '' : window.location.search
}
