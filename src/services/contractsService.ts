/**
 * Сервис для работы с API договоров
 */

import { config } from "@/config/env";
import type {
  ContractAppendicesResponse,
  ContractAppendix,
  ContractAppendixForm,
  ContractAppendixResponse,
  ContractBase,
  ContractCostCalculation,
  ContractCostResponse,
  ContractFilters,
  ContractForm,
  ContractObjectsForm,
  ContractResponse,
  ContractStats,
  ContractWithRelations,
  ContractsResponse,
  ExpiringContractsResponse,
  ContractNumerator,
  ContractNumeratorForm,
  ContractNumeratorsResponse,
} from "@/types/contracts";
import axios, { type AxiosResponse } from "axios";

class ContractsService {
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 120000, // Увеличено до 2 минут для медленных запросов
  });

  constructor() {
    // Добавляем interceptor для автоматического добавления токена авторизации
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("axenta_token");
      const company = localStorage.getItem("axenta_company");

      // Логирование только в режиме разработки
      if (import.meta.env.DEV) {
        console.debug("ContractsService API request:", {
          url: config.url,
          method: config.method,
          token: token ? "EXISTS" : "MISSING",
        });
      }

      if (token) {
        config.headers["authorization"] = `Bearer ${token}`;
      }

      if (company) {
        try {
          const companyData = JSON.parse(company);
          const companyId = companyData.id;
          // Логирование только в режиме разработки
          if (import.meta.env.DEV) {
            console.debug("Setting X-Tenant-ID header:", companyId);
          }
          // Убеждаемся, что это число или строка с числом
          if (companyId !== undefined && companyId !== null) {
            config.headers["X-Tenant-ID"] = String(companyId);
          } else {
            console.warn("Company ID is undefined or null:", companyData);
          }
        } catch (e) {
          console.warn("Invalid company data in localStorage:", e);
        }
      } else {
        console.warn("No company data in localStorage");
      }

      return config;
    });

    // Добавляем interceptor для обработки ошибок
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.log("ContractsService API error:", {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });

        // Логируем детальную ошибку от сервера
        if (error.response?.data) {
          console.error("Server error details:", {
            error: error.response.data.error,
            status: error.response.data.status,
            fullResponse: error.response.data,
          });
          // Выводим полный ответ для отладки
          console.error("Full error response:", JSON.stringify(error.response.data, null, 2));
        }
        // Также логируем сам объект ошибки
        if (error.response) {
          console.error("Error response object:", error.response);
        }

        // Ф1: 401 от Axenta-прокси ≠ смерть локальной сессии.
        if (error.response?.status === 401) {
          console.debug("contractsService 401 (downstream, session kept)");
        }
        return Promise.reject(error);
      }
    );
  }

  // ========== ОСНОВНЫЕ ОПЕРАЦИИ С ДОГОВОРАМИ ==========

  /**
   * Получить список договоров с фильтрацией
   */
  async getContracts(filters?: ContractFilters): Promise<{
    contracts: ContractWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response: AxiosResponse<ContractsResponse> = await this.apiClient.get(
      "/auth/contracts",
      { params: filters }
    );

    return {
      contracts: response.data.data || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      limit: response.data.limit || 20,
    };
  }

  /**
   * Получить договор по ID
   */
  async getContract(id: number): Promise<ContractWithRelations> {
    const response: AxiosResponse<ContractResponse> = await this.apiClient.get(
      `/auth/contracts/${id}`
    );
    if (!response.data.data) {
      throw new Error("Договор не найден");
    }
    return response.data.data;
  }

  /**
   * 🚀 Получить статистику договора (Progressive Loading)
   * Быстрая загрузка количества объектов для ленивой загрузки
   */
  async getContractStats(id: number): Promise<{ contract_id: number; objects_count: number }> {
    const response = await this.apiClient.get(`/auth/contracts/${id}/stats`);
    // Обрабатываем оба формата ответа: { data: { contract_id, objects_count } } и { contract_id, objects_count }
    const data = response.data.data || response.data;
    return {
      contract_id: data.contract_id || id,
      objects_count: data.objects_count ?? 0,
    };
  }

  /**
   * Создать новый договор
   */
  async createContract(data: ContractForm): Promise<ContractWithRelations> {
    const response: AxiosResponse<ContractResponse> = await this.apiClient.post(
      "/auth/contracts",
      data
    );
    if (!response.data.data) {
      throw new Error("Ошибка создания договора");
    }
    return response.data.data;
  }

  /**
   * Обновить договор
   */
  async updateContract(
    id: number,
    data: Partial<ContractForm>
  ): Promise<ContractWithRelations> {
    const response: AxiosResponse<ContractResponse> = await this.apiClient.put(
      `/auth/contracts/${id}`,
      data
    );
    if (!response.data.data) {
      throw new Error("Ошибка обновления договора");
    }
    return response.data.data;
  }

  /**
   * Удалить договор
   */
  async deleteContract(id: number): Promise<void> {
    await this.apiClient.delete(`/auth/contracts/${id}`);
  }

  // ========== ПРИЛОЖЕНИЯ К ДОГОВОРАМ ==========

  /**
   * Получить приложения к договору
   */
  async getContractAppendices(contractId: number): Promise<ContractAppendix[]> {
    const response: AxiosResponse<ContractAppendicesResponse> =
      await this.apiClient.get(`/auth/contracts/${contractId}/appendices`);
    return response.data.data || [];
  }

  /**
   * Создать приложение к договору
   */
  async createContractAppendix(
    contractId: number,
    data: ContractAppendixForm
  ): Promise<ContractAppendix> {
    const response: AxiosResponse<ContractAppendixResponse> =
      await this.apiClient.post(
        `/auth/contracts/${contractId}/appendices`,
        data
      );
    if (!response.data.data) {
      throw new Error("Ошибка создания приложения");
    }
    return response.data.data;
  }

  /**
   * Обновить приложение к договору
   */
  async updateContractAppendix(
    id: number,
    data: Partial<ContractAppendixForm>
  ): Promise<ContractAppendix> {
    const response: AxiosResponse<ContractAppendixResponse> =
      await this.apiClient.put(`/auth/contract-appendices/${id}`, data);
    if (!response.data.data) {
      throw new Error("Ошибка обновления приложения");
    }
    return response.data.data;
  }

  /**
   * Удалить приложение к договору
   */
  async deleteContractAppendix(id: number): Promise<void> {
    await this.apiClient.delete(`/auth/contract-appendices/${id}`);
  }

  // ========== РАСЧЕТЫ И АНАЛИТИКА ==========

  /**
   * Рассчитать стоимость договора
   */
  async calculateContractCost(
    contractId: number
  ): Promise<ContractCostCalculation> {
    const response: AxiosResponse<ContractCostResponse> =
      await this.apiClient.get(`/auth/contracts/${contractId}/calculate`);
    if (!response.data.data) {
      throw new Error("Ошибка расчета стоимости");
    }
    return response.data.data;
  }

  /**
   * Получить истекающие договоры
   */
  async getExpiringContracts(days = 30): Promise<ContractWithRelations[]> {
    const response: AxiosResponse<ExpiringContractsResponse> =
      await this.apiClient.get("/auth/contracts/expiring", {
        params: { days },
      });
    return response.data.data || [];
  }

  /**
   * Получить общую статистику всех договоров (сводка)
   */
  async getContractsStatsSummary(): Promise<ContractStats> {
    // Временно создаем статистику на основе полученных данных
    try {
      const { contracts } = await this.getContracts();

      const stats: ContractStats = {
        total: contracts.length,
        active: contracts.filter((c) => c.status === "active").length,
        expired: contracts.filter((c) => c.status === "expired").length,
        expiring_soon: 0, // Будет рассчитано отдельно
        draft: contracts.filter((c) => c.status === "draft").length,
        cancelled: contracts.filter((c) => c.status === "cancelled").length,
        total_amount: contracts
          .reduce((sum, c) => sum + parseFloat(c.total_amount || "0"), 0)
          .toString(),
        active_amount: contracts
          .filter((c) => c.status === "active")
          .reduce((sum, c) => sum + parseFloat(c.total_amount || "0"), 0)
          .toString(),
      };

      // Получаем истекающие договоры для подсчета
      const expiringContracts = await this.getExpiringContracts(30);
      stats.expiring_soon = expiringContracts.length;

      return stats;
    } catch (error) {
      console.warn("Failed to calculate contract stats:", error);
      return {
        total: 0,
        active: 0,
        expired: 0,
        expiring_soon: 0,
        draft: 0,
        cancelled: 0,
        total_amount: "0",
        active_amount: "0",
      };
    }
  }

  // ========== ПРИВЯЗКА ОБЪЕКТОВ ==========

  /**
   * Привязать объекты к договору
   */
  async attachObjectsToContract(
    contractId: number,
    data: ContractObjectsForm
  ): Promise<void> {
    await this.apiClient.post(`/auth/contracts/${contractId}/objects`, data);
  }

  /**
   * Отвязать объект от договора
   */
  async detachObjectFromContract(
    contractId: number,
    objectId: number
  ): Promise<void> {
    await this.apiClient.delete(
      `/auth/contracts/${contractId}/objects/${objectId}`
    );
  }

  /**
   * Синхронизировать договор с подпиской
   * Обновляет период договора из подписки и привязывает объекты, если они указаны
   */
  async syncContractFromSubscription(
    contractId: number,
    data?: { object_ids?: number[]; account_id?: number }
  ): Promise<ContractWithRelations> {
    const response: AxiosResponse<ContractResponse> =
      await this.apiClient.post(
        `/auth/contracts/${contractId}/sync-from-subscription`,
        data || {}
      );
    return response.data.data;
  }

  // ========== ДЕМО ДАННЫЕ ==========

  /**
   * Получить демо данные для тестирования интерфейса
   */
  async getMockContracts(): Promise<ContractWithRelations[]> {
    console.log("🔄 Loading mock contracts data...");

    const contracts = [
      {
        id: 1,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        number: "DOG-2024-001",
        title: "Договор на мониторинг транспорта ООО Логистика",
        description: "Договор на предоставление услуг мониторинга транспорта",
        company_id: 1,
        client_name: "ООО Логистика Плюс",
        client_inn: "7743013901",
        client_kpp: "774301001",
        client_email: "info@logistics-plus.ru",
        client_phone: "+7 (495) 123-45-67",
        client_address: "г. Москва, ул. Транспортная, д. 15",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-12-31T23:59:59Z",
        signed_at: "2024-01-15T12:00:00Z",
        tariff_plan_id: 1,
        total_amount: "120000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 30,
        notes: "Основной договор на год",
        tariff_plan: {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Стандартный",
          description: "Стандартный тарифный план",
          price: 1000,
          currency: "RUB",
          billing_period: "monthly",
          max_devices: 50,
          max_users: 10,
          max_storage: 1000,
          has_analytics: true,
          has_api: false,
          has_support: true,
          has_custom_domain: false,
          is_active: true,
          is_popular: false,
        },
        appendices: [
          {
            id: 1,
            created_at: "2024-03-01T10:00:00Z",
            updated_at: "2024-03-01T10:00:00Z",
            contract_id: 1,
            number: "DOG-2024-001-APP-01",
            title: "Приложение на дополнительные устройства",
            description: "Увеличение лимита устройств до 100",
            start_date: "2024-03-01T00:00:00Z",
            end_date: "2024-12-31T23:59:59Z",
            signed_at: "2024-03-01T14:00:00Z",
            amount: "25000.00",
            currency: "RUB",
            status: "active",
            is_active: true,
            notes: "Расширение по заявке клиента",
          },
        ],
        objects: [
          {
            id: 1,
            created_at: "2024-01-20T10:00:00Z",
            updated_at: "2024-01-20T10:00:00Z",
            name: "Грузовик МАЗ-001",
            description: "Основной грузовой автомобиль",
            type: "vehicle",
            status: "active",
            is_active: true,
            company_id: 1,
            contract_id: 1,
            imei: "123456789012345",
            phone_number: "+79161234567",
            location: "Москва",
            last_seen: "2024-01-20T15:30:00Z",
            battery_level: 85,
            template_id: 1,
          },
          {
            id: 2,
            created_at: "2024-01-21T10:00:00Z",
            updated_at: "2024-01-21T10:00:00Z",
            name: "Фургон ГАЗ-002",
            description: "Развозной автомобиль",
            type: "vehicle",
            status: "active",
            is_active: true,
            company_id: 1,
            contract_id: 1,
            imei: "123456789012346",
            phone_number: "+79161234568",
            location: "Москва",
            last_seen: "2024-01-21T16:45:00Z",
            battery_level: 92,
            template_id: 1,
          },
        ],
      },
      {
        id: 2,
        created_at: "2024-02-01T10:00:00Z",
        updated_at: "2024-02-01T10:00:00Z",
        number: "DOG-2024-002",
        title: "Договор мониторинга строительной техники",
        description: "Мониторинг экскаваторов и бульдозеров",
        company_id: 1,
        client_name: "ООО СтройТех",
        client_inn: "7743013902",
        client_kpp: "774301002",
        client_email: "contracts@stroytech.ru",
        client_phone: "+7 (495) 987-65-43",
        client_address: "г. Москва, ул. Строительная, д. 28",
        start_date: "2024-02-01T00:00:00Z",
        end_date: "2025-01-31T23:59:59Z",
        signed_at: "2024-02-01T15:30:00Z",
        tariff_plan_id: 2,
        total_amount: "180000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 60,
        notes: "Договор на спецтехнику",
        tariff_plan: {
          id: 2,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Премиум",
          description: "Премиум тарифный план для крупных клиентов",
          price: 1500,
          currency: "RUB",
          billing_period: "monthly",
          max_devices: 100,
          max_users: 25,
          max_storage: 5000,
          has_analytics: true,
          has_api: true,
          has_support: true,
          has_custom_domain: true,
          is_active: true,
          is_popular: true,
        },
        appendices: [],
        objects: [
          {
            id: 3,
            created_at: "2024-02-05T10:00:00Z",
            updated_at: "2024-02-05T10:00:00Z",
            name: "Экскаватор CAT-320",
            description: "Гусеничный экскаватор",
            type: "equipment",
            status: "active",
            is_active: true,
            company_id: 1,
            contract_id: 2,
            imei: "123456789012347",
            phone_number: "+79161234569",
            location: "Стройплощадка №1",
            last_seen: "2024-02-05T14:20:00Z",
            battery_level: 78,
            template_id: 2,
          },
        ],
      },
      {
        id: 3,
        created_at: "2024-01-10T10:00:00Z",
        updated_at: "2024-01-10T10:00:00Z",
        number: "DOG-2024-003",
        title: "Договор на мониторинг автопарка такси",
        description: "Мониторинг легковых автомобилей такси",
        company_id: 1,
        client_name: "ИП Таксистов А.В.",
        client_inn: "123456789012",
        client_email: "taxi@example.ru",
        client_phone: "+7 (495) 555-12-34",
        client_address: "г. Москва, ул. Таксистов, д. 5",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-03-31T23:59:59Z",
        signed_at: "2024-01-10T11:00:00Z",
        tariff_plan_id: 1,
        total_amount: "30000.00",
        currency: "RUB",
        status: "expired",
        is_active: false,
        notify_before: 14,
        notes: "Истекший договор, требует продления",
        tariff_plan: {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Стандартный",
          description: "Стандартный тарифный план",
          price: 1000,
          currency: "RUB",
          billing_period: "monthly",
          max_devices: 50,
          max_users: 10,
          max_storage: 1000,
          has_analytics: true,
          has_api: false,
          has_support: true,
          has_custom_domain: false,
          is_active: true,
          is_popular: false,
        },
        appendices: [],
        objects: [],
      },
      {
        id: 4,
        created_at: "2024-03-01T10:00:00Z",
        updated_at: "2024-03-01T10:00:00Z",
        number: "DOG-2024-004",
        title: "Договор мониторинга сельхозтехники",
        description: "Мониторинг тракторов и комбайнов",
        company_id: 1,
        client_name: "СПК Колос",
        client_inn: "1234567890",
        client_email: "info@kolos-farm.ru",
        client_phone: "+7 (495) 333-22-11",
        client_address: "Московская область, д. Колосово",
        start_date: "2024-03-01T00:00:00Z",
        end_date: "2024-12-31T23:59:59Z",
        tariff_plan_id: 1,
        total_amount: "90000.00",
        currency: "RUB",
        status: "draft",
        is_active: false,
        notify_before: 30,
        notes: "Договор в процессе согласования",
        tariff_plan: {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Стандартный",
          description: "Стандартный тарифный план",
          price: 1000,
          currency: "RUB",
          billing_period: "monthly",
          max_devices: 50,
          max_users: 10,
          max_storage: 1000,
          has_analytics: true,
          has_api: false,
          has_support: true,
          has_custom_domain: false,
          is_active: true,
          is_popular: false,
        },
        appendices: [],
        objects: [],
      },
      {
        id: 5,
        created_at: "2023-12-01T10:00:00Z",
        updated_at: "2023-12-01T10:00:00Z",
        number: "DOG-2023-015",
        title: "Договор на мониторинг курьерской службы",
        description: "Мониторинг курьерских автомобилей и мотоциклов",
        company_id: 1,
        client_name: "ООО Быстрая Доставка",
        client_inn: "7743013903",
        client_email: "office@fast-delivery.ru",
        client_phone: "+7 (495) 777-88-99",
        client_address: "г. Москва, ул. Курьерская, д. 42",
        start_date: "2023-12-01T00:00:00Z",
        end_date: "2024-02-29T23:59:59Z",
        signed_at: "2023-12-01T16:00:00Z",
        tariff_plan_id: 2,
        total_amount: "45000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 14,
        notes: "Договор истекает скоро, нужно продлить",
        tariff_plan: {
          id: 2,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Премиум",
          description: "Премиум тарифный план для крупных клиентов",
          price: 1500,
          currency: "RUB",
          billing_period: "monthly",
          max_devices: 100,
          max_users: 25,
          max_storage: 5000,
          has_analytics: true,
          has_api: true,
          has_support: true,
          has_custom_domain: true,
          is_active: true,
          is_popular: true,
        },
        appendices: [
          {
            id: 2,
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
            contract_id: 5,
            number: "DOG-2023-015-APP-01",
            title: "Приложение на дополнительные мотоциклы",
            description: "Добавление 10 курьерских мотоциклов",
            start_date: "2024-01-15T00:00:00Z",
            end_date: "2024-02-29T23:59:59Z",
            amount: "15000.00",
            currency: "RUB",
            status: "active",
            is_active: true,
            notes: "Сезонное расширение автопарка",
          },
        ],
        objects: [
          {
            id: 4,
            created_at: "2023-12-05T10:00:00Z",
            updated_at: "2023-12-05T10:00:00Z",
            name: "Курьерский авто К-001",
            description: "Легковой автомобиль для доставки",
            type: "vehicle",
            status: "active",
            is_active: true,
            company_id: 1,
            contract_id: 5,
            imei: "123456789012348",
            phone_number: "+79161234570",
            location: "Центр Москвы",
            last_seen: "2024-01-20T18:30:00Z",
            battery_level: 95,
            template_id: 1,
          },
          {
            id: 5,
            created_at: "2024-01-16T10:00:00Z",
            updated_at: "2024-01-16T10:00:00Z",
            name: "Мотоцикл М-001",
            description: "Курьерский мотоцикл",
            type: "vehicle",
            status: "inactive",
            is_active: false,
            company_id: 1,
            contract_id: 5,
            imei: "123456789012349",
            phone_number: "+79161234571",
            location: "Склад",
            last_seen: "2024-01-18T12:00:00Z",
            battery_level: 45,
            template_id: 1,
          },
        ],
      },
      {
        id: 6,
        created_at: "2024-02-15T10:00:00Z",
        updated_at: "2024-02-15T10:00:00Z",
        number: "DOG-2024-005",
        title: "Договор мониторинга медицинской техники",
        description: "Мониторинг машин скорой помощи и медицинского транспорта",
        company_id: 1,
        client_name: "ГБУ Городская больница №7",
        client_inn: "7743013904",
        client_kpp: "774301003",
        client_email: "it@gb7.moscow.ru",
        client_phone: "+7 (495) 444-55-66",
        client_address: "г. Москва, ул. Медицинская, д. 15",
        start_date: "2024-02-15T00:00:00Z",
        end_date: "2025-02-14T23:59:59Z",
        signed_at: "2024-02-15T10:30:00Z",
        tariff_plan_id: 2,
        total_amount: "240000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 45,
        notes: "Государственный контракт на медицинский транспорт",
        tariff_plan: {
          id: 2,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Премиум",
          description: "Премиум тарифный план для крупных клиентов",
          price: 1500,
          currency: "RUB",
          billing_period: "monthly",
          max_devices: 100,
          max_users: 25,
          max_storage: 5000,
          has_analytics: true,
          has_api: true,
          has_support: true,
          has_custom_domain: true,
          is_active: true,
          is_popular: true,
        },
        appendices: [],
        objects: [
          {
            id: 6,
            created_at: "2024-02-16T10:00:00Z",
            updated_at: "2024-02-16T10:00:00Z",
            name: "Скорая помощь С-01",
            description: "Реанимобиль",
            type: "vehicle",
            status: "active",
            is_active: true,
            company_id: 1,
            contract_id: 6,
            imei: "123456789012354",
            phone_number: "+79161234572",
            location: "Больница №7",
            last_seen: "2024-02-16T19:30:00Z",
            battery_level: 98,
            template_id: 1,
          },
          {
            id: 7,
            created_at: "2024-02-17T10:00:00Z",
            updated_at: "2024-02-17T10:00:00Z",
            name: "Скорая помощь С-02",
            description: "Линейная бригада",
            type: "vehicle",
            status: "active",
            is_active: true,
            company_id: 1,
            contract_id: 6,
            imei: "123456789012355",
            phone_number: "+79161234573",
            location: "На вызове",
            last_seen: "2024-02-17T20:15:00Z",
            battery_level: 87,
            template_id: 1,
          },
        ],
      },
      {
        id: 7,
        created_at: "2024-01-05T10:00:00Z",
        updated_at: "2024-01-05T10:00:00Z",
        number: "DOG-2024-006",
        title: "Договор мониторинга коммунальной техники",
        description: "Мониторинг снегоуборочной и дорожной техники",
        company_id: 1,
        client_name: "ГБУ Автомобильные дороги",
        client_inn: "7743013905",
        client_kpp: "774301004",
        client_email: "monitoring@avtodor.moscow.ru",
        client_phone: "+7 (495) 777-88-99",
        client_address: "г. Москва, Садовническая наб., д. 69",
        start_date: "2024-01-05T00:00:00Z",
        end_date: "2024-04-30T23:59:59Z",
        signed_at: "2024-01-05T14:00:00Z",
        tariff_plan_id: 1,
        total_amount: "60000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 15,
        notes: "Сезонный договор на зимний период",
        tariff_plan: {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Стандартный",
          description: "Стандартный тарифный план",
          price: 1000,
          currency: "RUB",
          billing_period: "monthly",
          max_devices: 50,
          max_users: 10,
          max_storage: 1000,
          has_analytics: true,
          has_api: false,
          has_support: true,
          has_custom_domain: false,
          is_active: true,
          is_popular: false,
        },
        appendices: [
          {
            id: 3,
            created_at: "2024-03-01T10:00:00Z",
            updated_at: "2024-03-01T10:00:00Z",
            contract_id: 7,
            number: "DOG-2024-006-APP-01",
            title: "Приложение на дополнительную технику",
            description: "Добавление поливочных машин на весенний период",
            start_date: "2024-03-01T00:00:00Z",
            end_date: "2024-04-30T23:59:59Z",
            amount: "20000.00",
            currency: "RUB",
            status: "active",
            is_active: true,
            notes: "Сезонное расширение парка техники",
          },
        ],
        objects: [
          {
            id: 8,
            created_at: "2024-01-06T10:00:00Z",
            updated_at: "2024-01-06T10:00:00Z",
            name: "Снегоуборщик СУ-01",
            description: "Роторный снегоуборщик",
            type: "equipment",
            status: "active",
            is_active: true,
            company_id: 1,
            contract_id: 7,
            imei: "123456789012356",
            phone_number: "+79161234574",
            location: "База ГБУ",
            last_seen: "2024-01-06T08:30:00Z",
            battery_level: 72,
            template_id: 2,
          },
          {
            id: 9,
            created_at: "2024-01-07T10:00:00Z",
            updated_at: "2024-01-07T10:00:00Z",
            name: "Посыпочная машина ПМ-01",
            description: "Машина для посыпки дорог",
            type: "equipment",
            status: "active",
            is_active: true,
            company_id: 1,
            contract_id: 7,
            imei: "123456789012357",
            phone_number: "+79161234575",
            location: "На маршруте",
            last_seen: "2024-01-07T22:45:00Z",
            battery_level: 89,
            template_id: 2,
          },
          {
            id: 10,
            created_at: "2024-03-02T10:00:00Z",
            updated_at: "2024-03-02T10:00:00Z",
            name: "Поливочная машина ПМ-02",
            description: "Поливочная машина для уборки",
            type: "equipment",
            status: "inactive",
            is_active: false,
            company_id: 1,
            contract_id: 7,
            imei: "123456789012358",
            phone_number: "+79161234576",
            location: "Ремонт",
            last_seen: "2024-03-01T10:00:00Z",
            battery_level: 0,
            template_id: 2,
          },
        ],
      },
      {
        id: 8,
        created_at: "2023-11-01T10:00:00Z",
        updated_at: "2023-11-01T10:00:00Z",
        number: "DOG-2023-020",
        title: "Договор мониторинга банковской инкассации",
        description: "Мониторинг инкассаторских автомобилей",
        company_id: 1,
        client_name: "ООО СБ Инкассация",
        client_inn: "7743013906",
        client_kpp: "774301005",
        client_email: "security@sb-incass.ru",
        client_phone: "+7 (495) 123-99-88",
        client_address: "г. Москва, ул. Банковская, д. 3, стр. 1",
        start_date: "2023-11-01T00:00:00Z",
        end_date: "2024-02-29T23:59:59Z",
        signed_at: "2023-11-01T09:00:00Z",
        tariff_plan_id: 2,
        total_amount: "180000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 7,
        notes: "Высокий приоритет безопасности, истекает скоро!",
        tariff_plan: {
          id: 2,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Премиум",
          description: "Премиум тарифный план для крупных клиентов",
          price: 1500,
          currency: "RUB",
          billing_period: "monthly",
          max_devices: 100,
          max_users: 25,
          max_storage: 5000,
          has_analytics: true,
          has_api: true,
          has_support: true,
          has_custom_domain: true,
          is_active: true,
          is_popular: true,
        },
        appendices: [],
        objects: [
          {
            id: 11,
            created_at: "2023-11-02T10:00:00Z",
            updated_at: "2023-11-02T10:00:00Z",
            name: "Инкассаторский автомобиль И-01",
            description: "Бронированный автомобиль",
            type: "vehicle",
            status: "active",
            is_active: true,
            company_id: 1,
            contract_id: 8,
            imei: "123456789012359",
            phone_number: "+79161234577",
            location: "Банк ВТБ",
            last_seen: "2024-01-28T17:30:00Z",
            battery_level: 94,
            template_id: 1,
          },
          {
            id: 12,
            created_at: "2023-11-03T10:00:00Z",
            updated_at: "2023-11-03T10:00:00Z",
            name: "Инкассаторский автомобиль И-02",
            description: "Бронированный автомобиль",
            type: "vehicle",
            status: "active",
            is_active: true,
            company_id: 1,
            contract_id: 8,
            imei: "123456789012360",
            phone_number: "+79161234578",
            location: "Маршрут №3",
            last_seen: "2024-01-28T18:15:00Z",
            battery_level: 86,
            template_id: 1,
          },
        ],
      },
      {
        id: 9,
        created_at: "2024-01-20T10:00:00Z",
        updated_at: "2024-01-20T10:00:00Z",
        number: "DOG-2024-007",
        title: "Договор мониторинга школьных автобусов",
        description:
          "Мониторинг школьного транспорта и обеспечение безопасности детей",
        company_id: 1,
        client_name: "ГБОУ Школа №1234",
        client_inn: "7743013907",
        client_email: "transport@school1234.ru",
        client_phone: "+7 (495) 555-12-34",
        client_address: "г. Москва, ул. Школьная, д. 25",
        start_date: "2024-01-20T00:00:00Z",
        end_date: "2024-06-30T23:59:59Z",
        signed_at: "2024-01-20T13:00:00Z",
        tariff_plan_id: 1,
        total_amount: "75000.00",
        currency: "RUB",
        status: "suspended",
        is_active: false,
        notify_before: 30,
        notes: "Договор приостановлен на период каникул",
        tariff_plan: {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Стандартный",
          description: "Стандартный тарифный план",
          price: 1000,
          currency: "RUB",
          billing_period: "monthly",
          max_devices: 50,
          max_users: 10,
          max_storage: 1000,
          has_analytics: true,
          has_api: false,
          has_support: true,
          has_custom_domain: false,
          is_active: true,
          is_popular: false,
        },
        appendices: [],
        objects: [
          {
            id: 13,
            created_at: "2024-01-21T10:00:00Z",
            updated_at: "2024-01-21T10:00:00Z",
            name: "Школьный автобус ША-01",
            description: "Автобус для перевозки детей",
            type: "vehicle",
            status: "inactive",
            is_active: false,
            company_id: 1,
            contract_id: 9,
            imei: "123456789012361",
            phone_number: "+79161234579",
            location: "Школьная парковка",
            last_seen: "2024-01-25T16:00:00Z",
            battery_level: 55,
            template_id: 1,
          },
        ],
      },
      {
        id: 10,
        created_at: "2024-03-10T10:00:00Z",
        updated_at: "2024-03-10T10:00:00Z",
        number: "DOG-2024-008",
        title: "Договор мониторинга службы доставки еды",
        description: "Мониторинг курьеров службы доставки готовых блюд",
        company_id: 1,
        client_name: "ООО ЕдаВремя",
        client_inn: "7743013908",
        client_email: "logistics@edavremia.ru",
        client_phone: "+7 (495) 888-77-66",
        client_address: "г. Москва, ул. Кулинарная, д. 12",
        start_date: "2024-03-10T00:00:00Z",
        end_date: "2024-09-09T23:59:59Z",
        tariff_plan_id: 1,
        total_amount: "84000.00",
        currency: "RUB",
        status: "draft",
        is_active: false,
        notify_before: 14,
        notes: "Договор на согласовании у юристов",
        tariff_plan: {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Стандартный",
          description: "Стандартный тарифный план",
          price: 1000,
          currency: "RUB",
          billing_period: "monthly",
          max_devices: 50,
          max_users: 10,
          max_storage: 1000,
          has_analytics: true,
          has_api: false,
          has_support: true,
          has_custom_domain: false,
          is_active: true,
          is_popular: false,
        },
        appendices: [],
        objects: [],
      },
    ];

    console.log(
      `✅ Loaded ${contracts.length} mock contracts:`,
      contracts.map((c) => c.number).join(", ")
    );
    return contracts;
  }

  // ========== УТИЛИТЫ ==========

  /**
   * Форматировать денежную сумму
   */
  formatCurrency(amount: string | number, currency = "RUB"): string {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency,
    }).format(value || 0);
  }

  /**
   * Форматировать дату
   */
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString("ru-RU");
  }

  /**
   * Получить цвет статуса договора
   */
  getContractStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: "grey",
      active: "green",
      expired: "red",
      cancelled: "grey",
      suspended: "orange",
    };
    return colors[status] || "grey";
  }

  /**
   * Получить локализованное название статуса договора
   */
  getContractStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: "Черновик",
      active: "Активный",
      expired: "Истекший",
      cancelled: "Отмененный",
      suspended: "Приостановленный",
    };
    return labels[status] || status;
  }

  /**
   * Проверить, истекает ли договор скоро
   */
  isContractExpiringSoon(contract: ContractBase): boolean {
    const endDate = new Date(contract.end_date);
    const notifyDate = new Date(endDate);
    notifyDate.setDate(notifyDate.getDate() - contract.notify_before);
    const now = new Date();

    return now >= notifyDate && now <= endDate;
  }

  /**
   * Получить количество дней до истечения договора
   */
  getDaysUntilExpiry(contract: ContractBase): number {
    const endDate = new Date(contract.end_date);
    const now = new Date();

    if (now > endDate) {
      return 0;
    }

    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ========== ОПЕРАЦИИ С НУМЕРАТОРАМИ ДОГОВОРОВ ==========

  /**
   * Получить список нумераторов договоров
   */
  async getContractNumerators(companyId: number): Promise<ContractNumerator[]> {
    const response: AxiosResponse<ContractNumeratorsResponse> =
      await this.apiClient.get("/auth/contract-numerators", {
        params: { company_id: companyId },
      });

    return response.data.data || [];
  }

  /**
   * Получить конкретный нумератор по ID
   */
  async getContractNumerator(id: number): Promise<ContractNumerator> {
    const response = await this.apiClient.get(`/auth/contract-numerators/${id}`);
    return response.data.data;
  }

  /**
   * Создать новый нумератор
   */
  async createContractNumerator(
    data: ContractNumeratorForm
  ): Promise<ContractNumerator> {
    const response = await this.apiClient.post(
      "/auth/contract-numerators",
      data
    );
    // Проверяем только если есть проблема
    if (response.data.data?.company_id === 0) {
      console.warn('⚠️ createContractNumerator: company_id=0 в ответе, ожидалось:', data.company_id);
    }
    return response.data.data;
  }

  /**
   * Обновить нумератор
   */
  async updateContractNumerator(
    id: number,
    data: Partial<ContractNumeratorForm>
  ): Promise<ContractNumerator> {
    const response = await this.apiClient.put(
      `/auth/contract-numerators/${id}`,
      data
    );
    return response.data.data;
  }

  /**
   * Удалить нумератор
   */
  async deleteContractNumerator(id: number): Promise<void> {
    await this.apiClient.delete(`/auth/contract-numerators/${id}`);
  }

  /**
   * Сгенерировать номер договора по ID нумератора
   */
  async generateContractNumber(
    numeratorId: number,
    params?: {
      client_id?: number;
      company_id?: number;
      contract_id?: number;
    }
  ): Promise<{ number: string; counter: number }> {
    const response = await this.apiClient.post(
      `/auth/contract-numerators/${numeratorId}/generate`,
      params || {}
    );
    return response.data.data;
  }
}

// Создаем единственный экземпляр сервиса
export const contractsService = new ContractsService();
export default contractsService;
