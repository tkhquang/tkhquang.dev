/**
 * Get or set a CSS variable from the body tag.
 *
 * @param {string} name - The name of the CSS variable (e.g., "--primary").
 * @param {string} [value] - The value to set for the CSS variable.
 * @returns {Record<string, string>} - An object containing the variable name and its value.
 */
const getCssVariable = (
  name: string,
  value?: string
): Record<string, string> => {
  if (!name.startsWith("--")) {
    name = "--" + name;
  }

  if (value) {
    window.document.body.style.setProperty(name, value);
    return {
      [name.replace(/^--/, "")]: value,
    };
  }

  return {
    [name.replace(/^--/, "")]: window
      .getComputedStyle(window.document.body)
      .getPropertyValue(name)
      .trim(),
  };
};

// Predefined CSS variables
const VARIABLES: string[] = [
  "--header-height",
  "--tone",
  "--tone-1",
  "--tone-2",
  "--tone-3",
  "--primary",
  "--secondary",
  "--background",
  "--surface",
  "--on-primary",
  "--on-secondary",
  "--on-background",
  "--on-surface",
  "--error",
  "--success",
];

/**
 * Fetch all predefined CSS variables and their current values.
 *
 * @returns {Record<string, string>} - An object containing all CSS variables and their values.
 */
export const getCssVariables = (): Record<string, string> => {
  let cssVars: Record<string, string> = {};

  VARIABLES.forEach((variable) => {
    cssVars = { ...cssVars, ...getCssVariable(variable) };
  });

  return cssVars;
};

/**
 * Smoothly scroll to an element over a specified duration.
 *
 * @param {HTMLElement} element - The target HTML element to scroll to.
 * @param {number} [duration=500] - The duration of the scroll in milliseconds.
 */
export const scrollToElement = (
  element: HTMLElement,
  duration: number = 500
): void => {
  const startingY = window.pageYOffset;
  const elementY = window.pageYOffset + element.getBoundingClientRect().top;

  const targetY =
    document.body.scrollHeight - elementY < window.innerHeight
      ? document.body.scrollHeight - window.innerHeight
      : elementY;

  const diff = targetY - startingY;

  const easing = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  };

  let start: number | undefined;

  if (!diff) {
    return;
  }

  const step = (timestamp: number): void => {
    if (!start) {
      start = timestamp;
    }

    const time = timestamp - start;

    let percent = Math.min(time / duration, 1);

    percent = easing(percent);

    window.scrollTo(0, startingY + diff * percent);

    if (time < duration) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};

/**
 * Check if a value is empty.
 *
 * @param {unknown} value - The value to check.
 * @returns {boolean} - True if the value is empty, false otherwise.
 */
export function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "object" &&
      value !== null &&
      Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0)
  );
}
