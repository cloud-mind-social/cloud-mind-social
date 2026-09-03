"use client";

import { useEffect, type RefObject } from "react";

/**
 * Every looping stroke on this site — the sprites running card borders,
 * the bounding dots, the marching dashes, the speech-bubble dots — keeps
 * going forever once it has mounted. By the time a reader has been to the
 * bottom of the page that is around thirty simultaneous animations, most
 * of them SVG stroke animations that repaint their path every frame, and
 * all of them still running far off screen where nobody can see them.
 *
 * One shared observer parks anything that is not near the viewport. The
 * CSS pauses by default and only runs on [data-near="true"], so a stroke
 * that never registers stays still rather than animating unseen.
 */

const NEAR_MARGIN = "25% 0px 25% 0px";

let observer: IntersectionObserver | null = null;

function getObserver() {
  if (observer || typeof IntersectionObserver === "undefined") return observer;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement | SVGElement;
        if (entry.isIntersecting) {
          el.dataset.near = "true";
        } else {
          delete el.dataset.near;
        }
      }
    },
    { rootMargin: NEAR_MARGIN },
  );

  return observer;
}

/** Park this element's looping animation whenever it is far off screen. */
export function watchAmbient(el: Element | null) {
  const io = getObserver();
  if (!el || !io) return () => {};

  io.observe(el);
  return () => io.unobserve(el);
}

/** Register an element (or its container) as carrying a looping stroke. */
export function useAmbient(ref: RefObject<Element | null>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    return watchAmbient(ref.current);
  }, [ref, enabled]);
}
