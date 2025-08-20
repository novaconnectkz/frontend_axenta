// Mock данные для демонстрации раздела "Пользователи"

import type { UserWithRelations, Role, UserTemplate, UserStats } from '@/types/users';

// Демо роли
export const mockRoles: Role[] = [
  {
    id: 1,
    name: 'admin',
    display_name: 'Администратор',
    description: 'Полный доступ к системе',
    color: '#FF3B30',
    priority: 1,
    is_active: true,
    is_system: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 2,
    name: 'manager',
    display_name: 'Менеджер',
    description: 'Управление проектами и клиентами',
    color: '#007AFF',
    priority: 2,
    is_active: true,
    is_system: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 3,
    name: 'tech',
    display_name: 'Технический специалист',
    description: 'Техническая поддержка и монтажи',
    color: '#34C759',
    priority: 3,
    is_active: true,
    is_system: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 4,
    name: 'installer',
    display_name: 'Монтажник',
    description: 'Выполнение монтажных работ',
    color: '#FF9500',
    priority: 4,
    is_active: true,
    is_system: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 5,
    name: 'client',
    display_name: 'Клиент',
    description: 'Клиент компании',
    color: '#5856D6',
    priority: 5,
    is_active: true,
    is_system: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
];

// Демо шаблоны пользователей
export const mockTemplates: UserTemplate[] = [
  {
    id: 1,
    name: 'Стандартный администратор',
    description: 'Базовые настройки для администратора',
    role_id: 1,
    role: mockRoles[0],
    settings: JSON.stringify({
      theme: 'auto',
      language: 'ru',
      notifications: true,
      dashboard_widgets: ['users', 'objects', 'billing', 'installations']
    }),
    is_active: true,
    usage_count: 5,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 2,
    name: 'Менеджер проектов',
    description: 'Настройки для менеджера проектов',
    role_id: 2,
    role: mockRoles[1],
    settings: JSON.stringify({
      theme: 'light',
      language: 'ru',
      notifications: true,
      dashboard_widgets: ['objects', 'installations', 'billing']
    }),
    is_active: true,
    usage_count: 12,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 3,
    name: 'Технический специалист',
    description: 'Настройки для технических специалистов',
    role_id: 3,
    role: mockRoles[2],
    settings: JSON.stringify({
      theme: 'dark',
      language: 'ru',
      notifications: true,
      dashboard_widgets: ['installations', 'warehouse', 'objects']
    }),
    is_active: true,
    usage_count: 8,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
];

// Демо пользователи
export const mockUsers: UserWithRelations[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@axenta.ru',
    first_name: 'Алексей',
    last_name: 'Администратов',
    phone: '+7 (999) 123-45-67',
    telegram_id: '@admin_axenta',
    is_active: true,
    user_type: 'admin',
    external_id: null,
    external_source: null,
    company_id: 1,
    role_id: 1,
    role: mockRoles[0],
    template_id: 1,
    template: mockTemplates[0],
    last_login: '2024-01-15T14:30:00Z',
    login_count: 156,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: 2,
    username: 'manager1',
    email: 'ivanov@axenta.ru',
    first_name: 'Иван',
    last_name: 'Иванов',
    phone: '+7 (999) 234-56-78',
    telegram_id: '@ivanov_manager',
    is_active: true,
    user_type: 'manager',
    external_id: 'BX_001',
    external_source: 'bitrix24',
    company_id: 1,
    role_id: 2,
    role: mockRoles[1],
    template_id: 2,
    template: mockTemplates[1],
    last_login: '2024-01-15T12:15:00Z',
    login_count: 89,
    created_at: '2024-01-02T09:00:00Z',
    updated_at: '2024-01-15T12:15:00Z'
  },
  {
    id: 3,
    username: 'petrov_tech',
    email: 'petrov@axenta.ru',
    first_name: 'Петр',
    last_name: 'Петров',
    phone: '+7 (999) 345-67-89',
    telegram_id: '@petrov_tech',
    is_active: true,
    user_type: 'user',
    external_id: null,
    external_source: null,
    company_id: 1,
    role_id: 3,
    role: mockRoles[2],
    template_id: 3,
    template: mockTemplates[2],
    last_login: '2024-01-15T16:45:00Z',
    login_count: 234,
    created_at: '2024-01-03T11:30:00Z',
    updated_at: '2024-01-15T16:45:00Z'
  },
  {
    id: 4,
    username: 'sidorov_install',
    email: 'sidorov@axenta.ru',
    first_name: 'Сидор',
    last_name: 'Сидоров',
    phone: '+7 (999) 456-78-90',
    telegram_id: '@sidorov_installer',
    is_active: true,
    user_type: 'installer',
    external_id: null,
    external_source: null,
    company_id: 1,
    role_id: 4,
    role: mockRoles[3],
    template_id: null,
    last_login: '2024-01-15T08:20:00Z',
    login_count: 67,
    created_at: '2024-01-05T14:00:00Z',
    updated_at: '2024-01-15T08:20:00Z'
  },
  {
    id: 5,
    username: 'kozlov_install',
    email: 'kozlov@axenta.ru',
    first_name: 'Николай',
    last_name: 'Козлов',
    phone: '+7 (999) 567-89-01',
    telegram_id: '@kozlov_installer',
    is_active: true,
    user_type: 'installer',
    external_id: null,
    external_source: null,
    company_id: 1,
    role_id: 4,
    role: mockRoles[3],
    template_id: null,
    last_login: '2024-01-14T17:30:00Z',
    login_count: 45,
    created_at: '2024-01-08T10:15:00Z',
    updated_at: '2024-01-14T17:30:00Z'
  },
  {
    id: 6,
    username: 'client_roga_kopyta',
    email: 'info@roga-kopyta.ru',
    first_name: 'Владимир',
    last_name: 'Рогов',
    name: 'ООО "Рога и Копыта"',
    phone: '+7 (495) 123-45-67',
    is_active: true,
    user_type: 'client',
    external_id: '1C_CLIENT_001',
    external_source: '1c',
    company_id: 1,
    role_id: 5,
    role: mockRoles[4],
    template_id: null,
    last_login: '2024-01-12T15:45:00Z',
    login_count: 23,
    created_at: '2024-01-10T13:20:00Z',
    updated_at: '2024-01-12T15:45:00Z'
  },
  {
    id: 7,
    username: 'client_tech_solutions',
    email: 'contact@techsolutions.ru',
    first_name: 'Елена',
    last_name: 'Смирнова',
    name: 'ООО "ТехРешения"',
    phone: '+7 (495) 234-56-78',
    is_active: true,
    user_type: 'client',
    external_id: 'BX_CLIENT_002',
    external_source: 'bitrix24',
    company_id: 1,
    role_id: 5,
    role: mockRoles[4],
    template_id: null,
    last_login: '2024-01-13T11:30:00Z',
    login_count: 15,
    created_at: '2024-01-12T09:45:00Z',
    updated_at: '2024-01-13T11:30:00Z'
  },
  {
    id: 8,
    username: 'manager2',
    email: 'fedorova@axenta.ru',
    first_name: 'Анна',
    last_name: 'Федорова',
    phone: '+7 (999) 678-90-12',
    telegram_id: '@fedorova_manager',
    is_active: false,
    user_type: 'manager',
    external_id: null,
    external_source: null,
    company_id: 1,
    role_id: 2,
    role: mockRoles[1],
    template_id: 2,
    template: mockTemplates[1],
    last_login: '2024-01-05T18:20:00Z',
    login_count: 34,
    created_at: '2024-01-04T16:00:00Z',
    updated_at: '2024-01-05T18:20:00Z'
  },
  {
    id: 9,
    username: 'tech_support',
    email: 'support@axenta.ru',
    first_name: 'Максим',
    last_name: 'Максимов',
    phone: '+7 (999) 789-01-23',
    telegram_id: '@max_support',
    is_active: true,
    user_type: 'user',
    external_id: null,
    external_source: null,
    company_id: 1,
    role_id: 3,
    role: mockRoles[2],
    template_id: 3,
    template: mockTemplates[2],
    last_login: '2024-01-15T13:10:00Z',
    login_count: 178,
    created_at: '2024-01-06T12:30:00Z',
    updated_at: '2024-01-15T13:10:00Z'
  },
  {
    id: 10,
    username: 'inactive_user',
    email: 'inactive@axenta.ru',
    first_name: 'Неактивный',
    last_name: 'Пользователь',
    phone: '+7 (999) 890-12-34',
    is_active: false,
    user_type: 'user',
    external_id: null,
    external_source: null,
    company_id: 1,
    role_id: 3,
    role: mockRoles[2],
    template_id: null,
    last_login: '2024-01-01T10:00:00Z',
    login_count: 1,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
];

// Демо статистика
export const mockStats: UserStats = {
  total: 10,
  active: 8,
  inactive: 2,
  by_role: {
    'admin': 1,
    'manager': 2,
    'tech': 2,
    'installer': 2,
    'client': 2,
    'inactive': 1
  },
  by_type: {
    'admin': 1,
    'manager': 2,
    'user': 2,
    'installer': 2,
    'client': 2,
    'inactive': 1
  },
  recent_logins: 6
};

// Функция для получения демо данных с пагинацией и фильтрацией
export function getMockUsersData(
  page = 1,
  limit = 20,
  filters: any = {}
): {
  items: UserWithRelations[];
  total: number;
  page: number;
  limit: number;
  pages: number;
} {
  let filteredUsers = [...mockUsers];

  // Применяем фильтры
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.username.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.first_name.toLowerCase().includes(search) ||
      user.last_name.toLowerCase().includes(search) ||
      (user.name && user.name.toLowerCase().includes(search))
    );
  }

  if (filters.role) {
    filteredUsers = filteredUsers.filter(user => user.role?.name === filters.role);
  }

  if (filters.user_type) {
    filteredUsers = filteredUsers.filter(user => user.user_type === filters.user_type);
  }

  if (filters.active !== undefined) {
    filteredUsers = filteredUsers.filter(user => user.is_active === filters.active);
  }

  // Сортировка
  if (filters.ordering) {
    const orderField = filters.ordering.replace('-', '');
    const isDesc = filters.ordering.startsWith('-');
    
    filteredUsers.sort((a, b) => {
      let aVal = a[orderField as keyof UserWithRelations];
      let bVal = b[orderField as keyof UserWithRelations];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return isDesc ? 1 : -1;
      if (aVal > bVal) return isDesc ? -1 : 1;
      return 0;
    });
  }

  // Пагинация
  const total = filteredUsers.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = filteredUsers.slice(startIndex, endIndex);

  return {
    items,
    total,
    page,
    limit,
    pages
  };
}
