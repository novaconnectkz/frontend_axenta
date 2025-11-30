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

            <!-- Тип договора -->
            <v-row class="mt-2">
              <v-col cols="12" md="4">
                <label class="apple-input-label">Тип договора</label>
                <v-select
                  v-model="form.contract_type"
                  :items="CONTRACT_TYPE_OPTIONS"
                  variant="outlined"
                  density="compact"
                  hide-details
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
                          Типы договоров
                        </div>
                        <div class="text-caption">
                          <strong>Клиентский:</strong> обычный договор с клиентом, используется подписка для тарификации<br><br>
                          <strong>Партнерский:</strong> договор с партнером, все объекты из учетной записи партнера тарифицируются по указанному тарифному плану
                        </div>
                      </div>
                    </v-tooltip>
                  </template>
                </v-select>
              </v-col>

              <!-- Поле для выбора учетной записи партнера (только для партнерских договоров) -->
              <v-col v-if="form.contract_type === CONTRACT_TYPES.PARTNER" cols="12" md="8">
                <label class="apple-input-label">Учетная запись партнера <span class="apple-input-required">*</span></label>
                <v-autocomplete
                  v-model="form.partner_company_id"
                  :items="partnerCompanyOptions"
                  :loading="loadingCompanies"
                  variant="outlined"
                  density="compact"
                  :rules="form.contract_type === CONTRACT_TYPES.PARTNER ? [rules.required] : []"
                  required
                  hide-details="auto"
                  clearable
                  no-data-text="Партнерские компании не найдены"
                  placeholder="Начните вводить название компании..."
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
                          Учетная запись партнера
                        </div>
                        <div class="text-caption">
                          Выберите учетную запись партнера. Все активные объекты из этой учетной записи будут автоматически тарифицироваться по выбранному тарифному плану.
                        </div>
                      </div>
                    </v-tooltip>
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>

            <!-- Тарифный план для партнерского договора -->
            <v-row v-if="form.contract_type === CONTRACT_TYPES.PARTNER" class="mt-2">
              <v-col cols="12" md="6">
                <label class="apple-input-label">Тарифный план <span class="apple-input-required">*</span></label>
                <v-select
                  v-model="form.tariff_plan_id"
                  :items="tariffPlanOptions"
                  :loading="loadingTariffPlans"
                  variant="outlined"
                  density="compact"
                  :rules="form.contract_type === CONTRACT_TYPES.PARTNER ? [rules.required] : []"
                  required
                  hide-details="auto"
                  clearable
                  no-data-text="Тарифные планы не найдены"
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
                          Тарифный план
                        </div>
                        <div class="text-caption">
                          Выберите тарифный план для партнерского договора. Все активные объекты из учетной записи партнера будут тарифицироваться согласно выбранному тарифному плану.
                        </div>
                      </div>
                    </v-tooltip>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <!-- Настройка скидок для партнерского договора -->
            <v-row v-if="form.contract_type === CONTRACT_TYPES.PARTNER" class="mt-2">
              <v-col cols="12">
                <v-card variant="outlined" color="success">
                  <v-card-text class="pa-4">
                    <div class="d-flex align-center mb-3">
                      <v-icon icon="mdi-sale" color="success" class="mr-2" />
                      <div class="text-subtitle-1 font-weight-medium">Настройка скидок</div>
                    </div>

                    <v-row>
                      <v-col cols="12" md="4">
                        <label class="apple-input-label">Тип скидки</label>
                        <v-select
                          v-model="form.discount_type"
                          :items="discountTypeOptions"
                          variant="outlined"
                          density="compact"
                          hide-details
                        >
                          <template #append-inner>
                            <v-tooltip location="top" :open-on-hover="true">
                              <template #activator="{ props }">
                                <v-icon
                                  v-bind="props"
                                  icon="mdi-information-outline"
                                  color="success"
                                  size="20"
                                  class="cursor-help"
                                  style="margin-right: 8px;"
                                />
                              </template>
                              <div style="max-width: 400px; padding: 4px;">
                                <div class="text-body-2 font-weight-medium mb-2">Типы скидок</div>
                                <div class="text-caption">
                                  <strong>Без скидки:</strong> полная стоимость без применения скидок<br><br>
                                  <strong>Ручная скидка:</strong> устанавливается вручную (от 0 до 100%)<br><br>
                                  <strong>Автоматическая скидка:</strong> рассчитывается на основе количества активных объектов:<br>
                                  • ≥1000 объектов → 10%<br>
                                  • ≥2000 объектов → 20%<br>
                                  • ≥4000 объектов → 30%
                                </div>
                              </div>
                            </v-tooltip>
                          </template>
                        </v-select>
                      </v-col>

                      <v-col v-if="form.discount_type === 'manual'" cols="12" md="4">
                        <AppleInput
                          v-model.number="form.manual_discount_percent"
                          label="Процент скидки"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          suffix="%"
                        >
                          <template #append-inner>
                            <div class="text-caption text-grey mr-2">0-100%</div>
                          </template>
                        </AppleInput>
                      </v-col>

                      <v-col v-if="form.discount_type === 'auto'" cols="12" md="8">
                        <v-alert variant="tonal" color="success" density="compact">
                          <div class="text-caption">
                            <v-icon icon="mdi-information" size="small" class="mr-1" />
                            Скидка будет автоматически рассчитываться при создании снимков на основе количества активных объектов
                          </div>
                        </v-alert>
                      </v-col>
                    </v-row>
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
              <v-col cols="12" md="2">
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
              
              <v-col cols="12" :md="form.client_type === CLIENT_TYPES.ORGANIZATION ? 5 : 10">
                <AppleInput
                  v-model="form.client_name"
                  :label="form.client_type === CLIENT_TYPES.PHYSICAL_PERSON ? 'ФИО клиента' : 'Полное наименование клиента'"
                  :rules="[rules.required]"
                  required
                />
              </v-col>
              
              <!-- Сокращенное название для организаций -->
              <v-col v-if="form.client_type === CLIENT_TYPES.ORGANIZATION" cols="12" md="5">
                <AppleInput
                  v-model="form.client_short_name"
                  label="Сокращенное название с ОПФ"
                  hint="Автоматически заполняется при выборе организации по ИНН"
                />
              </v-col>
            </v-row>
            
            <!-- Реквизиты для организаций -->
            <template v-if="form.client_type === CLIENT_TYPES.ORGANIZATION">
              <v-row>
                <v-col cols="12" md="4">
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
                            <li>ИНН, КПП, ОГРН</li>
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
                
                <v-col cols="12" md="4">
                  <AppleInput
                    v-model="form.client_kpp"
                    label="КПП"
                  />
                </v-col>
                
                <v-col cols="12" md="4">
                  <AppleInput
                    v-model="form.client_ogrn"
                    label="ОГРН"
                    :rules="[rules.ogrn]"
                    :maxlength="13"
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
                  <AppleInput
                    v-model="form.client_based_on"
                    label="Действует на основании"
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
              
              <!-- Для организаций порядок: БИК, Расчётный счёт, Корреспондентский счёт, Банк -->
              <template v-if="form.client_type === CLIENT_TYPES.ORGANIZATION">
                <v-row>
                  <v-col cols="12" md="2">
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
                  
                  <v-col cols="12" md="3">
                    <AppleInput
                      v-model="form.client_bank_account"
                      label="Расчётный счёт"
                      :maxlength="20"
                    />
                  </v-col>
                  
                  <v-col cols="12" md="3">
                    <AppleInput
                      v-model="form.client_bank_correspondent_account"
                      label="Корреспондентский счёт"
                      :maxlength="20"
                    />
                  </v-col>
                
                  <v-col cols="12" md="4">
                    <AppleInput
                      v-model="form.client_bank_name"
                      label="Банк"
                    />
                  </v-col>
                </v-row>
              </template>
              
              <!-- Для физических лиц и ИП порядок: Банк, БИК, Корреспондентский счёт, Расчётный счёт, Получатель -->
              <template v-else>
                <v-row>
                  <v-col cols="12" md="6">
                    <AppleInput
                      v-model="form.client_bank_name"
                      label="Наименование банка"
                    />
                  </v-col>
                  
                  <v-col cols="12" md="2">
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
                </v-row>
                
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
                      v-model="form.client_bank_recipient"
                      label="Получатель"
                    />
                  </v-col>
                </v-row>
              </template>
            </template>
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

    <!-- Диалог автопилота: предложение создать подписку (только в режиме автопилота) -->
    <AutopilotSubscriptionOfferDialog
      v-if="isAutopilotMode"
      v-model="showSubscriptionOffer"
      :contract-id="autopilotContract?.id"
      :contract-number="autopilotContract?.number"
      @create-subscription="handleCreateSubscription"
      @later="handleSubscriptionLater"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { 
  ContractForm,
} from '@/types/contracts';
import type { DaDataOrganization } from '@/services/dadataService';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  CLIENT_TYPES,
  type ClientType,
  type ContractType,
} from '@/types/contracts';
import type { BillingPlan, BillingSettings } from '@/types/billing';
import type { ContractNumerator } from '@/types/contracts';
import type { Account } from '@/services/accountsService';
import contractsService from '@/services/contractsService';
import accountsService from '@/services/accountsService';
import billingService from '@/services/billingService';
import dadataService from '@/services/dadataService';
import companiesService from '@/services/companiesService';
import { getObjectsService } from '@/services/objectsService';
import { AppleButton, AppleInput, AppleCard } from '@/components/Apple';
import { useAutopilot } from '@/composables/useAutopilot';
import AutopilotSubscriptionOfferDialog from '@/components/Billing/AutopilotSubscriptionOfferDialog.vue';

const router = useRouter();
const route = useRoute();

// Автопилот (используется только если autopilot=true в query)
const autopilot = useAutopilot();
const { 
  showSubscriptionOffer, 
  currentContract: autopilotContract 
} = autopilot;

// Проверяем, запущен ли автопилот через кнопку
const isAutopilotMode = computed(() => route.query.autopilot === 'true');

// Reactive data
const formRef = ref();
const formValid = ref(false);
const saving = ref(false);
// Удалено: учетные записи и объекты - перенесены в подписки
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

// Партнерские компании
const partnerCompanies = ref<Array<{id: number; name: string}>>([]);
const loadingCompanies = ref(false);

// Тарифные планы
const tariffPlans = ref<BillingPlan[]>([]);
const loadingTariffPlans = ref(false);

// Удалено: таблица объектов - перенесена в подписки

// Snackbar
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Form data
const defaultForm: ContractForm = {
  number: '',
  title: '',
  description: '',
  contract_type: CONTRACT_TYPES.CLIENT, // По умолчанию клиентский договор
  partner_company_id: undefined,
  client_type: CLIENT_TYPES.ORGANIZATION,
  client_name: '',
  client_short_name: '',
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
  start_date: undefined, // Будет установлено через подписку
  end_date: undefined, // Будет установлено через подписку
  total_amount: '',
  currency: 'RUB',
  status: 'draft', // По умолчанию черновик, после привязки подписки станет "active"
  is_active: true,
  notify_before: 30,
  notes: '',
  external_id: '',
  // Скидки (для партнерских договоров)
  discount_type: 'none',
  manual_discount_percent: 0,
  use_auto_discount: false,
};

const form = ref<ContractForm>({ ...defaultForm });

// Options
const statusOptions = Object.entries(CONTRACT_STATUS_LABELS).map(([value, title]) => ({
  value,
  title,
}));

// Удалено: currencyOptions - не используется

// Удалено: notificationOptions - не используется
// Удалено: accountOptions, findAccountById, selectedAccount - перенесены в подписки


const numeratorOptions = computed(() => {
  return numerators.value.map(numerator => ({
    value: numerator.id,
    title: numerator.name,
    subtitle: `${numerator.template} (Счетчик: ${numerator.counter_value})`,
    raw: numerator,
  }));
});

// Опции партнерских компаний
const partnerCompanyOptions = computed(() => {
  return partnerCompanies.value.map(company => ({
    value: company.id,
    title: company.name,
  }));
});

// Опции тарифных планов
const tariffPlanOptions = computed(() => {
  return tariffPlans.value.map(plan => ({
    value: plan.id,
    title: `${plan.name} - ${plan.price} ₽/${plan.billing_period === 'monthly' ? 'мес' : plan.billing_period === 'yearly' ? 'год' : plan.billing_period === 'daily' ? 'день' : plan.billing_period}`,
  }));
});

// Опции типов скидок
const discountTypeOptions = [
  { value: 'none', title: 'Без скидки' },
  { value: 'manual', title: 'Ручная скидка' },
  { value: 'auto', title: 'Автоматическая скидка' },
];

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


const saveContract = async () => {
  if (!formRef.value || !formValid.value) return;

  saving.value = true;
  try {
    // Подготавливаем данные для отправки - отправляем все поля формы
    const contractData: any = {
      number: form.value.number,
      title: form.value.title || `Договор с ${form.value.client_name}`,
      description: form.value.description || '',
      contract_type: form.value.contract_type || 'client',
      partner_company_id: form.value.partner_company_id || undefined,
      client_type: form.value.client_type,
      client_name: form.value.client_name,
      client_short_name: form.value.client_short_name || '',
      client_inn: form.value.client_inn || '',
      client_kpp: form.value.client_kpp || '',
      client_email: form.value.client_email || '',
      client_phone: form.value.client_phone || '',
      client_address: form.value.client_address || '',
      client_legal_address: form.value.client_legal_address || '',
      client_postal_address: form.value.client_postal_address || '',
      client_ogrn: form.value.client_ogrn || '',
      client_okpo: form.value.client_okpo || '',
      client_director: form.value.client_director || '',
      client_based_on: form.value.client_based_on || '',
      client_passport_series: form.value.client_passport_series || '',
      client_passport_number: form.value.client_passport_number || '',
      client_passport_issued_by: form.value.client_passport_issued_by || '',
      client_passport_issue_date: form.value.client_passport_issue_date || '',
      client_passport_department_code: form.value.client_passport_department_code || '',
      client_registration_address: form.value.client_registration_address || '',
      client_actual_address: form.value.client_actual_address || '',
      client_snils: form.value.client_snils || '',
      client_ogrnip: form.value.client_ogrnip || '',
      client_website: form.value.client_website || '',
      client_bank_name: form.value.client_bank_name || '',
      client_bank_bik: form.value.client_bank_bik || '',
      client_bank_correspondent_account: form.value.client_bank_correspondent_account || '',
      client_bank_account: form.value.client_bank_account || '',
      client_bank_recipient: form.value.client_bank_recipient || '',
      status: form.value.status || 'draft',
      notes: form.value.notes || '',
    };
    
    // Для партнерских договоров добавляем tariff_plan_id
    if (form.value.contract_type === 'partner' && form.value.tariff_plan_id) {
      contractData.tariff_plan_id = form.value.tariff_plan_id;
    }
    
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
    
    // start_date и end_date будут установлены через подписку
    // Отправляем только если они явно указаны в форме
    if (form.value.start_date) {
      // Если дата в формате YYYY-MM-DD, конвертируем в ISO
      const startDate = new Date(form.value.start_date + 'T00:00:00Z');
      contractData.start_date = startDate.toISOString();
    }
    // Если start_date не указан, оставляем пустым - будет установлен через подписку
    
    if (form.value.end_date) {
      // Если дата в формате YYYY-MM-DD, конвертируем в ISO
      const endDate = new Date(form.value.end_date + 'T23:59:59Z');
      contractData.end_date = endDate.toISOString();
    }
    // Если end_date не указан, оставляем пустым - будет установлен через подписку
    
    console.log('📤 Отправка данных договора:', JSON.stringify(contractData, null, 2));
    
    // Создаем договор
    const createdContract = await contractsService.createContract(contractData);
    
    showSnackbarMessage('Договор успешно создан', 'success');

    // Проверяем, запущен ли автопилот через кнопку "Запустить автопилот"
    if (isAutopilotMode.value) {
      console.log('🤖 Режим автопилота активен - показываем диалог создания подписки');
      // Показываем диалог автопилота
      autopilot.offerSubscriptionAfterContract({
        id: createdContract.id,
        number: createdContract.number,
        title: createdContract.title,
        client_name: createdContract.client_name,
      } as any);
    } else {
      // Обычный режим - просто перенаправляем на страницу биллинга
      console.log('📋 Обычный режим создания договора - редирект на /billing');
      setTimeout(() => {
        router.push('/billing');
      }, 1500);
    }
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

// Обработчики автопилота (используются только в режиме autopilot=true)
const handleCreateSubscription = (contractId: number) => {
  console.log('🚀 Автопилот: переход к созданию подписки для договора', contractId);
  // Сохраняем contract_id в sessionStorage для предзаполнения мастера
  sessionStorage.setItem('autopilot_contract_id', contractId.toString());
  sessionStorage.setItem('autopilot_open_wizard', 'true');
  
  // Переходим на страницу биллинга
  router.push({
    path: '/billing',
    query: {
      tab: 'subscriptions'
    }
  });
};

const handleSubscriptionLater = () => {
  console.log('⏭️ Автопилот: пропуск создания подписки');
  // Переходим на страницу биллинга
  router.push('/billing');
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
    
    console.log('📋 Загружено нумераторов:', numerators.value.length);
    console.log('📝 Список нумераторов:', numerators.value);
    console.log('⚙️ Настройки биллинга:', {
      method: billingSettings.value?.contract_numbering_method,
      defaultNumeratorId: billingSettings.value?.contract_default_numerator_id
    });
    
    // Auto-select default numerator if exists and numbering method is 'numerator'
    // Генерация номера будет выполнена через watch после загрузки всех данных
    if (billingSettings.value?.contract_numbering_method === 'numerator') {
      // Приоритет 1: используем contract_default_numerator_id из настроек
      if (billingSettings.value.contract_default_numerator_id) {
        const numeratorFromSettings = numerators.value.find(
          n => n.id === billingSettings.value.contract_default_numerator_id
        );
        if (numeratorFromSettings) {
          selectedNumeratorId.value = numeratorFromSettings.id;
          console.log('🎯 Нумератор выбран из настроек:', numeratorFromSettings.name, 'ID:', numeratorFromSettings.id);
          return; // Выходим, если нашли нумератор из настроек
        } else {
          console.warn('⚠️ Нумератор ID', billingSettings.value.contract_default_numerator_id, 'из настроек не найден в списке');
        }
      }
      
      // Приоритет 2: fallback на нумератор с флагом is_default
      const defaultNumerator = numerators.value.find(n => n.is_default);
      if (defaultNumerator) {
        selectedNumeratorId.value = defaultNumerator.id;
        console.log('🎯 Нумератор выбран по флагу is_default:', defaultNumerator.name, 'ID:', defaultNumerator.id);
      } else {
        console.warn('⚠️ Не найден нумератор с is_default = true');
      }
    } else {
      console.log('ℹ️ Метод нумерации не "numerator", автовыбор пропущен');
    }
  } catch (error) {
    console.error('Error loading numerators:', error);
  } finally {
    loadingNumerators.value = false;
  }
};

// Load partner companies
const loadCompanies = async () => {
  loadingCompanies.value = true;
  try {
    // Фильтруем только партнерские компании
    const response = await companiesService.getCompanies({ type: 'partner' });
    if (response.companies && Array.isArray(response.companies)) {
      partnerCompanies.value = response.companies.map((company: any) => ({
        id: company.id,
        name: company.name,
      }));
      console.log('🏢 Загружено партнерских компаний:', partnerCompanies.value.length);
    }
  } catch (error) {
    console.error('Error loading companies:', error);
    showSnackbarMessage('Ошибка загрузки партнерских компаний', 'error');
  } finally {
    loadingCompanies.value = false;
  }
};

// Load tariff plans
const loadTariffPlans = async () => {
  loadingTariffPlans.value = true;
  try {
    const response = await billingService.getBillingPlans();
    if (response && Array.isArray(response)) {
      tariffPlans.value = response;
      console.log('💰 Загружено тарифных планов:', tariffPlans.value.length);
    }
  } catch (error) {
    console.error('Error loading tariff plans:', error);
    showSnackbarMessage('Ошибка загрузки тарифных планов', 'error');
  } finally {
    loadingTariffPlans.value = false;
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
// Удалено: все функции работы с учетными записями и объектами - перенесены в подписки


const formatCurrency = (amount: number, currency = 'RUB'): string => {
  return contractsService.formatCurrency(amount, currency);
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

// Удалено: watcher для account_id - перенесен в подписки

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
    
    if (extractedData.client_short_name) {
      form.value.client_short_name = extractedData.client_short_name;
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


// Lifecycle
onMounted(async () => {
  // Сначала загружаем настройки биллинга, ПОТОМ нумераторы
  // Это важно, т.к. loadNumerators использует billingSettings для выбора дефолтного нумератора
  await Promise.all([
    loadBillingSettings(),
    loadCompanies(), // Загружаем список компаний для партнерских договоров
    loadTariffPlans(), // Загружаем тарифные планы для партнерских договоров
  ]);
  await loadNumerators(); // Загружаем после настроек биллинга
});

// Перезагружаем настройки при возвращении на страницу
onActivated(async () => {
  // Перезагружаем настройки биллинга на случай, если они изменились
  await loadBillingSettings();
  await loadNumerators();
});

onUnmounted(() => {
  // Сбрасываем состояние автопилота при уходе со страницы (если был в режиме автопилота)
  if (isAutopilotMode.value) {
    autopilot.resetAutopilot();
  }
});
</script>

<style scoped>
.create-contract-page {
  padding: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-icon {
  color: rgb(var(--v-theme-primary));
  font-size: 24px !important;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.page-subtitle {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 1px 0 0 0;
}

.form-card {
  margin-bottom: 12px;
}

.form-content {
  padding: 12px;
}

.form-section {
  margin-bottom: 16px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-primary));
}

.subsection-title {
  font-size: 13px;
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
  gap: 4px;
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
  font-size: 14px;
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
  padding: 0 12px 12px;
}

.actions-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .create-contract-page {
    padding: 8px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .form-content {
    padding: 8px;
  }

  .form-section {
    margin-bottom: 12px;
  }
}

.objects-card {
  margin-top: 8px;
}

.objects-card :deep(.v-card-title) {
  padding: 8px 12px;
  font-size: 13px;
}

.objects-card :deep(.v-card-text) {
  padding: 8px 12px;
}

.objects-table-container {
  max-height: 500px;
  overflow-y: auto;
}

.contract-period-input :deep(input::placeholder) {
  font-size: 0.75rem;
  opacity: 0.6;
}

.objects-table {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.object-name-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
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
  margin-top: 3px;
}

/* Обеспечиваем одинаковую высоту для полей ввода */
.form-section :deep(.apple-input-wrapper-base) {
  height: 40px;
}

.form-section :deep(.v-select .v-field),
.form-section :deep(.v-autocomplete .v-field),
.form-section :deep(.v-textarea .v-field),
.form-section :deep(.v-text-field .v-field) {
  height: 40px;
}

/* Уменьшаем отступы между строками в форме */
.form-section :deep(.v-row) {
  margin-bottom: 0;
}

.form-section :deep(.v-col) {
  padding-bottom: 6px;
}
</style>

