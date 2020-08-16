<template>
  <footer class="footer text-center py-4 mt-auto surface shadow-box">
    <div class="container flex items-center justify-between">
      <div class="font-semibold">
        Copyright © {{ new Date().getFullYear() }}
      </div>

      <SocialLinks class="flex-center text-2xl gap-2" />
    </div>
  </footer>
</template>

<script>
import SocialLinks from "~/components/common/SocialLinks";

export default {
  components: {
    SocialLinks
  }
};
</script>
