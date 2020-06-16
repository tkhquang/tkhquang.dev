import { Action, Mutation } from "../types";

export default {
  [Action.LOADING_START]({ commit }) {
    commit(`${[Mutation.LOADING_START]}`);
  },
  [Action.LOADING_END]({ commit }) {
    commit(`${[Mutation.LOADING_END]}`);
  }
};
