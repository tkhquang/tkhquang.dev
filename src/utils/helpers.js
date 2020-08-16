/**
 * Get or set a css variable from body tag
 *
 * @param {string} name
 * @param {string} [value]
 * @returns {Object}
 */
const getCssVariable = (name, value) => {
  if (name.substr(0, 2) !== "--") {
    name = "--" + name;
  }

  if (value) {
    window.document.body.style.setProperty(name, value);
    return {
      [name.replace(/^--/, "")]: value
    };
  }

  return {
    [name.replace(/^--/, "")]: window
      .getComputedStyle(window.document.body)
      .getPropertyValue(name)
      .trim()
  };
};

const VARIABLES = [
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
  "--success"
];

export const getCssVars = () => {
  let cssVars = {};

  VARIABLES.forEach((variable) => {
    cssVars = { ...cssVars, ...getCssVariable(variable) };
  });

  return cssVars;
};

export const scrollToElement = (element, duration = 500) => {
  const startingY = window.pageYOffset;
  const elementY = window.pageYOffset + element.getBoundingClientRect().top;
  // If element is close to page's bottom then window will scroll only to some position above the element.
  const targetY =
    document.body.scrollHeight - elementY < window.innerHeight
      ? document.body.scrollHeight - window.innerHeight
      : elementY;
  const diff = targetY - startingY;

  // Easing function: easeInOutCubic
  // From: https://gist.github.com/gre/1650294
  const easing = (t) => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  };

  let start;

  if (!diff) {
    return;
  }

  const step = (timestamp) => {
    if (!start) {
      start = timestamp;
    }

    // Elapsed miliseconds since start of scrolling.
    const time = timestamp - start;

    // Get percent of completion in range [0, 1].
    let percent = Math.min(time / duration, 1);

    // Apply the easing.
    // It can cause bad-looking slow frames in browser performance tool, so be careful.
    percent = easing(percent);

    window.scrollTo(0, startingY + diff * percent);

    // Proceed with animation as long as we wanted it to.
    if (time < duration) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};

export function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0)
  );
}
