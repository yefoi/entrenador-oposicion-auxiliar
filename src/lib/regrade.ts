import { questionById } from '../data/questions'
import { scoreSession } from './scoring'
import { getActivity, updateTopicReviews } from './statistics'
import type { TrainerState } from '../domain/types'

/**
 * Bump when a change invalidates stored attempts or reviews again.
 *
 * Commit 0793e33 rotated the options left by `index % 4` but moved
 * correctIndex to the right, so 132 of 264 questions pointed at the wrong
 * option. Everything graded in that window was graded against a wrong key.
 */
export const REGRADE_STAMP = 'answer-key-0793e33'

/**
 * Rebuilds the derived parts of a saved state against the current answer key.
 *
 * What is safe to keep and what is not:
 *
 * - `answers` records the option the user clicked, as an index into the
 *   displayed order. The fix changed `correctIndex`, never the rotation, so
 *   those indices still point at the same option text and are reusable as is.
 *   That is what makes this a recompute rather than a data loss.
 * - `attempt.scores` was a snapshot frozen at submit time, so it kept the
 *   wrong-era totals. Recomputed here from answers and the current key.
 * - `reviews` was advanced with wrong correct/incorrect outcomes. Replayed
 *   here from scratch, oldest attempt first, using each attempt's own
 *   timestamp so the schedule is the one the user would have had.
 * - `activity` is a pure function of attempts, recomputed for the same reason.
 *
 * Known limitation: only the last MAX_ATTEMPTS attempts are kept on disk, so
 * replaying from an empty review state cannot recover levels earned by older
 * attempts. That understates mastery rather than inflating it, which is the
 * safer direction to be wrong in.
 */
export function regradeState(state: TrainerState): TrainerState {
  if (state.regradedAtKey === REGRADE_STAMP) return state

  const attempts = state.attempts.map((attempt) => ({
    ...attempt,
    scores: scoreSession(attempt, questionById),
  }))

  const chronological = [...attempts].sort((a, b) =>
    a.completedAt.localeCompare(b.completedAt),
  )
  let reviews = {}
  for (const attempt of chronological) {
    reviews = updateTopicReviews(
      reviews,
      attempt,
      questionById,
      new Date(attempt.completedAt),
    )
  }

  return {
    ...state,
    attempts,
    reviews,
    activity: getActivity(attempts, questionById),
    regradedAtKey: REGRADE_STAMP,
  }
}
