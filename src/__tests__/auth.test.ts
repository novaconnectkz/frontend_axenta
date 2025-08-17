import { useAuthProvider } from "@/context/auth";
import axios from "axios";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Мокаем axios
vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    post: vi.fn(),
  },
}));

// Мокаем localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Мокаем config
vi.mock("@/config/env", () => ({
  config: {
    apiBaseUrl: "http://localhost:8080",
  },
}));

describe("Auth Context", () => {
  let mockAxiosPost: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAxiosPost = axios.post as Mock;
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("должен инициализироваться с пустыми значениями", () => {
    const auth = useAuthProvider();

    expect(auth.user.value).toBeNull();
    expect(auth.token.value).toBeNull();
    expect(auth.company.value).toBeNull();
    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.isLoading.value).toBe(false);
    expect(auth.error.value).toBeNull();
  });

  it("должен загружать данные из localStorage при инициализации", () => {
    const userData = {
      id: "1",
      username: "testuser",
      name: "Test User",
      accountName: "Test Account",
      accountType: "business",
      creatorName: "Admin",
      lastLogin: "2023-01-01T00:00:00Z",
      accountBlockingDatetime: null,
    };
    const token = "valid.jwt.token";
    const companyData = {
      id: "1",
      name: "Test Company",
      schema: "tenant_test",
      isActive: true,
    };

    // Мокаем действительный токен (не истекший)
    const validPayload = {
      exp: Math.floor(Date.now() / 1000) + 3600, // истекает через час
    };
    const encodedPayload = btoa(JSON.stringify(validPayload));
    const validToken = `header.${encodedPayload}.signature`;

    localStorageMock.getItem
      .mockReturnValueOnce(validToken)
      .mockReturnValueOnce(JSON.stringify(userData))
      .mockReturnValueOnce(JSON.stringify(companyData));

    const auth = useAuthProvider();

    expect(auth.user.value).toEqual(userData);
    expect(auth.token.value).toBe(validToken);
    expect(auth.company.value).toEqual(companyData);
    expect(auth.isAuthenticated.value).toBe(true);
  });

  it("должен очищать данные если токен истек", () => {
    // Мокаем истекший токен
    const expiredPayload = {
      exp: Math.floor(Date.now() / 1000) - 3600, // истек час назад
    };
    const encodedPayload = btoa(JSON.stringify(expiredPayload));
    const expiredToken = `header.${encodedPayload}.signature`;

    localStorageMock.getItem
      .mockReturnValueOnce(expiredToken)
      .mockReturnValueOnce('{"id": "1"}');

    const auth = useAuthProvider();

    expect(auth.user.value).toBeNull();
    expect(auth.token.value).toBeNull();
    expect(auth.isAuthenticated.value).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  it("должен успешно выполнять вход", async () => {
    const userData = {
      id: "1",
      username: "testuser",
      name: "Test User",
      accountName: "Test Account",
      accountType: "business",
      creatorName: "Admin",
      lastLogin: "2023-01-01T00:00:00Z",
      accountBlockingDatetime: null,
    };
    // Создаем валидный JWT токен с будущим временем истечения
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600, // истекает через час
        userId: "1",
        username: "testuser",
      })
    );
    const signature = "mock-signature";
    const token = `${header}.${payload}.${signature}`;
    const companyData = {
      id: "1",
      name: "Test Company",
      schema: "tenant_test",
      isActive: true,
    };

    mockAxiosPost.mockResolvedValue({
      data: {
        data: {
          user: userData,
          token: token,
          company: companyData,
        },
      },
    });

    const auth = useAuthProvider();

    await auth.login({
      username: "testuser",
      password: "password123",
    });

    expect(auth.user.value).toEqual(userData);
    expect(auth.token.value).toBe(token);
    expect(auth.company.value).toEqual(companyData);
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.error.value).toBeNull();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "axenta_token",
      token
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "axenta_user",
      JSON.stringify(userData)
    );
  });

  it("должен обрабатывать ошибки входа", async () => {
    const errorMessage = "Invalid credentials";
    mockAxiosPost.mockRejectedValue({
      response: {
        data: {
          error: errorMessage,
        },
      },
    });

    const auth = useAuthProvider();

    await expect(
      auth.login({
        username: "testuser",
        password: "wrongpassword",
      })
    ).rejects.toThrow(errorMessage);

    expect(auth.user.value).toBeNull();
    expect(auth.token.value).toBeNull();
    expect(auth.error.value).toBe(errorMessage);
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  it("должен очищать данные при выходе", () => {
    const auth = useAuthProvider();

    // Устанавливаем данные
    auth.user.value = {
      id: "1",
      username: "testuser",
      name: "Test User",
      accountName: "Test Account",
      accountType: "business",
      creatorName: "Admin",
      lastLogin: "2023-01-01T00:00:00Z",
      accountBlockingDatetime: null,
    };
    auth.token.value = "some.jwt.token";
    auth.company.value = {
      id: "1",
      name: "Test Company",
      schema: "tenant_test",
      isActive: true,
    };

    auth.logout();

    expect(auth.user.value).toBeNull();
    expect(auth.token.value).toBeNull();
    expect(auth.company.value).toBeNull();
    expect(auth.error.value).toBeNull();
    expect(auth.isAuthenticated.value).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("axenta_token");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("axenta_user");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("axenta_company");
  });

  it("должен правильно проверять роли", () => {
    const auth = useAuthProvider();

    // Без пользователя
    expect(auth.hasRole("admin")).toBe(false);

    // С обычным пользователем
    auth.user.value = {
      id: "1",
      username: "testuser",
      name: "Test User",
      accountName: "Test Account",
      accountType: "business",
      creatorName: "Admin",
      lastLogin: "2023-01-01T00:00:00Z",
      accountBlockingDatetime: null,
      isAdmin: false,
    };
    expect(auth.hasRole("admin")).toBe(false);

    // С администратором
    auth.user.value.isAdmin = true;
    expect(auth.hasRole("admin")).toBe(true);
  });

  it("должен правильно проверять права доступа", () => {
    const auth = useAuthProvider();

    // Без пользователя
    expect(auth.hasPermission("users.create")).toBe(false);

    // С обычным пользователем
    auth.user.value = {
      id: "1",
      username: "testuser",
      name: "Test User",
      accountName: "Test Account",
      accountType: "business",
      creatorName: "Admin",
      lastLogin: "2023-01-01T00:00:00Z",
      accountBlockingDatetime: null,
      isAdmin: false,
    };
    expect(auth.hasPermission("users.create")).toBe(false);

    // С администратором
    auth.user.value.isAdmin = true;
    expect(auth.hasPermission("users.create")).toBe(true);
  });

  it("должен очищать ошибки", () => {
    const auth = useAuthProvider();
    auth.error.value = "Some error";

    auth.clearError();

    expect(auth.error.value).toBeNull();
  });
});
