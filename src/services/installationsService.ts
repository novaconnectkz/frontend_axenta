// Сервис для работы с системой планирования монтажей

import { config } from "@/config/env";
import type {
  AvailableInstaller,
  AvailableInstallerQuery,
  CalendarView,
  CancelInstallationForm,
  CompleteInstallationForm,
  EquipmentBase,
  EquipmentFilters,
  EquipmentForm,
  EquipmentResponse,
  EquipmentStats,
  InstallationFilters,
  InstallationForm,
  InstallationStats,
  InstallationWithRelations,
  InstallationsResponse,
  InstallerFilters,
  InstallerForm,
  InstallerSchedule,
  InstallerStats,
  InstallerWithRelations,
  InstallersResponse,
  LocationBase,
  LocationFilters,
  LocationForm,
  LocationStats,
  LocationsResponse,
} from "@/types/installations";
import axios from "axios";

export class InstallationsService {
  private static instance: InstallationsService;
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
  });

  constructor() {
    // Настраиваем interceptors для токена
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("axenta_token");
      const company = localStorage.getItem("axenta_company");

      if (token) {
        config.headers["authorization"] = `Token ${token}`;
      }

      if (company) {
        try {
          const companyData = JSON.parse(company);
          config.headers["X-Tenant-ID"] = companyData.id;
        } catch (e) {
          console.warn("Invalid company data in localStorage");
        }
      }

      return config;
    });
  }

  static getInstance(): InstallationsService {
    if (!InstallationsService.instance) {
      InstallationsService.instance = new InstallationsService();
    }
    return InstallationsService.instance;
  }

  // === МОНТАЖИ ===

  async getInstallations(
    page = 1,
    per_page = 50,
    filters: InstallationFilters = {}
  ): Promise<InstallationsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ordering: filters.ordering || "-scheduled_at",
    });

    if (filters.status) params.append("status", filters.status);
    if (filters.type) params.append("type", filters.type);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.installer_id)
      params.append("installer_id", filters.installer_id.toString());
    if (filters.object_id)
      params.append("object_id", filters.object_id.toString());
    if (filters.location_id)
      params.append("location_id", filters.location_id.toString());
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);
    if (filters.search) params.append("search", filters.search);
    if (filters.is_billable !== undefined)
      params.append("is_billable", filters.is_billable.toString());

    const response = await this.apiClient.get(
      `/test/installations?${params.toString()}`
    );
    return response.data;
  }

  async getInstallation(id: number): Promise<InstallationWithRelations> {
    const response = await this.apiClient.get(`/installations/${id}`);
    return response.data;
  }

  async createInstallation(
    data: InstallationForm
  ): Promise<InstallationWithRelations> {
    const response = await this.apiClient.post("/installations", data);
    return response.data;
  }

  async updateInstallation(
    id: number,
    data: Partial<InstallationForm>
  ): Promise<InstallationWithRelations> {
    const response = await this.apiClient.put(`/installations/${id}`, data);
    return response.data;
  }

  async deleteInstallation(id: number): Promise<void> {
    await this.apiClient.delete(`/installations/${id}`);
  }

  async startInstallation(id: number): Promise<InstallationWithRelations> {
    const response = await this.apiClient.put(`/installations/${id}/start`);
    return response.data;
  }

  async completeInstallation(
    id: number,
    data: CompleteInstallationForm
  ): Promise<InstallationWithRelations> {
    const formData = new FormData();
    formData.append("result", data.result);
    formData.append("actual_duration", data.actual_duration.toString());

    if (data.notes) formData.append("notes", data.notes);
    if (data.materials_cost)
      formData.append("materials_cost", data.materials_cost.toString());
    if (data.labor_cost)
      formData.append("labor_cost", data.labor_cost.toString());
    if (data.equipment_installed) {
      formData.append(
        "equipment_installed",
        JSON.stringify(data.equipment_installed)
      );
    }
    if (data.photos) {
      data.photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo);
      });
    }

    const response = await this.apiClient.put(
      `/installations/${id}/complete`,
      formData
    );
    return response.data;
  }

  async cancelInstallation(
    id: number,
    data: CancelInstallationForm
  ): Promise<InstallationWithRelations> {
    const response = await this.apiClient.put(
      `/installations/${id}/cancel`,
      data
    );
    return response.data;
  }

  async getInstallationStats(): Promise<InstallationStats> {
    const response = await this.apiClient.get("/test/installations/statistics");
    return response.data;
  }

  // === МОНТАЖНИКИ ===

  async getInstallers(
    page = 1,
    per_page = 50,
    filters: InstallerFilters = {}
  ): Promise<InstallersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ordering: filters.ordering || "first_name",
    });

    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);
    if (filters.specialization)
      params.append("specialization", filters.specialization);
    if (filters.location_id)
      params.append("location_id", filters.location_id.toString());
    if (filters.is_active !== undefined)
      params.append("is_active", filters.is_active.toString());
    if (filters.search) params.append("search", filters.search);

    const response = await this.apiClient.get(
      `/test/installers?${params.toString()}`
    );
    return response.data;
  }

  async getInstaller(id: number): Promise<InstallerWithRelations> {
    const response = await this.apiClient.get(`/installers/${id}`);
    return response.data;
  }

  async createInstaller(data: InstallerForm): Promise<InstallerWithRelations> {
    const response = await this.apiClient.post("/installers", data);
    return response.data;
  }

  async updateInstaller(
    id: number,
    data: Partial<InstallerForm>
  ): Promise<InstallerWithRelations> {
    const response = await this.apiClient.put(`/installers/${id}`, data);
    return response.data;
  }

  async deleteInstaller(id: number): Promise<void> {
    await this.apiClient.delete(`/installers/${id}`);
  }

  async activateInstaller(id: number): Promise<InstallerWithRelations> {
    const response = await this.apiClient.put(`/installers/${id}/activate`);
    return response.data;
  }

  async deactivateInstaller(id: number): Promise<InstallerWithRelations> {
    const response = await this.apiClient.put(`/installers/${id}/deactivate`);
    return response.data;
  }

  async getInstallerSchedule(
    installerId: number,
    dateFrom: string,
    dateTo: string
  ): Promise<InstallerSchedule> {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
    });

    const response = await this.apiClient.get(
      `/installers/${installerId}/schedule?${params.toString()}`
    );
    return response.data;
  }

  async getInstallerWorkload(
    id: number,
    date?: string
  ): Promise<{
    current_installations: number;
    max_installations: number;
    workload_percentage: number;
    available_slots: { start: string; end: string }[];
  }> {
    const params = new URLSearchParams();
    if (date) params.append("date", date);

    const response = await this.apiClient.get(
      `/installers/${id}/workload?${params.toString()}`
    );
    return response.data;
  }

  async getAvailableInstallers(
    query: AvailableInstallerQuery
  ): Promise<AvailableInstaller[]> {
    const params = new URLSearchParams({
      date: query.date,
      duration: query.duration.toString(),
    });

    if (query.location_id)
      params.append("location_id", query.location_id.toString());
    if (query.specialization)
      params.append("specialization", query.specialization);

    const response = await this.apiClient.get(
      `/installers/available?${params.toString()}`
    );
    return response.data;
  }

  async getInstallerStats(): Promise<InstallerStats> {
    const response = await this.apiClient.get("/installers/statistics");
    return response.data;
  }

  // === ЛОКАЦИИ ===

  async getLocations(
    page = 1,
    per_page = 50,
    filters: LocationFilters = {}
  ): Promise<LocationsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ordering: filters.ordering || "city",
    });

    if (filters.region) params.append("region", filters.region);
    if (filters.country) params.append("country", filters.country);
    if (filters.is_active !== undefined)
      params.append("is_active", filters.is_active.toString());
    if (filters.search) params.append("search", filters.search);

    const response = await this.apiClient.get(
      `/test/locations?${params.toString()}`
    );
    return response.data;
  }

  async getLocation(id: number): Promise<LocationBase> {
    const response = await this.apiClient.get(`/locations/${id}`);
    return response.data;
  }

  async createLocation(data: LocationForm): Promise<LocationBase> {
    const response = await this.apiClient.post("/locations", data);
    return response.data;
  }

  async updateLocation(
    id: number,
    data: Partial<LocationForm>
  ): Promise<LocationBase> {
    const response = await this.apiClient.put(`/locations/${id}`, data);
    return response.data;
  }

  async deleteLocation(id: number): Promise<void> {
    await this.apiClient.delete(`/locations/${id}`);
  }

  async getLocationStats(): Promise<LocationStats> {
    const response = await this.apiClient.get("/locations/statistics");
    return response.data;
  }

  async getLocationsByRegion(): Promise<Record<string, LocationBase[]>> {
    const response = await this.apiClient.get("/locations/by-region");
    return response.data;
  }

  async searchLocations(query: string): Promise<LocationBase[]> {
    const params = new URLSearchParams({ search: query });
    const response = await this.apiClient.get(
      `/locations/search?${params.toString()}`
    );
    return response.data;
  }

  // === ОБОРУДОВАНИЕ ===

  async getEquipment(
    page = 1,
    per_page = 50,
    filters: EquipmentFilters = {}
  ): Promise<EquipmentResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ordering: filters.ordering || "type",
    });

    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);
    if (filters.condition) params.append("condition", filters.condition);
    if (filters.object_id)
      params.append("object_id", filters.object_id.toString());
    if (filters.search) params.append("search", filters.search);

    const response = await this.apiClient.get(
      `/test/equipment?${params.toString()}`
    );
    return response.data;
  }

  async getEquipmentItem(id: number): Promise<EquipmentBase> {
    const response = await this.apiClient.get(`/equipment/${id}`);
    return response.data;
  }

  async createEquipment(data: EquipmentForm): Promise<EquipmentBase> {
    const response = await this.apiClient.post("/equipment", data);
    return response.data;
  }

  async updateEquipment(
    id: number,
    data: Partial<EquipmentForm>
  ): Promise<EquipmentBase> {
    const response = await this.apiClient.put(`/equipment/${id}`, data);
    return response.data;
  }

  async deleteEquipment(id: number): Promise<void> {
    await this.apiClient.delete(`/equipment/${id}`);
  }

  async installEquipment(id: number, objectId: number): Promise<EquipmentBase> {
    const response = await this.apiClient.put(`/equipment/${id}/install`, {
      object_id: objectId,
    });
    return response.data;
  }

  async uninstallEquipment(id: number): Promise<EquipmentBase> {
    const response = await this.apiClient.put(`/equipment/${id}/uninstall`);
    return response.data;
  }

  async getEquipmentStats(): Promise<EquipmentStats> {
    const response = await this.apiClient.get("/equipment/statistics");
    return response.data;
  }

  async getLowStockEquipment(): Promise<EquipmentBase[]> {
    const response = await this.apiClient.get("/equipment/low-stock");
    return response.data;
  }

  async findByQRCode(qrCode: string): Promise<EquipmentBase> {
    const response = await this.apiClient.get(
      `/equipment/qr/${encodeURIComponent(qrCode)}`
    );
    return response.data;
  }

  // === КАЛЕНДАРЬ ===

  async getCalendarView(
    dateFrom: string,
    dateTo: string
  ): Promise<CalendarView> {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
    });

    const response = await this.apiClient.get(
      `/installations/calendar?${params.toString()}`
    );
    return response.data;
  }

  // === УТИЛИТЫ ===

  async getSpecializations(): Promise<string[]> {
    const response = await this.apiClient.get("/installers/specializations");
    return response.data;
  }

  async getEquipmentTypes(): Promise<string[]> {
    const response = await this.apiClient.get("/equipment/types");
    return response.data;
  }
}

// Экспорт синглтона
export const installationsService = InstallationsService.getInstance();
