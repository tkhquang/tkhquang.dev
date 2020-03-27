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
      attributeFilter: ["data-theme"]
    });
  },

  beforeDestroy() {
    this.observer.disconnect();
  },

  methods: {
    setCssVariables() {
      this.cssVars = {
        ...this.getCssVariable("--header-height"),
        ...this.getCssVariable("--background"),
        ...this.getCssVariable("--accent"),
        ...this.getCssVariable("--primary"),
        ...this.getCssVariable("--secondary")
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
