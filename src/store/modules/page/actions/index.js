import { Action, Mutation } from "../types";
import { getCssVars } from "../services";

export default {
  [Action.LOADING_START]({ commit }) {
    commit(`${[Mutation.LOADING_START]}`);
  },
  [Action.LOADING_END]({ commit }) {
    commit(`${[Mutation.LOADING_END]}`);
  },

  [Action.CSS_VARIABLES]({ commit }) {
    const cssVars = getCssVars();
    commit(`${[Mutation.CSS_VARIABLES]}`, cssVars);
  },

  [Action.METADATA]({ commit }, metadata) {
    commit(`${[Mutation.METADATA]}`, metadata);
  }
};
