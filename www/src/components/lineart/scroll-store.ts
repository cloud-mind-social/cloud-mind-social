"use client";

import { useCallback, useRef } from "react";

/**
 * Scroll progress and velocity used to be published as custom properties
 * on <html>. Those properties inherit, so every write invalidated style
 * for the whole document — on this page that measured about 33ms of style
 * recalculation per frame while scrolling, which is most of a frame budget
 * spent on three numbers.
 *
 * Only a couple of elements ever read them, so they are written straight
 * onto those elements instead. Their subtrees are small, and the rest of
 * the document is never touched.
 */

const nodes = new Set<HTMLElement>();

export function registerScrollNode(el: HTMLElement | null) {
  if (!el) return () => {};
  nodes.add(el);
  return () => {
    nodes.delete(el);
  };
}

/**
 * Opt an element's subtree into reading --page-progress / --scroll-v.
 * A callback ref rather than an effect, so an element that appears or
 * disappears with a conditional render registers and unregisters with it.
 */
export function useScrollNodeRef<T extends HTMLElement>() {
  const release = useRef<(() => void) | null>(null);

  return useCallback((node: T | null) => {
    release.current?.();
    release.current = node ? registerScrollNode(node) : null;
  }, []);
}

export function publishScroll(
  progress: string,
  velocity: string,
  direction: string | null,
) {
  for (const el of nodes) {
    el.style.setProperty("--page-progress", progress);
    el.style.setProperty("--scroll-v", velocity);
    if (direction) el.style.setProperty("--scroll-dir", direction);
  }
}

export const hasScrollNodes = () => nodes.size > 0;
