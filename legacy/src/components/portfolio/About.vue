<template>
  <section class="about">
    <div class="container">
      <h2 class="heading--section my-10 text-4xl">About Me 🙋‍♂️</h2>
      <div class="flex-center flex-col-reverse lg:flex-row flex-gap-8">
        <div class="w-full lg:w-2/3 v-html" v-html="about"></div>
        <div
          class="author w-10/12 md:w-8/12 lg:w-1/3 p-6 mx-6 my-auto flex-center"
        >
          <g-image
            src="@/assets/resources/images/Aleks.png"
            alt="Aleks"
            class="author__image"
            width="500"
            height="500"
            fit="cover"
            blur="10"
          />
        </div>
      </div>

      <div class="download-container flex-center flex-col my-2">
        <a
          class="download__link shadow-md"
          :href="resume.path"
          target="_blank"
          rel="noopener noreferrer"
          title="View Resume"
        >
          <span>Download</span>
          <span>PDF</span>
        </a>
        <a
          :href="resume.path"
          target="_blank"
          rel="noopener noreferrer"
          title="View Resume"
        >
          {{ resume.fileName }}
        </a>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      about: `<p>
            My full name is Quang Trinh Khac, but you can call me Aleks. I am a
            former student of the Advanced Education Program (AEP) in
            Information System at Ho Chi Minh City University of Information
            Technology. However, for some inexplicable reason, I have not
            finished my degree yet.
          </p>

          <p>
            I am a highly motivated, self-starting developer with a good
            understanding of HTML, CSS, JavaScript and its modern libraries and frameworks such
            as React, Vue,... seeking to launch a career building
            web applications and services. The work I provide is of highest
            quality, fully responsive, and well-tested in a wide variety of
            devices. The code I write is easy to maintain because it is clean,
            concise and ordered.
          </p>

          <p>
            Do not hesitate to get in touch with me if you are looking for an
            Engineer who can provide:
          </p>

          <ul>
            <li>Semantic HTML/Responsive CSS</li>
            <li>JavaScript (Vanilla, ReactJS, VueJS,...)</li>
            <li>High-level user experience</li>
            <li>Best practices</li>
            <li>Git</li>
            <li>Agile/Scrums (Software development)</li>
          </ul>`,
      resume: {
        path: "https://github.com/tkhquang/tkhquang-resume/raw/main/output/Quang_Trinh_Khac-Resume.pdf",
        fileName: "Quang Trinh Khac - Resume.pdf"
      }
    };
  }
};
</script>

<style lang="scss" scoped>
@import "~/assets/styles/_mixins";

.about /deep/ .v-html {
  @include typography;
}

@keyframes morph {
  0% {
    border-radius: 42% 58% 49% 51% / 48% 64% 36% 52%;
  }
  100% {
    border-radius: 50% 50% 55% 45% / 64% 51% 49% 36%;
  }
}

.author {
  position: relative;

  &::before {
    content: "";
    position: absolute;
    display: block;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(
      to bottom right,
      var(--surface) 0%,
      var(--secondary) 100%
    );
    border-radius: 42% 58% 49% 51% / 48% 64% 36% 52%;
    z-index: -1;
    animation:
      spin 12s linear infinite reverse,
      morph 8s ease-in-out infinite both alternate;
    animation-play-state: paused;
  }

  &:hover {
    &::before {
      animation-play-state: running;
    }

    .author__image {
      border-radius: 50%;
    }
  }

  .author__image {
    transition: border-radius 0.5s ease-in-out;
    border-radius: 50% 50% 55% 45% / 64% 51% 49% 36%;
  }
}

.download-container {
  @include typography;

  a[target="_blank"]::after {
    display: none;
  }
}

.download__link {
  padding: 1rem 0;
  background: #ffffff;
  border: solid 1px #e6e6e6;
  border-radius: 2px;
  display: inline-block;
  height: 100px;
  line-height: 100px;
  margin: 5px;
  position: relative;
  text-align: center;
  vertical-align: middle;
  width: 100px;
  span {
    background: #e52210;
    border-radius: 4px;
    color: #ffffff;
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    line-height: normal;
    padding: 5px 10px;
    position: relative;
    text-transform: uppercase;
    z-index: 1;
  }
  span:last-child {
    margin-left: -20px;
  }
  &::before,
  &::after {
    background: #ffffff;
    border: solid 3px #9fb4cc;
    border-radius: 4px;
    content: "";
    display: block;
    height: 35px;
    left: 50%;
    margin: -17px 0 0 -12px;
    position: absolute;
    top: 50%;
    // transform: translate(-50%, -50%);
    width: 25px;
  }
  &:hover::before,
  &:hover::after {
    background: #e2e8f0;
  }
  &:hover {
    background: #e2e8f0;
    border-color: #9fb4cc;
  }
  &:active {
    background: #dae0e8;
    box-shadow: inset 0 2px 2px rgba(0, 0, 0, 0.25);
  }
  span:first-child {
    display: none;
  }
  &:hover span:first-child {
    display: inline-block;
  }
  &:hover span:last-child {
    display: none;
  }
}
</style>
