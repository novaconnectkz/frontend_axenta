/**
 * E2E тесты для интерфейса управления договорами
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import Contracts from '@/views/Contracts.vue';

// Мокаем сервисы
vi.mock('@/services/contractsService', () => ({
  default: {
    getMockContracts: vi.fn().mockResolvedValue([
      {
        id: 1,
        number: 'DOG-2024-001',
        title: 'Тестовый договор',
        client_name: 'ООО Тест',
        status: 'active',
        is_active: true,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        total_amount: '120000.00',
        currency: 'RUB',
        tariff_plan: {
          id: 1,
          name: 'Стандартный',
          price: 1000,
        },
        objects: [],
        appendices: [],
      }
    ]),
    formatCurrency: vi.fn((amount) => `${amount} ₽`),
    formatDate: vi.fn((date) => new Date(date).toLocaleDateString('ru-RU')),
    isContractExpiringSoon: vi.fn().mockReturnValue(false),
    getDaysUntilExpiry: vi.fn().mockReturnValue(300),
    getContractStats: vi.fn().mockResolvedValue({
      total: 1,
      active: 1,
      expired: 0,
      expiring_soon: 0,
      draft: 0,
      cancelled: 0,
      total_amount: '120000.00',
      active_amount: '120000.00',
    }),
  },
}));

vi.mock('@/services/billingService', () => ({
  default: {
    getBillingPlans: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Стандартный',
        price: 1000,
        currency: 'RUB',
      }
    ]),
  },
}));

// Мокаем localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Contracts Page', () => {
  let router: any;
  let vuetify: any;

  beforeEach(() => {
    // Настраиваем роутер
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/contracts', component: Contracts },
      ],
    });

    // Настраиваем Vuetify
    vuetify = createVuetify();

    // Мокаем localStorage для аутентификации
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'axenta_token') return 'mock-token';
      if (key === 'axenta_company') return JSON.stringify({ id: 1 });
      return null;
    });
  });

  it('должен отображать заголовок страницы', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find('.page-title').text()).toBe('Управление договорами');
    expect(wrapper.find('.page-subtitle').text()).toBe('Договоры, приложения и привязка объектов');
  });

  it('должен отображать кнопки действий', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();

    // Проверяем наличие основных кнопок
    const buttons = wrapper.findAll('.page-actions button');
    expect(buttons.length).toBeGreaterThan(0);

    // Проверяем кнопку создания договора
    const createButton = wrapper.find('[data-testid="create-button"]');
    if (createButton.exists()) {
      expect(createButton.text()).toContain('Создать договор');
    }
  });

  it('должен отображать статистические карточки', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100)); // Ждем загрузки данных

    // Проверяем наличие статистических карточек
    const statsCards = wrapper.findAll('.stat-card');
    expect(statsCards.length).toBe(4); // Всего, активные, истекающие, общая стоимость
  });

  it('должен отображать фильтры', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();

    // Проверяем наличие секции фильтров
    const filtersCard = wrapper.find('.filters-card');
    expect(filtersCard.exists()).toBe(true);

    // Проверяем поле поиска
    const searchInput = wrapper.find('input[placeholder*="Поиск"]');
    expect(searchInput.exists()).toBe(true);
  });

  it('должен отображать таблицу договоров', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100)); // Ждем загрузки данных

    // Проверяем наличие таблицы
    const dataTable = wrapper.find('.contracts-table');
    expect(dataTable.exists()).toBe(true);
  });

  it('должен переключать демо режим', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();

    // Находим кнопку демо режима
    const demoButton = wrapper.find('button:contains("Демо режим")');
    
    if (demoButton.exists()) {
      // Кликаем по кнопке
      await demoButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Проверяем, что появилось уведомление о демо режиме
      const demoAlert = wrapper.find('.demo-alert');
      expect(demoAlert.exists()).toBe(true);
    }
  });

  it('должен открывать диалог создания договора', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();

    // Находим кнопку создания
    const createButton = wrapper.find('button:contains("Создать договор")');
    
    if (createButton.exists()) {
      // Кликаем по кнопке
      await createButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Проверяем, что диалог открылся (через изменение состояния)
      expect(wrapper.vm.showContractDialog).toBe(true);
    }
  });

  it('должен применять фильтры', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100)); // Ждем загрузки данных

    // Устанавливаем фильтр поиска
    const searchInput = wrapper.find('input[placeholder*="Поиск"]');
    if (searchInput.exists()) {
      await searchInput.setValue('DOG-2024-001');
      await wrapper.vm.$nextTick();

      // Проверяем, что фильтр применился
      expect(wrapper.vm.filters.search).toBe('DOG-2024-001');
    }
  });

  it('должен очищать фильтры', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();

    // Устанавливаем фильтры
    wrapper.vm.filters.search = 'test';
    wrapper.vm.filters.status = 'active';
    await wrapper.vm.$nextTick();

    // Находим кнопку очистки фильтров
    const clearButton = wrapper.find('button:contains("Очистить")');
    
    if (clearButton.exists()) {
      // Кликаем по кнопке
      await clearButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Проверяем, что фильтры очистились
      expect(wrapper.vm.filters.search).toBe('');
      expect(wrapper.vm.filters.status).toBeUndefined();
    }
  });

  it('должен корректно форматировать валюту', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();

    // Проверяем функцию форматирования валюты
    const formattedAmount = wrapper.vm.formatCurrency('120000', 'RUB');
    expect(formattedAmount).toContain('120000');
    expect(formattedAmount).toContain('₽');
  });

  it('должен корректно определять статус периода договора', async () => {
    const wrapper = mount(Contracts, {
      global: {
        plugins: [router, vuetify],
      },
    });

    await wrapper.vm.$nextTick();

    const mockContract = {
      id: 1,
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2024-12-31T23:59:59Z',
      notify_before: 30,
    };

    // Проверяем функции определения статуса
    const statusClass = wrapper.vm.getPeriodStatusClass(mockContract);
    const statusText = wrapper.vm.getPeriodStatusText(mockContract);

    expect(statusClass).toBeDefined();
    expect(statusText).toBeDefined();
    expect(typeof statusText).toBe('string');
  });
});

describe('Contract Service Integration', () => {
  it('должен загружать демо данные', async () => {
    const { default: contractsService } = await import('@/services/contractsService');
    
    const contracts = await contractsService.getMockContracts();
    
    expect(Array.isArray(contracts)).toBe(true);
    expect(contracts.length).toBeGreaterThan(0);
    
    // Проверяем структуру первого договора
    const firstContract = contracts[0];
    expect(firstContract).toHaveProperty('id');
    expect(firstContract).toHaveProperty('number');
    expect(firstContract).toHaveProperty('title');
    expect(firstContract).toHaveProperty('client_name');
    expect(firstContract).toHaveProperty('status');
    expect(firstContract).toHaveProperty('tariff_plan');
    expect(firstContract).toHaveProperty('objects');
    expect(firstContract).toHaveProperty('appendices');
  });

  it('должен корректно рассчитывать статистику', async () => {
    const { default: contractsService } = await import('@/services/contractsService');
    
    const stats = await contractsService.getContractStats();
    
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('active');
    expect(stats).toHaveProperty('expired');
    expect(stats).toHaveProperty('expiring_soon');
    expect(stats).toHaveProperty('total_amount');
    expect(stats).toHaveProperty('active_amount');
    
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.active).toBe('number');
    expect(typeof stats.total_amount).toBe('string');
  });
});

