import { debounce } from "debounce";

/**
 * Retrieves the current root font size (in pixels) from the document's root element (`<html>`).
 *
 * @returns {number} The root font size in pixels.
 */
export const getRootFontSize = (): number => {
  return parseFloat(getComputedStyle(document.documentElement).fontSize);
};

/**
 * Converts rem units to pixels based on the root font size.
 *
 * @param {number} rem - The rem value to convert.
 * @param {number} [rootFontSize] - Optional root font size in pixels to use for conversion.
 * If not provided, the current root font size from the document will be used.
 * @returns {number} The equivalent pixel value in pixels.
 */
export const remToPx = (rem: number, rootFontSize?: number): number => {
  const computedRootFontSize = rootFontSize ?? getRootFontSize();

  return rem * computedRootFontSize;
};

interface ScrollManagerCallback {
  scrollY: number;
  scrollProgress: number;
}

export class ScrollManager {
  private listeners: Map<
    string,
    {
      callback: ({ scrollY, scrollProgress }: ScrollManagerCallback) => void;
    }
  >;
  private debounceTime: number;
  private handleScroll: () => void;

  constructor({ debounceTime = 10 }: { debounceTime?: number } = {}) {
    this.debounceTime = debounceTime;
    this.handleScroll = debounce(() => {
      const scrollY = window.scrollY || 0;
      const scrollProgress =
        scrollY / (document.body.scrollHeight - window.innerHeight);

      this.listeners.forEach(({ callback }) => {
        callback({ scrollY, scrollProgress });
      });
    }, this.debounceTime);
    this.listeners = new Map();
    window.addEventListener("scroll", this.handleScroll);
    window.addEventListener("resize", this.handleScroll);
    window.addEventListener("load", this.handleScroll);
  }

  subscribe({
    id,
    callback,
    lazy = false,
  }: {
    id: string;
    callback: ({ scrollY, scrollProgress }: ScrollManagerCallback) => void;
    lazy?: boolean;
  }) {
    this.listeners.set(id, { callback });
    if (!lazy) {
      this.handleScroll();
    }
  }

  unsubscribe(id: string) {
    this.listeners.delete(id);
  }

  destroy() {
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.handleScroll);
    window.removeEventListener("load", this.handleScroll);
    this.listeners.clear();
  }
}
