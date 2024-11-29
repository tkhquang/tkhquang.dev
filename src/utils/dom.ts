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
