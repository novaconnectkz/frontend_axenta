import { createRouter, createWebHistory } from "vue-router";
import {
  accessGuard,
  createGuestRoute,
  createProtectedRoute,
  createPublicRoute,
  titleGuard,
} from "./guards";

// Импорт компонентов
import DiagnosticLogin from "../views/DiagnosticLogin.vue";
import LoginPageFixed from "../views/LoginPageFixed.vue";
import SimpleDashboard from "../views/SimpleDashboard.vue";
import SimpleLogin from "../views/SimpleLogin.vue";
import TestDashboard from "../views/TestDashboard.vue";

const routes = [
  // Публичные маршруты (только для неавторизованных пользователей)
  createGuestRoute("/login", () => import("@/components/AppleStyleLogin.vue"), {
    title: "Вход в систему",
  }),

  // Старые маршруты для совместимости
  createGuestRoute("/login-old", LoginPageFixed, {
    title: "Вход в систему (старый)",
  }),
  createGuestRoute("/simple-login", SimpleLogin, {
    title: "Простой вход",
  }),

  // Главная страница - показываем красивую форму входа в стиле Apple
  {
    path: "/",
    name: "Home",
    component: () => import("@/components/AppleStyleLogin.vue"),
    meta: {
      title: "Вход в систему",
    },
  },
  createProtectedRoute("/dashboard", () => import("@/views/Dashboard.vue"), {
    title: "Панель управления",
  }),
  createProtectedRoute("/full-dashboard", SimpleDashboard, {
    title: "Полная панель управления",
  }),

  // Тестовая страница
  createPublicRoute("/test", () => import("@/views/TestPage.vue"), {
    title: "Тестовая страница",
  }),



  // Диагностическая страница входа
  createPublicRoute("/diagnostic", DiagnosticLogin, {
    title: "Диагностическая форма входа",
  }),

  // Биллинг - используем существующий компонент
  createProtectedRoute("/billing", () => import("@/views/Billing.vue"), {
    title: "Биллинг",
    permissions: ["billing.view"],
  }),

  // Остальные маршруты временно отключены до создания компонентов
  // TODO: Создать недостающие компоненты для этих маршрутов

  // Служебные страницы
  createPublicRoute(
    "/access-denied",
    () => import("@/views/AccessDenied.vue"),
    {
      title: "Доступ запрещен",
    }
  ),
  createPublicRoute("/not-found", () => import("@/views/NotFound.vue"), {
    title: "Страница не найдена",
  }),

  // Fallback для несуществующих маршрутов
  {
    path: "/:pathMatch(.*)*",
    redirect: "/not-found",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Глобальные guards
router.beforeEach(accessGuard);
router.beforeEach(titleGuard);

// Обработка ошибок навигации
router.onError((error) => {
  console.error("Router error:", error);
});

export default router;
