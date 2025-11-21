<template>
  <v-dialog v-model="show" max-width="900px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-wizard-hat</v-icon>
        <span>Мастер создания подписки</span>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Отображение общих ошибок -->
        <v-alert
          v-if="errors.general"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="errors.general = ''"
        >
          {{ errors.general }}
        </v-alert>
        
        <!-- Шаги мастера -->
        <v-stepper v-model="currentStep" class="elevation-0">
          <v-stepper-header>
            <v-stepper-item
              :complete="currentStep > 1"
              :title="'Шаг 1'"
              subtitle="Договор"
              :value="1"
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item
              :complete="currentStep > 2"
              :title="'Шаг 2'"
              subtitle="Тариф"
              :disabled="!canProceedToStep2"
              :value="2"
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item
              :complete="currentStep > 3"
              :title="'Шаг 3'"
              subtitle="Учетная запись"
              :disabled="currentStep < 2"
              :value="3"
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item
              :complete="currentStep > 4"
              :title="'Шаг 4'"
              subtitle="Период"
              :disabled="currentStep < 3"
              :value="4"
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item
              :complete="currentStep > 5"
              :title="'Шаг 5'"
              subtitle="Превью"
              :disabled="currentStep < 4"
              :value="5"
            ></v-stepper-item>
          </v-stepper-header>

          <v-stepper-window>
            <!-- Шаг 1: Выбор договора -->
            <v-stepper-window-item :value="1">
              <div class="pa-4">
                <h3 class="mb-4">Выберите договор</h3>
                
                <v-autocomplete
                  v-model="form.contract_id"
                  :items="contractOptions"
                  item-title="title"
                  item-value="id"
                  label="Договор"
                  variant="outlined"
                  :loading="loadingContracts"
                  :error="!!errors.contract_id"
                  :error-messages="errors.contract_id"
                  placeholder="Начните вводить номер договора, название или клиента..."
                  :search="contractSearchQuery"
                  @update:search="handleContractSearch"
                  @update:model-value="onContractSelected"
                  no-data-text="Договоры не найдены"
                  loading-text="Загрузка договоров..."
                  :menu-props="{ maxHeight: 400 }"
                  :custom-filter="contractFilter"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.title" :subtitle="getStatusLabel(item.raw.status)">
                      <template v-slot:prepend>
                        <v-icon>mdi-file-document</v-icon>
                      </template>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    <span>{{ item.raw.title }}</span>
                  </template>
                </v-autocomplete>

                <!-- Сообщение, если договоры не загружены -->
                <v-alert
                  v-if="!loadingContracts && contracts.length === 0"
                  type="info"
                  class="mt-4"
                  variant="tonal"
                >
                  <v-icon class="mr-2">mdi-information</v-icon>
                  <strong>Нет доступных договоров</strong>
                  <div class="text-caption mt-1">
                    Создайте договор на вкладке "Договоры" перед созданием подписки
                  </div>
                </v-alert>

                <!-- Ошибка прав доступа -->
                <v-alert
                  v-if="!hasTariffAccess && form.contract_id"
                  type="error"
                  class="mt-4"
                  variant="tonal"
                >
                  <v-icon class="mr-2">mdi-lock</v-icon>
                  <strong>Нет прав на тарифы в этом договоре</strong>
                  <div class="text-caption mt-1">
                    Выберите другой договор или обратитесь к администратору
                  </div>
                </v-alert>
              </div>
            </v-stepper-window-item>

            <!-- Шаг 2: Выбор тарифа и параметров подписки -->
            <v-stepper-window-item :value="2">
              <div class="pa-4">
                <h3 class="mb-4">Выберите тарифный план</h3>
                
                <v-select
                  v-model="form.billing_plan_id"
                  :items="availablePlans"
                  item-title="title"
                  item-value="id"
                  label="Тарифный план"
                  variant="outlined"
                  :loading="loadingPlans"
                  :error="!!errors.billing_plan_id"
                  :error-messages="errors.billing_plan_id"
                  @update:model-value="(value) => { form.billing_plan_id = value; onPlanSelected(value); }"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon :color="item.raw.is_popular ? 'orange' : 'primary'">
                          {{ item.raw.is_popular ? 'mdi-star' : 'mdi-package-variant' }}
                        </v-icon>
                      </template>
                      <v-list-item-title>
                        {{ item.raw.name }}
                        <v-chip v-if="item.raw.is_popular" size="x-small" color="orange" class="ml-2">
                          Популярный
                        </v-chip>
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        {{ formatPrice(item.raw.price, item.raw.currency) }} / {{ getPeriodText(item.raw.billing_period) }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>

                <!-- Параметры подписки -->
                <v-card v-if="form.billing_plan_id" variant="outlined" class="mt-4">
                  <v-card-title class="text-subtitle-1">
                    <v-icon icon="mdi-cog" size="small" class="mr-2" />
                    Параметры подписки
                  </v-card-title>
                  <v-divider />
                  <v-card-text>
                    <!-- Информация о типе тарифа -->
                    <v-alert 
                      v-if="selectedPlan"
                      :type="selectedPlan.billing_period === 'one-time' ? 'info' : 'info'"
                      variant="tonal"
                      density="compact"
                      class="mb-3"
                    >
                      <div class="d-flex align-center">
                        <v-icon 
                          :icon="selectedPlan.billing_period === 'monthly' ? 'mdi-calendar-month' : 
                                 selectedPlan.billing_period === 'yearly' ? 'mdi-calendar' : 
                                 'mdi-currency-usd'"
                          size="small"
                          class="mr-2"
                        />
                        <span class="text-body-2">
                          Период биллинга: 
                          <strong>
                            {{ selectedPlan.billing_period === 'monthly' ? 'Ежемесячный' : 
                               selectedPlan.billing_period === 'yearly' ? 'Ежегодный' : 
                               'Одноразовый' }}
                          </strong>
                        </span>
                      </div>
                    </v-alert>

                    <!-- Сводка по стоимости -->
                    <div class="d-flex justify-space-between align-center">
                      <div>
                        <div class="text-body-2 text-grey">
                          {{ selectedPlan?.billing_period === 'one-time' 
                             ? 'Стоимость (за 1 объект):' 
                             : 'Стоимость за период (за 1 объект):' }}
                        </div>
                        <div class="text-h6 font-weight-bold">
                          {{ formatPrice(calculatedTotalPrice, selectedPlan?.currency || 'RUB') }}
                        </div>
                      </div>
                      <!-- Выбор периода (не показываем для одноразовых) -->
                      <div v-if="selectedPlan?.billing_period !== 'one-time'" style="width: 200px;">
                        <v-select
                          v-model="subscriptionMonths"
                          :items="subscriptionPeriodOptions"
                          :label="selectedPlan?.billing_period === 'yearly' ? 'Период (годы)' : 'Период подписки'"
                          variant="outlined"
                          density="compact"
                          hide-details
                          @update:model-value="calculateEndDate"
                        />
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </v-stepper-window-item>

            <!-- Шаг 3: Учетная запись и объекты -->
            <v-stepper-window-item :value="3">
              <div class="pa-4">
                <h3 class="mb-4">Учетная запись и объекты</h3>
                
                <v-autocomplete
                  v-model="form.account_id"
                  v-model:search="accountSearchQuery"
                  :items="accountOptions"
                  item-title="title"
                  item-value="value"
                  label="Учетная запись"
                  placeholder="Начните вводить название учетной записи..."
                  variant="outlined"
                  :loading="loadingAccounts"
                  hint="Выберите учетную запись для автоматической привязки её объектов к подписке"
                  persistent-hint
                  clearable
                  @update:search="handleAccountSearch"
                  no-data-text="Учетные записи не найдены"
                  loading-text="Загрузка учетных записей..."
                  :menu-props="{ maxHeight: 300 }"
                  @update:model-value="onAccountSelected"
                  @focus="handleAccountAutocompleteFocus"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-avatar size="small" :color="(item.raw as any)?.isActive ? 'success' : 'error'">
                          <v-icon :icon="(item.raw as any)?.isActive ? 'mdi-check' : 'mdi-close'" />
                        </v-avatar>
                      </template>
                      
                      <v-list-item-title>{{ (item.raw as any)?.name || item.title }}</v-list-item-title>
                      <v-list-item-subtitle>
                        <div class="d-flex align-center flex-wrap ga-2">
                          <v-chip
                            :color="getObjectsTotal(item.raw) > 0 ? 'primary' : 'grey'"
                            size="small"
                            variant="flat"
                            class="font-weight-medium"
                          >
                            <v-icon start size="small">mdi-package-variant</v-icon>
                            {{ getObjectsTotal(item.raw) }} объектов
                          </v-chip>
                          <v-chip
                            v-if="getObjectsActive(item.raw) > 0"
                            color="success"
                            size="small"
                            variant="flat"
                          >
                            <v-icon start size="small">mdi-check-circle</v-icon>
                            {{ getObjectsActive(item.raw) }} активных
                          </v-chip>
                          <span v-if="(item.raw as any)?.type" class="text-caption text-grey-600">
                            • {{ (item.raw as any)?.type === 'client' ? 'Клиент' : (item.raw as any)?.type === 'partner' ? 'Партнер' : (item.raw as any)?.type }}
                          </span>
                        </div>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    <div class="d-flex align-center ga-2">
                      <span v-if="item && typeof item === 'object' && (item as any).raw" class="font-weight-medium">
                        {{ (item as any).raw?.name || (item as any).raw?.title }}
                      </span>
                      <span v-else-if="selectedAccount" class="font-weight-medium">
                        {{ selectedAccount.name }}
                      </span>
                      <v-chip
                        v-if="selectedAccount && selectedAccount.objectsTotal !== undefined"
                        :color="selectedAccount.objectsTotal > 0 ? 'primary' : 'grey'"
                        size="small"
                        variant="flat"
                        class="ml-2"
                      >
                        {{ selectedAccount.objectsTotal || 0 }} объектов
                      </v-chip>
                    </div>
                  </template>
                </v-autocomplete>

                <!-- Список объектов учетной записи -->
                <v-card v-if="form.account_id" variant="outlined" class="mt-4">
                  <v-card-title class="text-subtitle-1 d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-package-variant" size="small" class="mr-2" />
                      Объекты для привязки к подписке
                      <v-chip size="small" variant="tonal" color="primary" class="ml-2">
                        {{ accountObjects.length }}
                      </v-chip>
                    </div>
                    <div v-if="selectedObjects.length > 0" class="d-flex align-center">
                      <v-chip size="small" variant="outlined" color="primary" class="mr-2">
                        Выбрано: {{ selectedObjects.length }}
                      </v-chip>
                      <v-btn
                        variant="text"
                        size="small"
                        prepend-icon="mdi-close"
                        @click="selectedObjects = []"
                      >
                        Сбросить
                      </v-btn>
                    </div>
                  </v-card-title>
                  <v-divider />
                  
                  <!-- Поиск объектов -->
                  <v-card-text class="pb-0">
                    <v-text-field
                      v-model="objectsSearchQuery"
                      placeholder="Поиск по названию, IMEI, телефону..."
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      clearable
                      hide-details
                    />
                  </v-card-text>

                  <!-- Индикатор загрузки -->
                  <div v-if="loadingAccountObjects" class="pa-3">
                    <v-progress-linear indeterminate color="primary" />
                    <div class="text-caption text-center mt-2">Загрузка объектов...</div>
                  </div>

                  <!-- Таблица объектов -->
                  <div v-else-if="filteredAccountObjects.length > 0" class="pa-3">
                    <v-data-table
                      v-model="selectedObjects"
                      :headers="objectsTableHeaders"
                      :items="filteredAccountObjects"
                      item-value="id"
                      show-select
                      density="compact"
                      hide-default-footer
                      :items-per-page="10"
                    >
                      <template #item.name="{ item }">
                        <div>
                          <div class="font-weight-medium">{{ item.name }}</div>
                          <div v-if="item.description" class="text-caption text-grey-600">
                            {{ item.description }}
                          </div>
                        </div>
                      </template>
                      <template #item.imei="{ item }">
                        <span v-if="item.imei">{{ item.imei }}</span>
                        <span v-else class="text-grey-400">—</span>
                      </template>
                      <template #item.phone_number="{ item }">
                        <span v-if="item.phone_number">{{ item.phone_number }}</span>
                        <span v-else class="text-grey-400">—</span>
                      </template>
                      <template #item.status="{ item }">
                        <v-chip
                          :color="item.is_active ? 'success' : 'grey'"
                          size="small"
                          variant="tonal"
                        >
                          {{ item.is_active ? 'Активный' : 'Неактивный' }}
                        </v-chip>
                      </template>
                    </v-data-table>
                  </div>

                  <!-- Сообщение, если объектов нет -->
                  <v-card-text v-else-if="!loadingAccountObjects">
                    <v-alert 
                      type="info" 
                      variant="tonal" 
                      density="compact"
                      text="У этой учетной записи нет объектов"
                    />
                  </v-card-text>
                </v-card>

                <!-- Предупреждение о том, что объекты уже в подписке -->
                <v-alert
                  v-if="objectsInSubscriptionsWarning.length > 0"
                  type="warning"
                  class="mt-4"
                  variant="tonal"
                >
                  <div class="d-flex align-center">
                    <v-icon class="mr-2">mdi-alert</v-icon>
                    <div class="flex-grow-1">
                      <strong>Объект уже в подписке</strong>
                      <div class="text-caption mt-1">
                        Найдено {{ objectsInSubscriptionsWarning.length }} активных подписок для этого договора
                      </div>
                      <div v-for="sub in objectsInSubscriptionsWarning" :key="sub.id" class="mt-2">
                        <v-chip size="small" class="mr-2">
                          {{ sub.billing_plan?.name }}
                        </v-chip>
                        <span class="text-caption">
                          до {{ formatDate(sub.end_date || sub.next_payment_date) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <template v-slot:append>
                    <v-checkbox
                      v-model="form.transfer_from_existing"
                      label="Перенести в новый тариф"
                      hide-details
                      density="compact"
                    ></v-checkbox>
                  </template>
                </v-alert>
              </div>
            </v-stepper-window-item>

            <!-- Шаг 4: Период -->
            <v-stepper-window-item :value="4">
              <div class="pa-4">
                <h3 class="mb-4">Настройка периода</h3>
                
                <!-- Опция "Запустить немедленно" -->
                <v-row class="mb-2">
                  <v-col cols="12">
                    <v-checkbox
                      v-model="startImmediately"
                      label="Запустить подписку немедленно"
                      color="primary"
                      hide-details
                      @update:model-value="onStartImmediatelyChanged"
                    >
                      <template v-slot:label>
                        <div class="d-flex align-center">
                          <v-icon class="mr-2" size="small">mdi-rocket-launch</v-icon>
                          <span>Запустить подписку немедленно</span>
                        </div>
                      </template>
                    </v-checkbox>
                    <div v-if="startImmediately" class="text-caption text-grey ml-8 mt-1">
                      Подписка активируется сразу после создания
                    </div>
                  </v-col>
                </v-row>
                
                <v-row v-if="!startImmediately">
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="form.start_date"
                      label="Дата начала"
                      type="date"
                      variant="outlined"
                      :min="minStartDate"
                      :error="!!errors.start_date"
                      :error-messages="errors.start_date"
                      @update:model-value="onStartDateChanged"
                    >
                      <template v-slot:append>
                        <v-icon>mdi-calendar</v-icon>
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="form.start_time"
                      label="Время начала"
                      type="time"
                      variant="outlined"
                      :error="!!errors.start_time"
                      :error-messages="errors.start_time"
                      @update:model-value="onStartTimeChanged"
                      hint="Если не указано, будет использовано 00:00"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-icon>mdi-clock-outline</v-icon>
                      </template>
                    </v-text-field>
                  </v-col>
                </v-row>
                
                <v-row v-if="!startImmediately">
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="form.contract_period_months"
                      label="Период договора (месяцев)"
                      type="number"
                      min="1"
                      variant="outlined"
                      hide-details
                      placeholder="Пусто = период из тарифа"
                      class="contract-period-input"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="form.is_auto_renew"
                      color="primary"
                      hide-details
                    >
                      <template #label>
                        <span>Автоматическая пролонгация: {{ form.is_auto_renew ? 'Включена' : 'Отключена' }}</span>
                      </template>
                    ></v-switch>
                  </v-col>
                </v-row>

                <!-- Предложение разбить период -->
                <v-alert
                  v-if="shouldSplitPeriod && !conflictingSubscriptionError"
                  type="info"
                  class="mt-4"
                  variant="tonal"
                >
                  <div class="d-flex align-center">
                    <v-icon class="mr-2">mdi-information</v-icon>
                    <div class="flex-grow-1">
                      <strong>Смена тарифа в середине месяца</strong>
                      <div class="text-caption mt-1">
                        Вы можете разбить период и рассчитать стоимость пропорционально
                      </div>
                    </div>
                  </div>
                  <template v-slot:append>
                    <v-checkbox
                      v-model="form.split_period"
                      label="Разбить период"
                      hide-details
                      density="compact"
                      @update:model-value="recalculatePrice"
                    ></v-checkbox>
                  </template>
                </v-alert>

                <!-- Блокирующая ошибка: тариф и период совпадают с существующей подпиской -->
                <v-alert
                  v-if="conflictingSubscriptionError"
                  type="error"
                  class="mt-4"
                  variant="tonal"
                >
                  <div class="d-flex align-center">
                    <v-icon class="mr-2">mdi-alert-circle</v-icon>
                    <div class="flex-grow-1">
                      <strong>Невозможно создать подписку</strong>
                      <div class="text-caption mt-1">
                        {{ conflictingSubscriptionError }}
                      </div>
                    </div>
                  </div>
                </v-alert>

                <!-- Информация о запланированной активации -->
                <v-alert
                  v-if="isScheduledStart && !startImmediately"
                  type="info"
                  class="mt-4"
                  variant="tonal"
                >
                  <v-icon class="mr-2">mdi-clock-outline</v-icon>
                  <strong>Подписка будет запланирована</strong>
                  <div class="text-caption mt-1">
                    Подписка создастся со статусом "Запланированная" и активируется автоматически в {{ formatDateTime(form.start_date, form.start_time) }}
                  </div>
                </v-alert>
              </div>
            </v-stepper-window-item>

            <!-- Шаг 5: Превью -->
            <v-stepper-window-item :value="5">
              <div class="pa-4">
                <h3 class="mb-4">Превью подписки</h3>
                
                <!-- НДС/ЕСФ тоггл -->
                <v-card variant="outlined" class="mb-4">
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between">
                      <div class="d-flex align-center">
                        <v-switch
                          v-model="showVAT"
                          label="Показать с НДС"
                          color="primary"
                          hide-details
                          density="compact"
                          class="mr-4"
                        ></v-switch>
                        <v-switch
                          v-model="requiresESF"
                          label="ЭСФ требуется"
                          color="orange"
                          hide-details
                          density="compact"
                          readonly
                        ></v-switch>
                        <v-icon
                          :color="requiresESF ? 'orange' : 'grey'"
                          class="ml-2"
                          :icon="requiresESF ? 'mdi-file-document-check' : 'mdi-file-document-remove'"
                        ></v-icon>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Сводка -->
                <v-card variant="outlined">
                  <v-card-title>Сводка подписки</v-card-title>
                  <v-card-text>
                    <v-list>
                      <v-list-item>
                        <v-list-item-title>Договор</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ selectedContract?.number }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Тарифный план</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ selectedPlan?.name }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item v-if="selectedObjects.length > 0">
                        <v-list-item-title>Объекты</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ selectedObjects.length }} {{ selectedObjects.length === 1 ? 'объект' : selectedObjects.length < 5 ? 'объекта' : 'объектов' }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Дата начала</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ formatDate(form.start_date) }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item v-if="calculatedEndDate">
                        <v-list-item-title>Дата окончания</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ formatDate(calculatedEndDate) }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item v-if="subscriptionMonths && subscriptionMonths > 1">
                        <v-list-item-title>Период подписки</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ subscriptionMonths }} {{ subscriptionMonths === 1 ? 'месяц' : subscriptionMonths < 5 ? 'месяца' : 'месяцев' }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item v-if="form.split_period && periodInfo">
                        <v-list-item-title>Период (пропорционально)</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2 text-orange">
                            {{ periodInfo.days }} дней
                          </span>
                        </template>
                      </v-list-item>
                      <v-divider class="my-2"></v-divider>
                      <v-list-item>
                        <v-list-item-title class="font-weight-bold">Базовая цена</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-h6">{{ formatPrice(selectedPlan?.price || 0, selectedPlan?.currency || 'RUB') }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item v-if="showVAT && taxAmount > 0">
                        <v-list-item-title>НДС ({{ taxRate }}%)</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ formatPrice(taxAmount, selectedPlan?.currency || 'RUB') }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title class="font-weight-bold text-h6">Итого</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-h5 text-primary">{{ formatPrice(totalPrice, selectedPlan?.currency || 'RUB') }}</span>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </div>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn
          v-if="currentStep > 1"
          variant="outlined"
          @click="previousStep"
        >
          Назад
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="close"
        >
          Отмена
        </v-btn>
        <v-btn
          v-if="currentStep < 5"
          color="primary"
          :disabled="!canProceed"
          @click="nextStep"
        >
          Далее
        </v-btn>
        <v-btn
          v-else
          color="primary"
          :loading="creating"
          :disabled="!canCreate"
          @click="createSubscription"
        >
          Создать подписку
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { billingService } from '@/services/billingService'
import contractsService from '@/services/contractsService'
import { accountsService, type Account } from '@/services/accountsService'
import { getObjectsService } from '@/services/objectsService'
import type { BillingPlan, CreateSubscriptionData, Subscription } from '@/types/billing'
import type { Contract } from '@/types/contracts'

interface Props {
  modelValue: boolean
  companyId: number | string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', subscription: Subscription): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Конвертируем companyId в число, если это строка
const companyId = computed(() => {
  return typeof props.companyId === 'string' ? parseInt(props.companyId, 10) : props.companyId
})

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Состояние
const currentStep = ref(1)
const creating = ref(false)
const loadingContracts = ref(false)
const loadingPlans = ref(false)
const loadingSubscriptions = ref(false)

// Форма
const form = ref<CreateSubscriptionData & {
  contract_id?: number
  transfer_from_existing?: boolean
  split_period?: boolean
  contract_period_months?: number | null
  account_id?: number
  start_time?: string // Новое поле для времени начала
}>({
  company_id: companyId.value,
  billing_plan_id: undefined as any, // Изменено с 0 на undefined для корректного отображения в v-select
  start_date: new Date().toISOString().split('T')[0],
  start_time: '', // Пустое значение = 00:00
  is_auto_renew: true,
  status: 'active',
  contract_id: undefined,
  transfer_from_existing: false,
  split_period: false,
  contract_period_months: null,
  account_id: undefined
})

// Данные
const contracts = ref<Contract[]>([])
const plans = ref<BillingPlan[]>([])
const existingSubscriptions = ref<Subscription[]>([])
const billingSettings = ref<any>(null)
const accounts = ref<Account[]>([])
const loadingAccounts = ref(false)
const accountSearchQuery = ref('')
const accountObjects = ref<any[]>([])
const allAccountObjects = ref<any[]>([]) // Все объекты учетной записи (включая с договорами)
const loadingAccountObjects = ref(false)
const selectedObjects = ref<number[]>([])
const objectsSearchQuery = ref('')
const contractSearchQuery = ref('')

// Сохраняем выбранную учетную запись отдельно
const savedSelectedAccount = ref<Account | null>(null)

// Новые параметры для гибкого старта подписки
const startImmediately = ref(false) // Запустить немедленно

// Новые переменные для проверок
const objectsInSubscriptionsWarning = ref<Subscription[]>([])
const conflictingSubscriptionError = ref('')

// Параметры подписки
const subscriptionMonths = ref(1) // По умолчанию 1 месяц
const calculatedEndDate = ref('')
const calculatedTotalPrice = ref(0)

// Минимальная дата начала - 1 число текущего месяца
const minStartDate = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
})

// Опции для выбора периода подписки (зависят от billing_period тарифа)
const subscriptionPeriodOptions = computed(() => {
  if (!selectedPlan.value) {
    return [{ title: '1 месяц', value: 1 }]
  }

  const billingPeriod = selectedPlan.value.billing_period

  // Для месячных тарифов - показываем месяцы
  if (billingPeriod === 'monthly') {
    return [
      { title: '1 месяц', value: 1 },
      { title: '2 месяца', value: 2 },
      { title: '3 месяца', value: 3 },
      { title: '4 месяца', value: 4 },
      { title: '5 месяцев', value: 5 },
      { title: '6 месяцев', value: 6 },
      { title: '7 месяцев', value: 7 },
      { title: '8 месяцев', value: 8 },
      { title: '9 месяцев', value: 9 },
      { title: '10 месяцев', value: 10 },
      { title: '11 месяцев', value: 11 },
      { title: '12 месяцев', value: 12 },
      { title: '24 месяца', value: 24 },
      { title: '36 месяцев', value: 36 }
    ]
  }

  // Для годовых тарифов - показываем годы (значения в месяцах)
  if (billingPeriod === 'yearly') {
    return [
      { title: '1 год', value: 12 },
      { title: '2 года', value: 24 },
      { title: '3 года', value: 36 },
      { title: '4 года', value: 48 },
      { title: '5 лет', value: 60 }
    ]
  }

  // Для одноразовых тарифов - фиксированный период
  if (billingPeriod === 'one-time') {
    return [{ title: 'Одноразово', value: 1 }]
  }

  // По умолчанию
  return [{ title: '1 месяц', value: 1 }]
})

// Ошибки
const errors = ref<Record<string, string>>({})

// Флаги
const hasTariffAccess = ref(true)
const showVAT = ref(false)
const requiresESF = computed(() => {
  // Логика определения необходимости ЭСФ по стране покупателя из договора
  if (!selectedContract.value) return false
  // Если страна покупателя не Россия, может потребоваться ЭСФ
  // Проверяем по полю buyer_country_code (если есть в типе)
  const contract = selectedContract.value as any
  return contract.buyer_country_code && 
         contract.buyer_country_code !== 'RU'
})

// Вычисляемые свойства
const contractOptions = computed(() => {
  // Убираем дубликаты по ID и по номеру договора
  const seenIds = new Set<number>()
  const seenNumbers = new Set<string>()
  const uniqueContracts = contracts.value.filter(contract => {
    // Проверяем по ID
    if (seenIds.has(contract.id)) {
      return false
    }
    // Проверяем по номеру договора (если номер уже встречался, пропускаем)
    if (contract.number && seenNumbers.has(contract.number)) {
      return false
    }
    seenIds.add(contract.id)
    if (contract.number) {
      seenNumbers.add(contract.number)
    }
    return true
  })
  
  return uniqueContracts.map(contract => {
    // Показываем только номер договора и клиента (без дублирования title)
    const clientDisplay = contract.client_short_name || contract.client_name
    const title = clientDisplay 
      ? `${contract.number} - ${clientDisplay}`
      : contract.number
    
    return {
      id: contract.id,
      title,
      client_name: contract.client_name,
      client_short_name: contract.client_short_name,
      status: contract.status,
      number: contract.number,
      // Добавляем все поля для поиска (номер, название, клиент, статус)
      searchText: `${contract.number} ${contract.title || ''} ${contract.client_short_name || contract.client_name || ''} ${contract.status || ''}`.toLowerCase()
    }
  })
})

const selectedContract = computed(() => {
  if (!form.value.contract_id) return null
  return contracts.value.find(c => c.id === form.value.contract_id)
})

const availablePlans = computed(() => {
  return plans.value
    .filter(plan => plan.is_active)
    .map(plan => ({
      id: plan.id,
      title: `${plan.name} - ${billingService.formatCurrency(plan.price, plan.currency)}`,
      ...plan
    }))
})

const selectedPlan = computed(() => {
  if (!form.value.billing_plan_id) return null
  return plans.value.find(p => p.id === form.value.billing_plan_id)
})

const canProceedToStep2 = computed(() => {
  return form.value.contract_id && hasTariffAccess.value
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      // Проверяем, что договор выбран и есть доступ к тарифам
      const canProceedStep1 = !!(form.value.contract_id && hasTariffAccess.value)
      return canProceedStep1
    case 2:
      return !!(form.value.billing_plan_id && form.value.billing_plan_id > 0)
    case 3:
      return true // Учетная запись не обязательна
    case 4:
      // Блокируем переход на шаг 5, если есть конфликт подписок
      return !!form.value.start_date && !conflictingSubscriptionError.value
    default:
      return true
  }
})

const canCreate = computed(() => {
  return !!(form.value.billing_plan_id && form.value.billing_plan_id > 0) && 
         !!form.value.start_date && 
         !creating.value &&
         !conflictingSubscriptionError.value // Блокируем, если есть конфликт
})

const isScheduledStart = computed(() => {
  if (!form.value.start_date || startImmediately.value) return false
  
  // Создаем дату/время начала
  const startDateStr = form.value.start_date
  const startTimeStr = form.value.start_time || '00:00'
  const [hours, minutes] = startTimeStr.split(':').map(Number)
  const startDateTime = new Date(startDateStr)
  startDateTime.setHours(hours, minutes, 0, 0)
  
  // Сравниваем с текущим моментом
  const now = new Date()
  return startDateTime > now
})

const shouldSplitPeriod = computed(() => {
  if (!form.value.start_date || !selectedPlan.value) return false
  const startDate = new Date(form.value.start_date)
  const today = new Date()
  // Проверяем, начинается ли подписка не с начала месяца
  return startDate.getDate() > 1 && startDate.getMonth() === today.getMonth()
})

const periodInfo = computed(() => {
  if (!form.value.start_date || !form.value.split_period) return null
  const startDate = new Date(form.value.start_date)
  const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
  const days = endOfMonth.getDate() - startDate.getDate() + 1
  return { days }
})

const taxRate = computed(() => {
  const rate = billingSettings.value?.default_tax_rate
  // Обработка Decimal объекта или строки
  if (rate === null || rate === undefined) return 20
  if (typeof rate === 'number') return rate
  if (typeof rate === 'string') return parseFloat(rate) || 20
  // Если это объект (Decimal), пробуем извлечь значение
  const parsed = parseFloat(rate) || 20
  console.log('💰 Вычислен taxRate:', parsed, 'из', rate)
  return parsed
})

const basePrice = computed(() => {
  if (!selectedPlan.value) return 0
  let price = selectedPlan.value.price
  
  // Если разбит период, пропорционально
  if (form.value.split_period && periodInfo.value && selectedPlan.value.billing_period === 'monthly') {
    const daysInMonth = new Date(new Date(form.value.start_date).getFullYear(), new Date(form.value.start_date).getMonth() + 1, 0).getDate()
    price = (price * periodInfo.value.days) / daysInMonth
  } else {
    // Учитываем количество месяцев/лет подписки
    const billingPeriod = selectedPlan.value.billing_period
    
    if (billingPeriod === 'monthly') {
      // Для месячных тарифов: цена за месяц × количество месяцев
      price = price * (subscriptionMonths.value || 1)
    } else if (billingPeriod === 'yearly') {
      // Для годовых тарифов: цена за год × количество лет
      const years = (subscriptionMonths.value || 12) / 12
      price = price * years
    }
    // Для one-time цена остается без изменений
  }
  
  // Умножаем на количество объектов
  const objectsCount = selectedObjects.value.length || 1
  price = price * objectsCount
  
  return price
})

const totalPrice = computed(() => {
  // Итого = basePrice (уже включает период × объекты)
  return basePrice.value
})

const taxAmount = computed(() => {
  if (!showVAT.value) return 0
  // НДС выделяется из итоговой суммы
  // Формула: НДС = Сумма × НДС% / (100 + НДС%)
  return totalPrice.value * (taxRate.value / (100 + taxRate.value))
})

// Методы
const loadContracts = async () => {
  loadingContracts.value = true
  errors.value.contract_id = ''
  try {
    const result = await contractsService.getContracts({ limit: 1000 })
    // Показываем активные договоры и черновики (для создания подписки)
    let loadedContracts = result.contracts.filter(c => c.status === 'active' || c.status === 'draft')
    
    // Убираем дубликаты сразу при загрузке (по ID и по номеру)
    const seenIds = new Set<number>()
    const seenNumbers = new Set<string>()
    contracts.value = loadedContracts.filter(contract => {
      // Проверяем по ID
      if (seenIds.has(contract.id)) {
        console.warn(`Дубликат договора по ID ${contract.id} пропущен`)
        return false
      }
      // Проверяем по номеру договора
      if (contract.number && seenNumbers.has(contract.number)) {
        console.warn(`Дубликат договора по номеру ${contract.number} пропущен`)
        return false
      }
      seenIds.add(contract.id)
      if (contract.number) {
        seenNumbers.add(contract.number)
      }
      return true
    })
    
    console.log(`✅ Загружено ${contracts.value.length} уникальных договоров для создания подписки`)
  } catch (error: any) {
    console.error('Ошибка загрузки договоров:', error)
    errors.value.contract_id = 'Не удалось загрузить список договоров. Попробуйте обновить страницу.'
    contracts.value = []
  } finally {
    loadingContracts.value = false
  }
}

const loadPlans = async () => {
  loadingPlans.value = true
  try {
    plans.value = await billingService.getBillingPlans(companyId.value)
    console.log('✅ Загружено тарифов:', plans.value.length)
    console.log('📋 Доступные тарифы:', availablePlans.value)
    
    // Автовыбор первого тарифа, если он один
    if (availablePlans.value.length === 1 && !form.value.billing_plan_id) {
      form.value.billing_plan_id = availablePlans.value[0].id
      onPlanSelected(availablePlans.value[0].id)
      console.log('✅ Автоматически выбран единственный доступный тариф:', availablePlans.value[0].id)
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки планов:', error)
  } finally {
    loadingPlans.value = false
  }
}

const loadBillingSettings = async () => {
  try {
    billingSettings.value = await billingService.getBillingSettings(companyId.value)
    console.log('📊 Загружены настройки биллинга:', billingSettings.value)
    console.log('📊 default_tax_rate:', billingSettings.value?.default_tax_rate, 'type:', typeof billingSettings.value?.default_tax_rate)
    console.log('📊 vat_rate_preset:', billingSettings.value?.vat_rate_preset)
    console.log('📊 vat_rate_custom:', billingSettings.value?.vat_rate_custom)
    showVAT.value = billingSettings.value?.tax_included || false
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error)
  }
}

const checkExistingSubscriptions = async () => {
  if (!form.value.contract_id) {
    existingSubscriptions.value = []
    return
  }
  loadingSubscriptions.value = true
  try {
    const subscriptions = await billingService.getSubscriptions(companyId.value)
    // Проверяем подписки для выбранного договора (если есть связь через contract_id)
    // Пока проверяем все активные подписки компании
    existingSubscriptions.value = subscriptions.filter(
      s => (s.status === 'active' || s.status === 'scheduled') && s.company_id === companyId.value
    )
  } catch (error) {
    console.error('Ошибка проверки подписок:', error)
  } finally {
    loadingSubscriptions.value = false
  }
}

const checkTariffAccess = async () => {
  if (!form.value.contract_id) {
    hasTariffAccess.value = true
    return
  }
  
  // Для создания подписки тарифный план выбирается на шаге 2,
  // поэтому не требуется, чтобы у договора уже был установлен тарифный план
  // Это позволяет создавать подписки для черновиков договоров
  hasTariffAccess.value = true
}

const onContractSelected = async (contractId?: number | null) => {
  console.log('📝 onContractSelected вызван, contractId:', contractId)
  console.log('📝 form.contract_id текущее значение:', form.value.contract_id)
  
  // v-model уже обновил form.contract_id, но на всякий случай синхронизируем
  if (contractId !== undefined && contractId !== null) {
    form.value.contract_id = contractId
    console.log('✅ form.contract_id установлен на:', form.value.contract_id)
  } else if (contractId === null || contractId === undefined) {
    // Если значение очищено
    form.value.contract_id = undefined
    console.log('⚠️ Договор очищен')
  }
  
  errors.value.contract_id = ''
  
  // Гарантируем, что hasTariffAccess обновлен
  await checkTariffAccess()
  await checkExistingSubscriptions()
  
  console.log('✅ После выбора договора: hasTariffAccess =', hasTariffAccess.value)
  console.log('✅ canProceed для шага 1:', form.value.contract_id && hasTariffAccess.value)
  
  // Принудительно обновляем реактивность
  if (form.value.contract_id && hasTariffAccess.value) {
    console.log('✅ Условия для перехода на шаг 2 выполнены')
  }
}

const onPlanSelected = (planId?: number) => {
  console.log('📝 onPlanSelected вызван, planId:', planId)
  console.log('📝 form.billing_plan_id до обновления:', form.value.billing_plan_id)
  
  // Обновляем form.value.billing_plan_id, если planId передан
  if (planId !== undefined) {
    form.value.billing_plan_id = planId
    console.log('✅ form.billing_plan_id обновлен на:', form.value.billing_plan_id)
  } else {
    // Если planId не передан, используем текущее значение из v-model
    console.log('⚠️ planId не передан, используем текущее значение:', form.value.billing_plan_id)
  }
  
  // Устанавливаем период по умолчанию в зависимости от типа тарифа
  if (selectedPlan.value) {
    const billingPeriod = selectedPlan.value.billing_period
    
    if (billingPeriod === 'yearly') {
      // Для годовых тарифов - по умолчанию 1 год (12 месяцев)
      subscriptionMonths.value = 12
      console.log('✅ Установлен период по умолчанию для годового тарифа: 12 месяцев (1 год)')
    } else if (billingPeriod === 'one-time') {
      // Для одноразовых - фиксированный период
      subscriptionMonths.value = 1
      console.log('✅ Установлен период по умолчанию для одноразового тарифа: 1')
    } else {
      // Для месячных - по умолчанию 1 месяц
      subscriptionMonths.value = 1
      console.log('✅ Установлен период по умолчанию для месячного тарифа: 1 месяц')
    }
  }
  
  errors.value.billing_plan_id = ''
  calculateEndDate()
  calculateTotalPrice()
}

// Расчет даты окончания на основе даты начала и периода
const calculateEndDate = () => {
  if (!form.value.start_date || !subscriptionMonths.value) {
    calculatedEndDate.value = ''
    return
  }
  
  const startDate = new Date(form.value.start_date)
  const endDate = new Date(startDate)
  
  // Для одноразовых тарифов дата окончания = дата начала
  if (selectedPlan.value?.billing_period === 'one-time') {
    calculatedEndDate.value = form.value.start_date
    console.log(`📅 Рассчитана дата окончания (одноразово): ${calculatedEndDate.value}`)
  } else {
    // Для месячных и годовых - добавляем месяцы
    endDate.setMonth(endDate.getMonth() + subscriptionMonths.value)
    // Вычитаем 1 день, чтобы получить последний день периода
    endDate.setDate(endDate.getDate() - 1)
    
    calculatedEndDate.value = endDate.toISOString().split('T')[0]
    
    const periodType = selectedPlan.value?.billing_period === 'yearly' 
      ? `${subscriptionMonths.value / 12} лет` 
      : `${subscriptionMonths.value} мес.`
    console.log(`📅 Рассчитана дата окончания: ${calculatedEndDate.value} (${periodType})`)
  }
  
  // Обновляем общую стоимость при изменении периода
  calculateTotalPrice()
}

// Расчет общей стоимости на основе тарифа и периода
const calculateTotalPrice = () => {
  if (!selectedPlan.value || !subscriptionMonths.value) {
    calculatedTotalPrice.value = 0
    return
  }
  
  const billingPeriod = selectedPlan.value.billing_period
  const planPrice = selectedPlan.value.price
  
  // Для месячных тарифов: цена за месяц × количество месяцев
  if (billingPeriod === 'monthly') {
    calculatedTotalPrice.value = planPrice * subscriptionMonths.value
    console.log(`💰 Рассчитана стоимость (месячный): ${calculatedTotalPrice.value} (${planPrice} × ${subscriptionMonths.value} мес.)`)
  }
  // Для годовых тарифов: цена за год × количество лет
  else if (billingPeriod === 'yearly') {
    const years = subscriptionMonths.value / 12
    calculatedTotalPrice.value = planPrice * years
    console.log(`💰 Рассчитана стоимость (годовой): ${calculatedTotalPrice.value} (${planPrice} × ${years} лет)`)
  }
  // Для одноразовых: фиксированная цена
  else if (billingPeriod === 'one-time') {
    calculatedTotalPrice.value = planPrice
    console.log(`💰 Рассчитана стоимость (одноразово): ${calculatedTotalPrice.value}`)
  }
  // По умолчанию - считаем как месячный
  else {
    calculatedTotalPrice.value = planPrice * subscriptionMonths.value
    console.log(`💰 Рассчитана стоимость (по умолчанию): ${calculatedTotalPrice.value}`)
  }
}

// Вспомогательная функция для склонения слова "месяц"
const getMonthsWord = (count: number): string => {
  const cases = [2, 0, 1, 1, 1, 2]
  const titles = ['месяц', 'месяца', 'месяцев']
  return titles[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]]
}

const onStartDateChanged = () => {
  errors.value.start_date = ''
  if (isScheduledStart.value) {
    form.value.status = 'scheduled'
  } else {
    form.value.status = 'active'
  }
  recalculatePrice()
}

const onStartTimeChanged = () => {
  errors.value.start_time = ''
  // Пересчитываем статус при изменении времени
  if (isScheduledStart.value) {
    form.value.status = 'scheduled'
  } else {
    form.value.status = 'active'
  }
}

const onStartImmediatelyChanged = () => {
  if (startImmediately.value) {
    // Если включен режим "немедленно", устанавливаем текущую дату/время
    const now = new Date()
    form.value.start_date = now.toISOString().split('T')[0]
    form.value.start_time = now.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
    form.value.status = 'active'
  } else {
    // Возвращаем обычный режим
    if (isScheduledStart.value) {
      form.value.status = 'scheduled'
    } else {
      form.value.status = 'active'
    }
  }
}

const recalculatePrice = () => {
  // Пересчет уже происходит в computed свойствах
}

const nextStep = () => {
  console.log('🔄 nextStep вызван, currentStep:', currentStep.value)
  console.log('📋 canProceed:', canProceed.value)
  console.log('📝 form.contract_id:', form.value.contract_id)
  console.log('🔓 hasTariffAccess:', hasTariffAccess.value)
  
  if (canProceed.value) {
    currentStep.value++
    console.log('✅ Переход на шаг:', currentStep.value)
  } else {
    console.warn('⚠️ Переход заблокирован. canProceed = false')
    // Показываем ошибку, если договор не выбран
    if (!form.value.contract_id) {
      errors.value.contract_id = 'Выберите договор для продолжения'
    }
  }
}

const previousStep = () => {
  currentStep.value--
}

const createSubscription = async () => {
  if (!canCreate.value) return
  
  // Дополнительная валидация перед отправкой
  if (!form.value.billing_plan_id || form.value.billing_plan_id <= 0) {
    errors.value.general = 'Выберите тарифный план'
    return
  }
  
  if (!form.value.start_date) {
    errors.value.general = 'Укажите дату начала подписки'
    return
  }
  
  creating.value = true
  errors.value = {}
  
  try {
    const subscriptionData: CreateSubscriptionData & {
      account_id?: number
      object_ids?: number[]
      contract_period_months?: number | null
      start_time?: string
      end_date?: string
    } = {
      company_id: form.value.company_id,
      billing_plan_id: form.value.billing_plan_id,
      start_date: form.value.start_date,
      start_time: form.value.start_time || undefined, // Добавляем время начала, если указано
      status: form.value.status,
      is_auto_renew: form.value.is_auto_renew,
      contract_id: form.value.contract_id,
      split_period: form.value.split_period || false,
      // Используем subscriptionMonths для расчета периода подписки
      contract_period_months: subscriptionMonths.value > 0 ? subscriptionMonths.value : undefined,
    }
    
    // Добавляем end_date, если он вычислен
    if (calculatedEndDate.value) {
      subscriptionData.end_date = calculatedEndDate.value
    }
    
    // Добавляем account_id и object_ids, если они выбраны
    if (form.value.account_id) {
      subscriptionData.account_id = form.value.account_id
    }
    
    if (selectedObjects.value.length > 0) {
      subscriptionData.object_ids = Array.from(selectedObjects.value)
    }
    
    if (form.value.transfer_from_existing && existingSubscriptions.value.length > 0) {
      subscriptionData.transfer_from_subscription_id = existingSubscriptions.value[0].id
    }
    
    console.log('📤 Отправка данных подписки на сервер:')
    console.log('  contract_id:', subscriptionData.contract_id)
    console.log('  billing_plan_id:', subscriptionData.billing_plan_id)
    console.log('  start_date:', subscriptionData.start_date)
    console.log('  start_time:', subscriptionData.start_time)
    console.log('  status:', subscriptionData.status)
    console.log('  account_id:', subscriptionData.account_id)
    console.log('  object_ids:', subscriptionData.object_ids)
    console.log('  subscriptionData (полный):', subscriptionData)
    console.log('  calculatedEndDate:', calculatedEndDate.value)
    console.log('  subscriptionMonths:', subscriptionMonths.value)
    
    const subscription = await billingService.createSubscription(subscriptionData)
    emit('created', subscription)
    close()
  } catch (error: any) {
    console.error('Ошибка создания подписки:', error)
    console.error('📥 Ответ сервера:', error.response?.data)
    if (error.response?.data?.error) {
      errors.value.general = error.response.data.error
    } else {
      errors.value.general = 'Ошибка создания подписки'
    }
  } finally {
    creating.value = false
  }
}

const close = () => {
  show.value = false
  currentStep.value = 1
  form.value = {
    company_id: companyId.value,
    billing_plan_id: undefined as any, // Используем undefined для корректного отображения в v-select
    start_date: new Date().toISOString().split('T')[0],
    start_time: '', // Сбрасываем время начала
    is_auto_renew: true,
    status: 'active',
    contract_id: undefined,
    transfer_from_existing: false,
    split_period: false,
    contract_period_months: null,
    account_id: undefined
  }
  errors.value = {}
  existingSubscriptions.value = []
  accountObjects.value = []
  selectedObjects.value = []
  objectsSearchQuery.value = ''
  accountSearchQuery.value = ''
  contractSearchQuery.value = ''
  hasTariffAccess.value = true // Сбрасываем доступ к тарифам
  savedSelectedAccount.value = null // Сбрасываем сохраненную учетную запись
  allAccountObjects.value = [] // Сбрасываем все объекты
  startImmediately.value = false // Сбрасываем флаг немедленного запуска
  objectsInSubscriptionsWarning.value = [] // Сбрасываем предупреждения
  conflictingSubscriptionError.value = '' // Сбрасываем ошибки конфликтов
  
  // Сбрасываем параметры подписки
  subscriptionMonths.value = 1
  calculatedEndDate.value = ''
  calculatedTotalPrice.value = 0
}

const formatDate = (date?: string) => {
  if (!date) return ''
  return billingService.formatDate(date)
}

const formatDateTime = (date?: string, time?: string) => {
  if (!date) return ''
  const formattedDate = billingService.formatDate(date)
  const formattedTime = time || '00:00'
  return `${formattedDate} ${formattedTime}`
}

const formatPrice = (amount: number, currency = 'RUB') => {
  return billingService.formatCurrency(amount, currency)
}

const getPeriodText = (period: string) => {
  const periods: Record<string, string> = {
    monthly: 'месяц',
    yearly: 'год',
    'one-time': 'разово'
  }
  return periods[period] || period
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Черновик',
    active: 'Активный',
    expired: 'Истекший',
    cancelled: 'Отмененный',
    suspended: 'Приостановленный'
  }
  return labels[status] || status
}

// Заголовки таблицы объектов
const objectsTableHeaders = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'IMEI', key: 'imei', sortable: true },
  { title: 'Телефон', key: 'phone_number', sortable: true },
  { title: 'Статус', key: 'status', sortable: true },
]

// Отфильтрованные объекты
const filteredAccountObjects = computed(() => {
  if (!objectsSearchQuery.value.trim()) {
    return accountObjects.value
  }
  const query = objectsSearchQuery.value.toLowerCase().trim()
  return accountObjects.value.filter(obj => {
    return (
      (obj.name && obj.name.toLowerCase().includes(query)) ||
      (obj.imei && obj.imei.toLowerCase().includes(query)) ||
      (obj.phone_number && obj.phone_number.toLowerCase().includes(query)) ||
      (obj.description && obj.description.toLowerCase().includes(query))
    )
  })
})

// Опции учетных записей
const accountOptions = computed(() => {
  const options = accounts.value.map(account => ({
    value: account.id,
    title: account.name,
    raw: account,
  }))
  
  // Убеждаемся, что выбранная учетная запись всегда в списке
  if (form.value.account_id && savedSelectedAccount.value) {
    const isInList = options.some(opt => opt.value === form.value.account_id)
    if (!isInList) {
      console.log('📌 Добавляем сохраненную учетную запись в список опций:', savedSelectedAccount.value.name)
      options.unshift({
        value: savedSelectedAccount.value.id,
        title: savedSelectedAccount.value.name,
        raw: savedSelectedAccount.value,
      })
    }
  }
  
  return options
})

// Выбранная учетная запись
const selectedAccount = computed(() => {
  if (!form.value.account_id) return null
  // Сначала ищем в текущем списке
  const fromList = accounts.value.find(acc => acc.id === form.value.account_id)
  // Если не найдена, используем сохраненную
  return fromList || savedSelectedAccount.value
})

// Функции для работы с объектами
const getObjectsTotal = (account: any) => {
  return account?.objectsTotal || account?.objects_total || 0
}

const getObjectsActive = (account: any) => {
  return account?.objectsActive || account?.objects_active || 0
}

// Загрузка учетных записей
const loadAccounts = async (search = '') => {
  if (loadingAccounts.value) return
  
  loadingAccounts.value = true
  try {
    const response = await accountsService.getAccounts({ 
      page: 1, 
      per_page: 50, 
      search: search || undefined 
    })
    accounts.value = response.results || []
    console.log('📋 Загружено учетных записей:', accounts.value.length, search ? `(поиск: "${search}")` : '')
  } catch (error) {
    console.error('Ошибка загрузки учетных записей:', error)
    accounts.value = []
  } finally {
    loadingAccounts.value = false
  }
}

// Загрузка объектов учетной записи
const loadAccountObjects = async (accountId: number) => {
  loadingAccountObjects.value = true
  try {
    // Ищем учетную запись сначала в текущем списке, потом в сохраненной
    let account = accounts.value.find(acc => acc.id === accountId)
    if (!account && savedSelectedAccount.value?.id === accountId) {
      account = savedSelectedAccount.value
      console.log('✅ Используем сохраненную учетную запись')
    }
    
    if (!account) {
      console.warn('⚠️ Учетная запись не найдена:', accountId)
      accountObjects.value = []
      allAccountObjects.value = []
      return
    }
    
    console.log('📦 Загрузка объектов для учетной записи:', { 
      id: account.id, 
      name: account.name,
      objectsTotal: account.objectsTotal 
    })
    
    // Загружаем объекты через getObjects с фильтром по accountId
    const objectsService = getObjectsService()
    const response = await objectsService.getObjects(1, 100, {
      accountId: account.id,
      accountName: account.name
    })
    
    console.log('📦 Ответ от getObjects:', {
      response: response,
      dataItems: response.data?.items,
      itemsLength: response.data?.items?.length || 0
    })
    
    // Фильтруем только объекты без договоров
    const allObjects = response.data?.items || []
    // Фильтруем: убираем объекты с contract_id, НО игнорируем случаи когда contract_id === account.id
    // (это ошибка в Axenta Cloud API, где contract_id может быть равен account_id)
    const objectsWithoutContract = allObjects.filter((obj: any) => {
      if (!obj.contract_id) return true // Нет contract_id - подходит
      if (obj.contract_id === account.id) return true // contract_id === account_id - это ошибка API, игнорируем
      return false // Есть реальный contract_id - пропускаем
    })
    
    console.log('📦 Объекты после фильтрации:', {
      всегоОбъектов: allObjects.length,
      безДоговоров: objectsWithoutContract.length,
      сДоговорами: allObjects.length - objectsWithoutContract.length
    })
    
    // Логируем первые несколько объектов для проверки
    if (allObjects.length > 0) {
      console.log('📦 Примеры объектов с contract_id:', 
        allObjects.slice(0, 3).map((obj: any) => ({
          id: obj.id,
          name: obj.name,
          contract_id: obj.contract_id,
          contract_number: obj.contract_number,
          isContractIdSameAsAccountId: obj.contract_id === account.id
        }))
      )
    }
    
    allAccountObjects.value = allObjects // Сохраняем все объекты
    accountObjects.value = objectsWithoutContract
  } catch (error) {
    console.error('❌ Ошибка загрузки объектов:', error)
    accountObjects.value = []
    allAccountObjects.value = []
  } finally {
    loadingAccountObjects.value = false
  }
}

// Обработчики поиска договоров
const handleContractSearch = (query: string) => {
  contractSearchQuery.value = query
}

// Фильтр для поиска договоров (поиск по любым совпадениям: цифры, символы, буквы, целиком или частично)
const contractFilter = (item: any, queryText: string, itemText: string) => {
  if (!queryText || !queryText.trim()) return true
  
  // Проверяем, что item.raw существует
  if (!item || !item.raw) return false
  
  const query = queryText.toLowerCase().trim()
  
  // Формируем searchText из всех доступных полей договора
  const number = (item.raw.number || '').toLowerCase()
  const title = (item.raw.title || '').toLowerCase()
  const clientName = (item.raw.client_short_name || item.raw.client_name || '').toLowerCase()
  const status = (item.raw.status || '').toLowerCase()
  
  // Объединяем все поля в одну строку для поиска
  const searchText = `${number} ${title} ${clientName} ${status}`.trim()
  
  // Поиск по всем полям: номер, название, клиент, статус
  // Поддерживает частичные совпадения (цифры, символы, буквы)
  return searchText.includes(query)
}

// Обработчики
const handleAccountSearch = (query: string) => {
  console.log('🔍 handleAccountSearch вызван с query:', query)
  // accountSearchQuery уже обновлен через v-model:search, не нужно дублировать
  if (query && query.length >= 2) {
    console.log('✅ Запускаем поиск с query:', query)
    loadAccounts(query)
  } else if (!query || query.length === 0) {
    console.log('⚠️ Query пустой, загружаем все учетные записи')
    loadAccounts()
  } else {
    console.log('ℹ️ Query слишком короткий:', query.length, 'символов')
  }
}

const handleAccountAutocompleteFocus = () => {
  if (accounts.value.length === 0) {
    loadAccounts()
  }
}

const onAccountSelected = (accountId: number | undefined) => {
  console.log('🔄 onAccountSelected вызван с accountId:', accountId)
  if (accountId) {
    console.log('✅ Загружаем объекты для учетной записи:', accountId)
    // Сохраняем выбранную учетную запись
    const account = accounts.value.find(acc => acc.id === accountId)
    if (account) {
      savedSelectedAccount.value = account
      console.log('💾 Сохранили учетную запись:', account.name)
    }
    loadAccountObjects(accountId)
    // Сбрасываем предупреждения при смене учетной записи
    objectsInSubscriptionsWarning.value = []
  } else {
    console.log('⚠️ accountId не указан, очищаем объекты')
    savedSelectedAccount.value = null
    accountObjects.value = []
    allAccountObjects.value = []
    selectedObjects.value = []
    objectsInSubscriptionsWarning.value = []
  }
}

// Проверка объектов на наличие в других подписках
const checkObjectsInSubscriptions = async () => {
  if (!selectedObjects.value.length || !form.value.contract_id) {
    objectsInSubscriptionsWarning.value = []
    return
  }

  try {
    // Загружаем все активные подписки для договора
    const subscriptions = await billingService.getSubscriptions(companyId.value)
    const activeSubscriptions = subscriptions.filter(
      s => s.contract_id === form.value.contract_id && (s.status === 'active' || s.status === 'scheduled')
    )

    if (activeSubscriptions.length > 0) {
      // Проверяем, есть ли выбранные объекты в этих подписках
      const subscriptionsWithSelectedObjects = []
      
      for (const sub of activeSubscriptions) {
        if (sub.object_ids && sub.object_ids.some(id => selectedObjects.value.includes(id))) {
          subscriptionsWithSelectedObjects.push(sub)
        }
      }

      objectsInSubscriptionsWarning.value = subscriptionsWithSelectedObjects
      console.log('⚠️ Найдено подписок с выбранными объектами:', subscriptionsWithSelectedObjects.length)
    } else {
      objectsInSubscriptionsWarning.value = []
    }
  } catch (error) {
    console.error('Ошибка проверки объектов в подписках:', error)
    objectsInSubscriptionsWarning.value = []
  }
}

// Проверка конфликта тарифа и периода с существующими подписками
const checkSubscriptionConflict = () => {
  conflictingSubscriptionError.value = ''
  
  if (!form.value.billing_plan_id || !selectedObjects.value.length) {
    return
  }

  // Проверяем, есть ли подписки с таким же тарифом и пересекающимся периодом
  const conflictingSubscriptions = objectsInSubscriptionsWarning.value.filter(sub => {
    // Проверяем, совпадает ли тариф
    if (sub.billing_plan_id !== form.value.billing_plan_id) {
      return false
    }

    // Проверяем пересечение периодов
    const startDate = new Date(form.value.start_date)
    const endDate = calculatedEndDate.value ? new Date(calculatedEndDate.value) : null
    const subStartDate = new Date(sub.start_date)
    const subEndDate = sub.end_date ? new Date(sub.end_date) : null

    // Если оба периода имеют даты окончания
    if (endDate && subEndDate) {
      // Периоды пересекаются, если startDate <= subEndDate && subStartDate <= endDate
      return startDate <= subEndDate && subStartDate <= endDate
    }

    // Если у новой подписки нет даты окончания
    if (!endDate && subEndDate) {
      return startDate <= subEndDate
    }

    // Если у существующей подписки нет даты окончания
    if (endDate && !subEndDate) {
      return subStartDate <= endDate
    }

    // Если у обеих нет даты окончания - всегда пересекаются
    return true
  })

  if (conflictingSubscriptions.length > 0) {
    const sub = conflictingSubscriptions[0]
    conflictingSubscriptionError.value = `Уже существует активная подписка с тарифом "${sub.billing_plan?.name}" и пересекающимся периодом. Измените тариф или период подписки.`
    console.error('❌ Обнаружен конфликт подписок:', conflictingSubscriptions)
  }
}

// Автоматическая проверка доступа к тарифам при выборе договора
watch(() => form.value.contract_id, async (newContractId) => {
  if (newContractId) {
    console.log('👀 Watch: contract_id изменился на:', newContractId)
    await checkTariffAccess()
    await checkExistingSubscriptions()
    console.log('✅ Watch: hasTariffAccess =', hasTariffAccess.value)
  } else {
    hasTariffAccess.value = true
    existingSubscriptions.value = []
  }
})

// Загрузка данных при открытии
watch(show, (isOpen) => {
  if (isOpen) {
    loadContracts()
    loadPlans()
    loadBillingSettings()
    loadAccounts()
    // Инициализируем расчет дат при открытии
    calculateEndDate()
  }
})

// Загрузка тарифов при переходе на шаг 2
watch(currentStep, (step) => {
  console.log('🔄 currentStep изменился на:', step)
  if (step === 2) {
    console.log('📋 Загружаем тарифы для шага 2...')
    loadPlans()
    // Инициализируем расчет при входе на шаг 2
    calculateEndDate()
  } else if (step === 4) {
    // При переходе на шаг 4 проверяем конфликты
    checkSubscriptionConflict()
  }
})

// Проверка объектов при изменении выбранных объектов
watch(selectedObjects, () => {
  if (selectedObjects.value.length > 0) {
    checkObjectsInSubscriptions()
  } else {
    objectsInSubscriptionsWarning.value = []
  }
}, { deep: true })

// Пересчет конфликтов при изменении даты, периода или тарифа
watch([() => form.value.start_date, () => form.value.billing_plan_id, calculatedEndDate], () => {
  if (currentStep.value === 4) {
    checkSubscriptionConflict()
  }
})

// Автоматический пересчет при изменении даты начала
watch(() => form.value.start_date, () => {
  calculateEndDate()
})

// Автоматический пересчет при изменении периода подписки
watch(subscriptionMonths, () => {
  calculateEndDate()
})
</script>

<style scoped>
.contract-period-input :deep(input::placeholder) {
  font-size: 0.75rem;
  opacity: 0.6;
}
</style>

