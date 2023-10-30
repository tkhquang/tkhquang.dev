<template>
  <section class="contact mt-10 py-10">
    <div class="container">
      <h2 class="heading--section mb-10 text-4xl">
        Contact 📨
      </h2>
      <div class="w-full md:w-2/3 mx-auto">
        <ContactForm />
      </div>
    </div>
  </section>
</template>

<script>
import ContactForm from "~/components/common/ContactForm";

export default {
  components: {
    ContactForm
  }
};
</script>
