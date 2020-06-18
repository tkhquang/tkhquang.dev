// TO BE REMOVE SOON AS NOT NEEDED

import Vue from "vue";
import Vuex from "vuex";
import createPersistedState from "vuex-persistedstate";

import page from "./modules/page/";

Vue.use(Vuex);

const clientPlugins = [];

if (process.isClient) {
  clientPlugins.push(createPersistedState());
}

export default new Vuex.Store({
  // Making sure that we're doing
  // everything correctly by enabling
  // strict mode in the dev environment.
  strict: process.env.NODE_ENV !== "production",

  modules: {
    page
  },

  plugins: [...clientPlugins]
});
