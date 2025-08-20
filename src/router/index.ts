import { createRouter, createWebHistory } from "vue-router";
import {
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

const routes = [
  // Главная страница - для авторизованных перенаправляем на дашборд
  {
    path: "/",
    name: "Home",
    redirect: (to) => {
      // Проверяем авторизацию из localStorage
      const token = localStorage.getItem("axenta_token");
      return token ? "/dashboard" : "/login";
    },
  },

  // === МАРШРУТЫ АВТОРИЗАЦИИ ===

  // Основная страница входа (заменяет статический index.html)
  createGuestRoute("/login", () => import("@/components/AppleStyleLogin.vue"), {
    title: "Вход в систему",
  }),

  // Старые маршруты для совместимости (можно удалить позже)
  createGuestRoute("/login-old", LoginPageFixed, {
    title: "Вход в систему (старый)",
  }),
  createGuestRoute("/simple-login", SimpleLogin, {
    title: "Простой вход",
  }),
  createPublicRoute("/diagnostic", DiagnosticLogin, {
    title: "Диагностическая форма входа",
  }),

  // === ОСНОВНЫЕ МАРШРУТЫ ПРИЛОЖЕНИЯ (С LAYOUT) ===

  {
    path: "/",
    component: () => import("@/components/Layout/AppLayout.vue"),
    children: [
      // Дашборд (заменяет статический dashboard.html)
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/Dashboard.vue"),
        meta: {
          title: "Панель управления",
          requiresAuth: true,
        },
      },

      // Управление объектами
      {
        path: "objects",
        name: "Objects",
        component: () => import("@/views/ObjectsSimplified.vue"),
        meta: {
          title: "Объекты",
          requiresAuth: true,
        },
      },

      // Управление пользователями
      {
        path: "users",
        name: "Users",
        component: () => import("@/views/Users.vue"),
        meta: {
          title: "Пользователи",
          requiresAuth: true,
          // permissions: ["users.read"], // Отключено - будет включено после настройки системы прав
        },
      },

      // Управление учетными записями (компаниями)
      {
        path: "accounts",
        name: "Accounts",
        component: () => import("@/views/Companies.vue"),
        meta: {
          title: "Учетные записи",
          requiresAuth: true,
          permissions: ["admin.accounts.read"], // Требует админские права
        },
      },

      // Система монтажей
      {
        path: "installations",
        name: "Installations",
        component: () => import("@/views/Installations.vue"),
        meta: {
          title: "Монтажи",
          requiresAuth: true,
        },
      },

      // Управление складом
      {
        path: "warehouse",
        name: "Warehouse",
        component: () => import("@/views/Warehouse.vue"),
        meta: {
          title: "Склад",
          requiresAuth: true,
        },
      },

      // Биллинг
      {
        path: "billing",
        name: "Billing",
        component: () => import("@/views/Billing.vue"),
        meta: {
          title: "Биллинг",
          requiresAuth: true,
          // permissions: ["billing.view"], // Временно отключено для отладки
        },
      },

      // Отчеты и аналитика
      {
        path: "reports",
        name: "Reports",
        component: () => import("@/views/Reports.vue"),
        meta: {
          title: "Отчеты",
          requiresAuth: true,
        },
      },

      // Настройки системы
      {
        path: "settings",
        name: "Settings",
        component: () => import("@/views/Settings.vue"),
        meta: {
          title: "Настройки",
          requiresAuth: true,
          // permissions: ["settings.view"], // Временно отключено для отладки
        },
      },

      // Профиль пользователя
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/views/Profile.vue"),
        meta: {
          title: "Профиль",
          requiresAuth: true,
        },
      },
    ],
  },

  // === СОВМЕСТИМОСТЬ СО СТАРЫМИ МАРШРУТАМИ ===

  createProtectedRoute("/full-dashboard", SimpleDashboard, {
    title: "Полная панель управления",
  }),

  // Тестовые страницы
  createPublicRoute("/test", () => import("@/views/TestPage.vue"), {
    title: "Тестовая страница",
  }),

  // === СЛУЖЕБНЫЕ СТРАНИЦЫ ===

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

// Глобальные guards - убираем accessGuard временно
// router.beforeEach(accessGuard);
router.beforeEach(titleGuard);

// Простая проверка auth без context
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("axenta_token");
  const requiresAuth = to.meta?.requiresAuth;
  const requiresGuest = to.meta?.requiresGuest;

  // Отладочная информация
  console.log("Router guard:", {
    path: to.path,
    token: token ? "EXISTS" : "MISSING",
    requiresAuth,
    requiresGuest,
  });

  if (requiresAuth && !token) {
    console.log("Redirecting to login: no token for protected route");
    next({ path: "/login", query: { redirect: to.fullPath } });
    return;
  }

  if (requiresGuest && token) {
    console.log("Redirecting to dashboard: token exists for guest route");
    next("/dashboard");
    return;
  }

  console.log("Allowing navigation to:", to.path);
  next();
});

// Обработка ошибок навигации
router.onError((error) => {
  console.error("Router error:", error);
});

export default router;
