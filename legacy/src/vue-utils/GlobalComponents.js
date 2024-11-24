import Vue from "vue";
import EventBus from "./EventBus";

Vue.component("HorizontalLine", () =>
  import("~/components/global/HorizontalLine")
);

Object.defineProperties(Vue.prototype, {
  $bus: {
    get() {
      return EventBus;
    }
  }
});
