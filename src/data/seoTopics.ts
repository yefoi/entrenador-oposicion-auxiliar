import type { SeoTopic } from '../../scripts/seo-topics.mjs'
import { topicSeo } from '../../scripts/seo-topics.mjs'

export type { SeoTopic }

const byId = new Map<string, SeoTopic>(topicSeo.map((row) => [row[0], row]))

export function seoTopicById(id: string): SeoTopic | undefined {
  return byId.get(id.toUpperCase())
}
