import { useAuth } from "@/context/auth";
import type { RouteMetadata } from "@/types";
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

/**
 * Guard для проверки аутентификации
 */
export const authGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const auth = useAuth();
  const meta = to.meta as RouteMetadata;

  // Если маршрут требует аутентификации
  if (meta.requiresAuth && !auth.isAuthenticated.value) {
    // Сохраняем путь для редиректа после входа
    next({
      path: "/login",
      query: { redirect: to.fullPath },
    });
    return;
  }

  // Если маршрут только для гостей (например, страница входа)
  if (meta.requiresGuest && auth.isAuthenticated.value) {
    next("/dashboard");
    return;
  }

  next();
};

/**
 * Guard для проверки ролей
 */
export const roleGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const auth = useAuth();
  const meta = to.meta as RouteMetadata;

  // Если маршрут требует определенные роли
  if (meta.roles && meta.roles.length > 0) {
    const hasRequiredRole = meta.roles.some((role) => auth.hasRole(role));

    if (!hasRequiredRole) {
      // Перенаправляем на страницу "доступ запрещен"
      next({
        path: "/access-denied",
        query: { from: to.fullPath },
      });
      return;
    }
  }

  next();
};

/**
 * Guard для проверки прав доступа
 */
export const permissionGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const auth = useAuth();
  const meta = to.meta as RouteMetadata;

  // Если маршрут требует определенные права
  if (meta.permissions && meta.permissions.length > 0) {
    const hasRequiredPermission = meta.permissions.some((permission) =>
      auth.hasPermission(permission)
    );

    if (!hasRequiredPermission) {
      next({
        path: "/access-denied",
        query: { from: to.fullPath },
      });
      return;
    }
  }

  next();
};

/**
 * Комбинированный guard для полной проверки доступа
 */
export const accessGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  // Сначала проверяем аутентификацию
  authGuard(to, from, (result) => {
    if (
      typeof result === "string" ||
      (typeof result === "object" && result !== undefined)
    ) {
      next(result);
      return;
    }

    // Затем проверяем роли
    roleGuard(to, from, (result) => {
      if (
        typeof result === "string" ||
        (typeof result === "object" && result !== undefined)
      ) {
        next(result);
        return;
      }

      // Наконец проверяем права
      permissionGuard(to, from, (result) => {
        next(result);
      });
    });
  });
};

/**
 * Guard для установки заголовка страницы
 */
export const titleGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const meta = to.meta as RouteMetadata;

  if (meta.title) {
    document.title = `${meta.title} - Axenta CRM`;
  } else {
    document.title = "Axenta CRM";
  }

  next();
};

/**
 * Утилитарные функции для создания защищенных маршрутов
 */
export const createProtectedRoute = (
  path: string,
  component: any,
  meta: Partial<RouteMetadata> = {}
) => ({
  path,
  component,
  meta: {
    requiresAuth: true,
    ...meta,
  },
});

export const createPublicRoute = (
  path: string,
  component: any,
  meta: Partial<RouteMetadata> = {}
) => ({
  path,
  component,
  meta: {
    requiresAuth: false,
    ...meta,
  },
});

export const createGuestRoute = (
  path: string,
  component: any,
  meta: Partial<RouteMetadata> = {}
) => ({
  path,
  component,
  meta: {
    requiresAuth: false,
    requiresGuest: true,
    ...meta,
  },
});

export const createAdminRoute = (
  path: string,
  component: any,
  meta: Partial<RouteMetadata> = {}
) => ({
  path,
  component,
  meta: {
    requiresAuth: true,
    roles: ["admin"],
    ...meta,
  },
});
