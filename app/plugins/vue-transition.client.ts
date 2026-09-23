import { plugin as vueTransitionsPlugin } from "@morev/vue-transitions";
import "~/assets/css/vendor/vue-transitions.css";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(vueTransitionsPlugin);
});
