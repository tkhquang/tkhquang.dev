<template>
  <div class="horizontal-line" aria-hidden="true" />
</template>

<style lang="scss" scoped>
.horizontal-line {
  @apply w-full mx-0 border-0 h-px;
  background-image: linear-gradient(
    to right,
    transparent 0%,
    var(--primary) 30%,
    var(--primary) 70%,
    transparent 100%
  );
}
</style>
