<template>
  <div class="security-settings">
    <!-- Заголовок -->
    <div class="mb-6">
      <h3 class="text-h6 font-weight-bold mb-1">Безопасность и доступ</h3>
      <p class="text-body-2 text-medium-emphasis">
        Управление правами доступа, аудитом и политиками безопасности
      </p>
    </div>

    <!-- Статистика безопасности -->
    <div class="mb-6">
      <h4 class="text-h6 font-weight-bold mb-4">Статистика безопасности</h4>
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card text-center pa-4" elevation="2">
            <v-icon size="32" color="success" class="mb-2">mdi-shield-check</v-icon>
            <div class="text-h6 font-weight-bold">{{ securityStats.activeUsers }}</div>
            <div class="text-caption text-medium-emphasis">Активных пользователей</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card text-center pa-4" elevation="2">
            <v-icon size="32" color="warning" class="mb-2">mdi-account-alert</v-icon>
            <div class="text-h6 font-weight-bold">{{ securityStats.blockedUsers }}</div>
            <div class="text-caption text-medium-emphasis">Заблокированных</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card text-center pa-4" elevation="2">
            <v-icon size="32" color="info" class="mb-2">mdi-login</v-icon>
            <div class="text-h6 font-weight-bold">{{ securityStats.todayLogins }}</div>
            <div class="text-caption text-medium-emphasis">Входов сегодня</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card text-center pa-4" elevation="2">
            <v-icon size="32" color="error" class="mb-2">mdi-shield-alert</v-icon>
            <div class="text-h6 font-weight-bold">{{ securityStats.failedAttempts }}</div>
            <div class="text-caption text-medium-emphasis">Неудачных попыток</div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Вкладки -->
    <v-tabs v-model="activeTab" class="mb-6">
      <v-tab value="policies">
        <v-icon start>mdi-shield-account</v-icon>
        Политики безопасности
      </v-tab>
      <v-tab value="permissions">
        <v-icon start>mdi-account-key</v-icon>
        Права доступа
      </v-tab>
      <v-tab value="audit">
        <v-icon start>mdi-history</v-icon>
        Аудит действий
      </v-tab>
      <v-tab value="sessions">
        <v-icon start>mdi-account-multiple</v-icon>
        Активные сессии
      </v-tab>
    </v-tabs>

    <!-- Контент вкладок -->
    <v-card elevation="2">
      <v-card-text class="pa-6">
        <!-- Политики безопасности -->
        <div v-if="activeTab === 'policies'">
          <h4 class="text-h6 font-weight-bold mb-4">Политики безопасности</h4>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="d-flex align-center gap-2">
                  <v-icon color="primary">mdi-key</v-icon>
                  Политика паролей
                </v-card-title>
                <v-card-text>
                  <v-switch
                    v-model="passwordPolicy.enforce_complexity"
                    label="Требовать сложные пароли"
                    color="primary"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model.number="passwordPolicy.min_length"
                    label="Минимальная длина"
                    type="number"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model.number="passwordPolicy.expiry_days"
                    label="Срок действия (дней)"
                    type="number"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  />
                  <v-switch
                    v-model="passwordPolicy.require_special_chars"
                    label="Специальные символы"
                    color="primary"
                  />
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="d-flex align-center gap-2">
                  <v-icon color="primary">mdi-login</v-icon>
                  Политика входа
                </v-card-title>
                <v-card-text>
                  <v-text-field
                    v-model.number="loginPolicy.max_attempts"
                    label="Максимум попыток"
                    type="number"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model.number="loginPolicy.lockout_duration"
                    label="Блокировка (минуты)"
                    type="number"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model.number="loginPolicy.session_timeout"
                    label="Таймаут сессии (минуты)"
                    type="number"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  />
                  <v-switch
                    v-model="loginPolicy.require_2fa"
                    label="Двухфакторная аутентификация"
                    color="primary"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div class="d-flex justify-end">
            <v-btn
              color="primary"
              @click="savePolicies"
              :loading="savingPolicies"
            >
              Сохранить политики
            </v-btn>
          </div>
        </div>

        <!-- Права доступа -->
        <div v-if="activeTab === 'permissions'">
          <h4 class="text-h6 font-weight-bold mb-4">Управление правами доступа</h4>
          
          <v-row>
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title>Роли пользователей</v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item
                      v-for="role in roles"
                      :key="role.id"
                      @click="selectedRole = role"
                      :active="selectedRole?.id === role.id"
                    >
                      <template #prepend>
                        <v-icon :color="role.color">{{ role.icon }}</v-icon>
                      </template>
                      <v-list-item-title>{{ role.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ role.users_count }} пользователей</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="8">
              <v-card variant="outlined" v-if="selectedRole">
                <v-card-title>
                  Права доступа: {{ selectedRole.name }}
                </v-card-title>
                <v-card-text>
                  <div class="permissions-grid">
                    <div
                      v-for="category in permissionCategories"
                      :key="category.name"
                      class="permission-category"
                    >
                      <h5 class="text-subtitle-2 font-weight-bold mb-2">{{ category.label }}</h5>
                      <v-checkbox
                        v-for="permission in category.permissions"
                        :key="permission.key"
                        v-model="selectedRole.permissions"
                        :value="permission.key"
                        :label="permission.label"
                        color="primary"
                        density="compact"
                        hide-details
                        class="mb-1"
                      />
                    </div>
                  </div>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    @click="saveRolePermissions"
                    :loading="savingPermissions"
                  >
                    Сохранить права
                  </v-btn>
                </v-card-actions>
              </v-card>
              
              <v-card variant="outlined" v-else>
                <v-card-text class="text-center py-8">
                  <v-icon size="48" color="grey">mdi-account-key</v-icon>
                  <p class="text-body-2 text-medium-emphasis mt-2">
                    Выберите роль для настройки прав доступа
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Аудит действий -->
        <div v-if="activeTab === 'audit'">
          <div class="d-flex align-center justify-space-between mb-4">
            <h4 class="text-h6 font-weight-bold">Журнал аудита</h4>
            <div class="d-flex gap-2">
              <v-select
                v-model="auditFilter.action"
                :items="auditActions"
                label="Действие"
                variant="outlined"
                density="compact"
                style="min-width: 150px"
                clearable
              />
              <v-select
                v-model="auditFilter.user"
                :items="auditUsers"
                label="Пользователь"
                variant="outlined"
                density="compact"
                style="min-width: 150px"
                clearable
              />
              <v-btn
                variant="outlined"
                @click="loadAuditLog"
                :loading="loadingAudit"
              >
                Обновить
              </v-btn>
            </div>
          </div>

          <v-data-table
            :headers="auditHeaders"
            :items="auditLog"
            :loading="loadingAudit"
            class="audit-table"
            density="compact"
            :items-per-page="15"
          >
            <template #item.timestamp="{ item }">
              {{ formatDateTime(item.timestamp) }}
            </template>

            <template #item.action="{ item }">
              <v-chip
                :color="getActionColor(item.action)"
                size="small"
                variant="outlined"
              >
                {{ getActionLabel(item.action) }}
              </v-chip>
            </template>

            <template #item.user="{ item }">
              <div class="d-flex align-center gap-2">
                <v-avatar size="24">
                  <v-img :src="item.user.avatar" :alt="item.user.name" />
                </v-avatar>
                {{ item.user.name }}
              </div>
            </template>

            <template #item.details="{ item }">
              <v-btn
                variant="text"
                size="small"
                @click="viewAuditDetails(item)"
              >
                Подробнее
              </v-btn>
            </template>
          </v-data-table>
        </div>

        <!-- Активные сессии -->
        <div v-if="activeTab === 'sessions'">
          <div class="d-flex align-center justify-space-between mb-4">
            <h4 class="text-h6 font-weight-bold">Активные сессии</h4>
            <v-btn
              variant="outlined"
              color="error"
              @click="terminateAllSessions"
              :loading="terminatingAll"
            >
              Завершить все сессии
            </v-btn>
          </div>

          <v-row>
            <v-col
              v-for="session in activeSessions"
              :key="session.id"
              cols="12"
              md="6"
              lg="4"
            >
              <v-card class="session-card" elevation="2">
                <v-card-title class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center gap-2">
                    <v-avatar size="32">
                      <v-img :src="session.user.avatar" :alt="session.user.name" />
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-2">{{ session.user.name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ session.user.role }}</div>
                    </div>
                  </div>
                  
                  <v-chip
                    :color="session.is_current ? 'success' : 'primary'"
                    size="small"
                    variant="elevated"
                  >
                    {{ session.is_current ? 'Текущая' : 'Активная' }}
                  </v-chip>
                </v-card-title>

                <v-card-text class="pt-2">
                  <div class="session-info">
                    <div class="d-flex align-center gap-2 mb-2">
                      <v-icon size="16" color="medium-emphasis">mdi-web</v-icon>
                      <span class="text-caption">{{ session.browser }}</span>
                    </div>
                    
                    <div class="d-flex align-center gap-2 mb-2">
                      <v-icon size="16" color="medium-emphasis">mdi-map-marker</v-icon>
                      <span class="text-caption">{{ session.location }}</span>
                    </div>
                    
                    <div class="d-flex align-center gap-2 mb-2">
                      <v-icon size="16" color="medium-emphasis">mdi-ip</v-icon>
                      <span class="text-caption">{{ session.ip_address }}</span>
                    </div>
                    
                    <div class="d-flex align-center gap-2">
                      <v-icon size="16" color="medium-emphasis">mdi-clock</v-icon>
                      <span class="text-caption">Вход: {{ formatDateTime(session.login_time) }}</span>
                    </div>
                  </div>
                </v-card-text>

                <v-card-actions v-if="!session.is_current">
                  <v-spacer />
                  <v-btn
                    variant="text"
                    color="error"
                    size="small"
                    @click="terminateSession(session.id)"
                    :loading="terminatingSessions[session.id]"
                  >
                    Завершить
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>

    <!-- Диалог подробностей аудита -->
    <v-dialog v-model="auditDetailsDialog.show" max-width="600">
      <v-card v-if="auditDetailsDialog.item">
        <v-card-title>Детали аудита</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Пользователь</div>
              <div>{{ auditDetailsDialog.item.user.name }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Действие</div>
              <div>{{ getActionLabel(auditDetailsDialog.item.action) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Время</div>
              <div>{{ formatDateTime(auditDetailsDialog.item.timestamp) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">IP адрес</div>
              <div>{{ auditDetailsDialog.item.ip_address }}</div>
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-medium-emphasis">Описание</div>
              <div>{{ auditDetailsDialog.item.description }}</div>
            </v-col>
            <v-col cols="12" v-if="auditDetailsDialog.item.metadata">
              <div class="text-caption text-medium-emphasis">Дополнительные данные</div>
              <v-code class="d-block pa-2">
                {{ JSON.stringify(auditDetailsDialog.item.metadata, null, 2) }}
              </v-code>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="auditDetailsDialog.show = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar для уведомлений -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

// Реактивные данные
const activeTab = ref('policies');
const savingPolicies = ref(false);
const savingPermissions = ref(false);
const loadingAudit = ref(false);
const terminatingAll = ref(false);
const terminatingSessions = ref<Record<string, boolean>>({});

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Демо данные для статистики
const securityStats = ref({
  activeUsers: 23,
  blockedUsers: 2,
  todayLogins: 47,
  failedAttempts: 8
});

// Политики безопасности
const passwordPolicy = ref({
  enforce_complexity: true,
  min_length: 8,
  expiry_days: 90,
  require_special_chars: true
});

const loginPolicy = ref({
  max_attempts: 5,
  lockout_duration: 15,
  session_timeout: 480,
  require_2fa: false
});

// Роли и права доступа
const selectedRole = ref<any>(null);

const roles = ref([
  {
    id: '1',
    name: 'Администратор',
    color: 'error',
    icon: 'mdi-shield-crown',
    users_count: 2,
    permissions: ['*'] // все права
  },
  {
    id: '2',
    name: 'Менеджер',
    color: 'primary',
    icon: 'mdi-account-tie',
    users_count: 8,
    permissions: ['objects.read', 'objects.create', 'objects.update', 'contracts.read', 'contracts.create']
  },
  {
    id: '3',
    name: 'Технический специалист',
    color: 'success',
    icon: 'mdi-tools',
    users_count: 12,
    permissions: ['objects.read', 'installations.read', 'installations.create', 'warehouse.read']
  },
  {
    id: '4',
    name: 'Бухгалтер',
    color: 'warning',
    icon: 'mdi-calculator',
    users_count: 1,
    permissions: ['billing.read', 'contracts.read', 'reports.read']
  }
]);

const permissionCategories = ref([
  {
    name: 'objects',
    label: 'Объекты',
    permissions: [
      { key: 'objects.read', label: 'Просмотр объектов' },
      { key: 'objects.create', label: 'Создание объектов' },
      { key: 'objects.update', label: 'Редактирование объектов' },
      { key: 'objects.delete', label: 'Удаление объектов' }
    ]
  },
  {
    name: 'users',
    label: 'Пользователи',
    permissions: [
      { key: 'users.read', label: 'Просмотр пользователей' },
      { key: 'users.create', label: 'Создание пользователей' },
      { key: 'users.update', label: 'Редактирование пользователей' },
      { key: 'users.delete', label: 'Удаление пользователей' }
    ]
  },
  {
    name: 'contracts',
    label: 'Договоры',
    permissions: [
      { key: 'contracts.read', label: 'Просмотр договоров' },
      { key: 'contracts.create', label: 'Создание договоров' },
      { key: 'contracts.update', label: 'Редактирование договоров' },
      { key: 'contracts.delete', label: 'Удаление договоров' }
    ]
  },
  {
    name: 'installations',
    label: 'Монтажи',
    permissions: [
      { key: 'installations.read', label: 'Просмотр монтажей' },
      { key: 'installations.create', label: 'Создание монтажей' },
      { key: 'installations.update', label: 'Редактирование монтажей' },
      { key: 'installations.delete', label: 'Удаление монтажей' }
    ]
  },
  {
    name: 'warehouse',
    label: 'Склад',
    permissions: [
      { key: 'warehouse.read', label: 'Просмотр склада' },
      { key: 'warehouse.update', label: 'Управление складом' }
    ]
  },
  {
    name: 'billing',
    label: 'Биллинг',
    permissions: [
      { key: 'billing.read', label: 'Просмотр биллинга' },
      { key: 'billing.manage', label: 'Управление биллингом' }
    ]
  },
  {
    name: 'reports',
    label: 'Отчеты',
    permissions: [
      { key: 'reports.read', label: 'Просмотр отчетов' },
      { key: 'reports.create', label: 'Создание отчетов' }
    ]
  },
  {
    name: 'settings',
    label: 'Настройки',
    permissions: [
      { key: 'settings.read', label: 'Просмотр настроек' },
      { key: 'settings.update', label: 'Изменение настроек' }
    ]
  }
]);

// Аудит
const auditFilter = ref({
  action: '',
  user: ''
});

const auditActions = [
  { value: 'login', title: 'Вход в систему' },
  { value: 'logout', title: 'Выход из системы' },
  { value: 'create', title: 'Создание' },
  { value: 'update', title: 'Изменение' },
  { value: 'delete', title: 'Удаление' },
  { value: 'export', title: 'Экспорт' }
];

const auditUsers = [
  { value: 'user1', title: 'Иван Петров' },
  { value: 'user2', title: 'Мария Сидорова' },
  { value: 'user3', title: 'Алексей Козлов' }
];

const auditHeaders = [
  { title: 'Время', key: 'timestamp', width: '180px' },
  { title: 'Пользователь', key: 'user', width: '200px' },
  { title: 'Действие', key: 'action', width: '150px' },
  { title: 'Объект', key: 'object', width: '200px' },
  { title: 'IP адрес', key: 'ip_address', width: '120px' },
  { title: 'Детали', key: 'details', width: '100px', sortable: false }
] as const;

const auditLog = ref([
  {
    id: '1',
    timestamp: new Date('2024-01-15T15:30:00'),
    user: { name: 'Иван Петров', avatar: 'https://ui-avatars.com/api/?name=ИП&background=667eea&color=fff' },
    action: 'login',
    object: 'Система',
    ip_address: '192.168.1.100',
    description: 'Успешный вход в систему',
    metadata: { browser: 'Chrome 120.0', os: 'Windows 10' }
  },
  {
    id: '2',
    timestamp: new Date('2024-01-15T15:25:00'),
    user: { name: 'Мария Сидорова', avatar: 'https://ui-avatars.com/api/?name=МС&background=667eea&color=fff' },
    action: 'update',
    object: 'Объект "Офис центральный"',
    ip_address: '192.168.1.105',
    description: 'Изменение параметров объекта',
    metadata: { changes: { name: 'Офис центральный', status: 'active' } }
  },
  {
    id: '3',
    timestamp: new Date('2024-01-15T15:20:00'),
    user: { name: 'Алексей Козлов', avatar: 'https://ui-avatars.com/api/?name=АК&background=667eea&color=fff' },
    action: 'create',
    object: 'Монтаж #1234',
    ip_address: '192.168.1.110',
    description: 'Создание нового монтажа',
    metadata: { object_id: 'obj_123', installer_id: 'inst_456' }
  }
]);

const auditDetailsDialog = ref({
  show: false,
  item: null as any
});

// Активные сессии
const activeSessions = ref([
  {
    id: '1',
    user: {
      name: 'Иван Петров',
      role: 'Администратор',
      avatar: 'https://ui-avatars.com/api/?name=ИП&background=667eea&color=fff'
    },
    browser: 'Chrome 120.0 на Windows 10',
    location: 'Москва, Россия',
    ip_address: '192.168.1.100',
    login_time: new Date('2024-01-15T09:30:00'),
    is_current: true
  },
  {
    id: '2',
    user: {
      name: 'Мария Сидорова',
      role: 'Менеджер',
      avatar: 'https://ui-avatars.com/api/?name=МС&background=667eea&color=fff'
    },
    browser: 'Firefox 121.0 на macOS',
    location: 'Санкт-Петербург, Россия',
    ip_address: '192.168.1.105',
    login_time: new Date('2024-01-15T10:15:00'),
    is_current: false
  },
  {
    id: '3',
    user: {
      name: 'Алексей Козлов',
      role: 'Технический специалист',
      avatar: 'https://ui-avatars.com/api/?name=АК&background=667eea&color=fff'
    },
    browser: 'Safari 17.0 на iOS',
    location: 'Екатеринбург, Россия',
    ip_address: '192.168.1.110',
    login_time: new Date('2024-01-15T11:45:00'),
    is_current: false
  }
]);

// Методы
const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

const getActionColor = (action: string) => {
  const colors = {
    login: 'success',
    logout: 'info',
    create: 'primary',
    update: 'warning',
    delete: 'error',
    export: 'info'
  } as any;
  return colors[action] || 'grey';
};

const getActionLabel = (action: string) => {
  const labels = {
    login: 'Вход',
    logout: 'Выход',
    create: 'Создание',
    update: 'Изменение',
    delete: 'Удаление',
    export: 'Экспорт'
  } as any;
  return labels[action] || action;
};

const savePolicies = async () => {
  savingPolicies.value = true;
  try {
    // Имитация сохранения
    await new Promise(resolve => setTimeout(resolve, 1000));
    showSnackbar('Политики безопасности сохранены', 'success');
  } catch (error) {
    showSnackbar('Ошибка сохранения политик', 'error');
  } finally {
    savingPolicies.value = false;
  }
};

const saveRolePermissions = async () => {
  savingPermissions.value = true;
  try {
    // Имитация сохранения
    await new Promise(resolve => setTimeout(resolve, 800));
    showSnackbar(`Права роли "${selectedRole.value?.name}" сохранены`, 'success');
  } catch (error) {
    showSnackbar('Ошибка сохранения прав доступа', 'error');
  } finally {
    savingPermissions.value = false;
  }
};

const loadAuditLog = async () => {
  loadingAudit.value = true;
  try {
    // Имитация загрузки
    await new Promise(resolve => setTimeout(resolve, 500));
    showSnackbar('Журнал аудита обновлен', 'success');
  } catch (error) {
    showSnackbar('Ошибка загрузки журнала аудита', 'error');
  } finally {
    loadingAudit.value = false;
  }
};

const viewAuditDetails = (item: any) => {
  auditDetailsDialog.value.item = item;
  auditDetailsDialog.value.show = true;
};

const terminateSession = async (sessionId: string) => {
  terminatingSessions.value[sessionId] = true;
  try {
    // Имитация завершения сессии
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Удаляем сессию из списка
    const index = activeSessions.value.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      activeSessions.value.splice(index, 1);
    }
    
    showSnackbar('Сессия завершена', 'success');
  } catch (error) {
    showSnackbar('Ошибка завершения сессии', 'error');
  } finally {
    terminatingSessions.value[sessionId] = false;
  }
};

const terminateAllSessions = async () => {
  terminatingAll.value = true;
  try {
    // Имитация завершения всех сессий
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Оставляем только текущую сессию
    activeSessions.value = activeSessions.value.filter(s => s.is_current);
    
    showSnackbar('Все сессии завершены', 'success');
  } catch (error) {
    showSnackbar('Ошибка завершения сессий', 'error');
  } finally {
    terminatingAll.value = false;
  }
};

// Lifecycle
onMounted(() => {
  // Выбираем первую роль по умолчанию
  if (roles.value.length > 0) {
    selectedRole.value = roles.value[0];
  }
});
</script>

<style scoped>
.security-settings {
  max-width: none;
}

.stats-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.permission-category {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 16px;
}

.audit-table {
  border-radius: 12px;
}

.session-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  height: 100%;
}

.session-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.session-info {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 12px;
}

/* Темная тема */
[data-theme="dark"] .stats-card:hover,
[data-theme="dark"] .session-card:hover {
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
}

/* Responsive */
@media (max-width: 960px) {
  .stats-card,
  .session-card {
    margin-bottom: 16px;
  }
  
  .permissions-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
