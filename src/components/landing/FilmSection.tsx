import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Play, RotateCcw } from "lucide-react";

/**
 * The product film on the landing page: a dark stage that picks up where the
 * film's own first frame ("2 a.m.") leaves off, a poster with one play
 * control, and a chapter rail beneath it. The rail is the part that earns the
 * section its space: each chapter's width is its share of the running time,
 * it fills as the film plays, and any chapter starts the film there — so a
 * visitor who only cares about the QBank can go straight to it.
 *
 * Nothing loads until asked: `preload="none"` and a 76 KB poster, then the
 * 720p or 1080p file streams (both are encoded with the index up front).
 */

const DURATION = 154.2;

const CHAPTERS = [
  { start: 0, title: "The night before", thumb: 0 },
  { start: 19, title: "Type a topic", step: "01", thumb: 1 },
  { start: 25, title: "Your study sheet", step: "02", thumb: 2 },
  { start: 105, title: "Practice the QBank", step: "03", thumb: 3 },
  { start: 113.5, title: "Review and repeat", step: "04", thumb: 4 },
  { start: 124, title: "See what's left", thumb: 5 },
  { start: 131.5, title: "Sources you can check", thumb: 6 },
  { start: 137, title: "Built in Gaza", thumb: 7 },
].map((c, i, all) => ({ ...c, end: all[i + 1]?.start ?? DURATION }));

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export interface FilmHandle {
  /** Brings the film into view and starts it — for the hero's "Watch the film". */
  playFromTop: () => void;
}

interface FilmSectionProps {
  /** The same action as the hero's primary button, offered when the film ends. */
  onStart: () => void;
}

export const FilmSection = forwardRef<FilmHandle, FilmSectionProps>(function FilmSection({ onStart }, ref) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const railRef = useRef<HTMLOListElement>(null);
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState(0);
  // The film's last frame shows a "Start free" button it cannot make
  // clickable; the end card puts a real one over it.
  const [ended, setEnded] = useState(false);

  const play = useCallback((at?: number) => {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    if (at !== undefined) v.currentTime = at;
    v.play().catch(() => {
      // A browser that refuses (data saver, policy) leaves the native controls up.
    });
  }, []);

  useImperativeHandle(ref, () => ({
    playFromTop: () => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      play();
    },
  }));

  // The rail's fills follow the playhead every frame through one custom
  // property, so playing the film re-renders nothing; the active chapter is
  // state, and changes eight times in the whole film.
  useEffect(() => {
    const v = videoRef.current;
    const rail = railRef.current;
    if (!v || !rail) return;
    let frame = 0;
    const paint = () => {
      rail.style.setProperty("--t", String(v.currentTime));
      const i = CHAPTERS.findIndex((c) => v.currentTime >= c.start && v.currentTime < c.end);
      if (i !== -1) setActive(i);
    };
    const loop = () => {
      paint();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      paint();
    };
    v.addEventListener("play", start);
    v.addEventListener("pause", stop);
    v.addEventListener("seeked", paint);
    v.addEventListener("ended", stop);
    return () => {
      cancelAnimationFrame(frame);
      v.removeEventListener("play", start);
      v.removeEventListener("pause", stop);
      v.removeEventListener("seeked", paint);
      v.removeEventListener("ended", stop);
    };
  }, []);

  return (
    <section ref={sectionRef} id="film" className="film-section" aria-labelledby="film-title">
      <div className="film-stars" aria-hidden="true" />
      <div className="container film-inner">
        <header className="film-head">
          <span className="eyebrow eyebrow-dark film-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Demo · {clock(DURATION)}
          </span>
          <h2 id="film-title">
            Less time preparing to study. <em>More time actually studying.</em>
          </h2>
          <p>See the idea behind StudyBuddy AI — or jump to the part you came for.</p>
        </header>

        <div className="film-frame" data-started={started ? "" : undefined}>
          <video
            ref={videoRef}
            className="film-video"
            poster="/media/film/poster.webp"
            preload="none"
            playsInline
            controls={started}
            aria-label="StudyBuddy AI product film"
            onPlay={() => {
              setStarted(true);
              setEnded(false);
            }}
            onEnded={() => setEnded(true)}
          >
            <source src="/media/film/studybuddy-film-720.mp4" type="video/mp4" media="(max-width: 820px)" />
            <source src="/media/film/studybuddy-film-1080.mp4" type="video/mp4" />
          </video>

          {ended && (
            <div className="film-end" role="group" aria-label="The film has ended">
              <p className="film-end-title">
                Your first sheet is <em>one topic</em> away.
              </p>
              <div className="film-end-actions">
                <a
                  href="/dashboard?start=sheet"
                  className="button film-end-primary"
                  onClick={(event) => {
                    event.preventDefault();
                    onStart();
                  }}
                >
                  Start free — no card required <ArrowRight size={17} />
                </a>
                <button type="button" className="button film-end-ghost" onClick={() => play(0)}>
                  <RotateCcw size={15} /> Watch again
                </button>
              </div>
            </div>
          )}

          {!started && (
            <button type="button" className="film-play" onClick={() => play()} aria-label={`Play the film, ${clock(DURATION)}`}>
              <span className="film-play-cta" aria-hidden="true">
                <span className="film-play-disc">
                  <Play size={24} fill="currentColor" strokeWidth={0} />
                </span>
                <span className="film-play-text">
                  <span className="film-play-title">Play the film</span>
                  <span className="film-play-sub">{clock(DURATION)} · eight chapters · sound on</span>
                </span>
              </span>
            </button>
          )}
        </div>

        <ol ref={railRef} className="film-rail" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <li
              key={c.start}
              className="film-chapter"
              style={{ "--s": c.start, "--d": c.end - c.start } as CSSProperties}
            >
              <button
                type="button"
                onClick={() => play(c.start)}
                aria-current={started && active === i ? "true" : undefined}
                aria-label={`${c.step ? `Step ${c.step}: ` : ""}${c.title}, at ${clock(c.start)}`}
              >
                <span className="film-chapter-bar" aria-hidden="true">
                  <span className="film-chapter-fill" />
                </span>
                <span className="film-chapter-meta" aria-hidden="true">
                  <span className="film-chapter-time">{c.step ? `${c.step} · ` : ""}{clock(c.start)}</span>
                  <span className="film-chapter-title">{c.title}</span>
                </span>
                <img
                  className="film-chapter-thumb"
                  src={`/media/film/chapter-${c.thumb}.webp`}
                  alt=""
                  width={192}
                  height={108}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
});
