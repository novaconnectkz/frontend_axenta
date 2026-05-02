import { createRouter, createWebHistory } from "vue-router";
import {
  createGuestRoute,
  createProtectedRoute,
  createPublicRoute,
  titleGuard,
} from "./guards";
import { isJWTTokenValid } from "@/utils/authInit";

// Импорт компонентов

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


  // === ЛОКАЛЬНАЯ АВТОРИЗАЦИЯ ===
  createGuestRoute("/local-login", () => import("@/views/LocalLogin.vue"), {
    title: "Локальный вход в систему",
  }),


  // === ОЧИСТКА АВТОРИЗАЦИИ ===
  createPublicRoute("/clear-auth", () => import("@/views/ClearAuth.vue"), {
    title: "Очистка авторизации",
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
        component: () => import("@/views/Objects.vue"),
        meta: {
          title: "Объекты",
          requiresAuth: true, // Возвращаем требование авторизации
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
      {
        path: "users/create",
        name: "CreateUser",
        component: () => import("@/views/CreateUser.vue"),
        meta: {
          title: "Создание пользователя",
          requiresAuth: true,
        },
      },

      // Управление учетными записями (компаниями)
      {
        path: "accounts",
        name: "Accounts",
        component: () => import("@/views/AccountsPage.vue"),
        meta: {
          title: "Учетные записи",
          requiresAuth: true,
          // permissions: ["admin.accounts.read"], // Временно отключено до реализации системы разрешений
        },
      },
      {
        path: "accounts/create",
        name: "CreateAccount",
        component: () => import("@/views/CreateAccountPage.vue"),
        meta: {
          title: "Создание учетной записи",
          requiresAuth: true,
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
        component: () => import("@/views/WarehouseWorking.vue"),
        meta: {
          title: "Склад",
          requiresAuth: true,
        },
      },

      // Управление договорами
      {
        path: "contracts",
        name: "Contracts",
        component: () => import("@/views/ContractsSimple.vue"),
        meta: {
          title: "Договоры",
          requiresAuth: true,
          // permissions: ["contracts.view"], // Временно отключено для отладки
        },
      },
      {
        path: "contracts/create",
        name: "CreateContract",
        component: () => import("@/views/CreateContract.vue"),
        meta: {
          title: "Создание договора",
          requiresAuth: true,
        },
      },
      {
        path: "contracts/edit/:id",
        name: "EditContract",
        component: () => import("@/views/EditContract.vue"),
        meta: {
          title: "Редактирование договора",
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

      // Вся активность
      {
        path: "activity",
        name: "Activity",
        component: () => import("@/views/Activity.vue"),
        meta: {
          title: "Вся активность",
          requiresAuth: true,
        },
      },

      // Журнал уведомлений
      {
        path: "notification-logs",
        name: "NotificationLogs",
        component: () => import("@/views/NotificationLogs.vue"),
        meta: {
          title: "Журнал уведомлений",
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

      // Шаблоны для создания объектов
      {
        path: "settings/templates/objects",
        name: "TemplateObjects",
        component: () => import("@/views/TemplateObjectsPage.vue"),
        meta: {
          title: "Шаблоны для создания объектов",
          requiresAuth: true,
        },
      },

      // Шаблоны для создания УЗ
      {
        path: "settings/templates/users",
        name: "TemplateUsers",
        component: () => import("@/views/TemplateUsersPage.vue"),
        meta: {
          title: "Шаблоны для создания УЗ",
          requiresAuth: true,
        },
      },

      // Шаблоны отчетов
      {
        path: "settings/templates/reports",
        name: "TemplateReports",
        component: () => import("@/views/TemplateReportsPage.vue"),
        meta: {
          title: "Шаблоны отчетов",
          requiresAuth: true,
        },
      },

      // Демо интерфейса кэша
      {
        path: "cache-demo",
        name: "CacheDemo",
        component: () => import("@/views/CacheDemo.vue"),
        meta: {
          title: "Демо кэша",
          requiresAuth: true,
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

      // Профиль локального пользователя
      {
        path: "local-profile",
        name: "LocalProfile",
        component: () => import("@/views/LocalProfile.vue"),
        meta: {
          title: "Локальный профиль",
          requiresAuth: true,
        },
      },
    ],
  },


  // === СЛУЖЕБНЫЕ СТРАНИЦЫ ===

  // Wialon OAuth callback страница
  createPublicRoute(
    "/wialon-callback",
    () => import("@/views/WialonCallbackPage.vue"),
    {
      title: "Авторизация Wialon",
    }
  ),

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
  let token = localStorage.getItem("axenta_token");
  let localToken = localStorage.getItem("local_access_token");

  // Проверяем валидность токенов (если это JWT)
  if (token && !isJWTTokenValid(token)) {
    console.log("🚨 Axenta token expired, removing...");
    localStorage.removeItem("axenta_token");
    localStorage.removeItem("axenta_user");
    localStorage.removeItem("axenta_company");
    localStorage.removeItem("axenta_token_expiry");
    token = null;
  }

  if (localToken && !isJWTTokenValid(localToken)) {
    console.log("🚨 Local token expired, removing...");
    localStorage.removeItem("local_access_token");
    localStorage.removeItem("local_refresh_token");
    localStorage.removeItem("local_user");
    localToken = null;
  }

  // Проверяем, есть ли любой валидный токен
  const hasAnyToken = token || localToken;

  const requiresAuth = to.meta?.requiresAuth;
  const requiresGuest = to.meta?.requiresGuest;

  // Отладочная информация
  console.log("🚀 Router guard:", {
    path: to.path,
    name: to.name,
    fullPath: to.fullPath,
    axentaToken: token ? "EXISTS" : "MISSING",
    localToken: localToken ? "EXISTS" : "MISSING",
    hasAnyToken,
    requiresAuth,
    requiresGuest,
    meta: to.meta,
  });

  if (requiresAuth && !hasAnyToken) {
    console.log("Redirecting to login: no token for protected route");
    next({ path: "/login", query: { redirect: to.fullPath } });
    return;
  }

  if (requiresGuest && hasAnyToken) {
    console.log("Redirecting to dashboard: token exists for guest route");
    next("/dashboard");
    return;
  }

  // Дополнительная отладка для installations
  if (to.path === "/installations") {
    console.log("🔄 Navigating to Installations page");
  }

  console.log("Allowing navigation to:", to.path);
  next();
});

// Обработка ошибок навигации
router.onError((error) => {
  console.error("Router error:", error);

  // Vite SPA: после деплоя старый index.html в браузере ссылается на
  // chunk с устаревшим хешем (Objects-XXX.js → 404). Lazy-import view
  // фейлится — авто-перезагружаем чтобы подтянуть свежий bundle.
  const msg = (error as Error)?.message || "";
  if (
    msg.includes("dynamically imported module") ||
    msg.includes("Failed to fetch") ||
    msg.includes("Importing a module script failed")
  ) {
    // Защита от бесконечного цикла: один reload в сессии
    if (!sessionStorage.getItem("acrm_chunk_reload")) {
      sessionStorage.setItem("acrm_chunk_reload", String(Date.now()));
      window.location.reload();
    }
  }
});

// Сбрасываем флаг защиты после успешной первой навигации
router.afterEach(() => {
  sessionStorage.removeItem("acrm_chunk_reload");
});

// Экспортируем routes для тестов
export { routes };
export default router;
