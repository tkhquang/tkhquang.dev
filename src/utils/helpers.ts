/**
 * Converts an HSL color string (e.g., 'hsl(200,50%,80%)') to a HEX color string (e.g., '#a3cfff').
 *
 * @param {string} hsl - The HSL color string to convert. Format: 'hsl(hue, saturation%, lightness%)'.
 * @returns {string | null} The HEX color string (e.g., '#a3cfff') if the input is valid, or null if invalid.
 *
 * @example
 *   hslToHex('hsl(200,50%,80%)'); // Returns: '#A3CFFF'
 *   hslToHex('hsl(0,0%,0%)');     // Returns: '#000000'
 *   hslToHex('not-a-color');      // Returns: null
 */
function hslToHex(hsl: string): string | null {
  // Match hsl(hue, saturation%, lightness%)
  const match = hsl
    .trim()
    .match(/^hsl\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%\s*\)$/i);
  if (!match) return null;

  const [_, h, s, l] = match;
  const hue = parseFloat(h);
  const sat = parseFloat(s) / 100;
  const light = parseFloat(l) / 100;

  // HSL to RGB conversion
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= hue && hue < 60) [r, g, b] = [c, x, 0];
  else if (60 <= hue && hue < 120) [r, g, b] = [x, c, 0];
  else if (120 <= hue && hue < 180) [r, g, b] = [0, c, x];
  else if (180 <= hue && hue < 240) [r, g, b] = [0, x, c];
  else if (240 <= hue && hue < 300) [r, g, b] = [x, 0, c];
  else if (300 <= hue && hue < 360) [r, g, b] = [c, 0, x];

  const r255 = Math.round((r + m) * 255);
  const g255 = Math.round((g + m) * 255);
  const b255 = Math.round((b + m) * 255);

  return (
    "#" +
    ((1 << 24) + (r255 << 16) + (g255 << 8) + b255)
      .toString(16)
      .slice(1)
      .toUpperCase()
  );
}

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

  const computedValue = window
    .getComputedStyle(window.document.body)
    .getPropertyValue(name)
    .trim();

  return {
    [name.replace(/^--/, "")]: hslToHex(computedValue) ?? computedValue,
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
