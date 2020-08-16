import { async } from 'netlify-cms';
<template>
  <form
    class="email-form relative w-full pt-5 flex flex-wrap flex-center text-center overflow-hidden"
    name="portfolio-dev"
    method="POST"
    data-netlify="true"
    netlify-honeypot="bot-field"
    @submit.prevent="handleSubmit"
  >
    <div hidden aria-hidden="true">
      <label>
        Don’t fill this out if you're human:
        <input name="bot-field" />
      </label>
    </div>
    <template v-if="!status || status === 'fetching'">
      <label for="name" class="opacity-0 absolute inset-0 z-bg">
        Full name
      </label>
      <input
        id="name"
        v-model="name"
        class="input h-10 px-2 min-w-full mb-5"
        type="text"
        name="name"
        placeholder="Full name*"
        required
      />
      <label for="email" class="opacity-0 absolute inset-0 z-bg">
        Email
      </label>
      <input
        id="email"
        v-model="email"
        class="input h-10 px-2 min-w-full mb-5"
        type="email"
        name="email"
        placeholder="Email*"
        required
      />
      <label for="message" class="opacity-0 absolute inset-0 z-bg">
        Message
      </label>
      <textarea
        id="message"
        v-model="message"
        class="textarea p-2 min-w-full mb-5"
        name="message"
        placeholder="Message*"
        rows="5"
        required
      />
      <button
        type="submit"
        class="button w-32"
        :disabled="status === 'fetching'"
      >
        <template v-if="status !== 'fetching'">
          Submit
        </template>
        <template v-else>
          <span class="flex-center">
            <v-icon name="loader" class="spinner w-4 h-4"></v-icon>
          </span>
        </template>
      </button>
    </template>
    <div v-else-if="status === 'success'" class="text-theme-success">
      <p>
        <v-icon name="check-circle" class="w-4 h-4 inline-block"></v-icon>
        Your message has been successfully sent, I will get back to you ASAP!
      </p>
    </div>
    <div v-else-if="status === 'error'" class="text-theme-error">
      <p>
        <v-icon name="x-circle" class="w-4 h-4 inline-block"></v-icon>
        Error, please try again!
      </p>
      <p class="my-2">
        {{ errorMessage }}
      </p>
      <button type="button" class="button mx-auto" @click="retryHandler">
        Retry
      </button>
    </div>
  </form>
</template>

<script>
import { errHandler } from "~/utils";

export default {
  data() {
    return {
      name: "",
      email: "",
      message: "",
      status: "",
      errorMessage: ""
    };
  },

  methods: {
    async handleSubmit() {
      this.status = "fetching";

      try {
        const encode = (data) => {
          return Object.keys(data)
            .map(
              (key) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
            )
            .join("&");
        };
        await fetch("/?no-cache=1", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: encode({
            "form-name": "portfolio-dev",
            name: this.name,
            email: this.email,
            message: this.message
          })
        });

        this.status = "success";
      } catch (err) {
        const error = errHandler(err);
        console.error(errHandler(err));

        this.status = "error";

        if (error.response.data && error.response.data.message) {
          this.errorMessage = error.response.data.message;

          return;
        }

        if (error.message) {
          this.errorMessage = error.message;
        }
      }
    },

    retryHandler() {
      this.status = "";
      this.errorMessage = "";
    }
  }
};
</script>
