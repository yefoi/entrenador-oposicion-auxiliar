import { useMemo, useState } from 'react'
import type { AppView, StudySettings, TopicStat } from '../domain/types'
import { buildStudyPlan, getPlanProgress } from '../lib/plan'
import { blocks, topics } from '../data/syllabus'
import { Icon } from '../components/Icons'
import { Button, PageHeader, ProgressBar, Tag } from '../components/UI'

interface PlanPageProps {
  settings: StudySettings
  stats: TopicStat[]
  onUpdate: (settings: Partial<StudySettings>) => void
  onNavigate: (view: AppView) => void
}

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function PlanPage({
  settings,
  stats,
  onUpdate,
  onNavigate,
}: PlanPageProps) {
  const [localExamDate, setLocalExamDate] = useState(settings.examDate)
  const [localMinutes, setLocalMinutes] = useState(settings.weeklyMinutes)
  const tasks = useMemo(
    () =>
      buildStudyPlan(
        { ...settings, examDate: localExamDate, weeklyMinutes: localMinutes },
        stats,
      ),
    [localExamDate, localMinutes, settings, stats],
  )
  const progress = getPlanProgress(tasks)
  const toggleDay = (day: number) =>
    onUpdate({
      studyDays: settings.studyDays.includes(day)
        ? settings.studyDays.filter((item) => item !== day)
        : [...settings.studyDays, day],
    })
  const save = () =>
    onUpdate({ examDate: localExamDate, weeklyMinutes: localMinutes })
  const nextReview = stats.find(
    (item) => item.status === 'review' || item.status === 'weak',
  )

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Plan de estudio"
        title="Un plan que se adapta a ti."
        description="Ajusta tu carga realista, protege los repasos y deja margen para los imprevistos."
        action={
          <Button
            icon="play"
            onClick={() => onNavigate('practice')}
            variant="secondary"
          >
            Hacer una sesión
          </Button>
        }
      />
      <div className="plan-grid">
        <section className="panel plan-settings">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Tu compromiso</span>
              <h2>Configura el ritmo</h2>
            </div>
            <span className="panel-icon panel-icon-purple">
              <Icon name="calendar" size={20} />
            </span>
          </div>
          <label className="field-label">
            Fecha objetivo
            <input
              onChange={(event) => setLocalExamDate(event.target.value)}
              type="date"
              value={localExamDate}
            />
          </label>
          <label className="field-label">
            Minutos por semana
            <select
              onChange={(event) => setLocalMinutes(Number(event.target.value))}
              value={localMinutes}
            >
              <option value="180">3 horas · ritmo ligero</option>
              <option value="300">5 horas · recomendado</option>
              <option value="420">7 horas · intensivo</option>
              <option value="600">10 horas · sprint</option>
              <option value="900">15 horas · maratón</option>
            </select>
          </label>
          <div className="field-label">
            Días de estudio
            <div className="day-picker">
              {dayNames.map((day, index) => (
                <button
                  className={
                    settings.studyDays.includes(index) ? 'is-active' : ''
                  }
                  key={day}
                  onClick={() => toggleDay(index)}
                  type="button"
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="plan-save">
            <small>La distribución se recalcula con cada cambio.</small>
            <Button onClick={save} icon="check">
              Guardar plan
            </Button>
          </div>
          <div className="plan-warning">
            <Icon name="info" size={16} />
            <span>
              Un plan con margen es más sostenible que una hora extra cada día.
            </span>
          </div>
        </section>
        <section className="panel plan-overview">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Próximos 14 días</span>
              <h2>{tasks.length} momentos útiles</h2>
            </div>
            <span className="plan-progress-number">{progress}%</span>
          </div>
          <ProgressBar
            label="Progreso del plan"
            tone="purple"
            value={progress}
          />
          <div className="plan-summary">
            <div>
              <strong>
                {tasks.filter((task) => task.type === 'learn').length}
              </strong>
              <span>sesiones de estudio</span>
            </div>
            <div>
              <strong>
                {tasks.filter((task) => task.type === 'test').length}
              </strong>
              <span>tests rápidos</span>
            </div>
            <div>
              <strong>
                {tasks.filter((task) => task.type === 'review').length}
              </strong>
              <span>repasos</span>
            </div>
          </div>
          {nextReview ? (
            <div className="next-review">
              <span className="insight-label warn">Foco recomendado</span>
              <strong>
                {topics.find((topic) => topic.id === nextReview.topicId)?.focus}
              </strong>
              <small>
                {Math.round(nextReview.accuracy * 100)}% de acierto ·{' '}
                {Math.max(1, Math.round(nextReview.presented / 3))} sesión
                recomendada
              </small>
            </div>
          ) : (
            <div className="next-review">
              <span className="insight-label good">Todo al día</span>
              <strong>No hay repasos pendientes</strong>
              <small>Usa el tiempo para ampliar cobertura.</small>
            </div>
          )}
        </section>
      </div>
      <section className="panel plan-tasks">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Hoja de ruta</span>
            <h2>Sesiones sugeridas</h2>
          </div>
          <div className="plan-legend">
            <span>
              <i className="task-dot dot-learn" /> Estudio
            </span>
            <span>
              <i className="task-dot dot-test" /> Test
            </span>
            <span>
              <i className="task-dot dot-review" /> Repaso
            </span>
          </div>
        </div>
        <div className="task-list">
          {tasks.map((task) => (
            <div className="plan-task" key={task.id}>
              <span className={`task-type task-${task.type}`}>
                <Icon
                  name={
                    task.type === 'learn'
                      ? 'book'
                      : task.type === 'test'
                        ? 'clipboard'
                        : 'refresh'
                  }
                  size={16}
                />
              </span>
              <span className="task-copy">
                <small>
                  {task.type === 'learn'
                    ? 'ESTUDIAR'
                    : task.type === 'test'
                      ? 'TEST'
                      : 'REPASO'}{' '}
                  · {task.minutes} min
                </small>
                <strong>{task.title}</strong>
              </span>
              <Tag tone="neutral">
                {blocks.find((block) => block.id === task.blockId)?.shortTitle}
              </Tag>
              <button
                className="task-action"
                onClick={() =>
                  task.topicId ? onNavigate('practice') : onNavigate('exam')
                }
                type="button"
              >
                <Icon name="arrow" size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
