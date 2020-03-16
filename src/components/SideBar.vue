<template>
  <aside class="side-bar content-box flex flex-col items-center">
    <section class="widget-tags">
      <h3 class="text-center">Tags</h3>
      <div v-for="edge in $static.tags.edges" :key="edge.node.id">
        <g-link class="widget-tags__link" :to="edge.node.metadata.path">
          <span>#</span>
          {{ edge.node.title }}
        </g-link>
      </div>
    </section>
  </aside>
</template>

<script>
export default {};
</script>

<static-query>
  query {
    tags: allCosmicjsTags {
      edges {
        node {
          id
          title
          metadata {
            path
          }
        }
      }
    }
  }
</static-query>

<style lang="scss">
.side-bar {
  --space: 3rem;
  --content-width: 100%;
  width: 25%;
}
</style>
