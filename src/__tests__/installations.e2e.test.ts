// E2E тесты для системы планирования монтажей

import { installationsService } from "@/services/installationsService";
import type {
  EquipmentBase,
  InstallationStats,
  InstallationWithRelations,
  InstallerWithRelations,
  LocationBase,
} from "@/types/installations";
import Installations from "@/views/Installations.vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createVuetify } from "vuetify";

// Мокаем сервис
vi.mock("@/services/installationsService");
vi.mock("@/context/auth");
vi.mock("@/utils/errorHandler");

// Создаем Vuetify экземпляр для тестов
const vuetify = createVuetify();

// Тестовые данные
const mockInstallation: InstallationWithRelations = {
  id: 1,
  type: "монтаж",
  status: "planned",
  priority: "normal",
  scheduled_at: "2024-01-15T10:00:00Z",
  estimated_duration: 120,
  object_id: 1,
  installer_id: 1,
  location_id: 1,
  client_contact: "+7900123456",
  address: "ул. Ленина, 10",
  description: "Установка GPS-трекера",
  notes: "",
  is_billable: true,
  cost: 5000,
  labor_cost: 3000,
  materials_cost: 2000,
  created_at: "2024-01-10T09:00:00Z",
  updated_at: "2024-01-10T09:00:00Z",
  created_by_user_id: 1,
  object: {
    id: 1,
    name: "Объект 1",
    type: "GPS-трекер",
    imei: "123456789012345",
    phone_number: "+7900123456",
  },
  installer: {
    id: 1,
    first_name: "Иван",
    last_name: "Петров",
    phone: "+7900123456",
    email: "ivan@example.com",
    type: "staff",
    specialization: ["GPS-трекеры", "Сигнализации"],
  },
  location: {
    id: 1,
    city: "Москва",
    region: "Московская область",
    country: "Россия",
  },
  equipment: [],
};

const mockInstaller: InstallerWithRelations = {
  id: 1,
  first_name: "Иван",
  last_name: "Петров",
  type: "staff",
  phone: "+7900123456",
  email: "ivan@example.com",
  specialization: ["GPS-трекеры", "Сигнализации"],
  max_daily_installations: 5,
  working_days: [1, 2, 3, 4, 5],
  working_hours_start: "09:00",
  working_hours_end: "18:00",
  location_ids: [1],
  is_active: true,
  status: "available",
  hire_date: "2023-01-01",
  notes: "",
  created_at: "2023-01-01T09:00:00Z",
  updated_at: "2023-01-01T09:00:00Z",
  locations: [
    {
      id: 1,
      city: "Москва",
      region: "Московская область",
      country: "Россия",
      timezone: "Europe/Moscow",
      is_active: true,
      created_at: "2023-01-01T09:00:00Z",
      updated_at: "2023-01-01T09:00:00Z",
    },
  ],
  current_installations_count: 2,
  total_installations_count: 50,
  rating: 4.8,
};

const mockEquipment: EquipmentBase = {
  id: 1,
  type: "GPS-трекер",
  model: "GT-100",
  brand: "GlobalSat",
  serial_number: "GS123456",
  imei: "123456789012345",
  phone_number: "+7900123456",
  status: "in_stock",
  condition: "new",
  qr_code: "QR123456",
  warranty_expires_at: "2025-01-01",
  purchase_date: "2024-01-01",
  purchase_price: 5000,
  notes: "Новый GPS-трекер",
  created_at: "2024-01-01T09:00:00Z",
  updated_at: "2024-01-01T09:00:00Z",
};

const mockLocation: LocationBase = {
  id: 1,
  city: "Москва",
  region: "Московская область",
  country: "Россия",
  latitude: 55.7558,
  longitude: 37.6173,
  timezone: "Europe/Moscow",
  is_active: true,
  created_at: "2023-01-01T09:00:00Z",
  updated_at: "2023-01-01T09:00:00Z",
};

const mockStats: InstallationStats = {
  total: 100,
  by_status: {
    planned: 30,
    in_progress: 10,
    completed: 55,
    cancelled: 5,
  },
  by_type: {
    монтаж: 70,
    диагностика: 15,
    демонтаж: 10,
    обслуживание: 5,
  },
  by_priority: {
    low: 20,
    normal: 60,
    high: 15,
    urgent: 5,
  },
  overdue: 3,
  today: 8,
  this_week: 25,
  this_month: 100,
  average_duration: 90,
  completion_rate: 85,
};

describe("Installations E2E Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Мокаем методы сервиса
    vi.mocked(installationsService.getInstallations).mockResolvedValue({
      items: [mockInstallation],
      pagination: { page: 1, limit: 25, total: 1 },
    });

    vi.mocked(installationsService.getInstallers).mockResolvedValue({
      items: [mockInstaller],
      pagination: { page: 1, limit: 25, total: 1 },
    });

    vi.mocked(installationsService.getEquipment).mockResolvedValue({
      items: [mockEquipment],
      pagination: { page: 1, limit: 25, total: 1 },
    });

    vi.mocked(installationsService.getLocations).mockResolvedValue({
      items: [mockLocation],
      pagination: { page: 1, limit: 25, total: 1 },
    });

    vi.mocked(installationsService.getInstallationStats).mockResolvedValue(
      mockStats
    );
  });

  describe("Основная страница монтажей", () => {
    it("должна загружать и отображать данные", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Проверяем, что компонент монтируется
      expect(wrapper.exists()).toBe(true);

      // Проверяем заголовок
      expect(wrapper.find(".page-title").text()).toBe("Планирование монтажей");

      // Проверяем наличие вкладок
      expect(wrapper.find('[value="calendar"]').exists()).toBe(true);
      expect(wrapper.find('[value="list"]').exists()).toBe(true);
      expect(wrapper.find('[value="installers"]').exists()).toBe(true);
      expect(wrapper.find('[value="equipment"]').exists()).toBe(true);
    });

    it("должна переключаться между вкладками", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Проверяем активную вкладку по умолчанию
      const tabs = wrapper.findComponent({ name: "VTabs" });
      expect(tabs.exists()).toBe(true);

      // Переключаемся на вкладку списка
      await wrapper.find('[value="list"]').trigger("click");

      // Проверяем, что контент изменился
      expect(wrapper.find(".installations-list").exists()).toBe(true);
    });

    it("должна отображать статистику", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Ждем загрузки данных
      await wrapper.vm.$nextTick();

      // Проверяем отображение статистики
      const statsCards = wrapper.findAll(".stat-card");
      expect(statsCards.length).toBeGreaterThan(0);
    });
  });

  describe("Календарь монтажей", () => {
    it("должен отображать календарь с событиями", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Проверяем наличие календаря
      expect(
        wrapper.findComponent({ name: "InstallationCalendar" }).exists()
      ).toBe(true);
    });

    it("должен поддерживать переключение режимов просмотра", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      const calendar = wrapper.findComponent({ name: "InstallationCalendar" });
      expect(calendar.exists()).toBe(true);

      // Проверяем наличие кнопок переключения режима
      expect(calendar.find('[value="day"]').exists()).toBe(true);
      expect(calendar.find('[value="week"]').exists()).toBe(true);
      expect(calendar.find('[value="month"]').exists()).toBe(true);
    });
  });

  describe("Управление монтажами", () => {
    it("должен открывать диалог создания монтажа", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Нажимаем кнопку создания
      await wrapper
        .find('[data-testid="create-installation"]')
        .trigger("click");

      // Проверяем, что диалог открылся
      expect(
        wrapper.findComponent({ name: "InstallationDialog" }).exists()
      ).toBe(true);
    });

    it("должен обрабатывать создание нового монтажа", async () => {
      vi.mocked(installationsService.createInstallation).mockResolvedValue(
        mockInstallation
      );

      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Эмулируем создание монтажа
      const installationDialog = wrapper.findComponent({
        name: "InstallationDialog",
      });
      await installationDialog.vm.$emit("save", {
        type: "монтаж",
        priority: "normal",
        scheduled_at: "2024-01-15T10:00:00",
        estimated_duration: 120,
        object_id: 1,
        installer_id: 1,
        client_contact: "+7900123456",
        address: "ул. Ленина, 10",
        is_billable: true,
      });

      // Проверяем, что сервис был вызван
      expect(installationsService.createInstallation).toHaveBeenCalled();
    });

    it("должен обрабатывать начало монтажа", async () => {
      vi.mocked(installationsService.startInstallation).mockResolvedValue({
        ...mockInstallation,
        status: "in_progress",
      });

      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Переключаемся на список
      await wrapper.find('[value="list"]').trigger("click");

      const installationsList = wrapper.findComponent({
        name: "InstallationsList",
      });

      // Эмулируем начало монтажа
      await installationsList.vm.$emit("installation-start", mockInstallation);

      // Проверяем, что сервис был вызван
      expect(installationsService.startInstallation).toHaveBeenCalledWith(1);
    });

    it("должен обрабатывать завершение монтажа", async () => {
      vi.mocked(installationsService.completeInstallation).mockResolvedValue({
        ...mockInstallation,
        status: "completed",
        result: "Монтаж выполнен успешно",
      });

      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Эмулируем завершение монтажа
      const completeDialog = wrapper.findComponent({
        name: "CompleteInstallationDialog",
      });
      await completeDialog.vm.$emit("complete", {
        result: "Монтаж выполнен успешно",
        actual_duration: 90,
        notes: "Все работы выполнены в срок",
        materials_cost: 2000,
        labor_cost: 3000,
        equipment_installed: [1],
        photos: [],
      });

      // Проверяем, что сервис был вызван
      expect(installationsService.completeInstallation).toHaveBeenCalled();
    });

    it("должен обрабатывать отмену монтажа", async () => {
      vi.mocked(installationsService.cancelInstallation).mockResolvedValue({
        ...mockInstallation,
        status: "cancelled",
      });

      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Эмулируем отмену монтажа
      const cancelDialog = wrapper.findComponent({
        name: "CancelInstallationDialog",
      });
      await cancelDialog.vm.$emit("cancel", {
        reason: "client_cancelled",
        notes: "Клиент отменил заказ",
      });

      // Проверяем, что сервис был вызван
      expect(installationsService.cancelInstallation).toHaveBeenCalled();
    });
  });

  describe("Календарь планирования", () => {
    it("должен поддерживать drag-and-drop монтажей", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      const calendar = wrapper.findComponent({ name: "InstallationCalendar" });

      // Эмулируем перетаскивание монтажа
      await calendar.vm.$emit(
        "installation-drop",
        1,
        "2024-01-16T10:00:00Z",
        2
      );

      // Проверяем, что монтаж был обновлен
      expect(installationsService.updateInstallation).toHaveBeenCalledWith(1, {
        scheduled_at: "2024-01-16T10:00:00Z",
        installer_id: 2,
      });
    });

    it("должен открывать диалог создания при клике на дату", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      const calendar = wrapper.findComponent({ name: "InstallationCalendar" });

      // Эмулируем клик на дату
      await calendar.vm.$emit("date-click", "2024-01-16T10:00:00Z");

      // Проверяем, что диалог создания открылся
      expect(wrapper.vm.showInstallationDialog).toBe(true);
    });

    it("должен переключаться между режимами просмотра", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      const calendar = wrapper.findComponent({ name: "InstallationCalendar" });

      // Проверяем переключение на дневной режим
      await calendar.find('[value="day"]').trigger("click");
      expect(calendar.vm.viewType).toBe("day");

      // Проверяем переключение на месячный режим
      await calendar.find('[value="month"]').trigger("click");
      expect(calendar.vm.viewType).toBe("month");
    });
  });

  describe("Управление монтажниками", () => {
    it("должен отображать список монтажников", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Переключаемся на вкладку монтажников
      await wrapper.find('[value="installers"]').trigger("click");

      const installersList = wrapper.findComponent({ name: "InstallersList" });
      expect(installersList.exists()).toBe(true);
    });

    it("должен фильтровать монтажников по статусу", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.find('[value="installers"]').trigger("click");

      const installersList = wrapper.findComponent({ name: "InstallersList" });

      // Эмулируем изменение фильтра
      await installersList.vm.$emit("filters-change", {
        status: "available",
      });

      // Проверяем, что фильтр применился
      expect(installersList.vm.filters.status).toBe("available");
    });

    it("должен активировать/деактивировать монтажников", async () => {
      vi.mocked(installationsService.deactivateInstaller).mockResolvedValue({
        ...mockInstaller,
        is_active: false,
      });

      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.find('[value="installers"]').trigger("click");

      const installersList = wrapper.findComponent({ name: "InstallersList" });

      // Эмулируем деактивацию монтажника
      await installersList.vm.$emit("installer-toggle", mockInstaller);

      // Проверяем, что сервис был вызван
      expect(installationsService.deactivateInstaller).toHaveBeenCalledWith(1);
    });
  });

  describe("Управление оборудованием", () => {
    it("должен отображать список оборудования", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Переключаемся на вкладку оборудования
      await wrapper.find('[value="equipment"]').trigger("click");

      const equipmentList = wrapper.findComponent({ name: "EquipmentList" });
      expect(equipmentList.exists()).toBe(true);
    });

    it("должен фильтровать оборудование по статусу", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.find('[value="equipment"]').trigger("click");

      const equipmentList = wrapper.findComponent({ name: "EquipmentList" });

      // Эмулируем изменение фильтра
      await equipmentList.vm.$emit("filters-change", {
        status: "in_stock",
      });

      // Проверяем, что фильтр применился
      expect(equipmentList.vm.filters.status).toBe("in_stock");
    });

    it("должен обрабатывать установку оборудования", async () => {
      vi.mocked(installationsService.installEquipment).mockResolvedValue({
        ...mockEquipment,
        status: "installed",
        object_id: 1,
      });

      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.find('[value="equipment"]').trigger("click");

      const equipmentList = wrapper.findComponent({ name: "EquipmentList" });

      // Эмулируем установку оборудования
      await equipmentList.vm.$emit("equipment-install", mockEquipment, 1);

      // Проверяем, что сервис был вызван
      expect(installationsService.installEquipment).toHaveBeenCalledWith(1, 1);
    });
  });

  describe("Обработка ошибок", () => {
    it("должен обрабатывать ошибки загрузки данных", async () => {
      vi.mocked(installationsService.getInstallations).mockRejectedValue(
        new Error("Ошибка сети")
      );

      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Ждем обработки ошибки
      await wrapper.vm.$nextTick();

      // Проверяем, что компонент не сломался
      expect(wrapper.exists()).toBe(true);
    });

    it("должен обрабатывать ошибки создания монтажа", async () => {
      vi.mocked(installationsService.createInstallation).mockRejectedValue(
        new Error("Ошибка валидации")
      );

      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      const installationDialog = wrapper.findComponent({
        name: "InstallationDialog",
      });

      // Эмулируем ошибку создания
      await installationDialog.vm.$emit("save", {
        type: "монтаж",
        priority: "normal",
        scheduled_at: "2024-01-15T10:00:00",
        estimated_duration: 120,
        object_id: 1,
        installer_id: 1,
        client_contact: "+7900123456",
        address: "ул. Ленина, 10",
        is_billable: true,
      });

      // Проверяем, что ошибка была обработана
      expect(installationsService.createInstallation).toHaveBeenCalled();
    });
  });

  describe("Интеграция с API", () => {
    it("должен корректно вызывать API методы", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Проверяем, что все необходимые API методы были вызваны
      expect(installationsService.getInstallations).toHaveBeenCalled();
      expect(installationsService.getInstallers).toHaveBeenCalled();
      expect(installationsService.getEquipment).toHaveBeenCalled();
      expect(installationsService.getLocations).toHaveBeenCalled();
      expect(installationsService.getInstallationStats).toHaveBeenCalled();
    });

    it("должен передавать правильные параметры фильтрации", async () => {
      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Проверяем параметры вызова
      expect(installationsService.getInstallations).toHaveBeenCalledWith(
        1,
        1000
      );
      expect(installationsService.getInstallers).toHaveBeenCalledWith(1, 1000);
      expect(installationsService.getEquipment).toHaveBeenCalledWith(1, 1000);
      expect(installationsService.getLocations).toHaveBeenCalledWith(1, 1000);
    });
  });

  describe("Responsive дизайн", () => {
    it("должен адаптироваться к мобильным устройствам", async () => {
      // Эмулируем мобильное устройство
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      const wrapper = mount(Installations, {
        global: {
          plugins: [vuetify],
        },
      });

      // Проверяем, что компонент адаптировался
      expect(wrapper.find(".installations-page").exists()).toBe(true);
    });
  });
});
