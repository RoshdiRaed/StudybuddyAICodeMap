import { useEffect, useId, useState } from "react";
import { CalendarClock, HelpCircle, Search, SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const HIDE_KEY = "sb_flashcards_intro_hidden";

const STEPS = [
  { icon: Search, title: "Pick a topic", desc: "Type any medical topic, or choose a popular one." },
  { icon: SlidersHorizontal, title: "Shape the deck", desc: "Set how many cards you want and what they focus on." },
  { icon: CalendarClock, title: "Review on schedule", desc: "Each card comes back just before you would forget it." },
] as const;

const readHidden = () => {
  try {
    return localStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * How the flashcards page works, as a dialog rather than cards on the page:
 * it opens on a visit until the student ticks "Don't show again", and the
 * "How it works" button brings it back on demand. The page itself starts with
 * the topic field.
 */
const FlashcardsIntro = () => {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const checkboxId = useId();

  useEffect(() => {
    if (!readHidden()) setOpen(true);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      try {
        if (dontShow) localStorage.setItem(HIDE_KEY, "1");
        else localStorage.removeItem(HIDE_KEY);
      } catch {
        // Storage unavailable (private mode): the dialog just shows next visit.
      }
    }
    setOpen(next);
  };

  const reopen = () => {
    setDontShow(readHidden());
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={reopen}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
        How it works
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How flashcards work</DialogTitle>
            <DialogDescription>
              Enter any medical topic — a deck of vignette cards is written for it, then scheduled so
              you see each one just before it slips.
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-4 py-2">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ring/10 text-[color:var(--color-accent-ink)]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {i + 1}. {title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor={checkboxId} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                id={checkboxId}
                checked={dontShow}
                onCheckedChange={(v) => setDontShow(v === true)}
              />
              Don't show again
            </label>
            <Button onClick={() => handleOpenChange(false)}>Start</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FlashcardsIntro;
