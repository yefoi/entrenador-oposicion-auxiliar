import { seoTopicById } from '../data/seoTopics'
import { topics } from '../data/syllabus'

const BLOCK_LABEL: Record<string, string> = {
  I: 'Organización y administración electrónica',
  II: 'Tecnología básica',
  III: 'Desarrollo de sistemas',
  IV: 'Sistemas, seguridad y comunicaciones',
}

export function TopicReviewPanel({ topicId }: { topicId: string }) {
  const topic = topics.find((item) => item.id === topicId)
  const seo = seoTopicById(topicId)
  if (!topic || !seo) return null
  const [, title, focus, slug] = seo

  return (
    <details className="topic-review">
      <summary>
        <span>Repaso de este tema</span>
        <small>{title}</small>
      </summary>
      <div className="topic-review__body">
        <p>
          <strong>{title}</strong> ({topic.id}) pertenece al Bloque {topic.blockId}:{' '}
          {BLOCK_LABEL[topic.blockId]}.
        </p>
        <p>{focus.charAt(0).toUpperCase() + focus.slice(1)}.</p>
        <p className="topic-review__note">
          <a href={`./temas/${slug}.html`}>
            Abrir la guía completa de este tema
            <span aria-hidden="true"> →</span>
          </a>
        </p>
      </div>
    </details>
  )
}
