export default {
  data() {
    return {
      cssVars: {}
    };
  },

  mounted() {
    this.setCssVariables();

    this.observer = new MutationObserver(this.setCssVariables);
    this.observer.observe(global.document.body, {
      attributes: true,
      attributeFilter: ["data-theme", "style"]
    });

    // const mediaQuery = global.matchMedia("(min-width:640px)");
    // mediaQuery.onchange = () => {
    //   this.setCssVariables();
    // };
  },

  beforeDestroy() {
    this.observer.disconnect();
  },

  methods: {
    setCssVariables() {
      this.cssVars = {
        ...this.getCssVariable("--header-height"),
        ...this.getCssVariable("--tone-1"),
        ...this.getCssVariable("--tone-2"),
        ...this.getCssVariable("--tone-3"),
        ...this.getCssVariable("--primary"),
        ...this.getCssVariable("--secondary"),
        ...this.getCssVariable("--background"),
        ...this.getCssVariable("--surface"),
        ...this.getCssVariable("--on-primary"),
        ...this.getCssVariable("--on-secondary"),
        ...this.getCssVariable("--on-background"),
        ...this.getCssVariable("--on-surface")
      };
    },

    // Get or set a css variable from body
    getCssVariable(name, value) {
      if (process.isClient) {
        if (name.substr(0, 2) !== "--") {
          name = "--" + name;
        }

        if (value) {
          global.document.body.style.setProperty(name, value);
        }

        return {
          [name.replace(/^--/, "")]: global
            .getComputedStyle(global.document.body)
            .getPropertyValue(name)
            .trim()
        };
      }
    }
  }
};
