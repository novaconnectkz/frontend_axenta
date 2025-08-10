import { createPinia } from "pinia";
import { createApp } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/dist/vuetify.min.css";
import { useAuthProvider } from "../context/auth";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
const vuetify = createVuetify({ components, directives });
app.use(createPinia());
app.use(vuetify);
app.use(router);
useAuthProvider(app);
app.mount("#app");
