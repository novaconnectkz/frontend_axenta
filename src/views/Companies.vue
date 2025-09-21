<template>
  <div class="companies-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Учетные записи</h1>
        <p class="page-subtitle">Управление компаниями и организациями</p>
        <!-- Демо режим уведомление -->
        <v-alert type="info" variant="tonal" density="compact" class="mt-3" icon="mdi-information">
          <template #text>
            <strong>Демо режим:</strong> Отображаются тестовые данные. Все действия работают, но не сохраняются на
            сервере.
          </template>
        </v-alert>
      </div>
      <div class="header-actions">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          Добавить компанию
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-download" @click="exportCompanies" :loading="exporting">
          Экспорт
        </v-btn>
      </div>
    </div>

    <!-- Статистика -->
    <div class="stats-cards">
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text>
              <div class="stat-content">
                <div class="stat-icon primary">
                  <v-icon>mdi-domain</v-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.total }}</div>
                  <div class="stat-label">Всего компаний</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text>
              <div class="stat-content">
                <div class="stat-icon success">
                  <v-icon>mdi-check-circle</v-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.active }}</div>
                  <div class="stat-label">Активных</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text>
              <div class="stat-content">
                <div class="stat-icon info">
                  <v-icon>mdi-account-group</v-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.total_users }}</div>
                  <div class="stat-label">Пользователей</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text>
              <div class="stat-content">
                <div class="stat-icon warning">
                  <v-icon>mdi-radar</v-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.total_objects }}</div>
                  <div class="stat-label">Объектов</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Фильтры -->
    <v-card class="filters-card">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field 
              v-model="filters.search" 
              label="Поиск компаний" 
              variant="outlined" 
              density="compact" 
              clearable 
              @input="debouncedSearch"
              :color="isMultipleSearch ? 'primary' : undefined"
            >
              <template #prepend-inner>
                <v-tooltip :text="searchHint" location="bottom">
                  <template #activator="{ props }">
                    <v-icon 
                      v-bind="props" 
                      :icon="isMultipleSearch ? 'mdi-format-list-checks' : 'mdi-magnify'" 
                      :color="isMultipleSearch ? 'primary' : undefined"
                    />
                  </template>
                </v-tooltip>
              </template>
              
              <template #append-inner v-if="isMultipleSearch">
                <v-tooltip text="Активен точный поиск по нескольким компаниям">
                  <template #activator="{ props }">
                    <v-chip v-bind="props" size="x-small" color="primary" variant="flat">
                      {{ searchTermsArray.length }}
                    </v-chip>
                  </template>
                </v-tooltip>
              </template>
            </v-text-field>
            
            <!-- Чипы с найденными компаниями -->
            <div v-if="isMultipleSearch && searchTermsArray.length > 0" class="search-chips mt-2">
              <v-chip
                v-for="(term, index) in searchTermsArray"
                :key="index"
                size="small"
                color="primary"
                variant="outlined"
                class="mr-1 mb-1"
                closable
                @click:close="removeSearchTerm(index)"
              >
                {{ term }}
              </v-chip>
            </div>
          </v-col>
          <v-col cols="12" md="3">
            <v-select v-model="filters.is_active" label="Статус" :items="statusOptions" variant="outlined"
              density="compact" clearable @update:model-value="loadCompanies" />
          </v-col>
          <v-col cols="12" md="2">
            <v-select v-model="filters.limit" label="На странице" :items="[10, 25, 50, 100]" variant="outlined"
              density="compact" @update:model-value="loadCompanies" />
          </v-col>
          <v-col cols="12" md="3" class="text-right">
            <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="refreshData" :loading="loading">
              Обновить
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Таблица компаний -->
    <v-card class="companies-table-card">
      <!-- Панель групповых действий -->
      <div v-if="selectedCompanies.length > 0" class="bulk-actions-panel">
        <div class="bulk-actions-info">
          <v-icon>mdi-checkbox-marked</v-icon>
          Выбрано компаний: {{ selectedCompanies.length }}
        </div>
        <div class="bulk-actions-buttons">
          <v-btn variant="text" size="small" prepend-icon="mdi-close" @click="clearSelection">
            Снять выделение
          </v-btn>
          
          <!-- Активация/деактивация -->
          <v-btn 
            v-if="hasInactiveCompanies"
            variant="outlined" 
            size="small" 
            prepend-icon="mdi-play" 
            color="success"
            :loading="bulkActionsLoading"
            @click="bulkActivateCompanies"
          >
            Активировать ({{ inactiveCompaniesCount }})
          </v-btn>
          
          <v-btn 
            v-if="hasActiveCompanies"
            variant="outlined" 
            size="small" 
            prepend-icon="mdi-pause" 
            color="warning"
            :loading="bulkActionsLoading"
            @click="bulkDeactivateCompanies"
          >
            Деактивировать ({{ activeCompaniesCount }})
          </v-btn>
          
          <!-- Удаление -->
          <v-btn 
            variant="outlined" 
            size="small" 
            prepend-icon="mdi-delete" 
            color="error"
            :loading="bulkActionsLoading"
            @click="bulkDeleteCompanies"
          >
            Удалить ({{ selectedCompanies.length }})
          </v-btn>
        </div>
      </div>
      
      <v-data-table :headers="headers" :items="companies" :loading="loading" :items-per-page="filters.limit"
        :page="filters.page" :server-items-length="totalItems" @update:page="onPageChange"
        @update:items-per-page="onLimitChange" class="companies-table">
        <!-- Чекбокс выделения -->
        <template #item.select="{ item }">
          <v-checkbox 
            :model-value="isCompanySelected(item)" 
            @update:model-value="toggleCompanySelection(item)"
            hide-details 
            density="compact" 
          />
        </template>

        <!-- Заголовок чекбокса -->
        <template #header.select>
          <v-checkbox 
            :model-value="selectAll" 
            :indeterminate="selectedCompanies.length > 0 && selectedCompanies.length < companies.length"
            @update:model-value="toggleSelectAll"
            hide-details 
            density="compact"
          />
        </template>

        <!-- Название компании -->
        <template #item.name="{ item }">
          <div class="company-name">
            <div class="name">{{ item.name }}</div>
            <div class="schema" v-if="item.database_schema">{{ item.database_schema }}</div>
          </div>
        </template>

        <!-- Статус -->
        <template #item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'error'" size="small">
            {{ item.is_active ? 'Активна' : 'Неактивна' }}
          </v-chip>
        </template>

        <!-- Контактная информация -->
        <template #item.contact="{ item }">
          <div class="contact-info" v-if="item.contact_person || item.contact_email">
            <div class="person" v-if="item.contact_person">{{ item.contact_person }}</div>
            <div class="email" v-if="item.contact_email">{{ item.contact_email }}</div>
            <div class="phone" v-if="item.contact_phone">{{ item.contact_phone }}</div>
          </div>
          <span v-else class="text-grey">Не указано</span>
        </template>

        <!-- Статистика использования -->
        <template #item.usage="{ item }">
          <div class="usage-info" v-if="item.usage_stats">
            <div class="usage-item">
              <v-icon size="small">mdi-account</v-icon>
              {{ item.usage_stats.users_count }}
            </div>
            <div class="usage-item">
              <v-icon size="small">mdi-radar</v-icon>
              {{ item.usage_stats.objects_count }}
            </div>
            <div class="usage-item">
              <v-icon size="small">mdi-harddisk</v-icon>
              {{ formatStorage(item.usage_stats.storage_used_mb) }}
            </div>
          </div>
          <span v-else class="text-grey">Нет данных</span>
        </template>

        <!-- Лимиты -->
        <template #item.limits="{ item }">
          <div class="limits-info">
            <div class="limit-item">
              <span class="label">Пользователи:</span>
              <span class="value">{{ item.max_users }}</span>
            </div>
            <div class="limit-item">
              <span class="label">Объекты:</span>
              <span class="value">{{ item.max_objects }}</span>
            </div>
            <div class="limit-item">
              <span class="label">Хранилище:</span>
              <span class="value">{{ formatStorage(item.storage_quota) }}</span>
            </div>
          </div>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="actions">
            <v-tooltip text="Просмотр">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-eye" size="small" variant="text" @click="openViewDialog(item)" />
              </template>
            </v-tooltip>
            <v-tooltip text="Редактировать">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-pencil" size="small" variant="text" @click="openEditDialog(item)" />
              </template>
            </v-tooltip>
            <v-tooltip :text="item.is_active ? 'Деактивировать' : 'Активировать'">
              <template #activator="{ props }">
                <v-btn v-bind="props" :icon="item.is_active ? 'mdi-pause' : 'mdi-play'" size="small" variant="text"
                  :color="item.is_active ? 'warning' : 'success'" @click="toggleCompanyStatus(item)" />
              </template>
            </v-tooltip>
            <v-tooltip text="Удалить">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-delete" size="small" variant="text" color="error"
                  @click="confirmDelete(item)" />
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Диалог создания/редактирования компании -->
    <CompanyDialog v-model="showDialog" :company="selectedCompany" :mode="dialogMode" @saved="onCompanySaved" />

    <!-- Диалог просмотра компании -->
    <CompanyViewDialog v-model="showViewDialog" :company="selectedCompany" />

    <!-- Диалог подтверждения массового удаления -->
    <BulkDeleteConfirmDialog
      v-model="showBulkDeleteDialog"
      :items="selectedCompanies"
      item-type="компаний"
      :loading="bulkActionsLoading"
      @confirm="executeBulkDelete"
      @cancel="showBulkDeleteDialog = false"
    />

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title>Подтверждение удаления</v-card-title>
        <v-card-text>
          <p>Вы уверены, что хотите удалить компанию <strong>{{ selectedCompany?.name }}</strong>?</p>
          <p class="text-error">Это действие нельзя отменить.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false">Отмена</v-btn>
          <v-btn color="error" @click="deleteCompany" :loading="deleting">
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Снэкбар для уведомлений -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>

    <!-- Красивые уведомления об успехе -->
    <SuccessNotification
      :show="successNotification.show"
      :title="successNotification.title"
      :message="successNotification.message"
      :details="successNotification.details"
      :icon="successNotification.icon"
      @close="successNotification.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import BulkDeleteConfirmDialog from '@/components/Common/BulkDeleteConfirmDialog.vue'
import SuccessNotification from '@/components/Common/SuccessNotification.vue'
import CompanyDialog from '@/components/Companies/CompanyDialog.vue'
import CompanyViewDialog from '@/components/Companies/CompanyViewDialog.vue'
import type {
  Company,
  CompanyFilters,
  CompanyStats
} from '@/types/companies'
import { COMPANY_FILTERS_DEFAULTS } from '@/types/companies'
import { computed, onMounted, reactive, ref, watch } from 'vue'

// Реактивные данные
const companies = ref<Company[]>([])
const stats = ref<CompanyStats>({
  total: 0,
  active: 0,
  inactive: 0,
  total_users: 0,
  total_objects: 0
})

const filters = reactive<CompanyFilters>({ ...COMPANY_FILTERS_DEFAULTS })
const loading = ref(false)
const exporting = ref(false)
const deleting = ref(false)
const totalItems = ref(0)

// Bulk selection
const selectedCompanies = ref<Company[]>([])
const selectAll = ref(false)
const bulkActionsLoading = ref(false)

// Диалоги
const showDialog = ref(false)
const showViewDialog = ref(false)
const showDeleteDialog = ref(false)
const showBulkDeleteDialog = ref(false)
const selectedCompany = ref<Company | null>(null)
const dialogMode = ref<'create' | 'edit'>('create')

// Снэкбар
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
})

// Красивые уведомления об успехе
const successNotification = reactive({
  show: false,
  title: '',
  message: '',
  details: '',
  icon: 'mdi-check-circle'
})

// Заголовки таблицы
const headers = [
  { title: '', key: 'select', sortable: false, width: 50 },
  { title: 'Компания', key: 'name', sortable: true },
  { title: 'Статус', key: 'is_active', sortable: true },
  { title: 'Контакты', key: 'contact', sortable: false },
  { title: 'Город', key: 'city', sortable: true },
  { title: 'Использование', key: 'usage', sortable: false },
  { title: 'Лимиты', key: 'limits', sortable: false },
  { title: 'Создана', key: 'created_at', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false, width: 200 }
]

// Опции для фильтров
const statusOptions = [
  { title: 'Все', value: null },
  { title: 'Активные', value: true },
  { title: 'Неактивные', value: false }
]

// Debounce функция
const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }) as T
}

// Вычисляемые свойства
const debouncedSearch = debounce(() => {
  filters.page = 1
  loadCompanies()
}, 500)

// Computed properties для групповых действий
const activeCompaniesCount = computed(() => {
  return selectedCompanies.value.filter(company => company.is_active).length
})

const inactiveCompaniesCount = computed(() => {
  return selectedCompanies.value.filter(company => !company.is_active).length
})

const hasActiveCompanies = computed(() => {
  return activeCompaniesCount.value > 0
})

const hasInactiveCompanies = computed(() => {
  return inactiveCompaniesCount.value > 0
})

// Подсказка для поля поиска
const searchHint = computed(() => {
  if (!filters.search) {
    return 'Введите название компании или несколько через запятую для точного поиска'
  }
  
  const searchTerms = filters.search.split(',').map(term => term.trim()).filter(term => term.length > 0)
  if (searchTerms.length > 1) {
    return `Поиск по ${searchTerms.length} компаниям: ${searchTerms.join(', ')}`
  }
  
  return 'Поиск по частичному совпадению или добавьте запятую для точного поиска'
})

// Определяем, активен ли множественный поиск
const isMultipleSearch = computed(() => {
  if (!filters.search) return false
  const searchTerms = filters.search.split(',').map(term => term.trim()).filter(term => term.length > 0)
  return searchTerms.length > 1
})

// Массив поисковых терминов для чипов
const searchTermsArray = computed(() => {
  if (!filters.search) return []
  return filters.search.split(',').map(term => term.trim()).filter(term => term.length > 0)
})

// Демо данные для компаний
const demoCompanies: Company[] = [
  {
    id: 1,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-03-10T14:20:00Z',
    name: 'ООО "Глонасс-Саратов"',
    database_schema: 'glonass_saratov',
    domain: 'glonass-saratov.ru',
    contact_email: 'info@glonass-saratov.ru',
    contact_phone: '+7 (8452) 555-123',
    contact_person: 'Иванов Сергей Петрович',
    address: 'ул. Московская, д. 155',
    city: 'Саратов',
    country: 'Russia',
    is_active: true,
    max_users: 50,
    max_objects: 1000,
    storage_quota: 5120, // 5GB
    language: 'ru',
    timezone: 'Europe/Moscow',
    currency: 'RUB',
    usage_stats: {
      users_count: 35,
      objects_count: 750,
      storage_used_mb: 3200,
      last_activity: '2024-03-15T09:15:00Z'
    }
  },
  {
    id: 2,
    created_at: '2024-02-01T11:00:00Z',
    updated_at: '2024-03-12T16:45:00Z',
    name: 'АО "Транспортные системы"',
    database_schema: 'transport_systems',
    domain: 'transport-sys.ru',
    contact_email: 'admin@transport-sys.ru',
    contact_phone: '+7 (495) 777-456',
    contact_person: 'Петрова Анна Владимировна',
    address: 'Ленинский проспект, д. 42',
    city: 'Москва',
    country: 'Russia',
    is_active: true,
    max_users: 100,
    max_objects: 2500,
    storage_quota: 10240, // 10GB
    language: 'ru',
    timezone: 'Europe/Moscow',
    currency: 'RUB',
    usage_stats: {
      users_count: 87,
      objects_count: 2100,
      storage_used_mb: 7800,
      last_activity: '2024-03-15T11:30:00Z'
    }
  },
  {
    id: 3,
    created_at: '2024-01-20T09:15:00Z',
    updated_at: '2024-03-01T12:00:00Z',
    name: 'ИП Смирнов А.В.',
    database_schema: 'smirnov_logistics',
    domain: 'smirnov-logistics.com',
    contact_email: 'smirnov@logistics.com',
    contact_phone: '+7 (812) 333-789',
    contact_person: 'Смирнов Алексей Викторович',
    address: 'Невский проспект, д. 88',
    city: 'Санкт-Петербург',
    country: 'Russia',
    is_active: false,
    max_users: 25,
    max_objects: 500,
    storage_quota: 2048, // 2GB
    language: 'ru',
    timezone: 'Europe/Moscow',
    currency: 'RUB',
    usage_stats: {
      users_count: 15,
      objects_count: 320,
      storage_used_mb: 1200,
      last_activity: '2024-02-28T15:45:00Z'
    }
  },
  {
    id: 4,
    created_at: '2024-02-10T14:30:00Z',
    updated_at: '2024-03-14T10:20:00Z',
    name: 'ООО "Автопарк Юг"',
    database_schema: 'autopark_yug',
    domain: 'autopark-yug.ru',
    contact_email: 'office@autopark-yug.ru',
    contact_phone: '+7 (863) 444-567',
    contact_person: 'Козлов Дмитрий Николаевич',
    address: 'пр. Ворошиловский, д. 25',
    city: 'Ростов-на-Дону',
    country: 'Russia',
    is_active: true,
    max_users: 75,
    max_objects: 1500,
    storage_quota: 7680, // 7.5GB
    language: 'ru',
    timezone: 'Europe/Moscow',
    currency: 'RUB',
    usage_stats: {
      users_count: 62,
      objects_count: 1250,
      storage_used_mb: 5400,
      last_activity: '2024-03-15T08:45:00Z'
    }
  },
  {
    id: 5,
    created_at: '2024-03-01T13:00:00Z',
    updated_at: '2024-03-15T17:30:00Z',
    name: 'ЗАО "Сибирь Транс"',
    database_schema: 'sibir_trans',
    domain: 'sibir-trans.ru',
    contact_email: 'info@sibir-trans.ru',
    contact_phone: '+7 (383) 666-890',
    contact_person: 'Новикова Елена Сергеевна',
    address: 'ул. Красный проспект, д. 78',
    city: 'Новосибирск',
    country: 'Russia',
    is_active: true,
    max_users: 40,
    max_objects: 800,
    storage_quota: 4096, // 4GB
    language: 'ru',
    timezone: 'Asia/Novosibirsk',
    currency: 'RUB',
    usage_stats: {
      users_count: 28,
      objects_count: 650,
      storage_used_mb: 2800,
      last_activity: '2024-03-15T12:00:00Z'
    }
  }
]

// Методы
const loadCompanies = async () => {
  try {
    loading.value = true

    // Имитируем задержку API
    await new Promise(resolve => setTimeout(resolve, 800))

    // Используем демо данные вместо API
    let filteredCompanies = [...demoCompanies]

    // Применяем фильтры поиска
    if (filters.search) {
      const searchTerms = filters.search.split(',').map(term => term.trim()).filter(term => term.length > 0)
      
      if (searchTerms.length > 1) {
        // Множественный поиск по точному совпадению названий
        const exactNames = searchTerms.map(term => term.toLowerCase())
        filteredCompanies = filteredCompanies.filter(company =>
          exactNames.includes(company.name.toLowerCase())
        )
      } else if (searchTerms.length === 1) {
        // Обычный поиск по частичному совпадению
        const searchLower = searchTerms[0].toLowerCase()
        filteredCompanies = filteredCompanies.filter(company =>
          company.name.toLowerCase().includes(searchLower) ||
          company.contact_person.toLowerCase().includes(searchLower) ||
          company.city.toLowerCase().includes(searchLower)
        )
      }
    }

    if (filters.is_active !== null) {
      filteredCompanies = filteredCompanies.filter(company =>
        company.is_active === filters.is_active
      )
    }

    // Применяем пагинацию
    const start = (filters.page - 1) * filters.limit
    const end = start + filters.limit
    companies.value = filteredCompanies.slice(start, end)
    totalItems.value = filteredCompanies.length

  } catch (error) {
    showSnackbar('Ошибка загрузки компаний', 'error')
    console.error('Error loading companies:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    // Имитируем задержку API
    await new Promise(resolve => setTimeout(resolve, 500))

    // Вычисляем статистику из демо данных
    const activeCompanies = demoCompanies.filter(c => c.is_active)
    const inactiveCompanies = demoCompanies.filter(c => !c.is_active)

    const totalUsers = demoCompanies.reduce((sum, company) =>
      sum + (company.usage_stats?.users_count || 0), 0
    )

    const totalObjects = demoCompanies.reduce((sum, company) =>
      sum + (company.usage_stats?.objects_count || 0), 0
    )

    stats.value = {
      total: demoCompanies.length,
      active: activeCompanies.length,
      inactive: inactiveCompanies.length,
      total_users: totalUsers,
      total_objects: totalObjects
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const refreshData = async () => {
  await Promise.all([loadCompanies(), loadStats()])
}

const onPageChange = (page: number) => {
  filters.page = page
  loadCompanies()
}

const onLimitChange = (limit: number) => {
  filters.limit = limit
  filters.page = 1
  loadCompanies()
}

// Диалоги
const openCreateDialog = () => {
  selectedCompany.value = null
  dialogMode.value = 'create'
  showDialog.value = true
}

const openEditDialog = (company: Company) => {
  selectedCompany.value = company
  dialogMode.value = 'edit'
  showDialog.value = true
}

const openViewDialog = (company: Company) => {
  selectedCompany.value = company
  showViewDialog.value = true
}

const onCompanySaved = () => {
  showDialog.value = false
  refreshData()
  showSnackbar('Компания успешно сохранена', 'success')
}

// Действия с компаниями
const toggleCompanyStatus = async (company: Company) => {
  try {
    // Имитируем API вызов
    await new Promise(resolve => setTimeout(resolve, 300))

    // Обновляем статус в демо данных
    const demoCompany = demoCompanies.find(c => c.id === company.id)
    if (demoCompany) {
      demoCompany.is_active = !demoCompany.is_active
    }

    if (company.is_active) {
      showSnackbar('Компания деактивирована', 'success')
    } else {
      showSnackbar('Компания активирована', 'success')
    }
    refreshData()
  } catch (error) {
    showSnackbar('Ошибка изменения статуса компании', 'error')
    console.error('Error toggling company status:', error)
  }
}


const confirmDelete = (company: Company) => {
  selectedCompany.value = company
  showDeleteDialog.value = true
}

const deleteCompany = async () => {
  if (!selectedCompany.value) return

  try {
    deleting.value = true

    // Имитируем API вызов
    await new Promise(resolve => setTimeout(resolve, 800))

    // Удаляем из демо данных
    const index = demoCompanies.findIndex(c => c.id === selectedCompany.value!.id)
    if (index > -1) {
      demoCompanies.splice(index, 1)
    }

    showDeleteDialog.value = false
    refreshData()
    showSnackbar('Компания удалена', 'success')
  } catch (error) {
    showSnackbar('Ошибка удаления компании', 'error')
    console.error('Error deleting company:', error)
  } finally {
    deleting.value = false
  }
}

// Экспорт
const exportCompanies = async () => {
  try {
    exporting.value = true

    // Имитируем экспорт
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Создаем простой CSV с демо данными
    const headers = ['ID', 'Название', 'Город', 'Статус', 'Пользователи', 'Объекты']
    const csvContent = [
      headers.join(','),
      ...demoCompanies.map(company => [
        company.id,
        `"${company.name}"`,
        `"${company.city}"`,
        company.is_active ? 'Активна' : 'Неактивна',
        company.usage_stats?.users_count || 0,
        company.usage_stats?.objects_count || 0
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `companies_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    showSnackbar('Экспорт завершен', 'success')
  } catch (error) {
    showSnackbar('Ошибка экспорта', 'error')
    console.error('Error exporting companies:', error)
  } finally {
    exporting.value = false
  }
}

// Утилиты
const formatStorage = (mb: number): string => {
  if (mb < 1024) return `${mb} МБ`
  return `${(mb / 1024).toFixed(1)} ГБ`
}

const showSnackbar = (text: string, color: string = 'success') => {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

const showSuccessNotification = (title: string, message: string, details?: string, icon?: string) => {
  successNotification.title = title
  successNotification.message = message
  successNotification.details = details || ''
  successNotification.icon = icon || 'mdi-check-circle'
  successNotification.show = true
}

// Функции для работы с выделением
const isCompanySelected = (company: Company): boolean => {
  return selectedCompanies.value.some(c => c.id === company.id)
}

const toggleCompanySelection = (company: Company) => {
  const index = selectedCompanies.value.findIndex(c => c.id === company.id)
  if (index > -1) {
    selectedCompanies.value.splice(index, 1)
  } else {
    selectedCompanies.value.push(company)
  }
  updateSelectAllState()
}

const updateSelectAllState = () => {
  if (selectedCompanies.value.length === 0) {
    selectAll.value = false
  } else if (selectedCompanies.value.length === companies.value.length) {
    selectAll.value = true
  } else {
    selectAll.value = false
  }
}

const toggleSelectAll = () => {
  if (selectAll.value || selectedCompanies.value.length === companies.value.length) {
    // Снимаем выделение со всех
    selectedCompanies.value = []
    selectAll.value = false
  } else {
    // Выделяем всех видимых компаний
    selectedCompanies.value = [...companies.value]
    selectAll.value = true
  }
}

const clearSelection = () => {
  selectedCompanies.value = []
  selectAll.value = false
}

// Удаление отдельного поискового термина
const removeSearchTerm = (index: number) => {
  const searchTerms = filters.search.split(',').map(term => term.trim()).filter(term => term.length > 0)
  searchTerms.splice(index, 1)
  filters.search = searchTerms.join(', ')
  debouncedSearch()
}

// Групповые действия
const bulkDeleteCompanies = () => {
  if (selectedCompanies.value.length === 0) {
    showSnackbar('Выберите компании для удаления', 'warning')
    return
  }

  // Проверяем, есть ли активные компании с пользователями
  const activeCompaniesWithUsers = selectedCompanies.value.filter(company => 
    company.is_active && company.usage_stats && company.usage_stats.users_count > 0
  )

  if (activeCompaniesWithUsers.length > 0) {
    const companyNames = activeCompaniesWithUsers.map(c => c.name).join(', ')
    showSnackbar(
      `Нельзя удалить активные компании с пользователями: ${companyNames}. Сначала деактивируйте их или удалите пользователей.`,
      'error'
    )
    return
  }

  showBulkDeleteDialog.value = true
}

const executeBulkDelete = async () => {
  try {
    bulkActionsLoading.value = true
    
    // Имитируем API вызов для демо
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Удаляем из демо данных
    selectedCompanies.value.forEach(selectedCompany => {
      const index = demoCompanies.findIndex(c => c.id === selectedCompany.id)
      if (index > -1) {
        demoCompanies.splice(index, 1)
      }
    })
    
    const deletedCount = selectedCompanies.value.length
    showBulkDeleteDialog.value = false
    clearSelection()
    await refreshData()
    showSuccessNotification(
      'Компании удалены',
      'Выбранные компании были успешно удалены из системы',
      `Удалено компаний: ${deletedCount}`,
      'mdi-delete-circle'
    )
  } catch (error: any) {
    console.error('Ошибка группового удаления компаний:', error)
    showSnackbar('Ошибка группового удаления компаний', 'error')
  } finally {
    bulkActionsLoading.value = false
  }
}

// Массовая активация компаний
const bulkActivateCompanies = async () => {
  if (inactiveCompaniesCount.value === 0) {
    showSnackbar('Нет неактивных компаний для активации', 'warning')
    return
  }

  const inactiveCompanies = selectedCompanies.value.filter(company => !company.is_active)
  const companyNames = inactiveCompanies.map(c => c.name).join(', ')
  
  if (!confirm(`Вы уверены, что хотите активировать ${inactiveCompanies.length} компаний?\n\n${companyNames}`)) {
    return
  }

  try {
    bulkActionsLoading.value = true
    
    // Имитируем API вызов для демо
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Активируем в демо данных
    inactiveCompanies.forEach(selectedCompany => {
      const demoCompany = demoCompanies.find(c => c.id === selectedCompany.id)
      if (demoCompany) {
        demoCompany.is_active = true
      }
    })
    
    clearSelection()
    await refreshData()
    showSuccessNotification(
      'Компании активированы',
      'Выбранные компании были успешно активированы',
      `Активировано компаний: ${inactiveCompanies.length}`,
      'mdi-play-circle'
    )
  } catch (error: any) {
    console.error('Ошибка массовой активации компаний:', error)
    showSnackbar('Ошибка массовой активации компаний', 'error')
  } finally {
    bulkActionsLoading.value = false
  }
}

// Массовая деактивация компаний
const bulkDeactivateCompanies = async () => {
  if (activeCompaniesCount.value === 0) {
    showSnackbar('Нет активных компаний для деактивации', 'warning')
    return
  }

  const activeCompanies = selectedCompanies.value.filter(company => company.is_active)
  
  // Проверяем, есть ли компании с пользователями
  const companiesWithUsers = activeCompanies.filter(company => 
    company.usage_stats && company.usage_stats.users_count > 0
  )

  if (companiesWithUsers.length > 0) {
    const companyNames = companiesWithUsers.map(c => c.name).join(', ')
    if (!confirm(`Внимание! Некоторые компании имеют активных пользователей: ${companyNames}.\n\nДеактивация может повлиять на работу пользователей. Продолжить?`)) {
      return
    }
  }

  const companyNames = activeCompanies.map(c => c.name).join(', ')
  if (!confirm(`Вы уверены, что хотите деактивировать ${activeCompanies.length} компаний?\n\n${companyNames}`)) {
    return
  }

  try {
    bulkActionsLoading.value = true
    
    // Имитируем API вызов для демо
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Деактивируем в демо данных
    activeCompanies.forEach(selectedCompany => {
      const demoCompany = demoCompanies.find(c => c.id === selectedCompany.id)
      if (demoCompany) {
        demoCompany.is_active = false
      }
    })
    
    clearSelection()
    await refreshData()
    showSuccessNotification(
      'Компании деактивированы',
      'Выбранные компании были успешно деактивированы',
      `Деактивировано компаний: ${activeCompanies.length}`,
      'mdi-pause-circle'
    )
  } catch (error: any) {
    console.error('Ошибка массовой деактивации компаний:', error)
    showSnackbar('Ошибка массовой деактивации компаний', 'error')
  } finally {
    bulkActionsLoading.value = false
  }
}

// Watchers
watch(filters, () => {
  clearSelection() // Очищаем выделение при изменении фильтров
}, { deep: true })

// Очищаем выделение при изменении компаний
watch(companies, () => {
  // Удаляем из выделения компании, которых больше нет в списке
  selectedCompanies.value = selectedCompanies.value.filter(selectedCompany =>
    companies.value.some(company => company.id === selectedCompany.id)
  )
  updateSelectAllState()
}, { deep: true })

// Инициализация
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.companies-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.primary {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.stat-icon.success {
  background-color: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
}

.stat-icon.info {
  background-color: rgba(var(--v-theme-info), 0.1);
  color: rgb(var(--v-theme-info));
}

.stat-icon.warning {
  background-color: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.stat-label {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.filters-card {
  margin-bottom: 24px;
}

.search-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.companies-table-card {
  border-radius: 12px;
}

.bulk-actions-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-primary), 0.04);
}

.bulk-actions-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
}

.bulk-actions-buttons {
  display: flex;
  gap: 8px;
}

.company-name .name {
  font-weight: 500;
  margin-bottom: 4px;
}

.company-name .schema {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.contact-info .person {
  font-weight: 500;
  margin-bottom: 2px;
}

.contact-info .email,
.contact-info .phone {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.usage-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.usage-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.limits-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.limit-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.limit-item .label {
  color: rgb(var(--v-theme-on-surface-variant));
}

.limit-item .value {
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 4px;
}

@media (max-width: 768px) {
  .companies-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    align-self: stretch;
  }

  .header-actions .v-btn {
    flex: 1;
  }

  .bulk-actions-panel {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .bulk-actions-buttons {
    justify-content: flex-end;
  }
}
</style>
