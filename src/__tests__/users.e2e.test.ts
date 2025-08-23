import usersService from "@/services/usersService";
import type {
  UsersResponse,
  UserStats,
  UserWithRelations,
} from "@/types/users";
import Users from "@/views/Users.vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createVuetify } from "vuetify";

// Mock users service
vi.mock("@/services/usersService");
const mockUsersService = vi.mocked(usersService);

// Mock Vuetify
const vuetify = createVuetify();

// Mock data
const mockUsers: UserWithRelations[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    first_name: "Admin",
    last_name: "User",
    is_active: true,
    user_type: "admin",
    role_id: 1,
    login_count: 5,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    role: {
      id: 1,
      name: "admin",
      display_name: "Администратор",
      description: "Полные права доступа",
      color: "#1976D2",
      priority: 100,
      is_active: true,
      is_system: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
  {
    id: 2,
    username: "manager",
    email: "manager@example.com",
    first_name: "Manager",
    last_name: "User",
    is_active: true,
    user_type: "manager",
    role_id: 2,
    login_count: 3,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    role: {
      id: 2,
      name: "manager",
      display_name: "Менеджер",
      description: "Управление пользователями и объектами",
      color: "#4CAF50",
      priority: 50,
      is_active: true,
      is_system: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
];

const mockUsersResponse: UsersResponse = {
  status: "success",
  data: {
    items: mockUsers,
    total: 2,
    page: 1,
    limit: 20,
    pages: 1,
  },
};

const mockStats: UserStats = {
  total: 2,
  active: 2,
  inactive: 0,
  recent_logins: 2,
  by_role: {
    admin: 1,
    manager: 1,
  },
  by_type: {
    admin: 1,
    manager: 1,
  },
};

describe("Users Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUsersService.getUsers.mockResolvedValue(mockUsersResponse);
    mockUsersService.getUsersStats.mockResolvedValue(mockStats);
    mockUsersService.getRoles.mockResolvedValue({
      status: "success",
      data: {
        items: [
          {
            id: 1,
            name: "admin",
            display_name: "Администратор",
            description: "Полные права доступа",
            color: "#1976D2",
            priority: 100,
            is_active: true,
            is_system: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        pages: 1,
      },
    });
    mockUsersService.getUserTemplates.mockResolvedValue({
      status: "success",
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 100,
        pages: 0,
      },
    });
  });

  it("should render users page with title", async () => {
    const wrapper = mount(Users, {
      global: {
        plugins: [vuetify],
      },
    });

    expect(wrapper.find(".page-title").text()).toBe(
      "Управление пользователями"
    );
    expect(wrapper.find(".page-subtitle").text()).toBe(
      "Пользователи, роли и права доступа"
    );
  });

  it("should load and display users", async () => {
    const wrapper = mount(Users, {
      global: {
        plugins: [vuetify],
      },
    });

    // Wait for component to mount and load data
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockUsersService.getUsers).toHaveBeenCalled();
    expect(mockUsersService.getUsersStats).toHaveBeenCalled();
  });

  it("should display user statistics", async () => {
    const wrapper = mount(Users, {
      global: {
        plugins: [vuetify],
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const statCards = wrapper.findAll(".stat-card");
    expect(statCards).toHaveLength(4);
  });

  it("should show create user button", () => {
    const wrapper = mount(Users, {
      global: {
        plugins: [vuetify],
      },
    });

    const createButton = wrapper.find('[data-testid="create-button"]');
    expect(createButton.exists()).toBe(true);
    expect(createButton.text()).toBe("Создать пользователя");
  });
});

describe("Users Service Integration", () => {
  it("should handle API errors gracefully", async () => {
    mockUsersService.getUsers.mockRejectedValue(new Error("API Error"));

    const wrapper = mount(Users, {
      global: {
        plugins: [vuetify],
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should handle error without crashing
    expect(wrapper.vm.loading).toBe(false);
  });
});
