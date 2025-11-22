<template>
  <v-container>
    <!-- Заголовок страницы -->
    <v-row class="mb-6">
      <v-col>
        <h1 class="text-h3 font-weight-bold text-primary">Биллинг и договоры</h1>
        <p class="text-h6 text-grey-darken-2 mt-2">
          Управление договорами, тарифными планами, подписками и счетами
        </p>
      </v-col>
    </v-row>

    <!-- Статистические карточки -->
    <v-row class="mb-6 stats-row" no-gutters>
      <!-- Основная статистика биллинга -->
      <v-col cols="12" sm="6" md="3" class="pa-2">
        <v-card variant="outlined" class="stats-card text-center">
          <v-card-text class="pa-4">
            <v-icon size="32" color="primary" class="mb-2">mdi-currency-rub</v-icon>
            <div class="stat-value">{{ formatCurrency(dashboardData?.widgets.total_revenue.value || 0) }}</div>
            <div class="stat-label">Общий доход</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3" class="pa-2">
        <v-card variant="outlined" class="stats-card text-center">
          <v-card-text class="pa-4">
            <v-icon size="32" color="success" class="mb-2">mdi-credit-card-check</v-icon>
            <div class="stat-value">{{ dashboardData?.widgets.active_subscriptions.value || 0 }}</div>
            <div class="stat-label">Активные подписки</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3" class="pa-2">
        <v-card variant="outlined" class="stats-card text-center">
          <v-card-text class="pa-4">
            <v-icon size="32" color="warning" class="mb-2">mdi-clock-alert</v-icon>
            <div class="stat-value">{{ formatCurrency(dashboardData?.widgets.outstanding_amount.value || 0) }}</div>
            <div class="stat-label">К оплате</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3" class="pa-2">
        <v-card variant="outlined" class="stats-card text-center">
          <v-card-text class="pa-4">
            <v-icon size="32" color="error" class="mb-2">mdi-alert-circle</v-icon>
            <div class="stat-value">{{ formatCurrency(dashboardData?.widgets.overdue_amount.value || 0) }}</div>
            <div class="stat-label">Просрочено</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Статистика договоров -->
      <v-col cols="12" sm="6" md="3" class="pa-2">
        <v-card variant="outlined" class="stats-card text-center">
          <v-card-text class="pa-4">
            <v-icon size="32" color="primary" class="mb-2">mdi-file-document-multiple</v-icon>
            <div class="stat-value">{{ contractsStats?.total || 0 }}</div>
            <div class="stat-label">Всего договоров</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3" class="pa-2">
        <v-card variant="outlined" class="stats-card text-center">
          <v-card-text class="pa-4">
            <v-icon size="32" color="success" class="mb-2">mdi-check-circle</v-icon>
            <div class="stat-value">{{ contractsStats?.active || 0 }}</div>
            <div class="stat-label">Активные договоры</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3" class="pa-2">
        <v-card variant="outlined" class="stats-card text-center">
          <v-card-text class="pa-4">
            <v-icon size="32" color="warning" class="mb-2">mdi-clock-alert</v-icon>
            <div class="stat-value">{{ contractsStats?.expiring_soon || 0 }}</div>
            <div class="stat-label">Истекают</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3" class="pa-2">
        <v-card variant="outlined" class="stats-card text-center">
          <v-card-text class="pa-4">
            <v-icon size="32" color="info" class="mb-2">mdi-currency-rub</v-icon>
            <div class="stat-value">{{ formatCurrencyShort(contractsStats?.total_amount || 0) }}</div>
            <div class="stat-label">Стоимость</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Вкладки -->
    <v-tabs v-model="activeTab" color="primary" class="mb-6">
      <v-tab value="contracts">
        <v-icon left>mdi-file-document-multiple</v-icon>
        Договоры
      </v-tab>
      <v-tab value="subscriptions">
        <v-icon left>mdi-credit-card</v-icon>
        Подписки
      </v-tab>
      <v-tab value="invoices">
        <v-icon left>mdi-file-document</v-icon>
        Счета
      </v-tab>
      <v-tab value="settings">
        <v-icon left>mdi-cog</v-icon>
        Настройки
      </v-tab>
    </v-tabs>

    <!-- Содержимое вкладок -->
    <v-window v-model="activeTab">
      <!-- Вкладка договоров -->
      <v-window-item value="contracts">
        <ContractsTab ref="contractsTabRef" @stats-updated="handleContractsStatsUpdate" />
      </v-window-item>

      <!-- Подписки -->
      <v-window-item value="subscriptions">
        <v-card>
          <v-card-title>
            <span>Подписки</span>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              @click="openSubscriptionWizard()"
              prepend-icon="mdi-wizard-hat"
            >
              Создать подписку
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <!-- Фильтр по договору (если активен) -->
            <v-alert
              v-if="filteredByContractId"
              type="info"
              variant="tonal"
              closable
              @click:close="clearContractFilter"
              class="mb-4"
            >
              <div class="d-flex align-center">
                <v-icon icon="mdi-filter" class="mr-2" />
                <span>
                  Отображаются подписки по договору: <strong>{{ filteredByContractNumber }}</strong>
                </span>
              </div>
            </v-alert>

            <!-- Таблица подписок -->
            <v-data-table
              :headers="subscriptionHeaders"
              :items="filteredSubscriptions"
              :loading="loadingSubscriptions"
              class="elevation-1"
              item-value="id"
              :items-per-page="10"
            >
              <!-- Порядковый номер -->
              <template v-slot:item.sequential_number="{ index }">
                <div class="sequential-number">
                  {{ index + 1 }}
                </div>
              </template>

              <!-- Дата создания -->
              <template v-slot:item.created_at="{ item }">
                <div class="created-date">
                  {{ formatDate(item.created_at) }}
                </div>
              </template>

              <!-- Клиент и договор -->
              <template v-slot:item.client="{ item }">
                <v-tooltip location="top" v-if="item.contract">
                  <template #activator="{ props }">
                    <div class="subscription-client-info" v-bind="props">
                      <div class="client-name">{{ item.contract.client_short_name || item.contract.client_name }}</div>
                    </div>
                  </template>
                  <div>Договор: {{ item.contract.number }}</div>
                </v-tooltip>
                <div v-else class="subscription-client-info">
                  <div class="client-name text-grey">
                    Компания ID: {{ item.company_id }}
                  </div>
                </div>
              </template>

              <!-- План -->
              <template v-slot:item.billing_plan="{ item }">
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <div class="tariff-info" v-bind="props">
                      <v-chip size="small" color="primary" variant="tonal">
                        {{ item.billing_plan?.name || 'Не указан' }}
                      </v-chip>
                    </div>
                  </template>
                  <div>Стоимость: {{ formatPrice(item.billing_plan?.price || 0, item.billing_plan?.currency || 'RUB') }}</div>
                </v-tooltip>
              </template>

              <!-- Объекты -->
              <template v-slot:item.objects="{ item }">
                <v-tooltip location="top" :disabled="!item.objects_count || item.objects_count === 0">
                  <template #activator="{ props }">
                    <div v-bind="props" style="cursor: pointer;">
                      <div v-if="item.objects_count && item.objects_count > 0">
                        <v-chip size="small" color="primary" variant="tonal">
                          {{ item.objects_count }} {{ item.objects_count === 1 ? 'объект' : item.objects_count < 5 ? 'объекта' : 'объектов' }}
                        </v-chip>
                      </div>
                      <span v-else class="text-grey">—</span>
                    </div>
                  </template>
                  <template #default>
                    <div class="objects-tooltip">
                      <div class="objects-tooltip-title">Привязанные объекты:</div>
                      <div class="objects-tooltip-list">
                        <div 
                          v-for="obj in item.objects" 
                          :key="obj.id"
                          class="objects-tooltip-item"
                        >
                          <span v-if="obj.name">
                            <strong>{{ obj.name }}</strong>
                            <span v-if="obj.name !== `Объект #${obj.id}`" class="objects-tooltip-id">(ID: {{ obj.id }})</span>
                          </span>
                          <span v-else>
                            Объект #{{ obj.id }}
                          </span>
                        </div>
                        <div v-if="!item.objects || item.objects.length === 0" class="objects-tooltip-empty">
                          Нет привязанных объектов
                        </div>
                      </div>
                    </div>
                  </template>
                </v-tooltip>
              </template>

              <!-- Даты -->
              <template v-slot:item.start_date="{ item }">
                <div class="subscription-date">
                  {{ formatDate(item.start_date) }}
                </div>
              </template>

              <template v-slot:item.next_payment_date="{ item }">
                <div class="subscription-date">
                  <span v-if="item.next_payment_date">
                    {{ formatDate(item.next_payment_date) }}
                  </span>
                  <span v-else class="text-grey">—</span>
                </div>
              </template>

              <!-- Статус подписки -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getSubscriptionStatusColor(item.status)"
                  size="small"
                >
                  {{ getSubscriptionStatusText(item.status) }}
                </v-chip>
              </template>

              <!-- Действия -->
              <template v-slot:item.actions="{ item }">
                <div class="actions-cell">
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click="openSubscriptionDialog(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-cancel"
                    size="small"
                    variant="text"
                    color="warning"
                    @click="cancelSubscription(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteSubscription(item)"
                  ></v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Счета -->
      <v-window-item value="invoices">
        <v-card>
          <v-card-title>
            <span>Счета</span>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              @click="openGenerateInvoiceDialog"
              prepend-icon="mdi-plus"
            >
              Сгенерировать счет
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <!-- Фильтры счетов -->
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-select
                  v-model="invoiceStatusFilter"
                  :items="invoiceStatusOptions"
                  label="Статус"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="invoiceDateStart"
                  label="Дата с"
                  type="date"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="invoiceDateEnd"
                  label="Дата по"
                  type="date"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Таблица счетов -->
            <v-data-table
              :headers="invoiceHeaders"
              :items="filteredInvoices"
              :loading="loadingInvoices"
              class="elevation-1"
              item-value="id"
              :items-per-page="10"
            >
              <!-- Порядковый номер -->
              <template v-slot:item.sequential_number="{ index }">
                <div class="sequential-number">
                  {{ index + 1 }}
                </div>
              </template>

              <!-- Номер счета -->
              <template v-slot:item.number="{ item }">
                <v-btn
                  variant="text"
                  color="primary"
                  @click="viewInvoice(item)"
                >
                  {{ item.number }}
                </v-btn>
              </template>

              <!-- Клиент и договор -->
              <template v-slot:item.client="{ item }">
                <v-tooltip location="top" v-if="item.contract">
                  <template #activator="{ props }">
                    <div 
                      class="subscription-client-info clickable" 
                      v-bind="props"
                      @click="navigateToSubscription(item)"
                    >
                      <div class="client-name-link">{{ item.contract.client_short_name || item.contract.client_name || 'Клиент не указан' }}</div>
                    </div>
                  </template>
                  <div>Договор: {{ item.contract.number }}<br>Кликните для просмотра подписки</div>
                </v-tooltip>
                <div v-else class="subscription-client-info">
                  <div class="client-name text-grey">
                    —
                  </div>
                </div>
              </template>

              <!-- Сумма -->
              <template v-slot:item.total_amount="{ item }">
                <div class="text-right">
                  <div class="font-weight-bold">{{ formatCurrency(item.total_amount) }}</div>
                  <div class="text-caption text-grey">
                    Оплачено: {{ formatCurrency(item.paid_amount) }}
                  </div>
                </div>
              </template>

              <!-- Даты -->
              <template v-slot:item.invoice_date="{ item }">
                {{ formatDate(item.invoice_date) }}
              </template>

              <template v-slot:item.due_date="{ item }">
                <div :class="{ 'text-error': isOverdue(item) }">
                  {{ formatDate(item.due_date) }}
                </div>
              </template>

              <!-- Статус -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getInvoiceStatusColor(item.status)"
                  size="small"
                >
                  {{ getInvoiceStatusLabel(item.status) }}
                </v-chip>
              </template>

              <!-- Действия -->
              <template v-slot:item.actions="{ item }">
                <div class="actions-cell">
                  <v-tooltip text="Просмотр">
                    <template #activator="{ props }">
                      <v-btn 
                        v-bind="props"
                        icon="mdi-eye" 
                        size="small" 
                        variant="text" 
                        @click="viewInvoice(item)" 
                      />
                    </template>
                  </v-tooltip>
                  
                  <v-tooltip text="Отправить счёт клиенту">
                    <template #activator="{ props }">
                      <v-btn 
                        v-if="item.status === 'draft'"
                        v-bind="props"
                        icon="mdi-send" 
                        size="small" 
                        variant="text" 
                        color="primary"
                        @click="sendInvoiceToClient(item)" 
                      />
                    </template>
                  </v-tooltip>
                  
                  <v-tooltip text="Обработать платёж">
                    <template #activator="{ props }">
                      <v-btn 
                        v-if="item.status !== 'paid' && item.status !== 'cancelled'"
                        v-bind="props"
                        icon="mdi-credit-card" 
                        size="small" 
                        variant="text" 
                        @click="processPaymentDialog(item)" 
                      />
                    </template>
                  </v-tooltip>
                  
                  <v-tooltip text="Отменить счёт">
                    <template #activator="{ props }">
                      <v-btn 
                        v-if="item.status !== 'cancelled'"
                        v-bind="props"
                        icon="mdi-cancel" 
                        size="small" 
                        variant="text" 
                        color="warning"
                        @click="cancelInvoiceConfirm(item)" 
                      />
                    </template>
                  </v-tooltip>
                  
                  <v-tooltip text="Удалить счёт">
                    <template #activator="{ props }">
                      <v-btn 
                        v-if="item.status !== 'paid'"
                        v-bind="props"
                        icon="mdi-delete" 
                        size="small" 
                        variant="text" 
                        color="error"
                        @click="deleteInvoiceConfirm(item)" 
                      />
                    </template>
                  </v-tooltip>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Настройки биллинга -->
      <v-window-item value="settings">
        <!-- Настройки биллинга -->
        <v-card>
          <v-card-title>Настройки биллинга</v-card-title>
          
          <v-card-text>
            <!-- Загрузка -->
            <div v-if="loadingSettings" class="text-center py-12">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-4 text-grey">Загрузка настроек...</p>
            </div>
            
            <!-- Форма настроек -->
            <v-form v-model="settingsFormValid" v-else-if="billingSettings">
              <v-row>
                <v-col cols="12" md="6">
                  <h4 class="mb-4">Генерация счетов</h4>
                  <v-switch
                    v-model="billingSettings.auto_generate_invoices"
                    label="Автоматическая генерация счетов"
                    color="primary"
                    :title="'По расписанию создаёт счета. Требует нумератора и реквизитов.'"
                  ></v-switch>
                  
                  <v-text-field
                    v-model.number="billingSettings.invoice_generation_day"
                    label="День месяца для генерации"
                    type="number"
                    min="1"
                    max="28"
                    hint="От 1 до 28"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model.number="billingSettings.invoice_payment_term_days"
                    label="Срок оплаты (дней)"
                    type="number"
                    min="1"
                  ></v-text-field>

                  <div class="d-flex ga-2 mt-2">
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-flask"
                      @click="openDryRunDialog"
                    >
                      Тестовая генерация
                    </v-btn>
                  </div>
                </v-col>
                
                <v-col cols="12" md="6">
                  <h4 class="mb-4">Налоги и валюта</h4>
                  <v-text-field
                    v-model="billingSettings.default_tax_rate"
                    label="Ставка НДС (%)"
                    type="number"
                    step="0.01"
                  ></v-text-field>
                  
                  <v-switch
                    v-model="billingSettings.tax_included"
                    label="НДС включен в цену"
                    color="primary"
                    :title="'Итоговая цена указывается с НДС. Влияет на отображение и расчёты.'"
                  ></v-switch>
                  
                  <v-select
                    v-model="billingSettings.currency"
                    :items="currencies"
                    label="Валюта по умолчанию"
                    :title="'Используется при создании новых тарифов и счетов. Существующие суммы не меняет.'"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" md="6">
                  <h4 class="mb-4">Уведомления</h4>
                  <v-text-field
                    v-model.number="billingSettings.notify_before_invoice"
                    label="Уведомлять за дней до выставления счета"
                    type="number"
                    min="0"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model.number="billingSettings.notify_before_due"
                    label="Уведомлять за дней до срока оплаты"
                    type="number"
                    min="0"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model.number="billingSettings.notify_overdue"
                    label="Уведомлять через дней после просрочки"
                    type="number"
                    min="0"
                  ></v-text-field>

                  <div class="d-flex ga-2 mt-2">
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-email-send"
                      @click="openTestNotificationDialog"
                    >
                      Отправить тест
                    </v-btn>
                  </div>
                </v-col>
                
                <v-col cols="12" md="6">
                  <h4 class="mb-4">Льготные тарифы</h4>
                  <v-switch
                    v-model="billingSettings.enable_inactive_discounts"
                    label="Включить льготы для неактивных объектов"
                    color="primary"
                  ></v-switch>
                  
                  <v-text-field
                    v-model="billingSettings.inactive_discount_ratio"
                    label="Коэффициент льготы"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    hint="От 0 до 1 (например, 0.5 = 50% скидка)"
                    :disabled="!billingSettings.enable_inactive_discounts"
                  ></v-text-field>
                  
                  <v-switch
                    v-model="billingSettings.allow_partial_payments"
                    label="Разрешить частичные платежи"
                    color="primary"
                    :title="'Счета можно закрывать частично. Требует совместимости тарифов/подписок.'"
                  ></v-switch>
                </v-col>

              </v-row>

              <!-- Панель сохранения -->
              <v-divider class="my-4"></v-divider>
              <div v-if="settingsDirty" class="d-flex align-center justify-end ga-2">
                <span class="text-grey">Изменения не сохранены</span>
                <v-btn variant="text" @click="resetSettingsToInitial">Отменить</v-btn>
                <v-btn color="primary" :loading="savingSettings" @click="saveSettings">Сохранить</v-btn>
              </div>
            </v-form>
            
            <!-- Сообщение об ошибке -->
            <div v-else class="text-center py-12">
              <v-icon size="64" color="grey-lighten-1">mdi-cog-alert</v-icon>
              <p class="mt-4 text-grey">Не удалось загрузить настройки</p>
            </div>
          </v-card-text>
        </v-card>
        
        <!-- Дополнительные настройки - плитки -->
        <v-card class="mt-6">
          <v-card-title>
            <span>Дополнительные настройки</span>
          </v-card-title>
          <v-card-text>
            <v-row>
              <!-- Нумераторы договоров -->
              <v-col cols="12" md="4">
                <v-card
                  variant="outlined"
                  class="settings-tile"
                  @click="contractNumeratorsDialog = true"
                >
                  <v-card-text class="text-center pa-6">
                    <v-icon size="48" color="primary" class="mb-3">mdi-format-list-numbered</v-icon>
                    <div class="text-h6 mb-2">Нумераторы договоров</div>
                    <div class="text-caption text-grey">
                      Настройка форматов номеров договоров
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Нумераторы счетов -->
              <v-col cols="12" md="4">
                <v-card
                  variant="outlined"
                  class="settings-tile"
                  @click="invoiceNumeratorsDialog = true"
                >
                  <v-card-text class="text-center pa-6">
                    <v-icon size="48" color="primary" class="mb-3">mdi-file-document-edit</v-icon>
                    <div class="text-h6 mb-2">Нумераторы счетов</div>
                    <div class="text-caption text-grey">
                      Настройка форматов номеров счетов
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Тарифные планы -->
              <v-col cols="12" md="4">
                <v-card
                  variant="outlined"
                  class="settings-tile"
                  @click="tariffPlansDialog = true"
                >
                  <v-card-text class="text-center pa-6">
                    <v-icon size="48" color="primary" class="mb-3">mdi-package-variant</v-icon>
                    <div class="text-h6 mb-2">Тарифные планы</div>
                    <div class="text-caption text-grey">
                      Управление тарифными планами
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Диалог нумераторов договоров -->
    <v-dialog v-model="contractNumeratorsDialog" max-width="900px" persistent scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-format-list-numbered</v-icon>
          <span>Нумераторы договоров</span>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="contractNumeratorsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <!-- Настройка способа нумерации -->
          <v-card variant="outlined" class="mb-6">
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2" size="small">mdi-cog</v-icon>
              Нумерация договоров
            </v-card-title>
            <v-card-text>
              <v-select
                v-if="billingSettings"
                v-model="billingSettings.contract_numbering_method"
                :items="contractNumberingMethods"
                :item-disabled="(item) => item.disabled === true"
                label="Способ нумерации"
                prepend-icon="mdi-format-list-numbered"
                hint="Выберите способ генерации номеров договоров. Конкретный нумератор выбирается при создании договора."
                persistent-hint
                variant="outlined"
                density="compact"
              ></v-select>
              
              <v-text-field
                v-if="billingSettings && billingSettings.contract_numbering_method === 'bitrix24'"
                v-model="billingSettings.bitrix24_deal_number_field"
                label="Поле номера в Bitrix24"
                prepend-icon="mdi-pound"
                hint="Код пользовательского поля в Bitrix24 (например, UF_CRM_CONTRACT_NUMBER)"
                persistent-hint
                placeholder="UF_CRM_CONTRACT_NUMBER"
                variant="outlined"
                density="compact"
                class="mt-4"
              ></v-text-field>

              <div class="d-flex ga-2 mt-4">
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-eye"
                  size="small"
                  @click="openNumeratorPreview"
                >
                  Предпросмотр номера договора
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <!-- Список нумераторов -->
          <ContractNumeratorsTab />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Диалог нумераторов счетов -->
    <v-dialog v-model="invoiceNumeratorsDialog" max-width="900px" persistent scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-file-document-edit</v-icon>
          <span>Нумераторы счетов</span>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="invoiceNumeratorsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <InvoiceNumeratorsTab />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Диалог тарифных планов -->
    <v-dialog v-model="tariffPlansDialog" max-width="1200px" persistent scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-package-variant</v-icon>
          <span>Тарифные планы</span>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="tariffPlansDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <!-- Фильтры -->
          <v-row class="mb-4">
            <v-col cols="12" md="6" lg="4">
              <v-text-field
                v-model="planSearchQuery"
                label="Поиск по названию"
                clearable
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6" lg="4">
              <v-select
                v-model="planStatusFilter"
                :items="statusOptions"
                label="Статус"
                variant="outlined"
                density="compact"
                clearable
              ></v-select>
            </v-col>
            <v-col cols="12" md="6" lg="4">
              <v-btn
                icon="mdi-plus"
                variant="flat"
                color="primary"
                size="small"
                @click="openPlanDialog()"
                title="Добавить план"
              />
            </v-col>
          </v-row>

          <!-- Таблица планов -->
          <v-data-table
            :headers="planHeaders"
            :items="filteredPlans"
            :loading="loadingPlans"
            class="elevation-1"
            item-value="id"
            :items-per-page="10"
          >
            <!-- Название с популярным значком -->
            <template v-slot:item.name="{ item }">
              <div class="d-flex align-center">
                <span class="font-weight-medium">{{ item.name }}</span>
                <v-chip
                  v-if="item.is_popular"
                  color="orange"
                  size="x-small"
                  class="ml-2"
                >
                  Популярный
                </v-chip>
              </div>
            </template>

            <!-- Цена -->
            <template v-slot:item.price="{ item }">
              <span class="font-weight-bold text-primary">
                {{ formatPrice(item.price, item.currency) }}
              </span>
              <span class="text-caption text-grey ml-1">
                / {{ getBillingPeriodText(item.billing_period) }}
              </span>
            </template>

            <!-- Статус -->
            <template v-slot:item.is_active="{ item }">
              <v-chip
                :color="item.is_active ? 'green' : 'red'"
                size="small"
              >
                {{ item.is_active ? 'Активен' : 'Неактивен' }}
              </v-chip>
            </template>

            <!-- Действия -->
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                @click="openPlanDialog(item)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="deletePlan(item)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Диалог создания/редактирования плана -->
    <v-dialog v-model="planDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">
            {{ editingPlan?.id ? 'Редактировать план' : 'Создать план' }}
          </span>
        </v-card-title>

        <v-card-text>
          <v-form ref="planForm" v-model="planFormValid">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editingPlan.name"
                  label="Название"
                  :rules="[v => !!v || 'Название обязательно']"
                  required
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editingPlan.price"
                  label="Цена"
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[v => (v !== null && v !== undefined && !isNaN(v) && v >= 0) || 'Цена должна быть положительным числом']"
                  required
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="6" md="3">
                <v-select
                  v-model="editingPlan.currency"
                  :items="currencies"
                  label="Валюта"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="6" md="9">
                <v-select
                  v-model="editingPlan.billing_period"
                  :items="billingPeriods"
                  label="Период биллинга"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editingPlan.description"
                  label="Описание"
                  rows="2"
                  density="compact"
                ></v-textarea>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="editingPlan.is_active"
                  label="Активен"
                  color="primary"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closePlanDialog">Отмена</v-btn>
          <v-btn 
            color="primary" 
            :loading="savingPlan"
            :disabled="!planFormValid"
            @click="savePlan"
          >
            {{ editingPlan?.id ? 'Обновить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Мастер создания подписки -->
    <SubscriptionWizard
      v-model="subscriptionWizardOpen"
      :company-id="currentCompanyId"
      @created="onSubscriptionCreated"
    />

    <!-- Диалог подписки (для редактирования) -->
    <v-dialog v-model="subscriptionDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">
            {{ editingSubscription?.id ? 'Редактировать подписку' : 'Создать подписку' }}
          </span>
        </v-card-title>

        <v-card-text>
          <v-form ref="subscriptionForm" v-model="subscriptionFormValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model.number="editingSubscription.company_id"
                  label="ID компании"
                  type="number"
                  :rules="[v => !!v || 'ID компании обязательно']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editingSubscription.billing_plan_id"
                  :items="planSelectItems"
                  label="Тарифный план"
                  :rules="[v => !!v || 'Выберите тарифный план']"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editingSubscription.start_date"
                  label="Дата начала"
                  type="date"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editingSubscription.status"
                  :items="subscriptionStatuses"
                  label="Статус"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="editingSubscription.is_auto_renew"
                  label="Автопродление"
                  color="primary"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeSubscriptionDialog">Отмена</v-btn>
          <v-btn 
            color="primary" 
            :loading="savingSubscription"
            :disabled="!subscriptionFormValid"
            @click="saveSubscription"
          >
            {{ editingSubscription?.id ? 'Обновить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог обработки платежа -->
    <v-dialog v-model="paymentDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">Обработка платежа</span>
        </v-card-title>

        <v-card-text v-if="selectedInvoice">
          <div class="mb-4">
            <strong>Счет:</strong> {{ selectedInvoice.number }}<br>
            <strong>Сумма к доплате:</strong> {{ formatCurrency(parseFloat(selectedInvoice.total_amount) - parseFloat(selectedInvoice.paid_amount)) }}
          </div>

          <v-form>
            <v-text-field
              v-model="paymentData.amount"
              label="Сумма платежа"
              type="number"
              step="0.01"
              required
            ></v-text-field>

            <v-select
              v-model="paymentData.payment_method"
              :items="[
                { title: 'Банковский перевод', value: 'bank_transfer' },
                { title: 'Наличные', value: 'cash' },
                { title: 'Банковская карта', value: 'card' },
                { title: 'Электронные деньги', value: 'electronic' }
              ]"
              label="Способ оплаты"
              required
            ></v-select>

            <v-textarea
              v-model="paymentData.notes"
              label="Примечания"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="paymentDialog = false">Отмена</v-btn>
          <v-btn 
            color="primary" 
            @click="processPayment"
          >
            Обработать платеж
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог генерации счета -->
    <v-dialog v-model="generateInvoiceDialog" max-width="700px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">Сгенерировать счет</span>
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model.number="selectedContractId"
                  :items="contractSelectItems"
                  label="Договор"
                  :loading="loadingContracts"
                  hint="Начните вводить номер договора или название клиента для поиска"
                  persistent-hint
                  required
                  clearable
                  :no-data-text="'Нет доступных договоров'"
                  placeholder="Поиск договора..."
                >
                  <template #prepend-inner>
                    <v-icon>mdi-file-document</v-icon>
                  </template>
                </v-autocomplete>
              </v-col>

              <!-- Подписки с чекбоксами -->
              <v-col v-if="selectedContractId" cols="12">
                <div class="mb-2 d-flex justify-space-between align-center">
                  <label class="text-subtitle-1 font-weight-medium">Подписки</label>
                  <v-btn
                    v-if="contractSubscriptions.length > 0"
                    size="small"
                    variant="text"
                    color="primary"
                    @click="toggleAllSubscriptions"
                  >
                    {{ allSubscriptionsSelected ? 'Снять все' : 'Выбрать все' }}
                  </v-btn>
                </div>
                
                <v-progress-linear
                  v-if="loadingContractSubscriptions"
                  indeterminate
                  color="primary"
                  class="mb-3"
                ></v-progress-linear>

                <div v-if="!loadingContractSubscriptions && contractSubscriptions.length === 0" class="text-grey text-center pa-4">
                  У выбранного договора нет активных подписок
                </div>

                <v-list v-if="!loadingContractSubscriptions && contractSubscriptions.length > 0" class="subscription-list" density="compact">
                  <v-list-item
                    v-for="subscription in contractSubscriptions"
                    :key="subscription.id"
                    class="subscription-item px-0"
                  >
                    <template #prepend>
                      <v-checkbox
                        v-model="selectedSubscriptionIds"
                        :value="subscription.id"
                        hide-details
                        density="compact"
                      ></v-checkbox>
                    </template>

                    <v-list-item-title>
                      <div class="d-flex justify-space-between align-center">
                        <div>
                          <span class="font-weight-medium">{{ subscription.billing_plan?.name }}</span>
                          <v-chip size="x-small" :color="getSubscriptionStatusColor(subscription.status)" class="ml-2">
                            {{ getSubscriptionStatusText(subscription.status) }}
                          </v-chip>
                        </div>
                        <span class="text-caption text-grey">
                          {{ formatPrice(subscription.billing_plan?.price || 0, subscription.billing_plan?.currency || 'RUB') }}
                        </span>
                      </div>
                    </v-list-item-title>

                    <v-list-item-subtitle class="text-caption">
                      {{ formatDate(subscription.start_date) }} - {{ subscription.end_date ? formatDate(subscription.end_date) : 'Бессрочно' }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <!-- Информация о выбранном периоде -->
                <v-alert
                  v-if="selectedSubscriptionIds.length > 0"
                  type="info"
                  variant="tonal"
                  class="mt-3"
                  density="compact"
                >
                  <div class="text-caption">
                    <strong>Период биллинга:</strong> {{ calculatedPeriod.start }} - {{ calculatedPeriod.end }}
                  </div>
                </v-alert>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeGenerateInvoiceDialog">Отмена</v-btn>
          <v-btn 
            color="primary" 
            @click="generateInvoice"
            :disabled="!selectedContractId || selectedSubscriptionIds.length === 0"
          >
            Сгенерировать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог: Тестовая генерация счетов (dry-run) -->
    <v-dialog v-model="dryRunDialog" max-width="640px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">Тестовая генерация счетов</span>
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dryRunForm.from"
                  label="Период с"
                  type="date"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dryRunForm.to"
                  label="Период по"
                  type="date"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="dryRunForm.limit"
                  label="Ограничение результатов"
                  type="number"
                  min="1"
                />
              </v-col>
            </v-row>
          </v-form>
          <v-alert
            v-if="dryRunResult?.summary"
            type="info"
            class="mt-4"
            border="start"
          >
            Кандидатов: {{ dryRunResult?.summary?.candidates }},
            Будет создано: {{ dryRunResult?.summary?.willCreate }},
            Сумма: {{
              formatCurrency(
                dryRunResult?.summary?.totalAmount?.value || 0,
                dryRunResult?.summary?.totalAmount?.currency || 'RUB'
              )
            }}
          </v-alert>
          <v-data-table
            v-if="dryRunResult?.items?.length"
            class="mt-3"
            :items="dryRunResult?.items"
            :headers="[
              { title: 'Компания/аккаунт', key: 'accountId' },
              { title: 'Подписка', key: 'subscriptionId' },
              { title: 'Сумма', key: 'amount' }
            ]"
            :items-per-page="5"
            hide-default-footer
          >
            <template #item.amount="{ item }">
              {{ formatCurrency(item.amount?.value || 0, item.amount?.currency || 'RUB') }}
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dryRunDialog = false">Закрыть</v-btn>
          <v-btn color="primary" :loading="dryRunLoading" @click="runDryRun">
            Выполнить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог: Тест уведомления -->
    <v-dialog v-model="testNotifDialog" max-width="520px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Тест уведомления</span>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="testNotifForm.channel"
                :items="[
                  { title: 'Система', value: 'system' },
                  { title: 'Email', value: 'email' },
                  { title: 'Telegram', value: 'telegram' },
                  { title: 'MAX', value: 'max' },
                  { title: 'SMS', value: 'sms' }
                ]"
                label="Канал"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="testNotifForm.template"
                :items="[
                  { title: 'Создан счёт', value: 'invoice_created' },
                  { title: 'Срок оплаты', value: 'invoice_due' },
                  { title: 'Истекает подписка', value: 'subscription_expiring' }
                ]"
                label="Шаблон"
              />
            </v-col>
            <v-col cols="12" v-if="testNotifForm.channel === 'email'">
              <v-text-field
                v-model="testNotifForm.to"
                label="Email получателя"
                type="email"
                required
              />
            </v-col>
          </v-row>
          <v-alert v-if="testNotifResult" type="info" class="mt-2" border="start">
            {{ testNotifResult }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="testNotifDialog = false">Закрыть</v-btn>
          <v-btn color="primary" :loading="testNotifLoading" @click="sendTestNotification">
            Отправить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог: Предпросмотр нумератора -->
    <v-dialog v-model="numeratorPreviewDialog" max-width="520px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Предпросмотр номера счёта</span>
        </v-card-title>
        <v-card-text>
          <div class="d-flex align-center ga-2">
            <v-progress-circular
              v-if="numeratorPreviewLoading"
              indeterminate
              color="primary"
              size="20"
            />
            <span v-else>{{ numeratorPreviewValue || 'Нет данных' }}</span>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="numeratorPreviewDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Диалог просмотра счета -->
    <v-dialog v-model="invoiceViewDialog" max-width="800px">
      <v-card v-if="selectedInvoice">
        <v-card-title>
          <span class="text-h5">Счет {{ selectedInvoice.number }}</span>
          <v-spacer></v-spacer>
          <v-chip
            :color="getInvoiceStatusColor(selectedInvoice.status)"
            size="large"
          >
            {{ getInvoiceStatusLabel(selectedInvoice.status) }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <h4 class="mb-2">Информация о счете</h4>
              <p><strong>Дата выставления:</strong> {{ formatDate(selectedInvoice.invoice_date) }}</p>
              <p><strong>Срок оплаты:</strong> {{ formatDate(selectedInvoice.due_date) }}</p>
              <p><strong>Период биллинга:</strong> {{ formatDate(selectedInvoice.billing_period_start) }} - {{ formatDate(selectedInvoice.billing_period_end) }}</p>
            </v-col>
            <v-col cols="12" md="6">
              <h4 class="mb-2">Финансовая информация</h4>
              <p><strong>Сумма без НДС:</strong> {{ formatCurrency(selectedInvoice.subtotal_amount) }}</p>
              <p><strong>НДС ({{ selectedInvoice.tax_rate }}%):</strong> {{ formatCurrency(selectedInvoice.tax_amount) }}</p>
              <p><strong>Итого:</strong> {{ formatCurrency(selectedInvoice.total_amount) }}</p>
              <p><strong>Оплачено:</strong> {{ formatCurrency(selectedInvoice.paid_amount) }}</p>
              <p><strong>К доплате:</strong> {{ formatCurrency(parseFloat(selectedInvoice.total_amount) - parseFloat(selectedInvoice.paid_amount)) }}</p>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <h4 class="mb-4">Позиции счета</h4>
          <v-data-table
            :headers="[
              { title: 'Наименование', key: 'name' },
              { title: 'Количество', key: 'quantity' },
              { title: 'Цена', key: 'unit_price' },
              { title: 'Сумма', key: 'amount' }
            ]"
            :items="selectedInvoice.items"
            hide-default-footer
            class="elevation-1"
          >
            <template v-slot:item.quantity="{ item }">
              {{ parseFloat(item.quantity).toLocaleString('ru-RU') }}
            </template>
            <template v-slot:item.unit_price="{ item }">
              {{ formatCurrency(item.unit_price) }}
            </template>
            <template v-slot:item.amount="{ item }">
              {{ formatCurrency(item.amount) }}
            </template>
          </v-data-table>

          <div v-if="selectedInvoice.notes" class="mt-4">
            <h4 class="mb-2">Примечания</h4>
            <p>{{ selectedInvoice.notes }}</p>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="invoiceViewDialog = false">Закрыть</v-btn>
          <v-btn 
            v-if="selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled'"
            color="primary"
            @click="processPaymentDialog(selectedInvoice); invoiceViewDialog = false"
          >
            Обработать платеж
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог отправки счета клиенту -->
    <SendInvoiceDialog
      v-model="sendInvoiceDialogOpen"
      :invoice="selectedInvoiceForSend"
      @sent="handleInvoiceSent"
    />
  </v-container>
</template>

<script lang="ts" setup>
import { AppleButton } from '@/components/Apple'
import ContractsTab from '@/components/Billing/ContractsTab.vue'
import ContractNumeratorsTab from '@/components/Billing/ContractNumeratorsTab.vue'
import InvoiceNumeratorsTab from '@/components/Billing/InvoiceNumeratorsTab.vue'
import SubscriptionWizard from '@/components/Billing/SubscriptionWizard.vue'
import SendInvoiceDialog from '@/components/Billing/SendInvoiceDialog.vue'
import { billingService } from '@/services/billingService'
import { invoiceNumeratorsService } from '@/services/invoiceNumeratorsService'
import contractsService from '@/services/contractsService'
import type {
    BillingDashboardData,
    BillingPlan,
    BillingSettings,
    CreateBillingPlanData,
    CreateSubscriptionData,
    GenerateInvoiceData,
    Invoice,
    InvoiceStatus,
    ProcessPaymentData,
    Subscription,
    UpdateBillingPlanData,
    UpdateBillingSettingsData,
    UpdateSubscriptionData
} from '@/types/billing'
import type { ContractNumerator } from '@/types/contracts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Реактивные данные
const activeTab = ref((route.query.tab as string) || 'contracts') // Начинаем с договоров или из query

// Рефы на дочерние компоненты
const contractsTabRef = ref<InstanceType<typeof ContractsTab> | null>(null)

// Получаем company_id из localStorage
const getCurrentCompanyId = (): number => {
  try {
    const companyData = localStorage.getItem('axenta_company')
    if (companyData) {
      const company = JSON.parse(companyData)
      return company.id || company.company_id || 1
    }
  } catch (e) {
    console.error('Ошибка при получении company_id из localStorage:', e)
  }
  return 1 // Fallback
}

const currentCompanyId = ref(getCurrentCompanyId())

// Обновляем company_id при монтировании компонента и при изменении localStorage
let checkInterval: ReturnType<typeof setInterval> | null = null
let handleStorageChange: ((e: StorageEvent) => void) | null = null
let saveSettingsTimeout: ReturnType<typeof setTimeout> | null = null
let isInitialLoad = true // Флаг для предотвращения сохранения при первоначальной загрузке

// Очищаем ресурсы при размонтировании
onUnmounted(() => {
  if (handleStorageChange) {
    window.removeEventListener('storage', handleStorageChange)
  }
  
  // Очищаем таймер автосохранения при размонтировании
  if (saveSettingsTimeout) {
    clearTimeout(saveSettingsTimeout)
  }
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})

onMounted(async () => {
  // Обновляем company_id при монтировании
  currentCompanyId.value = getCurrentCompanyId()
  
  // Загружаем данные при монтировании
  // loadDashboardData уже загружает plans и subscriptions, поэтому вызываем их отдельно только если нужно
  await Promise.all([
    loadDashboardData(), // Загружает plans и subscriptions внутри
    fetchInvoices(),
    fetchBillingSettings() // Загружает contractNumerators внутри
  ])
  
  // Слушаем изменения в localStorage (на случай переключения компании)
  handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'axenta_company') {
      const newCompanyId = getCurrentCompanyId()
      console.log('Billing.vue: company изменилась, новый ID:', newCompanyId)
      currentCompanyId.value = newCompanyId
      // Перезагружаем данные при изменении компании
      loadDashboardData()
      fetchPlans()
    }
  }
  window.addEventListener('storage', handleStorageChange)
  
  // Также проверяем периодически (на случай, если localStorage изменился в том же окне)
  checkInterval = setInterval(() => {
    const newCompanyId = getCurrentCompanyId()
    if (newCompanyId !== currentCompanyId.value) {
      console.log('Billing.vue: company изменилась (проверка), новый ID:', newCompanyId)
      currentCompanyId.value = newCompanyId
      loadDashboardData()
      fetchPlans()
    }
  }, 2000) // Проверяем каждые 2 секунды
})

// Данные
const dashboardData = ref<BillingDashboardData | null>(null)
const plans = ref<BillingPlan[]>([])
const subscriptions = ref<Subscription[]>([])
const invoices = ref<Invoice[]>([])
const billingSettings = ref<BillingSettings | null>(null)
const initialSettingsSnapshot = ref<string>('') // JSON снапшот для dirty-check
const contractsStats = ref<{
  total: number
  active: number
  expiring_soon: number
  total_amount: string
} | null>(null)
const contractNumerators = ref<ContractNumerator[]>([])
const loadingNumerators = ref(false)
const availableContracts = ref<any[]>([])
const loadingContracts = ref(false)
const contractSubscriptions = ref<Subscription[]>([])
const loadingContractSubscriptions = ref(false)
const selectedSubscriptionIds = ref<number[]>([])

// Состояния загрузки
const loadingPlans = ref(false)
const loadingSubscriptions = ref(false)
const loadingInvoices = ref(false)
const loadingSettings = ref(false)
const savingPlan = ref(false)
const savingSubscription = ref(false)
const savingSettings = ref(false)

// Поиск и фильтрация
const planSearchQuery = ref('')
const planStatusFilter = ref<boolean | null>(null)
const invoiceStatusFilter = ref<InvoiceStatus | null>(null)
const invoiceDateStart = ref('')
const invoiceDateEnd = ref('')
const filteredByContractId = ref<number | null>(null)
const filteredByContractNumber = ref<string | null>(null)

// Диалоги
const planDialog = ref(false)
const subscriptionDialog = ref(false)
const contractNumeratorsDialog = ref(false)
const invoiceNumeratorsDialog = ref(false)
const tariffPlansDialog = ref(false)
const subscriptionWizardOpen = ref(false)
const generateInvoiceDialog = ref(false)
const paymentDialog = ref(false)
const invoiceViewDialog = ref(false)
const sendInvoiceDialogOpen = ref(false)
const selectedInvoiceForSend = ref<Invoice | null>(null)

// Формы
const planFormValid = ref(false)
const subscriptionFormValid = ref(false)
const settingsFormValid = ref(false)

// Редактируемые объекты
const editingPlan = ref<Partial<BillingPlan>>({})
const editingSubscription = ref<Partial<Subscription>>({})
const selectedInvoice = ref<Invoice | null>(null)
const selectedContractId = ref<number | null>(null)
const invoiceFormData = ref<GenerateInvoiceData>({
  period_start: '',
  period_end: ''
})
const paymentData = ref<ProcessPaymentData>({
  amount: '',
  payment_method: 'bank_transfer',
  notes: ''
})

// Константы
const currencies = ['RUB', 'USD', 'EUR']
const billingPeriods = [
  { title: 'Месячный', value: 'monthly' },
  { title: 'Годовой', value: 'yearly' },
  { title: 'Одноразовый', value: 'one-time' }
]

const statusOptions = [
  { title: 'Активные', value: true },
  { title: 'Неактивные', value: false }
]

const contractNumberingMethods = [
  { title: 'Вручную', value: 'manual', icon: 'mdi-hand-pointing-right', description: 'Номер вводится вручную при создании договора' },
  { title: 'Автоматически (нумератор)', value: 'numerator', icon: 'mdi-format-list-numbered', description: 'Номер генерируется автоматически по выбранному нумератору' },
  { title: 'Из Bitrix24 (Скоро)', value: 'bitrix24', icon: 'mdi-cloud-download', description: 'Номер берется из пользовательского поля сделки в Bitrix24', disabled: true }
]

const subscriptionStatuses = [
  { title: 'Активная', value: 'active' },
  { title: 'Запланированная', value: 'scheduled' },
  { title: 'Истекшая', value: 'expired' },
  { title: 'Отмененная', value: 'cancelled' },
  { title: 'Приостановленная', value: 'suspended' }
]

const invoiceStatusOptions = [
  { title: 'Черновик', value: 'draft' },
  { title: 'Отправлен', value: 'sent' },
  { title: 'Частично оплачен', value: 'partially_paid' },
  { title: 'Оплачен', value: 'paid' },
  { title: 'Просрочен', value: 'overdue' },
  { title: 'Отменен', value: 'cancelled' }
]

// Заголовки таблиц
const planHeaders = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Цена', key: 'price', sortable: true },
  { title: 'Статус', key: 'is_active', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false }
]

const subscriptionHeaders = [
  { title: '№', key: 'sequential_number', sortable: true, width: '80px', align: 'center' },
  { title: 'Дата', key: 'created_at', sortable: true, width: '140px', align: 'center' },
  { title: 'Клиент / Договор', key: 'client', sortable: false, align: 'center' },
  { title: 'Тарифный план', key: 'billing_plan', sortable: false, align: 'center' },
  { title: 'Объекты', key: 'objects', sortable: false, align: 'center' },
  { title: 'Дата начала', key: 'start_date', sortable: true, align: 'center' },
  { title: 'Следующий платеж', key: 'next_payment_date', sortable: true, align: 'center' },
  { title: 'Статус', key: 'status', sortable: true, align: 'center' },
  { title: 'Действия', key: 'actions', sortable: false, align: 'center' }
]

const invoiceHeaders = [
  { title: '№', key: 'sequential_number', sortable: true, width: '80px', align: 'center' },
  { title: 'Номер', key: 'number', sortable: true, align: 'center' },
  { title: 'Клиент / Договор', key: 'client', sortable: false, align: 'center' },
  { title: 'Дата счета', key: 'invoice_date', sortable: true, align: 'center' },
  { title: 'Срок оплаты', key: 'due_date', sortable: true, align: 'center' },
  { title: 'Сумма', key: 'total_amount', sortable: true, align: 'center' },
  { title: 'Статус', key: 'status', sortable: true, align: 'center' },
  { title: 'Действия', key: 'actions', sortable: false, align: 'center' }
]

// Вычисляемые свойства
const numeratorOptions = computed(() => {
  return contractNumerators.value.map(numerator => ({
    value: numerator.id,
    title: numerator.name,
    subtitle: numerator.template,
  }))
})

const filteredPlans = computed(() => {
  let filtered = plans.value

  if (planSearchQuery.value) {
    filtered = filtered.filter(plan => 
      plan.name.toLowerCase().includes(planSearchQuery.value.toLowerCase())
    )
  }

  if (planStatusFilter.value !== null) {
    filtered = filtered.filter(plan => plan.is_active === planStatusFilter.value)
  }

  return filtered
})

// Фильтрованные подписки (с учетом фильтра по договору)
const filteredSubscriptions = computed(() => {
  let filtered = subscriptions.value

  console.log('🔍 Фильтрация подписок:', {
    totalSubscriptions: subscriptions.value.length,
    filteredByContractId: filteredByContractId.value,
    filteredByContractNumber: filteredByContractNumber.value
  })

  // Применяем фильтр по договору, если он установлен
  if (filteredByContractId.value !== null && filteredByContractId.value !== undefined) {
    filtered = filtered.filter(sub => {
      console.log('Проверка подписки:', {
        subscriptionId: sub.id,
        contractId: sub.contract_id,
        matches: sub.contract_id === filteredByContractId.value
      })
      return sub.contract_id === filteredByContractId.value
    })
    console.log(`✅ Отфильтровано подписок: ${filtered.length} из ${subscriptions.value.length}`)
  } else {
    console.log(`✅ Фильтр не применен, показываем все подписки: ${filtered.length}`)
  }

  return filtered
})

const filteredInvoices = computed(() => {
  let filtered = invoices.value

  if (invoiceStatusFilter.value) {
    filtered = filtered.filter(invoice => invoice.status === invoiceStatusFilter.value)
  }

  if (invoiceDateStart.value) {
    filtered = filtered.filter(invoice => 
      new Date(invoice.invoice_date) >= new Date(invoiceDateStart.value)
    )
  }

  if (invoiceDateEnd.value) {
    filtered = filtered.filter(invoice => 
      new Date(invoice.invoice_date) <= new Date(invoiceDateEnd.value)
    )
  }

  return filtered
})

const planSelectItems = computed(() => 
  plans.value.filter(plan => plan.is_active).map(plan => ({
    title: `${plan.name} (${formatCurrency(plan.price, plan.currency)})`,
    value: plan.id
  }))
)

const contractSelectItems = computed(() => 
  availableContracts.value.map(contract => ({
    title: `${contract.number} - ${contract.title || contract.client_name}`,
    value: contract.id
  }))
)

// Computed для работы с подписками в диалоге генерации счета
const allSubscriptionsSelected = computed(() => {
  return contractSubscriptions.value.length > 0 && 
         selectedSubscriptionIds.value.length === contractSubscriptions.value.length
})

const calculatedPeriod = computed(() => {
  if (selectedSubscriptionIds.value.length === 0) {
    return { start: '', end: '' }
  }

  const selectedSubs = contractSubscriptions.value.filter(sub => 
    selectedSubscriptionIds.value.includes(sub.id!)
  )

  if (selectedSubs.length === 0) {
    return { start: '', end: '' }
  }

  // Находим минимальную дату начала и максимальную дату окончания
  const startDates = selectedSubs.map(sub => new Date(sub.start_date))
  const endDates = selectedSubs
    .filter(sub => sub.end_date)
    .map(sub => new Date(sub.end_date!))

  const minStart = new Date(Math.min(...startDates.map(d => d.getTime())))
  
  // Если у всех подписок нет end_date, используем текущую дату
  const maxEnd = endDates.length > 0 
    ? new Date(Math.max(...endDates.map(d => d.getTime())))
    : new Date()

  return {
    start: formatDate(minStart.toISOString()),
    end: formatDate(maxEnd.toISOString())
  }
})

// Методы загрузки данных
const loadDashboardData = async () => {
  try {
    // Загружаем планы и подписки один раз
    const [plansData, subscriptionsData] = await Promise.all([
      billingService.getBillingPlans(currentCompanyId.value),
      billingService.getSubscriptions(currentCompanyId.value)
    ])
    
    // Сохраняем в состояние компонента
    plans.value = plansData
    subscriptions.value = subscriptionsData
    
    // Передаем уже загруженные данные в getBillingDashboardData, чтобы избежать дублирования
    dashboardData.value = await billingService.getBillingDashboardData(
      currentCompanyId.value,
      plansData,
      subscriptionsData
    )
  } catch (error) {
    console.error('Ошибка при загрузке данных дашборда:', error)
  }
}

const fetchPlans = async () => {
  loadingPlans.value = true
  try {
    plans.value = await billingService.getBillingPlans(currentCompanyId.value)
  } catch (error) {
    console.error('Ошибка при загрузке планов:', error)
  } finally {
    loadingPlans.value = false
  }
}

const fetchSubscriptions = async () => {
  loadingSubscriptions.value = true
  try {
    console.log('🔍 Загружаем подписки для company_id:', currentCompanyId.value)
    const result = await billingService.getSubscriptions(currentCompanyId.value)
    console.log('✅ Получены подписки:', result)
    console.log('📊 Количество подписок:', result.length)
    if (result.length > 0) {
      console.log('📋 Первая подписка:', result[0])
    }
    subscriptions.value = result
  } catch (error) {
    console.error('❌ Ошибка при загрузке подписок:', error)
  } finally {
    loadingSubscriptions.value = false
  }
}

const fetchInvoices = async () => {
  loadingInvoices.value = true
  try {
    const result = await billingService.getInvoices({ company_id: currentCompanyId.value })
    invoices.value = result.invoices
  } catch (error) {
    console.error('Ошибка при загрузке счетов:', error)
  } finally {
    loadingInvoices.value = false
  }
}

const fetchBillingSettings = async () => {
  loadingSettings.value = true
  try {
    billingSettings.value = await billingService.getBillingSettings(currentCompanyId.value)
    
    // Если способ нумерации = 'bitrix24' (отключен), сбрасываем на 'manual'
    if (billingSettings.value?.contract_numbering_method === 'bitrix24') {
      billingSettings.value.contract_numbering_method = 'manual'
      // Автоматически сохраняем исправление
      await saveSettings()
    }
    
    await fetchContractNumerators()
    // Фиксируем исходный снапшот для dirty-check
    initialSettingsSnapshot.value = JSON.stringify(billingSettings.value)
  } catch (error) {
    console.error('Ошибка при загрузке настроек:', error)
  } finally {
    loadingSettings.value = false
  }
}

const fetchContractNumerators = async () => {
  loadingNumerators.value = true
  try {
    contractNumerators.value = await contractsService.getContractNumerators(currentCompanyId.value)
  } catch (error) {
    console.error('Ошибка при загрузке нумераторов:', error)
  } finally {
    loadingNumerators.value = false
  }
}

const fetchContracts = async () => {
  loadingContracts.value = true
  try {
    const result = await contractsService.getContracts({ limit: 1000 })
    availableContracts.value = result.contracts
  } catch (error) {
    console.error('Ошибка при загрузке договоров:', error)
  } finally {
    loadingContracts.value = false
  }
}

// Методы для тарифных планов
const openPlanDialog = (plan?: BillingPlan) => {
  if (plan) {
    editingPlan.value = { ...plan }
  } else {
    editingPlan.value = {
      name: '',
      description: '',
      price: 0,
      currency: 'RUB',
      billing_period: 'monthly',
      is_active: true
    }
  }
  planDialog.value = true
}

const closePlanDialog = () => {
  planDialog.value = false
  planFormValid.value = false
  editingPlan.value = {}
}

const savePlan = async () => {
  if (!planFormValid.value) return

  savingPlan.value = true
  try {
    if (editingPlan.value.id) {
      await billingService.updateBillingPlan(editingPlan.value.id, editingPlan.value as UpdateBillingPlanData, currentCompanyId.value)
    } else {
      await billingService.createBillingPlan(editingPlan.value as CreateBillingPlanData, currentCompanyId.value)
    }
    await fetchPlans()
    await loadDashboardData()
    closePlanDialog()
  } catch (error: any) {
    console.error('Ошибка при сохранении плана:', error)
    const errorMessage = error.response?.data?.error || error.message || 'Ошибка при сохранении плана'
    alert(errorMessage)
  } finally {
    savingPlan.value = false
  }
}

const deletePlan = async (plan: BillingPlan) => {
  if (!confirm(`Вы уверены, что хотите удалить план "${plan.name}"?`)) return

  try {
    console.log('deletePlan: удаление плана', { planId: plan.id, companyId: currentCompanyId.value })
    await billingService.deleteBillingPlan(plan.id, currentCompanyId.value)
    await fetchPlans()
    await loadDashboardData()
  } catch (error: any) {
    console.error('Ошибка при удалении плана:', error)
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Ошибка при удалении плана'
    console.error('Детали ошибки:', {
      status: error.response?.status,
      data: error.response?.data,
      message: errorMessage
    })
    alert(`Ошибка: ${errorMessage}\n\nПроверьте консоль для деталей.`)
  }
}

// Методы для подписок
const openSubscriptionWizard = () => {
  subscriptionWizardOpen.value = true
}

// Метод очистки фильтра по договору
const clearContractFilter = () => {
  filteredByContractId.value = null
  filteredByContractNumber.value = null
  // Обновляем URL без параметров фильтра
  router.replace({
    path: '/billing',
    query: {
      tab: 'subscriptions'
    }
  })
}

// Переход к подпискам по договору из счета
const navigateToSubscription = (invoice: Invoice) => {
  if (!invoice.contract_id || !invoice.contract) {
    console.warn('У счета нет привязанного договора')
    return
  }

  console.log('🔗 Переход к подпискам договора:', {
    contractId: invoice.contract_id,
    contractNumber: invoice.contract.number
  })

  // Переходим на вкладку подписок с фильтром по договору
  router.push({
    path: '/billing',
    query: {
      tab: 'subscriptions',
      contract_id: invoice.contract_id.toString(),
      contract_number: invoice.contract.number
    }
  })
}

const openSubscriptionDialog = (subscription?: Subscription) => {
  if (subscription) {
    editingSubscription.value = { ...subscription }
    subscriptionDialog.value = true
  } else {
    // Для создания используем мастер
    openSubscriptionWizard()
  }
}

const onSubscriptionCreated = async (subscription: Subscription) => {
  console.log('✅ Подписка создана, обновляем данные...', subscription)
  await fetchSubscriptions()
  await loadDashboardData()
  
  // Обновляем список договоров, так как подписка обновляет информацию в договоре
  if (contractsTabRef.value?.loadContracts) {
    console.log('🔄 Обновляем список договоров после создания подписки')
    await contractsTabRef.value.loadContracts()
  }
  
  subscriptionWizardOpen.value = false
}

const closeSubscriptionDialog = () => {
  subscriptionDialog.value = false
  subscriptionFormValid.value = false
  editingSubscription.value = {}
}

const saveSubscription = async () => {
  if (!subscriptionFormValid.value) return

  savingSubscription.value = true
  try {
    if (editingSubscription.value.id) {
      await billingService.updateSubscription(editingSubscription.value.id, editingSubscription.value as UpdateSubscriptionData)
    } else {
      await billingService.createSubscription(editingSubscription.value as CreateSubscriptionData)
    }
    await fetchSubscriptions()
    await loadDashboardData()
    closeSubscriptionDialog()
  } catch (error) {
    console.error('Ошибка при сохранении подписки:', error)
  } finally {
    savingSubscription.value = false
  }
}

const cancelSubscription = async (subscription: Subscription) => {
  if (!confirm(`Вы уверены, что хотите отменить подписку?`)) return

  try {
    await billingService.updateSubscription(subscription.id!, { status: 'cancelled' })
    await fetchSubscriptions()
    await loadDashboardData()
  } catch (error) {
    console.error('Ошибка при отмене подписки:', error)
  }
}

const deleteSubscription = async (subscription: Subscription) => {
  if (!confirm(`Вы уверены, что хотите удалить подписку? Это действие нельзя отменить.`)) return

  try {
    console.log('🗑️ Удаление подписки:', subscription.id)
    await billingService.deleteSubscription(subscription.id!)
    console.log('✅ Подписка удалена')
    await fetchSubscriptions()
    await loadDashboardData()
  } catch (error: any) {
    console.error('❌ Ошибка при удалении подписки:', error)
    const errorMessage = error.response?.data?.error || error.message || 'Ошибка при удалении подписки'
    alert(`Ошибка: ${errorMessage}`)
  }
}

// Методы для счетов
const viewInvoice = (invoice: Invoice) => {
  selectedInvoice.value = invoice
  invoiceViewDialog.value = true
}

const processPaymentDialog = (invoice: Invoice) => {
  selectedInvoice.value = invoice
  paymentData.value = {
    amount: invoice.total_amount,
    payment_method: 'bank_transfer',
    notes: ''
  }
  paymentDialog.value = true
}

const processPayment = async () => {
  if (!selectedInvoice.value) return

  try {
    await billingService.processPayment(selectedInvoice.value.id, paymentData.value)
    await fetchInvoices()
    await loadDashboardData()
    paymentDialog.value = false
  } catch (error) {
    console.error('Ошибка при обработке платежа:', error)
  }
}

const cancelInvoiceConfirm = async (invoice: Invoice) => {
  const reason = prompt('Укажите причину отмены счета:')
  if (!reason) return

  try {
    await billingService.cancelInvoice(invoice.id, { reason })
    await fetchInvoices()
    await loadDashboardData()
  } catch (error) {
    console.error('Ошибка при отмене счета:', error)
  }
}

const deleteInvoiceConfirm = async (invoice: Invoice) => {
  if (!confirm(`Вы уверены, что хотите удалить счет ${invoice.number}? Это действие нельзя отменить.`)) {
    return
  }

  try {
    await billingService.deleteInvoice(invoice.id)
    await fetchInvoices()
    await loadDashboardData()
    alert('Счет успешно удален')
  } catch (error: any) {
    console.error('Ошибка при удалении счета:', error)
    const errorMessage = error.response?.data?.error || 'Ошибка при удалении счета'
    alert(errorMessage)
  }
}

const sendInvoiceToClient = async (invoice: Invoice) => {
  // Открываем диалог отправки счета
  selectedInvoiceForSend.value = invoice
  sendInvoiceDialogOpen.value = true
}

const handleInvoiceSent = async (updatedInvoice: Invoice) => {
  console.log('✅ Счет успешно отправлен:', updatedInvoice.number)
  await fetchInvoices()
  await loadDashboardData()
  
  // Показываем уведомление
  const sentChannels = updatedInvoice.last_sent_channels?.split(',').join(', ') || 'выбранные каналы'
  alert(`Счет ${updatedInvoice.number} успешно отправлен через: ${sentChannels}`)
}

const generateInvoice = async () => {
  if (!selectedContractId.value || selectedSubscriptionIds.value.length === 0) {
    alert('Выберите договор и хотя бы одну подписку')
    return
  }

  // Вычисляем period_start и period_end из выбранных подписок
  const selectedSubs = contractSubscriptions.value.filter(sub => 
    selectedSubscriptionIds.value.includes(sub.id!)
  )

  const startDates = selectedSubs.map(sub => new Date(sub.start_date))
  const endDates = selectedSubs
    .filter(sub => sub.end_date)
    .map(sub => new Date(sub.end_date!))

  const minStart = new Date(Math.min(...startDates.map(d => d.getTime())))
  const maxEnd = endDates.length > 0 
    ? new Date(Math.max(...endDates.map(d => d.getTime())))
    : new Date()

  const periodData = {
    period_start: minStart.toISOString().split('T')[0],
    period_end: maxEnd.toISOString().split('T')[0]
  }

  try {
    await billingService.generateInvoice(selectedContractId.value, periodData)
    await fetchInvoices()
    await loadDashboardData()
    closeGenerateInvoiceDialog()
  } catch (error) {
    console.error('Ошибка при генерации счета:', error)
    alert('Ошибка при генерации счета')
  }
}

// Метод для открытия диалога генерации счета
const openGenerateInvoiceDialog = async () => {
  generateInvoiceDialog.value = true
  await fetchContracts()
}

// Метод для закрытия диалога генерации счета
const closeGenerateInvoiceDialog = () => {
  generateInvoiceDialog.value = false
  selectedContractId.value = null
  selectedSubscriptionIds.value = []
  contractSubscriptions.value = []
  // Не сбрасываем selectedInvoiceNumeratorId чтобы сохранить выбор пользователя
}

// Метод для загрузки подписок по договору
const fetchContractSubscriptions = async (contractId: number) => {
  loadingContractSubscriptions.value = true
  try {
    const allSubs = await billingService.getSubscriptions(currentCompanyId.value)
    contractSubscriptions.value = allSubs.filter(sub => sub.contract_id === contractId)
  } catch (error) {
    console.error('Ошибка при загрузке подписок договора:', error)
    contractSubscriptions.value = []
  } finally {
    loadingContractSubscriptions.value = false
  }
}

// Метод для выбора/снятия всех подписок
const toggleAllSubscriptions = () => {
  if (allSubscriptionsSelected.value) {
    selectedSubscriptionIds.value = []
  } else {
    selectedSubscriptionIds.value = contractSubscriptions.value.map(sub => sub.id!)
  }
}

// Методы для настроек
const saveSettings = async () => {
  if (!billingSettings.value) return

  // Проверяем, что contract_numbering_method не равен 'bitrix24' перед сохранением
  if (billingSettings.value.contract_numbering_method === 'bitrix24') {
    billingSettings.value.contract_numbering_method = 'manual'
  }

  savingSettings.value = true
  try {
    await billingService.updateBillingSettings(currentCompanyId.value, billingSettings.value as UpdateBillingSettingsData)
    // Не перезагружаем настройки после сохранения, чтобы не сбрасывать изменения
    initialSettingsSnapshot.value = JSON.stringify(billingSettings.value)
  } catch (error) {
    console.error('Ошибка при сохранении настроек:', error)
  } finally {
    savingSettings.value = false
  }
}

// Явный сброс к исходным настройкам
const resetSettingsToInitial = () => {
  if (!initialSettingsSnapshot.value) return
  try {
    billingSettings.value = JSON.parse(initialSettingsSnapshot.value)
  } catch (e) {
    console.error('Не удалось восстановить исходные настройки', e)
  }
}

// Watch на contract_numbering_method - запрещаем выбор 'bitrix24'
watch(() => billingSettings.value?.contract_numbering_method, (newValue) => {
  if (newValue === 'bitrix24') {
    // Если пытаются выбрать 'bitrix24', сбрасываем на 'manual'
    if (billingSettings.value) {
      billingSettings.value.contract_numbering_method = 'manual'
    }
  }
})

// Автосохранение настроек при изменении (оставляем, но с задержкой)
watch(() => billingSettings.value, (newSettings) => {
  if (!newSettings || !currentCompanyId.value) return
  
  // Пропускаем сохранение при первоначальной загрузке
  if (isInitialLoad) {
    isInitialLoad = false
    return
  }
  
  // Проверяем, что contract_numbering_method не равен 'bitrix24' перед сохранением
  if (newSettings.contract_numbering_method === 'bitrix24') {
    newSettings.contract_numbering_method = 'manual'
  }
  
  // Отменяем предыдущий таймер, если есть
  if (saveSettingsTimeout) {
    clearTimeout(saveSettingsTimeout)
  }
  
  // Устанавливаем новый таймер для автосохранения через 500ms после последнего изменения
  saveSettingsTimeout = setTimeout(() => {
    saveSettings()
  }, 500)
}, { deep: true })

// Сбрасываем флаг после загрузки настроек
watch(() => loadingSettings.value, (isLoading) => {
  if (!isLoading && billingSettings.value) {
    // Даем небольшую задержку, чтобы убедиться, что все данные загружены
    setTimeout(() => {
      isInitialLoad = false
    }, 100)
  }
})

// Вспомогательные функции
const formatCurrency = (amount: string | number, currency = 'RUB') => {
  return billingService.formatCurrency(amount, currency)
}

const formatCurrencyShort = (amount: string | number, currency = 'RUB') => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}М ${currency}`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}К ${currency}`
  }
  return `${num.toFixed(0)} ${currency}`
}

const handleContractsStatsUpdate = (stats: {
  total: number
  active: number
  expiring_soon: number
  total_amount: string
}) => {
  contractsStats.value = stats
}

const formatPrice = (amount: string | number, currency = 'RUB') => {
  return billingService.formatCurrency(amount, currency)
}

const formatDate = (date: string) => {
  return billingService.formatDate(date)
}

const getBillingPeriodText = (period: string) => {
  const periods: Record<string, string> = {
    monthly: 'месяц',
    yearly: 'год',
    'one-time': 'разово'
  }
  return periods[period] || period
}

const getSubscriptionStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'green',
    scheduled: 'blue',
    expired: 'orange',
    cancelled: 'red',
    suspended: 'grey'
  }
  return colors[status] || 'grey'
}

const getSubscriptionStatusText = (status: string) => {
  const statuses: Record<string, string> = {
    active: 'Активная',
    scheduled: 'Запланированная',
    expired: 'Истекшая',
    cancelled: 'Отмененная',
    suspended: 'Приостановленная'
  }
  return statuses[status] || status
}

const getInvoiceStatusColor = (status: string) => {
  return billingService.getInvoiceStatusColor(status)
}

const getInvoiceStatusLabel = (status: string) => {
  return billingService.getInvoiceStatusLabel(status)
}

const isOverdue = (invoice: Invoice) => {
  return new Date() > new Date(invoice.due_date) && invoice.status !== 'paid' && invoice.status !== 'cancelled'
}


// ----------- Доп. UI/действия для «Настроек» -----------

// Признак несохраненных изменений
const settingsDirty = computed(() => {
  if (!billingSettings.value) return false
  try {
    return JSON.stringify(billingSettings.value) !== initialSettingsSnapshot.value
  } catch {
    return false
  }
})

// Тестовая генерация (dry run)
const dryRunDialog = ref(false)
const dryRunForm = ref<{ from: string; to: string; limit?: number }>({
  from: '',
  to: '',
  limit: 20
})
const dryRunLoading = ref(false)
const dryRunResult = ref<{
  summary?: { candidates: number; willCreate: number; totalAmount: { value: number; currency: string } }
  items?: any[]
} | null>(null)

const openDryRunDialog = () => {
  dryRunDialog.value = true
  dryRunResult.value = null
}

const runDryRun = async () => {
  if (!dryRunForm.value.from || !dryRunForm.value.to) return
  dryRunLoading.value = true
  try {
    const result = await billingService.dryRunInvoices({
      from: dryRunForm.value.from,
      to: dryRunForm.value.to,
      limit: dryRunForm.value.limit || 20
    } as any)
    dryRunResult.value = result
  } catch (e) {
    console.error('Dry-run ошибка', e)
    alert('Не удалось выполнить тестовую генерацию')
  } finally {
    dryRunLoading.value = false
  }
}

// Тест уведомлений
const testNotifDialog = ref(false)
const testNotifForm = ref<{ channel: 'email'|'system'|'slack'; template: 'invoice_due'|'invoice_created'|'subscription_expiring'; to?: string }>({
  channel: 'system',
  template: 'invoice_created',
  to: ''
})
const testNotifLoading = ref(false)
const testNotifResult = ref<string>('')

const openTestNotificationDialog = () => {
  testNotifDialog.value = true
  testNotifResult.value = ''
}

const sendTestNotification = async () => {
  testNotifLoading.value = true
  try {
    const res = await billingService.testNotification({
      channel: testNotifForm.value.channel,
      template: testNotifForm.value.template,
      to: testNotifForm.value.channel === 'email' ? (testNotifForm.value.to || '') : undefined
    } as any)
    testNotifResult.value = res?.previewUrl ? `Отправлено. Preview: ${res.previewUrl}` : 'Отправлено.'
  } catch (e) {
    console.error('Тест уведомления: ошибка', e)
    testNotifResult.value = 'Ошибка отправки'
  } finally {
    testNotifLoading.value = false
  }
}

// Предпросмотр нумератора (счета)
const numeratorPreviewDialog = ref(false)
const numeratorPreviewLoading = ref(false)
const numeratorPreviewValue = ref<string>('')

const openNumeratorPreview = async () => {
  numeratorPreviewDialog.value = true
  numeratorPreviewValue.value = ''
  numeratorPreviewLoading.value = true
  try {
    // 1) Пытаемся использовать активный/дефолтный нумератор счетов
    let template: string | undefined
    let prefix: string | undefined
    try {
      const nums = await invoiceNumeratorsService.getInvoiceNumerators(currentCompanyId.value)
      const chosen =
        nums.find(n => n.is_default) ||
        nums.find(n => n.is_active) ||
        nums[0]
      if (chosen) {
        template = chosen.template
        prefix = chosen.prefix
      }
    } catch (e) {
      console.warn('Не удалось загрузить нумераторы счетов, используем настройки', e)
    }

    // 2) Если нумераторов нет — fallback к настройкам (как было)
    if (!template && billingSettings.value) {
      template = billingSettings.value.invoice_number_format
      prefix = billingSettings.value.invoice_number_prefix
    }

    const res = await billingService.previewNumerator('invoices', { template, prefix } as any)
    numeratorPreviewValue.value = res?.preview || ''
  } catch (e) {
    console.error('Предпросмотр нумератора: ошибка', e)
    numeratorPreviewValue.value = 'Не удалось получить предпросмотр'
  } finally {
    numeratorPreviewLoading.value = false
  }
}

// Watchers
watch(activeTab, (newTab) => {
  // Синхронизируем активную вкладку с URL
  if (route.query.tab !== newTab) {
    router.replace({ query: { ...route.query, tab: newTab } })
  }
  
  if (newTab === 'invoices' && invoices.value.length === 0) {
    fetchInvoices()
  } else if (newTab === 'settings') {
    if (!billingSettings.value) {
      fetchBillingSettings()
    }
    // Загружаем тарифные планы при открытии настроек
    if (plans.value.length === 0) {
      fetchPlans()
    }
  }
  
})

// Синхронизируем activeTab с изменениями route.query.tab
watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string' && newTab !== activeTab.value) {
    activeTab.value = newTab
  }
}, { immediate: true })

// Отслеживаем параметры фильтрации по договору в URL
watch(() => route.query.contract_id, (contractId) => {
  console.log('🔗 Изменение параметра contract_id в URL:', {
    contractId,
    type: typeof contractId,
    contractNumber: route.query.contract_number
  })
  
  if (contractId && typeof contractId === 'string') {
    filteredByContractId.value = parseInt(contractId, 10)
    filteredByContractNumber.value = (route.query.contract_number as string) || null
    console.log('✅ Фильтр установлен:', {
      id: filteredByContractId.value,
      number: filteredByContractNumber.value
    })
  } else {
    filteredByContractId.value = null
    filteredByContractNumber.value = null
    console.log('❌ Фильтр сброшен')
  }
}, { immediate: true })

watch(generateInvoiceDialog, (isOpen) => {
  if (isOpen) {
    fetchContracts()
  } else {
    // Очищаем данные при закрытии диалога
    selectedContractId.value = null
    selectedSubscriptionIds.value = []
    contractSubscriptions.value = []
  }
})

// Загружаем подписки при выборе договора
watch(selectedContractId, (contractId) => {
  if (contractId) {
    fetchContractSubscriptions(contractId)
    selectedSubscriptionIds.value = []
  } else {
    contractSubscriptions.value = []
    selectedSubscriptionIds.value = []
  }
})

// Инициализация уже выполняется в первом onMounted выше
</script>

<style scoped>
.settings-tile {
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgb(var(--v-theme-primary)) !important;
}
.v-card {
  border-radius: 12px;
}

.v-chip {
  font-weight: 500;
}

.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}

/* Стили для тултипа с объектами */
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
  max-height: 200px;
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

/* Темная тема */
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

/* Стили для всех статистических карточек */
.stats-row {
  margin: -8px;
}

.stats-row .v-col {
  padding: 8px !important;
}

.stats-card {
  height: 120px;
  min-height: 120px;
  transition: all 0.2s ease;
  border-radius: 12px;
  width: 100%;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-card .stat-value {
  font-size: 18px;
  font-weight: 700;
  margin: 4px 0;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}

.stats-card .stat-label {
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: none;
  letter-spacing: 0;
  margin-top: 4px;
}

/* Темная тема для страницы биллинга */
[data-theme="dark"] .stats-card {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .stats-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-color: #007AFF !important;
}

[data-theme="dark"] .stats-card .stat-value {
  color: #ffffff !important;
}

[data-theme="dark"] .stats-card .stat-label {
  color: #8e8e93 !important;
}

[data-theme="dark"] h1 {
  color: #007AFF !important;
}

[data-theme="dark"] .text-h6 {
  color: #8e8e93 !important;
}

[data-theme="dark"] .v-tabs {
  background-color: transparent;
}

[data-theme="dark"] .v-tab {
  color: #8e8e93 !important;
}

[data-theme="dark"] .v-tab--selected {
  color: #007AFF !important;
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

/* Темная тема для полей поиска и фильтров */
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

/* Темная тема для таблиц */
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

/* Темная тема для пустых состояний */
[data-theme="dark"] .v-empty-state {
  color: #8e8e93 !important;
}

/* Темная тема для диалогов */
[data-theme="dark"] .v-dialog :deep(.v-card) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .v-dialog :deep(.v-card-title) {
  color: #ffffff !important;
  border-bottom-color: #3a3a3c !important;
}

[data-theme="dark"] .v-dialog :deep(.v-card-text) {
  color: #ffffff !important;
}

/* Темная тема для чипов */
[data-theme="dark"] .v-chip {
  background-color: #3a3a3c !important;
  color: #ffffff !important;
}

/* Темная тема для кнопок */
[data-theme="dark"] .v-btn--variant-text {
  color: #ffffff !important;
}

[data-theme="dark"] .v-btn--variant-outlined {
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

/* Стили для списка подписок в диалоге генерации счета */
.subscription-list {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.subscription-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.subscription-item:last-child {
  border-bottom: none;
}

[data-theme="dark"] .subscription-list {
  border-color: #3a3a3c;
}

[data-theme="dark"] .subscription-item {
  border-bottom-color: #3a3a3c;
}

/* Высота строк в таблице подписок */
.v-data-table {
  --v-table-row-height: 56px;
}

/* Стили для динамического распределения информации в подписках */
.subscription-client-info {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.subscription-client-info .client-name {
  font-weight: 600;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.4;
  white-space: nowrap;
}

.subscription-client-info.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.subscription-client-info.clickable:hover {
  transform: translateY(-1px);
}

.subscription-client-info .client-name-link {
  font-weight: 600;
  font-size: 14px;
  color: rgb(var(--v-theme-primary));
  line-height: 1.4;
  white-space: nowrap;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 3px;
}

.subscription-client-info.clickable:hover .client-name-link {
  color: rgb(var(--v-theme-primary));
  text-decoration-style: solid;
}

.tariff-info {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.sequential-number {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.created-date {
  font-size: 12px;
  font-family: 'SF Mono', monospace;
  color: rgb(var(--v-theme-on-surface));
}

.subscription-date {
  font-size: 12px;
  font-family: 'SF Mono', monospace;
  color: rgb(var(--v-theme-on-surface));
}

.actions-cell {
  display: flex;
  gap: 4px;
}

/* Темная тема для новых стилей подписок */
[data-theme="dark"] .subscription-client-info .client-name {
  color: #ffffff !important;
}


[data-theme="dark"] .sequential-number {
  color: #ffffff !important;
}

[data-theme="dark"] .created-date {
  color: #ffffff !important;
}

[data-theme="dark"] .subscription-date {
  color: #ffffff !important;
}

[data-theme="dark"] .subscription-client-info .client-name-link {
  color: #007AFF !important;
}

[data-theme="dark"] .subscription-client-info.clickable:hover .client-name-link {
  color: #0A84FF !important;
}
</style>
