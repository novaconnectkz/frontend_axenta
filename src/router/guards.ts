import type { RouteMetadata } from "@/types";
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

// Безопасная функция для получения auth context
function getAuthSafely() {
  try {
    const { useAuth } = require("@/context/auth");
    return useAuth();
  } catch (error) {
    console.warn('Auth context not available:', error);
    return null;
  }
}

/**
 * Guard для проверки аутентификации
 */
export const authGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const auth = getAuthSafely();
  const meta = to.meta as RouteMetadata;

  // Если auth context недоступен, используем fallback с localStorage
  if (!auth) {
    const token = localStorage.getItem('axenta_token');
    
    if (meta.requiresAuth && !token) {
      next({
        path: "/login",
        query: { redirect: to.fullPath },
      });
      return;
    }
    
    if (meta.requiresGuest && token) {
      next("/dashboard");
      return;
    }
    
    next();
    return;
  }

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
 * Guard для проверки ролей пользователя
 */
export const roleGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const auth = getAuthSafely();
  const meta = to.meta as RouteMetadata;

  // Если auth недоступен или нет требований к ролям, пропускаем
  if (!auth || !meta.roles || meta.roles.length === 0) {
    next();
    return;
  }

  // Проверяем роли пользователя
  const hasRequiredRole = meta.roles.some((role) => auth.hasRole(role));

  if (!hasRequiredRole) {
    next({
      path: "/access-denied",
      query: { from: to.fullPath },
    });
    return;
  }

  next();
};

/**
 * Guard для проверки разрешений пользователя
 */
export const permissionGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const auth = getAuthSafely();
  const meta = to.meta as RouteMetadata;

  // Если auth недоступен или нет требований к разрешениям, пропускаем
  if (!auth || !meta.permissions || meta.permissions.length === 0) {
    next();
    return;
  }

  // Проверяем разрешения пользователя
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
  authGuard(to, from, (authResult) => {
    if (authResult === false || typeof authResult === 'object') {
      // Если authGuard заблокировал навигацию, передаем результат
      next(authResult);
      return;
    }

    // Затем проверяем роли
    roleGuard(to, from, (roleResult) => {
      if (roleResult === false || typeof roleResult === 'object') {
        next(roleResult);
        return;
      }

      // Наконец проверяем разрешения
      permissionGuard(to, from, next);
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
  
  // Устанавливаем заголовок страницы
  if (meta.title) {
    document.title = `${meta.title} - Axenta CRM`;
  } else {
    document.title = 'Axenta CRM';
  }

  next();
};

/**
 * Вспомогательные функции для создания маршрутов с предустановленными мета-данными
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

export const createGuestRoute = (
  path: string,
  component: any,
  meta: Partial<RouteMetadata> = {}
) => ({
  path,
  component,
  meta: {
    requiresGuest: true,
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
    ...meta,
  },
});
