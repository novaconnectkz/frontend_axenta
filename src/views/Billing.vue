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
      <v-tab value="plans">
        <v-icon left>mdi-package-variant</v-icon>
        Тарифные планы
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
        <ContractsTab @stats-updated="handleContractsStatsUpdate" />
      </v-window-item>

      <!-- Тарифные планы -->
      <v-window-item value="plans">
        <!-- Панель управления планами -->
        <v-card class="mb-6">
          <v-card-title>
            <span>Тарифные планы</span>
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
      </v-window-item>

      <!-- Подписки -->
      <v-window-item value="subscriptions">
        <v-card>
          <v-card-title>
            <span>Подписки</span>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              @click="openSubscriptionDialog()"
              prepend-icon="mdi-plus"
            >
              Создать подписку
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <!-- Таблица подписок -->
            <v-data-table
              :headers="subscriptionHeaders"
              :items="subscriptions"
              :loading="loadingSubscriptions"
              class="elevation-1"
              item-value="id"
              :items-per-page="10"
            >
              <!-- План -->
              <template v-slot:item.billing_plan="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.billing_plan?.name }}</div>
                  <div class="text-caption text-grey">
                    {{ formatPrice(item.billing_plan?.price || 0, item.billing_plan?.currency || 'RUB') }}
                  </div>
                </div>
              </template>

              <!-- Даты -->
              <template v-slot:item.start_date="{ item }">
                {{ formatDate(item.start_date) }}
              </template>

              <template v-slot:item.next_payment_date="{ item }">
                <span v-if="item.next_payment_date">
                  {{ formatDate(item.next_payment_date) }}
                </span>
                <span v-else class="text-grey">—</span>
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
                  color="error"
                  @click="cancelSubscription(item)"
                ></v-btn>
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
              @click="generateInvoiceDialog = true"
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
                  <v-btn icon="mdi-eye" size="small" variant="text" @click="viewInvoice(item)" />
                  <v-btn 
                    v-if="item.status !== 'paid' && item.status !== 'cancelled'"
                    icon="mdi-credit-card" 
                    size="small" 
                    variant="text" 
                    @click="processPaymentDialog(item)" 
                  />
                  <v-btn 
                    v-if="item.status !== 'cancelled'"
                    icon="mdi-cancel" 
                    size="small" 
                    variant="text" 
                    color="error"
                    @click="cancelInvoice(item)" 
                  />
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
                  ></v-switch>
                  
                  <v-select
                    v-model="billingSettings.currency"
                    :items="currencies"
                    label="Валюта по умолчанию"
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
                  ></v-switch>
                </v-col>

                <v-col cols="12" md="6">
                  <h4 class="mb-4">Нумерация договоров</h4>
                  <v-select
                    v-model="billingSettings.contract_numbering_method"
                    :items="contractNumberingMethods"
                    label="Способ нумерации"
                    prepend-icon="mdi-format-list-numbered"
                    hint="Выберите способ генерации номеров договоров"
                    persistent-hint
                  ></v-select>
                  
                  <v-select
                    v-if="billingSettings.contract_numbering_method === 'numerator'"
                    v-model="billingSettings.contract_default_numerator_id"
                    :items="numeratorOptions"
                    label="Нумератор по умолчанию"
                    prepend-icon="mdi-clock-start"
                    hint="Нумератор будет автоматически использоваться при создании договоров"
                    persistent-hint
                    clearable
                  ></v-select>
                  
                  <v-text-field
                    v-if="billingSettings.contract_numbering_method === 'bitrix24'"
                    v-model="billingSettings.bitrix24_deal_number_field"
                    label="Поле номера в Bitrix24"
                    prepend-icon="mdi-pound"
                    hint="Код пользовательского поля в Bitrix24 (например, UF_CRM_CONTRACT_NUMBER)"
                    persistent-hint
                    placeholder="UF_CRM_CONTRACT_NUMBER"
                  ></v-text-field>
                </v-col>
              </v-row>
              
              <v-row class="mt-4">
                <v-col>
                  <v-btn
                    color="primary"
                    :loading="savingSettings"
                    @click="saveSettings"
                  >
                    Сохранить настройки
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
            
            <!-- Сообщение об ошибке -->
            <div v-else class="text-center py-12">
              <v-icon size="64" color="grey-lighten-1">mdi-cog-alert</v-icon>
              <p class="mt-4 text-grey">Не удалось загрузить настройки</p>
            </div>
          </v-card-text>
        </v-card>
        
        <!-- Нумераторы договоров -->
        <ContractNumeratorsTab class="mt-6" />
      </v-window-item>
    </v-window>

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

    <!-- Диалог подписки -->
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
    <v-dialog v-model="generateInvoiceDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">Сгенерировать счет</span>
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model.number="selectedContractId"
                  :items="contractSelectItems"
                  label="Договор"
                  :loading="loadingContracts"
                  hint="Выберите договор для которого нужно создать счет"
                  persistent-hint
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="invoiceFormData.period_start"
                  label="Дата начала периода"
                  type="date"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="invoiceFormData.period_end"
                  label="Дата окончания периода"
                  type="date"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="generateInvoiceDialog = false">Отмена</v-btn>
          <v-btn 
            color="primary" 
            @click="generateInvoice"
          >
            Сгенерировать
          </v-btn>
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
  </v-container>
</template>

<script lang="ts" setup>
import { AppleButton } from '@/components/Apple'
import ContractsTab from '@/components/Billing/ContractsTab.vue'
import ContractNumeratorsTab from '@/components/Billing/ContractNumeratorsTab.vue'
import { billingService } from '@/services/billingService'
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Реактивные данные
const activeTab = ref((route.query.tab as string) || 'contracts') // Начинаем с договоров или из query

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

// Очищаем ресурсы при размонтировании
onUnmounted(() => {
  if (handleStorageChange) {
    window.removeEventListener('storage', handleStorageChange)
  }
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})

onMounted(async () => {
  // Обновляем company_id при монтировании
  currentCompanyId.value = getCurrentCompanyId()
  console.log('Billing.vue: currentCompanyId установлен в', currentCompanyId.value)
  
  // Загружаем данные при монтировании
  await loadDashboardData()
  await fetchPlans()
  await fetchSubscriptions()
  await fetchInvoices()
  await fetchBillingSettings()
  await fetchContractNumerators()
  
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

// Диалоги
const planDialog = ref(false)
const subscriptionDialog = ref(false)
const generateInvoiceDialog = ref(false)
const paymentDialog = ref(false)
const invoiceViewDialog = ref(false)

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
  { title: 'Из Bitrix24', value: 'bitrix24', icon: 'mdi-cloud-download', description: 'Номер берется из пользовательского поля сделки в Bitrix24' }
]

const subscriptionStatuses = [
  { title: 'Активная', value: 'active' },
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
  { title: 'Компания', key: 'company_id', sortable: true },
  { title: 'Тарифный план', key: 'billing_plan', sortable: false },
  { title: 'Дата начала', key: 'start_date', sortable: true },
  { title: 'Следующий платеж', key: 'next_payment_date', sortable: true },
  { title: 'Статус', key: 'status', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false }
]

const invoiceHeaders = [
  { title: 'Номер', key: 'number', sortable: true },
  { title: 'Дата счета', key: 'invoice_date', sortable: true },
  { title: 'Срок оплаты', key: 'due_date', sortable: true },
  { title: 'Сумма', key: 'total_amount', sortable: true },
  { title: 'Статус', key: 'status', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false }
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

// Методы загрузки данных
const loadDashboardData = async () => {
  try {
    dashboardData.value = await billingService.getBillingDashboardData(currentCompanyId.value)
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
    subscriptions.value = await billingService.getSubscriptions(currentCompanyId.value)
  } catch (error) {
    console.error('Ошибка при загрузке подписок:', error)
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
    await fetchContractNumerators()
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
const openSubscriptionDialog = (subscription?: Subscription) => {
  if (subscription) {
    editingSubscription.value = { ...subscription }
  } else {
    editingSubscription.value = {
      company_id: currentCompanyId.value,
      billing_plan_id: 0,
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
      is_auto_renew: true
    }
  }
  subscriptionDialog.value = true
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

const cancelInvoice = async (invoice: Invoice) => {
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

const generateInvoice = async () => {
  if (!selectedContractId.value || !invoiceFormData.value.period_start || !invoiceFormData.value.period_end) {
    alert('Заполните все поля')
    return
  }

  try {
    await billingService.generateInvoice(selectedContractId.value, invoiceFormData.value)
    await fetchInvoices()
    await loadDashboardData()
    generateInvoiceDialog.value = false
    // Сброс формы
    selectedContractId.value = null
    invoiceFormData.value = { period_start: '', period_end: '' }
  } catch (error) {
    console.error('Ошибка при генерации счета:', error)
    alert('Ошибка при генерации счета')
  }
}

// Методы для настроек
const saveSettings = async () => {
  if (!billingSettings.value) return

  savingSettings.value = true
  try {
    await billingService.updateBillingSettings(currentCompanyId.value, billingSettings.value as UpdateBillingSettingsData)
    await fetchBillingSettings()
  } catch (error) {
    console.error('Ошибка при сохранении настроек:', error)
  } finally {
    savingSettings.value = false
  }
}

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
    expired: 'orange',
    cancelled: 'red',
    suspended: 'grey'
  }
  return colors[status] || 'grey'
}

const getSubscriptionStatusText = (status: string) => {
  const statuses: Record<string, string> = {
    active: 'Активная',
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

// Watchers
watch(activeTab, (newTab) => {
  if (newTab === 'invoices' && invoices.value.length === 0) {
    fetchInvoices()
  } else if (newTab === 'settings' && !billingSettings.value) {
    fetchBillingSettings()
  }
})

watch(generateInvoiceDialog, (isOpen) => {
  if (isOpen) {
    fetchContracts()
  }
})

// Инициализация уже выполняется в первом onMounted выше
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-chip {
  font-weight: 500;
}

.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
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
</style>
