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
