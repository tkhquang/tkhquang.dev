import { type DependencyList, useEffect, useRef } from "react";

type AfterPaintEffect = () => void | (() => void);

/**
 * A custom React hook that executes an effect after the browser completes a repaint.
 *
 * @param {() => void} effect - The effect function to execute after the repaint.
 * @param {DependencyList} dependencies - An array of dependencies that, when changed, will re-trigger the effect.
 *
 * @description
 * - Unlike `useEffect`, which runs after a repaint is triggered but not necessarily completed,
 *   this hook ensures the effect runs after the browser has fully completed a repaint.
 * - It combines `requestAnimationFrame` and `setTimeout` to defer execution until the repaint is complete.
 *
 * @example
 * useAfterPaintEffect(() => {
 *   console.log('Executed after the repaint');
 * }, [someDependency]);
 *
 * @see https://github.com/facebook/react/issues/20863#issuecomment-940156386
 */
export function useAfterPaintEffect(
  effect: AfterPaintEffect,
  dependencies: DependencyList
): void {
  const effectRef = useRef<ReturnType<AfterPaintEffect> | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const frameId = requestAnimationFrame(() => {
      timeoutId = setTimeout(() => {
        effectRef.current = effect();
      }, 0);
    });

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      effectRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
