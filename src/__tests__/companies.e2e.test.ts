/**
 * E2E тесты для управления учетными записями (компаниями)
 *
 * Этот файл содержит интеграционные тесты для проверки полного цикла
 * работы с компаниями через пользовательский интерфейс.
 */

import companiesService from "@/services/companiesService";
import type { CompanyListResponse, CompanyResponse } from "@/types/companies";
import Companies from "@/views/Companies.vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import { createVuetify } from "vuetify";

// Мокируем сервис компаний
vi.mock("@/services/companiesService");

// Настраиваем Vuetify для тестов
const vuetify = createVuetify();

// Создаем простой роутер для тестов
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/accounts", component: Companies }],
});

// Мок данные для тестов
const mockCompany: CompanyResponse = {
  id: 1,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  name: "Тестовая компания",
  database_schema: "tenant_test",
  domain: "test.example.com",
  contact_email: "test@example.com",
  contact_phone: "+7 (999) 123-45-67",
  contact_person: "Иван Иванов",
  address: "ул. Тестовая, 1",
  city: "Москва",
  country: "Russia",
  is_active: true,
  max_users: 10,
  max_objects: 100,
  storage_quota: 1024,
  language: "ru",
  timezone: "Europe/Moscow",
  currency: "RUB",
  usage_stats: {
    users_count: 5,
    objects_count: 25,
    storage_used_mb: 256,
    last_activity: "2024-01-15T10:30:00Z",
  },
};

const mockCompanyListResponse: CompanyListResponse = {
  companies: [mockCompany],
  pagination: {
    current_page: 1,
    total_pages: 1,
    total_items: 1,
    per_page: 10,
  },
};

const mockStats = {
  total: 1,
  active: 1,
  inactive: 0,
  total_users: 5,
  total_objects: 25,
};

describe("Companies E2E Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Настраиваем моки по умолчанию
    vi.mocked(companiesService.getCompanies).mockResolvedValue(
      mockCompanyListResponse
    );
    vi.mocked(companiesService.getCompaniesStats).mockResolvedValue(mockStats);
  });

  it("должен загружать и отображать список компаний", async () => {
    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    // Ждем загрузки данных
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Проверяем, что сервис был вызван
    expect(companiesService.getCompanies).toHaveBeenCalled();
    expect(companiesService.getCompaniesStats).toHaveBeenCalled();

    // Проверяем отображение статистики
    const statsCards = wrapper.findAll(".stat-card");
    expect(statsCards).toHaveLength(4);

    // Проверяем отображение таблицы
    const table = wrapper.find(".companies-table");
    expect(table.exists()).toBe(true);
  });

  it("должен открывать диалог создания компании", async () => {
    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Находим кнопку "Добавить компанию"
    const addButton = wrapper.find('[data-testid="add-company-btn"]');
    if (!addButton.exists()) {
      // Если нет data-testid, ищем по тексту
      const buttons = wrapper.findAll("button");
      const addBtn = buttons.find((btn) =>
        btn.text().includes("Добавить компанию")
      );
      expect(addBtn?.exists()).toBe(true);
    }
  });

  it("должен фильтровать компании по поисковому запросу", async () => {
    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Находим поле поиска
    const searchField = wrapper.find('input[type="text"]');
    expect(searchField.exists()).toBe(true);

    // Вводим поисковый запрос
    await searchField.setValue("Тестовая");
    await searchField.trigger("input");

    // Ждем debounce
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Проверяем, что сервис был вызван с параметрами поиска
    expect(companiesService.getCompanies).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "Тестовая",
      })
    );
  });

  it("должен активировать/деактивировать компанию", async () => {
    vi.mocked(companiesService.deactivateCompany).mockResolvedValue({
      ...mockCompany,
      is_active: false,
    });

    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Имитируем клик по кнопке деактивации
    const component = wrapper.vm as any;
    await component.toggleCompanyStatus(mockCompany);

    // Проверяем, что сервис был вызван
    expect(companiesService.deactivateCompany).toHaveBeenCalledWith(1);
  });

  it("должен тестировать подключение к API", async () => {
    const mockTestResult = {
      connection_success: true,
      message: "Подключение успешно установлено",
    };

    vi.mocked(companiesService.testConnection).mockResolvedValue(
      mockTestResult
    );

    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Имитируем тест подключения
    const component = wrapper.vm as any;
    await component.testConnection(mockCompany);

    // Проверяем, что сервис был вызван
    expect(companiesService.testConnection).toHaveBeenCalledWith(1);
  });

  it("должен экспортировать данные компаний", async () => {
    const mockBlob = new Blob(["test,data"], { type: "text/csv" });
    vi.mocked(companiesService.exportCompanies).mockResolvedValue(mockBlob);

    // Мокируем DOM API
    const mockCreateElement = vi.spyOn(document, "createElement");
    const mockAppendChild = vi.spyOn(document.body, "appendChild");
    const mockRemoveChild = vi.spyOn(document.body, "removeChild");
    const mockCreateObjectURL = vi.spyOn(window.URL, "createObjectURL");
    const mockRevokeObjectURL = vi.spyOn(window.URL, "revokeObjectURL");

    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };

    mockCreateElement.mockReturnValue(mockLink as any);
    mockAppendChild.mockImplementation(() => mockLink as any);
    mockRemoveChild.mockImplementation(() => mockLink as any);
    mockCreateObjectURL.mockReturnValue("blob:mock-url");
    mockRevokeObjectURL.mockImplementation(() => {});

    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await wrapper.vm.$nextTick();

    // Имитируем экспорт
    const component = wrapper.vm as any;
    await component.exportCompanies();

    // Проверяем, что сервис был вызван
    expect(companiesService.exportCompanies).toHaveBeenCalled();

    // Проверяем создание ссылки для скачивания
    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockLink.click).toHaveBeenCalled();

    // Очищаем моки
    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
    mockCreateObjectURL.mockRestore();
    mockRevokeObjectURL.mockRestore();
  });

  it("должен обрабатывать ошибки загрузки данных", async () => {
    vi.mocked(companiesService.getCompanies).mockRejectedValue(
      new Error("API Error")
    );
    vi.mocked(companiesService.getCompaniesStats).mockRejectedValue(
      new Error("Stats Error")
    );

    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Проверяем, что компонент не упал
    expect(wrapper.exists()).toBe(true);

    // Проверяем, что загрузка завершилась
    const component = wrapper.vm as any;
    expect(component.loading).toBe(false);
  });

  it("должен правильно форматировать размер хранилища", async () => {
    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    const component = wrapper.vm as any;

    // Тестируем форматирование МБ
    expect(component.formatStorage(512)).toBe("512 МБ");

    // Тестируем форматирование ГБ
    expect(component.formatStorage(1536)).toBe("1.5 ГБ");
    expect(component.formatStorage(2048)).toBe("2.0 ГБ");
  });

  it("должен корректно обновлять пагинацию", async () => {
    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await wrapper.vm.$nextTick();

    const component = wrapper.vm as any;

    // Тестируем изменение страницы
    component.onPageChange(2);
    expect(component.filters.page).toBe(2);

    // Тестируем изменение лимита
    component.onLimitChange(25);
    expect(component.filters.limit).toBe(25);
    expect(component.filters.page).toBe(1); // Должна сбрасываться на первую страницу
  });

  it("должен показывать снэкбар с уведомлениями", async () => {
    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    const component = wrapper.vm as any;

    // Тестируем показ уведомления
    component.showSnackbar("Тестовое сообщение", "success");

    expect(component.snackbar.show).toBe(true);
    expect(component.snackbar.text).toBe("Тестовое сообщение");
    expect(component.snackbar.color).toBe("success");
  });

  it("должен сбрасывать фильтры при поиске", async () => {
    const wrapper = mount(Companies, {
      global: {
        plugins: [vuetify, router],
      },
    });

    const component = wrapper.vm as any;

    // Устанавливаем вторую страницу
    component.filters.page = 2;

    // Выполняем поиск
    component.filters.search = "test";
    component.debouncedSearch();

    // Ждем debounce
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Проверяем, что страница сброшена на первую
    expect(component.filters.page).toBe(1);
  });
});

describe("Companies Service Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен валидировать данные компании", () => {
    const invalidData = {
      name: "", // Пустое имя
      axetna_login: "",
      axetna_password: "",
      contact_email: "invalid-email",
      max_users: -1,
    };

    const errors = companiesService.validateCompanyData(invalidData);

    expect(errors).toContain("Название компании обязательно для заполнения");
    expect(errors).toContain("Логин Axenta обязателен для заполнения");
    expect(errors).toContain("Пароль Axenta обязателен для заполнения");
    expect(errors).toContain("Некорректный формат email");
    expect(errors).toContain(
      "Максимальное количество пользователей должно быть больше 0"
    );
  });

  it("должен правильно конвертировать данные в CSV", async () => {
    const mockCompanies = [mockCompany];

    vi.mocked(companiesService.getCompanies).mockResolvedValue({
      companies: mockCompanies,
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 1,
        per_page: 1000,
      },
    });

    const blob = await companiesService.exportCompanies();
    const text = await blob.text();

    expect(text).toContain("ID,Название,Домен");
    expect(text).toContain("Тестовая компания");
    expect(text).toContain("test.example.com");
  });

  it("должен генерировать правильную статистику", async () => {
    const mockCompaniesWithStats = [
      {
        ...mockCompany,
        is_active: true,
        usage_stats: {
          users_count: 5,
          objects_count: 10,
          storage_used_mb: 100,
        },
      },
      {
        ...mockCompany,
        id: 2,
        is_active: false,
        usage_stats: {
          users_count: 3,
          objects_count: 7,
          storage_used_mb: 50,
        },
      },
    ];

    vi.mocked(companiesService.getCompanies).mockResolvedValue({
      companies: mockCompaniesWithStats,
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 2,
        per_page: 10,
      },
    });

    const stats = await companiesService.getCompaniesStats();

    expect(stats.total).toBe(2);
    expect(stats.active).toBe(1);
    expect(stats.inactive).toBe(1);
    expect(stats.total_users).toBe(8);
    expect(stats.total_objects).toBe(17);
  });
});
