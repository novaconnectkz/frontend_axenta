import axios from "axios";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

// Типы для пользователя
export interface User {
  id: string;
  username: string;
  name: string;
  accountName: string;
  accountType: "admin" | "manager" | "tech" | "accountant";
  creatorName: string;
  lastLogin: string;
}

export interface UserProfile {
  user: User;
  permissions: string[];
  companyId: string;
}

// Store для управления пользователями
export const useUserStore = defineStore("user", () => {
  // State
  const currentUser = ref<User | null>(null);
  const userProfile = ref<UserProfile | null>(null);
  const users = ref<User[]>([]);
  const isLoading = ref(false);
  const error = ref("");

  // Getters
  const isAuthenticated = computed(() => !!currentUser.value);
  const userName = computed(() => currentUser.value?.name || "");
  const userRole = computed(() => currentUser.value?.accountType || "");
  const isAdmin = computed(() => ["admin", "manager"].includes(userRole.value));
  const canManageDevices = computed(() =>
    ["admin", "manager", "tech"].includes(userRole.value)
  );
  const canViewReports = computed(() =>
    ["admin", "manager", "accountant"].includes(userRole.value)
  );

  // Actions
  const setCurrentUser = (user: User) => {
    currentUser.value = user;
  };

  const clearCurrentUser = () => {
    currentUser.value = null;
    userProfile.value = null;
  };

  const fetchCurrentUser = async () => {
    isLoading.value = true;
    error.value = "";

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Токен авторизации не найден");
      }

      const response = await axios.get("/current_user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === "success") {
        currentUser.value = response.data.data.user;
        return response.data.data.user;
      } else {
        throw new Error(
          response.data.error || "Ошибка получения данных пользователя"
        );
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка загрузки пользователя";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchUserProfile = async () => {
    if (!currentUser.value) {
      throw new Error("Пользователь не авторизован");
    }

    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.get(
        `/users/${currentUser.value.id}/profile`
      );

      if (response.data.status === "success") {
        userProfile.value = response.data.data;
        return response.data.data;
      } else {
        throw new Error(response.data.error || "Ошибка получения профиля");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка загрузки профиля";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchUsers = async (filters?: { role?: string; active?: boolean }) => {
    isLoading.value = true;
    error.value = "";

    try {
      const params = new URLSearchParams();
      if (filters?.role) params.append("role", filters.role);
      if (filters?.active !== undefined)
        params.append("active", filters.active.toString());

      const response = await axios.get(`/users?${params.toString()}`);

      if (response.data.status === "success") {
        users.value = response.data.data.items || [];
        return response.data.data;
      } else {
        throw new Error(
          response.data.error || "Ошибка получения списка пользователей"
        );
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка загрузки пользователей";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateUserProfile = async (profileData: Partial<User>) => {
    if (!currentUser.value) {
      throw new Error("Пользователь не авторизован");
    }

    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.put(
        `/users/${currentUser.value.id}`,
        profileData
      );

      if (response.data.status === "success") {
        // Обновляем текущего пользователя
        currentUser.value = { ...currentUser.value, ...response.data.data };
        return response.data.data;
      } else {
        throw new Error(response.data.error || "Ошибка обновления профиля");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка обновления профиля";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createUser = async (userData: Omit<User, "id" | "lastLogin">) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.post("/users", userData);

      if (response.data.status === "success") {
        // Добавляем нового пользователя в список
        users.value.push(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.error || "Ошибка создания пользователя");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка создания пользователя";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.put(`/users/${userId}`, userData);

      if (response.data.status === "success") {
        // Обновляем пользователя в списке
        const index = users.value.findIndex((user) => user.id === userId);
        if (index !== -1) {
          users.value[index] = { ...users.value[index], ...response.data.data };
        }

        // Если это текущий пользователь, обновляем и его
        if (currentUser.value?.id === userId) {
          currentUser.value = { ...currentUser.value, ...response.data.data };
        }

        return response.data.data;
      } else {
        throw new Error(
          response.data.error || "Ошибка обновления пользователя"
        );
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка обновления пользователя";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteUser = async (userId: string) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.delete(`/users/${userId}`);

      if (response.data.status === "success") {
        // Удаляем пользователя из списка
        users.value = users.value.filter((user) => user.id !== userId);
        return true;
      } else {
        throw new Error(response.data.error || "Ошибка удаления пользователя");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка удаления пользователя";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = "";
  };

  const hasPermission = (permission: string): boolean => {
    if (!userProfile.value) return false;
    return userProfile.value.permissions.includes(permission);
  };

  const canAccessResource = (resourceType: string, action: string): boolean => {
    const role = userRole.value;

    // Права доступа по ролям
    const permissions = {
      admin: ["*"], // Все права
      manager: ["warehouse.*", "users.read", "reports.*"],
      tech: [
        "devices.read",
        "devices.reserve",
        "devices.install",
        "devices.uninstall",
      ],
      accountant: ["*.read", "reports.*"],
    };

    const userPermissions = permissions[role as keyof typeof permissions] || [];

    // Проверяем точное совпадение или wildcard
    return userPermissions.some(
      (perm) =>
        perm === "*" ||
        perm === `${resourceType}.*` ||
        perm === `${resourceType}.${action}`
    );
  };

  return {
    // State
    currentUser,
    userProfile,
    users,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    userName,
    userRole,
    isAdmin,
    canManageDevices,
    canViewReports,

    // Actions
    setCurrentUser,
    clearCurrentUser,
    fetchCurrentUser,
    fetchUserProfile,
    fetchUsers,
    updateUserProfile,
    createUser,
    updateUser,
    deleteUser,
    clearError,
    hasPermission,
    canAccessResource,
  };
});
