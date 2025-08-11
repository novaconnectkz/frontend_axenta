import axios from "axios";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

// Типы для устройств
export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  modelId: string;
  modelName: string;
  status: "available" | "reserved" | "installed" | "maintenance" | "retired";
  companyId: string;
  locationId?: string;
  locationName?: string;
  assignedTechId?: string;
  assignedTechName?: string;
  orderId?: string;
  installDate?: string;
  warrantyExpiry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceFilter {
  status?: string;
  modelId?: string;
  locationId?: string;
  assignedTechId?: string;
  companyId?: string;
  search?: string;
}

export interface DeviceStats {
  total: number;
  available: number;
  reserved: number;
  installed: number;
  maintenance: number;
  retired: number;
}

// Store для управления устройствами
export const useDeviceStore = defineStore("devices", () => {
  // State
  const devices = ref<Device[]>([]);
  const currentDevice = ref<Device | null>(null);
  const deviceStats = ref<DeviceStats>({
    total: 0,
    available: 0,
    reserved: 0,
    installed: 0,
    maintenance: 0,
    retired: 0,
  });
  const isLoading = ref(false);
  const error = ref("");
  const filters = ref<DeviceFilter>({});

  // Getters
  const availableDevices = computed(() =>
    devices.value.filter((device) => device.status === "available")
  );

  const reservedDevices = computed(() =>
    devices.value.filter((device) => device.status === "reserved")
  );

  const installedDevices = computed(() =>
    devices.value.filter((device) => device.status === "installed")
  );

  const filteredDevices = computed(() => {
    let result = devices.value;

    if (filters.value.status) {
      result = result.filter(
        (device) => device.status === filters.value.status
      );
    }

    if (filters.value.modelId) {
      result = result.filter(
        (device) => device.modelId === filters.value.modelId
      );
    }

    if (filters.value.locationId) {
      result = result.filter(
        (device) => device.locationId === filters.value.locationId
      );
    }

    if (filters.value.assignedTechId) {
      result = result.filter(
        (device) => device.assignedTechId === filters.value.assignedTechId
      );
    }

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase();
      result = result.filter(
        (device) =>
          device.name.toLowerCase().includes(search) ||
          device.serialNumber.toLowerCase().includes(search) ||
          device.modelName.toLowerCase().includes(search)
      );
    }

    return result;
  });

  // Actions
  const fetchDevices = async (filterParams?: DeviceFilter) => {
    isLoading.value = true;
    error.value = "";

    try {
      const params = new URLSearchParams();

      if (filterParams?.status) params.append("status", filterParams.status);
      if (filterParams?.modelId)
        params.append("model_id", filterParams.modelId);
      if (filterParams?.locationId)
        params.append("location_id", filterParams.locationId);
      if (filterParams?.assignedTechId)
        params.append("assigned_tech_id", filterParams.assignedTechId);
      if (filterParams?.companyId)
        params.append("company_id", filterParams.companyId);
      if (filterParams?.search) params.append("search", filterParams.search);

      const response = await axios.get(`/objects?${params.toString()}`);

      if (response.data.status === "success") {
        devices.value = response.data.data.items || [];
        return response.data.data;
      } else {
        throw new Error(
          response.data.error || "Ошибка получения списка устройств"
        );
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка загрузки устройств";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDevice = async (deviceId: string) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.get(`/objects/${deviceId}`);

      if (response.data.status === "success") {
        currentDevice.value = response.data.data;
        return response.data.data;
      } else {
        throw new Error(response.data.error || "Ошибка получения устройства");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка загрузки устройства";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDeviceStats = async (companyId?: string) => {
    isLoading.value = true;
    error.value = "";

    try {
      const params = companyId ? `?company_id=${companyId}` : "";
      const response = await axios.get(`/objects/stats${params}`);

      if (response.data.status === "success") {
        deviceStats.value = response.data.data;
        return response.data.data;
      } else {
        throw new Error(response.data.error || "Ошибка получения статистики");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка загрузки статистики";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createDevice = async (
    deviceData: Omit<Device, "id" | "createdAt" | "updatedAt">
  ) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.post("/objects", deviceData);

      if (response.data.status === "success") {
        devices.value.push(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.error || "Ошибка создания устройства");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка создания устройства";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateDevice = async (
    deviceId: string,
    deviceData: Partial<Device>
  ) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.put(`/objects/${deviceId}`, deviceData);

      if (response.data.status === "success") {
        // Обновляем устройство в списке
        const index = devices.value.findIndex(
          (device) => device.id === deviceId
        );
        if (index !== -1) {
          devices.value[index] = {
            ...devices.value[index],
            ...response.data.data,
          };
        }

        // Обновляем текущее устройство если это оно
        if (currentDevice.value?.id === deviceId) {
          currentDevice.value = {
            ...currentDevice.value,
            ...response.data.data,
          };
        }

        return response.data.data;
      } else {
        throw new Error(response.data.error || "Ошибка обновления устройства");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка обновления устройства";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteDevice = async (deviceId: string) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.delete(`/objects/${deviceId}`);

      if (response.data.status === "success") {
        // Удаляем устройство из списка
        devices.value = devices.value.filter(
          (device) => device.id !== deviceId
        );

        // Очищаем текущее устройство если это оно
        if (currentDevice.value?.id === deviceId) {
          currentDevice.value = null;
        }

        return true;
      } else {
        throw new Error(response.data.error || "Ошибка удаления устройства");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка удаления устройства";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const reserveDevice = async (
    deviceId: string,
    orderId: string,
    techId?: string
  ) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.post(`/objects/${deviceId}/reserve`, {
        order_id: orderId,
        assigned_tech_id: techId,
      });

      if (response.data.status === "success") {
        // Обновляем статус устройства
        const device = devices.value.find((d) => d.id === deviceId);
        if (device) {
          device.status = "reserved";
          device.orderId = orderId;
          device.assignedTechId = techId;
        }

        return response.data.data;
      } else {
        throw new Error(
          response.data.error || "Ошибка резервирования устройства"
        );
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка резервирования устройства";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const installDevice = async (
    deviceId: string,
    locationId: string,
    installDate?: string
  ) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.post(`/objects/${deviceId}/install`, {
        location_id: locationId,
        install_date: installDate || new Date().toISOString(),
      });

      if (response.data.status === "success") {
        // Обновляем статус устройства
        const device = devices.value.find((d) => d.id === deviceId);
        if (device) {
          device.status = "installed";
          device.locationId = locationId;
          device.installDate = installDate || new Date().toISOString();
        }

        return response.data.data;
      } else {
        throw new Error(response.data.error || "Ошибка установки устройства");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка установки устройства";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const uninstallDevice = async (deviceId: string, reason?: string) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.post(`/objects/${deviceId}/uninstall`, {
        reason: reason,
      });

      if (response.data.status === "success") {
        // Обновляем статус устройства
        const device = devices.value.find((d) => d.id === deviceId);
        if (device) {
          device.status = "available";
          device.locationId = undefined;
          device.orderId = undefined;
          device.assignedTechId = undefined;
          device.installDate = undefined;
        }

        return response.data.data;
      } else {
        throw new Error(response.data.error || "Ошибка удаления устройства");
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка удаления устройства";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const setFilters = (newFilters: DeviceFilter) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const clearFilters = () => {
    filters.value = {};
  };

  const clearError = () => {
    error.value = "";
  };

  const clearCurrentDevice = () => {
    currentDevice.value = null;
  };

  return {
    // State
    devices,
    currentDevice,
    deviceStats,
    isLoading,
    error,
    filters,

    // Getters
    availableDevices,
    reservedDevices,
    installedDevices,
    filteredDevices,

    // Actions
    fetchDevices,
    fetchDevice,
    fetchDeviceStats,
    createDevice,
    updateDevice,
    deleteDevice,
    reserveDevice,
    installDevice,
    uninstallDevice,
    setFilters,
    clearFilters,
    clearError,
    clearCurrentDevice,
  };
});
