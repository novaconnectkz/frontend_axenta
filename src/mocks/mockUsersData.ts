// Mock данные для демонстрации раздела "Пользователи"

import type { UserWithRelations, Role, UserTemplate, UserStats } from '@/types/users';

// Базовые системные роли - для демонстрации интерфейса
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
    description: 'Управление проектами',
    color: '#007AFF',
    priority: 2,
    is_active: true,
    is_system: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 3,
    name: 'user',
    display_name: 'Пользователь',
    description: 'Базовые права доступа',
    color: '#34C759',
    priority: 3,
    is_active: true,
    is_system: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
];

// Демо шаблоны пользователей - очищено для продакшена
export const mockTemplates: UserTemplate[] = [];

// Демо пользователи - базовые данные для демонстрации интерфейса
export const mockUsers: UserWithRelations[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    first_name: 'Администратор',
    last_name: 'Системы',
    name: 'Администратор Системы',
    phone: '+7 (999) 123-45-67',
    telegram_id: '',
    is_active: true,
    user_type: 'admin',
    role_id: 1,
    role: {
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
    template_id: null,
    template: null,
    external_id: '',
    external_source: '',
    last_login: new Date().toISOString(),
    login_count: 25,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    username: 'manager',
    email: 'manager@example.com',
    first_name: 'Менеджер',
    last_name: 'Проектов',
    name: 'Менеджер Проектов',
    phone: '+7 (999) 234-56-78',
    telegram_id: '',
    is_active: true,
    user_type: 'manager',
    role_id: 2,
    role: {
      id: 2,
      name: 'manager',
      display_name: 'Менеджер',
      description: 'Управление проектами',
      color: '#007AFF',
      priority: 2,
      is_active: true,
      is_system: false,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    template_id: null,
    template: null,
    external_id: '',
    external_source: '',
    last_login: new Date(Date.now() - 86400000).toISOString(), // вчера
    login_count: 15,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    username: 'user',
    email: 'user@example.com',
    first_name: 'Обычный',
    last_name: 'Пользователь',
    name: 'Обычный Пользователь',
    phone: '+7 (999) 345-67-89',
    telegram_id: '',
    is_active: false,
    user_type: 'user',
    role_id: 3,
    role: {
      id: 3,
      name: 'user',
      display_name: 'Пользователь',
      description: 'Базовые права доступа',
      color: '#34C759',
      priority: 3,
      is_active: true,
      is_system: false,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    template_id: null,
    template: null,
    external_id: '',
    external_source: '',
    last_login: new Date(Date.now() - 7 * 86400000).toISOString(), // неделю назад
    login_count: 5,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: new Date().toISOString()
  }
];

// Демо статистика - соответствует демо пользователям
export const mockStats: UserStats = {
  total: 3,
  active: 2,
  inactive: 1,
  active_users: 2,
  inactive_users: 1,
  total_users: 3,
  recent_users: 1,
  recent_logins: 1,
  by_role: {
    'admin': 1,
    'manager': 1,
    'user': 1
  },
  by_type: {
    'admin': 1,
    'manager': 1,
    'user': 1
  },
  role_stats: [
    { role_name: 'admin', count: 1 },
    { role_name: 'manager', count: 1 },
    { role_name: 'user', count: 1 }
  ]
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

  if (filters.active !== undefined) {
    filteredUsers = filteredUsers.filter(user => user.is_active === filters.active);
  }

  if (filters.role) {
    filteredUsers = filteredUsers.filter(user => user.role?.name === filters.role);
  }

  if (filters.user_type) {
    filteredUsers = filteredUsers.filter(user => user.user_type === filters.user_type);
  }

  // Пагинация
  const total = filteredUsers.length;
  const pages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const items = filteredUsers.slice(offset, offset + limit);

  return {
    items,
    total,
    page,
    limit,
    pages
  };
}
