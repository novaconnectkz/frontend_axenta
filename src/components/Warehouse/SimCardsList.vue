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
        <!-- Прогресс-бар загрузки статистики -->
        <div v-if="loadingStats" class="mb-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-refresh" size="20" color="primary" class="mr-2 loading-icon" />
            <span class="text-body-2 font-weight-medium">Загрузка статистики...</span>
            <v-spacer />
            <span class="text-body-2 text-medium-emphasis">{{ statsProgress }}%</span>
          </div>
          <v-progress-linear
            :model-value="statsProgress"
            color="primary"
            height="8"
            rounded
            striped
            class="mb-2"
          />
          <div class="text-caption text-medium-emphasis text-center">
            Загружено {{ statsLoadedCount }} из {{ totalCount }} SIM-карт
          </div>
        </div>

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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { novaconnectService, type NovaConnectSimCard } from '@/services/novaconnectService';

// Реактивные данные
const loading = ref(false);
const simCards = ref<NovaConnectSimCard[]>([]); // Только текущая страница
const statsData = ref<NovaConnectSimCard[]>([]); // Данные для статистики (первая страница)
const allProfilesData = ref<NovaConnectSimCard[]>([]); // Данные для получения всех профилей
const totalCount = ref(0);
const loadingStats = ref(false); // Загрузка статистики
const statsLoadedCount = ref(0); // Количество загруженных карт для статистики
const statsFullyLoaded = ref(false); // Флаг полной загрузки статистики
const statsProgress = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((statsLoadedCount.value / totalCount.value) * 100);
});
const searchQuery = ref('');
const filterProfile = ref<string | null>(null);
const filterBlocked = ref<boolean | null>(null);
const showViewDialog = ref(false);
const selectedSimCard = ref<NovaConnectSimCard | null>(null);
const tableKey = ref(0); // Ключ для принудительного обновления таблицы

// Пагинация
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [10, 25, 50, 75, 100, 150];

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000,
});

// Опции фильтров - динамически собираем все уникальные профили из загруженных данных
const profileOptions = computed(() => {
  const profiles = new Set<string>();
  
  // Собираем профили из всех загруженных данных (приоритет - allProfilesData для получения всех профилей)
  [...allProfilesData.value, ...simCards.value, ...statsData.value].forEach(card => {
    if (card.profile) {
      profiles.add(card.profile);
    }
  });
  
  // Преобразуем в массив и сортируем
  return Array.from(profiles)
    .sort()
    .map(profile => ({ title: profile, value: profile }));
});

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
  // Проверяем токен через сервис, который учитывает текущую компанию
  // Сервис сам загружает настройки из БД с учетом текущей компании
  // Для проверки просто пытаемся получить токен из сервиса
  // Но так как это computed, мы не можем вызывать async методы
  // Поэтому проверяем наличие токена в localStorage с привязкой к компании
  try {
    const companyStr = localStorage.getItem('axenta_company');
    if (!companyStr) return false;
    const company = JSON.parse(companyStr);
    const companyId = company?.id;
    if (!companyId) return false;
    
    // Проверяем токен с привязкой к компании
    const tokenKey = `novaconnect_token_${companyId}`;
    const token = localStorage.getItem(tokenKey);
    return !!token;
  } catch {
    return false;
  }
});

const stats = computed(() => {
  if (totalCount.value === 0 && statsData.value.length === 0) return null;

  // Используем данные для статистики
  // Если нет фильтров - используем все загруженные данные для статистики (statsData содержит все карты)
  // Если есть фильтры - используем только текущую страницу
  const cardsForStats = hasFilters.value ? simCards.value : statsData.value;
  const totalForStats = totalCount.value;
  
  // Проверяем, загружены ли все данные (для точной статистики)
  const allDataLoaded = !hasFilters.value && statsData.value.length === totalForStats && totalForStats > 0;

  // Подсчитываем статистику по профилям из ВСЕХ загруженных данных
  const profiles: Record<string, number> = {};
  cardsForStats.forEach(card => {
    const profile = card.profile || 'Unknown';
    profiles[profile] = (profiles[profile] || 0) + 1;
  });

  // Точный подсчет активных и заблокированных из всех загруженных данных
  const activeCount = cardsForStats.filter(card => card.block === 'n').length;
  const blockedCount = cardsForStats.filter(card => card.block !== 'n').length;
  
  return {
    total: totalForStats,
    // Всегда используем точный подсчет из загруженных данных
    // Когда все данные загружены - статистика будет точной
    active: activeCount,
    blocked: blockedCount,
    td: cardsForStats.filter(card => card.profile === 'TD').length,
    tc: cardsForStats.filter(card => card.profile === 'TC').length,
    profiles, // Все профили с количеством из всех загруженных данных
  };
});

// Проверка наличия фильтров
const hasFilters = computed(() => {
  return !!(searchQuery.value || filterProfile.value || filterBlocked.value !== null);
});

// Пагинация (серверная)
const totalItems = computed(() => totalCount.value);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));
const startRange = computed(() => {
  if (totalItems.value === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});
const endRange = computed(() => {
  const end = currentPage.value * itemsPerPage.value;
  return Math.min(end, totalItems.value);
});
// Теперь simCards уже содержит только текущую страницу
const paginatedSimCards = computed(() => simCards.value);

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
    // Формируем фильтры, исключая undefined значения
    const filters: any = {};
    if (filterProfile.value) {
      filters.profile = filterProfile.value;
    }
    if (filterBlocked.value !== null) {
      // API NovaConnect ожидает msu_block для блокировки
      filters.msu_block = filterBlocked.value;
    }
    if (searchQuery.value) {
      filters.query = searchQuery.value;
    }
    
    // Серверная пагинация: загружаем только текущую страницу
    // API использует 0-based индексацию, а мы используем 1-based для UI
    const apiPage = currentPage.value - 1;
    
    console.log('🔄 Загрузка SIM-карт (серверная пагинация):', {
      page: currentPage.value,
      itemsPerPage: itemsPerPage.value,
      filters: {
        profile: filterProfile.value,
        blocked: filterBlocked.value,
        query: searchQuery.value,
      },
    });

    const response = await novaconnectService.getSimCards({
      page: apiPage,
      size: itemsPerPage.value,
      filter: Object.keys(filters).length > 0 ? filters : undefined,
    });

    if (!response || !Array.isArray(response.items)) {
      console.error('❌ Неверный формат ответа от API');
      throw new Error('Неверный формат ответа от API');
    }

    // Устанавливаем загруженные карты (только текущая страница)
    simCards.value = response.items.map(item => ({ ...item }));
    totalCount.value = response.all_count ?? response.count ?? 0;
    
    // Принудительно обновляем таблицу
    tableKey.value++;

    // Для статистики загружаем все данные асинхронно (если нет фильтров и статистика еще не загружена)
    if (!hasFilters.value && currentPage.value === 1 && !statsFullyLoaded.value) {
      // Используем текущие данные для быстрого отображения
      statsData.value = response.items.map(item => ({ ...item }));
      
      // Загружаем ВСЕ данные для точной статистики асинхронно (не блокирует UI)
      // Загружаем данные порциями, чтобы избежать таймаутов
      const loadAllStatsData = async () => {
        const allCards: NovaConnectSimCard[] = [];
        const pageSize = 1000; // Загружаем по 1000 карт за раз
        const totalPages = Math.ceil((totalCount.value || 0) / pageSize);
        
        loadingStats.value = true;
        statsLoadedCount.value = response.items.length; // Уже загружено 10 карт
        
        try {
          for (let page = 0; page < totalPages; page++) {
            const response = await novaconnectService.getSimCards({
              page: page,
              size: pageSize,
              filter: undefined,
            });
            
            if (response && Array.isArray(response.items)) {
              allCards.push(...response.items);
              statsLoadedCount.value = allCards.length;
              console.log(`📊 Загружено для статистики: ${allCards.length} из ${totalCount.value}`);
              
              // Обновляем статистику по мере загрузки
              statsData.value = allCards.map(item => ({ ...item }));
            }
          }
          
          // Помечаем статистику как полностью загруженную
          statsFullyLoaded.value = true;
          console.log('✅ Загружены все данные для статистики:', statsData.value.length);
        } catch (err) {
          console.warn('Не удалось загрузить все данные для статистики:', err);
          // Используем уже загруженные данные
        } finally {
          loadingStats.value = false;
        }
      };
      
      // Запускаем загрузку в фоне
      loadAllStatsData();
      
      // Загружаем данные для получения всех уникальных профилей (если еще не загружены)
      if (allProfilesData.value.length === 0) {
        novaconnectService.getSimCards({
          page: 0,
          size: 200, // Загружаем 200 карт для получения всех профилей
          filter: undefined,
        }).then(profilesResponse => {
          if (profilesResponse && Array.isArray(profilesResponse.items)) {
            allProfilesData.value = profilesResponse.items.map(item => ({ ...item }));
          }
        }).catch(err => {
          console.warn('Не удалось загрузить данные для получения всех профилей:', err);
        });
      }
    }

    console.log('✅ Загружена страница SIM-карт:', {
      страница: currentPage.value,
      загружено: simCards.value.length,
      всего: totalCount.value,
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
  statsData.value = []; // Очищаем данные для статистики при изменении фильтров
  statsFullyLoaded.value = false; // Сбрасываем флаг загрузки статистики при изменении фильтров
  statsLoadedCount.value = 0; // Сбрасываем счетчик загруженных карт
  // Не очищаем allProfilesData - оставляем для отображения всех профилей в фильтре
  currentPage.value = 1; // Сбрасываем на первую страницу при изменении фильтров
  loadSimCards();
};

const handlePageChange = () => {
  // Загружаем новую страницу при смене страницы
  loadSimCards();
  // Прокручиваем вверх при смене страницы
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Отслеживаем изменение itemsPerPage и перезагружаем данные
watch(itemsPerPage, () => {
  currentPage.value = 1;
  loadSimCards();
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

// Отслеживаем изменения компании и перезагружаем настройки
const getCurrentCompanyId = (): number | null => {
  try {
    const companyStr = localStorage.getItem('axenta_company');
    if (!companyStr) return null;
    const company = JSON.parse(companyStr);
    return company?.id || null;
  } catch {
    return null;
  }
};

let currentCompanyId = ref<number | null>(getCurrentCompanyId());
let checkInterval: ReturnType<typeof setInterval> | null = null;

// Слушаем изменения localStorage для отслеживания смены компании
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === 'axenta_company') {
    const newCompanyId = getCurrentCompanyId();
    if (newCompanyId !== currentCompanyId.value) {
      console.log('🔄 Компания изменилась, перезагружаем настройки NovaConnect');
      currentCompanyId.value = newCompanyId;
      novaconnectService.reloadSettings().then(() => {
        if (isConfigured.value) {
          loadSimCards();
        }
      });
    }
  }
};

// Lifecycle
onMounted(() => {
  currentCompanyId.value = getCurrentCompanyId();
  
  // Слушаем изменения localStorage
  window.addEventListener('storage', handleStorageChange);
  
  // Также проверяем периодически (на случай, если localStorage изменился в том же окне)
  checkInterval = setInterval(() => {
    const newCompanyId = getCurrentCompanyId();
    if (newCompanyId !== currentCompanyId.value) {
      console.log('🔄 Компания изменилась (проверка), перезагружаем настройки NovaConnect');
      currentCompanyId.value = newCompanyId;
      novaconnectService.reloadSettings().then(() => {
        if (isConfigured.value) {
          loadSimCards();
        }
      });
    }
  }, 2000); // Проверяем каждые 2 секунды
  
  if (isConfigured.value) {
    loadSimCards();
  }
});

onUnmounted(() => {
  // Очищаем слушатель событий
  window.removeEventListener('storage', handleStorageChange);
  
  // Очищаем интервал
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
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

/* Анимация загрузки */
.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

