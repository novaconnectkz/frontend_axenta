import { createRouter, createWebHistory } from "vue-router";
import LoginPageFixed from "../views/LoginPageFixed.vue";
import SimpleDashboard from "../views/SimpleDashboard.vue";
import SimpleLogin from "../views/SimpleLogin.vue";
import TestDashboard from "../views/TestDashboard.vue";

const routes = [
  { path: "/login", name: "Login", component: LoginPageFixed },
  { path: "/simple-login", name: "SimpleLogin", component: SimpleLogin },
  { path: "/", name: "Dashboard", component: TestDashboard },
  {
    path: "/full-dashboard",
    name: "FullDashboard",
    component: SimpleDashboard,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
