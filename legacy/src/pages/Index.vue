<template>
  <div>
    <template v-if="isLoading">
      <Loader />
    </template>
    <template v-else>
      <Hero />
      <About />
      <Stacks />
      <Projects />
      <Contact />
    </template>
  </div>
</template>

<script>
import loadMixin from "~/vue-utils/mixins/load";
import seoMixin from "~/vue-utils/mixins/seo";
import routerMixin from "~/vue-utils/mixins/router";

import Loader from "~/components/common/Loader";
import Hero from "~/components/portfolio/Hero";
import About from "~/components/portfolio/About";
import Stacks from "~/components/portfolio/Stacks";
import Projects from "~/components/portfolio/Projects";
import Contact from "~/components/portfolio/Contact";

export default {
  name: "Home",

  components: {
    Loader,
    Hero,
    About,
    Stacks,
    Projects,
    Contact
  },

  mixins: [seoMixin, routerMixin, loadMixin],

  metaInfo() {
    return {
      ...this.generateMetaInfo({
        siteTitle: "Aleks's Portfolio",
        siteDescription:
          "Highly motivated, self-starting developer with a good understanding of HTML, CSS, JavaScript and its modern libraries and frameworks such as React, Vue, seeking to launch a career building web applications and services."
      }),
      titleTemplate: "%s"
    };
  }
};
</script>
