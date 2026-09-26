import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import type { AppView } from './domain/types'
import { activeQuestions, questionById } from './data/questions'
import { useTrainer } from './hooks/useTrainer'
import { hasSeenOnboarding } from './lib/storage'
import { currentSearch, readDeepLink } from './lib/deeplink'
import {
  createExamSession,
  createPracticeSession,
  type PracticeOptions,
} from './lib/session'
import { createMinigameSession, type MinigameOptions } from './lib/minigames'
import { AppShell } from './components/AppShell'
import { Onboarding } from './components/Onboarding'
import { RouteLoading } from './components/RouteLoading'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { DashboardPage } from './pages/DashboardPage'

const ExamSetupPage = lazy(() =>
  import('./pages/ExamSetupPage').then((m) => ({ default: m.ExamSetupPage })),
)
const PlanPage = lazy(() =>
  import('./pages/PlanPage').then((m) => ({ default: m.PlanPage })),
)
const PracticeSetupPage = lazy(() =>
  import('./pages/PracticeSetupPage').then((m) => ({
    default: m.PracticeSetupPage,
  })),
)
const ResultsPage = lazy(() =>
  import('./pages/ResultsPage').then((m) => ({ default: m.ResultsPage })),
)
const ReviewsPage = lazy(() =>
  import('./pages/ReviewsPage').then((m) => ({ default: m.ReviewsPage })),
)
const MinigamesPage = lazy(() =>
  import('./pages/MinigamesPage').then((m) => ({ default: m.MinigamesPage })),
)
const MinigameSessionPage = lazy(() =>
  import('./pages/MinigameSessionPage').then((m) => ({
    default: m.MinigameSessionPage,
  })),
)
const SessionPage = lazy(() =>
  import('./pages/SessionPage').then((m) => ({ default: m.SessionPage })),
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const StatisticsPage = lazy(() =>
  import('./pages/StatisticsPage').then((m) => ({ default: m.StatisticsPage })),
)
const SyllabusPage = lazy(() =>
  import('./pages/SyllabusPage').then((m) => ({ default: m.SyllabusPage })),
)

function App() {
  const trainer = useTrainer()
  const [showOnboarding, setShowOnboarding] = useState(
    () => !hasSeenOnboarding(),
  )
  const deepLink = useMemo(() => readDeepLink(currentSearch()), [])
  const [view, setView] = useState<AppView>(deepLink.view ?? 'dashboard')
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    null,
  )
  const [practiceTopicId, setPracticeTopicId] = useState<string | undefined>(
    deepLink.topicId,
  )
  const [practiceBlockId, setPracticeBlockId] = useState<
    'I' | 'II' | 'III' | 'IV' | undefined
  >(deepLink.blockId)

  const navigate = useCallback((next: AppView) => {
    setView(next)
    if (next !== 'results') setSelectedAttemptId(null)
    if (next !== 'practice') {
      setPracticeTopicId(undefined)
      setPracticeBlockId(undefined)
    }
  }, [])

  const startPractice = useCallback(
    (options: PracticeOptions) => {
      if (trainer.activeSession) {
        setView(
          trainer.activeSession.mode === 'minigame'
            ? 'minigames'
            : trainer.activeSession.mode === 'exam'
              ? 'exam'
              : 'practice',
        )
        return
      }
      const session = createPracticeSession(activeQuestions, options)
      trainer.addSession(session)
      setView('practice')
    },
    [trainer],
  )

  const startExam = useCallback(
    (scenario: 'III' | 'IV') => {
      if (trainer.activeSession) {
        setView(
          trainer.activeSession.mode === 'minigame'
            ? 'minigames'
            : trainer.activeSession.mode === 'exam'
              ? 'exam'
              : 'practice',
        )
        return
      }
      const session = createExamSession(activeQuestions, scenario)
      trainer.addSession(session)
      setView('exam')
    },
    [trainer],
  )

  const startMinigame = useCallback(
    (options: MinigameOptions) => {
      if (trainer.activeSession) {
        setView(
          trainer.activeSession.mode === 'minigame'
            ? 'minigames'
            : trainer.activeSession.mode === 'exam'
              ? 'exam'
              : 'practice',
        )
        return
      }
      const session = createMinigameSession(activeQuestions, options)
      trainer.addSession(session)
      setView('minigames')
    },
    [trainer],
  )

  const submitActive = useCallback(
    (durationSeconds: number) => {
      if (!trainer.activeSession) return
      const attempt = trainer.submitSession(
        trainer.activeSession.id,
        durationSeconds,
      )
      if (attempt) setSelectedAttemptId(attempt.id)
      setView('results')
    },
    [trainer],
  )

  const repeatWrong = useCallback(
    (questionIds: string[]) => {
      if (!questionIds.length) return
      startPractice({
        count: questionIds.length,
        wrongQuestionIds: questionIds,
        immediateFeedback: true,
        title: 'Repaso de errores',
      })
    },
    [startPractice],
  )

  const selectedAttempt = useMemo(
    () =>
      trainer.state.attempts.find(
        (attempt) => attempt.id === selectedAttemptId,
      ) ??
      trainer.state.attempts[trainer.state.attempts.length - 1] ??
      null,
    [selectedAttemptId, trainer.state.attempts],
  )
  const practiceSessionVisible =
    view === 'practice' && trainer.activeSession?.mode === 'practice'
  const examSessionVisible =
    view === 'exam' && trainer.activeSession?.mode === 'exam'
  const minigameSessionVisible =
    view === 'minigames' && trainer.activeSession?.mode === 'minigame'
  const { activeSession, answerQuestion, toggleFlag } = trainer
  const answerActive = useCallback(
    (questionId: string, answer?: number) => {
      if (activeSession) answerQuestion(activeSession.id, questionId, answer)
    },
    [activeSession, answerQuestion],
  )
  const flagActive = useCallback(
    (questionId: string) => {
      if (activeSession) toggleFlag(activeSession.id, questionId)
    },
    [activeSession, toggleFlag],
  )

  return (
    <div
      className={
        trainer.state.settings.reducedMotion ? 'app reduced-motion' : 'app'
      }
    >
      <AppShell
        activeSession={trainer.activeSession}
        onNavigate={navigate}
        view={view}
      >
        {trainer.recovered ? (
          <div className="recovery-banner">
            <strong>Recuperación local</strong>
            <span>
              Se ha restaurado una copia válida del progreso. Si no reconoces
              los datos, exporta o borra desde Ajustes.
            </span>
          </div>
        ) : null}
        {!trainer.storageAvailable ? (
          <div className="storage-banner">
            <strong>El navegador no permite guardar.</strong> La sesión seguirá
            funcionando, pero exporta tu progreso antes de cerrar.
          </div>
        ) : null}
        {trainer.storageAvailable && trainer.storageStatus === 'quota' ? (
          <div className="storage-banner">
            <strong>Almacenamiento local lleno.</strong> Exporta una copia desde
            Ajustes y borra los intentos antiguos para seguir guardando.
          </div>
        ) : null}
        {view === 'dashboard' ? (
          <DashboardPage
            activeSession={trainer.activeSession}
            attempts={trainer.state.attempts}
            onNavigate={navigate}
            settings={trainer.state.settings}
            stats={trainer.stats}
            weakTopics={trainer.weakTopics}
          />
        ) : null}
        {view !== 'dashboard' ? (
          <RouteErrorBoundary>
            <Suspense fallback={<RouteLoading />}>
              {view === 'syllabus' ? (
                <SyllabusPage
                  onStart={(topicId, blockId) => {
                    setPracticeTopicId(topicId)
                    setPracticeBlockId(blockId)
                    setView('practice')
                  }}
                  stats={trainer.stats}
                />
              ) : null}
              {view === 'minigames' && !minigameSessionVisible ? (
                <MinigamesPage
                  activeSession={trainer.activeSession}
                  onNavigate={navigate}
                  onStart={startMinigame}
                  reviewTopicIds={trainer.reviewQueue.map(
                    (review) => review.topicId,
                  )}
                  weakTopicIds={trainer.weakTopics
                    .filter((topic) => topic.status === 'weak')
                    .map((topic) => topic.topicId)}
                />
              ) : null}
              {view === 'minigames' &&
              minigameSessionVisible &&
              trainer.activeSession ? (
                <MinigameSessionPage
                  key={trainer.activeSession.id}
                  onAnswer={answerActive}
                  onExit={() => navigate('minigames')}
                  onFlag={flagActive}
                  onSubmit={submitActive}
                  questionById={questionById}
                  session={trainer.activeSession}
                />
              ) : null}
              {view === 'practice' && !practiceSessionVisible ? (
                <PracticeSetupPage
                  initialBlockId={practiceBlockId}
                  initialTopicId={practiceTopicId}
                  onNavigate={navigate}
                  onStart={startPractice}
                  showExplanations={trainer.state.settings.showExplanations}
                  stats={trainer.stats}
                  adaptiveQuestionIds={trainer.adaptiveQuestionIds}
                />
              ) : null}
              {view === 'practice' &&
              practiceSessionVisible &&
              trainer.activeSession ? (
                <SessionPage
                  key={trainer.activeSession.id}
                  onAnswer={answerActive}
                  onExit={() => navigate('practice')}
                  onFlag={flagActive}
                  onSubmit={submitActive}
                  questionById={questionById}
                  session={trainer.activeSession}
                />
              ) : null}
              {view === 'exam' && !examSessionVisible ? (
                <ExamSetupPage
                  activeSession={
                    examSessionVisible
                      ? trainer.activeSession
                      : trainer.activeSession?.mode === 'exam'
                        ? trainer.activeSession
                        : null
                  }
                  onStart={startExam}
                />
              ) : null}
              {view === 'exam' &&
              examSessionVisible &&
              trainer.activeSession ? (
                <SessionPage
                  key={trainer.activeSession.id}
                  onAnswer={answerActive}
                  onExit={() => navigate('exam')}
                  onFlag={flagActive}
                  onSubmit={submitActive}
                  questionById={questionById}
                  session={trainer.activeSession}
                />
              ) : null}
              {view === 'reviews' ? (
                <ReviewsPage
                  allReviews={trainer.reviews}
                  onNavigate={navigate}
                  onStart={(topicIds, count) =>
                    startPractice({
                      count,
                      topicIds,
                      title: 'Repaso espaciado',
                      immediateFeedback: true,
                    })
                  }
                  reviewQueue={trainer.reviewQueue}
                  stats={trainer.stats}
                />
              ) : null}
              {view === 'statistics' ? (
                <StatisticsPage
                  activity={trainer.activity}
                  attempts={trainer.state.attempts}
                  onNavigate={navigate}
                  onPractice={(topicId) => {
                    setPracticeTopicId(topicId)
                    setView('practice')
                  }}
                  stats={trainer.stats}
                />
              ) : null}
              {view === 'plan' ? (
                <PlanPage
                  onNavigate={navigate}
                  onUpdate={trainer.updateSettings}
                  settings={trainer.state.settings}
                  stats={trainer.stats}
                />
              ) : null}
              {view === 'settings' ? (
                <SettingsPage
                  onClear={trainer.clearData}
                  onImport={trainer.importData}
                  onNavigate={navigate}
                  onUpdate={trainer.updateSettings}
                  settings={trainer.state.settings}
                  state={trainer.state}
                  storageAvailable={trainer.storageAvailable}
                  storageStatus={trainer.storageStatus}
                />
              ) : null}
              {view === 'results' ? (
                <ResultsPage
                  attempt={selectedAttempt}
                  onBack={() => navigate('dashboard')}
                  onNavigate={navigate}
                  onPracticeWrong={repeatWrong}
                  questionById={questionById}
                />
              ) : null}
            </Suspense>
          </RouteErrorBoundary>
        ) : null}
      </AppShell>
      {showOnboarding ? (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      ) : null}
    </div>
  )
}

export default App
