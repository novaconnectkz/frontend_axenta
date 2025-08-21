import { describe, it, expect } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

// Импортируем роуты из нашего роутера
import router from '@/router/index';

describe('Navigation Tests', () => {
  describe('Route Configuration', () => {
    it('should have warehouse route configured', () => {
      const routes = router.getRoutes();
      const warehouseRoute = routes.find(route => route.path === '/warehouse');
      
      expect(warehouseRoute).toBeDefined();
      expect(warehouseRoute?.name).toBe('Warehouse');
      expect(warehouseRoute?.meta?.title).toBe('Склад');
      expect(warehouseRoute?.meta?.requiresAuth).toBe(true);
    });

    it('should have installations route configured', () => {
      const routes = router.getRoutes();
      const installationsRoute = routes.find(route => route.path === '/installations');
      
      expect(installationsRoute).toBeDefined();
      expect(installationsRoute?.name).toBe('Installations');
      expect(installationsRoute?.meta?.title).toBe('Монтажи');
      expect(installationsRoute?.meta?.requiresAuth).toBe(true);
    });

    it('should have dashboard route configured', () => {
      const routes = router.getRoutes();
      const dashboardRoute = routes.find(route => route.path === '/dashboard');
      
      expect(dashboardRoute).toBeDefined();
      expect(dashboardRoute?.name).toBe('Dashboard');
      expect(dashboardRoute?.meta?.title).toBe('Панель управления');
      expect(dashboardRoute?.meta?.requiresAuth).toBe(true);
    });

    it('should have all main routes configured', () => {
      const routes = router.getRoutes();
      const mainPaths = [
        '/dashboard',
        '/objects', 
        '/users',
        '/accounts',
        '/installations',
        '/warehouse',
        '/billing',
        '/reports',
        '/settings',
        '/profile'
      ];

      mainPaths.forEach(path => {
        const route = routes.find(r => r.path === path);
        expect(route, `Route ${path} should be configured`).toBeDefined();
        expect(route?.meta?.requiresAuth, `Route ${path} should require auth`).toBe(true);
      });
    });
  });

  describe('Route Navigation', () => {
    it('should be able to navigate to warehouse', async () => {
      await router.push('/warehouse');
      expect(router.currentRoute.value.path).toBe('/warehouse');
      expect(router.currentRoute.value.name).toBe('Warehouse');
    });

    it('should be able to navigate to installations', async () => {
      await router.push('/installations');
      expect(router.currentRoute.value.path).toBe('/installations');
      expect(router.currentRoute.value.name).toBe('Installations');
    });

    it('should redirect root to login when no token', async () => {
      // Очищаем токен
      localStorage.removeItem('axenta_token');
      
      await router.push('/');
      
      // Роутер должен перенаправить на /login
      expect(router.currentRoute.value.path).toBe('/login');
    });

    it('should redirect root to dashboard when token exists', async () => {
      // Устанавливаем токен
      localStorage.setItem('axenta_token', 'test-token');
      
      await router.push('/');
      
      // Роутер должен перенаправить на /dashboard
      expect(router.currentRoute.value.path).toBe('/dashboard');
    });
  });

  describe('Route Meta Information', () => {
    it('should have correct titles for all routes', () => {
      const routes = router.getRoutes();
      const expectedTitles: Record<string, string> = {
        '/dashboard': 'Панель управления',
        '/objects': 'Объекты',
        '/users': 'Пользователи',
        '/accounts': 'Учетные записи',
        '/installations': 'Монтажи',
        '/warehouse': 'Склад',
        '/billing': 'Биллинг',
        '/reports': 'Отчеты',
        '/settings': 'Настройки',
        '/profile': 'Профиль',
      };

      Object.entries(expectedTitles).forEach(([path, expectedTitle]) => {
        const route = routes.find(r => r.path === path);
        expect(route?.meta?.title, `Route ${path} should have correct title`).toBe(expectedTitle);
      });
    });

    it('should have auth requirement for protected routes', () => {
      const routes = router.getRoutes();
      const protectedPaths = [
        '/dashboard',
        '/objects',
        '/users', 
        '/accounts',
        '/installations',
        '/warehouse',
        '/billing',
        '/reports',
        '/settings',
        '/profile'
      ];

      protectedPaths.forEach(path => {
        const route = routes.find(r => r.path === path);
        expect(route?.meta?.requiresAuth, `Route ${path} should require authentication`).toBe(true);
      });
    });
  });
});

describe('Navigation Items Configuration', () => {
  // Тест для проверки соответствия навигационных элементов и маршрутов
  it('should have matching navigation items and routes', () => {
    const expectedNavItems = [
      { path: '/dashboard', title: 'Дашборд', icon: 'mdi-view-dashboard' },
      { path: '/accounts', title: 'Учетные записи', icon: 'mdi-domain' },
      { path: '/objects', title: 'Объекты', icon: 'mdi-office-building' },
      { path: '/users', title: 'Пользователи', icon: 'mdi-account-group' },
      { path: '/installations', title: 'Монтажи', icon: 'mdi-tools' },
      { path: '/warehouse', title: 'Склад', icon: 'mdi-warehouse' },
      { path: '/billing', title: 'Биллинг', icon: 'mdi-currency-usd' },
      { path: '/reports', title: 'Отчеты', icon: 'mdi-chart-line' },
      { path: '/settings', title: 'Настройки', icon: 'mdi-cog' },
    ];

    const routes = router.getRoutes();
    
    expectedNavItems.forEach(navItem => {
      const route = routes.find(r => r.path === navItem.path);
      expect(route, `Route for ${navItem.title} should exist`).toBeDefined();
    });
  });
});
