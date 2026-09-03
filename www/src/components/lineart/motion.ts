"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** How a stroke is being driven right now. */
export type TraceMode = "static" | "timed" | "scroll";

// One observer for the whole page, however many strokes are listening.
const wakeListeners = new Set<() => void>();
let wakeObserver: MutationObserver | null = null;

function subscribeToWake(onChange: () => void) {
  wakeListeners.add(onChange);

  if (!wakeObserver) {
    wakeObserver = new MutationObserver(() => {
      for (const listener of wakeListeners) listener();
    });
    wakeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-awake"],
    });
  }

  return () => {
    wakeListeners.delete(onChange);
    if (wakeListeners.size === 0) {
      wakeObserver?.disconnect();
      wakeObserver = null;
    }
  };
}

/**
 * Has the reader touched the page yet? Everything ambient waits on this,
 * so a page nobody has interacted with stays a still drawing.
 */
export function useAwake() {
  return useSyncExternalStore(
    subscribeToWake,
    () => document.documentElement.dataset.awake === "true",
    () => false,
  );
}

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * True once we know the visitor is happy to see things move. Reads false
 * on the server and through hydration, so the first paint is always the
 * still version — nothing can be left mid-animation by a failed load.
 */
export function useMotionAllowed() {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => !window.matchMedia(REDUCED).matches,
    () => false,
  );
}

/**
 * Can the browser hang an animation straight off the scroll position?
 * Where it can, the pen is literally in the reader's hand — scrolling
 * back un-draws the line — and CSS owns the timing with no main-thread
 * work at all.
 */
export function supportsScrollTimeline() {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("animation-timeline", "view()")
  );
}

/**
 * Picks how a stroke should run. Anything already on screen when the
 * page loads runs on a timer — a scroll-linked line would otherwise sit
 * there half-drawn until the reader moved. Everything below the fold is
 * handed to the scroll position where the browser supports it.
 */
export function useTraceMode(ref: RefObject<Element | null>): TraceMode {
  const motionAllowed = useMotionAllowed();
  const awake = useAwake();
  const [driver, setDriver] = useState<"timed" | "scroll" | null>(null);

  // Measured before paint, so a stroke is never briefly drawn the wrong way.
  useLayoutEffect(() => {
    if (!motionAllowed || !awake) return;
    if (typeof IntersectionObserver === "undefined") return;

    const el = ref.current;
    const startsOnScreen = el
      ? el.getBoundingClientRect().top < window.innerHeight * 0.92
      : true;
    setDriver(startsOnScreen || !supportsScrollTimeline() ? "timed" : "scroll");
  }, [motionAllowed, awake, ref]);

  return motionAllowed && awake && driver ? driver : "static";
}

/** Fires once, when the element first comes far enough into view. */
export function useInView(
  ref: RefObject<Element | null>,
  enabled = true,
  { threshold = 0.2, rootMargin = "0px 0px -10% 0px" } = {},
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, enabled, threshold, rootMargin]);

  return inView;
}

/** Live box size, so an SVG path can be cut to the exact shape of its content. */
export function useBoxSize<T extends Element>(ref: RefObject<T | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize((prev) =>
        Math.abs(prev.width - box.width) < 0.5 &&
        Math.abs(prev.height - box.height) < 0.5
          ? prev
          : { width: box.width, height: box.height },
      );
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

/** Convenience: a ref plus everything a traced stroke needs to know. */
export function useTracedElement<T extends Element>() {
  const ref = useRef<T>(null);
  const mode = useTraceMode(ref);
  const inView = useInView(ref, mode === "timed");

  return {
    ref,
    mode,
    armed: mode !== "static",
    run: mode === "timed" && inView,
    scroll: mode === "scroll",
  };
}

/** A rounded rectangle, drawn clockwise from just past the top-left corner. */
export function roundedRectPath(
  width: number,
  height: number,
  radius: number,
  inset = 0,
) {
  const x0 = inset;
  const y0 = inset;
  const x1 = width - inset;
  const y1 = height - inset;
  const r = Math.max(0, Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2));

  if (x1 <= x0 || y1 <= y0) return "";

  return [
    `M ${x0 + r} ${y0}`,
    `H ${x1 - r}`,
    `A ${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
    `V ${y1 - r}`,
    `A ${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
    `H ${x0 + r}`,
    `A ${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    `V ${y0 + r}`,
    `A ${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
    "Z",
  ].join(" ");
}
