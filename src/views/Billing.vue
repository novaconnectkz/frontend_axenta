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
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="text-center pa-4" color="primary" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-currency-rub</v-icon>
          <div class="text-h5 font-weight-bold">{{ formatCurrency(dashboardData?.widgets.total_revenue.value || 0) }}</div>
          <div class="text-body-2">Общий доход</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="text-center pa-4" color="success" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-credit-card-check</v-icon>
          <div class="text-h5 font-weight-bold">{{ dashboardData?.widgets.active_subscriptions.value || 0 }}</div>
          <div class="text-body-2">Активные подписки</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="text-center pa-4" color="warning" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-clock-alert</v-icon>
          <div class="text-h5 font-weight-bold">{{ formatCurrency(dashboardData?.widgets.outstanding_amount.value || 0) }}</div>
          <div class="text-body-2">К оплате</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="text-center pa-4" color="error" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-alert-circle</v-icon>
          <div class="text-h5 font-weight-bold">{{ formatCurrency(dashboardData?.widgets.overdue_amount.value || 0) }}</div>
          <div class="text-body-2">Просрочено</div>
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
        <ContractsTab />
      </v-window-item>

      <!-- Тарифные планы -->
      <v-window-item value="plans">
        <!-- Панель управления планами -->
        <v-card class="mb-6">
          <v-card-title>
            <span>Тарифные планы</span>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              @click="openPlanDialog()"
              prepend-icon="mdi-plus"
            >
              Добавить план
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <!-- Фильтры -->
            <v-row class="mb-4">
              <v-col cols="12" md="6" lg="4">
                <v-text-field
                  v-model="planSearchQuery"
                  label="Поиск по названию"
                  prepend-icon="mdi-magnify"
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

              <!-- Возможности -->
              <template v-slot:item.features="{ item }">
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-if="item.max_devices > 0"
                    size="x-small"
                    color="blue"
                  >
                    {{ item.max_devices }} устройств
                  </v-chip>
                  <v-chip
                    v-else-if="item.max_devices === 0"
                    size="x-small"
                    color="green"
                  >
                    ∞ устройств
                  </v-chip>
                  <v-chip
                    v-if="item.has_analytics"
                    size="x-small"
                    color="purple"
                  >
                    Аналитика
                  </v-chip>
                  <v-chip
                    v-if="item.has_api"
                    size="x-small"
                    color="indigo"
                  >
                    API
                  </v-chip>
                  <v-chip
                    v-if="item.has_support"
                    size="x-small"
                    color="teal"
                  >
                    Поддержка
                  </v-chip>
                </div>
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
        <v-card>
          <v-card-title>Настройки биллинга</v-card-title>
          
          <v-card-text>
            <v-form v-model="settingsFormValid" v-if="billingSettings">
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
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Диалог создания/редактирования плана -->
    <v-dialog v-model="planDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">
            {{ editingPlan?.id ? 'Редактировать план' : 'Создать план' }}
          </span>
        </v-card-title>

        <v-card-text>
          <v-form ref="planForm" v-model="planFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editingPlan.name"
                  label="Название плана"
                  :rules="[v => !!v || 'Название обязательно']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editingPlan.price"
                  label="Цена"
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[v => v >= 0 || 'Цена не может быть отрицательной']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editingPlan.currency"
                  :items="currencies"
                  label="Валюта"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editingPlan.billing_period"
                  :items="billingPeriods"
                  label="Период биллинга"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editingPlan.description"
                  label="Описание"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>

            <!-- Лимиты -->
            <v-divider class="my-4"></v-divider>
            <h4 class="mb-4">Лимиты и возможности</h4>
            
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editingPlan.max_devices"
                  label="Максимум устройств"
                  type="number"
                  min="0"
                  hint="0 = безлимитно"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editingPlan.max_users"
                  label="Максимум пользователей"
                  type="number"
                  min="0"
                  hint="0 = безлимитно"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editingPlan.max_storage"
                  label="Хранилище (ГБ)"
                  type="number"
                  min="0"
                  hint="0 = безлимитно"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Возможности -->
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.has_analytics"
                  label="Аналитика"
                  color="primary"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.has_api"
                  label="API доступ"
                  color="primary"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.has_support"
                  label="Техническая поддержка"
                  color="primary"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.has_custom_domain"
                  label="Пользовательский домен"
                  color="primary"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.is_active"
                  label="Активен"
                  color="primary"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.is_popular"
                  label="Популярный"
                  color="orange"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
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
import ContractsTab from '@/components/Billing/ContractsTab.vue'
import { billingService } from '@/services/billingService'
import type {
    BillingDashboardData,
    BillingPlan,
    BillingSettings,
    CreateBillingPlanData,
    CreateSubscriptionData,
    Invoice,
    InvoiceStatus,
    ProcessPaymentData,
    Subscription,
    UpdateBillingPlanData,
    UpdateBillingSettingsData,
    UpdateSubscriptionData
} from '@/types/billing'
import { computed, onMounted, ref, watch } from 'vue'

// Реактивные данные
const activeTab = ref('contracts') // Начинаем с договоров
const currentCompanyId = ref(1) // В реальном приложении получать из контекста

// Данные
const dashboardData = ref<BillingDashboardData | null>(null)
const plans = ref<BillingPlan[]>([])
const subscriptions = ref<Subscription[]>([])
const invoices = ref<Invoice[]>([])
const billingSettings = ref<BillingSettings | null>(null)

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
  { title: 'Возможности', key: 'features', sortable: false },
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
  } catch (error) {
    console.error('Ошибка при загрузке настроек:', error)
  } finally {
    loadingSettings.value = false
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
      max_devices: 0,
      max_users: 0,
      max_storage: 0,
      has_analytics: false,
      has_api: false,
      has_support: false,
      has_custom_domain: false,
      is_active: true,
      is_popular: false
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
      await billingService.updateBillingPlan(editingPlan.value.id, editingPlan.value as UpdateBillingPlanData)
    } else {
      await billingService.createBillingPlan(editingPlan.value as CreateBillingPlanData)
    }
    await fetchPlans()
    await loadDashboardData()
    closePlanDialog()
  } catch (error) {
    console.error('Ошибка при сохранении плана:', error)
  } finally {
    savingPlan.value = false
  }
}

const deletePlan = async (plan: BillingPlan) => {
  if (!confirm(`Вы уверены, что хотите удалить план "${plan.name}"?`)) return

  try {
    await billingService.deleteBillingPlan(plan.id)
    await fetchPlans()
    await loadDashboardData()
  } catch (error) {
    console.error('Ошибка при удалении плана:', error)
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

// Инициализация
onMounted(async () => {
  await Promise.all([
    loadDashboardData(),
    fetchPlans(),
    fetchSubscriptions()
  ])
})
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
</style>
