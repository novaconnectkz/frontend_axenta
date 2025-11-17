<template>
  <div class="create-contract-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-file-document-plus" class="page-icon" />
        <div>
          <h1 class="page-title">Создание договора</h1>
          <p class="page-subtitle">Создание нового договора с привязкой объектов</p>
        </div>
      </div>

      <div class="page-actions">
        <AppleButton
          variant="secondary"
          prepend-icon="mdi-arrow-left"
          @click="goBack"
        >
          Назад к списку
        </AppleButton>
      </div>
    </div>

    <!-- Форма создания договора -->
    <AppleCard class="form-card" variant="outlined">
      <v-form ref="formRef" v-model="formValid" @submit.prevent="saveContract">
        <div class="form-content">
          <!-- Основная информация -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-file-document" class="mr-2" />
              Основная информация
            </h3>
            
            <v-row>
              <v-col cols="12" md="4">
                <div v-if="showNumeratorSelection">
                  <label class="apple-input-label">Нумератор</label>
                  <v-select
                    v-model="selectedNumeratorId"
                    :items="numeratorOptions"
                    variant="outlined"
                    density="compact"
                    clearable
                    :loading="loadingNumerators"
                    hide-details="auto"
                    class="numerator-select"
                  >
                    <template #append-inner>
                      <v-tooltip location="top" :open-on-hover="true">
                        <template #activator="{ props }">
                          <v-icon
                            v-bind="props"
                            icon="mdi-information-outline"
                            color="primary"
                            size="20"
                            class="cursor-help"
                            style="margin-right: 8px;"
                          />
                        </template>
                        <div style="max-width: 320px; padding: 4px;">
                          <div class="text-body-2 font-weight-medium mb-2">
                            Автоматическая генерация номера
                          </div>
                          <div class="text-caption">
                            Выберите нумератор для автоматической генерации номера договора согласно настройкам выбранного нумератора.
                          </div>
                        </div>
                      </v-tooltip>
                    </template>
                      <template #append-item>
                        <v-list-item 
                          class="d-flex justify-center cursor-pointer"
                          @click="router.push('/billing?tab=settings&scrollToNumerators=true')"
                        >
                          <v-icon>mdi-format-list-numbered</v-icon>
                          <span class="ml-2">Настроить нумераторы</span>
                        </v-list-item>
                      </template>
                  </v-select>
                </div>
                <div v-else>
                  <label class="apple-input-label">Нумератор</label>
                  <div style="position: relative;">
                    <v-text-field
                      value="Вручную"
                      variant="outlined"
                      density="compact"
                      readonly
                      hide-details="auto"
                      style="pointer-events: none;"
                    />
                    <v-tooltip location="top" :open-on-hover="true">
                      <template #activator="{ props }">
                        <div
                          v-bind="props"
                          style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); z-index: 2; pointer-events: auto; cursor: pointer;"
                          @click="router.push('/billing?tab=settings&scrollToNumerators=true')"
                        >
                          <v-icon
                            icon="mdi-information-outline"
                            color="primary"
                            size="20"
                          />
                        </div>
                      </template>
                      <div style="max-width: 320px; padding: 4px;">
                        <div class="text-body-2 font-weight-medium mb-2">
                          Нумерация вручную
                        </div>
                        <div class="text-caption">
                          Номер договора будет вводиться вручную. Чтобы изменить способ нумерации, перейдите в настройки биллинга.
                        </div>
                        <div class="text-caption mt-2 font-weight-medium">
                          Нажмите на иконку, чтобы открыть настройки
                        </div>
                      </div>
                    </v-tooltip>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="4">
                <AppleInput
                  v-model="form.number"
                  label="Номер договора"
                  :rules="[rules.required]"
                  :readonly="!isManualNumbering"
                  required
                >
                  <template #append-inner>
                    <v-btn
                      v-if="showNumeratorSelection && selectedNumeratorId"
                      icon="mdi-reload"
                      size="small"
                      variant="text"
                      @click="generateNumber"
                      :loading="generatingNumber"
                      title="Сгенерировать номер"
                    ></v-btn>
                  </template>
                </AppleInput>
              </v-col>
              
              <v-col cols="12" md="4">
                <label class="apple-input-label">Статус</label>
                <v-select
                  v-model="form.status"
                  :items="statusOptions"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </div>

          <!-- Учетная запись и объекты -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-account-group" class="mr-2" />
              Учетная запись и объекты
            </h3>
            
            <v-row>
              <v-col cols="12">
                <label class="apple-input-label">Учетная запись</label>
                <v-autocomplete
                  v-model="form.account_id"
                  :items="accountOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Начните вводить название учетной записи..."
                  variant="outlined"
                  density="compact"
                  :loading="loadingAccounts"
                  hint="Выберите учетную запись для автоматической привязки её объектов к договору"
                  persistent-hint
                  clearable
                  :search="accountSearchQuery"
                  @update:search="handleAccountSearch"
                  no-data-text="Учетные записи не найдены"
                  loading-text="Загрузка учетных записей..."
                  :menu-props="{ maxHeight: 300 }"
                  @update:model-value="onAccountSelected"
                  @focus="handleAccountAutocompleteFocus"
                  @blur="handleAccountAutocompleteBlur"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" @click="debugAccountItem(item)">
                      <template #prepend>
                        <v-avatar size="small" :color="(item.raw as any)?.isActive ? 'success' : 'error'">
                          <v-icon :icon="(item.raw as any)?.isActive ? 'mdi-check' : 'mdi-close'" />
                        </v-avatar>
                      </template>
                      
                      <v-list-item-title>{{ (item.raw as any)?.name || item.title }}</v-list-item-title>
                      <v-list-item-subtitle>
                        <div class="d-flex align-center flex-wrap ga-2">
                          <!-- Всегда показываем чип с количеством объектов -->
                          <v-chip
                            :color="getObjectsTotal(item.raw) > 0 ? 'primary' : 'grey'"
                            size="small"
                            variant="flat"
                            class="font-weight-medium"
                          >
                            <v-icon start size="small">mdi-package-variant</v-icon>
                            {{ getObjectsTotal(item.raw) }} объектов
                          </v-chip>
                          <!-- Показываем активные объекты, если они есть -->
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
                  <template #selection="{ item }">
                    <div class="d-flex align-center ga-2">
                      <span v-if="item && typeof item === 'object' && (item as any).raw" class="font-weight-medium">
                        {{ (item as any).raw?.name || (item as any).raw?.title }}
                      </span>
                      <span v-else-if="selectedAccount" class="font-weight-medium">
                        {{ selectedAccount.name }}
                      </span>
                      <span v-else-if="form.account_id" class="font-weight-medium">
                        {{ accountOptions.find(opt => opt.value === form.account_id)?.title || selectedAccountName || '' }}
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
              </v-col>
            </v-row>

            <!-- Список объектов учетной записи без договоров -->
            <v-row v-if="form.account_id">
              <v-col cols="12">
                <v-card variant="outlined" class="objects-card">
                  <v-card-title class="text-subtitle-1 d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-package-variant" size="small" class="mr-2" />
                      Объекты для привязки к договору
                      <v-chip size="small" variant="tonal" color="primary" class="ml-2">
                        {{ accountObjects.length }}
                      </v-chip>
                    </div>
                    <div v-if="selectedObjectsForContract.length > 0" class="d-flex align-center">
                      <v-chip size="small" variant="outlined" color="primary" class="mr-2">
                        Выбрано: {{ selectedObjectsForContract.length }}
                      </v-chip>
                      <AppleButton
                        variant="text"
                        size="small"
                        prepend-icon="mdi-close"
                        @click="selectedObjectsForContract = []"
                      >
                        Сбросить
                      </AppleButton>
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
                  <div v-else-if="filteredAccountObjects.length > 0" class="objects-table-container">
                    <v-data-table
                      v-model="selectedObjectsForContract"
                      :headers="objectsTableHeaders"
                      :items="filteredAccountObjects"
                      item-value="id"
                      show-select
                      density="compact"
                      class="objects-table"
                      hide-default-footer
                      :items-per-page="10"
                    >
                      <!-- Колонка с именем объекта -->
                      <template #item.name="{ item }">
                        <div class="object-name-cell">
                          <div class="font-weight-medium">{{ item.name }}</div>
                          <div v-if="item.description" class="text-caption text-grey-600">
                            {{ item.description }}
                          </div>
                        </div>
                      </template>

                      <!-- Колонка с IMEI -->
                      <template #item.imei="{ item }">
                        <span v-if="item.imei">{{ item.imei }}</span>
                        <span v-else class="text-grey-400">—</span>
                      </template>

                      <!-- Колонка с телефоном -->
                      <template #item.phone_number="{ item }">
                        <span v-if="item.phone_number">{{ item.phone_number }}</span>
                        <span v-else class="text-grey-400">—</span>
                      </template>

                      <!-- Колонка со статусом -->
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
                      text="У этой учетной записи нет объектов без привязки к договорам"
                    />
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Информация о клиенте -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-account" class="mr-2" />
              Информация о клиенте
            </h3>
            
            <v-row>
              <v-col cols="12" md="4">
                <label class="apple-input-label">Тип клиента <span class="apple-input-required">*</span></label>
                <v-select
                  v-model="form.client_type"
                  :items="CLIENT_TYPE_OPTIONS"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                  required
                  hide-details
                  @update:model-value="onClientTypeChange"
                />
              </v-col>
              
              <v-col cols="12" md="8">
                <AppleInput
                  v-model="form.client_name"
                  :label="form.client_type === CLIENT_TYPES.PHYSICAL_PERSON ? 'ФИО клиента' : 'Наименование клиента'"
                  :rules="[rules.required]"
                  required
                />
              </v-col>
            </v-row>
            
            <!-- Реквизиты для организаций -->
            <template v-if="form.client_type === CLIENT_TYPES.ORGANIZATION">
              <v-row>
                <v-col cols="12" md="3">
                  <div style="position: relative;" ref="innAutocompleteRef" class="inn-field-container">
                    <AppleInput
                      ref="innInputRef"
                      :model-value="form.client_inn"
                      @update:modelValue="handleInnUpdate"
                      label="ИНН"
                      :rules="[rules.inn]"
                      :loading="loadingOrganizationData"
                      hint="Введите ИНН (10 цифр) или ОГРН (13 цифр) для автозаполнения"
                      persistent-hint
                      @valueChange="handleInnUpdate"
                      @input="handleInnUpdate"
                      @focus="handleInnFocus"
                      @blur="handleInnBlur"
                    />
                    <v-tooltip location="top" :open-on-hover="true">
                      <template #activator="{ props }">
                        <div
                          v-bind="props"
                          class="inn-info-icon-wrapper"
                        >
                          <v-icon
                            icon="mdi-information-outline"
                            color="primary"
                            size="20"
                          />
                        </div>
                      </template>
                      <div style="max-width: 320px; padding: 4px;">
                        <div class="text-body-2 font-weight-medium mb-2">
                          Автоматическое заполнение реквизитов
                        </div>
                        <div class="text-caption">
                          Введите ИНН (10 цифр) или ОГРН (13 цифр), и система автоматически заполнит:
                          <ul class="mt-2 mb-2 pl-3" style="text-align: left; line-height: 1.6;">
                            <li>Наименование организации</li>
                            <li>ИНН, КПП, ОГРН, ОКПО</li>
                            <li>Юридический и почтовый адреса</li>
                            <li>Руководителя</li>
                            <li>Контактные данные (телефон, email, сайт)</li>
                          </ul>
                          <strong>После ввода появится список с найденной организацией - выберите её из списка для автозаполнения.</strong>
                        </div>
                      </div>
                    </v-tooltip>
                  </div>
                    <!-- Выпадающее меню с результатами -->
                    <v-menu
                      v-model="showOrganizationMenu"
                      :activator="innAutocompleteRef"
                      location="bottom"
                      :max-height="400"
                      eager
                      offset-y
                    >
                      <v-list v-if="organizationSuggestions.length > 0" density="compact">
                        <v-list-item
                          v-for="(suggestion, index) in organizationSuggestions"
                          :key="index"
                          @click="onOrganizationSelect(suggestion)"
                          class="cursor-pointer"
                        >
                          <template #prepend>
                            <v-avatar size="small" color="primary">
                              <v-icon icon="mdi-domain" />
                            </v-avatar>
                          </template>
                          <v-list-item-title>{{ suggestion.name }}</v-list-item-title>
                          <v-list-item-subtitle>
                            <span v-if="suggestion.inn">ИНН: {{ suggestion.inn }}</span>
                            <span v-if="suggestion.kpp" class="ml-2">КПП: {{ suggestion.kpp }}</span>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                      <v-list v-else-if="loadingOrganizationData" density="compact">
                        <v-list-item>
                          <v-list-item-title>Поиск организации...</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                </v-col>
                
                <v-col cols="12" md="3">
                  <AppleInput
                    v-model="form.client_kpp"
                    label="КПП"
                  />
                </v-col>
                
                <v-col cols="12" md="3">
                  <AppleInput
                    v-model="form.client_ogrn"
                    label="ОГРН"
                    :rules="[rules.ogrn]"
                    :maxlength="13"
                  />
                </v-col>
                
                <v-col cols="12" md="3">
                  <AppleInput
                    v-model="form.client_okpo"
                    label="ОКПО"
                    :maxlength="10"
                  />
                </v-col>
              </v-row>
            </template>
            
            <!-- Реквизиты для ИП -->
            <template v-if="form.client_type === CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR">
              <v-row>
                <v-col cols="12" md="6">
                  <div style="position: relative;" ref="innAutocompleteRef">
                    <AppleInput
                      ref="innInputRef"
                      :model-value="form.client_inn"
                      @update:modelValue="handleInnUpdate"
                      label="ИНН"
                      :rules="[rules.inn]"
                      hint="12 цифр"
                      persistent-hint
                      @valueChange="handleInnUpdate"
                      @input="handleInnUpdate"
                      @focus="handleInnFocus"
                      @blur="handleInnBlur"
                    />
                  </div>
                </v-col>
                
                <v-col cols="12" md="6">
                  <AppleInput
                    v-model="form.client_ogrnip"
                    label="ОГРНИП"
                    :rules="[rules.ogrnip]"
                    hint="13 цифр"
                    persistent-hint
                    :maxlength="13"
                  />
                </v-col>
              </v-row>
            </template>

            <!-- Контакты -->
            <v-row>
              <v-col cols="12" md="4">
                <AppleInput
                  :model-value="emailValue"
                  @update:modelValue="handleEmailUpdate"
                  label="Email"
                  :rules="[rules.email]"
                  type="email"
                />
              </v-col>
              
              <v-col cols="12" md="4">
                <AppleInput
                  :model-value="phoneDisplayValue"
                  @update:modelValue="handlePhoneUpdate"
                  label="Телефон"
                  :rules="[rules.phone]"
                />
              </v-col>
              
              <v-col v-if="form.client_type === CLIENT_TYPES.ORGANIZATION || form.client_type === CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR" cols="12" md="4">
                <div class="website-input-wrapper">
                  <label class="apple-input-label">Сайт</label>
                  <div class="website-input-container">
                    <span class="website-prefix">https://</span>
                    <AppleInput
                      v-model="websiteValue"
                      type="url"
                    />
                  </div>
                </div>
              </v-col>
            </v-row>

            <!-- Адреса для организаций -->
            <template v-if="form.client_type === CLIENT_TYPES.ORGANIZATION">
              <v-row>
                <v-col cols="12" md="6">
                  <label class="apple-input-label">Юридический адрес</label>
                  <v-textarea
                    v-model="form.client_legal_address"
                    variant="outlined"
                    density="compact"
                    rows="1"
                    hide-details
                  />
                </v-col>
                
                <v-col cols="12" md="6">
                  <label class="apple-input-label">Почтовый адрес</label>
                  <v-textarea
                    v-model="form.client_postal_address"
                    variant="outlined"
                    density="compact"
                    rows="1"
                    hide-details
                  />
                </v-col>
              </v-row>
            </template>
              
            <!-- Адреса для физических лиц -->
            <template v-if="form.client_type === CLIENT_TYPES.PHYSICAL_PERSON">
              <v-row>
                <v-col cols="12" md="6">
                  <label class="apple-input-label">Адрес регистрации</label>
                  <v-textarea
                    v-model="form.client_registration_address"
                    variant="outlined"
                    density="compact"
                    rows="1"
                    hide-details
                  />
                </v-col>
                
                <v-col cols="12" md="6">
                  <label class="apple-input-label">Адрес фактического проживания</label>
                  <v-textarea
                    v-model="form.client_actual_address"
                    variant="outlined"
                    density="compact"
                    rows="1"
                    hide-details
                  />
                </v-col>
              </v-row>
            </template>
              
            <!-- Адрес регистрации (место жительства) для ИП -->
            <v-row v-if="form.client_type === CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR">
              <v-col cols="12">
                <label class="apple-input-label">Адрес регистрации (место жительства)</label>
                <v-textarea
                  v-model="form.client_registration_address"
                  variant="outlined"
                  density="compact"
                  rows="1"
                  hide-details
                />
              </v-col>
            </v-row>
            
            <!-- Паспортные данные для физических лиц и ИП -->
            <template v-if="form.client_type === CLIENT_TYPES.PHYSICAL_PERSON || form.client_type === CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR">
              <v-expansion-panels 
                v-model="passportExpanded" 
                class="mt-3"
                variant="accordion"
                :multiple="false"
              >
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-card-account-details" size="small" class="mr-2" />
                      <span class="subsection-title">Паспортные данные</span>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="12" md="2">
                        <AppleInput
                          v-model="form.client_passport_series"
                          label="Серия"
                          :maxlength="4"
                        />
                      </v-col>
                      
                      <v-col cols="12" md="3">
                        <AppleInput
                          v-model="form.client_passport_number"
                          label="Номер"
                          :maxlength="6"
                        />
                      </v-col>
                      
                      <v-col cols="12" md="3">
                        <AppleInput
                          v-model="form.client_passport_issue_date"
                          label="Дата выдачи"
                          type="date"
                        />
                      </v-col>
                      
                      <v-col cols="12" md="4">
                        <AppleInput
                          v-model="form.client_passport_department_code"
                          label="Код подразделения"
                          :maxlength="7"
                        />
                      </v-col>
                    </v-row>
                    
                    <v-row>
                      <v-col cols="12">
                        <label class="apple-input-label">Выдан</label>
                        <v-textarea
                          v-model="form.client_passport_issued_by"
                          variant="outlined"
                          density="compact"
                          rows="1"
                          hide-details
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </template>
            
            <!-- ИНН и СНИЛС для физических лиц -->
            <template v-if="form.client_type === CLIENT_TYPES.PHYSICAL_PERSON">
              <v-row>
                <v-col cols="12" md="6">
                  <AppleInput
                    v-model="form.client_inn"
                    label="ИНН"
                  />
                </v-col>
                
                <v-col cols="12" md="6">
                  <AppleInput
                    v-model="form.client_snils"
                    label="СНИЛС"
                    :maxlength="14"
                  />
                </v-col>
              </v-row>
            </template>
            
            <!-- Дополнительные поля для организаций -->
            <template v-if="form.client_type === CLIENT_TYPES.ORGANIZATION">
              <h4 class="subsection-title mt-3 mb-2">
                <v-icon icon="mdi-account-tie" size="small" class="mr-2" />
                Руководство
              </h4>
              
              <v-row>
                <v-col cols="12" md="6">
                  <AppleInput
                    v-model="form.client_director"
                    label="Генеральный директор / Руководитель"
                  />
                </v-col>
                
                <v-col cols="12" md="6">
                  <label class="apple-input-label">Действует на основании</label>
                  <v-textarea
                    v-model="form.client_based_on"
                    variant="outlined"
                    density="compact"
                    rows="1"
                    hide-details
                  />
                </v-col>
              </v-row>
            </template>
            
            <!-- Банковские реквизиты для всех типов клиентов -->
            <template v-if="form.client_type === CLIENT_TYPES.PHYSICAL_PERSON || form.client_type === CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR || form.client_type === CLIENT_TYPES.ORGANIZATION">
              <h4 class="subsection-title mt-3 mb-2">
                <v-icon icon="mdi-bank" size="small" class="mr-2" />
                Банковские реквизиты
              </h4>
              
              <!-- Для организаций порядок: Расчётный счёт, Корреспондентский счёт, Банк, БИК -->
              <template v-if="form.client_type === CLIENT_TYPES.ORGANIZATION">
                <v-row>
                  <v-col cols="12" md="6">
                    <AppleInput
                      v-model="form.client_bank_account"
                      label="Расчётный счёт"
                      :maxlength="20"
                    />
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <AppleInput
                      v-model="form.client_bank_correspondent_account"
                      label="Корреспондентский счёт"
                      :maxlength="20"
                    />
                  </v-col>
                </v-row>
                
                <v-row>
                  <v-col cols="12" md="8">
                    <AppleInput
                      v-model="form.client_bank_name"
                      label="Банк"
                    />
                  </v-col>
                  
                  <v-col cols="12" md="4">
                    <div style="position: relative;" ref="bikAutocompleteRef" class="inn-field-container">
                      <AppleInput
                        :model-value="form.client_bank_bik"
                        @update:modelValue="handleBikUpdate"
                        label="БИК"
                        :maxlength="9"
                        :loading="loadingBankData"
                        @focus="handleBikFocus"
                        @blur="handleBikBlur"
                      />
                      <v-tooltip location="top" :open-on-hover="true">
                        <template #activator="{ props }">
                          <div
                            v-bind="props"
                            class="inn-info-icon-wrapper"
                          >
                            <v-icon
                              icon="mdi-information-outline"
                              color="primary"
                              size="20"
                            />
                          </div>
                        </template>
                        <div style="max-width: 320px; padding: 4px;">
                          <div class="text-body-2 font-weight-medium mb-2">
                            Автоматическое заполнение реквизитов банка
                          </div>
                          <div class="text-caption">
                            Введите БИК (9 цифр), и система автоматически заполнит:
                            <ul class="mt-2 mb-2 pl-3" style="text-align: left; line-height: 1.6;">
                              <li>Наименование банка</li>
                              <li>Корреспондентский счёт</li>
                            </ul>
                            <strong>После ввода появится список с найденным банком - выберите его из списка для автозаполнения.</strong>
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                    <!-- Выпадающее меню с результатами -->
                    <v-menu
                      v-model="showBankMenu"
                      :activator="bikAutocompleteRef"
                      location="bottom"
                      :max-height="400"
                      eager
                      offset-y
                    >
                      <v-list v-if="bankSuggestions.length > 0" density="compact">
                        <v-list-item
                          v-for="(suggestion, index) in bankSuggestions"
                          :key="index"
                          @click="onBankSelect(suggestion)"
                          class="cursor-pointer"
                        >
                          <template #prepend>
                            <v-avatar size="small" color="primary">
                              <v-icon icon="mdi-bank" />
                            </v-avatar>
                          </template>
                          <v-list-item-title>{{ suggestion.name }}</v-list-item-title>
                          <v-list-item-subtitle>
                            <span v-if="suggestion.bik">БИК: {{ suggestion.bik }}</span>
                            <span v-if="suggestion.correspondentAccount" class="ml-2">К/с: {{ suggestion.correspondentAccount }}</span>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                      <v-list v-else-if="loadingBankData" density="compact">
                        <v-list-item>
                          <v-list-item-title>Поиск банка...</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </v-col>
                </v-row>
              </template>
              
              <!-- Для физических лиц и ИП порядок: Банк, БИК, Корреспондентский счёт, Расчётный счёт, Получатель -->
              <template v-else>
                <v-row>
                  <v-col cols="12">
                    <AppleInput
                      v-model="form.client_bank_name"
                      label="Наименование банка"
                    />
                  </v-col>
                </v-row>
                
                <v-row>
                  <v-col cols="12" md="4">
                    <div style="position: relative;" ref="bikAutocompleteRef" class="inn-field-container">
                      <AppleInput
                        :model-value="form.client_bank_bik"
                        @update:modelValue="handleBikUpdate"
                        label="БИК"
                        :maxlength="9"
                        :loading="loadingBankData"
                        @focus="handleBikFocus"
                        @blur="handleBikBlur"
                      />
                      <v-tooltip location="top" :open-on-hover="true">
                        <template #activator="{ props }">
                          <div
                            v-bind="props"
                            class="inn-info-icon-wrapper"
                          >
                            <v-icon
                              icon="mdi-information-outline"
                              color="primary"
                              size="20"
                            />
                          </div>
                        </template>
                        <div style="max-width: 320px; padding: 4px;">
                          <div class="text-body-2 font-weight-medium mb-2">
                            Автоматическое заполнение реквизитов банка
                          </div>
                          <div class="text-caption">
                            Введите БИК (9 цифр), и система автоматически заполнит:
                            <ul class="mt-2 mb-2 pl-3" style="text-align: left; line-height: 1.6;">
                              <li>Наименование банка</li>
                              <li>Корреспондентский счёт</li>
                            </ul>
                            <strong>После ввода появится список с найденным банком - выберите его из списка для автозаполнения.</strong>
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                    <!-- Выпадающее меню с результатами -->
                    <v-menu
                      v-model="showBankMenu"
                      :activator="bikAutocompleteRef"
                      location="bottom"
                      :max-height="400"
                      eager
                      offset-y
                    >
                      <v-list v-if="bankSuggestions.length > 0" density="compact">
                        <v-list-item
                          v-for="(suggestion, index) in bankSuggestions"
                          :key="index"
                          @click="onBankSelect(suggestion)"
                          class="cursor-pointer"
                        >
                          <template #prepend>
                            <v-avatar size="small" color="primary">
                              <v-icon icon="mdi-bank" />
                            </v-avatar>
                          </template>
                          <v-list-item-title>{{ suggestion.name }}</v-list-item-title>
                          <v-list-item-subtitle>
                            <span v-if="suggestion.bik">БИК: {{ suggestion.bik }}</span>
                            <span v-if="suggestion.correspondentAccount" class="ml-2">К/с: {{ suggestion.correspondentAccount }}</span>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                      <v-list v-else-if="loadingBankData" density="compact">
                        <v-list-item>
                          <v-list-item-title>Поиск банка...</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </v-col>
                  
                  <v-col cols="12" md="4">
                    <AppleInput
                      v-model="form.client_bank_correspondent_account"
                      label="Корреспондентский счёт"
                      :maxlength="20"
                    />
                  </v-col>
                  
                  <v-col cols="12" md="4">
                    <AppleInput
                      v-model="form.client_bank_account"
                      label="Расчётный счёт"
                      :maxlength="20"
                    />
                  </v-col>
                </v-row>
                
                <v-row>
                  <v-col cols="12">
                    <AppleInput
                      v-model="form.client_bank_recipient"
                      label="Получатель"
                    />
                  </v-col>
                </v-row>
              </template>
            </template>
          </div>

          <!-- Тарификация и стоимость -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-currency-rub" class="mr-2" />
              Тарификация и стоимость
            </h3>
            
            <v-row>
              <v-col cols="12" md="6">
                <label class="apple-input-label">Тарифный план <span class="apple-input-required">*</span></label>
                <v-select
                  v-model="form.tariff_plan_id"
                  :items="tariffPlanOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                  :loading="loadingTariffPlans"
                  required
                  hide-details
                  :no-data-text="loadingTariffPlans ? 'Загрузка...' : 'Тарифные планы не найдены. Создайте план в разделе Биллинг → Тарифные планы'"
                  placeholder="Выберите тарифный план"
                  clearable
                  @update:model-value="onTariffPlanChange"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-avatar size="small" color="primary">
                          <v-icon icon="mdi-package-variant" />
                        </v-avatar>
                      </template>
                      
                      <v-list-item-title>{{ item.title }}</v-list-item-title>
                      <v-list-item-subtitle>
                        <template v-if="item.raw">
                          <!-- Безопасное извлечение price с обработкой разных типов -->
                          <template v-if="(item.raw as any).price !== undefined && (item.raw as any).price !== null">
                            {{ formatCurrency(
                              typeof (item.raw as any).price === 'string' 
                                ? parseFloat((item.raw as any).price.replace(',', '.')) || 0
                                : Number((item.raw as any).price) || 0, 
                              (item.raw as any).currency || 'RUB'
                            ) }}/{{ getPeriodText((item.raw as any).billing_period) }}
                            <template v-if="(item.raw as any).max_devices > 0">
                              • До {{ (item.raw as any).max_devices }} устройств
                            </template>
                            <template v-else>
                              • Безлимит устройств
                            </template>
                          </template>
                          <template v-else>
                            <!-- Fallback если данных нет -->
                            {{ formatCurrency(0) }}/мес
                            <span class="text-caption text-error">(данные не загружены)</span>
                          </template>
                        </template>
                        <template v-else>
                          <!-- Fallback если raw отсутствует -->
                          {{ formatCurrency(0) }}/мес
                          <span class="text-caption text-error">(данные не загружены)</span>
                        </template>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </div>
        </div>

        <!-- Действия формы -->
        <div class="form-actions">
          <v-divider class="mb-4" />
          <div class="actions-buttons">
            <AppleButton variant="text" @click="goBack">
              Отмена
            </AppleButton>
            <v-spacer />
            <AppleButton 
              @click="saveContract" 
              :loading="saving"
              :disabled="!formValid"
              color="primary"
              prepend-icon="mdi-check"
            >
              Создать договор
            </AppleButton>
          </div>
        </div>
      </v-form>
    </AppleCard>

    <!-- Snackbar для уведомлений -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="4000">
      {{ snackbarText }}
      <template #actions>
        <v-btn color="white" variant="text" @click="showSnackbar = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { 
  ContractForm,
} from '@/types/contracts';
import type { DaDataOrganization } from '@/services/dadataService';
import {
  CONTRACT_STATUS_LABELS,
  CLIENT_TYPE_OPTIONS,
  CLIENT_TYPES,
  type ClientType,
} from '@/types/contracts';
import type { BillingPlan, BillingSettings } from '@/types/billing';
import type { ContractNumerator } from '@/types/contracts';
import type { Account } from '@/services/accountsService';
import contractsService from '@/services/contractsService';
import accountsService from '@/services/accountsService';
import billingService from '@/services/billingService';
import dadataService from '@/services/dadataService';
import { getObjectsService } from '@/services/objectsService';
import { AppleButton, AppleInput, AppleCard } from '@/components/Apple';

const router = useRouter();
const route = useRoute();

// Reactive data
const formRef = ref();
const formValid = ref(false);
const saving = ref(false);
const loadingTariffPlans = ref(false);
const loadingAccounts = ref(false);
const accounts = ref<Account[]>([]);
const tariffPlans = ref<BillingPlan[]>([]);
// Удалено: isTariffPlanInitialized - не используется
const accountObjects = ref<any[]>([]);
const loadingAccountObjects = ref(false);
const selectedAccountName = ref('');
const selectedObjectsForContract = ref<number[]>([]);
const objectsSearchQuery = ref('');
const loadingOrganizationData = ref(false);
const selectedOrganization = ref<any>(null);
const innSearchQuery = ref<string>('');
const organizationSuggestions = ref<Array<{name: string; inn: string; kpp?: string; raw: DaDataOrganization}>>([]);
const innSearchTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const innAutocompleteRef = ref<any>(null);
const innInputRef = ref<any>(null);
const showOrganizationMenu = ref(false);
const loadingBankData = ref(false);
const bikSearchTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const bikAutocompleteRef = ref<any>(null);
const showBankMenu = ref(false);
const bankSuggestions = ref<Array<{name: string; bik: string; correspondentAccount?: string; raw: any}>>([]);
const passportExpanded = ref<number | null>(0); // Индекс панели: 0 = развернуто, null = свернуто
const numerators = ref<ContractNumerator[]>([]);
const loadingNumerators = ref(false);
const selectedNumeratorId = ref<number | null>(null);
const generatingNumber = ref(false);
const billingSettings = ref<BillingSettings | null>(null);
const loadingBillingSettings = ref(false);

// Заголовки таблицы объектов
const objectsTableHeaders = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'IMEI', key: 'imei', sortable: true },
  { title: 'Телефон', key: 'phone_number', sortable: true },
  { title: 'Статус', key: 'status', sortable: true },
];

// Отфильтрованные объекты по поисковому запросу
const filteredAccountObjects = computed(() => {
  if (!objectsSearchQuery.value.trim()) {
    return accountObjects.value;
  }

  const query = objectsSearchQuery.value.toLowerCase().trim();
  return accountObjects.value.filter(obj => {
    return (
      (obj.name && obj.name.toLowerCase().includes(query)) ||
      (obj.imei && obj.imei.toLowerCase().includes(query)) ||
      (obj.phone_number && obj.phone_number.toLowerCase().includes(query)) ||
      (obj.description && obj.description.toLowerCase().includes(query))
    );
  });
});

// Snackbar
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Form data
const defaultForm: ContractForm = {
  number: '',
  title: '',
  description: '',
  client_type: CLIENT_TYPES.ORGANIZATION,
  client_name: '',
  client_inn: '',
  client_kpp: '',
  client_email: '',
  client_phone: '',
  client_address: '',
  client_legal_address: '',
  client_postal_address: '',
  client_ogrn: '',
  client_okpo: '',
  client_director: '',
  client_based_on: '',
  // Поля для физических лиц и ИП
  client_passport_series: '',
  client_passport_number: '',
  client_passport_issued_by: '',
  client_passport_issue_date: '',
  client_passport_department_code: '',
  client_registration_address: '',
  client_actual_address: '',
  client_snils: '',
  client_ogrnip: '',
  client_website: '',
  // Банковские реквизиты
  client_bank_name: '',
  client_bank_bik: '',
  client_bank_correspondent_account: '',
  client_bank_account: '',
  client_bank_recipient: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '', // Будет установлено автоматически при выборе тарифного плана
  tariff_plan_id: 0,
  total_amount: '',
  currency: 'RUB',
  status: 'active',
  is_active: true,
  notify_before: 30,
  notes: '',
  external_id: '',
  account_id: undefined,
};

const form = ref<ContractForm>({ ...defaultForm });

// Options
const statusOptions = Object.entries(CONTRACT_STATUS_LABELS).map(([value, title]) => ({
  value,
  title,
}));

// Удалено: currencyOptions - не используется

// Удалено: notificationOptions - не используется

const accountOptions = computed(() => {
  return accounts.value.map(account => ({
    value: account.id,
    title: account.name, // Только название учетной записи
    raw: account,
  }));
});

// Найти учетную запись по ID для отображения
const findAccountById = (accountId: number | undefined) => {
  if (!accountId) return null;
  return accounts.value.find(acc => acc.id === accountId) || null;
};

// Computed для отображения выбранной учетной записи
const selectedAccount = computed(() => {
  if (!form.value.account_id) return null;
  return findAccountById(form.value.account_id);
});

const tariffPlanOptions = computed(() => {
  const options = tariffPlans.value.map(plan => {
    // Логируем для отладки
    if (tariffPlans.value.indexOf(plan) === 0) {
      console.log('🔍 tariffPlanOptions: первый план:', {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        priceType: typeof plan.price,
        max_devices: plan.max_devices,
        billing_period: plan.billing_period,
        fullPlan: plan
      });
    }
    
    const option = {
    value: plan.id,
    title: plan.name,
      raw: { ...plan }, // Создаем копию объекта для реактивности
    };
    
    // Логируем первый элемент для отладки
    if (tariffPlans.value.indexOf(plan) === 0) {
      console.log('🔍 tariffPlanOptions: созданная опция:', {
        value: option.value,
        title: option.title,
        rawPrice: option.raw.price,
        rawPriceType: typeof option.raw.price,
        raw: option.raw
      });
    }
    
    return option;
  });
  
  console.log('📋 tariffPlanOptions создано:', options.length, 'опций');
  if (options.length > 0) {
    console.log('📋 Первая опция:', {
      value: options[0].value,
      title: options[0].title,
      raw: options[0].raw,
      rawPrice: options[0].raw?.price
    });
  }
  return options;
});

const numeratorOptions = computed(() => {
  return numerators.value.map(numerator => ({
    value: numerator.id,
    title: numerator.name,
    subtitle: `${numerator.template} (Счетчик: ${numerator.counter_value})`,
    raw: numerator,
  }));
});

// Показывать выбор нумератора только если способ нумерации = "numerator"
const showNumeratorSelection = computed(() => {
  return billingSettings.value?.contract_numbering_method === 'numerator';
});

// Поле "Номер договора" редактируемо только если способ нумерации = "manual"
const isManualNumbering = computed(() => {
  return billingSettings.value?.contract_numbering_method === 'manual';
});

// Computed для поля сайта - удаляем префикс https:// для отображения
const websiteValue = computed({
  get: () => {
    const value = form.value.client_website || '';
    // Удаляем все возможные префиксы протоколов
    return value.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  },
  set: (val: string) => {
    // При установке значения добавляем https:// если его нет
    if (!val) {
      form.value.client_website = '';
      return;
    }
    const cleanValue = val.trim();
    if (cleanValue && !/^https?:\/\//i.test(cleanValue)) {
      form.value.client_website = `https://${cleanValue}`;
    } else {
      form.value.client_website = cleanValue;
    }
  }
});

// Функция для форматирования телефона в формат E.164 (для сохранения)
const formatToE164 = (value: string): string => {
  if (!value) return '';
  
  // Удаляем все символы кроме цифр и +
  let cleaned = value.replace(/[^\d+]/g, '');
  
  // Если номер не начинается с +, добавляем его
  if (!cleaned.startsWith('+')) {
    // Если номер начинается с 8 (российский формат), заменяем на +7
    if (cleaned.startsWith('8') && cleaned.length > 1) {
      cleaned = '+7' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') && cleaned.length > 1) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length > 0) {
      // Если номер начинается с другой цифры, добавляем +7 по умолчанию для России
      cleaned = '+7' + cleaned;
    } else {
      cleaned = '+';
    }
  }
  
  // Ограничиваем максимальную длину (15 цифр после +)
  const digitsAfterPlus = cleaned.replace(/^\+/, '').replace(/\D/g, '');
  if (digitsAfterPlus.length > 15) {
    cleaned = '+' + digitsAfterPlus.substring(0, 15);
  }
  
  return cleaned;
};

// Функция для форматирования E.164 в читаемый формат +7 (XXX) XXX-XX-XX
const formatPhoneDisplay = (e164Value: string): string => {
  if (!e164Value) return '';
  
  // Удаляем все кроме цифр и +
  let cleaned = e164Value.replace(/[^\d+]/g, '');
  
  // Если номер не начинается с +, пытаемся обработать
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('8') && cleaned.length > 1) {
      cleaned = '+7' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') && cleaned.length > 1) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length > 0) {
      cleaned = '+7' + cleaned;
    }
  }
  
  // Если номер в формате +7XXXXXXXXXX
  if (cleaned.startsWith('+7') && cleaned.length >= 3) {
    const digits = cleaned.substring(2); // Берем цифры после +7
    
    if (digits.length === 0) {
      return '+7';
    } else if (digits.length <= 3) {
      return `+7 (${digits}`;
    } else if (digits.length <= 6) {
      return `+7 (${digits.substring(0, 3)}) ${digits.substring(3)}`;
    } else if (digits.length <= 8) {
      return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    } else {
      return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
    }
  }
  
  // Для других международных номеров (не +7) просто возвращаем как есть
  return cleaned;
};

// Computed для отображения телефона в читаемом формате
const phoneDisplayValue = computed({
  get: () => {
    return formatPhoneDisplay(form.value.client_phone || '');
  },
  set: (val: string) => {
    // При установке сразу конвертируем в E.164
    form.value.client_phone = formatToE164(val);
  }
});

// Метод для обработки обновления поля телефона
const handlePhoneUpdate = (value: string) => {
  // Сохраняем в E.164 формате
  form.value.client_phone = formatToE164(value);
};

// Computed для поля email - фильтрация только латиницы
const emailValue = computed({
  get: () => {
    return form.value.client_email || '';
  },
  set: (val: string) => {
    // Фильтруем: разрешаем только латинские буквы, цифры и символы @._-
    const filtered = val.replace(/[^a-zA-Z0-9@._-]/g, '');
    form.value.client_email = filtered;
  }
});

// Метод для обработки обновления поля email
const handleEmailUpdate = (value: string) => {
  // Фильтруем: разрешаем только латинские буквы, цифры и символы @._-
  const filtered = value.replace(/[^a-zA-Z0-9@._-]/g, '');
  form.value.client_email = filtered;
};

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
  email: (value: string) => {
    if (!value) return true;
    // Проверка на наличие @
    if (!value.includes('@')) {
      return 'Email должен содержать символ @';
    }
    // Проверка на латиницу: только латинские буквы, цифры и разрешенные символы
    const latinPattern = /^[a-zA-Z0-9@._-]+$/;
    if (!latinPattern.test(value)) {
      return 'Email должен содержать только латинские буквы, цифры и символы @._-';
    }
    // Стандартная валидация email
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(value) || 'Неверный формат email';
  },
  phone: (value: string) => {
    if (!value) return true;
    // Валидация формата E.164: начинается с +, затем 1-15 цифр
    const pattern = /^\+[1-9]\d{1,14}$/;
    return pattern.test(value) || 'Телефон должен быть в формате E.164 (например: +79161234567)';
  },
  inn: (value: string) => {
    if (!value) return true;
    const clientType = form.value.client_type;
    // Для организации - 10 цифр, для ИП - 12 цифр
    if (clientType === CLIENT_TYPES.ORGANIZATION) {
      const pattern = /^[0-9]{10}$|^[0-9]{13}$/; // 10 цифр ИНН или 13 ОГРН
      return pattern.test(value) || 'ИНН должен содержать 10 цифр, ОГРН - 13 цифр';
    } else if (clientType === CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR) {
      const pattern = /^[0-9]{12}$|^[0-9]{13}$/; // 12 цифр ИНН или 13 ОГРНИП
      return pattern.test(value) || 'ИНН должен содержать 12 цифр, ОГРНИП - 13 цифр';
    }
    // Для физических лиц ИНН не требуется
    return true;
  },
  ogrnip: (value: string) => {
    if (!value) return true;
    const pattern = /^[0-9]{13}$/;
    return pattern.test(value) || 'ОГРНИП должен содержать 13 цифр';
  },
  ogrn: (value: string) => {
    if (!value) return true;
    const pattern = /^[0-9]{13}$/;
    return pattern.test(value) || 'ОГРН должен содержать 13 цифр';
  },
  number: (value: string) => {
    if (!value) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 || 'Должно быть положительное число';
  },
};

// Methods
const goBack = () => {
  router.back();
};

const onTariffPlanChange = (planId: number | null) => {
  // Игнорируем если план не выбран или это очистка значения
  if (!planId || planId === 0) {
    console.log('🔍 onTariffPlanChange: план не выбран, пропускаем');
    return;
  }
  
  const selectedPlan = tariffPlans.value.find(plan => plan.id === planId);
  
  if (!selectedPlan) {
    console.log('🔍 onTariffPlanChange: план не найден, planId:', planId);
    return;
  }
  
  console.log('🔍 onTariffPlanChange: выбран план', {
    planId,
    name: selectedPlan.name,
    price: selectedPlan.price,
    billing_period: selectedPlan.billing_period,
    currency: selectedPlan.currency
  });
  
  // Автоматически устанавливаем период действия договора на основе billing_period тарифа
  if (form.value.start_date) {
    const startDate = new Date(form.value.start_date + 'T00:00:00');
    const endDate = new Date(startDate);
    
    if (selectedPlan.billing_period === 'monthly') {
      // Для месячного тарифа устанавливаем период 1 месяц
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (selectedPlan.billing_period === 'yearly') {
      // Для годового тарифа устанавливаем период 1 год
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // Для one-time или других типов устанавливаем период 1 год по умолчанию
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    form.value.end_date = endDate.toISOString().split('T')[0];
    console.log('📅 Период договора установлен:', {
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      billing_period: selectedPlan.billing_period
    });
  }
  
  // Стоимость будет рассчитана автоматически при создании подписки
};

const saveContract = async () => {
  if (!formRef.value || !formValid.value) return;

  saving.value = true;
  try {
    // Подготавливаем данные для отправки - оставляем только поля, которые есть в модели Contract
    const contractData: any = {
      number: form.value.number,
      title: form.value.title || `Договор с ${form.value.client_name}`,
      description: form.value.description || '',
      client_name: form.value.client_name,
      client_inn: form.value.client_inn || '',
      client_kpp: form.value.client_kpp || '',
      client_email: form.value.client_email || '',
      client_phone: form.value.client_phone || '',
      client_address: form.value.client_address || '',
      tariff_plan_id: Number(form.value.tariff_plan_id),
      status: form.value.status || 'active',
      notes: form.value.notes || '',
    };
    
    // Добавляем company_id из localStorage
    const companyData = localStorage.getItem('axenta_company');
    if (companyData) {
      try {
        const company = JSON.parse(companyData);
        if (company && company.id) {
          contractData.company_id = Number(company.id);
        }
      } catch (e) {
        console.warn('Ошибка парсинга company из localStorage:', e);
      }
    }
    
    // Добавляем значения по умолчанию для дат, если они отсутствуют
    // Конвертируем в ISO формат (RFC3339) для Go time.Time
    if (!form.value.start_date) {
      contractData.start_date = new Date().toISOString();
    } else {
      // Если дата в формате YYYY-MM-DD, конвертируем в ISO
      const startDate = new Date(form.value.start_date + 'T00:00:00Z');
      contractData.start_date = startDate.toISOString();
    }
    
    if (!form.value.end_date) {
      // Устанавливаем период на основе выбранного тарифного плана
      const startDate = form.value.start_date 
        ? new Date(form.value.start_date + 'T00:00:00Z')
        : new Date();
      const defaultEndDate = new Date(startDate);
      
      // Пытаемся найти выбранный тарифный план
      const selectedPlan = tariffPlans.value.find(plan => plan.id === form.value.tariff_plan_id);
      if (selectedPlan) {
        if (selectedPlan.billing_period === 'monthly') {
          defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
        } else if (selectedPlan.billing_period === 'yearly') {
          defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
        } else {
          // Для one-time или других типов устанавливаем период 1 год по умолчанию
          defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
        }
      } else {
        // Если тариф не выбран, устанавливаем период 1 год по умолчанию
        defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
      }
      
      contractData.end_date = defaultEndDate.toISOString();
    } else {
      // Если дата в формате YYYY-MM-DD, конвертируем в ISO
      const endDate = new Date(form.value.end_date + 'T23:59:59Z');
      contractData.end_date = endDate.toISOString();
    }
    
    // Добавляем account_id для привязки объектов (если есть) - это отдельное поле в CreateContractRequest
    if (form.value.account_id) {
      contractData.account_id = Number(form.value.account_id);
    }
    
    // Добавляем object_ids для привязки объектов при создании договора
    if (selectedObjectsForContract.value.length > 0) {
      contractData.object_ids = selectedObjectsForContract.value;
    }
    
    console.log('📤 Отправка данных договора:', JSON.stringify(contractData, null, 2));
    
    // Создаем договор
    const createdContract = await contractsService.createContract(contractData);
    
    // Если есть выбранные объекты, привязываем их к договору (дополнительная привязка через отдельный endpoint)
    if (selectedObjectsForContract.value.length > 0 && createdContract.id) {
      try {
        const attachData = {
          object_ids: selectedObjectsForContract.value,
          account_id: form.value.account_id ? Number(form.value.account_id) : undefined,
        };
        console.log('📤 Отправка данных для привязки объектов:', JSON.stringify(attachData, null, 2));
        await contractsService.attachObjectsToContract(createdContract.id, attachData);
        console.log(`✅ Привязано ${selectedObjectsForContract.value.length} объектов к договору`);
        showSnackbarMessage(
          `Договор создан и привязано ${selectedObjectsForContract.value.length} объектов`,
          'success'
        );
      } catch (attachError: any) {
        console.error('Ошибка привязки объектов к договору:', attachError);
        // Не блокируем создание договора, если привязка не удалась
        showSnackbarMessage(
          'Договор создан, но не все объекты удалось привязать. Вы можете привязать их позже.',
          'warning'
        );
        setTimeout(() => {
          router.push('/billing');
        }, 2000);
        return;
      }
    } else {
      showSnackbarMessage('Договор успешно создан', 'success');
    }

    setTimeout(() => {
      router.push('/billing');
    }, 1500);
  } catch (error: any) {
    console.error('Error saving contract:', error);
    
    // Показываем детальную ошибку, если есть
    let errorMessage = 'Ошибка сохранения договора';
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.details) {
        errorMessage = `${errorData.error || 'Ошибка'}: ${errorData.details}`;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showSnackbarMessage(errorMessage, 'error');
  } finally {
    saving.value = false;
  }
};

const showSnackbarMessage = (text: string, color: string) => {
  snackbarText.value = text;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

// Load billing settings
const loadBillingSettings = async () => {
  const companyData = localStorage.getItem('axenta_company');
  let companyId: number | undefined;
  
  if (companyData) {
    try {
      const company = JSON.parse(companyData);
      companyId = parseInt(company.id, 10);
    } catch (e) {
      console.warn('Invalid company data in localStorage');
    }
  }
  
  if (!companyId) return;
  
  loadingBillingSettings.value = true;
  try {
    billingSettings.value = await billingService.getBillingSettings(companyId);
  } catch (error) {
    console.error('Error loading billing settings:', error);
  } finally {
    loadingBillingSettings.value = false;
  }
};

// Load numerators
const loadNumerators = async () => {
  const companyData = localStorage.getItem('axenta_company');
  let companyId: number | undefined;
  
  if (companyData) {
    try {
      const company = JSON.parse(companyData);
      companyId = parseInt(company.id, 10);
    } catch (e) {
      console.warn('Invalid company data in localStorage');
    }
  }
  
  if (!companyId) return;
  
  loadingNumerators.value = true;
  try {
    numerators.value = await contractsService.getContractNumerators(companyId);
    
    // Auto-select default numerator if exists and numbering method is 'numerator'
    // Генерация номера будет выполнена через watch после загрузки всех данных
    if (billingSettings.value?.contract_numbering_method === 'numerator') {
      const defaultNumerator = numerators.value.find(n => n.is_default);
      if (defaultNumerator) {
        selectedNumeratorId.value = defaultNumerator.id;
      }
    }
  } catch (error) {
    console.error('Error loading numerators:', error);
  } finally {
    loadingNumerators.value = false;
  }
};

// Generate contract number
const generateNumber = async (skipConfirmation = false) => {
  if (!selectedNumeratorId.value) return;
  
  // Если номер уже введен вручную, спрашиваем подтверждение (если не пропущено)
  if (!skipConfirmation && form.value.number && form.value.number.trim() !== '') {
    const confirmed = confirm('Номер договора уже заполнен. Заменить его автоматически сгенерированным номером?');
    if (!confirmed) return;
  }
  
  generatingNumber.value = true;
  try {
    const companyData = localStorage.getItem('axenta_company');
    let companyId: number | undefined;
    
    if (companyData) {
      try {
        const company = JSON.parse(companyData);
        companyId = parseInt(company.id, 10);
      } catch (e) {
        console.warn('Invalid company data in localStorage');
      }
    }
    
    const result = await contractsService.generateContractNumber(
      selectedNumeratorId.value,
      {
        client_id: form.value.account_id,
        company_id: companyId,
      }
    );
    
    form.value.number = result.number;
  } catch (error: any) {
    console.error('Error generating number:', error);
    showSnackbarMessage(error.message || 'Ошибка генерации номера', 'error');
  } finally {
    generatingNumber.value = false;
  }
};

// Поисковый запрос для учетных записей
const accountSearchQuery = ref('');

// Загрузка списка учетных записей с поиском (оптимизированная версия)
const loadAccounts = async (searchQuery: string = '') => {
  if (loadingAccounts.value) return;
  loadingAccounts.value = true;
  
  // Сохраняем выбранную учетную запись перед обновлением списка
  const selectedAccountId = form.value.account_id;
  let selectedAccount: Account | null = null;
  if (selectedAccountId) {
    selectedAccount = findAccountById(selectedAccountId);
  }
  
  try {
    // Загружаем только первую страницу (100 записей) или результаты поиска
    // Это значительно ускоряет загрузку, так как не нужно загружать все страницы
    const response = await accountsService.getAccounts({ 
      page: 1, 
      per_page: 100,
      ordering: 'name',
      search: searchQuery || undefined
    });
    
    accounts.value = response.results || [];
    
    // Если была выбранная учетная запись и её нет в новом списке, добавляем её
    if (selectedAccount && selectedAccountId) {
      const existsInNewList = accounts.value.some(acc => acc.id === selectedAccountId);
      if (!existsInNewList) {
        accounts.value.unshift(selectedAccount);
        console.log('✅ Выбранная учетная запись сохранена в списке:', selectedAccount.name);
      }
    }
    
    console.log(`✅ Загружено ${accounts.value.length} учетных записей${searchQuery ? ` (поиск: "${searchQuery}")` : ''}`);
  } catch (error) {
    console.error('Ошибка загрузки учетных записей:', error);
    accounts.value = [];
    
    // В случае ошибки, если была выбранная учетная запись, добавляем её обратно
    if (selectedAccount) {
      accounts.value = [selectedAccount];
    }
  } finally {
    loadingAccounts.value = false;
  }
};

// Загрузка одной учетной записи по ID (для оптимизации при переходе с предзаполненным account_id)
const loadSingleAccount = async (accountId: number) => {
  if (loadingAccounts.value) return;
  loadingAccounts.value = true;
  const startTime = performance.now();
  
  try {
    console.log(`📋 Загрузка учетной записи по ID: ${accountId}`);
    const account = await accountsService.getAccount(accountId);
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    accounts.value = [account];
    console.log(`✅ Учетная запись загружена за ${duration}ms: ${account.name} (ID: ${account.id})`);
    
    // Если загрузка занимает больше 2 секунд, предупреждаем
    if (endTime - startTime > 2000) {
      console.warn(`⚠️ Медленная загрузка учетной записи: ${duration}ms`);
    }
  } catch (error) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.error(`❌ Ошибка загрузки учетной записи (${duration}ms):`, error);
    // В случае ошибки загружаем все записи как fallback
    console.log('⚠️ Fallback: загружаем все учетные записи');
    await loadAccounts();
  } finally {
    loadingAccounts.value = false;
  }
};

// Отладочная функция для проверки структуры item при клике
const debugAccountItem = (item: any) => {
  console.log('🔍 DEBUG: Структура item в выпадающем списке:', {
    item,
    itemRaw: item?.raw,
    itemTitle: item?.title,
    itemValue: item?.value,
    objectsTotal: item?.raw?.objectsTotal,
    objects_total: item?.raw?.objects_total,
    objectsActive: item?.raw?.objectsActive,
    objects_active: item?.raw?.objects_active,
    allKeys: item?.raw ? Object.keys(item.raw) : []
  });
};

// Вспомогательные функции для получения количества объектов из учетной записи
const getObjectsTotal = (account: any): number => {
  if (!account) {
    return 0;
  }
  
  // Проверяем разные возможные варианты полей (camelCase и snake_case)
  let total = account.objectsTotal ?? 
               account.objects_total ?? 
               account.objectsCount ?? 
               account.objects_count ?? 
               0;
  
  // Если не нашли, проверяем вложенную структуру
  if (!total && account.raw) {
    total = account.raw.objectsTotal ?? 
            account.raw.objects_total ?? 
            account.raw.objectsCount ?? 
            account.raw.objects_count ?? 
            0;
  }
  
  const numValue = typeof total === 'number' ? total : (total ? parseInt(String(total), 10) : 0) || 0;
  
  // Логируем для отладки при каждом вызове (временно)
  if (account && account.name) {
    console.debug(`🔍 getObjectsTotal для "${account.name}":`, {
      accountType: typeof account,
      objectsTotal: account.objectsTotal,
      objects_total: account.objects_total,
      hasRaw: !!account.raw,
      rawObjectsTotal: account.raw?.objectsTotal,
      result: numValue,
      allAccountKeys: Object.keys(account || {})
    });
  }
  
  return numValue;
};

const getObjectsActive = (account: any): number => {
  if (!account) {
    console.warn('⚠️ getObjectsActive: account is null or undefined');
    return 0;
  }
  
  // Проверяем разные возможные варианты полей (camelCase и snake_case)
  const active = account.objectsActive ?? 
                 account.objects_active ?? 
                 account.activeObjects ?? 
                 account.active_objects ??
                 (account.raw ? (account.raw.objectsActive ?? account.raw.objects_active) : null) ??
                 0;
  
  return typeof active === 'number' ? active : parseInt(String(active), 10) || 0;
};

// Удалено: filterAccounts - не используется, поиск выполняется на сервере

// Обработчик поиска учетных записей (с debounce для оптимизации)
let accountSearchTimeout: ReturnType<typeof setTimeout> | null = null;
const handleAccountSearch = async (query: string | null) => {
  // Обрабатываем случай, когда query может быть null или undefined
  const searchQuery = query ?? '';
  accountSearchQuery.value = searchQuery;
  
  // Очищаем предыдущий таймаут
  if (accountSearchTimeout) {
    clearTimeout(accountSearchTimeout);
  }
  
  // Если поле очищено (null, undefined или пустая строка), сразу загружаем первую страницу
  if (!searchQuery || searchQuery.trim().length === 0) {
    await loadAccounts('');
    return;
  }
  
  // Debounce: ждем 300ms после последнего ввода перед поиском
  accountSearchTimeout = setTimeout(async () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length >= 2) {
      // Ищем только если введено 2+ символа
      await loadAccounts(trimmedQuery);
    }
  }, 300);
};

// Обработчик фокуса на autocomplete учетной записи
const handleAccountAutocompleteFocus = async () => {
  // Если есть выбранная учетная запись, убеждаемся что она в списке
  if (form.value.account_id) {
    const account = findAccountById(form.value.account_id);
    if (!account) {
      // Если выбранной учетной записи нет в списке, загружаем её
      console.log('📋 Выбранная учетная запись не найдена в списке, загружаем...');
      try {
        const selectedAccount = await accountsService.getAccount(form.value.account_id);
        const existingIndex = accounts.value.findIndex(acc => acc.id === form.value.account_id);
        if (existingIndex === -1) {
          accounts.value.unshift(selectedAccount);
          console.log('✅ Выбранная учетная запись добавлена в список:', selectedAccount.name);
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки выбранной учетной записи:', error);
      }
    }
  }
  
  // Если список пустой или содержит только одну запись, загружаем первую страницу
  if ((accounts.value.length === 0 || accounts.value.length === 1) && !loadingAccounts.value && !accountSearchQuery.value) {
    console.log('📋 Загружаем первую страницу учетных записей для выбора');
    await loadAccounts();
  }
};

// Обработчик потери фокуса на autocomplete учетной записи
const handleAccountAutocompleteBlur = () => {
  // При потере фокуса очищаем поисковый запрос, если есть выбранная учетная запись
  // Это нужно для корректного отображения выбранной записи
  if (form.value.account_id && accountSearchQuery.value) {
    // Небольшая задержка, чтобы не конфликтовать с выбором из списка
    setTimeout(() => {
      if (form.value.account_id) {
        accountSearchQuery.value = '';
      }
    }, 200);
  }
};

// Обработчик выбора учетной записи
const onAccountSelected = async (accountId: number | undefined) => {
  console.log('🔵 onAccountSelected called with:', accountId);
  
  if (!accountId) {
    accountObjects.value = [];
    selectedAccountName.value = '';
    selectedObjectsForContract.value = [];
    objectsSearchQuery.value = '';
    accountSearchQuery.value = ''; // Очищаем поисковый запрос
    return;
  }

  let account = findAccountById(accountId);
  
  // Если учетная запись не найдена в текущем списке, загружаем её отдельно
  if (!account) {
    console.log('📋 Учетная запись не найдена в списке, загружаем отдельно...');
    try {
      account = await accountsService.getAccount(accountId);
      // Добавляем загруженную учетную запись в список, если её там еще нет
      const existingIndex = accounts.value.findIndex(acc => acc.id === accountId);
      if (existingIndex === -1) {
        accounts.value.unshift(account); // Добавляем в начало списка
        console.log('✅ Учетная запись добавлена в список:', account.name);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки учетной записи:', error);
      // В случае ошибки очищаем выбор
      form.value.account_id = undefined;
      return;
    }
  }

  if (account) {
    selectedAccountName.value = account.name;
    console.log('🔵 Selected account:', account.name);
    
    // Очищаем поисковый запрос после выбора, чтобы выбранная запись отображалась корректно
    accountSearchQuery.value = '';
  }

  // Очищаем предыдущий выбор объектов
  selectedObjectsForContract.value = [];
  objectsSearchQuery.value = '';

  // Загружаем объекты этой учетной записи, которые не привязаны к договорам
  await loadAccountObjects(accountId);
};

// Загрузка объектов учетной записи без привязки к договорам
const loadAccountObjects = async (accountId: number) => {
  loadingAccountObjects.value = true;
  accountObjects.value = [];
  
  try {
    const account = findAccountById(accountId);
    if (!account) {
      console.warn('⚠️ Учетная запись не найдена:', accountId);
      return;
    }

    console.log('🔍 Начинаем загрузку объектов для учетной записи:', {
      accountId,
      accountName: account.name,
      objectsTotal: account.objectsTotal,
      objectsActive: account.objectsActive
    });

    const objectsService = getObjectsService();
    
    // Загружаем все объекты учетной записи
    // Используем accountName для фильтрации, но убираем фильтр is_active чтобы видеть все объекты
    let allObjects: any[] = [];
    let page = 1;
    let hasMore = true;
    const perPage = 100;
    const maxPages = 20; // Ограничение для предотвращения бесконечных циклов

    console.log('📡 Отправляем запрос на получение объектов для учетной записи:', {
      accountId: account.id,
      accountName: account.name,
      objectsTotal: account.objectsTotal,
      objectsActive: account.objectsActive
    });

    while (hasMore && page <= maxPages) {
      try {
        // Используем accountId для более точной фильтрации объектов по выбранной учетной записи
        const response = await objectsService.getObjects(page, perPage, {
          accountId: account.id, // Фильтруем по ID учетной записи - это гарантирует, что показываются объекты только выбранной компании
          accountName: account.name, // Дополнительный фильтр по имени для совместимости
          // Убираем фильтр is_active, чтобы загрузить все объекты (и активные, и неактивные)
        });
        
        console.log(`📋 Страница ${page}: фильтр accountId=${account.id}, accountName="${account.name}"`);

        console.log(`📋 Страница ${page}: получено объектов:`, response.data?.items?.length || 0);

        if (response.data && response.data.items && response.data.items.length > 0) {
          // Логируем первые несколько объектов для отладки
          if (page === 1 && response.data.items.length > 0) {
            console.log('📦 Первые объекты до фильтрации:', response.data.items.slice(0, 3).map((obj: any) => ({
              id: obj.id,
              name: obj.name,
              contract_id: obj.contract_id,
              accountId: obj.accountId || obj.company_id,
              accountName: obj.accountName
            })));
          }

          allObjects = allObjects.concat(response.data.items);
          hasMore = response.data.items.length === perPage && page < maxPages;
          page++;
        } else {
          hasMore = false;
        }
      } catch (pageError) {
        console.error(`❌ Ошибка загрузки страницы ${page}:`, pageError);
        hasMore = false;
      }
    }

    console.log(`📊 Всего загружено объектов до фильтрации: ${allObjects.length} для учетной записи "${account.name}" (ID: ${account.id})`);

    // КРИТИЧЕСКИ ВАЖНО: Фильтруем объекты на стороне фронтенда, чтобы показать ТОЛЬКО объекты выбранной учетной записи
    // Axenta Cloud API может не применять фильтры правильно, поэтому делаем дополнительную проверку
    const filteredObjects = allObjects.filter((obj: any) => {
      // Получаем accountId объекта (может быть в разных полях)
      const objAccountId = obj.accountId || obj.company_id;
      
      // Получаем accountName объекта для сравнения
      const objAccountName = obj.accountName || '';
      
      // Проверяем по accountId (наиболее надежный способ)
      if (objAccountId && Number(objAccountId) === Number(account.id)) {
        return true;
      }
      
      // Если accountId не совпадает или отсутствует, проверяем по accountName (дополнительная проверка)
      // Используем точное сравнение с учетом возможных различий в регистре/пробелах
      if (objAccountName && objAccountName.trim() === account.name.trim()) {
        return true;
      }
      
      // Если ни accountId, ни accountName не совпадают, объект не принадлежит выбранной учетной записи
      return false;
    });

    console.log(`🔍 После фильтрации: ${filteredObjects.length} объектов соответствуют учетной записи "${account.name}" (ID: ${account.id})`);
    
    // Логируем объекты, которые не прошли фильтрацию (если есть)
    if (allObjects.length > filteredObjects.length) {
      const excluded = allObjects.filter((obj: any) => {
        const objAccountId = obj.accountId || obj.company_id;
        const objAccountName = obj.accountName || '';
        return !(
          (objAccountId && Number(objAccountId) === Number(account.id)) ||
          (objAccountName.trim() === account.name.trim())
        );
      });
      if (excluded.length > 0) {
        console.warn(`⚠️ Исключено ${excluded.length} объектов, которые не принадлежат выбранной учетной записи:`, 
          excluded.slice(0, 5).map((obj: any) => ({
            name: obj.name,
            accountId: obj.accountId || obj.company_id,
            accountName: obj.accountName,
            expectedAccountId: account.id,
            expectedAccountName: account.name
          }))
        );
      }
    }

    // Показываем только отфильтрованные объекты
    accountObjects.value = filteredObjects;

    console.log(`✅ Загружено и отфильтровано ${accountObjects.value.length} объектов для учетной записи "${account.name}" (ID: ${account.id})`);
    
    // Если объектов нет, проверяем почему
    if (accountObjects.value.length === 0 && allObjects.length > 0) {
      console.warn('⚠️ Объекты были загружены, но ни один не соответствует выбранной учетной записи');
      console.log('📋 Информация о загруженных объектах:', {
        totalLoaded: allObjects.length,
        accountId: account.id,
        accountName: account.name,
        sampleObjects: allObjects.slice(0, 3).map((obj: any) => ({
          name: obj.name,
          accountId: obj.accountId || obj.company_id,
          accountName: obj.accountName
        }))
      });
    } else if (accountObjects.value.length === 0) {
      console.warn('⚠️ Для учетной записи не найдено объектов');
      console.log('💡 Возможные причины:');
      console.log('   - В учетной записи действительно нет объектов');
      console.log('   - Поле accountId или accountName в объектах не совпадает с выбранной учетной записью');
      console.log('   - Объекты находятся в другой учетной записи');
      
      // Пробуем загрузить без фильтра для проверки, работает ли API вообще
      try {
        const testResponse = await objectsService.getObjects(1, 10, {});
        console.log('🧪 Тестовый запрос без фильтров вернул:', testResponse.data?.items?.length || 0, 'объектов');
        if (testResponse.data?.items && testResponse.data.items.length > 0) {
          console.log('📦 Первый объект из тестового запроса:', {
            name: testResponse.data.items[0].name,
            accountName: testResponse.data.items[0].accountName,
          });
          console.log('💡 Если accountName первого объекта отличается от выбранной учетной записи, значит нужно проверить соответствие');
        }
      } catch (testError) {
        console.error('❌ Ошибка тестового запроса:', testError);
      }
    }
  } catch (error: any) {
    console.error('❌ Ошибка загрузки объектов учетной записи:', error);
    console.error('📋 Детали ошибки:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    accountObjects.value = [];
  } finally {
    loadingAccountObjects.value = false;
  }
};

// Загрузка тарифных планов
const loadTariffPlans = async () => {
  loadingTariffPlans.value = true;
  try {
    // Получаем company_id из localStorage
    let companyId: number | undefined = undefined;
    const companyData = localStorage.getItem('axenta_company');
    if (companyData) {
      try {
        const company = JSON.parse(companyData);
        if (company && company.id) {
          companyId = Number(company.id);
          console.log('📋 Загрузка тарифных планов для company_id:', companyId);
        }
      } catch (e) {
        console.warn('Ошибка парсинга company из localStorage:', e);
      }
    }
    
    if (!companyId) {
      console.warn('⚠️ company_id не найден, тарифные планы могут быть недоступны');
    }
    
    tariffPlans.value = await billingService.getBillingPlans(companyId);
    console.log(`✅ Загружено тарифных планов: ${tariffPlans.value.length}`);
    
    // Логируем данные первого плана для отладки
    if (tariffPlans.value.length > 0) {
      const firstPlan = tariffPlans.value[0];
      console.log('📊 Первый тарифный план:', {
        id: firstPlan.id,
        name: firstPlan.name,
        price: firstPlan.price,
        priceType: typeof firstPlan.price,
        max_devices: firstPlan.max_devices,
        currency: firstPlan.currency,
        billing_period: firstPlan.billing_period,
        fullPlan: firstPlan
      });
    }
    
    if (tariffPlans.value.length === 0 && companyId) {
      console.warn('⚠️ Тарифные планы не найдены для company_id:', companyId);
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки тарифных планов:', error);
    tariffPlans.value = [];
  } finally {
    loadingTariffPlans.value = false;
  }
};

const formatCurrency = (amount: number, currency = 'RUB'): string => {
  return contractsService.formatCurrency(amount, currency);
};

// Функция для получения текста периода тарификации
const getPeriodText = (period: string | undefined): string => {
  if (!period) return 'мес';
  const periodMap: Record<string, string> = {
    'monthly': 'мес',
    'yearly': 'год',
    'one-time': 'разово'
  };
  return periodMap[period] || 'мес';
};

// Обработчик изменения типа клиента
const onClientTypeChange = (clientType: ClientType) => {
  // При смене типа клиента очищаем поля, которые не нужны для нового типа
  if (clientType === CLIENT_TYPES.PHYSICAL_PERSON) {
    // Для физических лиц не нужны ИНН (будет показан отдельно), КПП, обычный адрес
    form.value.client_kpp = '';
    form.value.client_address = '';
    organizationSuggestions.value = [];
    showOrganizationMenu.value = false;
    // Для физических лиц паспортные данные развернуты по умолчанию (индекс 0 = развернуто)
    passportExpanded.value = 0;
  } else if (clientType === CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR) {
    // Для ИП не нужен КПП и адрес фактического проживания
    form.value.client_kpp = '';
    form.value.client_actual_address = '';
    form.value.client_snils = '';
    // Адрес регистрации используется для ИП, не очищаем
    // Для ИП паспортные данные свернуты по умолчанию (null = свернуто)
    passportExpanded.value = null;
  } else if (clientType === CLIENT_TYPES.ORGANIZATION) {
    // Для организации очищаем все поля физических лиц и ИП
    form.value.client_passport_series = '';
    form.value.client_passport_number = '';
    form.value.client_passport_issued_by = '';
    form.value.client_passport_issue_date = '';
    form.value.client_passport_department_code = '';
    form.value.client_registration_address = '';
    form.value.client_actual_address = '';
    form.value.client_snils = '';
    form.value.client_ogrnip = '';
    // Очищаем старый адрес, если он был
    if (!form.value.client_legal_address) {
      form.value.client_address = '';
    }
  }
  // Если переключились на организацию или ИП, очищаем поиск организаций
  if (clientType !== CLIENT_TYPES.ORGANIZATION) {
    organizationSuggestions.value = [];
    showOrganizationMenu.value = false;
  }
  
  // Очищаем предложения банков при смене типа клиента
  bankSuggestions.value = [];
  showBankMenu.value = false;
};

// Watcher для автоматической загрузки объектов при изменении account_id
watch(() => form.value.account_id, async (newAccountId, oldAccountId) => {
  console.log('🔵 watch account_id changed:', { newAccountId, oldAccountId });
  if (newAccountId && newAccountId !== oldAccountId) {
    await onAccountSelected(newAccountId);
  } else if (!newAccountId) {
    accountObjects.value = [];
    selectedAccountName.value = '';
    selectedObjectsForContract.value = [];
    objectsSearchQuery.value = '';
  }
});

// Обработчик обновления ИНН из событий компонента
const handleInnUpdate = (val: string | Event) => {
  let actualValue: string;
  if (val instanceof Event) {
    const target = val.target as HTMLInputElement;
    actualValue = target.value;
  } else {
    actualValue = String(val || '');
  }
  
  form.value.client_inn = actualValue;
  handleInnValueChanged(actualValue);
};

// Функция для обработки изменения ИНН
const handleInnValueChanged = (value: string) => {
  const actualValue = String(value || '').trim();
  
  if (form.value.client_inn !== actualValue) {
    form.value.client_inn = actualValue;
  }
  
  // Проверяем валидность и запускаем поиск только для организаций
  const clientType = form.value.client_type;
  if (clientType === CLIENT_TYPES.ORGANIZATION) {
    // Для организаций: 10 цифр ИНН или 13 ОГРН
    if (actualValue.length >= 10 && /^\d{10}$|^\d{13}$/.test(actualValue)) {
      innSearchQuery.value = actualValue;
      onInnSearch(actualValue);
    } else {
      if (actualValue === '') {
        organizationSuggestions.value = [];
        showOrganizationMenu.value = false;
      }
    }
  } else if (clientType === CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR) {
    // Для ИП: 12 цифр ИНН или 13 ОГРНИП (поиск не выполняем)
    if (actualValue === '') {
      // Очистка при пустом значении
    }
  }
};

// Watch для автоматического отслеживания form.client_inn
watch(
  () => form.value.client_inn,
  (newValue, oldValue) => {
    if (newValue !== oldValue && newValue) {
      const searchValue = String(newValue || '').trim();
      if (searchValue.length >= 10 && /^\d{10}$|^\d{12}$|^\d{13}$/.test(searchValue)) {
        innSearchQuery.value = searchValue;
        onInnSearch(searchValue);
      }
    }
  },
  { immediate: false }
);

// Обработчик фокуса на поле ИНН
const handleInnFocus = () => {
  if (organizationSuggestions.value.length > 0) {
    showOrganizationMenu.value = true;
  }
};

// Обработчик обновления БИК
const handleBikUpdate = (value: string | Event) => {
  let actualValue: string;
  if (value instanceof Event) {
    const target = value.target as HTMLInputElement;
    actualValue = target.value;
  } else {
    actualValue = String(value || '');
  }
  
  form.value.client_bank_bik = actualValue;
  
  // Очищаем предыдущий таймаут
  if (bikSearchTimeout.value) {
    clearTimeout(bikSearchTimeout.value);
    bikSearchTimeout.value = null;
  }
  
  // Если БИК заполнен полностью (9 цифр), ищем банк
  const cleanedBik = actualValue.trim().replace(/\s+/g, '');
  if (cleanedBik.length === 9 && /^\d{9}$/.test(cleanedBik)) {
    // Debounce - ждем 500ms после последнего ввода
    bikSearchTimeout.value = setTimeout(() => {
      searchBankByBik(cleanedBik);
    }, 500);
  } else {
    // Если БИК неполный или удален, очищаем предложения
    if (cleanedBik.length < 9) {
      bankSuggestions.value = [];
      showBankMenu.value = false;
    }
  }
};

// Поиск банка по БИК через DaData
const searchBankByBik = async (bik: string) => {
  if (!bik || bik.length !== 9 || !/^\d{9}$/.test(bik)) {
    bankSuggestions.value = [];
    return;
  }
  
  loadingBankData.value = true;
  bankSuggestions.value = [];
  
  try {
    console.log('🏦 Searching bank by BIK:', bik);
    const bankData = await dadataService.findBankByBik(bik);
    
    if (bankData) {
      console.log('🏦✅ Bank data received:', bankData);
      
      // Структура ответа от DaData: {value: "Наименование", data: {...}}
      const bank = bankData.data || bankData;
      
      // Извлекаем название банка
      let bankName = '';
      if (bank.name) {
        if (typeof bank.name === 'object' && bank.name.payment) {
          bankName = bank.name.payment;
        } else if (typeof bank.name === 'object' && bank.name.full) {
          bankName = bank.name.full;
        } else if (typeof bank.name === 'string') {
          bankName = bank.name;
        }
      } else if (bankData.value) {
        bankName = bankData.value;
      }
      
      // Создаем предложение для выбора
      const suggestion = {
        name: bankName,
        bik: bank.bic || bank.bik || bik,
        correspondentAccount: bank.correspondent_account || '',
        raw: bankData
      };
      
      bankSuggestions.value = [suggestion];
      
      // Показываем меню с результатами
      await nextTick();
      if (bankSuggestions.value.length > 0) {
        showBankMenu.value = true;
      }
    } else {
      console.log('🏦⚠️ Bank not found by BIK:', bik);
      bankSuggestions.value = [];
    }
  } catch (error: any) {
    console.error('🏦❌ Error searching bank by BIK:', error);
    bankSuggestions.value = [];
    
    // Если 404, возможно бэкенд не перезапущен - не показываем ошибку пользователю
    if (error.response?.status === 404) {
      console.warn('🏦⚠️ Endpoint /api/auth/dadata/bank not found. Backend may need restart.');
      // Не показываем ошибку, так как это техническая проблема
      return;
    }
    
    showSnackbarMessage(error.message || 'Ошибка при поиске банка', 'error');
  } finally {
    loadingBankData.value = false;
  }
};

// Заполнение полей банка из данных DaData
const fillBankData = (bankData: any) => {
  console.log('🏦 Filling bank data:', bankData);
  
  // Структура ответа от DaData: {value: "Наименование", data: {...}}
  const bank = bankData.data || bankData;
  
  // Наименование банка (приоритет: name.payment, name.full, name, value)
  if (bank.name) {
    if (typeof bank.name === 'object' && bank.name.payment) {
      // Новая структура: name это объект с полем payment
      form.value.client_bank_name = bank.name.payment;
    } else if (typeof bank.name === 'object' && bank.name.full) {
      form.value.client_bank_name = bank.name.full;
    } else if (typeof bank.name === 'string') {
      // Старая структура: name это строка
      form.value.client_bank_name = bank.name;
    }
  } else if (bankData.value) {
    form.value.client_bank_name = bankData.value;
  }
  
  // Корреспондентский счет
  if (bank.correspondent_account) {
    form.value.client_bank_correspondent_account = bank.correspondent_account;
  }
  
  // БИК уже заполнен пользователем, но проверим что совпадает с ответом
  // В ответе DaData поле называется "bic", а не "bik"
  const bankBik = bank.bic || bank.bik;
  if (bankBik && bankBik !== form.value.client_bank_bik) {
    // Если БИК в ответе отличается, обновляем (на случай опечатки)
    form.value.client_bank_bik = bankBik;
  }
  
  showSnackbarMessage('Данные банка успешно заполнены', 'success');
};

// Обработчик потери фокуса
const handleInnBlur = () => {
  setTimeout(() => {
    showOrganizationMenu.value = false;
  }, 200);
};

// Обработчик фокуса на поле БИК
const handleBikFocus = () => {
  if (bankSuggestions.value.length > 0) {
    showBankMenu.value = true;
  }
};

// Обработчик потери фокуса на поле БИК
const handleBikBlur = () => {
  setTimeout(() => {
    showBankMenu.value = false;
  }, 200);
};

// Обработчик выбора банка из списка
const onBankSelect = (suggestion: {name: string; bik: string; correspondentAccount?: string; raw: any}) => {
  console.log('🏦 Bank selected:', suggestion);
  
  if (suggestion.raw) {
    fillBankData(suggestion.raw);
  } else {
    // Если нет полных данных, заполняем только то, что есть
    if (suggestion.name) {
      form.value.client_bank_name = suggestion.name;
    }
    if (suggestion.correspondentAccount) {
      form.value.client_bank_correspondent_account = suggestion.correspondentAccount;
    }
    if (suggestion.bik) {
      form.value.client_bank_bik = suggestion.bik;
    }
    showSnackbarMessage('Данные банка успешно заполнены', 'success');
  }
  
  showBankMenu.value = false;
  bankSuggestions.value = [];
};

// Поиск организаций по ИНН/ОГРН с debounce (только для организаций)
const onInnSearch = (value: string | null) => {
  // Поиск работает только для организаций
  if (form.value.client_type !== CLIENT_TYPES.ORGANIZATION) {
    return;
  }
  
  const searchValue = (value || '').toString();
  
  if (innSearchTimeout.value) {
    clearTimeout(innSearchTimeout.value);
    innSearchTimeout.value = null;
  }
  
  if (!searchValue || searchValue.trim() === '') {
    organizationSuggestions.value = [];
    selectedOrganization.value = null;
    return;
  }
  
  const cleanValue = searchValue.trim().replace(/\s+/g, '');
  
  // Для организаций: 10 цифр ИНН или 13 ОГРН
  if (!/^\d{10}$|^\d{13}$/.test(cleanValue)) {
    organizationSuggestions.value = [];
    return;
  }
  
  innSearchTimeout.value = setTimeout(async () => {
    await searchOrganizations(cleanValue);
  }, 500);
};

// Поиск организаций в DaData
const searchOrganizations = async (query: string) => {
  loadingOrganizationData.value = true;
  try {
    const orgData = await dadataService.findOrganizationById(query);
    
    if (orgData) {
      const extractedData = dadataService.extractOrganizationData(orgData);
      
      // Получаем название организации из данных
      let orgName = extractedData.client_name || '';
      if (!orgName && orgData.value) {
        orgName = orgData.value;
      }
      if (!orgName) {
        const data = (orgData as any).data;
        if (data?.name) {
          if (typeof data.name === 'object') {
            orgName = data.name.full_with_opf || data.name.full || data.name.short_with_opf || data.name.short || '';
          } else if (typeof data.name === 'string') {
            orgName = data.name;
          }
        }
      }
      
      const suggestion = {
        name: orgName || 'Организация',
        inn: extractedData.client_inn || query,
        kpp: extractedData.client_kpp,
        raw: orgData,
      };
      
      organizationSuggestions.value = [suggestion];
      
      await nextTick();
      
      if (organizationSuggestions.value.length > 0) {
        showOrganizationMenu.value = true;
      }
    } else {
      organizationSuggestions.value = [];
    }
  } catch (error: any) {
    console.error('Ошибка поиска организации:', error);
    organizationSuggestions.value = [];
    if (!error.message?.includes('API ключ DaData не настроен')) {
      showSnackbarMessage(error.message || 'Ошибка при поиске организации', 'warning');
    }
  } finally {
    loadingOrganizationData.value = false;
  }
};

// Обработчик выбора организации из списка
const onOrganizationSelect = (selected: any) => {
  if (selected && typeof selected === 'object' && selected.raw) {
    const orgData: DaDataOrganization = selected.raw;
    const extractedData = dadataService.extractOrganizationData(orgData);
    
    // Основные данные
    if (extractedData.client_name) {
      form.value.client_name = extractedData.client_name;
    }
    
    if (extractedData.client_inn) {
      form.value.client_inn = extractedData.client_inn;
    }
    
    if (extractedData.client_kpp) {
      form.value.client_kpp = extractedData.client_kpp;
    }
    
    // Адреса
    if (extractedData.client_legal_address) {
      form.value.client_legal_address = extractedData.client_legal_address;
    }
    
    if (extractedData.client_postal_address) {
      form.value.client_postal_address = extractedData.client_postal_address;
    }
    
    // Для обратной совместимости сохраняем в старом поле адреса
    if (extractedData.client_address) {
      form.value.client_address = extractedData.client_address;
    }
    
    // Контакты
    if (extractedData.client_phone) {
      form.value.client_phone = extractedData.client_phone;
    }
    
    if (extractedData.client_email) {
      form.value.client_email = extractedData.client_email;
    }
    
    // Дополнительные реквизиты
    if (extractedData.client_ogrn) {
      form.value.client_ogrn = extractedData.client_ogrn;
    }
    
    if (extractedData.client_okpo) {
      form.value.client_okpo = extractedData.client_okpo;
    }
    
    // Руководство
    if (extractedData.client_director) {
      form.value.client_director = extractedData.client_director;
    }
    
    if (extractedData.client_based_on) {
      form.value.client_based_on = extractedData.client_based_on;
    }
    
    // Сайт
    if (extractedData.client_website) {
      form.value.client_website = extractedData.client_website;
    }
    
    showOrganizationMenu.value = false;
    organizationSuggestions.value = [];
    showSnackbarMessage('Данные организации успешно заполнены', 'success');
  }
};

// Автоматическая генерация номера при выборе нумератора
watch(() => selectedNumeratorId.value, async (newId) => {
  // Генерируем номер только если:
  // 1. Выбран новый нумератор (не при первой загрузке)
  // 2. Поле номера пустое или было очищено
  // 3. Способ нумерации = 'numerator'
  if (
    newId && 
    billingSettings.value?.contract_numbering_method === 'numerator' &&
    (!form.value.number || form.value.number.trim() === '')
  ) {
    // Небольшая задержка для избежания множественных вызовов
    await new Promise(resolve => setTimeout(resolve, 100));
    await generateNumber(true); // skipConfirmation = true для автоматической генерации
  }
});

// Автоматическое обновление end_date при изменении start_date, если тариф уже выбран
watch(() => form.value.start_date, (newStartDate) => {
  // Обновляем end_date только если:
  // 1. start_date установлена
  // 2. Тарифный план выбран
  // 3. end_date еще не установлена вручную (или была установлена автоматически)
  if (newStartDate && form.value.tariff_plan_id) {
    const selectedPlan = tariffPlans.value.find(plan => plan.id === form.value.tariff_plan_id);
    if (selectedPlan) {
      const startDate = new Date(newStartDate + 'T00:00:00');
      const endDate = new Date(startDate);
      
      if (selectedPlan.billing_period === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (selectedPlan.billing_period === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      form.value.end_date = endDate.toISOString().split('T')[0];
    }
  }
});

// Lifecycle
onMounted(async () => {
  // Обработка query параметра account_id - если есть, загружаем только эту учетную запись
  const accountIdParam = route.query.account_id;
  let accountId: number | null = null;
  
  if (accountIdParam) {
    const parsedId = Number(accountIdParam);
    if (!isNaN(parsedId) && parsedId > 0) {
      accountId = parsedId;
    }
  }
  
  // Если есть account_id в query, загружаем только эту учетную запись
  // Иначе загружаем все как обычно
  if (accountId) {
    // Загружаем параллельно все необходимые данные
    await Promise.all([
      loadTariffPlans(),
      loadSingleAccount(accountId),
      loadBillingSettings(),
      loadNumerators(),
    ]);
    
    // Устанавливаем account_id в форму (объекты загрузятся автоматически через watcher)
    // Это произойдет после загрузки учетной записи, так что watcher сработает
    form.value.account_id = accountId;
    console.log('✅ Учетная запись предзаполнена из query параметра, ID:', accountId);
    
    // Объекты загрузятся автоматически через watcher на form.account_id
    // Но можно также загрузить их сразу, чтобы не ждать watcher
    if (accounts.value.length > 0) {
      const account = accounts.value.find(acc => acc.id === accountId);
      if (account) {
        console.log('📋 Начинаем загрузку объектов для учетной записи:', account.name);
        // Загружаем объекты асинхронно, не блокируя UI
        loadAccountObjects(accountId).catch(err => {
          console.error('Ошибка загрузки объектов:', err);
        });
      }
    }
  } else {
    // Обычная загрузка - НЕ загружаем все учетные записи сразу для оптимизации
    // Загрузим их только при фокусе на поле или при поиске
    await Promise.all([
      loadTariffPlans(),
      // loadAccounts() - убрано для оптимизации, загрузится при фокусе на поле
      loadBillingSettings(),
      loadNumerators(),
    ]);
  }
});
</script>

<style scoped>
.create-contract-page {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-icon {
  color: rgb(var(--v-theme-primary));
  font-size: 28px !important;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 2px 0 0 0;
}

.form-card {
  margin-bottom: 16px;
}

.form-content {
  padding: 16px;
}

.form-section {
  margin-bottom: 20px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-primary));
}

.subsection-title {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
}

.inn-field-container {
  position: relative;
}

.inn-field-container :deep(.apple-input-wrapper) {
  padding-right: 40px; /* Место для иконки */
}

.inn-field-container :deep(.apple-input-container) {
  position: relative;
}

.inn-info-icon-wrapper {
  position: absolute;
  right: 12px;
  top: calc(100% - 32px); /* Позиционируем от верха контейнера, учитывая высоту поля */
  pointer-events: auto;
  cursor: help;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.cursor-help {
  cursor: help;
}

.website-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.website-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.website-prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 400;
  z-index: 2;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  margin: 0;
  padding: 0;
  letter-spacing: 0;
  line-height: 1.4;
  white-space: nowrap; /* Предотвращаем перенос */
}

.website-input-container :deep(.apple-input-container) {
  flex: 1;
  position: relative;
}

.website-input-container :deep(.apple-input-wrapper) {
  padding-left: 0 !important;
}

.website-input-container :deep(.apple-input-field) {
  padding-left: 72px !important; /* Увеличен отступ чтобы не перекрываться с "https://" (примерно 70px для "https://" + небольшой зазор) */
  padding-right: 16px !important;
}

.form-actions {
  padding: 0 16px 16px;
}

.actions-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .create-contract-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .form-content {
    padding: 16px;
  }

  .form-section {
    margin-bottom: 24px;
  }
}

.objects-card {
  margin-top: 12px;
}

.objects-card :deep(.v-card-title) {
  padding: 12px 16px;
  font-size: 14px;
}

.objects-card :deep(.v-card-text) {
  padding: 12px 16px;
}

.objects-table-container {
  max-height: 500px;
  overflow-y: auto;
}

.objects-table {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.object-name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Выравнивание полей ввода по нижнему краю */
.form-section :deep(.v-row) {
  align-items: flex-end;
}

/* Добавляем gap между label и полем */
.form-section .v-col > label.apple-input-label + .v-select,
.form-section .v-col > label.apple-input-label + .v-autocomplete,
.form-section .v-col > label.apple-input-label + .v-textarea,
.form-section .v-col > label.apple-input-label + .v-text-field {
  margin-top: 4px;
}

/* Обеспечиваем одинаковую высоту для полей ввода */
.form-section :deep(.apple-input-wrapper-base) {
  height: 48px;
}

.form-section :deep(.v-select .v-field),
.form-section :deep(.v-autocomplete .v-field),
.form-section :deep(.v-textarea .v-field),
.form-section :deep(.v-text-field .v-field) {
  height: 48px;
}

/* Уменьшаем отступы между строками в форме */
.form-section :deep(.v-row) {
  margin-bottom: 0;
}

.form-section :deep(.v-col) {
  padding-bottom: 8px;
}
</style>

