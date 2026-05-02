<template>
  <div class="accounts-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-office-building-outline" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Учетные записи</h1>
          <p class="page-subtitle">Управление учетными записями и организациями</p>
        </div>
      </div>
    </div>

    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <AppleCard v-bind="props" :title="totalStats.total.toString()" subtitle="Доступных записей"
              icon="mdi-account-group-outline" icon-color="primary" variant="outlined" class="stat-card" />
          </template>
          <div class="stats-tooltip">
            <div><strong>Axenta:</strong> {{ stats.total }}</div>
            <div v-if="wialonStats.wl.total > 0"><strong>WL:</strong> {{ wialonStats.wl.total }}</div>
            <div v-if="wialonStats.wh.total > 0"><strong>WH:</strong> {{ wialonStats.wh.total }}</div>
          </div>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <AppleCard v-bind="props" :title="totalStats.active.toString()" subtitle="Активных"
              icon="mdi-account-check-outline" icon-color="success" variant="outlined" class="stat-card" />
          </template>
          <div class="stats-tooltip">
            <div><strong>Axenta:</strong> {{ stats.active }}</div>
            <div v-if="wialonStats.wl.active > 0"><strong>WL:</strong> {{ wialonStats.wl.active }}</div>
            <div v-if="wialonStats.wh.active > 0"><strong>WH:</strong> {{ wialonStats.wh.active }}</div>
          </div>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <AppleCard v-bind="props" :title="(stats.clients + wialonStats.clients).toString()" subtitle="Клиентов"
              icon="mdi-account-outline" icon-color="warning" variant="outlined" class="stat-card" />
          </template>
          <div class="stats-tooltip">
            <div><strong>Axenta:</strong> {{ stats.clients }}</div>
            <div v-if="wialonStats.wl.clients > 0"><strong>WL:</strong> {{ wialonStats.wl.clients }}</div>
            <div v-if="wialonStats.wh.clients > 0"><strong>WH:</strong> {{ wialonStats.wh.clients }}</div>
          </div>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <AppleCard v-bind="props" :title="(stats.partners + wialonStats.dealers).toString()"
              subtitle="Партнеров/Дилеров" icon="mdi-handshake-outline" icon-color="purple" variant="outlined"
              class="stat-card" />
          </template>
          <div class="stats-tooltip">
            <div><strong>Axenta:</strong> {{ stats.partners }}</div>
            <div v-if="wialonStats.wl.dealers > 0"><strong>WL (Дилеры):</strong> {{ wialonStats.wl.dealers }}</div>
            <div v-if="wialonStats.wh.dealers > 0"><strong>WH (Дилеры):</strong> {{ wialonStats.wh.dealers }}</div>
          </div>
        </v-tooltip>
      </div>
    </div>


    <!-- Фильтры -->
    <AppleCard class="filters-card" variant="outlined">
      <div class="filters-content">
        <div class="filters-row">
          <div class="filter-item filter-search">
            <v-text-field v-model="searchQuery"
              placeholder="Поиск по названию компании (через запятую для нескольких)..."
              prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" clearable
              @input="debouncedSearch" class="search-field" />
          </div>
          <div class="filter-item">
            <v-select v-model="filters.type" label="Тип аккаунта" :items="accountTypes" variant="outlined"
              density="comfortable" @update:model-value="onTypeFilterChange" />
          </div>
          <div class="filter-item">
            <v-select v-model="filters.is_active" label="Статус" :items="statusOptions" variant="outlined"
              density="comfortable" @update:model-value="onStatusFilterChange" />
          </div>
          <div class="filter-item">
            <v-select v-model="filters.source" label="Система" :items="sourceOptions" variant="outlined"
              density="comfortable" @update:model-value="onSourceFilterChange" />
          </div>
          <div class="filter-item">
            <v-autocomplete v-model="selectedParent" label="Родительский аккаунт" :items="parentAccountOptions"
              variant="outlined" density="comfortable" clearable no-data-text="Нет данных"
              @update:model-value="onParentChange" />
          </div>

          <div class="filter-clear">
            <v-btn v-show="hasAnyActiveFilters" icon="mdi-filter-off-outline" variant="flat" color="warning"
              density="comfortable" @click="resetFilters"
              :title="hasAnyActiveFilters ? 'Сбросить активные фильтры' : 'Сбросить фильтры'"
              :class="{ 'filter-clear-active': hasAnyActiveFilters }">
              <v-badge :content="activeFiltersCount" color="white" text-color="warning" inline />
            </v-btn>
          </div>
        </div>
      </div>
    </AppleCard>

    <!-- Чипы с найденными компаниями (при множественном поиске) -->
    <div v-if="isMultipleCompanySearch && companySearchTermsArray.length > 0" class="search-chips-row mb-3">
      <span class="text-caption text-grey mr-2">Найдено по запросу:</span>
      <!-- Чипы с реальными индексами -->
      <template v-for="(term, realIndex) in companySearchTermsArray" :key="realIndex">
        <v-chip v-if="showAllSearchChips || realIndex < 3" size="small" color="primary" variant="outlined" class="mr-1"
          closable @click:close="removeCompanySearchTerm(realIndex)">
          {{ term }}
        </v-chip>
      </template>
      <!-- Кнопка показать/скрыть остальные -->
      <v-chip v-if="companySearchTermsArray.length > 3" size="small" color="grey" variant="tonal" class="mr-1"
        @click="showAllSearchChips = !showAllSearchChips">
        <v-icon size="14" class="mr-1">{{ showAllSearchChips ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        {{ showAllSearchChips ? 'Скрыть' : `Ещё +${companySearchTermsArray.length - 3}` }}
      </v-chip>
    </div>

    <!-- Таблица учетных записей -->
    <v-card class="accounts-table-card">
      <!-- Индикатор фонового обновления Wialon данных из кэша -->
      <v-progress-linear v-if="isWialonRefreshing" indeterminate color="primary" height="3"
        class="wialon-refresh-indicator" />

      <v-data-table-virtual :headers="headers" :items="accountsWithNumbers" :loading="isLoading"
        :sort-by="[{ key: sortBy, order: sortOrder }]" @update:sort-by="onSortChange" :must-sort="false"
        :multi-sort="false" class="accounts-table" :class="{ 'updating': isBackgroundLoading }"
        loading-text="Загрузка учетных записей..." no-data-text="Учетные записи не найдены" height="600"
        item-height="54">
        <!-- Колонка "№" -->
        <template #item.rowNumber="{ item }">
          <span class="row-number">{{ item.rowNumber }}</span>
        </template>

        <!-- Колонка "ID" -->
        <template #item.id="{ item }">
          <v-tooltip location="top" class="id-tooltip" :close-on-content-click="false" :close-on-back="false"
            :close-on-click="false" :close-on-hover="false" persistent no-click-animation
            @update:model-value="onTooltipOpen">
            <template #activator="{ props }">
              <span class="id-minimal" v-bind="props">
                {{ item.id }}
              </span>
            </template>
            <div class="id-popup draggable-popup" @mouseenter="keepOpen" @mouseleave="keepOpen">
              <div class="popup-header draggable-header">
                <div class="popup-icon">
                  <v-icon>mdi-domain</v-icon>
                </div>
                <div class="popup-title">{{ item.name }}</div>
                <v-btn icon="mdi-close" size="small" variant="text" class="close-btn" @click="closePopup" />
              </div>
              <div class="popup-content">
                <div class="popup-field">
                  <span class="field-label">ID учетной записи</span>
                  <span class="field-value">{{ item.id }}</span>
                </div>
                <div class="popup-field">
                  <span class="field-label">ID администратора</span>
                  <span class="field-value">{{ item.adminId }}</span>
                </div>
                <div class="popup-field">
                  <span class="field-label">Тип компании</span>
                  <span class="field-value">{{ item.type === 'partner' ? 'Партнер' : 'Клиент' }}</span>
                </div>
                <div class="popup-field">
                  <span class="field-label">Статус</span>
                  <span class="field-value" :class="{ 'text-success': item.isActive, 'text-error': !item.isActive }">
                    {{ item.isActive ? 'Активен' : 'Заблокирован' }}
                  </span>
                </div>
                <div v-if="item.adminFullname" class="popup-field">
                  <span class="field-label">Администратор</span>
                  <span class="field-value">{{ item.adminFullname }}</span>
                </div>
                <div v-if="item.comment" class="popup-field">
                  <span class="field-label">Комментарий</span>
                  <span class="field-value">{{ item.comment }}</span>
                </div>
                <div v-if="item.hierarchy" class="popup-field hierarchy-field">
                  <span class="field-label">Иерархия</span>
                  <span class="field-value hierarchy-value">{{ item.hierarchy }}</span>
                </div>
                <div v-if="item.blockingDatetime" class="popup-field">
                  <span class="field-label">Дата блокировки</span>
                  <span class="field-value">{{ formatDateShort(item.blockingDatetime) }}</span>
                </div>
                <div v-if="item.daysBeforeBlocking !== null" class="popup-field">
                  <span class="field-label">Дней до блокировки</span>
                  <span class="field-value"
                    :class="{ 'text-error': item.daysBeforeBlocking <= 3, 'text-warning': item.daysBeforeBlocking > 3 && item.daysBeforeBlocking <= 7 }">
                    {{ item.daysBeforeBlocking }}
                  </span>
                </div>
                <div class="popup-field">
                  <span class="field-label">Дата создания</span>
                  <span class="field-value">{{ formatDateShort(item.creationDatetime) }}</span>
                </div>
              </div>
            </div>
          </v-tooltip>
        </template>

        <!-- Колонка "Компания" -->
        <template #item.name="{ item }">
          <div class="company-name-compact">
            {{ item.name }}
          </div>
        </template>

        <!-- Колонка "Тип" -->
        <template #item.type="{ item }">
          <span class="type-minimal" :class="{
            'type-partner': item.type === 'partner',
            'type-client': item.type !== 'partner'
          }">
            <!-- Тип компании: Партнер/Клиент -->
            {{ item.type === 'partner' ? 'Партнер' : 'Клиент' }}
          </span>
        </template>




        <!-- Колонка "Объекты" -->
        <template #item.objectsTotal="{ item }">
          <v-tooltip location="top" class="objects-tooltip" :close-on-content-click="false" :close-on-back="false"
            :close-on-click="false" :close-on-hover="false" persistent no-click-animation
            @update:model-value="onTooltipOpen">
            <template #activator="{ props }">
              <div class="objects-compact" v-bind="props">
                <!-- Загрузка статистики -->
                <div v-if="item.objectsTotal === -1" class="objects-loading">
                  <v-progress-circular indeterminate size="16" width="2" color="primary" />
                </div>
                <!-- Нет объектов -->
                <span v-else-if="!item.objectsTotal && !item.objectsActive && !item.objectsDeleted" class="no-objects">
                  Нет объектов
                </span>
                <!-- Отображение статистики -->
                <div v-else class="objects-display">
                  <span class="objects-active">{{ item.objectsActive || 0 }}</span>
                  <span class="objects-separator">/</span>
                  <span class="objects-total">{{ item.objectsTotal || 0 }}</span>
                  <span v-if="item.objectsDeleted > 0" class="objects-deleted">
                    <span class="objects-separator">/</span>
                    <span class="deleted-count">{{ item.objectsDeleted }}</span>
                  </span>
                </div>
              </div>
            </template>
            <div class="objects-popup draggable-popup" @mouseenter="keepOpen" @mouseleave="keepOpen">
              <div class="popup-header draggable-header">
                <div class="popup-icon">
                  <v-icon>mdi-radar</v-icon>
                </div>
                <div class="popup-title">Объекты мониторинга</div>
                <v-btn icon="mdi-close" size="small" variant="text" class="close-btn" @click="closePopup" />
              </div>
              <div class="popup-content">
                <div class="popup-field">
                  <span class="field-label">Активные объекты</span>
                  <span class="field-value">{{ item.objectsActive || 0 }}</span>
                </div>
                <div class="popup-field">
                  <span class="field-label">Всего объектов</span>
                  <span class="field-value">{{ item.objectsTotal || 0 }}</span>
                </div>
                <div v-if="(item.objectsDeactivated ?? 0) > 0" class="popup-field">
                  <span class="field-label">Деактивированные</span>
                  <span class="field-value deactivated">{{ item.objectsDeactivated }}</span>
                </div>
                <div v-if="item.objectsDeleted > 0" class="popup-field">
                  <span class="field-label">Удаленные</span>
                  <span class="field-value">{{ item.objectsDeleted }}</span>
                </div>
              </div>
            </div>
          </v-tooltip>
        </template>

        <!-- Колонка "Статус" -->
        <template #item.isActive="{ item }">
          <v-tooltip location="top" :text="item.isActive ? 'Активен' : 'Заблокирован'">
            <template #activator="{ props }">
              <v-icon v-bind="props" :icon="item.isActive ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'"
                :color="item.isActive ? 'success' : 'error'" size="24" class="status-icon" />
            </template>
          </v-tooltip>
        </template>

        <!-- Колонка "Источник" -->
        <template #item.source="{ item }">
          <v-chip :color="getSourceColor(item.source)" size="small" variant="tonal">
            <v-icon start size="16">
              {{ getSourceIcon(item.source) }}
            </v-icon>
            {{ item.source === 'axenta' ? 'Axenta' : item.source }}
          </v-chip>
        </template>

        <!-- Колонка "Блокировка" -->
        <template #item.blockingInfo="{ item }">
          <span v-if="item.blockingDatetime" class="blocking-minimal" :class="{
            'blocking-critical': item.daysBeforeBlocking !== null && item.daysBeforeBlocking <= 3,
            'blocking-warning': item.daysBeforeBlocking !== null && item.daysBeforeBlocking > 3 && item.daysBeforeBlocking <= 7,
            'blocking-normal': item.daysBeforeBlocking !== null && item.daysBeforeBlocking > 7
          }">
            {{ formatDateShort(item.blockingDatetime) }}
          </span>
          <span v-else class="blocking-minimal blocking-none">
            Без ограничений
          </span>
        </template>

        <!-- Колонка "Дата создания" -->
        <template #item.creationDatetime="{ item }">
          <span class="creation-minimal">
            {{ formatDateShort(item.creationDatetime) }}
          </span>
        </template>

        <!-- Колонка "Действия" -->
        <template #item.actions="{ item }">
          <div class="actions-row">
            <!-- Иконки "Просмотр" и "Редактировать" удалены -->
            <v-btn :icon="item.isActive ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'" variant="text"
              size="small" :color="item.isActive ? 'warning' : 'success'" @click="toggleAccountStatus(item)"
              :title="item.isActive ? 'Деактивировать' : 'Активировать'" />
            <v-menu>
              <template #activator="{ props }">
                <v-btn icon="mdi-dots-vertical" variant="text" size="x-small" v-bind="props"
                  title="Дополнительные действия" />
              </template>
              <v-list density="compact">
                <!-- Пункт "Войти в мониторинг" - отображается для всех типов аккаунтов -->
                <v-list-item prepend-icon="mdi-monitor-dashboard" title="Войти в мониторинг"
                  @click="loginToMonitoring(item)" />

                <!-- Пункт "Войти в CMS" - отображается для партнеров Axenta и дилеров Wialon -->
                <v-list-item v-if="item.type === 'partner' || item.dealer_rights"
                  prepend-icon="mdi-cog-transfer-outline" title="Войти в CMS" @click="loginToCms(item)" />

                <v-list-item v-if="item.source === 'axenta' || !item.source"
                  prepend-icon="mdi-account-arrow-right-outline" title="Переместить учетную запись"
                  @click="moveAccount(item)" />
                <v-divider />
                <v-list-item prepend-icon="mdi-delete-outline" title="Удалить учетную запись"
                  @click="deleteAccount(item)" class="text-error" />
              </v-list>
            </v-menu>
          </div>
        </template>
      </v-data-table-virtual>

      <!-- Lazy Loading: Индикатор догрузки Wialon -->
      <v-alert v-if="isWialonLoading && !isAxentaLoading" type="info" variant="tonal" density="compact"
        class="mt-2 mb-0 wialon-loading-alert">
        <div class="d-flex align-center">
          <v-progress-circular indeterminate size="18" width="2" class="mr-2" />
          <span>Загрузка аккаунтов из Wialon...</span>
        </div>
      </v-alert>

      <!-- Компактная пагинация справа -->
      <div class="compact-pagination">
        <v-select v-model="itemsPerPage" :items="itemsPerPageOptions" variant="outlined" density="compact"
          class="items-select" @update:model-value="onItemsPerPageChange" hide-details />
        <span class="range-info">{{ getDisplayRange() }} из {{ effectiveTotalItems }}</span>
        <div class="nav-controls">
          <v-btn icon="mdi-page-first" variant="text" size="x-small" :disabled="currentPage === 1"
            @click="goToFirstPage" title="Первая" />
          <v-btn icon="mdi-chevron-left" variant="text" size="x-small" :disabled="currentPage === 1"
            @click="goToPrevPage" title="Предыдущая" />
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <v-btn icon="mdi-chevron-right" variant="text" size="x-small" :disabled="currentPage === totalPages"
            @click="goToNextPage" title="Следующая" />
          <v-btn icon="mdi-page-last" variant="text" size="x-small" :disabled="currentPage === totalPages"
            @click="goToLastPage" title="Последняя" />
        </div>
      </div>
    </v-card>

    <!-- Диалог просмотра аккаунта -->
    <v-dialog v-model="viewDialog" max-width="800">
      <v-card v-if="selectedAccount">
        <v-card-title>
          <span class="text-h5">Информация об аккаунте</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="viewDialog = false" />
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field label="ID" :model-value="selectedAccount.id" readonly variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field label="Название" :model-value="selectedAccount.name" readonly variant="outlined" />
            </v-col>
            <v-col cols="12">
              <v-text-field label="Иерархия" :model-value="selectedAccount.hierarchy" readonly variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field label="Родительский аккаунт" :model-value="selectedAccount.parentAccountName" readonly
                variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field label="Администратор" :model-value="selectedAccount.adminFullname" readonly
                variant="outlined" />
            </v-col>
            <v-col cols="12">
              <v-textarea label="Комментарий" :model-value="selectedAccount.comment || 'Нет комментария'" readonly
                variant="outlined" rows="3" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>


    <!-- Snackbar для уведомлений -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="bottom right">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="deleteDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h5 text-center pa-4">
          <v-icon icon="mdi-alert-circle" color="error" size="32" class="mr-2" />
          Подтверждение удаления
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="mb-4">
            <p class="text-body-1 mb-2">
              Вы действительно хотите удалить учетную запись?
            </p>
            <div class="account-info pa-3" style="background-color: #f5f5f5; border-radius: 8px;">
              <div class="text-subtitle-1 font-weight-bold">{{ accountToDelete?.name }}</div>
              <div class="text-caption text-grey-darken-1">ID: {{ accountToDelete?.id }}</div>
              <div class="text-caption text-grey-darken-1">
                Тип: {{ accountToDelete?.type === 'partner' ? 'Партнер' : 'Клиент' }}
              </div>
            </div>
          </div>

          <div class="mb-4">
            <p class="text-body-2 text-grey-darken-1 mb-2">
              <strong>Внимание!</strong> Это действие нельзя отменить. Все данные учетной записи будут безвозвратно
              удалены.
            </p>
          </div>

          <div class="mb-4">
            <p class="text-body-2 mb-2">
              Для подтверждения введите ID учетной записи:
            </p>
            <v-text-field v-model="deleteConfirmationId" label="ID учетной записи"
              placeholder="Введите ID для подтверждения" variant="outlined" density="comfortable" :disabled="isDeleting"
              @keyup.enter="confirmDelete" />
          </div>

          <!-- Выбор причины для Wialon Hosting -->
          <div v-if="accountToDelete && (accountToDelete.source || '').toUpperCase().startsWith('WH')" class="mb-4">
            <p class="text-body-2 mb-2">
              <v-icon icon="mdi-information" color="info" size="16" class="mr-1" />
              Для Wialon Hosting необходимо указать причину удаления:
            </p>
            <v-select v-model="deleteReasonKey" :items="wialonDeleteReasons" item-title="label" item-value="key"
              label="Причина удаления" variant="outlined" density="comfortable" :disabled="isDeleting" clearable />
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="grey" variant="text" @click="cancelDelete" :disabled="isDeleting">
            Отмена
          </v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete" :loading="isDeleting"
            :disabled="deleteConfirmationId !== accountToDelete?.id?.toString()">
            <v-icon icon="mdi-delete" class="mr-1" />
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог перемещения учетной записи -->
    <v-dialog v-model="moveDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="text-h5 text-center pa-4">
          <v-icon icon="mdi-swap-horizontal" color="primary" size="32" class="mr-2" />
          Переместить учетную запись
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="mb-4">
            <p class="text-body-1 mb-2">
              Выберите партнера, к которому будет перемещена учетная запись:
            </p>
            <div class="account-info pa-3" style="background-color: #f5f5f5; border-radius: 8px;">
              <div class="text-subtitle-1 font-weight-bold">{{ accountToMove?.name }}</div>
              <div class="text-caption text-grey-darken-1">ID: {{ accountToMove?.id }}</div>
              <div class="text-caption text-grey-darken-1">
                Тип: {{ accountToMove?.type === 'partner' ? 'Партнер' : 'Клиент' }}
              </div>
            </div>
          </div>

          <div class="mb-4">
            <p class="text-body-2 mb-2">
              <strong>Выберите целевого партнера:</strong>
            </p>
            <v-select v-model="selectedTargetPartner" :items="partnerOptions" item-title="name" item-value="id"
              label="Партнер" placeholder="Выберите партнера" variant="outlined" density="comfortable"
              :disabled="isMoving" :loading="loadingPartners" clearable>
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #title>
                    <div class="d-flex align-center">
                      <span class="font-weight-bold">{{ item.raw.name }}</span>
                      <v-chip size="x-small" color="primary" class="ml-2">
                        ID: {{ item.raw.id }}
                      </v-chip>
                    </div>
                  </template>
                  <template #subtitle>
                    <span class="text-caption">{{ item.raw.type === 'partner' ? 'Партнер' : 'Клиент' }}</span>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </div>

          <div class="mb-4">
            <p class="text-body-2 text-grey-darken-1 mb-2">
              <strong>Внимание!</strong> При перемещении учетной записи все её данные (объекты, пользователи, настройки)
              будут переданы выбранному партнеру. Это действие нельзя отменить.
            </p>
          </div>

          <div class="mb-4">
            <p class="text-body-2 mb-2">
              Для подтверждения введите ID учетной записи:
            </p>
            <v-text-field v-model="moveConfirmationId" label="ID учетной записи"
              placeholder="Введите ID для подтверждения" variant="outlined" density="comfortable" :disabled="isMoving"
              @keyup.enter="confirmMove" />
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="grey" variant="text" @click="cancelMove" :disabled="isMoving">
            Отмена
          </v-btn>
          <v-btn color="primary" variant="flat" @click="confirmMove" :loading="isMoving"
            :disabled="!selectedTargetPartner || moveConfirmationId !== accountToMove?.id?.toString()">
            <v-icon icon="mdi-swap-horizontal" class="mr-1" />
            Переместить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- FAB меню -->
    <AppleFAB icon="mdi-plus" :items="fabMenuItems" @item-click="handleFabAction" />
  </div>
</template>

<script setup lang="ts">
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleFAB from '@/components/Apple/AppleFAB.vue';
import accountsService, { type Account, type AccountsFilters } from '@/services/accountsService';
import settingsService from '@/services/settingsService';
import { wialonCacheService, type CachedWialonAccount } from '@/services/wialonCacheService';
import ExcelJS from 'exceljs';
import { debounce } from 'lodash-es';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Router
const router = useRouter();
const route = useRoute();

// Реактивные данные
const accounts = ref<Account[]>([]);
const isLoading = ref(false);
const isBackgroundLoading = ref(false); // Для фонового обновления
const isAxentaLoading = ref(false);     // Загрузка данных Axenta (Lazy Loading)
const isWialonLoading = ref(false);     // Загрузка данных Wialon (Lazy Loading)
const isWialonRefreshing = ref(false);  // Фоновое обновление данных Wialon (из кэша в актуальные)
const isWialonFromCache = ref(false);   // Данные загружены из кэша
const wialonLoadError = ref<string | null>(null); // Ошибка загрузки Wialon

// Lazy Loading статистики объектов
const objectsStatsLoaded = ref<Set<number>>(new Set()); // ID аккаунтов с загруженной статистикой
const isLoadingObjectsStats = ref(false); // Флаг загрузки статистики
const wialonConnectionIds = ref<number[]>([]); // Connection IDs для lazy loading статистики
const searchQuery = ref('');
const showAllSearchChips = ref(false); // Показать все чипы поиска
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0); // Динамическое значение из API
const lastUpdateTime = ref<Date | null>(null);

// Кэш для всех записей (для клиентской фильтрации)
const allAccountsCache = ref<Account[]>([]);
const cacheTimestamp = ref<Date | null>(null);
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Параметры сортировки
const sortBy = ref<string>('creationDatetime');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Автообновление
const autoRefreshInterval = ref<NodeJS.Timeout | null>(null);
const AUTO_REFRESH_DELAY = 60000; // 1 минута

// Статистика
const stats = ref({
  total: 0,
  active: 0,
  blocked: 0,
  clients: 0,
  partners: 0,
});

// Объединённая статистика (Axenta + Wialon)
const totalStats = computed(() => ({
  total: stats.value.total + wialonStats.value.total,
  active: stats.value.active + wialonStats.value.active,
  blocked: stats.value.blocked + wialonStats.value.blocked,
}));

// Фильтры
const filters = ref<AccountsFilters & { source?: string | null }>({
  type: null,
  is_active: null,
  source: null, // Фильтр по системе: axenta, wialon, или null (все)
});

// Фильтр по родительскому аккаунту - по умолчанию "Все родители"
const selectedParent = ref<string>('');
// Список родительских аккаунтов (динамически загружается из API)
const parentAccountOptions = ref<Array<{ title: string; value: string }>>([
  { title: 'Все родители', value: '' }
]);

// Диалоги
const viewDialog = ref(false);
const selectedAccount = ref<Account | null>(null);

// Диалог подтверждения удаления
const deleteDialog = ref(false);
const accountToDelete = ref<Account | null>(null);
const deleteConfirmationId = ref('');
const isDeleting = ref(false);
const exporting = ref(false); // Флаг экспорта в Excel
const deleteReasonKey = ref<string | null>(null); // Причина удаления для WH

// FAB Menu Items - элементы плавающего меню действий
const fabMenuItems = [
  {
    id: 'create',
    label: 'Создать аккаунт',
    icon: 'mdi-plus',
    color: 'success' as const,
    action: () => goToCreateAccount()
  },
  {
    id: 'export',
    label: 'Экспорт в Excel',
    icon: 'mdi-file-excel-outline',
    color: 'primary' as const,
    action: () => exportAccounts()
  }
];

// Обработчик клика на элементе FAB меню
const handleFabAction = (item: { id?: string; action?: () => void }) => {
  // Действие выполняется автоматически через свойство action элемента
  console.log('FAB action:', item.id);
};

// Причины удаления для Wialon Hosting
const wialonDeleteReasons = [
  { key: 'end-user_stopped_payments_or_went_out_of_business', label: 'Прекращение оплаты или закрытие бизнеса' },
  { key: 'contract_expiration', label: 'Истечение срока договора' },
  { key: 'better_terms_from_another_platform', label: 'Лучшие условия от другой платформы' },
  { key: 'better_terms_from_another_provider', label: 'Лучшие условия от другого поставщика' },
  { key: 'disagreement_on_pricing', label: 'Разногласия по ценам' },
  { key: 'poor_service', label: 'Неудовлетворительный сервис' },
  { key: 'poor_technical_support_quality', label: 'Недостаточное качество техподдержки' },
  { key: 'seasonal_units_deletion', label: 'Удаление сезонных объектов' },
  { key: 'other_reasons_partner', label: 'Другие причины' },
];

// Диалог перемещения учетной записи
const moveDialog = ref(false);
const accountToMove = ref<Account | null>(null);
const selectedTargetPartner = ref<number | null>(null);
const moveConfirmationId = ref('');
const isMoving = ref(false);
const loadingPartners = ref(false);
const partnerOptions = ref<Account[]>([]);


// Snackbar для уведомлений
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 30000
});

// Ключ для localStorage
const FILTERS_STORAGE_KEY = 'accountsPage_filters';

// Функции для работы с сохранением фильтров
const saveFiltersToStorage = () => {
  try {
    const filtersData = {
      searchQuery: searchQuery.value,
      type: filters.value.type,
      is_active: filters.value.is_active,
      source: filters.value.source, // Фильтр "Система"
      selectedParent: selectedParent.value,
      currentPage: currentPage.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersData));
    console.log('💾 Фильтры сохранены в localStorage');
  } catch (error) {
    console.error('❌ Ошибка сохранения фильтров:', error);
  }
};

const loadFiltersFromStorage = () => {
  try {
    const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (savedFilters) {
      const filtersData = JSON.parse(savedFilters);
      searchQuery.value = filtersData.searchQuery || '';
      filters.value.type = filtersData.type ?? null;
      filters.value.is_active = filtersData.is_active ?? null;
      filters.value.source = filtersData.source ?? null; // Восстанавливаем фильтр "Система"
      selectedParent.value = filtersData.selectedParent || '';
      currentPage.value = filtersData.currentPage || 1;
      itemsPerPage.value = filtersData.itemsPerPage || 10;
      sortBy.value = filtersData.sortBy || 'creationDatetime';
      sortOrder.value = filtersData.sortOrder || 'desc';
      console.log('📂 Фильтры восстановлены из localStorage');
      return true;
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки фильтров:', error);
  }
  return false;
};

const clearFiltersFromStorage = () => {
  try {
    localStorage.removeItem(FILTERS_STORAGE_KEY);
    console.log('🗑️ Фильтры удалены из localStorage');
  } catch (error) {
    console.error('❌ Ошибка удаления фильтров:', error);
  }
};

// Опции для фильтров
const accountTypes = [
  { title: 'Все типы', value: null },
  { title: 'Клиент', value: 'client' },
  { title: 'Партнер', value: 'partner' },
];

const statusOptions = [
  { title: 'Все статусы', value: null },
  { title: 'Активные', value: true },
  { title: 'Заблокированные', value: false },
];

// Опции для фильтра по системе
const sourceOptions = [
  { title: 'Все системы', value: null },
  { title: 'Axenta', value: 'axenta' },
  { title: 'Wialon (все)', value: 'wialon' },
  { title: 'WH (Hosting)', value: 'wh' },
  { title: 'WL (Local)', value: 'wl' },
];

// Опции для количества записей на странице
const itemsPerPageOptions = [
  { value: 5, title: '5' },
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 75, title: '75' },
  { value: 100, title: '100' },
  { value: 150, title: '150' },
];

// Заголовки таблицы

const headers = computed(() => [
  { title: '№', key: 'rowNumber', sortable: false, width: '60px' },
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Компания', key: 'name', sortable: true, width: '25%' },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Объекты', key: 'objectsTotal', sortable: true },
  { title: 'Статус', key: 'isActive', sortable: true },
  { title: 'Источник', key: 'source', sortable: true },
  { title: 'Создан', key: 'creationDatetime', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false },
]);

// Вычисляемые свойства для определения активности фильтров
const isSearchActive = computed(() => {
  return searchQuery.value && searchQuery.value.trim() !== '';
});

const isTypeFilterActive = computed(() => {
  return filters.value.type !== null;
});

const isStatusFilterActive = computed(() => {
  return filters.value.is_active !== null;
});

const isParentFilterActive = computed(() => {
  return selectedParent.value && selectedParent.value.trim() !== '';
});

const isSourceFilterActive = computed(() => {
  return filters.value.source !== null && filters.value.source !== '';
});

const hasAnyActiveFilters = computed(() => {
  return isSearchActive.value || isTypeFilterActive.value ||
    isStatusFilterActive.value || isParentFilterActive.value ||
    isSourceFilterActive.value;
});

const activeFiltersCount = computed(() => {
  let count = 0;
  if (isSearchActive.value) count++;
  if (isTypeFilterActive.value) count++;
  if (isStatusFilterActive.value) count++;
  if (isParentFilterActive.value) count++;
  if (isSourceFilterActive.value) count++;
  return count;
});

// Computed properties для множественного поиска компаний
const isMultipleCompanySearch = computed(() => {
  if (!searchQuery.value) return false;
  const searchTerms = searchQuery.value.split(',').map(term => term.trim()).filter(term => term.length > 0);
  return searchTerms.length > 1;
});

const companySearchTermsArray = computed(() => {
  if (!searchQuery.value) return [];
  return searchQuery.value.split(',').map(term => term.trim()).filter(term => term.length > 0);
});


// Computed свойство для добавления нумерации строк и объединения источников
const accountsWithNumbers = computed(() => {
  const startNumber = (currentPage.value - 1) * itemsPerPage.value + 1;

  // Добавляем source='axenta' к аккаунтам Axenta
  const axentaAccountsWithSource = accounts.value.map(account => ({
    ...account,
    source: 'axenta',
  }));

  // Фильтруем Wialon аккаунты по родителю если выбран фильтр
  let filteredWialon = [...wialonAccounts.value];

  // === Фильтр по поиску (searchQuery) для Wialon ===
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    // Разбиваем поисковый запрос по запятым (без пробелов)
    const searchTerms = searchQuery.value
      .split(',')
      .map(term => term.trim().toLowerCase())
      .filter(term => term.length > 0);

    if (searchTerms.length > 0) {
      filteredWialon = filteredWialon.filter(account => {
        const accountName = account.name.toLowerCase();
        const hierarchy = account.hierarchy?.toLowerCase() || '';
        const id = account.id?.toString() || '';

        // Проверяем совпадение хотя бы с одним термином
        return searchTerms.some(term =>
          accountName.includes(term) ||
          hierarchy.includes(term) ||
          id.includes(term)
        );
      });
    }
  }

  // Фильтр по родителю для Wialon
  if (selectedParent.value && selectedParent.value.trim() !== '') {
    filteredWialon = filteredWialon.filter(account => {
      if (account.hierarchy?.includes(selectedParent.value)) {
        const parts = account.hierarchy.split(' > ');
        // Родитель — это любой элемент кроме последнего
        const parents = parts.slice(0, -1);
        return parents.some(p => p === selectedParent.value || p.includes(selectedParent.value));
      }
      return false;
    });
  }

  // Фильтр по статусу (is_active) для Wialon
  if (filters.value.is_active !== null) {
    filteredWialon = filteredWialon.filter(account => account.isActive === filters.value.is_active);
  }

  // Фильтр по типу (партнёр/клиент) для Wialon
  if (filters.value.type) {
    filteredWialon = filteredWialon.filter(account => {
      if (filters.value.type === 'partner') {
        return account.dealer_rights === true;
      } else if (filters.value.type === 'client') {
        return account.dealer_rights !== true;
      }
      return true;
    });
  }

  // Определяем какие аккаунты включать на основе фильтра по системе
  let allAccounts: typeof axentaAccountsWithSource = [];

  // Фильтруем Axenta аккаунты по статусу (is_active) — API не поддерживает этот фильтр!
  let filteredAxenta = axentaAccountsWithSource;
  if (filters.value.is_active !== null) {
    filteredAxenta = axentaAccountsWithSource.filter(account => account.isActive === filters.value.is_active);
  }

  if (filters.value.source === 'axenta') {
    // Только Axenta — данные уже пришли с пагинацией, не добавляем Wialon
    allAccounts = filteredAxenta;
  } else if (filters.value.source === 'wialon' || filters.value.source === 'wl' || filters.value.source === 'wh') {
    // Только Wialon — не добавляем Axenta
    allAccounts = filteredWialon.filter(acc => {
      const source = acc.source?.toLowerCase() || '';
      if (filters.value.source === 'wialon') {
        return source !== 'axenta' && source !== '';
      } else if (filters.value.source === 'wh') {
        return source.startsWith('wh(') || source.startsWith('wh ');
      } else if (filters.value.source === 'wl') {
        return source.startsWith('wl(') || source.startsWith('wl ');
      }
      return true;
    });
  } else {
    // Все системы — объединяем Axenta и Wialon
    allAccounts = [...filteredAxenta, ...filteredWialon];
  }

  // Добавляем нумерацию
  console.log('🔍 accountsWithNumbers computed:', {
    axentaCount: filteredAxenta.length,
    wialonCount: filteredWialon.length,
    totalCount: allAccounts.length,
    sourceFilter: filters.value.source,
    searchQuery: searchQuery.value
  });

  // Для Axenta — данные приходят уже с серверной пагинацией
  // Для Wialon и смешанных источников — применяем клиентскую пагинацию
  let paginatedAccounts: typeof allAccounts;

  if (filters.value.source === 'axenta') {
    // Axenta: серверная пагинация уже применена
    paginatedAccounts = allAccounts;
  } else {
    // Wialon или все системы: применяем клиентскую пагинацию
    const startIndex = (currentPage.value - 1) * itemsPerPage.value;
    const endIndex = startIndex + itemsPerPage.value;
    paginatedAccounts = allAccounts.slice(startIndex, endIndex);
  }

  // Добавляем нумерацию (учитываем пагинацию)
  return paginatedAccounts.map((account, index) => ({
    ...account,
    rowNumber: startNumber + index,
  }));
});

// Эффективное количество записей с учётом фильтра по источнику
const effectiveTotalItems = computed(() => {
  if (filters.value.source === 'axenta') {
    // Только Axenta — если is_active фильтр активен, считаем локально
    if (filters.value.is_active !== null) {
      const filteredAxenta = accounts.value.filter(account => account.isActive === filters.value.is_active);
      return filteredAxenta.length;
    }
    return totalItems.value;
  } else if (filters.value.source === 'wialon' || filters.value.source === 'wl' || filters.value.source === 'wh') {
    // Только Wialon — считаем отфильтрованных
    let filteredWialon = [...wialonAccounts.value];

    // Применяем те же фильтры что и в accountsWithNumbers
    if (selectedParent.value && selectedParent.value.trim() !== '') {
      filteredWialon = filteredWialon.filter(account => {
        if (account.hierarchy?.includes(selectedParent.value)) {
          const parts = account.hierarchy.split(' > ');
          const parents = parts.slice(0, -1);
          return parents.some(p => p === selectedParent.value || p.includes(selectedParent.value));
        }
        return false;
      });
    }

    if (filters.value.is_active !== null) {
      filteredWialon = filteredWialon.filter(account => account.isActive === filters.value.is_active);
    }

    if (filters.value.type) {
      filteredWialon = filteredWialon.filter(account => {
        if (filters.value.type === 'partner') {
          return account.dealer_rights === true;
        } else if (filters.value.type === 'client') {
          return account.dealer_rights !== true;
        }
        return true;
      });
    }

    // Фильтр по WL/WH/Wialon
    filteredWialon = filteredWialon.filter(acc => {
      const source = acc.source?.toLowerCase() || '';
      if (filters.value.source === 'wialon') {
        return source !== 'axenta' && source !== '';
      } else if (filters.value.source === 'wh') {
        return source.startsWith('wh(') || source.startsWith('wh ');
      } else if (filters.value.source === 'wl') {
        return source.startsWith('wl(') || source.startsWith('wl ');
      }
      return true;
    });

    return filteredWialon.length;
  }

  // Все системы — объединяем Axenta и отфильтрованные Wialon
  let filteredWialon = [...wialonAccounts.value];

  if (selectedParent.value && selectedParent.value.trim() !== '') {
    filteredWialon = filteredWialon.filter(account => {
      if (account.hierarchy?.includes(selectedParent.value)) {
        const parts = account.hierarchy.split(' > ');
        const parents = parts.slice(0, -1);
        return parents.some(p => p === selectedParent.value || p.includes(selectedParent.value));
      }
      return false;
    });
  }

  if (filters.value.is_active !== null) {
    filteredWialon = filteredWialon.filter(account => account.isActive === filters.value.is_active);
  }

  if (filters.value.type) {
    filteredWialon = filteredWialon.filter(account => {
      if (filters.value.type === 'partner') {
        return account.dealer_rights === true;
      } else if (filters.value.type === 'client') {
        return account.dealer_rights !== true;
      }
      return true;
    });
  }

  return totalItems.value + filteredWialon.length;
});

// Вычисляемые свойства для кастомной пагинации
const totalPages = computed(() => {
  if (itemsPerPage.value === -1 || itemsPerPage.value >= effectiveTotalItems.value) {
    return 1; // Все на одной странице
  }
  return Math.ceil(effectiveTotalItems.value / itemsPerPage.value);
});

const getDisplayRange = () => {
  if (effectiveTotalItems.value === 0) return '0-0';

  if (itemsPerPage.value === -1 || itemsPerPage.value >= effectiveTotalItems.value) {
    return `1-${effectiveTotalItems.value}`;
  }

  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(currentPage.value * itemsPerPage.value, effectiveTotalItems.value);
  return `${start}-${end}`;
};


// Методы
const loadAccounts = async (isBackground = false) => {
  try {
    // Для фонового обновления используем отдельный индикатор
    if (isBackground) {
      isBackgroundLoading.value = true;
    } else {
      isLoading.value = true;
      isAxentaLoading.value = true; // Lazy Loading: отслеживаем загрузку Axenta отдельно
    }

    // Формируем поисковый запрос с учетом родителя
    let searchParam = searchQuery.value || '';
    if (selectedParent.value && selectedParent.value.trim() !== '') {
      // Добавляем фильтр по родительскому аккаунту в поиск
      const parentFilter = selectedParent.value;
      searchParam = searchParam ? `${searchParam} ${parentFilter}` : parentFilter;
    }

    const requestParams = {
      ...filters.value,
      page: currentPage.value,
      per_page: itemsPerPage.value,
      search: searchParam || undefined,
      ordering: sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value,
    };

    console.log('🔍 Загрузка учетных записей с параметрами:', requestParams);
    const response = await accountsService.getAccounts(requestParams);
    console.log('✅ Получен ответ:', { count: response.count, results: response.results.length });

    // Определяем, какие фильтры поддерживает внешний API
    // is_active также поддерживается Axenta API!
    const hasServerSupportedFilters = filters.value.type ||
      (selectedParent.value && selectedParent.value.trim() !== '') ||
      (searchQuery.value && searchQuery.value.trim() !== '') ||
      filters.value.is_active !== null;

    // Клиентские фильтры - фильтры которые НЕ поддерживаются API
    // Множественный поиск (через запятую) требует клиентской фильтрации!
    const isMultiSearch = searchQuery.value && searchQuery.value.includes(',');
    const hasClientOnlyFilters = isMultiSearch;

    const hasActiveFilters = hasServerSupportedFilters || hasClientOnlyFilters;

    if (hasActiveFilters) {
      console.log('🔧 Обнаружены активные фильтры:', {
        serverSupported: hasServerSupportedFilters,
        clientOnly: hasClientOnlyFilters,
        type: filters.value.type,
        search: searchQuery.value,
        parent: selectedParent.value,
        is_active: filters.value.is_active
      });

      // Если есть только серверные фильтры - используем их напрямую
      if (hasServerSupportedFilters && !hasClientOnlyFilters) {
        console.log('🔧 Используем только серверные фильтры');

        // Wialon аккаунты добавляются через accountsWithNumbers с фильтрацией
        // НЕ добавляем их здесь чтобы избежать дублирования

        accounts.value = response.results;
        totalItems.value = response.count;
        lastUpdateTime.value = new Date();
        return;
      }

      // Если есть клиентские фильтры - загружаем данные для фильтрации
      console.log('🔧 Загружаем данные для клиентской фильтрации');

      // Загружаем все записи без фильтрации для клиентской обработки
      const allRecordsParams = {
        page: 1,
        per_page: 1000, // Загружаем большое количество записей
        ordering: requestParams.ordering
        // Убираем все фильтры, чтобы получить все записи
      };

      // Проверяем кэш
      const now = new Date();
      const isCacheValid = cacheTimestamp.value &&
        allAccountsCache.value.length > 0 &&
        (now.getTime() - cacheTimestamp.value.getTime()) < CACHE_DURATION;

      let allRecordsResponse: { results: Account[] };
      if (isCacheValid) {
        // Явно копируем массив из кэша
        const cachedData = [...allAccountsCache.value];
        console.log(`🔧 Используем кэшированные данные (${cachedData.length} записей)`);
        allRecordsResponse = { results: cachedData };
      } else {
        console.log('🔧 Загружаем все записи для фильтрации...');

        // Загружаем ВСЕ страницы данных
        let allResults: Account[] = [];
        let currentPageNum = 1;
        let hasMore = true;

        while (hasMore) {
          const pageParams = {
            ...allRecordsParams,
            page: currentPageNum
          };
          const pageResponse = await accountsService.getAccounts(pageParams);
          allResults = [...allResults, ...pageResponse.results];

          // Проверяем есть ли ещё данные
          hasMore = pageResponse.results.length === allRecordsParams.per_page &&
            allResults.length < pageResponse.count;
          currentPageNum++;

          // Защита от бесконечного цикла
          if (currentPageNum > 10) {
            console.warn('⚠️ Достигнут лимит страниц (10), прерываем загрузку');
            break;
          }
        }

        allRecordsResponse = { results: allResults };

        // Сохраняем в кэш
        allAccountsCache.value = allResults;
        cacheTimestamp.value = now;
        console.log(`🔧 Загружено и кэшировано ${allResults.length} записей (всего страниц: ${currentPageNum - 1})`);
      }

      // Применяем клиентскую фильтрацию ко всем записям
      // Используем allRecordsResponse.results напрямую (гарантирует доступ к данным)
      let allFilteredResults = [...allRecordsResponse.results];

      // Фильтр по статусу (только если явно выбран true или false, не null)
      if (filters.value.is_active !== null && filters.value.is_active !== undefined) {
        allFilteredResults = allFilteredResults.filter(account =>
          account.isActive === filters.value.is_active
        );
      }

      // Фильтр по типу аккаунта
      if (filters.value.type) {
        allFilteredResults = allFilteredResults.filter(account =>
          account.type === filters.value.type
        );
      }

      // Фильтр по поиску (если есть) - дополнительная фильтрация поверх серверного поиска
      if (searchQuery.value) {
        if (isMultipleCompanySearch.value) {
          // Множественный поиск - ищем точные совпадения по терминам
          const searchTerms = companySearchTermsArray.value.map(term => term.toLowerCase());
          console.log('🔎 Клиентская фильтрация Axenta:', {
            searchTerms,
            recordsBeforeFilter: allFilteredResults.length,
            firstRecords: allFilteredResults.slice(0, 5).map(a => a.name)
          });

          allFilteredResults = allFilteredResults.filter(account => {
            const accountName = account.name?.toLowerCase() || '';
            const adminName = account.adminFullname?.toLowerCase() || '';
            const parentName = account.parentAccountName?.toLowerCase() || '';
            const hierarchy = account.hierarchy?.toLowerCase() || '';

            const matches = searchTerms.some(term =>
              accountName.includes(term) ||
              adminName.includes(term) ||
              parentName.includes(term) ||
              hierarchy.includes(term)
            );

            // Логируем найденные совпадения
            if (matches) {
              console.log('✅ Найдено совпадение:', account.name);
            }

            return matches;
          });

          console.log('🔎 После фильтрации Axenta:', allFilteredResults.length);
        } else {
          // Обычный поиск
          const query = searchQuery.value.toLowerCase();
          allFilteredResults = allFilteredResults.filter(account =>
            account.name.toLowerCase().includes(query) ||
            account.adminFullname?.toLowerCase().includes(query) ||
            account.parentAccountName?.toLowerCase().includes(query)
          );
        }
      }

      // Фильтр по родительскому аккаунту (пустое значение = "Все родители", не фильтруем)
      if (selectedParent.value && selectedParent.value.trim() !== '') {
        allFilteredResults = allFilteredResults.filter(account => {
          // Для Axenta — проверяем parentAccountName
          if (account.parentAccountName?.includes(selectedParent.value)) {
            return true;
          }
          // Для Wialon — проверяем hierarchy (содержит родителя в пути)
          if (account.hierarchy?.includes(selectedParent.value)) {
            // Убедимся что это именно родитель, а не сам аккаунт
            const parts = account.hierarchy.split(' > ');
            // Родитель — это любой элемент кроме последнего (который является именем самого аккаунта)
            const parents = parts.slice(0, -1);
            return parents.some(p => p === selectedParent.value || p.includes(selectedParent.value));
          }
          return false;
        });
      }

      console.log(`🔧 После фильтрации: ${allFilteredResults.length} записей`);

      // Применяем пагинацию к отфильтрованным результатам
      const startIndex = (currentPage.value - 1) * itemsPerPage.value;
      const endIndex = startIndex + itemsPerPage.value;
      const paginatedResults = allFilteredResults.slice(startIndex, endIndex);

      // Обновляем ответ
      response.results = paginatedResults;
      response.count = allFilteredResults.length;

      console.log(`🔧 Показано ${paginatedResults.length} записей из ${allFilteredResults.length} отфильтрованных`);
      console.log(`🔧 Активные фильтры:`, {
        is_active: filters.value.is_active,
        type: filters.value.type,
        selectedParent: selectedParent.value,
        searchQuery: searchQuery.value
      });
    }


    // Обновляем totalItems только если получили валидное значение
    if (response.count !== undefined && response.count >= 0) {
      totalItems.value = response.count;
    }

    // Обновляем данные если нет активных фильтров (случай без фильтров)
    if (!hasActiveFilters) {
      console.log('🔧 Нет активных фильтров - обновляем данные напрямую');
      if (isBackground && accounts.value.length > 0) {
        // Сравниваем данные и обновляем только если есть изменения
        const hasChanges = !areAccountsEqual(accounts.value, response.results);
        if (hasChanges) {
          // Плавная анимация обновления
          await updateAccountsSmooth(response.results);
        }
      } else {
        // Первоначальная загрузка или принудительное обновление
        console.log('🔧 Первоначальная загрузка - устанавливаем данные:', response.results.length);
        accounts.value = response.results;
      }
    } else {
      // Есть активные фильтры - устанавливаем отфильтрованные данные
      console.log('🔧 Установка отфильтрованных данных:', response.results.length);
      accounts.value = response.results;
    }
    lastUpdateTime.value = new Date();

  } catch (error: any) {
    console.error('❌ Ошибка загрузки учетных записей:', error);

    // Показываем детальную информацию об ошибке
    if (error.response) {
      console.error('Статус ошибки:', error.response.status);
      console.error('Данные ошибки:', error.response.data);

      if (error.response.status === 401) {
        console.error('🔐 Ошибка авторизации - проверьте токен');
      } else if (error.response.status === 403) {
        console.error('🚫 Доступ запрещен - недостаточно прав');
      } else if (error.response.status === 404) {
        console.error('🔍 Endpoint не найден - проверьте URL API');
      }
    } else if (error.request) {
      console.error('🌐 Ошибка сети - нет ответа от сервера');
    } else {
      console.error('⚙️ Ошибка конфигурации:', error.message);
    }
  } finally {
    if (isBackground) {
      isBackgroundLoading.value = false;
    } else {
      isLoading.value = false;
      isAxentaLoading.value = false; // Lazy Loading: Axenta загружена
    }
  }
};

// Статистика по системам для tooltip
const wialonStats = ref({
  total: 0,
  active: 0,
  blocked: 0,
  objects: 0,
  clients: 0, // Клиенты (не дилеры)
  dealers: 0, // Дилеры
  // Раздельная статистика по типам подключения
  wl: { total: 0, active: 0, clients: 0, dealers: 0 }, // Wialon Local
  wh: { total: 0, active: 0, clients: 0, dealers: 0 }, // Wialon Hosting
});

// axentaStats пока не используется, но сохранён для будущей статистики
// const axentaStats = ref({ total: 0, active: 0, blocked: 0 });

// Wialon аккаунты (хранятся отдельно для объединения)
const wialonAccounts = ref<Array<Account & { source: string; billingAccountId: number }>>([]);

// Загрузка аккаунтов из Wialon
const loadWialonAccounts = async () => {
  try {
    wialonLoadError.value = null;

    // Шаг 1: Попробовать загрузить из кэша (мгновенно)
    const cachedAccounts = await wialonCacheService.getAccounts();

    if (cachedAccounts.length > 0) {
      // Показываем данные из кэша сразу
      isWialonFromCache.value = true;
      isWialonRefreshing.value = true; // Начинаем фоновое обновление

      wialonAccounts.value = cachedAccounts.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as 'client' | 'partner',
        isActive: item.isActive,
        objectsTotal: item.objectsTotal,
        objectsActive: item.objectsActive || 0,
        objectsDeactivated: item.objectsDeactivated || 0,
        objectsDeleted: 0,
        source: item.sourceLabel || 'wialon',
        dealer_rights: item.dealerRights || false,
        connection_id: item.connectionId || 0,
        parentAccountId: 0,
        parentAccountName: '',
        hierarchy: item.hierarchy || '',
        adminId: 0,
        adminFullname: '',
        adminIsActive: true,
        comment: '',
        billingClientId: '',
        balance: 0,
        monthlyPayment: 0,
        blockingBalance: 0,
        daysBeforeBlocking: null,
        blockingDatetime: null,
        creationDatetime: item.createdAt || '',
        billingAccountId: item.billingAccountId || 0,
      } as Account & { source: string; connection_id: number; billingAccountId: number }));

      console.log(`📦 Загружено ${cachedAccounts.length} аккаунтов Wialon ИЗ КЭША`);

      // Обновляем статистику из кэша
      updateWialonStats(cachedAccounts);
    } else {
      // Кэш пуст — показываем индикатор загрузки
      isWialonLoading.value = true;
    }

    // Шаг 2: Загружаем свежие данные с сервера (в фоне или как основная загрузка)
    const wialonData = await settingsService.getWialonAccounts();

    if (wialonData && wialonData.items) {
      // Преобразуем данные для сохранения в кэш
      const accountsForCache: CachedWialonAccount[] = wialonData.items.map(item => ({
        id: item.id,
        connectionId: item.connection_id || 0,
        name: item.name,
        type: item.type,
        isActive: item.is_active,
        objectsTotal: item.objects_total,
        objectsActive: item.objects_active || 0,
        sourceLabel: item.source_label || 'wialon',
        createdAt: item.created_at || '',
        dealerRights: item.dealer_rights || false,
        hierarchy: item.hierarchy || '',
        billingAccountId: item.billing_account_id || 0,
        _cachedAt: Date.now(),
      }));

      // Сохраняем в кэш (асинхронно, не блокируем UI)
      wialonCacheService.setAccounts(accountsForCache);

      // Преобразуем Wialon аккаунты в формат Account
      wialonAccounts.value = wialonData.items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as 'client' | 'partner',
        isActive: item.is_active,
        objectsTotal: item.objects_total,
        objectsActive: item.objects_active || 0,
        objectsDeleted: 0,
        source: item.source_label || 'wialon', // Используем source_label из API (WH/WL)
        dealer_rights: item.dealer_rights || false, // Права дилера для Wialon
        connection_id: item.connection_id || 0, // ID подключения для toggle-status
        // Заполняем остальные поля значениями по умолчанию
        parentAccountId: 0,
        parentAccountName: '',
        hierarchy: item.hierarchy || '', // Иерархия из API
        adminId: 0,
        adminFullname: '',
        adminIsActive: true,
        comment: '',
        billingClientId: '',
        balance: 0,
        monthlyPayment: 0,
        blockingBalance: 0,
        daysBeforeBlocking: null,
        blockingDatetime: null,
        creationDatetime: item.created_at || '', // Используем дату из API если есть
        billingAccountId: item.billing_account_id || 0, // ID ресурса биллинга (bact) для связи со статистикой
      } as Account & { source: string; connection_id: number; billingAccountId: number }));

      // Обновляем статистику Wialon
      updateWialonStatsFromApi(wialonData.items);

      console.log(`📡 Загружено ${wialonAccounts.value.length} аккаунтов Wialon С СЕРВЕРА`);

      // Обновляем список родительских аккаунтов после загрузки Wialon
      await updateParentAccountsWithWialon();

      // Сохраняем connectionIds для загрузки статистики
      wialonConnectionIds.value = wialonData.connectionIds || [];

      // АВТОМАТИЧЕСКАЯ ЗАГРУЗКА: Загружаем статистику объектов сразу после данных аккаунтов
      // Это критично для отображения колонки "Объекты" при первом открытии страницы
      if (wialonConnectionIds.value.length > 0) {
        console.log(`📊 Автоматическая загрузка статистики объектов для ${wialonConnectionIds.value.length} подключений...`);
        // Запускаем фоновую загрузку статистики (не блокируем UI)
        loadWialonObjectsStats(wialonConnectionIds.value);
      } else {
        console.log(`⚠️ Нет подключений для загрузки статистики объектов`);
      }
    }

    isWialonFromCache.value = false;
  } catch (error) {
    console.error('Ошибка загрузки аккаунтов Wialon:', error);
    wialonLoadError.value = error instanceof Error ? error.message : 'Неизвестная ошибка';
    // Если есть данные из кэша — не очищаем их при ошибке
    if (!isWialonFromCache.value) {
      wialonAccounts.value = [];
    }
  } finally {
    isWialonLoading.value = false; // Lazy Loading: Wialon загружен
    isWialonRefreshing.value = false; // Фоновое обновление завершено
  }
};

// Обновление статистики из кэшированных данных
const updateWialonStats = (items: CachedWialonAccount[]) => {
  let wlTotal = 0, wlActive = 0, wlClients = 0, wlDealers = 0;
  let whTotal = 0, whActive = 0, whClients = 0, whDealers = 0;

  items.forEach(item => {
    const isDealer = item.dealerRights === true;
    const sourceLabel = (item.sourceLabel || '').toLowerCase();

    if (sourceLabel.startsWith('wl')) {
      wlTotal++;
      if (item.isActive) wlActive++;
      if (isDealer) wlDealers++;
      else wlClients++;
    } else if (sourceLabel.startsWith('wh')) {
      whTotal++;
      if (item.isActive) whActive++;
      if (isDealer) whDealers++;
      else whClients++;
    }
  });

  wialonStats.value.total = items.length;
  wialonStats.value.active = items.filter(i => i.isActive).length;
  wialonStats.value.blocked = items.filter(i => !i.isActive).length;
  wialonStats.value.objects = items.reduce((sum, i) => sum + (i.objectsTotal || 0), 0);
  wialonStats.value.clients = wlClients + whClients;
  wialonStats.value.dealers = wlDealers + whDealers;
  wialonStats.value.wl = { total: wlTotal, active: wlActive, clients: wlClients, dealers: wlDealers };
  wialonStats.value.wh = { total: whTotal, active: whActive, clients: whClients, dealers: whDealers };
};

// Обновление статистики из API данных
const updateWialonStatsFromApi = (items: Array<{ is_active: boolean; dealer_rights?: boolean; source_label?: string; objects_total?: number }>) => {
  let wlTotal = 0, wlActive = 0, wlClients = 0, wlDealers = 0;
  let whTotal = 0, whActive = 0, whClients = 0, whDealers = 0;

  items.forEach(item => {
    const isDealer = item.dealer_rights === true;
    const sourceLabel = (item.source_label || '').toLowerCase();

    if (sourceLabel.startsWith('wl')) {
      wlTotal++;
      if (item.is_active) wlActive++;
      if (isDealer) wlDealers++;
      else wlClients++;
    } else if (sourceLabel.startsWith('wh')) {
      whTotal++;
      if (item.is_active) whActive++;
      if (isDealer) whDealers++;
      else whClients++;
    }
  });

  wialonStats.value.total = items.length;
  wialonStats.value.active = items.filter(i => i.is_active).length;
  wialonStats.value.blocked = items.filter(i => !i.is_active).length;
  wialonStats.value.objects = items.reduce((sum, i) => sum + (i.objects_total || 0), 0);
  wialonStats.value.clients = wlClients + whClients;
  wialonStats.value.dealers = wlDealers + whDealers;
  wialonStats.value.wl = { total: wlTotal, active: wlActive, clients: wlClients, dealers: wlDealers };
  wialonStats.value.wh = { total: whTotal, active: whActive, clients: whClients, dealers: whDealers };

  console.log(`📊 Статистика: WL=${wlTotal}, WH=${whTotal}`);
};

// Фоновая загрузка статистики объектов Wialon (не блокирует UI)
const loadWialonObjectsStats = async (connectionIds: number[]) => {
  if (!connectionIds || connectionIds.length === 0) {
    console.log('📊 Нет подключений для загрузки статистики объектов');
    return;
  }

  console.log(`📊 Фоновая загрузка статистики объектов для ${connectionIds.length} подключений...`);

  for (const connectionId of connectionIds) {
    try {
      const statsData = await settingsService.getWialonConnectionObjectsStats(connectionId);

      if (statsData && statsData.stats) {
        // Обновляем objectsTotal и objectsActive для каждого аккаунта
        let updatedCount = 0;
        wialonAccounts.value = wialonAccounts.value.map(account => {
          // Используем billingAccountId (bact = resourceID) для поиска статистики,
          // т.к. бэкенд возвращает карту по resourceID
          const billingId = (account as Account & { billingAccountId?: number }).billingAccountId || 0;
          const accountStats = statsData.stats[billingId] || statsData.stats[account.id];
          if (accountStats) {
            updatedCount++;
            return {
              ...account,
              objectsTotal: accountStats.objectsTotal,
              objectsActive: accountStats.objectsActive,
              objectsDeactivated: accountStats.objectsDeactivated || 0,
            };
          }
          // Если нет статистики, устанавливаем 0 вместо -1
          if (account.objectsTotal === -1) {
            return { ...account, objectsTotal: 0, objectsActive: 0, objectsDeactivated: 0 };
          }
          return account;
        });

        console.log(`✅ Статистика обновлена для подключения ${connectionId}: ${updatedCount} аккаунтов`);

        // Обновляем общую статистику объектов
        wialonStats.value.objects = wialonAccounts.value.reduce(
          (sum, acc) => sum + (acc.objectsTotal > 0 ? acc.objectsTotal : 0), 0
        );
      }
    } catch (error) {
      console.error(`❌ Ошибка загрузки статистики для подключения ${connectionId}:`, error);
    }
  }

  console.log('📊 Фоновая загрузка статистики объектов завершена');

  // Обновляем кэш с актуальной статистикой объектов
  const updatedCacheData = wialonAccounts.value.map(acc => ({
    id: acc.id,
    connectionId: (acc as any).connection_id || 0,
    name: acc.name,
    type: acc.type,
    isActive: acc.isActive,
    objectsTotal: acc.objectsTotal,
    objectsActive: acc.objectsActive || 0,
    objectsDeactivated: (acc as any).objectsDeactivated || 0,
    sourceLabel: acc.source,
    createdAt: acc.creationDatetime || '',
    dealerRights: (acc as any).dealer_rights || false,
    hierarchy: acc.hierarchy || '',
    billingAccountId: (acc as any).billingAccountId || 0,
    _cachedAt: Date.now(),
  }));
  wialonCacheService.setAccounts(updatedCacheData);
  console.log('💾 Кэш обновлён с актуальной статистикой объектов');
};

// Lazy Loading: Загрузка статистики только для видимых аккаунтов
const loadVisibleObjectsStats = debounce(async () => {
  // Получаем видимые строки таблицы
  const table = document.querySelector('.accounts-table');
  if (!table) return;

  const visibleRows = table.querySelectorAll('tbody tr');
  if (visibleRows.length === 0) return;

  // Собираем ID аккаунтов для загрузки статистики
  const accountsToLoad: Array<{ id: number; connectionId: number; billingAccountId: number }> = [];

  visibleRows.forEach(row => {
    // Получаем данные строки через data-атрибуты или через wialonAccounts
    const rowIndex = Array.from(visibleRows).indexOf(row);
    const visibleAccounts = accountsWithNumbers.value.slice(0, Math.min(20, accountsWithNumbers.value.length));
    const account = visibleAccounts[rowIndex];

    if (account && account.source && account.source.startsWith('W') && !objectsStatsLoaded.value.has(account.id)) {
      accountsToLoad.push({
        id: account.id,
        connectionId: (account as any).connection_id || 0,
        billingAccountId: (account as any).billingAccountId || 0
      });
    }
  });

  if (accountsToLoad.length === 0) return;

  console.log(`🔄 Lazy loading: загрузка статистики для ${accountsToLoad.length} видимых аккаунтов`);
  isLoadingObjectsStats.value = true;

  // Группируем по connectionId
  const byConnection = new Map<number, typeof accountsToLoad>();
  accountsToLoad.forEach(acc => {
    const list = byConnection.get(acc.connectionId) || [];
    list.push(acc);
    byConnection.set(acc.connectionId, list);
  });

  // Загружаем статистику для каждого connection
  for (const [connectionId, accounts] of byConnection) {
    if (connectionId === 0) continue;

    try {
      const statsData = await settingsService.getWialonConnectionObjectsStats(connectionId);

      if (statsData && statsData.stats) {
        // Обновляем только запрошенные аккаунты
        wialonAccounts.value = wialonAccounts.value.map(account => {
          const requested = accounts.find(a => a.id === account.id);
          if (!requested) return account;

          const billingId = (account as any).billingAccountId || 0;
          const accountStats = statsData.stats[billingId] || statsData.stats[account.id];

          if (accountStats) {
            objectsStatsLoaded.value.add(account.id);
            return {
              ...account,
              objectsTotal: accountStats.objectsTotal,
              objectsActive: accountStats.objectsActive,
              objectsDeactivated: accountStats.objectsDeactivated || 0,
            };
          }
          return account;
        });

        console.log(`✅ Lazy loading: статистика обновлена для ${accounts.length} аккаунтов (connection ${connectionId})`);
      }
    } catch (error) {
      console.error(`❌ Lazy loading: ошибка для connection ${connectionId}:`, error);
    }
  }

  isLoadingObjectsStats.value = false;
}, 500); // Дебаунс 500ms

// Функция для сравнения массивов аккаунтов
const areAccountsEqual = (oldAccounts: Account[], newAccounts: Account[]): boolean => {
  if (oldAccounts.length !== newAccounts.length) return false;

  for (let i = 0; i < oldAccounts.length; i++) {
    const oldAcc = oldAccounts[i];
    const newAcc = newAccounts[i];

    // Сравниваем ключевые поля, которые могут измениться
    if (
      oldAcc.id !== newAcc.id ||
      oldAcc.name !== newAcc.name ||
      oldAcc.isActive !== newAcc.isActive ||
      oldAcc.objectsActive !== newAcc.objectsActive ||
      oldAcc.objectsTotal !== newAcc.objectsTotal ||
      oldAcc.blockingDatetime !== newAcc.blockingDatetime ||
      oldAcc.daysBeforeBlocking !== newAcc.daysBeforeBlocking
    ) {
      return false;
    }
  }

  return true;
};

// Функция для плавного обновления данных
const updateAccountsSmooth = async (newAccounts: Account[]): Promise<void> => {
  return new Promise((resolve) => {
    // Добавляем небольшую задержку для плавности
    setTimeout(() => {
      accounts.value = newAccounts;
      resolve();
    }, 50);
  });
};

const loadStats = async (isBackground = false, forceRefresh = false) => {
  try {
    // Используем оптимизированный метод с кешированием
    const statsData = await accountsService.getAccountsStats(forceRefresh);

    // Плавное обновление статистики только если есть изменения
    if (isBackground) {
      const hasStatsChanged = (
        stats.value.total !== statsData.total ||
        stats.value.active !== statsData.active ||
        stats.value.clients !== statsData.clients ||
        stats.value.partners !== statsData.partners
      );

      if (hasStatsChanged) {
        // Анимированное обновление статистики
        await updateStatsSmooth(statsData);
      }
    } else {
      stats.value = statsData;
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки статистики:', error);
  }
};

// Обновляет список родительских аккаунтов с добавлением Wialon родителей
const updateParentAccountsWithWialon = () => {
  // Получаем текущие опции (без "Все родители")
  const currentOptions = parentAccountOptions.value.slice(1);
  const uniqueParentsSet = new Set<string>(currentOptions.map(opt => opt.value));

  // Добавляем родителей из Wialon аккаунтов (ParentName из иерархии)
  wialonAccounts.value.forEach(account => {
    if (account.hierarchy) {
      const parts = account.hierarchy.split(' > ');
      // Иерархия: "WL(Профмонитор) > Родитель > Имя" или "WL(Профмонитор) > Имя"
      if (parts.length >= 2) {
        // Добавляем sourceLabel как родитель верхнего уровня
        uniqueParentsSet.add(parts[0].trim());
        // Если есть промежуточный родитель
        if (parts.length >= 3) {
          uniqueParentsSet.add(parts[1].trim());
        }
      }
    }
  });

  // Преобразуем Set в отсортированный массив опций
  const parentNames = Array.from(uniqueParentsSet).sort();

  parentAccountOptions.value = [
    { title: 'Все родители', value: '' },
    ...parentNames.map(name => ({
      title: name,
      value: name
    }))
  ];

  console.log(`📋 Обновлено ${parentNames.length} родительских аккаунтов (с Wialon)`);
};

// Загрузка списка родительских аккаунтов с использованием кеширования
const loadParentAccounts = async (_forceRefresh: boolean = false) => {
  try {
    console.log('📋 Загрузка списка родительских аккаунтов...');

    // Загружаем все аккаунты для извлечения уникальных родителей
    const response = await accountsService.getAccounts({
      per_page: 1000,
      ordering: 'name'
    });

    // Извлекаем уникальные имена родительских аккаунтов из поля parentAccountName
    const uniqueParentsSet = new Set<string>();
    response.results.forEach(account => {
      // Добавляем родительский аккаунт, если он указан
      if (account.parentAccountName && account.parentAccountName.trim()) {
        uniqueParentsSet.add(account.parentAccountName.trim());
      }
    });

    // Добавляем родителей из Wialon аккаунтов (ParentName из иерархии)
    wialonAccounts.value.forEach(account => {
      // Извлекаем родителя из иерархии (второй элемент после sourceLabel)
      if (account.hierarchy) {
        const parts = account.hierarchy.split(' > ');
        // Иерархия: "WL(Профмонитор) > Родитель > Имя" или "WL(Профмонитор) > Имя"
        if (parts.length >= 2) {
          // Добавляем sourceLabel как родитель верхнего уровня
          uniqueParentsSet.add(parts[0].trim());
          // Если есть промежуточный родитель
          if (parts.length >= 3) {
            uniqueParentsSet.add(parts[1].trim());
          }
        }
      }
    });

    // Преобразуем Set в отсортированный массив опций
    const parentNames = Array.from(uniqueParentsSet).sort();

    parentAccountOptions.value = [
      { title: 'Все родители', value: '' },
      ...parentNames.map(name => ({
        title: name,
        value: name
      }))
    ];

    console.log(`✅ Загружено ${parentNames.length} уникальных родительских аккаунтов для фильтра`);
  } catch (error) {
    console.error('❌ Ошибка загрузки родительских аккаунтов:', error);
  }
};

// Функция для плавного обновления статистики
const updateStatsSmooth = async (newStats: typeof stats.value): Promise<void> => {
  return new Promise((resolve) => {
    // Анимируем изменение чисел
    const duration = 500; // 500ms
    const startTime = Date.now();
    const startStats = { ...stats.value };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Интерполяция значений
      stats.value = {
        total: Math.round(startStats.total + (newStats.total - startStats.total) * progress),
        active: Math.round(startStats.active + (newStats.active - startStats.active) * progress),
        blocked: Math.round(startStats.blocked + (newStats.blocked - startStats.blocked) * progress),
        clients: Math.round(startStats.clients + (newStats.clients - startStats.clients) * progress),
        partners: Math.round(startStats.partners + (newStats.partners - startStats.partners) * progress),
      };

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
};

const debouncedSearch = debounce(() => {
  currentPage.value = 1;
  // Очищаем кэш при изменении поиска
  allAccountsCache.value = [];
  cacheTimestamp.value = null;
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
}, 500);

const resetFilters = () => {
  searchQuery.value = '';
  filters.value = {
    type: null,
    is_active: null,
    source: null, // Сброс фильтра "Система"
  };
  selectedParent.value = ''; // Сброс на "Все родители"
  currentPage.value = 1;

  // Очищаем кэш при сбросе фильтров
  allAccountsCache.value = [];
  cacheTimestamp.value = null;

  // Очищаем сохраненные фильтры из localStorage
  clearFiltersFromStorage();

  loadAccounts();
};

// Обработчики изменений фильтров
const onTypeFilterChange = (value: string | null) => {
  // Очищаем кэш при изменении фильтра типа
  allAccountsCache.value = [];
  if (cacheTimestamp.value) {
    cacheTimestamp.value = null;
  }
  // Устанавливаем значение фильтра
  filters.value.type = value as "client" | "partner" | null;
  // Сбрасываем страницу на первую при изменении фильтра
  currentPage.value = 1;
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
};

const onStatusFilterChange = (value: boolean | null) => {
  // Очищаем кэш при изменении фильтра статуса
  allAccountsCache.value = [];
  if (cacheTimestamp.value) {
    cacheTimestamp.value = null;
  }
  // Устанавливаем значение фильтра
  filters.value.is_active = value;
  // Сбрасываем страницу на первую при изменении фильтра
  currentPage.value = 1;
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
};

const onSourceFilterChange = (value: string | null) => {
  // Очищаем кэш при изменении фильтра системы
  allAccountsCache.value = [];
  if (cacheTimestamp.value) {
    cacheTimestamp.value = null;
  }
  // Устанавливаем значение фильтра
  filters.value.source = value;
  // Сбрасываем страницу на первую при изменении фильтра
  currentPage.value = 1;
  saveFiltersToStorage();
  loadAccounts();
};

// Метод для удаления отдельного термина поиска компании
const removeCompanySearchTerm = (index: number) => {
  const terms = companySearchTermsArray.value;
  terms.splice(index, 1);
  searchQuery.value = terms.join(', ');

  // Очищаем кэш при изменении поиска
  allAccountsCache.value = [];
  cacheTimestamp.value = null;

  // Если остался только один термин или меньше, перезагружаем
  if (terms.length <= 1) {
    currentPage.value = 1;
    loadAccounts();
  } else {
    // Для множественного поиска тоже перезагружаем
    debouncedSearch();
  }
};

const onParentChange = (parent: string) => {
  console.log('🔄 Изменение родительского аккаунта:', parent || 'Все родители');
  currentPage.value = 1;
  // Очищаем кэш при изменении родительского аккаунта
  allAccountsCache.value = [];
  cacheTimestamp.value = null;
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
};


const onItemsPerPageChange = (items: number) => {
  if (items === -1) {
    // Опция "Все" - загружаем все записи
    itemsPerPage.value = totalItems.value || 1000;
  } else {
    itemsPerPage.value = items;
  }

  currentPage.value = 1; // Всегда сбрасываем на первую страницу
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
};


const onSortChange = (sortOptions: any) => {
  if (sortOptions && sortOptions.length > 0) {
    const sortOption = sortOptions[0];
    sortBy.value = sortOption.key;
    sortOrder.value = sortOption.order;

    console.log('🔄 Server-side сортировка по всему списку:', {
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      totalRecords: totalItems.value
    });

    // Сбрасываем на первую страницу при изменении сортировки
    currentPage.value = 1;

    // Если выбрано "Все", загружаем все записи с новой сортировкой
    if (itemsPerPage.value === -1 || itemsPerPage.value >= totalItems.value) {
      console.log('📊 Загружаем все записи с новой сортировкой');
      itemsPerPage.value = totalItems.value || 1000; // Загружаем все доступные записи
    }

    saveFiltersToStorage(); // Сохраняем фильтры
    loadAccounts();
  }
};


const startAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
  }

  console.log(`🔄 Автообновление настроено на ${AUTO_REFRESH_DELAY / 1000} секунд`);

  autoRefreshInterval.value = setInterval(() => {
    // Используем фоновое обновление только если не идет основная загрузка
    if (!isLoading.value) {
      console.log('🔄 Автоматическое обновление данных...');
      loadAccounts(true); // true = фоновое обновление
      loadStats(true, true); // true = фоновое обновление, true = принудительное обновление (обход кеша)
    }
  }, AUTO_REFRESH_DELAY);
};

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
    autoRefreshInterval.value = null;
  }
};


// Методы для меню дополнительных действий
const loginToCms = async (account: Account) => {
  try {
    console.log('🔗 Вход в CMS для аккаунта:', account.name);

    // Проверяем тип источника аккаунта
    const accountWithSource = account as Account & { source?: string; connection_id?: number };
    const isWialon = accountWithSource.source && accountWithSource.source !== 'axenta';

    if (isWialon) {
      // Для Wialon аккаунтов используем специальный API для CMS
      if (!accountWithSource.connection_id) {
        showSnackbar(`У аккаунта "${account.name}" не указан ID подключения`, 'error');
        return;
      }

      // Передаём account_id (ID пользователя) для входа под конкретным пользователем
      const result = await settingsService.loginToWialonCms(
        accountWithSource.connection_id,
        undefined, // user_name не передаём — бэкенд найдёт его по account_id
        account.id // ID для поиска пользователя
      );

      if (!result.success) {
        showSnackbar(result.message || 'Ошибка входа в CMS', 'error');
        return;
      }

      console.log('✅ Открываю CMS:', result.redirectUrl);
      window.open(result.redirectUrl, '_blank');

    } else {
      // Для Axenta аккаунтов используем стандартный метод
      if (!account.adminId) {
        showSnackbar(`У аккаунта "${account.name}" не указан ID администратора`, 'error');
        return;
      }

      const result = await accountsService.loginAs(account.adminId, 'cms');

      console.log('✅ Получен URL для входа в CMS:', result.redirectUrl);

      // Открываем новую вкладку с URL для входа
      window.open(result.redirectUrl, '_blank');
    }

  } catch (error: any) {
    console.error('❌ Ошибка входа в CMS:', error);
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Неизвестная ошибка';
    showSnackbar(`Ошибка входа в CMS: ${errorMessage}`, 'error');
  }
};

const loginToMonitoring = async (account: Account) => {
  try {
    console.log('📊 Вход в мониторинг для аккаунта:', account.name);
    console.log('📊 Account ID:', account.id, 'Type:', typeof account.id);

    // Проверяем тип источника аккаунта
    const accountWithSource = account as Account & { source?: string; connection_id?: number };
    const isWialon = accountWithSource.source && accountWithSource.source !== 'axenta';

    if (isWialon) {
      // Для Wialon аккаунтов используем API входа через Wialon
      if (!accountWithSource.connection_id) {
        showSnackbar(`У аккаунта "${account.name}" не указан ID подключения`, 'error');
        return;
      }

      // Передаём account_id (ID ресурса) для поиска связанного пользователя по bact
      // Бэкенд найдёт пользователя с bact == account.id и войдёт под ним
      const result = await settingsService.loginToWialonMonitoring(
        accountWithSource.connection_id,
        undefined, // user_name не передаём — бэкенд найдёт его по account_id
        account.id // ID ресурса для поиска пользователя
      );

      if (!result.success) {
        showSnackbar(`Ошибка входа в мониторинг: ${result.message}`, 'error');
        return;
      }

      console.log('✅ Получен URL для входа в мониторинг Wialon:', result.redirectUrl);
      window.open(result.redirectUrl, '_blank');
    } else {
      // Для Axenta аккаунтов используем старый метод
      if (!account.adminId) {
        showSnackbar(`У аккаунта "${account.name}" не указан ID администратора`, 'error');
        return;
      }

      const result = await accountsService.loginAs(account.adminId, 'monitoring');

      console.log('✅ Получен URL для входа в мониторинг:', result.redirectUrl);
      window.open(result.redirectUrl, '_blank');
    }

  } catch (error: any) {
    console.error('❌ Ошибка входа в мониторинг:', error);
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Неизвестная ошибка';
    showSnackbar(`Ошибка входа в мониторинг: ${errorMessage}`, 'error');
  }
};

const moveAccount = async (account: Account) => {
  console.log('🔄 Перемещение аккаунта:', account.name);

  accountToMove.value = account;
  selectedTargetPartner.value = null;
  moveConfirmationId.value = '';
  moveDialog.value = true;

  // Загружаем список партнеров
  await loadPartners();
};

const deleteAccount = (account: Account) => {
  console.log('🗑️ Запрос на удаление аккаунта:', account.name);

  accountToDelete.value = account;
  deleteConfirmationId.value = '';
  deleteReasonKey.value = null;
  deleteDialog.value = true;
};

// Подтверждение удаления
const confirmDelete = async () => {
  if (!accountToDelete.value) return;

  // Проверяем, что пользователь ввел правильный ID
  if (deleteConfirmationId.value !== accountToDelete.value.id.toString()) {
    showSnackbar('Неверный ID. Введите правильный ID для подтверждения удаления.', 'error');
    return;
  }

  isDeleting.value = true;

  try {
    const account = accountToDelete.value;
    const accountSource = (account.source || '').toUpperCase();
    const isWialon = accountSource.startsWith('WL') || accountSource.startsWith('WH');
    console.log(`🗑️ Удаление аккаунта ${account.id}: ${account.name} (source: ${account.source}, isWialon: ${isWialon})`);

    // Проверяем источник аккаунта - Wialon или Axenta
    if (isWialon) {
      // Для Wialon используем settingsService.deleteWialonAccount
      // connection_id хранится в поле connection_id (не connectionId)
      const connId = (account as any).connection_id;
      if (!connId) {
        throw new Error('Не указан connection_id для Wialon аккаунта');
      }

      // Передаём причину удаления для Wialon Hosting (WH)
      const reasonKey = accountSource.startsWith('WH') ? (deleteReasonKey.value || undefined) : undefined;
      const result = await settingsService.deleteWialonAccount(account.id, connId, reasonKey);

      if (!result.success) {
        throw new Error(result.message);
      }

      console.log(`✅ Wialon аккаунт ${account.name} успешно удален`);

      // Обновляем данные Wialon
      await loadWialonAccounts();
    } else {
      // Для Axenta используем стандартный метод
      await accountsService.deleteAccount(account.id);
      console.log(`✅ Axenta аккаунт ${account.name} успешно удален`);

      // Обновляем данные Axenta
      await loadAccounts();
    }

    // Показываем уведомление об успехе
    showSnackbar(
      `Аккаунт "${account.name}" успешно удален`,
      'success'
    );

    // Закрываем диалог
    deleteDialog.value = false;
    accountToDelete.value = null;
    deleteConfirmationId.value = '';
    deleteReasonKey.value = null;

    // Обновляем статистику
    await loadStats();

  } catch (error) {
    console.error('❌ Ошибка удаления аккаунта:', error);

    // Показываем уведомление об ошибке
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    const accountName = accountToDelete.value?.name || 'неизвестный аккаунт';
    showSnackbar(
      `Ошибка удаления аккаунта "${accountName}": ${errorMessage}`,
      'error'
    );
  } finally {
    isDeleting.value = false;
  }
};

// Отмена удаления
const cancelDelete = () => {
  deleteDialog.value = false;
  accountToDelete.value = null;
  deleteConfirmationId.value = '';
  deleteReasonKey.value = null;
};

// Загрузка списка партнеров для перемещения
const loadPartners = async () => {
  try {
    loadingPartners.value = true;
    console.log('📋 Загрузка списка партнеров...');

    const response = await accountsService.getAccounts({
      type: 'partner',
      per_page: 100,
      is_active: true
    });

    // Исключаем текущий аккаунт из списка
    partnerOptions.value = response.results.filter(account =>
      account.id !== accountToMove.value?.id
    );

    console.log(`✅ Загружено ${partnerOptions.value.length} партнеров`);
  } catch (error) {
    console.error('❌ Ошибка загрузки партнеров:', error);
    showSnackbar('Ошибка загрузки списка партнеров', 'error');
  } finally {
    loadingPartners.value = false;
  }
};

// Подтверждение перемещения
const confirmMove = async () => {
  if (!accountToMove.value || !selectedTargetPartner.value) return;

  try {
    isMoving.value = true;
    console.log(`🔄 Перемещение аккаунта ${accountToMove.value.id} к партнеру ${selectedTargetPartner.value}`);

    await accountsService.moveAccount(
      accountToMove.value.id,
      selectedTargetPartner.value
    );

    showSnackbar(
      `Аккаунт "${accountToMove.value.name}" успешно перемещен`,
      'success'
    );

    // Закрываем диалог
    moveDialog.value = false;
    accountToMove.value = null;
    selectedTargetPartner.value = null;
    moveConfirmationId.value = '';
    partnerOptions.value = [];

    // Обновляем данные
    await loadAccounts();

  } catch (error) {
    console.error('❌ Ошибка перемещения аккаунта:', error);
    showSnackbar('Ошибка перемещения учетной записи', 'error');
  } finally {
    isMoving.value = false;
  }
};

// Отмена перемещения
const cancelMove = () => {
  moveDialog.value = false;
  accountToMove.value = null;
  selectedTargetPartner.value = null;
  moveConfirmationId.value = '';
  partnerOptions.value = [];
};

// Получение цвета для источника
const getSourceColor = (source: string): string => {
  if (source === 'axenta') return 'primary';
  const lowerSource = source?.toLowerCase() || '';
  if (lowerSource.startsWith('wh(') || lowerSource.startsWith('wh ')) return 'orange';
  if (lowerSource.startsWith('wl(') || lowerSource.startsWith('wl ')) return 'cyan';
  return 'grey'; // Для неизвестных источников
};

// Получение иконки для источника
const getSourceIcon = (source: string): string => {
  if (source === 'axenta') return 'mdi-server-network-outline';
  const lowerSource = source?.toLowerCase() || '';
  if (lowerSource.startsWith('wh(') || lowerSource.startsWith('wh ')) return 'mdi-cloud-outline';
  if (lowerSource.startsWith('wl(') || lowerSource.startsWith('wl ')) return 'mdi-server-outline';
  return 'mdi-satellite-uplink';
};

// Переход на страницу создания учетной записи
const goToCreateAccount = () => {
  router.push('/accounts/create');
};

const showSnackbar = (text: string, color: string = 'info') => {
  snackbar.value.text = text;
  snackbar.value.color = color;
  snackbar.value.show = true;
};

/**
 * Проверяет, есть ли Wialon данные в текущем представлении
 */
const hasAnyWialonData = (): boolean => {
  return wialonAccounts.value.length > 0;
};

/**
 * Получить ВСЕ отфильтрованные данные для экспорта (без пагинации)
 * Для Axenta: загружает все записи через API
 * Для Wialon: использует уже загруженные данные wialonAccounts
 */
const getFilteredAccountsForExport = async (): Promise<any[]> => {
  console.log('🔍 getFilteredAccountsForExport: НАЧАЛО');

  // === Загружаем ВСЕ записи Axenta через API ===
  let allAxentaAccounts: Account[] = [];

  try {
    console.log('📥 Загрузка всех Axenta аккаунтов для экспорта...');

    // Загружаем все страницы Axenta
    let currentPageNum = 1;
    let hasMore = true;
    const perPage = 500; // Большой размер страницы для быстрой загрузки

    while (hasMore) {
      const response = await accountsService.getAccounts({
        page: currentPageNum,
        per_page: perPage,
        ordering: sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value,
        // Применяем те же фильтры что и на странице
        type: filters.value.type || undefined,
        is_active: filters.value.is_active !== null ? filters.value.is_active : undefined,
        search: searchQuery.value || undefined,
      });

      allAxentaAccounts = [...allAxentaAccounts, ...response.results];

      // Проверяем есть ли ещё данные
      hasMore = response.results.length === perPage && allAxentaAccounts.length < response.count;
      currentPageNum++;

      // Защита от бесконечного цикла
      if (currentPageNum > 20) {
        console.warn('⚠️ Достигнут лимит страниц (20), прерываем загрузку');
        break;
      }
    }

    console.log(`✅ Загружено ${allAxentaAccounts.length} Axenta аккаунтов для экспорта`);
  } catch (error) {
    console.error('❌ Ошибка загрузки Axenta аккаунтов для экспорта:', error);
    // Fallback: используем текущие данные
    allAxentaAccounts = [...accounts.value];
    console.log(`⚠️ Fallback: используем ${allAxentaAccounts.length} записей из текущей страницы`);
  }

  // Добавляем source='axenta' к аккаунтам Axenta
  const axentaAccountsWithSource = allAxentaAccounts.map(account => ({
    ...account,
    source: 'axenta',
  }));

  // Фильтруем Wialon аккаунты по родителю если выбран фильтр
  let filteredWialon = [...wialonAccounts.value];

  console.log('  🔍 Исходные данные:');
  console.log('    - axentaAccountsWithSource:', axentaAccountsWithSource.length);
  console.log('    - wialonAccounts (до фильтрации):', filteredWialon.length);

  // Логируем примеры source для Wialon
  if (filteredWialon.length > 0) {
    console.log('    - Примеры source:', filteredWialon.slice(0, 3).map(a => a.source));
  }

  // === Фильтр по поиску (searchQuery) для Wialon ===
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    const searchTerms = searchQuery.value
      .split(',')
      .map(term => term.trim().toLowerCase())
      .filter(term => term.length > 0);

    if (searchTerms.length > 0) {
      filteredWialon = filteredWialon.filter(account => {
        const accountName = account.name.toLowerCase();
        const hierarchy = account.hierarchy?.toLowerCase() || '';
        const id = account.id?.toString() || '';
        return searchTerms.some(term =>
          accountName.includes(term) ||
          hierarchy.includes(term) ||
          id.includes(term)
        );
      });
    }
  }

  // Фильтр по родителю для Wialon
  if (selectedParent.value && selectedParent.value.trim() !== '') {
    filteredWialon = filteredWialon.filter(account => {
      if (account.hierarchy?.includes(selectedParent.value)) {
        const parts = account.hierarchy.split(' > ');
        const parents = parts.slice(0, -1);
        return parents.some(p => p === selectedParent.value || p.includes(selectedParent.value));
      }
      return false;
    });
  }

  // Фильтр по статусу (is_active) для Wialon
  if (filters.value.is_active !== null) {
    filteredWialon = filteredWialon.filter(account => account.isActive === filters.value.is_active);
  }

  // Фильтр по типу (партнёр/клиент) для Wialon
  if (filters.value.type) {
    filteredWialon = filteredWialon.filter(account => {
      if (filters.value.type === 'partner') {
        return account.dealer_rights === true;
      } else if (filters.value.type === 'client') {
        return account.dealer_rights !== true;
      }
      return true;
    });
  }

  console.log('    - filteredWialon (после всех фильтров):', filteredWialon.length);

  // Определяем какие аккаунты включать на основе фильтра по системе
  let allAccounts: any[] = [];

  // Фильтруем Axenta аккаунты по статусу (is_active) - уже применено на уровне API
  let filteredAxenta = axentaAccountsWithSource;

  console.log('  🔍 Фильтр системы:', filters.value.source);
  console.log('    - filteredAxenta:', filteredAxenta.length);

  if (filters.value.source === 'axenta') {
    // Только Axenta
    allAccounts = filteredAxenta;
    console.log('  ➡️ Выбран: axenta');
  } else if (filters.value.source === 'wialon' || filters.value.source === 'wl' || filters.value.source === 'wh') {
    // Только Wialon — не добавляем Axenta
    allAccounts = filteredWialon.filter(acc => {
      const source = acc.source?.toLowerCase() || '';
      if (filters.value.source === 'wialon') {
        return source !== 'axenta' && source !== '';
      } else if (filters.value.source === 'wh') {
        return source.startsWith('wh(') || source.startsWith('wh ');
      } else if (filters.value.source === 'wl') {
        return source.startsWith('wl(') || source.startsWith('wl ');
      }
      return true;
    });
    console.log('  ➡️ Выбран: Wialon (', filters.value.source, '), найдено:', allAccounts.length);

    // Если ничего не нашли — возможно формат source другой, покажем примеры
    if (allAccounts.length === 0 && filteredWialon.length > 0) {
      console.log('  ⚠️ ВНИМАНИЕ: 0 записей прошли фильтр source!');
      console.log('  ⚠️ Примеры source в filteredWialon:', filteredWialon.slice(0, 5).map(a => a.source));
    }
  } else {
    // Все системы — объединяем Axenta и Wialon
    allAccounts = [...filteredAxenta, ...filteredWialon];
    console.log('  ➡️ Выбрано: все системы');
  }

  console.log('🔍 getFilteredAccountsForExport: ИТОГО', allAccounts.length, 'записей');

  return allAccounts;
};
/**
 * Экспорт учетных записей в XLSX с автофильтрами
 * Использует библиотеку ExcelJS для генерации Excel файла
 */
const exportAccounts = async () => {
  try {
    exporting.value = true;

    const sourceFilter = filters.value.source;

    console.log('📤 Экспорт учетных записей в XLSX');
    console.log('🔍 Текущие фильтры:', {
      source: sourceFilter,
      type: filters.value.type,
      is_active: filters.value.is_active,
      search: searchQuery.value,
      parent: selectedParent.value
    });

    // Проверяем что данные Wialon загружены для соответствующих фильтров
    if ((sourceFilter === 'wialon' || sourceFilter === 'wh' || sourceFilter === 'wl')
      && wialonAccounts.value.length === 0) {
      showSnackbar('Данные Wialon ещё загружаются. Подождите и попробуйте снова.', 'warning');
      exporting.value = false;
      return;
    }

    // Берём отфильтрованные данные (загружает ВСЕ Axenta записи)
    const dataToExport = await getFilteredAccountsForExport();

    console.log(`📋 Отфильтровано для экспорта: ${dataToExport.length} записей`);

    if (dataToExport.length === 0) {
      showSnackbar('Нет данных для экспорта. Проверьте фильтры.', 'warning');
      return;
    }

    // Динамический импорт заменен на статический для надежности
    // const ExcelJS = await import('exceljs');

    // Создаём Excel файл
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Axenta CRM';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Учетные записи');

    // Вспомогательная функция для форматирования даты
    const formatDate = (dateStr: string | null | undefined): string => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch {
        return '';
      }
    };

    // Заголовки колонок
    const columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Название', key: 'name', width: 35 },
      { header: 'Тип', key: 'type', width: 12 },
      { header: 'Права дилера', key: 'dealer_rights', width: 14 },
      { header: 'Статус', key: 'status', width: 14 },
      { header: 'Дней до блокировки', key: 'days_before_blocking', width: 18 },
      { header: 'Дата блокировки', key: 'blocking_date', width: 16 },
      { header: 'Объекты акт.', key: 'objects_active', width: 13 },
      { header: 'Объекты деакт.', key: 'objects_deactivated', width: 14 },
      { header: 'Объекты всего', key: 'objects_total', width: 14 },
      { header: 'Баланс', key: 'balance', width: 12 },
      { header: 'Ежемес. платеж', key: 'monthly_payment', width: 15 },
      { header: 'Система', key: 'source', width: 25 },
      { header: 'Иерархия', key: 'hierarchy', width: 50 },
      { header: 'Родитель', key: 'parent', width: 25 },
      { header: 'Администратор', key: 'admin', width: 25 },
      { header: 'ID админа', key: 'admin_id', width: 10 },
      { header: 'Комментарий', key: 'comment', width: 30 },
      { header: 'Дата создания', key: 'created_at', width: 14 }
    ];

    worksheet.columns = columns;

    // Добавляем данные
    dataToExport.forEach(acc => {
      worksheet.addRow({
        id: acc.id || '',
        name: acc.name || '',
        type: acc.type === 'partner' ? 'Партнёр' : 'Клиент',
        dealer_rights: (acc as any).dealer_rights ? 'Да' : 'Нет',
        status: acc.isActive ? 'Активен' : 'Заблокирован',
        days_before_blocking: acc.daysBeforeBlocking !== null && acc.daysBeforeBlocking !== undefined ? acc.daysBeforeBlocking : '',
        blocking_date: formatDate(acc.blockingDatetime),
        objects_active: acc.objectsActive || 0,
        objects_deactivated: acc.objectsDeactivated || 0,
        objects_total: acc.objectsTotal || 0,
        balance: acc.balance !== undefined ? acc.balance : '',
        monthly_payment: acc.monthlyPayment !== undefined ? acc.monthlyPayment : '',
        source: acc.source || 'Axenta',
        hierarchy: acc.hierarchy || '',
        parent: acc.parentAccountName || '',
        admin: acc.adminFullname || '',
        admin_id: acc.adminId || '',
        comment: acc.comment || '',
        created_at: formatDate(acc.creationDatetime || acc.createdAt)
      });
    });

    // Стили заголовков
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Автофильтр на все колонки
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: dataToExport.length + 1, column: columns.length }
    };

    // Закрепление заголовка
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Генерируем файл
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Формируем имя файла
    let fileName = 'accounts';
    if (sourceFilter) fileName += `_${sourceFilter}`;
    if (filters.value.type) fileName += `_${filters.value.type}`;
    fileName += `_${new Date().toISOString().split('T')[0]}.xlsx`;

    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showSnackbar(`Экспортировано ${dataToExport.length} записей в Excel`, 'success');
  } catch (error: any) {
    console.error('❌ Ошибка экспорта:', error);
    showSnackbar('Ошибка экспорта учетных записей', 'error');
  } finally {
    exporting.value = false;
  }
};

/**
 * Генерация CSV из данных аккаунтов
 * Универсальный формат с максимумом информации
 */
const generateCSV = (data: any[]): string => {
  if (data.length === 0) return '';

  // Вспомогательная функция для форматирования даты
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // Экранирование для CSV
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(';') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Заголовки — максимум информации
  const headers = [
    'ID',
    'Название',
    'Тип',
    'Права дилера',
    'Статус',
    'Дней до блокировки',
    'Дата блокировки',
    'Объекты активные',
    'Объекты деактивированные',
    'Объекты всего',
    'Баланс',
    'Ежемесячный платеж',
    'Система',
    'Иерархия',
    'Родительский аккаунт',
    'Администратор',
    'ID администратора',
    'Комментарий',
    'Дата создания'
  ];

  // Данные
  const rows = data.map(acc => [
    acc.id || '',
    escapeCSV(acc.name),
    acc.type === 'partner' ? 'Партнёр' : 'Клиент',
    (acc as any).dealer_rights ? 'Да' : 'Нет',
    acc.isActive ? 'Активен' : 'Заблокирован',
    acc.daysBeforeBlocking !== null && acc.daysBeforeBlocking !== undefined ? acc.daysBeforeBlocking : '',
    formatDate(acc.blockingDatetime),
    acc.objectsActive || 0,
    acc.objectsDeactivated || 0,
    acc.objectsTotal || 0,
    acc.balance !== undefined ? acc.balance : '',
    acc.monthlyPayment !== undefined ? acc.monthlyPayment : '',
    escapeCSV(acc.source || 'Axenta'),
    escapeCSV(acc.hierarchy),
    escapeCSV(acc.parentAccountName),
    escapeCSV(acc.adminFullname),
    acc.adminId || '',
    escapeCSV(acc.comment),
    formatDate(acc.creationDatetime || acc.createdAt)
  ]);

  return [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
};

const toggleAccountStatus = async (account: Account) => {
  const newStatus = !account.isActive;
  const action = newStatus ? 'активации' : 'деактивации';

  try {
    console.log(`🔄 ${action} аккаунта:`, account.name);

    // Определяем источник аккаунта (Wialon или Axenta)
    const accountWithSource = account as Account & { source?: string; connection_id?: number };
    const isWialon = accountWithSource.source &&
      accountWithSource.source.toLowerCase() !== 'axenta' &&
      accountWithSource.source !== '';

    if (isWialon) {
      // Для Wialon аккаунтов используем Wialon API
      // ID ресурса = ID пользователя + 1 в Wialon
      const resourceId = account.id + 1;
      const connectionId = accountWithSource.connection_id || 0;

      if (connectionId === 0) {
        throw new Error('Не найден ID подключения для Wialon аккаунта');
      }

      console.log(`📡 Wialon toggle: resourceId=${resourceId}, connectionId=${connectionId}, enable=${newStatus}`);

      const result = await settingsService.toggleWialonAccountStatus(resourceId, connectionId, newStatus);

      if (!result.success) {
        throw new Error(result.message);
      }
    } else {
      // Для Axenta аккаунтов используем стандартный API
      await accountsService.toggleAccountStatus(account.id, newStatus);
    }

    // Обновляем локальное состояние
    account.isActive = newStatus;

    // Для Wialon также обновляем в массиве wialonAccounts
    if (isWialon) {
      const wialonAccount = wialonAccounts.value.find(acc => acc.id === account.id);
      if (wialonAccount) {
        wialonAccount.isActive = newStatus;
      }
    }

    console.log(`✅ Аккаунт ${account.name} ${newStatus ? 'активирован' : 'деактивирован'}`);

    // Показываем уведомление об успехе
    showSnackbar(
      `Аккаунт "${account.name}" успешно ${newStatus ? 'активирован' : 'деактивирован'}`,
      'success'
    );

    // Обновляем данные
    await loadAccounts();

  } catch (error) {
    console.error('❌ Ошибка изменения статуса аккаунта:', error);

    // Показываем уведомление об ошибке
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    showSnackbar(
      `Ошибка ${action} аккаунта "${account.name}": ${errorMessage}`,
      'error'
    );
  }
};



// Функции для быстрого перехода
const goToFirstPage = () => {
  currentPage.value = 1;
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
};

const goToLastPage = () => {
  currentPage.value = totalPages.value;
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
};

const goToPrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value = currentPage.value - 1;
    saveFiltersToStorage(); // Сохраняем фильтры
    loadAccounts();
  }
};

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value = currentPage.value + 1;
    saveFiltersToStorage(); // Сохраняем фильтры
    loadAccounts();
  }
};



// Утилиты форматирования

const formatDateShort = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};












// Watcher больше не нужен, так как индивидуальная очистка фильтров отключена

// Убраны функции перетаскивания

const keepOpen = (event: Event) => {
  // Функция для предотвращения закрытия popup при наведении
  // Останавливаем всплытие события, чтобы tooltip не закрывался
  event.stopPropagation();
  event.preventDefault();
};

const positionPopupInViewport = (popup: HTMLElement | null) => {
  if (!popup) return;

  const rect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 20;

  let newX = rect.left;
  let newY = rect.top;

  // Горизонтальное позиционирование - центрируем относительно элемента
  const elementCenterX = rect.left + (rect.width / 2);
  newX = elementCenterX - (rect.width / 2);

  // Проверяем границы по горизонтали
  if (newX < margin) {
    newX = margin;
  }
  if (newX + rect.width > viewportWidth - margin) {
    newX = viewportWidth - rect.width - margin;
  }

  // Вертикальное позиционирование - ВСЕГДА СВЕРХУ
  const popupHeight = rect.height;
  // Высота строки таблицы ~50px (зарезервировано для расчётов)

  // ВСЕГДА показываем popup сверху элемента
  newY = rect.top - popupHeight - 15; // 15px отступ от элемента

  // Если popup выходит за верхнюю границу - сдвигаем вниз, но все равно сверху
  if (newY < margin) {
    newY = margin;
  }

  // Проверяем, не выходит ли popup за нижнюю границу
  if (newY + popupHeight > viewportHeight - margin) {
    newY = viewportHeight - popupHeight - margin;
    // Логируем только при проблемах с позиционированием (для отладки)
    // console.log('Popup выходит за нижнюю границу, сдвигаем вверх:', newY);
  }

  // Применяем позицию
  const deltaX = newX - rect.left;
  const deltaY = newY - rect.top;

  // Убираем избыточные логи - оставляем только при необходимости отладки
  // console.log('Final positioning:', { newX, newY, deltaX, deltaY });

  popup.style.setProperty('--popup-x', `${deltaX}px`);
  popup.style.setProperty('--popup-y', `${deltaY}px`);
};

const onTooltipOpen = (isOpen: boolean) => {
  if (isOpen) {
    // Небольшая задержка, чтобы popup успел отрендериться
    setTimeout(() => {
      const popups = document.querySelectorAll('.draggable-popup');
      popups.forEach(popup => {
        if (!(popup instanceof HTMLElement)) return;

        // Находим элемент, который вызвал popup
        const triggerElement = popup.closest('.v-tooltip')?.querySelector('[data-tooltip]') ||
          popup.closest('.v-tooltip')?.querySelector('td');

        if (triggerElement) {
          const triggerRect = triggerElement.getBoundingClientRect();
          console.log('Trigger element found:', triggerRect);

          // Определяем позицию элемента в списке
          const tableRows = document.querySelectorAll('tbody tr');
          const currentRow = triggerElement.closest('tr');
          if (!currentRow) return;
          const rowIndex = Array.from(tableRows).indexOf(currentRow);
          const totalRows = tableRows.length;
          const isLastTwoRows = rowIndex >= totalRows - 2;

          console.log('Row position:', { rowIndex, totalRows, isLastTwoRows });

          // Позиционируем popup относительно элемента-триггера
          const popupRect = popup.getBoundingClientRect();
          const popupHeight = popupRect.height;
          const margin = 20;

          // Горизонтальное позиционирование - центрируем относительно элемента
          const elementCenterX = triggerRect.left + (triggerRect.width / 2);
          let newX = elementCenterX - (popupRect.width / 2);

          // Проверяем границы по горизонтали
          if (newX < margin) {
            newX = margin;
          }
          if (newX + popupRect.width > window.innerWidth - margin) {
            newX = window.innerWidth - popupRect.width - margin;
          }

          // Вертикальное позиционирование
          let newY;

          if (isLastTwoRows) {
            // Для последних 2 строк - ВСЕГДА СВЕРХУ с большим отступом (как у третьей позиции снизу)
            newY = triggerRect.top - popupHeight - 30; // Увеличенный отступ для последних строк
            console.log('Last two rows - positioning above with extra margin:', newY);
          } else {
            // Для остальных строк - стандартное позиционирование
            newY = triggerRect.top - popupHeight - 15;
            console.log('Regular positioning above:', newY);
          }

          // Если popup выходит за верхнюю границу
          if (newY < margin) {
            newY = margin;
            console.log('Popup выходит за верхнюю границу, сдвигаем к верху экрана:', newY);
          }

          // Применяем позицию
          const deltaX = newX - popupRect.left;
          const deltaY = newY - popupRect.top;

          console.log('Custom positioning:', {
            triggerRect,
            popupRect,
            newX,
            newY,
            deltaX,
            deltaY,
            isLastTwoRows
          });

          popup.style.setProperty('--popup-x', `${deltaX}px`);
          popup.style.setProperty('--popup-y', `${deltaY}px`);
        } else {
          // Fallback к стандартному позиционированию
          positionPopupInViewport(popup);
        }
      });
    }, 150); // Увеличиваем задержку для более надежного позиционирования
  }
};

const closePopup = () => {
  // Закрываем все активные popup
  const popups = document.querySelectorAll('.draggable-popup');
  popups.forEach(popup => {
    if (popup instanceof HTMLElement) {
      popup.style.display = 'none';
    }
  });
};

// Lifecycle hooks
onMounted(() => {
  // Восстанавливаем фильтры из localStorage перед загрузкой данных
  loadFiltersFromStorage(); // Результат не используется — важен сам факт вызова

  // Подхватываем ?search=... из URL (например, из глобального поиска на дашборде)
  if (route.query.search && typeof route.query.search === 'string') {
    searchQuery.value = route.query.search;
  }

  // Немедленная загрузка данных при первой загрузке страницы
  loadAccounts();
  loadWialonAccounts(); // Загружаем аккаунты Wialon
  loadStats();
  loadParentAccounts(); // Загружаем список родительских аккаунтов

  // Запускаем автоматическое обновление каждую минуту (начинается после первой загрузки)
  startAutoRefresh();

  // Добавляем обработчик изменения размера окна
  window.addEventListener('resize', handleWindowResize);

  // LAZY LOADING: Загружаем статистику для видимых строк после инициализации
  setTimeout(() => {
    loadVisibleObjectsStats();

    // Добавляем обработчик скролла на таблицу
    const table = document.querySelector('.accounts-table .v-table__wrapper');
    if (table) {
      table.addEventListener('scroll', loadVisibleObjectsStats);
    }
  }, 1500); // Даём время на загрузку данных Wialon
});

onUnmounted(() => {
  stopAutoRefresh();
  // Удаляем обработчики при размонтировании компонента
  window.removeEventListener('resize', handleWindowResize);

  // Удаляем обработчик скролла lazy loading
  const table = document.querySelector('.accounts-table .v-table__wrapper');
  if (table) {
    table.removeEventListener('scroll', loadVisibleObjectsStats);
  }
});

const handleWindowResize = () => {
  const popups = document.querySelectorAll('.draggable-popup');
  popups.forEach(popup => {
    if (popup instanceof HTMLElement) {
      positionPopupInViewport(popup);
    }
  });
};

// Методы
</script>

<style scoped>
.accounts-page {
  padding: 0 24px 24px 24px;
  /* Убираем верхний отступ */
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* Заголовок в самом верху страницы */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  /* Уменьшаем отступ снизу */
  padding: 0;
  /* Убираем все отступы */
  margin-top: 0;
  /* Убираем отступ сверху */
}

.page-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  /* Уменьшаем промежуток */
}

.page-icon {
  color: var(--apple-blue);
  font-size: 24px !important;
  /* Уменьшаем размер иконки */
}

.page-title {
  font-size: 1.5rem;
  /* Уменьшаем размер шрифта */
  font-weight: 600;
  /* Уменьшаем жирность */
  margin: 0;
  color: var(--apple-text-primary);
  line-height: 1.2;
  /* Уменьшаем межстрочный интервал */
}

.page-subtitle {
  font-size: 0.85rem;
  /* Уменьшаем размер шрифта */
  color: var(--apple-text-secondary);
  margin: 2px 0 0 0;
  /* Уменьшаем отступ сверху */
  line-height: 1.2;
  /* Уменьшаем межстрочный интервал */
}


/* Статистика в стиле /users */
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stat-card {
  height: 100%;
}

/* Фильтры в стиле /users */
.filters-card {
  margin-bottom: 24px;
}

.filters-content {
  padding: 20px 0 0 0;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  margin-top: -20px;
  width: 100%;
  padding: 0 0 0px 0;
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.filter-search {
  flex: 3;
  display: flex;
  align-items: center;
  min-width: 0;
}

.filter-create,
.filter-clear {
  flex-shrink: 0;
  flex-grow: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  width: 44px;
  min-width: 44px;
  max-width: 44px;
}

.filter-create,
.filter-clear {
  margin-top: -20px;
}

.search-chips-container {
  width: 100%;
  margin-top: 8px;
}

.search-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Стили для выравнивания высоты элементов фильтров */
.filters-row .v-select {
  width: 100%;
  flex: 1;
}

.search-field {
  width: 100%;
  flex: 1;
}

.search-field :deep(.v-field) {
  height: 44px;
  min-height: 44px;
  border-radius: 10px !important;
  border: 1px solid rgba(0, 0, 0, 0.23) !important;
  background-color: white !important;
}

.search-field :deep(.v-field--focused) {
  border-color: rgba(0, 0, 0, 0.87) !important;
  box-shadow: none !important;
}

.filters-row :deep(.v-field) {
  height: 44px;
  min-height: 44px;
  border-radius: 10px !important;
}



/* Стили для кнопок */
.filter-clear :deep(.v-btn) {
  height: 44px !important;
  min-height: 44px !important;
  width: 44px !important;
  min-width: 44px !important;
  padding: 0 !important;
  border-radius: 10px !important;
}

/* Специальные стили для кнопки Создать */
.create-button {
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  border-radius: 10px !important;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3) !important;
  transition: all 0.2s ease !important;
}

.create-button:hover {
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4) !important;
  transform: translateY(-1px) !important;
}

.create-button :deep(.v-icon) {
  color: white !important;
  font-size: 20px !important;
}

.filter-create :deep(.v-btn .v-icon),
.filter-clear :deep(.v-btn .v-icon) {
  font-size: 20px !important;
}

.filter-clear :deep(.v-btn) {
  width: 44px !important;
  min-width: 44px !important;
}

.filter-create :deep(.v-btn .v-btn__content),
.filter-clear :deep(.v-btn .v-btn__content) {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Анимация для активной кнопки очистки фильтров */
.filter-clear-active {
  position: relative;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3) !important;
  animation: pulse-filter 2s infinite;
}

@keyframes pulse-filter {
  0% {
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  }

  50% {
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.5);
  }

  100% {
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  }
}

/* Стили для кнопки сброса фильтров */
.filter-clear :deep(.v-btn) {
  transition: all 0.3s ease;
}

.filter-clear :deep(.v-btn:hover) {
  transform: scale(1.05);
}


/* Стили для группы фильтра с кнопкой сброса */
.d-flex.align-center.gap-2 {
  gap: 8px;
}

.flex-grow-1 {
  flex-grow: 1;
}

.flex-shrink-0 {
  flex-shrink: 0;
}


/* Таблица в стиле /users */
.accounts-table-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  /* Для позиционирования индикатора */
}

/* Индикатор фонового обновления Wialon данных */
.wialon-refresh-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  opacity: 0.8;
}

.accounts-table {
  background: transparent;
}

.accounts-table :deep(.v-data-table__wrapper) {
  border-radius: 12px;
  overflow: hidden;
}

.accounts-table :deep(.v-data-table-header__content) {
  font-weight: 600;
  color: var(--text-primary);
  text-align: center !important;
  justify-content: center;
}

.accounts-table :deep(.v-data-table__td) {
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

/* Динамические колонки - автоматическая ширина по содержимому */
.accounts-table :deep(.v-data-table__th),
.accounts-table :deep(.v-data-table__td) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center !important;
  vertical-align: middle;
}

/* Колонка № - фиксированная ширина */
.accounts-table :deep(.v-data-table__th:first-child),
.accounts-table :deep(.v-data-table__td:first-child) {
  width: 60px !important;
  min-width: 60px;
  max-width: 60px;
  text-align: center;
}

/* Колонка ID - минимальная ширина */
.accounts-table :deep(.v-data-table__th:nth-child(2)),
.accounts-table :deep(.v-data-table__td:nth-child(2)) {
  width: auto;
  min-width: 60px;
  max-width: 100px;
}

/* Колонка Компания - фиксированная ширина 30% */
.accounts-table :deep(.v-data-table__th:nth-child(3)),
.accounts-table :deep(.v-data-table__td:nth-child(3)) {
  width: 30% !important;
  min-width: 200px;
  white-space: normal;
  word-wrap: break-word;
}

/* Колонка Тип - компактная ширина */
.accounts-table :deep(.v-data-table__th:nth-child(4)),
.accounts-table :deep(.v-data-table__td:nth-child(4)) {
  width: auto;
  min-width: 80px;
  max-width: 120px;
}

/* Колонка Объекты - компактная ширина */
.accounts-table :deep(.v-data-table__th:nth-child(5)),
.accounts-table :deep(.v-data-table__td:nth-child(5)) {
  width: auto;
  min-width: 100px;
  max-width: 140px;
}

/* Колонка Статус - компактная ширина */
.accounts-table :deep(.v-data-table__th:nth-child(6)),
.accounts-table :deep(.v-data-table__td:nth-child(6)) {
  width: auto;
  min-width: 80px;
  max-width: 120px;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}

/* Колонка Создан - средняя ширина */
.accounts-table :deep(.v-data-table__th:nth-child(7)),
.accounts-table :deep(.v-data-table__td:nth-child(7)) {
  width: auto;
  min-width: 100px;
  max-width: 150px;
}

/* Колонка Действия - фиксированная ширина */
.accounts-table :deep(.v-data-table__th:last-child),
.accounts-table :deep(.v-data-table__td:last-child) {
  width: auto;
  min-width: 120px;
  max-width: 180px;
}

/* Стили для номера строки */
.row-number {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.9em;
}

/* Центрирование всех элементов в ячейках */
.accounts-table :deep(.v-data-table__td)>* {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

/* Центрирование текстовых элементов */
.accounts-table :deep(.v-data-table__td) span,
.accounts-table :deep(.v-data-table__td) div {
  display: inline-block;
  text-align: center;
}

/* Центрирование элементов с tooltip */
.accounts-table :deep(.v-data-table__td) .v-tooltip {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.accounts-table :deep(.v-data-table__td) .v-tooltip .v-tooltip__activator {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.custom-pagination-bottom {
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
  /* Расширяем блок пагинации */
  min-height: 60px;
  padding: 20px 0;
}

/* Расширенная пагинация */
.compact-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 20px 24px;
  flex-wrap: nowrap;
  white-space: nowrap;
  /* Увеличиваем высоту блока */
  min-height: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 0 16px;
}

.items-select {
  min-width: 60px !important;
  /* Увеличиваем минимальную ширину */
  width: fit-content !important;
  /* Ширина по содержимому */
  max-width: 120px !important;
  /* Максимальная ширина */
  flex-shrink: 0;
  /* Улучшаем внешний вид */
  height: 40px;
}

/* Принудительное переопределение стилей Vuetify */
.items-select :deep(.v-field) {
  min-width: 50px !important;
  width: auto !important;
}

.items-select :deep(.v-field__input) {
  min-width: 0 !important;
  width: auto !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.items-select :deep(.v-field__append-inner) {
  padding-left: 4px !important;
}

.items-select :deep(.v-select__selection) {
  max-width: none !important;
  min-width: 0 !important;
}

.range-info {
  font-size: 0.9rem;
  /* Увеличиваем размер шрифта */
  color: #555;
  /* Улучшаем цвет */
  flex-shrink: 0;
  min-width: 120px;
  /* Увеличиваем минимальную ширину */
  text-align: center;
  font-weight: 600;
  /* Увеличиваем жирность */
  padding: 8px 12px;
  /* Добавляем отступы */
  background-color: #f0f0f0;
  /* Добавляем фон */
  border-radius: 6px;
  /* Скругленные углы */
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  /* Увеличиваем промежуток */
  flex-shrink: 0;
  padding: 4px;
  /* Добавляем отступы */
  background-color: #f0f0f0;
  /* Добавляем фон */
  border-radius: 6px;
  /* Скругленные углы */
}

.page-info {
  font-size: 0.9rem;
  /* Увеличиваем размер шрифта */
  color: #555;
  /* Улучшаем цвет */
  font-weight: 700;
  /* Увеличиваем жирность */
  min-width: 50px;
  /* Увеличиваем минимальную ширину */
  text-align: center;
  padding: 8px 12px;
  /* Увеличиваем отступы */
  background-color: #e8e8e8;
  /* Добавляем фон */
  border-radius: 6px;
  /* Скругленные углы */
}

/* Улучшенные кнопки навигации */
.nav-controls .v-btn {
  min-width: 32px !important;
  /* Увеличиваем размер */
  width: 32px;
  height: 32px;
  border-radius: 6px;
  /* Скругленные углы */
  background-color: white;
  /* Белый фон */
  border: 1px solid #ddd;
  /* Добавляем рамку */
}

.accounts-table {
  transition: opacity 0.3s ease-in-out;
}

.accounts-table.updating {
  opacity: 0.8;
}

/* Адаптивность в стиле /users */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 0;
  }

  .filter-item,
  .filter-search {
    flex: none;
  }

  /* Адаптивные колонки для мобильных устройств */
  .accounts-table :deep(.v-data-table__th),
  .accounts-table :deep(.v-data-table__td) {
    min-width: 60px;
    max-width: none;
  }

  /* На мобильных устройствах колонка Компания получает больше места */
  .accounts-table :deep(.v-data-table__th:nth-child(2)),
  .accounts-table :deep(.v-data-table__td:nth-child(2)) {
    width: 40% !important;
    min-width: 150px;
  }

  .filter-create,
  .filter-clear {
    align-self: flex-end;
    padding-top: 0;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Темная тема */
.accounts-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

[data-theme="dark"] .accounts-page {
  background-color: #1a1a1a;
}

[data-theme="dark"] .page-icon {
  color: #007AFF;
}

[data-theme="dark"] .page-title {
  color: #ffffff;
}

[data-theme="dark"] .page-subtitle {
  color: #8e8e93;
}

[data-theme="dark"] .accounts-table :deep(.v-data-table__td) {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .accounts-table-card {
  background-color: #2c2c2e;
  border: 1px solid #3a3a3c;
}

[data-theme="dark"] .accounts-table :deep(.v-data-table-header__content) {
  color: #ffffff;
}

[data-theme="dark"] .accounts-table :deep(.v-data-table__td) {
  color: #ffffff;
  border-bottom-color: #3a3a3c;
}

[data-theme="dark"] .accounts-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(0, 122, 255, 0.1) !important;
}

[data-theme="dark"] .company-name-compact {
  color: #ffffff;
}

[data-theme="dark"] .id-minimal {
  color: #8e8e93;
  background-color: rgba(142, 142, 147, 0.12);
}

[data-theme="dark"] .id-minimal:hover {
  color: #ffffff;
  background-color: rgba(142, 142, 147, 0.2);
}


[data-theme="dark"] .type-minimal {
  color: #ffffff;
}

[data-theme="dark"] .status-minimal {
  color: #ffffff;
}

[data-theme="dark"] .status-minimal.status-inactive {
  color: #ff453a;
}

[data-theme="dark"] .blocking-minimal {
  color: #ffffff;
}

[data-theme="dark"] .creation-minimal {
  color: #ffffff;
}

[data-theme="dark"] .objects-compact {
  background: linear-gradient(135deg, #3a3a3c, #2c2c2e);
  border-color: #3a3a3c;
}

[data-theme="dark"] .objects-compact:hover {
  background: linear-gradient(135deg, #007AFF, #0056CC);
  border-color: #007AFF;
}

[data-theme="dark"] .objects-active {
  color: #32d74b;
}

[data-theme="dark"] .objects-total {
  color: #007AFF;
}

[data-theme="dark"] .deleted-count {
  color: #ff453a;
}

[data-theme="dark"] .compact-pagination {
  background-color: #2c2c2e;
  border: 1px solid #3a3a3c;
}

[data-theme="dark"] .range-info {
  color: #8e8e93;
  background-color: #3a3a3c;
}

[data-theme="dark"] .page-info {
  color: #ffffff;
  background-color: #3a3a3c;
}

[data-theme="dark"] .nav-controls {
  background-color: #3a3a3c;
}

[data-theme="dark"] .nav-controls .v-btn {
  background-color: #2c2c2e;
  border-color: #3a3a3c;
  color: #ffffff;
}

[data-theme="dark"] .nav-controls .v-btn:hover {
  background-color: #3a3a3c;
  border-color: #007AFF;
}

[data-theme="dark"] .search-field :deep(.v-field) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .search-field :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .search-field :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .filters-row :deep(.v-field) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .filters-row :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .filters-row :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .filters-row :deep(.v-field--focused) {
  border-color: #007AFF !important;
}

[data-theme="dark"] .items-select :deep(.v-field) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .items-select :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .items-select :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .popup-header {
  background: linear-gradient(135deg, #2c2c2e 0%, #1a1a1a 100%);
  border-bottom-color: #3a3a3c;
}

[data-theme="dark"] .popup-title {
  color: #ffffff;
}

[data-theme="dark"] .popup-content {
  background-color: #1a1a1a;
}

[data-theme="dark"] .field-label {
  color: #8e8e93;
}

[data-theme="dark"] .field-value {
  color: #ffffff;
}

[data-theme="dark"] .hierarchy-value {
  color: #8e8e93;
}

[data-theme="dark"] .draggable-popup {
  background-color: #1a1a1a;
  border: 1px solid #3a3a3c;
}

/* Темная тема для карточек статистики */
[data-theme="dark"] .stat-card {
  background-color: #2c2c2e;
  border: 1px solid #3a3a3c;
}

/* Темная тема для карточки фильтров */
[data-theme="dark"] .filters-card {
  background-color: #2c2c2e;
  border: 1px solid #3a3a3c;
}

/* Темная тема для кнопок */
[data-theme="dark"] .create-button {
  background-color: #007AFF !important;
  color: #ffffff !important;
}

[data-theme="dark"] .create-button:hover {
  background-color: #0056CC !important;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4) !important;
}

[data-theme="dark"] .filter-clear :deep(.v-btn) {
  background-color: #ff9500 !important;
  color: #ffffff !important;
}

[data-theme="dark"] .filter-clear :deep(.v-btn:hover) {
  background-color: #cc7700 !important;
}

/* Темная тема для чипов поиска */
[data-theme="dark"] .search-chips-container .v-chip {
  background-color: #007AFF !important;
  color: #ffffff !important;
}

/* Темная тема для меню действий */
[data-theme="dark"] .actions-row .v-btn {
  color: #ffffff !important;
}

[data-theme="dark"] .actions-row .v-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Темная тема для списка меню */
[data-theme="dark"] .actions-row .v-list {
  background-color: #2c2c2e !important;
  border: 1px solid #3a3a3c !important;
}

[data-theme="dark"] .actions-row .v-list-item {
  color: #ffffff !important;
}

[data-theme="dark"] .actions-row .v-list-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

[data-theme="dark"] .actions-row .v-list-item.text-error {
  color: #ff453a !important;
}

/* Темная тема для диалогов */
[data-theme="dark"] .v-dialog .v-card {
  background-color: #2c2c2e !important;
  border: 1px solid #3a3a3c !important;
}

[data-theme="dark"] .v-dialog .v-card-title {
  color: #ffffff !important;
  border-bottom-color: #3a3a3c !important;
}

[data-theme="dark"] .v-dialog .v-card-text {
  color: #ffffff !important;
}

[data-theme="dark"] .v-dialog .v-text-field :deep(.v-field) {
  background-color: #1a1a1a !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .v-dialog .v-text-field :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .v-dialog .v-text-field :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .v-dialog .v-textarea :deep(.v-field) {
  background-color: #1a1a1a !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .v-dialog .v-textarea :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .v-dialog .v-textarea :deep(.v-label) {
  color: #8e8e93 !important;
}

/* Темная тема для snackbar */
[data-theme="dark"] .v-snackbar {
  background-color: #2c2c2e !important;
  color: #ffffff !important;
  border: 1px solid #3a3a3c !important;
}

/* Темная тема для tooltip */
[data-theme="dark"] .v-tooltip :deep(.v-overlay__content) {
  background-color: #2c2c2e !important;
  color: #ffffff !important;
  border: 1px solid #3a3a3c !important;
}

/* Темная тема для select dropdown */
[data-theme="dark"] .v-select :deep(.v-list) {
  background-color: #2c2c2e !important;
  border: 1px solid #3a3a3c !important;
}

[data-theme="dark"] .v-select :deep(.v-list-item) {
  color: #ffffff !important;
}

[data-theme="dark"] .v-select :deep(.v-list-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Темная тема для badge */
[data-theme="dark"] .v-badge :deep(.v-badge__badge) {
  background-color: #ff453a !important;
  color: #ffffff !important;
}

/* Плавные переходы для строк таблицы */
.accounts-table :deep(.v-data-table__tr) {
  transition: all 0.3s ease-in-out;
}

.accounts-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(25, 118, 210, 0.04) !important;
}

/* Анимация для обновляющихся элементов */
.stat-value {
  transition: all 0.3s ease-in-out;
  display: inline-block;
}

.stat-value.updating {
  transform: scale(1.05);
  color: #ff9800;
}


/* Компактное отображение названия компании */
.company-name-compact {
  font-weight: 500;
  color: #333;
  padding: 4px 8px;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Стили для легенды компании */
.company-legend {
  padding: 12px;
  min-width: 350px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Цветовые индикаторы для компании */
.legend-color.company-status {
  background: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.legend-color.hierarchy-status {
  background: #9c27b0;
  box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
}

.legend-color.parent-status {
  background: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
}

.admin-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Базовые стили для всех компактных элементов */
.compact-base {
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-base:hover {
  transform: scale(1.02);
}

/* Минималистичное отображение ID */
.id-minimal {
  font-weight: 600;
  font-size: 0.8rem;
  cursor: help;
  transition: all 0.2s ease;
  padding: 2px 6px;
  border-radius: 6px;
  color: #666;
  background-color: rgba(0, 0, 0, 0.04);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.id-minimal:hover {
  background-color: rgba(0, 0, 0, 0.08);
  color: #333;
  transform: scale(1.05);
}


/* Плавный переход ширины колонки */
.accounts-table .v-data-table__td {
  transition: width 0.3s ease;
}

/* Минималистичное отображение типа аккаунта */
.type-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  padding: 2px 4px;
  color: #333;
}

.type-minimal.type-partner {
  color: #333;
}

.type-minimal.type-client {
  color: #333;
}




/* Отображение объектов */
.no-objects {
  font-size: 0.75rem;
  color: #9e9e9e;
  font-style: italic;
}

.objects-display {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.875rem;
  font-weight: 500;
}

.objects-active {
  color: #2e7d32;
}

.objects-total {
  color: #1976d2;
}

.objects-separator {
  color: #666;
  margin: 0 1px;
}

.objects-deleted {
  color: #d32f2f;
}

.deleted-count {
  color: #d32f2f;
}

/* Минималистичное отображение статуса */
.status-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  padding: 2px 4px;
  color: #333;
}

.status-minimal.status-active {
  color: #333;
}

.status-minimal.status-inactive {
  color: #d32f2f;
}

/* Стили для иконок статуса */
.status-icon {
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
}

.status-icon:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}

/* Дополнительные стили для центрирования иконок в ячейке */
.accounts-table :deep(.v-data-table__td) .v-tooltip .v-tooltip__activator {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
  height: 100% !important;
}

/* Минималистичное отображение блокировки */
.blocking-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  padding: 2px 4px;
  color: #333;
}

.blocking-minimal.blocking-critical {
  color: #333;
}

.blocking-minimal.blocking-warning {
  color: #333;
}

.blocking-minimal.blocking-normal {
  color: #333;
}

.blocking-minimal.blocking-none {
  color: #333;
}

/* Минималистичное отображение даты создания */
.creation-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  padding: 2px 4px;
  color: #333;
}

/* Ряд действий */
.actions-row {
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: center;
}

.actions-row .v-btn {
  min-width: 24px !important;
  width: 24px;
  height: 24px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.actions-row .v-btn:hover {
  opacity: 1;
}

/* Стили для меню дополнительных действий */
.actions-row .v-menu .v-list {
  min-width: 200px;
}

.actions-row .v-list-item {
  min-height: 36px;
  padding: 8px 16px;
}

.actions-row .v-list-item .v-list-item__prepend {
  margin-inline-end: 12px;
}

.actions-row .v-list-item .v-list-item__content {
  font-size: 14px;
}

.actions-row .v-list-item.text-error {
  color: rgb(var(--v-theme-error)) !important;
}

.actions-row .v-list-item.text-error .v-list-item__prepend .v-icon {
  color: rgb(var(--v-theme-error)) !important;
}



/* Компактное отображение статуса аккаунта */
.status-compact {
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-compact.status-active {
  color: #1b5e20;
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border-color: #4caf50;
}

.status-compact.status-active:hover {
  background: linear-gradient(135deg, #c8e6c9, #a5d6a7);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.status-compact.status-inactive {
  color: #c62828;
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border-color: #f44336;
}

.status-compact.status-inactive:hover {
  background: linear-gradient(135deg, #ffcdd2, #ef9a9a);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}


/* Базовые стили для всех легенд */
.legend-base {
  padding: 12px;
  min-width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Стили для легенды ID */
.id-legend {
  padding: 12px;
  min-width: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Стили для легенды типа аккаунта */
.type-legend {
  padding: 12px;
  min-width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}


/* Стили для легенды статуса */
.status-legend {
  padding: 12px;
  min-width: 350px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}


.legend-color.admin-status-active {
  background: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.legend-color.admin-status-inactive {
  background: #f44336;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
}

/* Цветовые индикаторы для типа аккаунта */
.legend-color.type-status-partner {
  background: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.legend-color.type-status-client {
  background: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

/* Цветовые индикаторы для статуса аккаунта */
.legend-color.account-status-active {
  background: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.legend-color.account-status-inactive {
  background: #f44336;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
}


.legend-description {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
  text-align: left;
}

.legend-extra {
  margin-top: 6px;
  font-size: 0.75rem;
  color: #888;
  font-style: italic;
}

/* Компактное отображение объектов */
.objects-compact {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
  border: 1px solid #ddd;
  cursor: help;
  transition: all 0.2s ease;
  font-family: 'Roboto Mono', monospace;
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0 auto;
}

.objects-compact:hover {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-color: #1976d2;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
}

.objects-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.objects-active {
  color: #2e7d32;
  font-weight: 700;
}

.objects-total {
  color: #1976d2;
  font-weight: 600;
}

.objects-separator {
  color: #666;
  margin: 0 2px;
  font-weight: 400;
}

.objects-deleted {
  display: inline-flex;
  align-items: center;
}

.deleted-count {
  color: #d32f2f;
  font-weight: 700;
}

/* Стили для легенды в тултипе */
.objects-legend {
  padding: 12px;
  min-width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.legend-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1976d2;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.legend-color.active {
  background: #2e7d32;
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
}

.legend-color.total {
  background: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.legend-color.deleted {
  background: #d32f2f;
  box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.2);
}

.legend-text {
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
}

.legend-formula {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
  font-size: 0.8rem;
  color: #666;
  text-align: center;
}

.legend-formula code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  color: #1976d2;
  font-weight: 600;
}

/* Компактное отображение блокировки */
.blocking-compact {
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blocking-compact.blocking-critical {
  color: #c62828;
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border-color: #f44336;
}

.blocking-compact.blocking-critical:hover {
  background: linear-gradient(135deg, #ffcdd2, #ef9a9a);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.blocking-compact.blocking-warning {
  color: #e65100;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border-color: #ff9800;
}

.blocking-compact.blocking-warning:hover {
  background: linear-gradient(135deg, #ffe0b2, #ffcc02);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.blocking-compact.blocking-normal {
  color: #0d47a1;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-color: #2196f3;
}

.blocking-compact.blocking-normal:hover {
  background: linear-gradient(135deg, #bbdefb, #90caf9);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.blocking-compact.blocking-none {
  color: #1b5e20;
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border-color: #4caf50;
}

.blocking-compact.blocking-none:hover {
  background: linear-gradient(135deg, #c8e6c9, #a5d6a7);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* Стили для легенды блокировки */
.blocking-legend {
  padding: 12px;
  min-width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Цветовые индикаторы для статуса блокировки */
.legend-color.blocking-status-critical {
  background: #f44336;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
}

.legend-color.blocking-status-warning {
  background: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
}

.legend-color.blocking-status-normal {
  background: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.legend-color.blocking-status-none {
  background: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.legend-color.days-indicator {
  background: #9c27b0;
  box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
}

/* Компактное отображение даты создания */
.creation-compact {
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #5e35b1;
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
  border-color: #9c27b0;
}

.creation-compact:hover {
  background: linear-gradient(135deg, #e1bee7, #ce93d8);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3);
}

/* Стили для легенды даты создания */
.creation-legend {
  padding: 12px;
  min-width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Цветовой индикатор для даты создания */
.legend-color.creation-status {
  background: #9c27b0;
  box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: rotate 1s linear infinite;
}

/* Стили для подсветки активных фильтров */
.filter-active {
  position: relative;
}

.filter-active:before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  border-radius: 6px;
  z-index: -1;
  opacity: 0.1;
  transition: opacity 0.3s ease;
}

.filter-active:hover:before {
  opacity: 0.15;
}

/* Унификация размеров кнопок и иконок */
.d-flex.justify-end.align-start.gap-3 .v-btn {
  min-width: 40px !important;
  width: 40px !important;
  height: 40px !important;
}


/* Стили для активной кнопки очистки фильтров */
.filter-clear-active {
  position: relative;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3) !important;
  animation: pulse-filter 2s infinite;
}

@keyframes pulse-filter {
  0% {
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
  }

  50% {
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.5);
  }

  100% {
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
  }
}

/* Стили для чипов поиска компаний */
.search-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.search-chips .v-chip {
  font-size: 0.75rem;
  height: 24px;
  transition: all 0.2s ease;
}

.search-chips .v-chip:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.3);
}

/* Дополнительная подсветка для активных полей */
.filter-active :deep(.v-field) {
  border-color: #1976d2 !important;
  border-width: 2px !important;
}

.filter-active :deep(.v-field--focused) {
  border-color: #1976d2 !important;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2) !important;
}

.filter-active :deep(.v-label) {
  color: #1976d2 !important;
  font-weight: 600 !important;
}

/* Стили для всплывающего меню в стиле скриншота */
.objects-popup,
.id-popup {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 0;
  min-width: 380px;
  max-width: 450px;
  border: none;
  /* Убираем рамку */
}

.popup-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px 12px 0 0;
}

.popup-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.popup-icon .v-icon {
  color: white;
  font-size: 18px;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
}

.popup-actions {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.popup-action-btn {
  flex: 1;
  height: 36px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
  border: 1px solid #007AFF;
  color: #007AFF;
  background: white;
  transition: all 0.2s ease;
}

.popup-action-btn:hover {
  background: #007AFF;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.popup-content {
  padding: 20px;
}

.popup-field {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  min-height: 20px;
}

.popup-field:last-child {
  border-bottom: none;
}

.field-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  min-width: 140px;
  flex-shrink: 0;
  margin-right: 16px;
}

.field-value {
  font-size: 13px;
  color: #1a1a1a;
  font-weight: 600;
  text-align: right;
  flex: 1;
  word-break: break-word;
  line-height: 1.4;
  max-width: 200px;
}

/* Специальные стили для иерархии */
.hierarchy-field {
  align-items: flex-start;
}

.hierarchy-value {
  text-align: left !important;
  max-width: none !important;
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  font-size: 12px;
  color: #555;
}

.phone-link,
.email-link {
  color: #007AFF;
  text-decoration: underline;
  cursor: pointer;
}

.phone-link:hover,
.email-link:hover {
  color: #0056CC;
}

/* Цветовое кодирование для полей */
.text-success {
  color: #2e7d32 !important;
}

.text-error {
  color: #d32f2f !important;
}

.text-warning {
  color: #f57c00 !important;
}

/* Стили для tooltip */
.objects-tooltip :deep(.v-tooltip__content),
.id-tooltip :deep(.v-tooltip__content) {
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
  border: none !important;
}

.objects-tooltip :deep(.v-overlay__content),
.id-tooltip :deep(.v-overlay__content) {
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
  border: none !important;
}

/* Предотвращаем закрытие tooltip при наведении на содержимое */
.objects-tooltip :deep(.v-overlay),
.id-tooltip :deep(.v-overlay) {
  pointer-events: none !important;
}

.objects-tooltip :deep(.v-overlay .draggable-popup),
.id-tooltip :deep(.v-overlay .draggable-popup) {
  pointer-events: auto !important;
}

/* Дополнительные стили для предотвращения закрытия */
.objects-tooltip :deep(.v-tooltip__content),
.id-tooltip :deep(.v-tooltip__content) {
  pointer-events: auto !important;
}

.objects-tooltip :deep(.v-overlay__content),
.id-tooltip :deep(.v-overlay__content) {
  pointer-events: auto !important;
}

/* Стили для popup */
.draggable-popup {
  position: fixed !important;
  z-index: 9999 !important;
  /* Принудительная защита от исчезновения */
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  /* Плавное позиционирование */
  transform: translate(var(--popup-x, 0px), var(--popup-y, 0px));
  transition: transform 0.2s ease-out;
  /* Улучшенные стили для лучшей видимости */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: none;
  /* Убираем рамку */
  border-radius: 8px;
  background: white;
  /* Максимальная ширина для предотвращения перекрытия */
  max-width: 400px;
  min-width: 300px;
}

.draggable-header {
  user-select: none;
}

.close-btn {
  margin-left: auto;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.close-btn:hover {
  opacity: 1;
}

/* Дополнительные стили для предотвращения закрытия popup */
.objects-tooltip :deep(.v-overlay__backdrop),
.id-tooltip :deep(.v-overlay__backdrop) {
  pointer-events: none !important;
}

.objects-tooltip :deep(.v-overlay__scrim),
.id-tooltip :deep(.v-overlay__scrim) {
  pointer-events: none !important;
}

/* Убеждаемся, что popup остается открытым */
.draggable-popup:hover {
  pointer-events: auto !important;
}

.draggable-popup * {
  pointer-events: auto !important;
}

/* Стили для id-popup (используем те же стили что и objects-popup) */
.id-popup {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 0;
  min-width: 380px;
  max-width: 450px;
  border: none;
  /* Убираем рамку */
}

@media (max-width: 768px) {
  .accounts-page {
    padding: 0 16px 16px 16px;
    /* Убираем верхний отступ на мобильных */
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.25rem;
    /* Еще меньше на мобильных */
    line-height: 1.1;
  }

  .page-subtitle {
    font-size: 0.8rem;
    /* Еще меньше на мобильных */
    line-height: 1.1;
  }

  .page-header {
    margin-bottom: 12px;
    /* Еще меньше отступ на мобильных */
    padding: 0;
    /* Убираем все отступы на мобильных */
    margin-top: 0;
    /* Убираем отступ сверху на мобильных */
  }
}
</style>
