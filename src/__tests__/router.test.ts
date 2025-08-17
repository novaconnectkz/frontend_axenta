import { authGuard, permissionGuard, roleGuard } from "@/router/guards";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

// Мокаем контекст аутентификации
const mockAuth = {
  isAuthenticated: { value: false },
  hasRole: vi.fn(),
  hasPermission: vi.fn(),
};

vi.mock("@/context/auth", () => ({
  useAuth: () => mockAuth,
}));

describe("Router Guards", () => {
  let mockNext: Mock<NavigationGuardNext>;
  let mockTo: Partial<RouteLocationNormalized>;
  let mockFrom: Partial<RouteLocationNormalized>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNext = vi.fn();
    mockTo = {
      path: "/test",
      fullPath: "/test",
      meta: {},
    };
    mockFrom = {
      path: "/",
      fullPath: "/",
    };
    mockAuth.isAuthenticated.value = false;
    mockAuth.hasRole.mockReturnValue(false);
    mockAuth.hasPermission.mockReturnValue(false);
  });

  describe("authGuard", () => {
    it("должен пропускать публичные маршруты", () => {
      mockTo.meta = {};

      authGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("должен перенаправлять на страницу входа для защищенных маршрутов", () => {
      mockTo.meta = { requiresAuth: true };
      mockAuth.isAuthenticated.value = false;

      authGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith({
        path: "/login",
        query: { redirect: "/test" },
      });
    });

    it("должен пропускать аутентифицированных пользователей", () => {
      mockTo.meta = { requiresAuth: true };
      mockAuth.isAuthenticated.value = true;

      authGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("должен перенаправлять аутентифицированных пользователей с гостевых страниц", () => {
      mockTo.meta = { requiresGuest: true };
      mockAuth.isAuthenticated.value = true;

      authGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith("/dashboard");
    });

    it("должен пропускать неаутентифицированных пользователей на гостевые страницы", () => {
      mockTo.meta = { requiresGuest: true };
      mockAuth.isAuthenticated.value = false;

      authGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe("roleGuard", () => {
    it("должен пропускать маршруты без требований к ролям", () => {
      mockTo.meta = {};

      roleGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("должен пропускать пользователей с необходимой ролью", () => {
      mockTo.meta = { roles: ["admin"] };
      mockAuth.hasRole.mockReturnValue(true);

      roleGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockAuth.hasRole).toHaveBeenCalledWith("admin");
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("должен перенаправлять пользователей без необходимой роли", () => {
      mockTo.meta = { roles: ["admin"] };
      mockAuth.hasRole.mockReturnValue(false);

      roleGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith({
        path: "/access-denied",
        query: { from: "/test" },
      });
    });

    it("должен проверять множественные роли", () => {
      mockTo.meta = { roles: ["admin", "manager"] };
      mockAuth.hasRole
        .mockReturnValueOnce(false) // admin
        .mockReturnValueOnce(true); // manager

      roleGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockAuth.hasRole).toHaveBeenCalledWith("admin");
      expect(mockAuth.hasRole).toHaveBeenCalledWith("manager");
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe("permissionGuard", () => {
    it("должен пропускать маршруты без требований к правам", () => {
      mockTo.meta = {};

      permissionGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("должен пропускать пользователей с необходимыми правами", () => {
      mockTo.meta = { permissions: ["users.view"] };
      mockAuth.hasPermission.mockReturnValue(true);

      permissionGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockAuth.hasPermission).toHaveBeenCalledWith("users.view");
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("должен перенаправлять пользователей без необходимых прав", () => {
      mockTo.meta = { permissions: ["users.create"] };
      mockAuth.hasPermission.mockReturnValue(false);

      permissionGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith({
        path: "/access-denied",
        query: { from: "/test" },
      });
    });

    it("должен проверять множественные права", () => {
      mockTo.meta = { permissions: ["users.view", "users.create"] };
      mockAuth.hasPermission
        .mockReturnValueOnce(false) // users.view
        .mockReturnValueOnce(true); // users.create

      permissionGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      );

      expect(mockAuth.hasPermission).toHaveBeenCalledWith("users.view");
      expect(mockAuth.hasPermission).toHaveBeenCalledWith("users.create");
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
