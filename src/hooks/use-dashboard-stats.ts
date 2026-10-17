import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The Dashboard's window: the last seven days, today included. */
export const WINDOW_DAYS = 7;

export type Rating = "again" | "hard" | "good" | "easy";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface QBankWeek {
  answered: number;
  correct: number;
  byDifficulty: Record<Difficulty, { answered: number; correct: number }>;
}

export interface UnfinishedSet {
  id: string;
  topic: string | null;
  system: string;
  mode: string;
  answered_count: number;
  question_count: number;
  expected_total: number;
  last_activity_at: string | null;
}

export interface DashboardStats {
  /** Reviews in the window, by the button pressed. */
  reviewsByRating: Record<Rating, number>;
  reviewsThisWeek: number;
  /** Pass rate on graduated cards over 30 days; null below five reviews. */
  retention: number | null;
  qbank: QBankWeek;
  unfinished: UnfinishedSet[];
  /** Days with any study (a review, an answer or a saved sheet), counted back from today. */
  activeDays: Set<string>;
}

const REVIEW_STATE = 2;

export const dayKey = (t: number | string | Date) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Consecutive days with activity, ending today — or yesterday, so a streak survives until tonight. */
export function computeStreak(activeDays: Set<string>, now = Date.now()): number {
  let cursor = activeDays.has(dayKey(now)) ? now : now - DAY_MS;
  let count = 0;
  while (activeDays.has(dayKey(cursor))) {
    count += 1;
    cursor -= DAY_MS;
  }
  return count;
}

const emptyQBank = (): QBankWeek => ({
  answered: 0,
  correct: 0,
  byDifficulty: {
    Easy: { answered: 0, correct: 0 },
    Medium: { answered: 0, correct: 0 },
    Hard: { answered: 0, correct: 0 },
  },
});

/**
 * Everything the Dashboard counts that lives only on the server: reviews,
 * QBank answers and unfinished sets. Sheets and the card queue come from their
 * own hooks, which also serve guests from this device.
 */
export function useDashboardStats() {
  const { user, isAnonymous } = useAuth();
  const userId = user?.id ?? null;
  const enabled = !!userId && !isAnonymous;

  const query = useQuery({
    queryKey: ["dashboard-stats", userId],
    enabled,
    queryFn: async (): Promise<DashboardStats> => {
      const now = Date.now();
      const since90 = new Date(now - 90 * DAY_MS).toISOString();
      const weekStart = now - WINDOW_DAYS * DAY_MS;

      const [reviews, attempts, unfinished] = await Promise.all([
        supabase
          .from("review_sessions")
          .select("rating, reviewed_at, state_before")
          .eq("user_id", userId!)
          .gte("reviewed_at", since90),
        supabase
          .from("user_attempts")
          .select("is_correct, created_at, questions(difficulty)")
          .eq("user_id", userId!)
          .gte("created_at", since90),
        supabase.rpc("list_unfinished_sessions"),
      ]);
      if (reviews.error) throw reviews.error;
      if (attempts.error) throw attempts.error;
      if (unfinished.error) throw unfinished.error;

      const activeDays = new Set<string>();

      const reviewsByRating: Record<Rating, number> = { again: 0, hard: 0, good: 0, easy: 0 };
      let reviewsThisWeek = 0;
      let graduated = 0;
      let passed = 0;
      for (const r of reviews.data ?? []) {
        const t = new Date(r.reviewed_at).getTime();
        activeDays.add(dayKey(t));
        if (t >= weekStart) {
          reviewsThisWeek += 1;
          if (r.rating in reviewsByRating) reviewsByRating[r.rating as Rating] += 1;
        }
        // Retention as Anki reports it: graduated cards only, Hard is a pass.
        if (t >= now - 30 * DAY_MS && (r.state_before === REVIEW_STATE || r.state_before === null)) {
          graduated += 1;
          if (r.rating !== "again") passed += 1;
        }
      }

      const qbank = emptyQBank();
      for (const a of attempts.data ?? []) {
        const t = new Date(a.created_at).getTime();
        activeDays.add(dayKey(t));
        if (t < weekStart) continue;
        qbank.answered += 1;
        if (a.is_correct) qbank.correct += 1;
        const joined = a.questions as { difficulty?: string } | { difficulty?: string }[] | null;
        const difficulty = (Array.isArray(joined) ? joined[0]?.difficulty : joined?.difficulty) as Difficulty | undefined;
        if (difficulty && difficulty in qbank.byDifficulty) {
          qbank.byDifficulty[difficulty].answered += 1;
          if (a.is_correct) qbank.byDifficulty[difficulty].correct += 1;
        }
      }

      return {
        reviewsByRating,
        reviewsThisWeek,
        retention: graduated >= 5 ? Math.round((passed / graduated) * 100) : null,
        qbank,
        unfinished: (unfinished.data ?? []) as UnfinishedSet[],
        activeDays,
      };
    },
  });

  return { stats: query.data ?? null, isLoading: enabled && query.isLoading, isSignedIn: enabled };
}
