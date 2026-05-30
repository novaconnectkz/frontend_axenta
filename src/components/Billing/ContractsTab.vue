<template>
  <div class="contracts-tab">
    <!-- Фильтры -->
    <v-card variant="outlined" class="filters-card mb-4">
      <v-card-text class="pa-3">
        <!-- Flexbox-ряд как на «Учётных записях»: поля на всю ширину с минимальным
             отступом, кнопка сброса — inline в конце (не перекрывает поля). -->
        <div class="filters-row">
          <div class="filter-item filter-search">
            <v-text-field
              v-model="searchQuery"
              placeholder="Поиск по номеру, клиенту..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              rounded="lg"
            />
          </div>

          <div class="filter-item">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Статус"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              rounded="lg"
            />
          </div>

          <div class="filter-item">
            <v-select
              v-model="activeFilter"
              :items="activeOptions"
              label="Активность"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              rounded="lg"
            />
          </div>

          <div class="filter-item">
            <v-select
              v-model="contractTypeFilter"
              :items="CONTRACT_TYPE_OPTIONS"
              label="Тип договора"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              rounded="lg"
            />
          </div>

          <!-- Фильтр по менеджеру — только admin/superadmin -->
          <div v-if="canFilterManager" class="filter-item">
            <v-select
              v-model="managerFilter"
              :items="managerOptions"
              label="Менеджер"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              rounded="lg"
            />
          </div>

          <!-- Сброс фильтров — inline в конце ряда (стиль как на Учётных записях:
               оранжевая кнопка с белым счётчиком активных фильтров) -->
          <div class="filter-clear">
            <v-btn
              v-show="hasActiveFilters"
              icon="mdi-filter-off-outline"
              variant="flat"
              color="warning"
              density="comfortable"
              :class="{ 'filter-clear-active': hasActiveFilters }"
              title="Сбросить активные фильтры"
              @click="clearFilters"
            >
              <v-badge :content="activeFiltersCount" color="white" text-color="warning" inline />
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Таблица договоров с виртуальным скроллингом -->
    <v-card variant="outlined" v-if="filteredContracts.length > 0">
      <v-data-table
        :headers="headers"
        :items="filteredContracts"
        :loading="loading || loadingMore"
        v-model:sort-by="sortBy"
        v-model:page="currentPage"
        v-model="selectedIds"
        show-select
        item-value="id"
        class="contracts-table"
        no-data-text="Договоры не найдены"
        loading-text="Загрузка договоров..."
        density="compact"
        :items-per-page="hasSearch ? -1 : itemsPerPage"
        :items-per-page-options="hasSearch ? [] : [10, 25, 50, 100, 200, 500, 1000, -1]"
        :server-items-length="hasSearch ? filteredContracts.length : totalContracts"
        :height="600"
        fixed-header
        hide-default-footer
        @scroll="onTableScroll"
        @update:items-per-page="onItemsPerPageChange"
        @update:page="onPageChange"
        @update:sort-by="onSortChange"
      >
        <!-- Порядковый номер -->
        <template #item.sequential_number="{ index }">
          <div class="sequential-number">
            {{ index + 1 }}
          </div>
        </template>

        <!-- Дата создания -->
        <template #item.created_at="{ item }">
          <div class="created-date">
            {{ formatDate(item.created_at) }}
          </div>
        </template>

        <!-- Номер договора -->
        <template #item.number="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
          <v-chip 
                v-bind="props"
            size="small" 
            :color="getStatusColor(item.status)"
            variant="tonal"
            style="cursor: pointer;"
            @click="navigateToSubscriptions(item)"
          >
            {{ item.number }}
          </v-chip>
            </template>
            <span>{{ getStatusLabel(item.status) }}</span>
          </v-tooltip>
        </template>

        <!-- Тип договора -->
        <template #item.contract_type="{ item }">
          <v-tooltip :text="CONTRACT_TYPE_LABELS[(item.contract_type || 'client') as ContractType]" location="top">
            <template #activator="{ props }">
              <v-chip
                v-bind="props"
                size="small"
                :color="CONTRACT_TYPE_COLORS[(item.contract_type || 'client') as ContractType]"
                variant="tonal"
              >
                <v-icon size="small" :icon="CONTRACT_TYPE_ICONS[(item.contract_type || 'client') as ContractType]" />
              </v-chip>
            </template>
          </v-tooltip>
        </template>

        <!-- Клиент -->
        <template #item.title="{ item }">
          <div class="contract-client" lang="ru">{{ item.client_short_name || item.client_name }}</div>
        </template>

        <!-- Тарифный план -->
        <template #item.tariff_plan="{ item }">
          <!-- Для партнерских договоров показываем тариф из договора -->
          <template v-if="item.contract_type === 'partner' && item.tariff_plan">
            <v-chip size="small" color="purple" variant="tonal">
              {{ item.tariff_plan.name }}
            </v-chip>
            <div class="text-caption">
              {{ formatMoneyPlain(item.tariff_plan.price || 0) }}/мес
            </div>
          </template>
          <!-- Для клиентских договоров показываем тарифы из подписок -->
          <template v-else-if="contractTariffsMap.get(item.id)?.count > 1">
            <!-- Несколько тарифов -->
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-chip 
                  size="small" 
                  color="warning" 
                  variant="tonal" 
                  v-bind="props"
                >
                  <v-icon size="x-small" class="mr-1">mdi-layers-triple</v-icon>
                  {{ contractTariffsMap.get(item.id)?.count }} тарифа
                </v-chip>
              </template>
              <div class="pa-2">
                <div class="text-subtitle-2 mb-2">Активные тарифы:</div>
                <div 
                  v-for="(plan, index) in contractTariffsMap.get(item.id)?.uniquePlans" 
                  :key="plan.id"
                  class="mb-1"
                >
                  <strong>{{ index + 1 }}.</strong> {{ plan.name }} 
                  <span class="text-caption">({{ formatMoneyPlain(plan.price || 0) }}/мес)</span>
                </div>
              </div>
            </v-tooltip>
          </template>
          <template v-else-if="contractTariffsMap.get(item.id)?.count === 1">
            <!-- Один тариф из подписки -->
            <v-chip size="small" color="primary" variant="tonal">
              {{ contractTariffsMap.get(item.id)?.uniquePlans[0]?.name }}
            </v-chip>
            <div class="text-caption">
              {{ formatMoneyPlain(contractTariffsMap.get(item.id)?.uniquePlans[0]?.price || 0) }}/мес
            </div>
          </template>
          <template v-else>
            <!-- Нет активных подписок - не показываем тариф -->
            <v-chip size="small" color="grey" variant="tonal">
              Не указан
            </v-chip>
            <div class="text-caption text-medium-emphasis">
              Нет подписок
            </div>
          </template>
        </template>

        <!-- Период -->
        <template #item.period="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <div v-bind="props" style="cursor: help;">
                <!-- Для партнерских договоров показываем период до конца года -->
                <div v-if="item.contract_type === 'partner'">
                  <div class="text-body-2">
                    {{ getPartnerContractPeriod(item) }}
                  </div>
                  <div class="text-caption" style="color: #9c27b0;">
                    Пролонгация
                  </div>
                </div>
                <!-- Если нет активных подписок, не показываем период -->
                <div v-else-if="contractTariffsMap.get(item.id)?.count === 0 || !contractTariffsMap.get(item.id)">
                  <v-chip size="small" color="grey" variant="tonal">
                    Не указан
                  </v-chip>
                  <div class="text-caption text-medium-emphasis">
                    Нет подписок
                  </div>
                </div>
                <!-- Если период не установлен, показываем чип -->
                <div v-else-if="!item.start_date && !item.end_date">
                  <v-chip size="small" color="info" variant="tonal">
                    Не указан
                  </v-chip>
                  <div class="text-caption text-medium-emphasis">
                    Период не установлен
                  </div>
                </div>
                <!-- Если период установлен, показываем даты -->
                <div v-else>
                  <div class="text-body-2">
                    {{ formatPeriod(item.start_date, item.end_date) }}
                  </div>
                  <div class="text-caption" :class="getPeriodClass(item)">
                    {{ getPeriodText(item) }}
                  </div>
                </div>
              </div>
            </template>
            <template #default>
              <div class="period-tooltip">
                <div class="period-tooltip-title">Статус договора:</div>
                <div class="period-tooltip-content">
                  {{ getPeriodTooltipText(item) }}
                </div>
              </div>
            </template>
          </v-tooltip>
        </template>

        <!-- Стоимость -->
        <template #item.total_amount="{ item }">
          <div class="text-center">
            <!-- Для партнерских договоров - только количество объектов -->
            <template v-if="item.contract_type === 'partner'">
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <div class="amount-value" v-bind="props" style="cursor: help;">
                    {{ item.objects?.length || 0 }}
              </div>
                </template>
                <span>объекты</span>
              </v-tooltip>
            </template>
            <!-- Для клиентских договоров - стоимость и количество объектов -->
            <template v-else>
              <div class="amount-value">
                {{ formatMoneyPlain(calculateContractAmount(item)) }}
              </div>
              <!-- С всплывающим списком объектов -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <div class="text-caption objects-count" v-bind="props" style="cursor: help;">
                    {{ item.objects?.length || 0 }}
                  </div>
                </template>
              <template #default>
                <div v-if="item.objects && item.objects.length > 0" class="objects-tooltip">
                  <div class="objects-tooltip-title">Привязанные объекты:</div>
                  <div class="objects-tooltip-list">
                    <div 
                      v-for="obj in item.objects" 
                      :key="obj.id"
                      class="objects-tooltip-item"
                    >
                      <strong>{{ obj.name || `Объект #${obj.id}` }}</strong>
                    </div>
                    </div>
                  </div>
                <div v-else>объекты</div>
              </template>
            </v-tooltip>
            </template>
          </div>
        </template>

        <!-- Действия -->
        <template #item.ledger_balance="{ item }">
          <div class="ledger-balance-cell" style="cursor:pointer" @click="openLedgerHistory(item)">
            <span v-if="ledgerBalanceMap[item.id] === undefined" class="text-medium-emphasis">—</span>
            <span v-else :class="ledgerBalanceClass(ledgerBalanceMap[item.id])" class="font-weight-bold">
              {{ formatMoneyPlain(ledgerBalanceMap[item.id]) }}
            </span>
            <div v-if="ledgerBalanceMap[item.id] !== undefined" class="text-caption text-medium-emphasis">
              {{ Number(ledgerBalanceMap[item.id]) < 0 ? 'долг' : (Number(ledgerBalanceMap[item.id]) > 0 ? 'предоплата' : 'ноль') }}
            </div>
          </div>
        </template>

        <!-- Менеджер -->
        <template #item.manager_name="{ item }">
          <span v-if="item.manager_name" class="text-body-2">{{ item.manager_name }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.actions="{ item }">
          <div class="actions-cell">
            <v-tooltip text="Внести платёж">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-cash-plus"
                  size="small"
                  variant="text"
                  color="success"
                  @click="openPaymentDialog(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="Рассчитать стоимость">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-calculator"
                  size="small"
                  variant="text"
                  @click="calculateCost(item)"
                />
              </template>
            </v-tooltip>

            <v-menu location="bottom end">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                />
              </template>
              <v-list density="compact">
                <v-list-item @click="openPaymentDialog(item)">
                  <template #prepend>
                    <v-icon icon="mdi-cash-plus" size="small" color="success" />
                  </template>
                  <v-list-item-title>Внести платёж</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openLedgerHistory(item)">
                  <template #prepend>
                    <v-icon icon="mdi-history" size="small" />
                  </template>
                  <v-list-item-title>Лицевой счёт (история)</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="calculateCost(item)">
                  <template #prepend>
                    <v-icon icon="mdi-calculator" size="small" />
                  </template>
                  <v-list-item-title>Рассчитать стоимость</v-list-item-title>
                </v-list-item>

                <v-divider />

                <v-list-item @click="editContract(item)">
                  <template #prepend>
                    <v-icon icon="mdi-pencil" size="small" />
                  </template>
                  <v-list-item-title>Редактировать</v-list-item-title>
                </v-list-item>
                
                <v-list-item @click="deleteContract(item)">
                  <template #prepend>
                    <v-icon icon="mdi-delete" size="small" color="error" />
                  </template>
                  <v-list-item-title class="text-error">Удалить</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
      </v-data-table>
      
      <!-- Компактная пагинация справа (как на /accounts) -->
      <div v-if="!hasSearch && totalContracts > 0" class="compact-pagination">
        <v-select
          v-model="itemsPerPage"
          :items="[10, 25, 50, 100, 200, 500, 1000, -1]"
          variant="outlined"
          density="compact"
          class="items-select"
          @update:model-value="onItemsPerPageChange"
          hide-details
        />
        <span class="range-info">
          {{ itemsPerPage > 0 && itemsPerPage < 100000 
            ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalContracts)} из ${totalContracts}` 
            : `Все ${totalContracts} записей` }}
        </span>
        <div class="nav-controls">
          <v-btn
            icon="mdi-page-first"
            variant="text"
            size="x-small"
            :disabled="currentPage === 1 || loading"
            @click="currentPage = 1; onPageChange(1)"
            title="Первая"
          />
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            size="x-small"
            :disabled="currentPage === 1 || loading"
            @click="currentPage--; onPageChange(currentPage)"
            title="Предыдущая"
          />
          <span class="page-info">{{ currentPage }} / {{ Math.ceil(totalContracts / itemsPerPage) || 1 }}</span>
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            size="x-small"
            :disabled="currentPage * itemsPerPage >= totalContracts || loading"
            @click="currentPage++; onPageChange(currentPage)"
            title="Следующая"
          />
          <v-btn
            icon="mdi-page-last"
            variant="text"
            size="x-small"
            :disabled="currentPage * itemsPerPage >= totalContracts || loading"
            @click="currentPage = Math.ceil(totalContracts / itemsPerPage); onPageChange(currentPage)"
            title="Последняя"
          />
        </div>
      </div>
      
      <!-- Индикатор загрузки следующей страницы -->
      <v-card-text v-if="loadingMore" class="text-center pa-4">
        <v-progress-circular indeterminate color="primary" size="32" width="3" />
        <div class="text-caption text-medium-emphasis mt-2">
          Загрузка договоров... ({{ contracts.length }} из {{ totalContracts }})
        </div>
      </v-card-text>
      
      <!-- Сообщение о полной загрузке -->
      <v-card-text v-else-if="!hasMoreContracts && contracts.length > 0" class="text-center pa-2">
        <div class="text-caption text-medium-emphasis">
          ✅ Все договоры загружены ({{ contracts.length }})
        </div>
      </v-card-text>
    </v-card>

    <!-- Пустое состояние -->
    <v-card v-else variant="outlined" class="empty-state">
      <v-card-text class="text-center pa-6">
        <v-icon icon="mdi-file-document-multiple" size="48" class="mb-3" color="grey" />
        <h3 class="mb-2">Нет договоров</h3>
        <p class="text-medium-emphasis mb-4">
          Создайте первый договор для работы с биллингом
        </p>
      </v-card-text>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
      <template #actions>
        <v-btn color="white" variant="text" @click="showSnackbar = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Массовое: назначить менеджера -->
    <v-dialog v-model="bulkManagerDialog" max-width="440">
      <v-card>
        <v-card-title>Назначить менеджера ({{ selectedIds.length }})</v-card-title>
        <v-card-text>
          <v-select
            v-model="bulkManagerId"
            :items="managerOptions"
            label="Менеджер"
            variant="outlined"
            density="comfortable"
            clearable
            prepend-inner-icon="mdi-account-tie"
            hint="Пусто = снять менеджера"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="bulkManagerDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="bulkLoading" @click="applyBulkManager">Применить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Массовое: сменить статус -->
    <v-dialog v-model="bulkStatusDialog" max-width="440">
      <v-card>
        <v-card-title>Сменить статус ({{ selectedIds.length }})</v-card-title>
        <v-card-text>
          <v-select
            v-model="bulkStatusValue"
            :items="bulkStatusOptions"
            label="Статус"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-flag"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="bulkStatusDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="bulkLoading" :disabled="!bulkStatusValue" @click="applyBulkStatus">Применить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Массовое: удаление -->
    <v-dialog v-model="bulkDeleteDialog" max-width="460">
      <v-card>
        <v-card-title class="text-error">Удалить договоры ({{ selectedIds.length }})</v-card-title>
        <v-card-text>
          Удалить выбранные договоры? Действие переносит их в корзину.
          <div class="text-caption text-medium-emphasis mt-2">
            Активные договоры с привязанными объектами удалены не будут — сначала отвяжите объекты или смените статус.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="bulkDeleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" :loading="bulkLoading" @click="applyBulkDelete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог детализации расчета стоимости -->
    <v-dialog v-model="billingBreakdownDialog" max-width="1200px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center">
            <v-icon icon="mdi-calculator" class="mr-3" color="primary" />
            <div>
              <div class="text-h6">Детализация расчета стоимости</div>
              <div v-if="currentContractForBreakdown" class="text-caption text-medium-emphasis">
                Договор {{ currentContractForBreakdown.number }} • {{ currentContractForBreakdown.client_name }}
              </div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="billingBreakdownDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-0">
          <!-- Загрузка -->
          <div v-if="billingBreakdownLoading" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <div class="mt-4 text-medium-emphasis">Загрузка данных...</div>
          </div>

          <!-- Ошибка -->
          <div v-else-if="!billingBreakdownData && !billingBreakdownLoading" class="text-center pa-8">
            <v-icon icon="mdi-alert-circle" size="64" color="error" class="mb-4" />
            <div class="text-h6 mb-2">Не удалось загрузить данные</div>
            <div class="text-body-2 text-medium-emphasis mb-4">
              Проверьте, что у договора указаны даты начала и окончания, и есть активные подписки.
            </div>
            <v-btn color="primary" @click="calculateCost(currentContractForBreakdown)">
              <v-icon icon="mdi-refresh" class="mr-2" />
              Попробовать снова
            </v-btn>
          </div>

          <!-- Данные -->
          <div v-else-if="billingBreakdownData">
            <!-- Общая информация о договоре (закреплена при скролле) -->
            <div class="breakdown-summary-sticky">
            <v-card variant="flat" class="mb-2" color="blue-lighten-5">
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12" md="3">
                    <div class="text-caption text-medium-emphasis mb-1">Период договора</div>
                    <div class="text-body-1 font-weight-medium">
                      {{ formatDate(billingBreakdownData.contract.start_date) }} - 
                      {{ formatDate(billingBreakdownData.contract.end_date) }}
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="text-caption text-medium-emphasis mb-1">Всего месяцев</div>
                    <div class="text-h6 font-weight-bold">
                      {{ billingBreakdownData.summary.months_count }}
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="text-caption text-medium-emphasis mb-1">Баланс</div>
                    <div class="text-h6 font-weight-bold text-success">
                      {{ formatCurrency(billingBreakdownData.summary.total_paid) }}
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="text-caption text-medium-emphasis mb-1">К оплате</div>
                    <div class="text-h6 font-weight-bold text-warning">
                      {{ formatCurrency(billingBreakdownData.summary.total_future) }}
                    </div>
                  </v-col>
                </v-row>
                <!-- Мультивалюта (П5): применённый курс конверсии плана → валюту договора -->
                <v-row v-if="billingBreakdownData.currency_info?.multicurrency" class="mt-1">
                  <v-col cols="12">
                    <v-chip size="small" color="indigo" variant="tonal" prepend-icon="mdi-currency-eur">
                      План в {{ billingBreakdownData.currency_info.plan_currency }} →
                      договор в {{ billingBreakdownData.currency_info.contract_currency }}
                      · курс {{ billingBreakdownData.currency_info.last_rate }}
                      ({{ billingBreakdownData.currency_info.rate_source }},
                      {{ billingBreakdownData.currency_info.last_rate_date }})
                    </v-chip>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
            </div>

            <!-- Разбивка по месяцам -->
            <div class="px-4 pb-4">
              <div class="text-subtitle-1 font-weight-medium mb-3">Разбивка по месяцам</div>
              
              <v-expansion-panels variant="accordion" multiple>
                <v-expansion-panel
                  v-for="(month, index) in billingBreakdownData.monthly_charges"
                  :key="index"
                  :class="month.is_completed ? 'completed-month' : 'future-month'"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center justify-space-between" style="width: 100%;">
                      <div class="d-flex align-center">
                        <v-icon 
                          :icon="month.is_completed ? 'mdi-check-circle' : 'mdi-clock-outline'" 
                          :color="month.is_completed ? 'success' : 'warning'"
                          class="mr-3"
                          size="small"
                        />
                        <div>
                          <div class="font-weight-medium">{{ month.month_name }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ month.subscriptions.length }} подписок
                          </div>
                        </div>
                      </div>
                      <v-chip 
                        :color="month.is_completed ? 'success' : 'warning'"
                        variant="flat"
                        size="small"
                        class="mr-4"
                      >
                        {{ formatCurrency(month.total_amount) }}
                      </v-chip>
                    </div>
                  </v-expansion-panel-title>

                  <v-expansion-panel-text>
                    <v-table density="compact" class="breakdown-table">
                      <thead>
                        <tr>
                          <th class="text-left">Тариф</th>
                          <th class="text-left">Период</th>
                          <th class="text-center">Объекты</th>
                          <th class="text-left">Расчет</th>
                          <th class="text-right">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(sub, subIndex) in month.subscriptions" :key="subIndex">
                          <td>
                            <div class="font-weight-medium">{{ sub.plan_name }}</div>
                          </td>
                          <td>
                            <v-chip size="x-small" :color="getBillingPeriodColor(sub.billing_period)">
                              {{ getBillingPeriodLabel(sub.billing_period) }}
                            </v-chip>
                          </td>
                          <td class="text-center">
                            <v-chip size="x-small" variant="outlined">
                              {{ sub.objects_count }}
                            </v-chip>
                          </td>
                          <td>
                            <span class="text-caption text-medium-emphasis">
                              {{ sub.description }}
                            </span>
                          </td>
                          <td class="text-right font-weight-medium">
                            {{ formatCurrency(sub.amount) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </div>

          <!-- Ошибка -->
          <div v-else class="text-center pa-8">
            <v-icon icon="mdi-alert-circle" color="error" size="64" />
            <div class="mt-4 text-medium-emphasis">Не удалось загрузить данные</div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="outlined" @click="billingBreakdownDialog = false">
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог статистики партнерского договора -->
    <v-dialog v-model="partnerStatsDialog" max-width="1200px">
      <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
        <v-card-title class="d-flex align-center justify-space-between pa-4" style="flex-shrink: 0;">
          <div class="d-flex align-center">
            <v-icon icon="mdi-chart-line" class="mr-3" color="purple" />
            <div>
              <div class="text-h6">Статистика партнерского договора</div>
              <div v-if="currentPartnerContract" class="text-caption text-medium-emphasis">
                Договор {{ currentPartnerContract.number }} • {{ currentPartnerContract.client_name }}
              </div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="partnerStatsDialog = false" />
        </v-card-title>

        <v-divider />

        <!-- Фильтр по периоду - ВСЕГДА ВИДИМ -->
        <div style="flex-shrink: 0;">
          <v-card-text class="pa-4 pb-0">
            <!-- Компактная строка: даты + кнопки -->
            <v-row dense align="center">
              <!-- Дата начала -->
              <v-col cols="12" sm="6" md="2">
                <v-text-field
                  v-model="partnerStatsStartDate"
                  label="Начало"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              
              <!-- Дата окончания -->
              <v-col cols="12" sm="6" md="2">
                <v-text-field
                  v-model="partnerStatsEndDate"
                  label="Конец"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :max="maxEndDate"
                />
              </v-col>
              
              <!-- Кнопки действий -->
              <v-col cols="12" md="8" class="d-flex align-center gap-2 flex-wrap">
                <!-- Получить данные за выбранный период (из БД) -->
                <v-tooltip location="bottom">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      color="purple"
                      size="small"
                      @click="loadPartnerStatistics"
                      :disabled="partnerStatsLoading || !partnerStatsStartDate || !partnerStatsEndDate"
                      :loading="partnerStatsLoading"
                    >
                      <v-icon icon="mdi-database-search" size="small" />
                      <span class="ml-1">{{ partnerStatsLoading ? 'Загрузка...' : 'Получить данные' }}</span>
                    </v-btn>
                  </template>
                  <div class="pa-2">
                    <strong>Получить данные за период</strong><br/>
                    Загружает сохраненные ежедневные снимки<br/>
                    из базы данных (исторические данные)
                  </div>
                </v-tooltip>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider class="mt-4" />
        </div>

        <!-- Прокручиваемый контент -->
        <div style="flex: 1; overflow-y: auto;">
          <v-card-text class="pa-0">

          <!-- Сводная информация - ВСЕГДА ВИДНА -->
          <v-card variant="flat" class="ma-4 mb-2" color="purple-lighten-5">
            <v-card-text class="pa-4">
              <v-row dense>
                <v-col cols="6" sm="4" md="2">
                  <div class="text-caption text-medium-emphasis mb-1">Всего дней</div>
                  <div class="text-subtitle-1 font-weight-bold">
                    {{ partnerStatsSummary?.total_days || 0 }}
                  </div>
                </v-col>
                
                <!-- Среднее объектов с точной цифрой в подсказке -->
                <v-col cols="6" sm="4" md="2">
                  <div class="text-caption text-medium-emphasis mb-1">Среднее объектов</div>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <div v-bind="props" class="text-subtitle-1 font-weight-bold" style="cursor: help;">
                        {{ (partnerStatsSummary?.avg_objects || 0).toFixed(2) }}
                      </div>
                    </template>
                    <span>Точное значение: {{ partnerStatsSummary?.avg_objects || 0 }}</span>
                  </v-tooltip>
                </v-col>
                
                <!-- Тариф за объект/период с точной цифрой в подсказке -->
                <v-col cols="12" sm="4" md="3">
                  <div class="text-caption text-medium-emphasis mb-1">Тариф за объект/период</div>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <div v-bind="props" class="text-body-1 font-weight-bold text-primary" style="cursor: help;">
                        {{ (partnerStatsSummary?.price_per_object_for_period || 0).toFixed(2) }} ₽
                      </div>
                    </template>
                    <span>Точное значение: {{ formatCurrencyExtraPrecise(partnerStatsSummary?.price_per_object_for_period || 0) }}</span>
                  </v-tooltip>
                  <div class="text-caption text-medium-emphasis">
                    за {{ partnerStatsSummary?.total_days || 0 }} дн.
                    <span v-if="hasDiscount" class="text-success ml-1">
                      (со скидкой)
                    </span>
                  </div>
                </v-col>
                <!-- Месячный тариф с точной цифрой в подсказке -->
                <v-col cols="6" sm="6" md="2">
                  <div class="text-caption text-medium-emphasis mb-1">Месячный тариф</div>
                  <div>
                    <!-- Если есть скидка -->
                    <template v-if="hasDiscount">
                      <!-- Базовая цена зачеркнута -->
                      <div class="text-caption text-decoration-line-through text-medium-emphasis">
                        {{ formatCurrency(partnerStatsSummary?.base_monthly_price || 0) }}
                      </div>
                      <!-- Эффективная цена после скидки (используем monthly_price из backend) -->
                      <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                          <div v-bind="props" class="text-subtitle-1 font-weight-bold text-success" style="cursor: help;">
                            {{ formatCurrency(partnerStatsSummary?.monthly_price || 0) }}
                          </div>
                        </template>
                        <span>Точное значение: {{ partnerStatsSummary?.monthly_price || 0 }} ₽</span>
                      </v-tooltip>
                      <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                          <div v-bind="props" class="text-caption text-medium-emphasis" style="cursor: help;">
                            ({{ ((partnerStatsSummary?.monthly_price || 0) / 30).toFixed(2) }} ₽/день)
                          </div>
                        </template>
                        <span>Точная дневная цена: {{ ((partnerStatsSummary?.monthly_price || 0) / 30).toFixed(6) }} ₽/день</span>
                      </v-tooltip>
                      <!-- Для фиксированной скидки дополнительно показываем сумму скидки -->
                      <div v-if="partnerStatsSummary?.discount_type === 'manual_fixed'" class="text-caption text-success">
                        -{{ formatCurrency(partnerStatsSummary?.avg_daily_discount || 0) }} ₽/день
                      </div>
                    </template>
                    
                    <!-- Без скидки -->
                    <template v-else>
                      <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                          <div v-bind="props" class="text-subtitle-1 font-weight-bold" style="cursor: help;">
                            {{ formatCurrency(partnerStatsSummary?.monthly_price || 0) }}
                          </div>
                        </template>
                        <span>Точное значение: {{ partnerStatsSummary?.monthly_price || 0 }} ₽</span>
                      </v-tooltip>
                      <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                          <div v-bind="props" class="text-caption text-medium-emphasis" style="cursor: help;">
                            ({{ ((partnerStatsSummary?.monthly_price || 0) / 30).toFixed(2) }} ₽/день)
                          </div>
                        </template>
                        <span>Точная дневная цена: {{ ((partnerStatsSummary?.monthly_price || 0) / 30).toFixed(6) }} ₽/день</span>
                      </v-tooltip>
                    </template>
                  </div>
                </v-col>
                
                <!-- Общая стоимость с точной цифрой в подсказке -->
                <v-col cols="6" sm="6" md="3">
                  <div class="text-caption text-medium-emphasis mb-1">Общая стоимость</div>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <div v-bind="props" class="text-subtitle-1 font-weight-bold text-purple" style="cursor: help;">
                        {{ formatCurrency(partnerStatsSummary?.total_cost || 0) }}
                      </div>
                    </template>
                    <span>Точное значение: {{ formatCurrencyPrecise(partnerStatsSummary?.total_cost || 0) }}</span>
                  </v-tooltip>
                  <div v-if="hasDiscount" class="text-caption text-success">
                    Скидка: -{{ formatCurrency(partnerStatsSummary?.total_discount || 0) }}
                  </div>
                </v-col>
              </v-row>
              
              <!-- Индикатор загрузки -->
              <v-row v-if="partnerStatsLoading" class="mt-2">
                <v-col cols="12" class="text-center">
                  <v-progress-circular 
                    indeterminate 
                    color="purple" 
                    size="32" 
                    width="3"
                  />
                  <div class="mt-2 text-caption text-medium-emphasis">
                    Загрузка статистики...
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Таблица снимков или сообщение об отсутствии данных -->
          <div v-if="!partnerStatsLoading && partnerSnapshots.length > 0">

            <!-- Таблица снимков по дням -->
            <div class="px-4 pb-4">
              <div class="text-subtitle-1 font-weight-medium mb-3">Ежедневные снимки</div>
              
              <v-table density="compact" class="breakdown-table">
                <thead>
                  <tr>
                    <th class="text-left">Дата</th>
                    <th class="text-center">Всего объектов</th>
                    <th class="text-center">Активных</th>
                    <th class="text-right">Тариф (₽/мес)</th>
                    <th class="text-center">Скидка</th>
                    <th class="text-right">Стоимость за день</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(snapshot, index) in partnerSnapshots" :key="index">
                    <td>
                      <div class="font-weight-medium">{{ formatDate(snapshot.snapshot_date) }}</div>
                    </td>
                    <td class="text-center">
                      <div class="text-h6 font-weight-bold">
                        {{ snapshot.total_objects_count }}
                      </div>
                    </td>
                    <td class="text-center">
                      <div class="text-h6 font-weight-bold" style="color: #9c27b0;">
                        {{ snapshot.active_objects_count }}
                      </div>
                    </td>
                    <td class="text-right text-medium-emphasis">
                      <div>{{ formatCurrency(snapshot.monthly_price || 0) }}/мес</div>
                      <div class="text-caption">({{ (snapshot.monthly_price / 30).toFixed(4) }} ₽/день)</div>
                    </td>
                    <td class="text-center">
                      <div v-if="snapshot.discount_fixed > 0" class="text-body-2">
                        <v-chip size="small" color="success" variant="tonal">
                          -{{ formatCurrency(snapshot.discount_fixed) }}
                        </v-chip>
                        <div class="text-caption text-medium-emphasis mt-1">
                          Фиксированная
                        </div>
                      </div>
                      <div v-else-if="snapshot.discount_percent > 0" class="text-body-2">
                        <v-chip size="small" color="success" variant="tonal">
                          -{{ snapshot.discount_percent }}%
                        </v-chip>
                        <div class="text-caption text-medium-emphasis mt-1">
                          {{ formatCurrencyPrecise(snapshot.discount_amount || 0) }}
                        </div>
                      </div>
                      <div v-else class="text-caption text-medium-emphasis">—</div>
                    </td>
                    <td class="text-right">
                      <div v-if="snapshot.discount_percent > 0 || snapshot.discount_fixed > 0">
                        <div class="text-caption text-medium-emphasis" style="text-decoration: line-through;">
                          {{ formatCurrencyPrecise(snapshot.cost_before_discount || snapshot.daily_cost) }}
                        </div>
                        <div class="font-weight-medium text-success">
                          {{ formatCurrencyPrecise(snapshot.daily_cost) }}
                        </div>
                      </div>
                      <div v-else class="font-weight-medium">
                        {{ formatCurrencyPrecise(snapshot.daily_cost) }}
                      </div>
                    </td>
                  </tr>
                  <tr class="font-weight-bold total-row">
                    <td colspan="5" class="text-right">Итого:</td>
                    <td class="text-right">
                      {{ formatCurrencyPrecise(partnerStatsSummary.total_cost) }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- Формула расчета -->
            <v-alert variant="tonal" color="purple" class="ma-4">
              <div class="text-subtitle-2 mb-2">Формула расчета:</div>
              <div class="text-caption mb-2">
                <strong>Дневная цена</strong> = Месячный тариф ÷ 30 дней (округляется до 4 знаков)
              </div>
              <div class="text-caption mb-2">
                <strong>Стоимость за день</strong> = Дневная цена × Количество активных объектов (округляется до копеек)
              </div>
              <div class="text-caption">
                <strong>Общая стоимость</strong> = Сумма всех дневных стоимостей за период
              </div>
            </v-alert>
          </div>

          <!-- Нет данных -->
          <div v-else-if="!partnerStatsLoading" class="text-center pa-8">
            <v-icon icon="mdi-information-outline" color="info" size="64" />
            <div class="mt-4 text-medium-emphasis mb-4">
              Нет снимков для отображения за выбранный период.<br>
              Данные будут доступны после создания снимков через систему автоматического создания снимков.
            </div>
          </div>
          </v-card-text>
        </div>
        <!-- Конец прокручиваемого контента -->

        <v-divider />

        <!-- Футер - ВСЕГДА ВИДИМ -->
        <v-card-actions class="pa-4" style="flex-shrink: 0;">
          <v-spacer />
          <v-btn variant="outlined" @click="partnerStatsDialog = false">
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог: внести платёж на лицевой счёт (без счёта) -->
    <v-dialog v-model="paymentDialog" max-width="480">
      <v-card>
        <v-card-title>Внести платёж</v-card-title>
        <v-card-subtitle v-if="paymentContract">{{ paymentContract.number }} · {{ paymentContract.title || paymentContract.client_name }}</v-card-subtitle>
        <v-card-text>
          <v-text-field v-model.number="paymentForm.amount" label="Сумма платежа, ₽" type="number" min="0" autofocus />
          <v-select v-model="paymentForm.source" :items="[
            { title: 'Вручную', value: 'manual' },
            { title: 'Excel-реестр', value: 'excel' },
            { title: '1С', value: '1c' },
            { title: 'Платёжная система', value: 'payment_system' },
            { title: 'Банк', value: 'bank' },
          ]" label="Источник платежа" />
          <v-text-field v-model="paymentForm.payment_date" label="Дата платежа" type="date" />
          <v-text-field v-model="paymentForm.comment" label="Комментарий" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="paymentDialog = false">Отмена</v-btn>
          <v-btn color="success" :loading="savingPayment" :disabled="paymentForm.amount <= 0" @click="submitPayment">Внести</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог: лицевой счёт (история проводок) -->
    <v-dialog v-model="ledgerHistoryDialog" max-width="1100">
      <v-card>
        <v-card-title>Лицевой счёт</v-card-title>
        <v-card-subtitle v-if="ledgerHistoryContract">{{ ledgerHistoryContract.number }} · {{ ledgerHistoryContract.title || ledgerHistoryContract.client_name }}</v-card-subtitle>
        <v-card-text>
          <!-- Активные зонты отсрочки/обещанного платежа (П3+П4) -->
          <div v-if="ledgerHolds.length" class="mb-3">
            <v-alert
              v-for="h in ledgerHolds"
              :key="h.id"
              :type="h.hold_type === 'promise' ? 'info' : 'warning'"
              density="compact"
              variant="tonal"
              class="mb-2"
            >
              <div class="d-flex align-center">
                <div>
                  <strong>{{ h.hold_type === 'promise' ? 'Обещанный платёж' : 'Отсрочка' }}</strong>
                  до {{ holdUntilDisplay(h.hold_until) }}
                  <span v-if="h.hold_type === 'promise' && Number(h.amount) > 0">· {{ formatMoneyPlain(h.amount) }}</span>
                  <span v-if="h.reason" class="text-caption"> · {{ h.reason }}</span>
                </div>
                <v-spacer />
                <v-btn size="small" variant="text" color="error" :loading="cancelingHold === h.id" @click="cancelHold(h)">Снять</v-btn>
              </div>
            </v-alert>
          </div>
          <div v-if="loadingLedgerHistory" class="text-center pa-4">Загрузка…</div>
          <v-table v-else density="compact" class="ledger-history-table">
            <thead>
              <tr><th>Дата</th><th>Время</th><th>Операция</th><th>Сумма</th><th>Источник</th><th>Кто внёс</th><th>Описание</th></tr>
            </thead>
            <tbody>
              <tr v-for="e in ledgerEntries" :key="e.id">
                <td class="text-caption">{{ String(e.entry_date).slice(0, 10) }}</td>
                <td class="text-caption">{{ formatLedgerTime(e.created_at) }}</td>
                <td>{{ ledgerEntryTypeLabel(e.entry_type) }}</td>
                <td :class="Number(e.amount) < 0 ? 'text-error' : 'text-success'">{{ formatLedgerBalance(e.amount) }}</td>
                <td class="text-caption">{{ e.source }}</td>
                <td class="text-caption">{{ e.created_by || (e.source === 'auto_charge' ? 'система' : '—') }}</td>
                <td class="text-caption ledger-desc">{{ e.description }}</td>
              </tr>
              <tr v-if="ledgerEntries.length === 0">
                <td colspan="7" class="text-center text-medium-emphasis">Нет проводок</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-bank-transfer" @click="openTransfer">Перевести</v-btn>
          <v-btn color="warning" variant="tonal" prepend-icon="mdi-clock-outline" @click="openHold">Отсрочка / обещание</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="ledgerHistoryDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Зонт: отсрочка / обещанный платёж (П3+П4) -->
    <v-dialog v-model="holdDialog" max-width="520">
      <v-card>
        <v-card-title>Отсрочка / обещанный платёж</v-card-title>
        <v-card-subtitle v-if="ledgerHistoryContract">
          {{ ledgerHistoryContract.number }} · {{ ledgerHistoryContract.client_name || ledgerHistoryContract.title }}
        </v-card-subtitle>
        <v-card-text>
          <v-btn-toggle v-model="holdType" mandatory class="mb-4" density="comfortable">
            <v-btn value="deferral">Отсрочка</v-btn>
            <v-btn value="promise">Обещанный платёж</v-btn>
          </v-btn-toggle>
          <v-text-field v-model="holdUntil" label="Держать до (дата)" type="date"
            variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-if="holdType === 'promise'" v-model.number="holdAmount" label="Обещанная сумма, ₽"
            type="number" min="0" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="holdReason" label="Причина / комментарий (необязательно)"
            variant="outlined" density="comfortable" />
          <v-alert v-if="holdError" type="error" density="compact" class="mt-2">{{ holdError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="holdDialog = false">Отмена</v-btn>
          <v-btn color="warning" :loading="savingHold"
            :disabled="!holdUntil || (holdType === 'promise' && (!holdAmount || holdAmount <= 0))"
            @click="submitHold">Создать</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Перевод между лицевыми счетами -->
    <v-dialog v-model="transferDialog" max-width="520">
      <v-card>
        <v-card-title>Перевод между лицевыми счетами</v-card-title>
        <v-card-subtitle v-if="ledgerHistoryContract">
          Со счёта: {{ ledgerHistoryContract.number }} · {{ ledgerHistoryContract.client_name }}
        </v-card-subtitle>
        <v-card-text>
          <v-select
            v-model="transferTarget"
            :items="transferTargets"
            item-title="label"
            item-value="id"
            label="Договор-получатель"
            variant="outlined" density="comfortable" class="mb-3"
          />
          <v-text-field v-model.number="transferAmount" label="Сумма" type="number" min="0"
            variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="transferDesc" label="Описание (необязательно)"
            variant="outlined" density="comfortable" />
          <v-alert v-if="transferError" type="error" density="compact" class="mt-2">{{ transferError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="transferDialog = false">Отмена</v-btn>
          <v-btn color="primary" :loading="transferring" :disabled="!transferTarget || !transferAmount" @click="doTransfer">Перевести</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { canManageBilling } from '@/utils/billingRole';
import { debounce } from 'lodash-es';
import { config } from '@/config/env';
import type { ContractType, PartnerSnapshotsSummary } from '@/types/contracts';
import { 
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_COLORS,
  CONTRACT_TYPE_ICONS,
  CONTRACT_TYPE_OPTIONS
} from '@/types/contracts';

const router = useRouter();

// Props
const props = defineProps<{
  subscriptions?: any[]
}>();

// Эмиты
const emit = defineEmits<{
  (e: 'stats-updated', stats: {
    total: number
    active: number
    expiring_soon: number
    total_amount: string
  }): void
  // Кол-во выделенных договоров — для FAB в Billing.vue (двухрежимный: создать ↔ массовые).
  (e: 'selection-changed', count: number): void
}>();

// Интерфейс для договора (упрощенный)
interface Contract {
  id: number;
  number: string;
  sequential_number?: number; // Порядковый номер договора
  created_at?: string; // Дата создания
  title: string;
  contract_type?: string; // Тип договора: client или partner
  partner_company_id?: number; // Для партнерских договоров
  client_name: string;
  client_short_name?: string; // Сокращенное название с ОПФ (для организаций)
  start_date: string;
  end_date: string;
  total_amount: string;
  currency: string;
  status: string;
  is_active: boolean;
  notify_before: number;
  tariff_plan?: {
    id: number;
    name: string;
    price: number;
  };
  objects?: any[];
}

// Реактивные данные
const loading = ref(false);
const demoMode = ref(false); // Отключен по умолчанию
const contracts = ref<Contract[]>([]);
// Используем подписки из props или пустой массив
const contractSubscriptions = computed(() => props.subscriptions || []);

// 📊 Пагинация для виртуального скроллинга
const currentPage = ref(1);
// Загружаем itemsPerPage из localStorage или используем 10 по умолчанию
const savedItemsPerPage = localStorage.getItem('contracts_items_per_page');
const itemsPerPage = ref(savedItemsPerPage ? parseInt(savedItemsPerPage, 10) : 10);
const totalContracts = ref(0);

// 🔄 Серверная сортировка
type SortItem = { key: string; order: 'asc' | 'desc' };
const sortBy = ref<SortItem[]>([{ key: 'created_at', order: 'desc' }]);

// Обработчик изменения сортировки - перезагрузка данных с сервера
const onSortChange = (newSort: SortItem[]) => {
  console.log('🔄 Сортировка изменена:', newSort);
  sortBy.value = newSort;
  loadContracts(true, true); // Перезагружаем с сервера с новой сортировкой
};

// Обработчик изменения страницы - загрузка данных с сервера
const onPageChange = (page: number) => {
  console.log('📄 Страница изменена:', page);
  // Не загружаем, если это поиск (все результаты уже загружены)
  if (!hasSearch.value) {
    currentPage.value = page;
    loadContracts(true, true); // Перезагружаем с сервера с новой страницей
  }
};

// Обработчик изменения количества записей на странице
const onItemsPerPageChange = (value: number) => {
  itemsPerPage.value = value;
  localStorage.setItem('contracts_items_per_page', String(value));
  currentPage.value = 1; // Сбрасываем на первую страницу
  loadContracts(true, true);
};
const hasMoreContracts = ref(true);
const loadingMore = ref(false);

// 🚀 Progressive Loading - статистика объектов
const statsLoading = ref(false);
const statsLoadedMap = ref<Map<number, boolean>>(new Map());

// === Лицевой счёт (ledger) ===
const ledgerBalanceMap = ref<Record<number, string>>({}); // contract.id → balance (строка)
const paymentDialog = ref(false);
const paymentContract = ref<any>(null);
const paymentForm = ref({ amount: 0, source: 'manual', comment: '', payment_date: '' });
const savingPayment = ref(false);
const ledgerHistoryDialog = ref(false);
const ledgerHistoryContract = ref<any>(null);
const ledgerEntries = ref<any[]>([]);
const loadingLedgerHistory = ref(false);

function formatLedgerBalance(v: string): string {
  const n = Number(v || 0);
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
}
function ledgerBalanceClass(v: string): string {
  const n = Number(v || 0);
  if (n < 0) return 'text-error';
  if (n > 0) return 'text-success';
  return 'text-medium-emphasis';
}
function openPaymentDialog(contract: any) {
  paymentContract.value = contract;
  paymentForm.value = { amount: 0, source: 'manual', comment: '', payment_date: '' };
  paymentDialog.value = true;
}
async function submitPayment() {
  if (!paymentContract.value || paymentForm.value.amount <= 0) return;
  savingPayment.value = true;
  try {
    const contractsService = (await import('@/services/contractsService')).default;
    const res = await contractsService.addLedgerPayment({
      contract_id: paymentContract.value.id,
      amount: paymentForm.value.amount,
      source: paymentForm.value.source,
      comment: paymentForm.value.comment,
      payment_date: paymentForm.value.payment_date || undefined,
    });
    ledgerBalanceMap.value = { ...ledgerBalanceMap.value, [paymentContract.value.id]: res.new_balance };
    paymentDialog.value = false;
  } catch (e: any) {
    console.error('Ошибка платежа:', e?.response?.data?.error || e.message);
  } finally {
    savingPayment.value = false;
  }
}
async function openLedgerHistory(contract: any) {
  ledgerHistoryContract.value = contract;
  ledgerHistoryDialog.value = true;
  loadingLedgerHistory.value = true;
  ledgerHolds.value = [];
  try {
    const contractsService = (await import('@/services/contractsService')).default;
    ledgerEntries.value = await contractsService.getLedgerEntries(contract.id);
    loadLedgerHolds(contract.id); // активные зонты — параллельно, не блокируя историю
  } catch {
    ledgerEntries.value = [];
  } finally {
    loadingLedgerHistory.value = false;
  }
}
function ledgerEntryTypeLabel(t: string): string {
  return ({ charge: 'Начисление', payment: 'Платёж', adjustment: 'Корректировка', reversal: 'Сторно', migration_balance: 'Перенос остатка (WCRM)', transfer_out: 'Перевод (списание)', transfer_in: 'Перевод (зачисление)' } as Record<string, string>)[t] || t;
}

// === Зонты: отсрочка / обещанный платёж (П3+П4) ===
const ledgerHolds = ref<any[]>([]);      // активные зонты текущего ЛС
const holdDialog = ref(false);
const holdType = ref<'deferral' | 'promise'>('deferral');
const holdUntil = ref('');
const holdAmount = ref<number | null>(null);
const holdReason = ref('');
const savingHold = ref(false);
const holdError = ref('');
const cancelingHold = ref<number | null>(null);

// hold_until хранится как EXCLUSIVE-граница (начало след. дня UTC). Для показа
// «держим до <день>» вычитаем 1 день — оператор видит последний покрытый день.
function holdUntilDisplay(v: string): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Загрузка активных зонтов договора (показываем только active).
async function loadLedgerHolds(contractId: number) {
  try {
    const svc = (await import('@/services/contractsService')).default;
    const all = await svc.getLedgerHolds(contractId);
    ledgerHolds.value = (all || []).filter((h: any) => h.active);
  } catch {
    ledgerHolds.value = [];
  }
}

function openHold() {
  holdType.value = 'deferral';
  holdUntil.value = '';
  holdAmount.value = null;
  holdReason.value = '';
  holdError.value = '';
  holdDialog.value = true;
}

async function submitHold() {
  if (!ledgerHistoryContract.value || !holdUntil.value) return;
  if (holdType.value === 'promise' && (!holdAmount.value || holdAmount.value <= 0)) return;
  savingHold.value = true;
  holdError.value = '';
  try {
    const svc = (await import('@/services/contractsService')).default;
    await svc.createLedgerHold({
      contract_id: ledgerHistoryContract.value.id,
      hold_type: holdType.value,
      hold_until: holdUntil.value,
      amount: holdType.value === 'promise' ? Number(holdAmount.value) : undefined,
      reason: holdReason.value || undefined,
    });
    holdDialog.value = false;
    // Зонт мог снять активную приостановку → обновляем зонты + историю + баланс.
    await loadLedgerHolds(ledgerHistoryContract.value.id);
    try {
      const bal = await svc.getLedgerBalance(ledgerHistoryContract.value.id);
      ledgerBalanceMap.value = { ...ledgerBalanceMap.value, [ledgerHistoryContract.value.id]: bal.balance };
    } catch { /* ignore */ }
  } catch (e: any) {
    holdError.value = e?.response?.data?.error || e?.message || 'Ошибка создания зонта';
  } finally {
    savingHold.value = false;
  }
}

async function cancelHold(h: any) {
  cancelingHold.value = h.id;
  try {
    const svc = (await import('@/services/contractsService')).default;
    await svc.cancelLedgerHold(h.id);
    await loadLedgerHolds(h.contract_id);
  } catch (e: any) {
    console.error('Ошибка снятия зонта:', e?.response?.data?.error || e?.message);
  } finally {
    cancelingHold.value = null;
  }
}

// === Перевод между лицевыми счетами ===
const transferDialog = ref(false);
const transferTarget = ref<number | null>(null);
const transferAmount = ref<number | null>(null);
const transferDesc = ref('');
const transferring = ref(false);
const transferError = ref('');
// Получатели — все договоры кроме текущего (валюта проверяется на бэке).
const transferTargets = computed(() =>
  (contracts.value || [])
    .filter(c => c.id !== ledgerHistoryContract.value?.id)
    .map(c => ({ id: c.id, label: `${c.number} · ${c.client_name || c.title || ''}` }))
);
const transferKey = ref('');
function openTransfer() {
  transferTarget.value = null;
  transferAmount.value = null;
  transferDesc.value = '';
  transferError.value = '';
  // Ключ идемпотентности на одну попытку перевода (защита от дублей при retry).
  transferKey.value = (globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random());
  transferDialog.value = true;
}
async function doTransfer() {
  if (!ledgerHistoryContract.value || !transferTarget.value || !transferAmount.value) return;
  transferring.value = true;
  transferError.value = '';
  try {
    const svc = (await import('@/services/contractsService')).default;
    await svc.transferLedger({
      from_contract_id: ledgerHistoryContract.value.id,
      to_contract_id: transferTarget.value,
      amount: Number(transferAmount.value),
      description: transferDesc.value || undefined,
      idempotency_key: transferKey.value || undefined,
    });
    const fromId = ledgerHistoryContract.value.id;
    const toId = transferTarget.value;
    transferDialog.value = false;
    // Обновляем историю текущего ЛС + балансы обоих договоров в списке.
    await openLedgerHistory(ledgerHistoryContract.value);
    try {
      const [bf, bt] = await Promise.all([svc.getLedgerBalance(fromId), svc.getLedgerBalance(toId)]);
      ledgerBalanceMap.value = { ...ledgerBalanceMap.value, [fromId]: bf.balance, [toId]: bt.balance };
    } catch { /* ignore */ }
  } catch (e: any) {
    transferError.value = e?.response?.data?.error || e?.message || 'Ошибка перевода';
  } finally {
    transferring.value = false;
  }
}
function formatLedgerTime(v: string): string {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
const searchQuery = ref(''); // Пользовательский ввод
const debouncedSearchQuery = ref(''); // Дебаунсированное значение для фильтрации
const statusFilter = ref<string | null>(null);
const activeFilter = ref<boolean | null>(null);
const contractTypeFilter = ref<string | null>(null);

// Фильтр по менеджеру (только admin/superadmin — у менеджера и так только свои).
const managerFilter = ref<number | null>(null);
const canFilterManager = computed(() => canManageBilling());
const managerOptions = ref<Array<{ title: string; value: number }>>([]);
const loadManagerOptions = async () => {
  if (!canFilterManager.value) return;
  try {
    const svc = (await import('@/services/contractsService')).default;
    const list = await svc.getManagers();
    managerOptions.value = list.map((m: any) => ({ title: m.name, value: m.id }));
  } catch { managerOptions.value = []; }
};

// Дебаунс для поискового запроса (500мс) для оптимизации при плохом интернете
let searchDebounceTimer: number | null = null;
watch(searchQuery, (newValue) => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  searchDebounceTimer = window.setTimeout(() => {
    debouncedSearchQuery.value = newValue;
  }, 500); // 500мс задержка
});

// 🔍 Поиск теперь локальный - не нужно перезагружать с сервера
// watch(debouncedSearchQuery, () => {
//   loadContracts(true, true); // УБРАНО: поиск теперь локальный в filteredContracts
// });

// Snackbar
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Автопилот
const autopilotEnabled = ref(false);

// Диалог детализации расчета (для клиентских договоров)
const billingBreakdownDialog = ref(false);
const billingBreakdownLoading = ref(false);
const currentContractForBreakdown = ref<Contract | null>(null);
const billingBreakdownData = ref<any>(null);

// Диалог статистики партнерского договора
const partnerStatsDialog = ref(false);
const partnerStatsLoading = ref(false);
const currentPartnerContract = ref<Contract | null>(null);
const partnerSnapshots = ref<any[]>([]);
const partnerStatsSummary = ref<PartnerSnapshotsSummary | null>(null);

// Период для статистики партнерского договора
const partnerStatsStartDate = ref<string>('');
const partnerStatsEndDate = ref<string>('');

// Максимальная дата для выбора окончания периода (вчерашний день)
// Если сегодня 06.12, то доступна дата 05.12 (вчера)
const maxEndDate = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Устанавливаем начало дня
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1); // Вчерашний день
  // Форматируем в YYYY-MM-DD с учетом локального времени
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// Автоматически корректируем дату окончания, если она превышает максимальную
watch([partnerStatsEndDate, maxEndDate], ([endDate, maxDate]) => {
  if (endDate && maxDate && endDate > maxDate) {
    // Если выбранная дата больше максимальной, устанавливаем максимальную дату
    partnerStatsEndDate.value = maxDate;
  }
}, { immediate: true });

// Проверка наличия скидки
const hasDiscount = computed(() => {
  return (partnerStatsSummary.value?.total_discount || 0) > 0;
});

// Прогресс создания снимков
const snapshotsGenerationProgress = ref<number>(0);
const isGeneratingSnapshots = ref<boolean>(false);

// Заголовки таблицы (с динамической шириной для лучшей адаптации)
const headers = [
  { title: '№', key: 'sequential_number', sortable: true, width: '56px', minWidth: '48px', align: 'center' as const },
  { title: 'Дата', key: 'created_at', sortable: true, width: '92px', minWidth: '84px', align: 'center' as const },
  { title: 'Номер', key: 'number', sortable: true, width: '120px', minWidth: '104px', align: 'center' as const },
  { title: 'Тип', key: 'contract_type', sortable: true, width: '64px', minWidth: '56px', align: 'center' as const },
  { title: 'Клиент', key: 'title', sortable: true, width: '220px', minWidth: '180px', align: 'center' as const },
  { title: 'Тариф', key: 'tariff_plan', sortable: false, width: '118px', minWidth: '104px', align: 'center' as const },
  { title: 'Период', key: 'period', sortable: false, width: '118px', minWidth: '108px', align: 'center' as const },
  { title: 'Сумма', key: 'total_amount', sortable: true, width: '80px', minWidth: '72px', align: 'center' as const },
  { title: 'Баланс', key: 'ledger_balance', sortable: false, width: '100px', minWidth: '92px', align: 'center' as const },
  { title: 'Менеджер', key: 'manager_name', sortable: true, width: '120px', minWidth: '104px', align: 'center' as const },
  { title: 'Действия', key: 'actions', sortable: false, width: '150px', minWidth: '136px', align: 'center' as const },
];

// Опции для фильтров
const statusOptions = [
  { value: 'draft', title: 'Черновик' },
  { value: 'active', title: 'Активный' },
  { value: 'expiring', title: 'Истекающие' },
  { value: 'expired', title: 'Истекший' },
  { value: 'cancelled', title: 'Отмененный' },
  { value: 'suspended', title: 'Приостановленный' },
];

const activeOptions = [
  { value: true, title: 'Активные' },
  { value: false, title: 'Неактивные' },
];

// --- Вспомогательная функция ---
const toLower = (val: any): string => String(val ?? '').toLowerCase();

// Вычисляемые свойства
const hasSearch = computed(() => {
  return debouncedSearchQuery.value && debouncedSearchQuery.value.trim().length > 0;
});

// --- Вставь это вместо текущего filteredContracts ---
const filteredContracts = computed(() => {
  // 1. Берем загруженные договоры
  let items = contracts.value || []

  // 2. Фильтр по статусу (если есть такая переменная)
  if (statusFilter.value) {
    if (statusFilter.value === 'expiring') {
      // Специальная обработка для истекающих договоров
      items = items.filter(contract => isExpiringSoon(contract));
    } else {
      items = items.filter(contract => contract.status === statusFilter.value);
    }
  }

  if (activeFilter.value !== null) {
    items = items.filter(contract => contract.is_active === activeFilter.value);
  }

  if (contractTypeFilter.value) {
    items = items.filter(contract => (contract.contract_type || 'client') === contractTypeFilter.value);
  }

  // Фильтр по менеджеру (admin): по manager_id
  if (managerFilter.value != null) {
    items = items.filter(contract => (contract as any).manager_id === managerFilter.value);
  }

  // 3. ПОИСК (Клиентский, регистронезависимый)
  if (searchQuery.value) {
    const query = toLower(searchQuery.value)
    
    items = items.filter(contract => {
      // Проверяем все важные поля
      return (
        toLower(contract.number).includes(query) ||               // Номер договора
        toLower(contract.client_name).includes(query) ||          // Имя клиента
        toLower((contract as any).client_short_name).includes(query) ||    // Краткое имя
        toLower(contract.partner_company_id).includes(query) ||   // ID партнера
        toLower(contract.contract_type === 'partner' ? 'Партнерский' : 'Клиентский').includes(query) // Тип
      )
    })
  }

  return items
})

// Функция для расчета стоимости договора
const calculateContractAmount = (contract: Contract): number => {
  // Если у договора уже есть заполненная стоимость (не 0), используем её
  const existingAmount = parseFloat(contract.total_amount || '0');
  if (existingAmount > 0) {
    return existingAmount;
  }

  // Основной источник — активные подписки договора: тариф подписки × объекты подписки.
  // (У мигрированных договоров тариф лежит в подписке, а не в contract.tariff_plan.)
  const subs = contractSubscriptions.value.filter(
    sub => sub.contract_id === contract.id &&
           sub.status && ['active', 'scheduled'].includes(sub.status)
  );
  if (subs.length > 0) {
    let sum = 0;
    for (const sub of subs) {
      const price = Number(sub.billing_plan?.price || 0);
      const objCount = (sub as any).objects_count ?? (sub as any).object_ids?.length ?? 0;
      sum += price * objCount;
    }
    if (sum > 0) return sum;
  }

  // Fallback: старая логика через contract.tariff_plan × объекты договора.
  const objectsCount = contract.objects?.length || 0;
  if (objectsCount === 0 || !contract.tariff_plan || !contract.tariff_plan.price) {
    return 0;
  }
  return contract.tariff_plan.price * objectsCount;
};

// Карта тарифов для каждого договора (из подписок)
const contractTariffsMap = computed(() => {
  const map = new Map<number, { plans: any[], uniquePlans: any[], count: number }>();
  
  contracts.value.forEach(contract => {
    // Находим все активные подписки для этого договора
    const subscriptions = contractSubscriptions.value.filter(
      sub => sub.contract_id === contract.id && 
             sub.status && 
             ['active', 'scheduled'].includes(sub.status)
    );
    
    // Собираем уникальные тарифы из подписок
    const uniquePlansMap = new Map();
    subscriptions.forEach(sub => {
      if (sub.billing_plan && sub.billing_plan.id) {
        uniquePlansMap.set(sub.billing_plan.id, sub.billing_plan);
      }
    });
    
    const uniquePlans = Array.from(uniquePlansMap.values());
    
    const info = {
      plans: subscriptions.map(s => s.billing_plan).filter(Boolean),
      uniquePlans,
      count: uniquePlans.length
    };
    
    if (uniquePlans.length > 1) {
      console.log(`🎯 Contract ${contract.id} (${contract.number}) has ${uniquePlans.length} plans:`, 
        uniquePlans.map(p => p.name));
    }
    
    map.set(contract.id, info);
  });
  
  return map;
});

const stats = computed(() => {
  const total = contracts.value.length;
  const active = contracts.value.filter(c => c.status === 'active').length;
  const expired = contracts.value.filter(c => c.status === 'expired').length;
  const expiring_soon = contracts.value.filter(c => isExpiringSoon(c)).length;
  
  // Используем автоматический расчет стоимости для каждого договора
  const total_amount = contracts.value.reduce((sum, c) => {
    const calculatedAmount = calculateContractAmount(c);
    return sum + calculatedAmount;
  }, 0);

  return {
    total,
    active,
    expired,
    expiring_soon,
    total_amount: total_amount.toString(),
  };
});

// Отслеживаем изменения статистики и передаем в родительский компонент
watch(stats, (newStats) => {
  emit('stats-updated', {
    total: newStats.total,
    active: newStats.active,
    expiring_soon: newStats.expiring_soon,
    total_amount: newStats.total_amount,
  });
}, { immediate: true });

const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    statusFilter.value ||
    activeFilter.value !== null ||
    contractTypeFilter.value ||
    managerFilter.value
  );
});

// Счётчик активных фильтров — для badge на кнопке сброса (как на Учётных записях).
const activeFiltersCount = computed(() => {
  let n = 0;
  if (searchQuery.value) n++;
  if (statusFilter.value) n++;
  if (activeFilter.value !== null) n++;
  if (contractTypeFilter.value) n++;
  if (managerFilter.value) n++;
  return n;
});

// Методы
const enableDemoMode = async () => {
  demoMode.value = true;
  await loadDemoContracts();
  showSnackbarMessage('Демо режим договоров включен', 'success');
};

const disableDemoMode = async () => {
  demoMode.value = false;
  contracts.value = [];
  showSnackbarMessage('Демо режим договоров выключен', 'info');
  await loadContracts();
};

const loadDemoContracts = async () => {
  loading.value = true;
  
  try {
    const demoContracts: Contract[] = [
      {
        id: 1,
        number: "DOG-2024-001",
        sequential_number: 1,
        created_at: "2024-01-01T00:00:00Z",
        title: "Мониторинг транспорта",
        client_name: "ООО Логистика Плюс",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-12-31T23:59:59Z",
        total_amount: "120000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 30,
        tariff_plan: { id: 1, name: "Стандартный", price: 1000 },
        objects: [{}, {}],
      },
      {
        id: 2,
        number: "DOG-2024-002",
        sequential_number: 2,
        created_at: "2024-02-01T00:00:00Z",
        title: "Мониторинг стройтехники",
        client_name: "ООО СтройТех",
        start_date: "2024-02-01T00:00:00Z",
        end_date: "2025-01-31T23:59:59Z",
        total_amount: "180000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 60,
        tariff_plan: { id: 2, name: "Премиум", price: 1500 },
        objects: [{}],
      },
      {
        id: 3,
        number: "DOG-2024-003",
        sequential_number: 3,
        created_at: "2024-01-15T00:00:00Z",
        title: "Мониторинг такси",
        client_name: "ИП Таксистов А.В.",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-03-31T23:59:59Z",
        total_amount: "30000.00",
        currency: "RUB",
        status: "expired",
        is_active: false,
        notify_before: 14,
        tariff_plan: { id: 1, name: "Стандартный", price: 1000 },
        objects: [],
      },
      {
        id: 4,
        number: "DOG-2024-004",
        sequential_number: 4,
        created_at: "2024-03-01T00:00:00Z",
        title: "Мониторинг сельхозтехники",
        client_name: "СПК Колос",
        start_date: "2024-03-01T00:00:00Z",
        end_date: "2024-12-31T23:59:59Z",
        total_amount: "90000.00",
        currency: "RUB",
        status: "draft",
        is_active: false,
        notify_before: 30,
        tariff_plan: { id: 1, name: "Стандартный", price: 1000 },
        objects: [],
      },
      {
        id: 5,
        number: "DOG-2023-015",
        sequential_number: 5,
        created_at: "2023-12-01T00:00:00Z",
        title: "Мониторинг курьерской службы",
        client_name: "ООО Быстрая Доставка",
        start_date: "2023-12-01T00:00:00Z",
        end_date: "2024-02-29T23:59:59Z",
        total_amount: "45000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 14,
        tariff_plan: { id: 2, name: "Премиум", price: 1500 },
        objects: [{}, {}],
      },
      {
        id: 6,
        number: "DOG-2024-005",
        sequential_number: 6,
        created_at: "2024-02-15T00:00:00Z",
        title: "Мониторинг медтехники",
        client_name: "ГБУ Больница №7",
        start_date: "2024-02-15T00:00:00Z",
        end_date: "2025-02-14T23:59:59Z",
        total_amount: "240000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 45,
        tariff_plan: { id: 2, name: "Премиум", price: 1500 },
        objects: [{}, {}],
      },
      {
        id: 7,
        number: "DOG-2024-006",
        sequential_number: 7,
        created_at: "2024-01-05T00:00:00Z",
        title: "Мониторинг коммунальной техники",
        client_name: "ГБУ Автодороги",
        start_date: "2024-01-05T00:00:00Z",
        end_date: "2024-04-30T23:59:59Z",
        total_amount: "60000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 15,
        tariff_plan: { id: 1, name: "Стандартный", price: 1000 },
        objects: [{}, {}, {}],
      },
      {
        id: 8,
        number: "DOG-2023-020",
        sequential_number: 8,
        created_at: "2023-11-01T00:00:00Z",
        title: "Мониторинг инкассации",
        client_name: "ООО СБ Инкассация",
        start_date: "2023-11-01T00:00:00Z",
        end_date: "2024-02-29T23:59:59Z",
        total_amount: "180000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 7,
        tariff_plan: { id: 2, name: "Премиум", price: 1500 },
        objects: [{}, {}],
      },
    ];

    contracts.value = demoContracts;
    
  } catch (error) {
    console.error('Ошибка загрузки демо данных:', error);
    showSnackbarMessage('Ошибка загрузки демо данных', 'error');
  } finally {
    loading.value = false;
  }
};

const clearFilters = async () => {
  searchQuery.value = '';
  statusFilter.value = null;
  activeFilter.value = null;
  contractTypeFilter.value = null;
  if (!demoMode.value) {
    await loadContracts();
  }
};

const startAutopilot = () => {
  if (!autopilotEnabled.value) {
    showSnackbarMessage('Автопилот отключен. Включите его в настройках биллинга.', 'warning');
    return;
  }
  // Запускаем автопилот - переходим на страницу создания договора с флагом autopilot=true
  router.push({
    path: '/contracts/create',
    query: { autopilot: 'true' }
  });
  showSnackbarMessage('Автопилот запущен. Создайте договор для начала работы.', 'info');
};

const viewContract = (contract: Contract) => {
  showSnackbarMessage(`Просмотр договора ${contract.number}`, 'info');
};

const editContract = (contract: Contract) => {
  router.push({
    name: 'EditContract',
    params: { id: contract.id }
  });
};

// Навигация к подпискам по договору
const navigateToSubscriptions = (contract: Contract) => {
  // Переход на страницу биллинга с вкладкой "Подписки" и фильтром по contract_id
  router.push({
    path: '/billing',
    query: {
      tab: 'subscriptions',
      contract_id: contract.id.toString(),
      contract_number: contract.number
    }
  });
};

const viewInvoices = (contract: Contract) => {
  showSnackbarMessage(`Счета по договору ${contract.number}`, 'info');
  // Здесь можно переключиться на вкладку "Счета" с фильтром по договору
};

// Создать тестовый снимок для партнерских договоров (на сегодня)
const createTestSnapshot = async () => {
  isGeneratingSnapshots.value = true;
  snapshotsGenerationProgress.value = 0;

  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');
    
    if (!token) {
      throw new Error('Отсутствует токен авторизации');
    }

    if (!companyData) {
      throw new Error('Отсутствует информация о компании');
    }

    const company = JSON.parse(companyData);
    const tenantId = company.id;

    // Симулируем прогресс
    const progressInterval = setInterval(() => {
      if (snapshotsGenerationProgress.value < 90) {
        snapshotsGenerationProgress.value += 10;
      }
    }, 200);

    const response = await fetch(
      `${config.apiBaseUrl}/auth/contracts/partner-snapshots/create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': String(tenantId)
        }
      }
    );

    clearInterval(progressInterval);
    snapshotsGenerationProgress.value = 95;

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка создания снимков');
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      snapshotsGenerationProgress.value = 100;
      
      showSnackbarMessage(
        `Снимки созданы: успешно ${data.success_count}, ошибок ${data.error_count}`,
        'success'
      );
      
      // Небольшая задержка чтобы пользователь увидел 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Перезагружаем статистику
      await loadPartnerStatistics();
    } else {
      throw new Error('Неверный формат ответа от сервера');
    }
  } catch (error: any) {
    console.error('Ошибка создания тестового снимка:', error);
    showSnackbarMessage(error.message || 'Ошибка создания снимка', 'error');
  } finally {
    isGeneratingSnapshots.value = false;
    snapshotsGenerationProgress.value = 0;
  }
};

// Показать статистику для партнерского договора
const showPartnerStatistics = async (contract: Contract) => {
  currentPartnerContract.value = contract;
  partnerStatsDialog.value = true;
  
  // Устанавливаем период по умолчанию:
  // Начало - первое число текущего месяца
  // Конец - вчерашний день (текущая дата - 1 день)
  const now = new Date();
  
  // Начало: первое число текущего месяца
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Конец: вчерашний день (текущая дата - 1 день)
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 1);
  
  // Форматируем даты для input type="date" (YYYY-MM-DD) в локальном времени
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  partnerStatsStartDate.value = formatDateForInput(startDate);
  partnerStatsEndDate.value = formatDateForInput(endDate);
  
  // Очищаем предыдущие данные - пользователь должен нажать кнопку "Получить данные"
  partnerSnapshots.value = [];
  partnerStatsSummary.value = null;
};

// Загрузить статистику партнерского договора за выбранный период
const loadPartnerStatistics = async () => {
  if (!currentPartnerContract.value) {
    return;
  }

  partnerStatsLoading.value = true;
  partnerSnapshots.value = [];
  partnerStatsSummary.value = null;

  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');
    
    if (!token) {
      throw new Error('Отсутствует токен авторизации');
    }

    if (!companyData) {
      throw new Error('Отсутствует информация о компании');
    }

    const company = JSON.parse(companyData);
    const tenantId = company.id;

    // Используем выбранный период
    // Парсим даты в формате YYYY-MM-DD и создаем даты в локальном времени
    // Это важно, чтобы выбранная дата (например, 5 декабря) не смещалась из-за часового пояса
    let startDate: Date;
    if (partnerStatsStartDate.value) {
      // Парсим дату в формате YYYY-MM-DD и создаем начало дня в локальном времени
      const [year, month, day] = partnerStatsStartDate.value.split('-').map(Number);
      startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      throw new Error('Необходимо указать дату начала периода');
    }
    
    let endDate: Date;
    if (partnerStatsEndDate.value) {
      // Парсим дату в формате YYYY-MM-DD и создаем конец дня в локальном времени (23:59:59)
      const [year, month, day] = partnerStatsEndDate.value.split('-').map(Number);
      endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      throw new Error('Необходимо указать дату окончания периода');
    }

    // Запрашиваем снимки партнерского договора
    // Отправляем даты в формате YYYY-MM-DD, чтобы избежать проблем с часовыми поясами
    const formatDateForQuery = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const response = await fetch(
      `${config.apiBaseUrl}/auth/contracts/${currentPartnerContract.value.id}/partner-snapshots?start_date=${formatDateForQuery(startDate)}&end_date=${formatDateForQuery(endDate)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': String(tenantId)
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка получения снимков: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📊 Партнерская статистика получена:', data.summary);
    console.log('💰 price_per_object_for_period:', data.summary?.price_per_object_for_period);
    console.log('📅 monthly_price:', data.summary?.monthly_price, typeof data.summary?.monthly_price);
    console.log('🔢 total_days:', data.summary?.total_days);
    
    if (data.status === 'success' && data.snapshots) {
      // Фильтруем снимки по выбранному периоду на фронтенде для гарантии
      // (на случай, если бэкенд вернул данные за другие даты)
      const filteredSnapshots = data.snapshots.filter((snapshot: any) => {
        if (!snapshot.snapshot_date) return false;
        const snapshotDate = new Date(snapshot.snapshot_date);
        // Проверяем, что дата снимка находится в выбранном диапазоне
        return snapshotDate >= startDate && snapshotDate <= endDate;
      });
      
      partnerSnapshots.value = filteredSnapshots;
      partnerStatsSummary.value = data.summary;
    } else {
      throw new Error('Неверный формат ответа от сервера');
    }
  } catch (error: any) {
    console.error('Ошибка загрузки статистики партнерского договора:', error);
    showSnackbarMessage(error.message || 'Ошибка загрузки статистики', 'error');
  } finally {
    partnerStatsLoading.value = false;
  }
};

// Создать снимки за выбранный период
const generateSnapshotsForPeriod = async () => {
  if (!currentPartnerContract.value || !partnerStatsStartDate.value || !partnerStatsEndDate.value) {
    showSnackbarMessage('Выберите период для создания снимков', 'warning');
    return;
  }

  isGeneratingSnapshots.value = true;
  snapshotsGenerationProgress.value = 0;

  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');
    
    if (!token) {
      throw new Error('Отсутствует токен авторизации');
    }

    if (!companyData) {
      throw new Error('Отсутствует информация о компании');
    }

    const company = JSON.parse(companyData);
    const tenantId = company.id;

    // Симулируем прогресс (так как backend создает все снимки за один запрос)
    const progressInterval = setInterval(() => {
      if (snapshotsGenerationProgress.value < 90) {
        snapshotsGenerationProgress.value += 5;
      }
    }, 300);

    const response = await fetch(
      `${config.apiBaseUrl}/auth/contracts/${currentPartnerContract.value.id}/partner-snapshots/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': String(tenantId)
        },
        body: JSON.stringify({
          start_date: partnerStatsStartDate.value,
          end_date: partnerStatsEndDate.value
        })
      }
    );

    clearInterval(progressInterval);
    snapshotsGenerationProgress.value = 95;

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка создания снимков');
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      snapshotsGenerationProgress.value = 100;
      
      // Формируем детальное сообщение
      // Используем period_days из ответа backend (точное количество дней в периоде)
      const totalDays = data.period_days || (data.success_count + data.error_count);
      let message = `✅ Снимки успешно созданы!\n\n`;
      message += `📊 Обработано дней: ${totalDays}\n`;
      message += `✓ Успешно: ${data.success_count}\n`;
      
      if (data.error_count > 0) {
        message += `✗ Ошибок: ${data.error_count}`;
      }
      
      showSnackbarMessage(message, data.error_count > 0 ? 'warning' : 'success');
      
      // Небольшая задержка чтобы пользователь увидел 100%
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Перезагружаем статистику
      await loadPartnerStatistics();
    } else {
      throw new Error('Неверный формат ответа от сервера');
    }
  } catch (error: any) {
    console.error('Ошибка создания снимков за период:', error);
    showSnackbarMessage(`❌ Ошибка создания снимков\n\n${error.message}`, 'error');
  } finally {
    isGeneratingSnapshots.value = false;
    snapshotsGenerationProgress.value = 0;
  }
};

const calculateCost = async (contract: Contract) => {
  // Для партнерских договоров открываем специальную статистику
  if (contract.contract_type === 'partner') {
    showPartnerStatistics(contract);
    return;
  }

  // Для клиентских договоров - открываем диалог расчета стоимости
  currentContractForBreakdown.value = contract;
  billingBreakdownDialog.value = true;
  billingBreakdownLoading.value = true;
  billingBreakdownData.value = null;

  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');
    
    if (!token) {
      throw new Error('Отсутствует токен авторизации');
    }

    let companyId = null;
    if (companyData) {
      try {
        const company = JSON.parse(companyData);
        companyId = company.id;
      } catch (e) {
        console.error('Ошибка парсинга данных компании:', e);
      }
    }

    if (!companyId) {
      throw new Error('Отсутствует ID компании');
    }

    const response = await fetch(
      `${config.apiBaseUrl}/auth/billing/contracts/${contract.id}/breakdown`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': companyId,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Ошибка ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      billingBreakdownData.value = result.data;
    } else {
      throw new Error(result.error || 'Неизвестная ошибка');
    }
  } catch (error: any) {
    console.error('Ошибка при загрузке детализации расчета:', error);
    const errorMessage = error.message || 'Ошибка при загрузке детализации расчета';
    showSnackbarMessage(errorMessage, 'error');
    // Не закрываем диалог, чтобы пользователь мог увидеть ошибку
    // billingBreakdownDialog.value = false;
  } finally {
    billingBreakdownLoading.value = false;
  }
};


const deleteContract = async (contract: Contract) => {
  if (!confirm(`Вы уверены, что хотите удалить договор ${contract.number}?`)) {
    return;
  }

  try {
    const contractsService = (await import('@/services/contractsService')).default;
    await contractsService.deleteContract(contract.id);
    await loadContracts();
    showSnackbarMessage('Договор успешно удален', 'success');
  } catch (error) {
    console.error('Error deleting contract:', error);
    showSnackbarMessage('Ошибка удаления договора', 'error');
  }
};

const showSnackbarMessage = (text: string, color: string) => {
  snackbarText.value = text;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

// Утилиты
const formatCurrency = (amount: string | number, currency = 'RUB'): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
  }).format(value || 0);
};

// Сумма без символа валюты — для колонок списка договоров (валюта ясна из договора).
const formatMoneyPlain = (amount: string | number): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

// Форматирование с высокой точностью (для партнерских снимков)
const formatCurrencyPrecise = (amount: string | number): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  // Показываем с 2 знаками после запятой, но без округления вверх
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

// Форматирование с максимальной точностью (для тарифа за объект/период)
// Показываем столько знаков, сколько нужно для точного расчета
const formatCurrencyExtraPrecise = (amount: string | number): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  // Используем toFixed для точности, затем добавляем валюту
  const formatted = (value || 0).toFixed(6);
  return `${formatted} ₽`;
};

const formatCurrencyShort = (amount: string | number): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}М ₽`;
  } else if (value >= 1000) {
    return `${Math.round(value / 1000)}К ₽`;
  } else {
    return `${value} ₽`;
  }
};

const formatDate = (date: string | null | undefined): string => {
  if (!date) {
    return 'Не указан';
  }
  const dateObj = new Date(date);
  // Проверяем, является ли дата валидной и не является ли она "эпохой Unix" (01.01.1970)
  if (isNaN(dateObj.getTime()) || dateObj.getFullYear() === 1970) {
    return 'Не указан';
  }
  // Формат дд.мм.гг (2-значный год) — компактнее.
  return dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const getBillingPeriodLabel = (period: string): string => {
  const labels: Record<string, string> = {
    hourly: 'Часовой',
    daily: 'Дневной',
    weekly: 'Недельный',
    monthly: 'Месячный',
    yearly: 'Годовой',
    'one-time': 'Разовый'
  };
  return labels[period] || period;
};

const getBillingPeriodColor = (period: string): string => {
  const colors: Record<string, string> = {
    hourly: 'orange',
    daily: 'cyan',
    weekly: 'teal',
    monthly: 'blue',
    yearly: 'purple',
    'one-time': 'grey'
  };
  return colors[period] || 'blue';
};

// Функция для форматирования периода (начало - конец)
const formatPeriod = (startDate: string | null | undefined, endDate: string | null | undefined): string => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  // Если обе даты не указаны, показываем просто "Не указан"
  if (start === 'Не указан' && end === 'Не указан') {
    return 'Не указан';
  }
  
  // Если указаны обе даты, показываем период
  if (start !== 'Не указан' && end !== 'Не указан') {
    return `${start} - ${end}`;
  }
  
  // Если указана только одна дата
  if (start !== 'Не указан') {
    return `${start} - Не указан`;
  }
  
  return `Не указан - ${end}`;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'grey',
    active: 'green',
    expired: 'red',
    cancelled: 'grey',
    suspended: 'orange',
  };
  return colors[status] || 'grey';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Черновик',
    active: 'Активный',
    expired: 'Истекший',
    cancelled: 'Отмененный',
    suspended: 'Приостановленный',
  };
  return labels[status] || status;
};

const isExpiringSoon = (contract: Contract): boolean => {
  const endDate = new Date(contract.end_date);
  const notifyDate = new Date(endDate);
  notifyDate.setDate(notifyDate.getDate() - contract.notify_before);
  const now = new Date();
  
  return now >= notifyDate && now <= endDate;
};

const getPeriodClass = (contract: Contract): string => {
  // Если дата окончания не указана или невалидна, не применяем стиль
  if (!contract.end_date) {
    return 'text-medium-emphasis';
  }
  
  const endDate = new Date(contract.end_date);
  
  // Проверяем, что дата валидна и не является эпохой Unix
  if (isNaN(endDate.getTime()) || endDate.getFullYear() === 1970) {
    return 'text-medium-emphasis';
  }
  
  const now = new Date();
  
  if (now > endDate) {
    return 'text-error';
  } else if (isExpiringSoon(contract)) {
    return 'text-warning';
  } else {
    return 'text-success';
  }
};

const getPeriodText = (contract: Contract): string => {
  // Если дата окончания не указана или невалидна, показываем "Не указан"
  if (!contract.end_date) {
    return 'Период не установлен';
  }
  
  const endDate = new Date(contract.end_date);
  
  // Проверяем, что дата валидна и не является эпохой Unix
  if (isNaN(endDate.getTime()) || endDate.getFullYear() === 1970) {
    return 'Период не установлен';
  }
  
  const now = new Date();
  
  if (now > endDate) {
    return 'Истек';
  } else if (isExpiringSoon(contract)) {
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Через ${days} дн.`;
  } else {
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} дн.`;
  }
};

// Получение периода для партнерского договора
const getPartnerContractPeriod = (contract: Contract): string => {
  // Если период установлен в базе, используем его
  if (contract.start_date && contract.end_date) {
    return formatPeriod(contract.start_date, contract.end_date);
  }
  
  // Иначе рассчитываем автоматически: от даты создания до конца текущего года
  const startDate = contract.created_at ? new Date(contract.created_at) : new Date();
  const endOfYear = new Date(startDate.getFullYear(), 11, 31); // 31 декабря
  
  const startStr = startDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const endStr = endOfYear.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  return `${startStr} - ${endStr}`;
};

const getPeriodTooltipText = (contract: Contract): string => {
  // Для партнерских договоров - специальный текст
  if (contract.contract_type === 'partner') {
    const now = new Date();
    let endDate: Date;
    
    // Если период установлен в базе, используем его
    if (contract.end_date) {
      endDate = new Date(contract.end_date);
      if (isNaN(endDate.getTime()) || endDate.getFullYear() === 1970) {
        // Если дата невалидна, рассчитываем до конца текущего года
        const startDate = contract.created_at ? new Date(contract.created_at) : now;
        endDate = new Date(startDate.getFullYear(), 11, 31); // 31 декабря
      }
    } else {
      // Если период не установлен, рассчитываем до конца текущего года
      const startDate = contract.created_at ? new Date(contract.created_at) : now;
      endDate = new Date(startDate.getFullYear(), 11, 31); // 31 декабря
    }
    
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 0) {
      return `Партнерский договор действует до конца года (${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}). Автоматическая пролонгация включена.`;
    } else {
      return `Партнерский договор с автоматической пролонгацией на следующий год.`;
    }
  }
  
  // Если дата окончания не указана или невалидна
  if (!contract.end_date) {
    return 'Период действия договора не установлен. Он будет установлен при создании подписки.';
  }
  
  const endDate = new Date(contract.end_date);
  
  // Проверяем, что дата валидна и не является эпохой Unix
  if (isNaN(endDate.getTime()) || endDate.getFullYear() === 1970) {
    return 'Период действия договора не установлен. Он будет установлен при создании подписки.';
  }
  
  const now = new Date();
  
  if (now > endDate) {
    const days = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    return `Договор истек ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`;
  } else if (isExpiringSoon(contract)) {
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Договор истекает через ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}. Требуется продление.`;
  } else {
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Договор активен. До истечения осталось ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
  }
};

// Функция loadSubscriptions больше не нужна - подписки передаются через props из родительского компонента

const loadContracts = async (resetPagination = true, skipStats = true) => {
  console.log('🔄 ContractsTab: Начинаем загрузку договоров...');
  
  if (resetPagination) {
  loading.value = true;
    currentPage.value = 1;
    contracts.value = [];
    statsLoadedMap.value.clear();
  }
  
  try {
    const contractsService = (await import('@/services/contractsService')).default;
    
    // 🔍 Загружаем все договоры для локального поиска (без серверной фильтрации по поиску)
    const limit = 10000; // Загружаем много записей для локального поиска
    const page = currentPage.value;
    
    // 🚀 Progressive Loading: сначала загружаем без статистики (быстро)
    const response = await contractsService.getContracts({
      // search: searchQuery.value, // <--- УБРАНО: поиск теперь локальный
      status: statusFilter.value || undefined,
      is_active: activeFilter.value !== null ? activeFilter.value : undefined,
      page: page,
      limit: limit,
      skip_stats: skipStats ? 'true' : undefined, // 🚀 Пропуск статистики для быстрой загрузки
      // 🔄 Серверная сортировка
      sort_by: sortBy.value[0]?.key || 'created_at',
      sort_order: sortBy.value[0]?.order || 'desc',
    } as any);
    
    // При первой загрузке заменяем, при догрузке - добавляем
    if (resetPagination) {
    contracts.value = response.contracts || [];
    } else {
      contracts.value = [...contracts.value, ...(response.contracts || [])];
    }
    
    totalContracts.value = response.total || 0;
    hasMoreContracts.value = contracts.value.length < totalContracts.value;
    
    console.log(`✅ ContractsTab: Загружено ${response.contracts?.length || 0} договоров (всего: ${contracts.value.length} из ${totalContracts.value})`);
    
    // 🚀 Progressive Loading: загружаем статистику в фоне
    if (skipStats && response.contracts?.length) {
      loadContractsStats(response.contracts);
    }
    
    // Логируем данные первого договора для отладки
    if (contracts.value.length > 0) {
      const firstContract = contracts.value[0];
      console.log('📋 Первый договор:', {
        id: firstContract.id,
        number: firstContract.number,
        contract_type: firstContract.contract_type,
        partner_company_id: firstContract.partner_company_id,
        total_amount: firstContract.total_amount,
        objects_count: firstContract.objects?.length || 0,
        objects: firstContract.objects
      });
    }
    
    // Логируем все contract_type для отладки
    const contractTypes = contracts.value.map(c => ({
      number: c.number,
      contract_type: c.contract_type || 'ОТСУТСТВУЕТ',
      partner_company_id: c.partner_company_id || 'ОТСУТСТВУЕТ'
    }));
    console.log('🔍 Типы договоров:', contractTypes);
    console.table(contractTypes);
    
    // Подписки теперь передаются через props из родительского компонента
  } catch (error) {
    console.error('Ошибка загрузки договоров:', error);
    showSnackbarMessage('Ошибка загрузки договоров', 'error');
    contracts.value = [];
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 🚀 Функция для догрузки данных при скроллинге
const loadMore = async () => {
  if (loadingMore.value || !hasMoreContracts.value) {
    return;
  }
  
  console.log('📜 Догружаем следующую страницу договоров...');
  loadingMore.value = true;
  currentPage.value += 1;
  
  await loadContracts(false, true); // false = не сбрасывать пагинацию, true = skip_stats
};

// 🚀 Progressive Loading: загрузка статистики в фоне
const loadContractsStats = async (contractsList: Contract[]) => {
  if (statsLoading.value) return;
  
  statsLoading.value = true;
  console.log('📊 Progressive Loading: загружаем статистику для', contractsList.length, 'договоров...');
  
  try {
    const contractsService = (await import('@/services/contractsService')).default;
    
    // Загружаем статистику параллельно (по 5 одновременно)
    const batchSize = 5;
    for (let i = 0; i < contractsList.length; i += batchSize) {
      const batch = contractsList.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (contract) => {
          // Пропускаем если уже загружено
          if (statsLoadedMap.value.get(contract.id)) return;
          
          try {
            const stats = await contractsService.getContractStats(contract.id);

            // Обновляем договор в списке
            const idx = contracts.value.findIndex(c => c.id === contract.id);
            if (idx !== -1) {
              // Реальные объекты с именами (резолв из axenta snapshot). Fallback на
              // placeholder по count если список не пришёл (партнёрские договоры без
              // contract_objects — там объекты в Axenta Cloud, не привязаны через junction).
              let objects: any[] = [];
              try {
                const real = await contractsService.getContractObjects(contract.id);
                objects = real.map(o => ({ id: o.object_id, name: o.name, account_name: o.account_name }));
              } catch {
                // игнор — ниже fallback
              }
              if (objects.length === 0 && stats.objects_count > 0) {
                objects = Array.from({ length: stats.objects_count }, (_, j) => ({
                  id: j + 1,
                  name: `Объект ${j + 1}`,
                  company_id: contract.partner_company_id || 0,
                }));
              }

              contracts.value[idx] = {
                ...contracts.value[idx],
                objects: objects as any,
              };

              statsLoadedMap.value.set(contract.id, true);

              // Баланс лицевого счёта (ledger) — для колонки «Баланс».
              try {
                const bal = await contractsService.getLedgerBalance(contract.id);
                ledgerBalanceMap.value = { ...ledgerBalanceMap.value, [contract.id]: bal.balance };
              } catch { /* нет ledger — оставляем undefined */ }
            }
          } catch (err) {
            console.warn(`⚠️ Не удалось загрузить статистику для договора ${contract.id}:`, err);
          }
        })
      );
    }
    
    console.log('✅ Progressive Loading: статистика загружена для всех договоров');
  } catch (error) {
    console.error('❌ Ошибка загрузки статистики:', error);
  } finally {
    statsLoading.value = false;
  }
};

// 📜 Обработчик скроллинга таблицы
const onTableScroll = (event: Event) => {
  // Отключаем скроллинг для догрузки, если используется пагинация через кнопки (нет поиска)
  // При поиске все результаты уже загружены, скроллинг не нужен
  if (!hasSearch.value) {
    return; // Используем пагинацию через кнопки
  }
  
  const target = event.target as HTMLElement;
  const scrollTop = target.scrollTop;
  const scrollHeight = target.scrollHeight;
  const clientHeight = target.clientHeight;
  
  // Загружаем следующую страницу, когда пользователь прокрутил 80% таблицы
  const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
  
  if (scrollPercentage > 0.8 && hasMoreContracts.value && !loadingMore.value) {
    loadMore();
  }
};

// Отслеживание изменений фильтров для автоматической перезагрузки
const debouncedLoadContracts = debounce(async () => {
  if (!demoMode.value) {
    await loadContracts(true); // true = сбросить пагинацию
  }
}, 300);

// Поиск (searchQuery) теперь локальный - не нужно перезагружать с сервера
watch([statusFilter, activeFilter, contractTypeFilter], () => {
  debouncedLoadContracts();
});

// Загрузка настроек биллинга для проверки статуса автопилота
const loadBillingSettings = async () => {
  try {
    const billingService = (await import('@/services/billingService')).default;
    const companyStr = localStorage.getItem('axenta_company');
    if (companyStr) {
      const companyData = JSON.parse(companyStr);
      const companyId = companyData.id || companyData.ID;
      if (companyId) {
        const settings = await billingService.getBillingSettings(Number(companyId));
        autopilotEnabled.value = settings.autopilot_enabled || false;
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки настроек биллинга:', error);
  }
};

// Lifecycle
onMounted(async () => {
  loadManagerOptions();
  await loadBillingSettings();
  if (demoMode.value) {
    await loadDemoContracts();
  } else {
    await loadContracts();
  }
});

// Экспортируем метод для обновления данных извне
// ========== МАССОВЫЕ ДЕЙСТВИЯ ==========
// Выделение строк таблицы. selectedIds — массив id договоров.
const selectedIds = ref<number[]>([]);
watch(selectedIds, (v) => emit('selection-changed', v.length));
const clearSelection = () => { selectedIds.value = []; };

const bulkLoading = ref(false);

// Диалог «Назначить менеджера».
const bulkManagerDialog = ref(false);
const bulkManagerId = ref<number | null>(null);
const openBulkManager = () => { bulkManagerId.value = null; bulkManagerDialog.value = true; };

// Диалог «Сменить статус» (только валидные статусы БД, без псевдо-«Истекающие»).
const bulkStatusOptions = [
  { value: 'draft', title: 'Черновик' },
  { value: 'active', title: 'Активный' },
  { value: 'suspended', title: 'Приостановленный' },
  { value: 'expired', title: 'Истекший' },
  { value: 'cancelled', title: 'Отмененный' },
];
const bulkStatusDialog = ref(false);
const bulkStatusValue = ref<string | null>(null);
const openBulkStatus = () => { bulkStatusValue.value = null; bulkStatusDialog.value = true; };

// Диалог подтверждения удаления.
const bulkDeleteDialog = ref(false);
const openBulkDelete = () => { bulkDeleteDialog.value = true; };

// Единый постпроцесс: показать итог {updated, failed}, обновить список, снять выделение.
const reportBulkResult = (res: { updated: number; failed: number[] }, verb: string) => {
  const failed = res.failed?.length ?? 0;
  if (failed > 0) {
    showSnackbarMessage(`${verb}: ${res.updated}, не удалось: ${failed} (активные с объектами / вне доступа)`, 'warning');
  } else {
    showSnackbarMessage(`${verb}: ${res.updated}`, 'success');
  }
};

const applyBulkManager = async () => {
  if (selectedIds.value.length === 0) { bulkManagerDialog.value = false; return; }
  bulkLoading.value = true;
  try {
    const svc = (await import('@/services/contractsService')).default;
    const res = await svc.bulkAssignManager(selectedIds.value, bulkManagerId.value);
    reportBulkResult(res, 'Менеджер назначен');
    bulkManagerDialog.value = false;
    clearSelection();
    await loadContracts(false, true);
  } catch (e: any) {
    showSnackbarMessage(e?.response?.data?.error || 'Ошибка назначения менеджера', 'error');
  } finally { bulkLoading.value = false; }
};

const applyBulkStatus = async () => {
  if (!bulkStatusValue.value || selectedIds.value.length === 0) { bulkStatusDialog.value = false; return; }
  bulkLoading.value = true;
  try {
    const svc = (await import('@/services/contractsService')).default;
    const res = await svc.bulkSetStatus(selectedIds.value, bulkStatusValue.value);
    reportBulkResult(res, 'Статус изменён');
    bulkStatusDialog.value = false;
    clearSelection();
    await loadContracts(false, true);
  } catch (e: any) {
    showSnackbarMessage(e?.response?.data?.error || 'Ошибка смены статуса', 'error');
  } finally { bulkLoading.value = false; }
};

const applyBulkDelete = async () => {
  if (selectedIds.value.length === 0) { bulkDeleteDialog.value = false; return; }
  bulkLoading.value = true;
  try {
    const svc = (await import('@/services/contractsService')).default;
    const res = await svc.bulkDelete(selectedIds.value);
    reportBulkResult(res, 'Удалено');
    bulkDeleteDialog.value = false;
    clearSelection();
    await loadContracts(true, true);
  } catch (e: any) {
    showSnackbarMessage(e?.response?.data?.error || 'Ошибка удаления', 'error');
  } finally { bulkLoading.value = false; }
};

// Экспорт выделенных в Excel (lazy exceljs).
const exportSelected = async () => {
  if (selectedIds.value.length === 0) return;
  bulkLoading.value = true;
  try {
    const ExcelJS = (await import('exceljs')).default;
    const rows = filteredContracts.value.filter((ct: any) => selectedIds.value.includes(ct.id));
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Договоры');
    ws.columns = [
      { header: '№', key: 'number', width: 22 },
      { header: 'Клиент', key: 'client', width: 32 },
      { header: 'Тип', key: 'type', width: 14 },
      { header: 'Статус', key: 'status', width: 16 },
      { header: 'Менеджер', key: 'manager', width: 24 },
      { header: 'Сумма', key: 'amount', width: 16 },
    ];
    rows.forEach((ct: any) => ws.addRow({
      number: ct.number,
      client: ct.client_short_name || ct.client_name || '',
      type: ct.contract_type,
      status: ct.status,
      manager: ct.manager_name || '',
      amount: ct.total_amount || '',
    }));
    ws.getRow(1).font = { bold: true };
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts_${rows.length}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showSnackbarMessage(`Экспортировано: ${rows.length}`, 'success');
  } catch (e: any) {
    showSnackbarMessage('Ошибка экспорта', 'error');
  } finally { bulkLoading.value = false; }
};

defineExpose({
  loadContracts,
  refresh: loadContracts, // Алиас для удобства
  // Массовые действия — вызывает FAB из Billing.vue.
  selectedCount: computed(() => selectedIds.value.length),
  clearSelection,
  openBulkManager,
  openBulkStatus,
  openBulkDelete,
  exportSelected,
  // Перенесённые в FAB действия тулбара.
  startAutopilot,
  autopilotEnabled,
});
</script>

<style scoped>
.contracts-tab {
  /* Стили для вкладки внутри биллинга */
}

/* История лицевого счёта — без переноса строк в ячейках */
.ledger-history-table :deep(th),
.ledger-history-table :deep(td) {
  white-space: nowrap;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.section-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.demo-alert {
  border-radius: 8px;
}

.alert-content {
  font-size: 14px;
}


.filters-card {
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* Flexbox-ряд фильтров (как на «Учётных записях»): поля на всю ширину, мин. отступ,
   кнопка сброса inline в конце. */
.filters-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  width: 100%;
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.filter-search {
  flex: 3;
}

.filters-row :deep(.v-select),
.filter-search :deep(.v-text-field) {
  width: 100%;
  flex: 1;
}

.filter-clear {
  flex-shrink: 0;
  flex-grow: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  min-width: 44px;
}

.filter-clear :deep(.v-btn) {
  height: 40px !important;
  width: 40px !important;
  min-width: 40px !important;
  border-radius: 10px !important;
  transition: all 0.2s ease;
}

.filter-clear :deep(.v-btn:hover) {
  transform: scale(1.05);
}

.filter-actions {
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 8px;
}

.actions-container {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: flex-end;
}

.filter-create,
.filter-clear {
  display: flex;
  align-items: center;
}

/* Стили для фильтра "Истекающие" */
.expiring-filter-col {
  display: flex;
  align-items: center;
}

.expiring-filter-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 8px;
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-radius: 10px;
  background-color: white;
  transition: all 0.2s ease;
}

.expiring-filter-wrapper:hover {
  border-color: rgba(0, 0, 0, 0.87);
}

.expiring-switch :deep(.v-switch) {
  margin: 0;
}

.expiring-switch :deep(.v-switch__track) {
  height: 20px;
  width: 36px;
}

.expiring-switch :deep(.v-switch__thumb) {
  height: 16px;
  width: 16px;
}

.expiring-switch :deep(.v-label) {
  font-size: 0.875rem;
  white-space: nowrap;
  margin-left: 8px;
}

/* Стили для кнопок в стиле AccountsPage */
.filter-autopilot :deep(.v-btn),
.filter-create :deep(.v-btn),
.filter-clear :deep(.v-btn) {
  height: 44px !important;
  min-height: 44px !important;
  width: 44px !important;
  min-width: 44px !important;
  padding: 0 !important;
  border-radius: 10px !important;
}

.filter-clear :deep(.v-btn) {
  width: 44px !important;
  min-width: 44px !important;
}

/* Специальные стили для кнопки Автопилот */
.autopilot-button {
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3) !important;
  transition: all 0.2s ease !important;
}

.autopilot-button:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.4) !important;
  transform: translateY(-1px) !important;
}

.autopilot-button:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.autopilot-button :deep(.v-icon) {
  color: white !important;
  font-size: 20px !important;
}

/* Специальные стили для кнопки Создать */
.create-button {
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

.filter-autopilot :deep(.v-btn .v-icon),
.filter-create :deep(.v-btn .v-icon),
.filter-clear :deep(.v-btn .v-icon) {
  font-size: 20px !important;
}

.filter-autopilot :deep(.v-btn .v-btn__content),
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
    box-shadow: 0 2px 12px rgba(255, 152, 0, 0.5);
  }
  100% {
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  }
}

/* Адаптивность для мобильных */
@media (max-width: 960px) {
  .actions-container {
    gap: 6px;
    justify-content: flex-start;
  }
  
  .btn-text {
    font-size: 0.8rem;
  }
}

@media (max-width: 600px) {
  .actions-container {
    justify-content: flex-end;
    gap: 6px;
  }
  
  .filter-autopilot,
  .filter-create,
  .filter-clear {
    min-width: 44px !important;
  }
  
  .actions-container .v-btn {
    min-width: 44px !important;
    width: 44px !important;
    flex: none;
    padding: 0 !important;
  }
}

.contracts-table {
  --v-table-row-height: 56px;
}

/* Улучшенная адаптивность таблицы */
.contracts-table :deep(.v-data-table__wrapper) {
  overflow-x: auto;
}

.contracts-table :deep(table) {
  min-width: 1000px;
  table-layout: auto;
}

.contracts-table :deep(th) {
  white-space: nowrap;
  font-weight: 600;
  font-size: 0.8125rem;
  padding: 12px 8px !important;
  text-align: center !important;
}

.contracts-table :deep(td) {
  padding: 8px 8px !important;
  vertical-align: middle;
  text-align: center !important;
}

/* Колонка чекбокса (выделение) — узкая, минимум места */
.contracts-table :deep(th:first-child),
.contracts-table :deep(td:first-child) {
  width: 40px !important;
  max-width: 40px !important;
  padding-left: 4px !important;
  padding-right: 0 !important;
}

.contracts-table :deep(th:first-child .v-selection-control),
.contracts-table :deep(td:first-child .v-selection-control) {
  min-height: auto;
}

.contracts-table :deep(th:last-child),
.contracts-table :deep(td:last-child) {
  padding-right: 8px !important;
}

/* Responsive: скрытие некоторых колонок на малых экранах */
@media (max-width: 1400px) {
  .contracts-table :deep(th:nth-child(2)),
  .contracts-table :deep(td:nth-child(2)) {
    display: none; /* Скрываем колонку "Дата" на средних экранах */
  }
}

@media (max-width: 1200px) {
  .contracts-table :deep(th:nth-child(5)),
  .contracts-table :deep(td:nth-child(5)) {
    display: none; /* Скрываем колонку "Тариф" на малых экранах */
  }
}

@media (max-width: 960px) {
  .contracts-table :deep(table) {
    min-width: 700px;
  }
  
  .contracts-table :deep(th:nth-child(6)),
  .contracts-table :deep(td:nth-child(6)) {
    display: none; /* Скрываем колонку "Период" на планшетах */
  }
}

.contract-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 2px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contract-client {
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.4;
  text-align: center;
  white-space: normal;
  word-wrap: break-word;
  word-break: normal;
  hyphens: auto;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
  max-width: 30ch;
  margin: 0 auto;
  overflow-wrap: break-word;
}

.sequential-number {
  font-weight: 600;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
}

.created-date {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  text-align: center;
}

.amount-value {
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  gap: 2px;
  justify-content: center;
  align-items: center;
}

.empty-state {
  border-radius: 8px;
}

/* Темная тема для ContractsTab */
[data-theme="dark"] .filters-card {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .expiring-filter-wrapper {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .expiring-filter-wrapper:hover {
  border-color: #007AFF !important;
}

[data-theme="dark"] .v-text-field :deep(.v-field) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .v-text-field :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .v-text-field :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .v-select :deep(.v-field) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .v-select :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .v-select :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .empty-state {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .empty-state h3 {
  color: #ffffff !important;
}

[data-theme="dark"] .empty-state p {
  color: #8e8e93 !important;
}

[data-theme="dark"] .empty-state .v-icon {
  color: #8e8e93 !important;
}

[data-theme="dark"] .v-data-table {
  background-color: #2c2c2e !important;
  color: #ffffff !important;
}

[data-theme="dark"] .v-data-table :deep(thead) {
  background-color: #1a1a1a !important;
}

[data-theme="dark"] .v-data-table :deep(th) {
  color: #ffffff !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .v-data-table :deep(td) {
  color: #ffffff !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .v-data-table :deep(.v-data-table__tr) {
  background-color: #2c2c2e !important;
}

[data-theme="dark"] .v-data-table :deep(.v-data-table__tr:hover) {
  background-color: #3a3a3c !important;
}

[data-theme="dark"] .contract-client {
  color: #8e8e93 !important;
}

[data-theme="dark"] .v-card {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .v-card-title {
  color: #ffffff !important;
}

[data-theme="dark"] .v-card-text {
  color: #ffffff !important;
}

/* Стили для tooltip с объектами */
.objects-count {
  transition: color 0.2s ease;
}

.objects-count:hover {
  color: var(--v-primary-base, #1976d2);
  text-decoration: underline;
}

.objects-tooltip {
  max-width: 300px;
  padding: 8px 0;
}

.objects-tooltip-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 8px;
  padding: 0 12px;
  color: rgba(0, 0, 0, 0.87);
}

.objects-tooltip-list {
  max-height: 320px; /* ~10 объектов, дальше скролл */
  overflow-y: auto;
  padding: 0 12px;
}

.objects-tooltip-item {
  padding: 4px 0;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  line-height: 1.5;
}

.objects-tooltip-item:last-child {
  border-bottom: none;
}

.objects-tooltip-item strong {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

.objects-tooltip-id {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.5);
  margin-left: 4px;
}

.objects-tooltip-empty {
  padding: 4px 0;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.5);
  font-style: italic;
}

[data-theme="dark"] .objects-tooltip-title {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .objects-tooltip-item {
  color: rgba(255, 255, 255, 0.7);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .objects-tooltip-item strong {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .objects-tooltip-id {
  color: rgba(255, 255, 255, 0.5);
}

[data-theme="dark"] .objects-tooltip-empty {
  color: rgba(255, 255, 255, 0.5);
}

/* Стили для tooltip периода */
.period-tooltip {
  max-width: 250px;
  padding: 4px 0;
}

.period-tooltip-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.87);
}

.period-tooltip-content {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.4;
}

[data-theme="dark"] .period-tooltip-title {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .period-tooltip-content {
  color: rgba(255, 255, 255, 0.7);
}

/* Стили для tooltip тарифа */
.tariff-tooltip {
  max-width: 280px;
  padding: 4px 0;
}

.tariff-tooltip-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.87);
}

.tariff-tooltip-content {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.4;
}

[data-theme="dark"] .tariff-tooltip-title {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .tariff-tooltip-content {
  color: rgba(255, 255, 255, 0.7);
}

/* Улучшенные hover-эффекты для строк таблицы */
.contracts-table :deep(tbody tr) {
  transition: background-color 0.2s ease, transform 0.1s ease;
  cursor: pointer;
}

.contracts-table :deep(tbody tr:hover) {
  background-color: rgba(25, 118, 210, 0.04) !important;
}

[data-theme="dark"] .contracts-table :deep(tbody tr:hover) {
  background-color: rgba(0, 122, 255, 0.08) !important;
}

/* Анимация для ячеек */
.contracts-table :deep(td) {
  transition: padding 0.2s ease;
}

/* Стили для скроллбара */
.contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar {
  height: 8px;
}

.contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

[data-theme="dark"] .sequential-number {
  color: rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .created-date {
  color: rgba(255, 255, 255, 0.7);
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-actions {
    justify-content: stretch;
  }

}

/* Стили для диалога детализации расчета */
/* Шапка детализации (период/итоги) закреплена при скролле списка месяцев */
.breakdown-summary-sticky {
  position: sticky;
  top: 0;
  z-index: 3;
  padding: 16px 16px 0;
  background: rgb(var(--v-theme-surface));
}

.completed-month {
  background-color: rgba(76, 175, 80, 0.05);
}

.future-month {
  background-color: rgba(255, 152, 0, 0.05);
}

[data-theme="dark"] .completed-month {
  background-color: rgba(76, 175, 80, 0.1);
}

[data-theme="dark"] .future-month {
  background-color: rgba(255, 152, 0, 0.1);
}

.v-expansion-panel-title {
  min-height: 64px !important;
}

.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding: 16px;
}

.breakdown-table {
  background: transparent !important;
}

.breakdown-table th {
  font-weight: 600 !important;
  font-size: 0.75rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(0, 0, 0, 0.6) !important;
  padding: 12px 16px !important;
}

[data-theme="dark"] .breakdown-table th {
  color: rgba(255, 255, 255, 0.6) !important;
}

.breakdown-table td {
  padding: 12px 16px !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
}

[data-theme="dark"] .breakdown-table td {
  border-bottom-color: rgba(255, 255, 255, 0.06) !important;
}

.breakdown-table tbody tr:last-child td {
  border-bottom: none !important;
}

/* Стили для итоговой строки */
.total-row {
  background-color: #f5f5f5 !important;
}

[data-theme="dark"] .total-row {
  background-color: #2c2c2e !important;
}

[data-theme="dark"] .total-row td {
  color: #ffffff !important;
}

/* Стили для компактной пагинации (как на /accounts) */
.compact-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 20px 24px;
  flex-wrap: nowrap;
  white-space: nowrap;
  min-height: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 0 16px;
}

.items-select {
  min-width: 60px !important;
  width: fit-content !important;
  max-width: 120px !important;
  flex-shrink: 0;
  height: 40px;
}

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
  color: #555;
  flex-shrink: 0;
  min-width: 120px;
  text-align: center;
  font-weight: 600;
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 4px;
  background-color: #f0f0f0;
  border-radius: 6px;
}

.page-info {
  font-size: 0.9rem;
  color: #555;
  font-weight: 700;
  min-width: 50px;
  text-align: center;
  padding: 8px 12px;
  background-color: #e8e8e8;
  border-radius: 6px;
}

.nav-controls .v-btn {
  min-width: 32px !important;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: white;
  border: 1px solid #ddd;
}

/* Темная тема для пагинации */
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
</style>
