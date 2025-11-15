<template>
  <div class="sim-cards-list">
    <!-- Предупреждение о необходимости настройки -->
    <v-alert
      v-if="!isConfigured"
      type="warning"
      variant="tonal"
      class="mb-4"
      icon="mdi-alert"
    >
      <div class="text-body-2">
        <strong>Интеграция NovaConnect не настроена</strong>
        <p class="mb-0 mt-2">
          Для отображения списка SIM-карт необходимо настроить интеграцию с NovaConnect.
          <router-link to="/settings" class="ml-1">
            Перейти в настройки
          </router-link>
        </p>
      </div>
    </v-alert>

    <!-- Панель управления -->
    <div class="sim-controls mb-4">
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchQuery"
            placeholder="Поиск по номеру, ICCID, названию..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            @update:model-value="handleSearch"
          />
        </v-col>
        <v-col cols="12" md="6">
          <div class="d-flex align-center justify-end ga-2">
            <v-select
              v-model="filterProfile"
              :items="profileOptions"
              label="Профиль"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              style="max-width: 150px"
              @update:model-value="handleFilterChange"
            />
            <v-select
              v-model="filterBlocked"
              :items="blockedOptions"
              label="Статус блокировки"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              style="max-width: 180px"
              @update:model-value="handleFilterChange"
            />
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="loadSimCards"
              :loading="loading"
            >
              Обновить
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Единый баннер со статистикой -->
    <v-card v-if="stats" class="mb-4 stats-banner" elevation="2">
      <v-card-text class="pa-4">
        <v-row class="align-center">
          <!-- Основная статистика -->
          <v-col cols="12" md="6">
            <div class="d-flex align-center justify-space-around flex-wrap ga-4">
              <div class="stat-item">
                <div class="d-flex align-center mb-1">
                  <v-icon icon="mdi-sim" size="32" color="primary" class="mr-2" />
                  <div>
                    <div class="text-h4 font-weight-bold">{{ stats.total }}</div>
                    <div class="text-caption text-medium-emphasis">Всего SIM-карт</div>
                  </div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="d-flex align-center mb-1">
                  <v-icon icon="mdi-check-circle" size="32" color="success" class="mr-2" />
                  <div>
                    <div class="text-h4 font-weight-bold text-success">{{ stats.active }}</div>
                    <div class="text-caption text-medium-emphasis">Активных</div>
                  </div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="d-flex align-center mb-1">
                  <v-icon icon="mdi-cancel" size="32" color="error" class="mr-2" />
                  <div>
                    <div class="text-h4 font-weight-bold text-error">{{ stats.blocked }}</div>
                    <div class="text-caption text-medium-emphasis">Заблокированных</div>
                  </div>
                </div>
              </div>
            </div>
          </v-col>
          
          <!-- Профили -->
          <v-col cols="12" md="6">
            <v-divider vertical class="mx-4 d-none d-md-block" />
            <div class="profiles-section">
              <v-icon icon="mdi-sim-off" size="32" color="info" class="mr-3" />
              <div class="profiles-grid">
                <div
                  v-for="(count, profile) in stats.profiles"
                  :key="profile"
                  class="profile-badge"
                >
                  <span class="profile-value">{{ count }}</span>
                  <span class="profile-label">{{ profile }}</span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-body-2">Загрузка SIM-карт...</p>
    </div>

    <!-- Таблица SIM-карт -->
    <v-data-table
      v-if="!loading"
      :key="`sim-table-${tableKey}`"
      :headers="headers"
      :items="paginatedSimCards"
      :items-per-page="itemsPerPage"
      :page="currentPage"
      item-value="id"
      class="elevation-1"
      no-data-text="Отсутствуют данные"
      :loading="false"
      hide-default-footer
    >
      <template #item.name="{ item }">
        <div>
          <div class="font-weight-medium">{{ item.name || 'Без названия' }}</div>
          <div class="text-caption text-medium-emphasis">ID: {{ item.id }}</div>
        </div>
      </template>

      <template #item.number="{ item }">
        <div>
          <div class="font-weight-medium">{{ item.number }}</div>
          <div v-if="item.external_number" class="text-caption text-medium-emphasis">
            Доп: {{ item.external_number }}
          </div>
        </div>
      </template>

      <template #item.iccid="{ item }">
        <code class="text-body-2">{{ item.iccid }}</code>
      </template>

      <template #item.profile="{ item }">
        <v-chip
          :color="item.profile === 'TD' ? 'info' : 'success'"
          size="small"
          variant="tonal"
        >
          {{ item.profile }}
        </v-chip>
      </template>

      <template #item.block="{ item }">
        <v-chip
          :color="getBlockColor(item.block)"
          size="small"
          variant="tonal"
        >
          {{ getBlockLabel(item.block) }}
        </v-chip>
      </template>

      <template #item.balance="{ item }">
        <div v-if="item.profile === 'TC'">
          <div class="font-weight-medium">
            {{ formatBalance(item.balance) }} {{ item.currency }}
          </div>
          <div v-if="item.msu_value !== null" class="text-caption text-medium-emphasis">
            MSU: {{ item.msu_value }}
          </div>
        </div>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #item.limit="{ item }">
        <div v-if="item.limit.type !== 'off'">
          <div class="font-weight-medium">
            {{ formatLimit(item.limit) }}
          </div>
          <div v-if="item.limit.used !== null" class="text-caption text-medium-emphasis">
            Использовано: {{ formatBytes(item.limit.used) }}
          </div>
        </div>
        <span v-else class="text-medium-emphasis">Нет лимита</span>
      </template>

      <template #item.tariff="{ item }">
        <div>
          <div class="font-weight-medium">{{ item.tariff.name }}</div>
          <div v-if="item.tariff.package_auto" class="text-caption text-success">
            Автопродление
          </div>
        </div>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex align-center ga-1">
          <v-btn
            icon="mdi-eye"
            variant="text"
            size="small"
            @click="viewSimCard(item)"
            title="Просмотр"
          />
          <v-btn
            v-if="item.block === 'n'"
            icon="mdi-block"
            variant="text"
            size="small"
            color="error"
            @click="blockSimCard(item)"
            title="Заблокировать"
          />
          <v-btn
            v-else
            icon="mdi-check-circle"
            variant="text"
            size="small"
            color="success"
            @click="unblockSimCard(item)"
            title="Разблокировать"
          />
        </div>
      </template>
    </v-data-table>

    <!-- Кастомный футер с пагинацией -->
    <div v-if="!loading" class="compact-pagination mt-2">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div class="d-flex align-center ga-2">
          <span class="text-body-2 text-medium-emphasis">Элементов на странице:</span>
          <v-select
            v-model="itemsPerPage"
            :items="itemsPerPageOptions"
            variant="outlined"
            density="compact"
            hide-details
            class="items-select"
            style="max-width: 100px"
          />
        </div>
        <div class="d-flex align-center ga-2">
          <span class="range-info">
            Показано {{ startRange }}-{{ endRange }} из {{ totalItems }}
          </span>
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            density="comfortable"
            @update:model-value="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- Диалог просмотра SIM-карты -->
    <v-dialog v-model="showViewDialog" max-width="800px" scrollable>
      <v-card v-if="selectedSimCard">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon icon="mdi-sim" class="mr-2" />
            SIM-карта: {{ selectedSimCard.name || selectedSimCard.number }}
          </div>
          <v-btn icon="mdi-close" variant="text" @click="showViewDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="6">
              <div class="info-item mb-3">
                <div class="text-caption text-medium-emphasis">ID</div>
                <div class="text-body-1 font-weight-medium">{{ selectedSimCard.id }}</div>
              </div>
              <div class="info-item mb-3">
                <div class="text-caption text-medium-emphasis">ICCID</div>
                <div class="text-body-1 font-weight-medium"><code>{{ selectedSimCard.iccid }}</code></div>
              </div>
              <div class="info-item mb-3">
                <div class="text-caption text-medium-emphasis">Номер</div>
                <div class="text-body-1 font-weight-medium">{{ selectedSimCard.number }}</div>
              </div>
              <div v-if="selectedSimCard.external_number" class="info-item mb-3">
                <div class="text-caption text-medium-emphasis">Дополнительный номер</div>
                <div class="text-body-1 font-weight-medium">{{ selectedSimCard.external_number }}</div>
              </div>
              <div class="info-item mb-3">
                <div class="text-caption text-medium-emphasis">Профиль</div>
                <v-chip
                  :color="selectedSimCard.profile === 'TD' ? 'info' : 'success'"
                  size="small"
                  variant="tonal"
                >
                  {{ selectedSimCard.profile }}
                </v-chip>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="info-item mb-3">
                <div class="text-caption text-medium-emphasis">Статус блокировки</div>
                <v-chip
                  :color="getBlockColor(selectedSimCard.block)"
                  size="small"
                  variant="tonal"
                >
                  {{ getBlockLabel(selectedSimCard.block) }}
                </v-chip>
              </div>
              <div v-if="selectedSimCard.profile === 'TC'" class="info-item mb-3">
                <div class="text-caption text-medium-emphasis">Баланс</div>
                <div class="text-body-1 font-weight-medium">
                  {{ formatBalance(selectedSimCard.balance) }} {{ selectedSimCard.currency }}
                </div>
                <div v-if="selectedSimCard.msu_value !== null" class="text-caption text-medium-emphasis mt-1">
                  MSU: {{ selectedSimCard.msu_value }}
                </div>
              </div>
              <div class="info-item mb-3">
                <div class="text-caption text-medium-emphasis">Тариф</div>
                <div class="text-body-1 font-weight-medium">{{ selectedSimCard.tariff.name }}</div>
                <div v-if="selectedSimCard.tariff.package_auto" class="text-caption text-success mt-1">
                  Автопродление включено
                </div>
              </div>
              <div v-if="selectedSimCard.limit.type !== 'off'" class="info-item mb-3">
                <div class="text-caption text-medium-emphasis">Лимит</div>
                <div class="text-body-1 font-weight-medium">{{ formatLimit(selectedSimCard.limit) }}</div>
                <div v-if="selectedSimCard.limit.used !== null" class="text-caption text-medium-emphasis mt-1">
                  Использовано: {{ formatBytes(selectedSimCard.limit.used) }}
                </div>
              </div>
              <div v-if="selectedSimCard.comment" class="info-item mb-3">
                <div class="text-caption text-medium-emphasis">Комментарий</div>
                <div class="text-body-2">{{ selectedSimCard.comment }}</div>
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div v-if="selectedSimCard.groups && selectedSimCard.groups.length > 0">
            <div class="text-subtitle-2 font-weight-bold mb-2">Группы</div>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="group in selectedSimCard.groups"
                :key="group.id"
                size="small"
                variant="outlined"
              >
                {{ group.name }}
              </v-chip>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showViewDialog = false">Закрыть</v-btn>
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
        <v-btn variant="text" @click="snackbar.show = false">Закрыть</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { novaconnectService, type NovaConnectSimCard } from '@/services/novaconnectService';

// Реактивные данные
const loading = ref(false);
const simCards = ref<NovaConnectSimCard[]>([]);
const allSimCards = ref<NovaConnectSimCard[]>([]); // Все SIM-карты для статистики
const totalCount = ref(0);
const searchQuery = ref('');
const filterProfile = ref<string | null>(null);
const filterBlocked = ref<boolean | null>(null);
const showViewDialog = ref(false);
const selectedSimCard = ref<NovaConnectSimCard | null>(null);
const tableKey = ref(0); // Ключ для принудительного обновления таблицы

// Пагинация
const currentPage = ref(1);
const itemsPerPage = ref(25);
const itemsPerPageOptions = [10, 25, 50, 75, 100, 150];

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000,
});

// Опции фильтров
const profileOptions = [
  { title: 'TD', value: 'TD' },
  { title: 'TC', value: 'TC' },
];

const blockedOptions = [
  { title: 'Разблокированные', value: false },
  { title: 'Заблокированные', value: true },
];

// Заголовки таблицы
const headers = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Номер', key: 'number', sortable: true },
  { title: 'ICCID', key: 'iccid', sortable: true },
  { title: 'Профиль', key: 'profile', sortable: true },
  { title: 'Блокировка', key: 'block', sortable: true },
  { title: 'Баланс', key: 'balance', sortable: true },
  { title: 'Лимит', key: 'limit', sortable: false },
  { title: 'Тариф', key: 'tariff', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false, width: '120px' },
];

// Вычисляемые свойства
const isConfigured = computed(() => {
  const token = localStorage.getItem('novaconnect_token');
  return !!token;
});

const stats = computed(() => {
  if (totalCount.value === 0 && allSimCards.value.length === 0) return null;

  // Используем все SIM-карты для статистики, если нет фильтров
  const cardsForStats = hasFilters.value ? simCards.value : allSimCards.value;
  const totalForStats = hasFilters.value ? (totalCount.value || simCards.value.length) : totalCount.value;

  // Подсчитываем статистику по профилям
  const profiles: Record<string, number> = {};
  cardsForStats.forEach(card => {
    const profile = card.profile || 'Unknown';
    profiles[profile] = (profiles[profile] || 0) + 1;
  });

  return {
    total: totalForStats,
    active: cardsForStats.filter(card => card.block === 'n').length,
    blocked: cardsForStats.filter(card => card.block !== 'n').length,
    td: cardsForStats.filter(card => card.profile === 'TD').length,
    tc: cardsForStats.filter(card => card.profile === 'TC').length,
    profiles, // Все профили с количеством
  };
});

// Проверка наличия фильтров
const hasFilters = computed(() => {
  return !!(searchQuery.value || filterProfile.value || filterBlocked.value !== null);
});

// Пагинация
const totalItems = computed(() => simCards.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));
const startRange = computed(() => {
  if (totalItems.value === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});
const endRange = computed(() => {
  const end = currentPage.value * itemsPerPage.value;
  return Math.min(end, totalItems.value);
});
const paginatedSimCards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return simCards.value.slice(start, end);
});

// Методы
const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const loadSimCards = async () => {
  if (!isConfigured.value) {
    return;
  }

  loading.value = true;
  try {
    console.log('🔄 Загрузка всех SIM-карт (без пагинации):', {
      filters: {
        profile: filterProfile.value,
        blocked: filterBlocked.value,
        query: searchQuery.value,
      },
    });
    
    // Формируем фильтры, исключая undefined значения
    const filters: any = {};
    if (filterProfile.value) {
      filters.profile = filterProfile.value;
    }
    if (filterBlocked.value !== null) {
      // API NovaConnect ожидает msu_block для блокировки
      // blocked: true означает заблокированные, false - разблокированные
      filters.msu_block = filterBlocked.value;
    }
    if (searchQuery.value) {
      filters.query = searchQuery.value;
    }
    
    // Загружаем все SIM-карты с параллельной загрузкой (оптимизация)
    const allCards: NovaConnectSimCard[] = [];
    const pageSize = 100;
    let totalCountFromAPI = 0;

    // Сначала получаем первую страницу для определения общего количества
    const firstPageResponse = await novaconnectService.getSimCards({
      page: 0,
      size: pageSize,
      filter: Object.keys(filters).length > 0 ? filters : undefined,
    });

    if (!firstPageResponse || !Array.isArray(firstPageResponse.items)) {
      console.error('❌ Неверный формат ответа от API');
      throw new Error('Неверный формат ответа от API');
    }

    totalCountFromAPI = firstPageResponse.all_count ?? firstPageResponse.count ?? 0;
    allCards.push(...firstPageResponse.items);

    // Вычисляем количество страниц
    const totalPages = Math.ceil(totalCountFromAPI / pageSize);
    
    // Параллельная загрузка остальных страниц (батчами по 10 для оптимизации)
    const batchSize = 10;
    const remainingPages = totalPages - 1;
    
    console.log(`📄 Загружено ${allCards.length} из ${totalCountFromAPI} SIM-карт, загружаем остальные ${remainingPages} страниц параллельно...`);

    for (let batchStart = 1; batchStart < totalPages; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalPages);
      const batchPromises: Promise<any>[] = [];

      // Создаем промисы для батча страниц
      for (let page = batchStart; page < batchEnd; page++) {
        batchPromises.push(
          novaconnectService.getSimCards({
            page: page,
            size: pageSize,
            filter: Object.keys(filters).length > 0 ? filters : undefined,
          })
        );
      }

      // Загружаем батч параллельно
      const batchResponses = await Promise.all(batchPromises);
      
      // Добавляем результаты в общий массив
      batchResponses.forEach(response => {
        if (response && Array.isArray(response.items)) {
          allCards.push(...response.items);
        }
      });

      console.log(`📄 Загружено ${allCards.length} из ${totalCountFromAPI} SIM-карт (${Math.round((allCards.length / totalCountFromAPI) * 100)}%)...`);
    }

    // Устанавливаем все загруженные карты
    simCards.value = allCards.map(item => ({ ...item }));
    totalCount.value = totalCountFromAPI;
    allSimCards.value = allCards;

    console.log('✅ Загружено всех SIM-карт:', {
      всего: totalCountFromAPI,
      загружено: simCards.value.length,
      страниц: totalPages,
    });
  } catch (error: any) {
    console.error('❌ Ошибка загрузки SIM-карт:', error);
    showSnackbar(error.message || 'Ошибка загрузки SIM-карт', 'error');
    // Сбрасываем состояние при ошибке
    simCards.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
};


const handleSearch = () => {
  handleFilterChange();
};

const handleFilterChange = () => {
  allSimCards.value = []; // Очищаем кэш всех карт при изменении фильтров
  currentPage.value = 1; // Сбрасываем на первую страницу при изменении фильтров
  loadSimCards();
};

const handlePageChange = () => {
  // Прокручиваем вверх при смене страницы
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Отслеживаем изменение itemsPerPage и сбрасываем страницу
watch(itemsPerPage, () => {
  currentPage.value = 1;
});


const viewSimCard = (simCard: NovaConnectSimCard) => {
  selectedSimCard.value = simCard;
  showViewDialog.value = true;
};

const blockSimCard = async (simCard: NovaConnectSimCard) => {
  try {
    await novaconnectService.blockSimCard([simCard.id]);
    showSnackbar('SIM-карта заблокирована', 'success');
    await loadSimCards();
  } catch (error: any) {
    console.error('Ошибка блокировки SIM-карты:', error);
    showSnackbar(error.message || 'Ошибка блокировки SIM-карты', 'error');
  }
};

const unblockSimCard = async (simCard: NovaConnectSimCard) => {
  try {
    await novaconnectService.unblockSimCard([simCard.id]);
    showSnackbar('SIM-карта разблокирована', 'success');
    await loadSimCards();
  } catch (error: any) {
    console.error('Ошибка разблокировки SIM-карты:', error);
    showSnackbar(error.message || 'Ошибка разблокировки SIM-карты', 'error');
  }
};

const getBlockColor = (block: string) => {
  const colorMap: Record<string, string> = {
    'n': 'success',
    'u': 'warning',
    'm': 'error',
    'p': 'warning',
    'f': 'error',
    'g': 'error',
  };
  return colorMap[block] || 'grey';
};

const getBlockLabel = (block: string) => {
  const labelMap: Record<string, string> = {
    'n': 'Активна',
    'u': 'Заблокирована пользователем',
    'm': 'Заблокирована по MSU',
    'p': 'Заблокирована по пакету',
    'f': 'Финансовая блокировка',
    'g': 'Заблокирована оператором',
  };
  return labelMap[block] || block;
};

const formatBalance = (balance: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatLimit = (limit: any) => {
  if (limit.type === 'off') return 'Нет лимита';
  if (limit.type === 'month1') return 'Календарный месяц';
  if (limit.type === 'p_lim') return 'Пакет без автопродления';
  if (limit.type === 'p_unlim') return 'Пакет с автопродлением';
  if (limit.value !== null) {
    return `${formatBytes(limit.value)}`;
  }
  return limit.type;
};


// Отслеживаем изменения simCards и принудительно обновляем таблицу
watch([simCards], () => {
  console.log('👀 Watch: simCards изменились', {
    simCards_length: simCards.value.length,
  });
  // Принудительно обновляем ключ таблицы
  tableKey.value++;
  console.log('🔄 Watch: обновлен tableKey:', tableKey.value);
}, { deep: true });

// Lifecycle
onMounted(() => {
  if (isConfigured.value) {
    loadSimCards();
  }
});
</script>

<style scoped>
.sim-cards-list {
  width: 100%;
}

.sim-controls {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
  padding: 16px;
}

.info-item {
  min-height: 40px;
}

/* Единый баннер со статистикой */
.stats-banner {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-surface), 1) 100%);
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.stat-item {
  min-width: 140px;
}

.profiles-section {
  padding-left: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  flex: 1;
}

.profile-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 8px;
  transition: all 0.2s;
}

.profile-badge:hover {
  background: rgba(var(--v-theme-surface-variant), 0.8);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.profile-value {
  font-size: 2.125rem;
  font-weight: 500;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 1);
}

@media (max-width: 960px) {
  .profiles-section {
    padding-left: 0;
    margin-top: 16px;
  }
  
  .stats-banner .v-divider {
    display: none !important;
  }
}

/* Кастомная пагинация */
.compact-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  flex-wrap: wrap;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  margin-top: 8px;
}

.items-select {
  min-width: 80px !important;
  max-width: 120px !important;
  flex-shrink: 0;
}

.range-info {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  flex-shrink: 0;
  min-width: 120px;
  text-align: center;
  font-weight: 500;
  padding: 8px 12px;
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 6px;
}

.page-info {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-weight: 600;
  padding: 4px 12px;
  min-width: 60px;
  text-align: center;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 4px;
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 6px;
}

.nav-controls .v-btn {
  min-width: 32px;
  height: 32px;
}

@media (max-width: 600px) {
  .compact-pagination {
    flex-direction: column;
    align-items: stretch;
  }
  
  .range-info,
  .nav-controls {
    width: 100%;
    justify-content: center;
  }
}
</style>

