import { Mutation } from "../types";

export default {
  [Mutation.LOADING_START](state) {
    state.isLoading = true;
  },
  [Mutation.LOADING_END](state) {
    state.isLoading = false;
  },

  [Mutation.CSS_VARIABLES](state, payload) {
    state.cssVars = payload;
  },

  [Mutation.METADATA](state, payload) {
    state.metadata = payload;
  }
};
