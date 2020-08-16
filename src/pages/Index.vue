<template>
  <div>
    <Hero />
    <About />
    <Stacks />
    <Projects />
    <Contact />
  </div>
</template>

<script>
import seoMixin from "~/vue-utils/mixins/seo";
import routerMixin from "~/vue-utils/mixins/router";

import Hero from "~/components/portfolio/Hero";
import About from "~/components/portfolio/About";
import Stacks from "~/components/portfolio/Stacks";
import Projects from "~/components/portfolio/Projects";
import Contact from "~/components/portfolio/Contact";

export default {
  name: "Home",

  components: {
    Hero,
    About,
    Stacks,
    Projects,
    Contact
  },

  mixins: [seoMixin, routerMixin],

  metaInfo() {
    return this.generateMetaInfo({
      siteTitle: "Aleks's Portfolio",
      siteDescription:
        "Highly motivated, self-starting developer with a good understanding of HTML, CSS, JavaScript and modern JS libraries and frameworks such as React, Vue, seeking to launch a career building web applications and services."
    });
  }
};
</script>
