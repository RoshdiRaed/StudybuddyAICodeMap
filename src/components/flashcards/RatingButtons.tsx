import type { ReviewRating } from "@/lib/spaced-repetition";

/**
 * Anki's four answer buttons. Each says what it means rather than when the
 * card comes back — the schedule is the app's job, not something to weigh up
 * on every card. Hard is a pass (recalled, with effort); only Again is a fail.
 */
const BUTTONS: { rating: ReviewRating; label: string; hint: string; key: string; className: string }[] = [
  {
    rating: "again",
    label: "Again",
    hint: "Forgot it",
    key: "1",
    className: "border-danger/30 bg-danger-soft text-danger hover:border-danger/60",
  },
  {
    rating: "hard",
    label: "Hard",
    hint: "With effort",
    key: "2",
    className: "border-warning/30 bg-warning-soft text-warning hover:border-warning/60",
  },
  {
    rating: "good",
    label: "Good",
    hint: "After a moment",
    key: "3",
    className: "border-success/30 bg-success-soft text-success hover:border-success/60",
  },
  {
    rating: "easy",
    label: "Easy",
    hint: "Instantly",
    key: "4",
    className: "border-info/30 bg-info-soft text-info hover:border-info/60",
  },
];

export const RATING_HINTS: Record<ReviewRating, string> = Object.fromEntries(
  BUTTONS.map((b) => [b.rating, b.hint])
) as Record<ReviewRating, string>;

const RatingButtons = ({
  onRate,
  disabled = false,
  compact = false,
}: {
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean;
  compact?: boolean;
}) => (
  <div className="space-y-1.5">
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Rate your recall">
      {BUTTONS.map((b) => (
        <button
          key={b.rating}
          type="button"
          disabled={disabled}
          onClick={() => onRate(b.rating)}
          title={`${b.hint} (key ${b.key})`}
          className={`${compact ? "h-12" : "h-14"} rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 ${b.className}`}
        >
          <span>{b.label}</span>
          <span className="text-[10px] font-normal opacity-80">{b.hint}</span>
        </button>
      ))}
    </div>
    <p className="hidden sm:block text-center text-[10px] text-muted-foreground">
      Keys 1–4 to rate · Space to flip · Hard still counts as remembered
    </p>
  </div>
);

export default RatingButtons;
