<template>
  <div class="edit-contract-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-pencil" class="page-icon" />
        <div>
          <h1 class="page-title">Редактирование договора</h1>
          <p class="page-subtitle">Редактирование информации о договоре</p>
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

    <!-- Индикатор загрузки -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Форма редактирования договора -->
    <AppleCard v-if="!loading && contractLoaded" class="form-card" variant="outlined">
      <v-form ref="formRef" v-model="formValid" @submit.prevent="saveContract">
        <div class="form-content">
          <!-- Основная информация -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-file-document" class="mr-2" />
              Основная информация
            </h3>
            
            <v-row>
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="form.number"
                  label="Номер договора"
                  :rules="[rules.required]"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="6">
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

            <!-- Обслуживающий менеджер — назначает только admin/superadmin -->
            <v-row v-if="canAssignManager" class="mt-2">
              <v-col cols="12" md="6">
                <label class="apple-input-label">Менеджер</label>
                <v-select
                  v-model="form.manager_id"
                  :items="managers"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  prepend-inner-icon="mdi-account-tie"
                  placeholder="Не назначен"
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
                                  <strong>Процент (%):</strong> устанавливается вручную (от 0 до 100%)<br><br>
                                  <strong>Фиксированная (₽):</strong> фиксированная сумма скидки в рублях за день<br><br>
                                  <strong>Автоматическая:</strong> рассчитывается на основе количества активных объектов:<br>
                                  • ≥1000 объектов → 10%<br>
                                  • ≥2000 объектов → 20%<br>
                                  • ≥4000 объектов → 30%
                                </div>
                              </div>
                            </v-tooltip>
                          </template>
                        </v-select>
                      </v-col>

                      <!-- Процентная скидка -->
                      <v-col v-if="form.discount_type === 'manual_percent'" cols="12" md="4">
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

                      <!-- Фиксированная скидка -->
                      <v-col v-if="form.discount_type === 'manual_fixed'" cols="12" md="4">
                        <AppleInput
                          v-model.number="form.manual_discount_fixed"
                          label="Фиксированная скидка"
                          type="number"
                          min="0"
                          step="0.01"
                          suffix="₽"
                        >
                          <template #append-inner>
                            <div class="text-caption text-grey mr-2">в рублях</div>
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
                />
              </v-col>
            </v-row>

            <!-- Ф4b-followon: привязка к контрагенту (единый лицевой счёт) -->
            <v-row v-if="form.contract_type === CONTRACT_TYPES.CLIENT">
              <v-col cols="12" md="6">
                <CounterpartySelector v-model="form.counterparty_id" />
              </v-col>
            </v-row>
            
            <!-- Реквизиты для организаций -->
            <template v-if="form.client_type === CLIENT_TYPES.ORGANIZATION">
              <v-row>
                <v-col cols="12" md="4">
                  <AppleInput
                    v-model="form.client_inn"
                    label="ИНН"
                    :rules="[rules.inn]"
                  />
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
                  <AppleInput
                    v-model="form.client_inn"
                    label="ИНН"
                    :rules="[rules.inn]"
                    hint="12 цифр"
                    persistent-hint
                  />
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
            <template v-if="form.client_type">
              <h4 class="subsection-title mt-3 mb-2">
                <v-icon icon="mdi-bank" size="small" class="mr-2" />
                Банковские реквизиты
              </h4>
              
              <!-- Для организаций -->
              <template v-if="form.client_type === CLIENT_TYPES.ORGANIZATION">
                <v-row>
                  <v-col cols="12" md="2">
                    <AppleInput
                      v-model="form.client_bank_bik"
                      label="БИК"
                      :maxlength="9"
                    />
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
              
              <!-- Для физических лиц и ИП -->
              <template v-else>
                <v-row>
                  <v-col cols="12" md="6">
                    <AppleInput
                      v-model="form.client_bank_name"
                      label="Наименование банка"
                    />
                  </v-col>
                  
                  <v-col cols="12" md="2">
                    <AppleInput
                      v-model="form.client_bank_bik"
                      label="БИК"
                      :maxlength="9"
                    />
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
              Сохранить изменения
            </AppleButton>
          </div>
        </div>
      </v-form>
    </AppleCard>

    <!-- Сообщение об ошибке -->
    <AppleCard v-if="!loading && !contractLoaded" variant="outlined" class="error-card">
      <v-card-text class="text-center pa-6">
        <v-icon icon="mdi-alert-circle" size="48" color="error" class="mb-3" />
        <h3 class="mb-2">Договор не найден</h3>
        <p class="text-grey mb-4">
          Не удалось загрузить данные договора
        </p>
        <AppleButton @click="goBack">
          Вернуться к списку
        </AppleButton>
      </v-card-text>
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
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { ContractForm, ContractWithRelations, ClientType } from '@/types/contracts';
import type { BillingPlan } from '@/types/billing';
import { 
  CONTRACT_STATUS_LABELS, 
  CLIENT_TYPE_OPTIONS,
  CLIENT_TYPES,
  CONTRACT_TYPES,
  CONTRACT_TYPE_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
  DISCOUNT_TYPES,
} from '@/types/contracts';
import contractsService from '@/services/contractsService';
import accountsService from '@/services/accountsService';
import billingService from '@/services/billingService';
import { AppleButton, AppleInput, AppleCard } from '@/components/Apple';
import CounterpartySelector from '@/components/Contracts/CounterpartySelector.vue';
import { canManageBilling } from '@/utils/billingRole';

const router = useRouter();
const route = useRoute();

// Reactive data
const formRef = ref();
const formValid = ref(false);
const loading = ref(false);
const saving = ref(false);
const contractLoaded = ref(false);
const contractId = ref<number | null>(null);
const passportExpanded = ref<number | null>(0);

// Snackbar
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Form data
const defaultForm: ContractForm = {
  number: '',
  title: '',
  description: '',
  contract_type: CONTRACT_TYPES.CLIENT,
  partner_company_id: undefined,
  client_type: CLIENT_TYPES.ORGANIZATION,
  counterparty_id: null,
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
  client_bank_name: '',
  client_bank_bik: '',
  client_bank_correspondent_account: '',
  client_bank_account: '',
  client_bank_recipient: '',
  tariff_plan_id: undefined,
  discount_type: 'none',
  manual_discount_percent: 0,
  manual_discount_fixed: 0,
  total_amount: '',
  currency: 'RUB',
  status: 'draft',
  is_active: true,
  account_id: undefined,
  manager_id: null,
};

const form = ref<ContractForm>({ ...defaultForm });

// Options
const statusOptions = Object.entries(CONTRACT_STATUS_LABELS).map(([value, title]) => ({
  value,
  title,
}));

// Партнерские компании и тарифные планы
const partnerCompanies = ref<any[]>([]);
const loadingCompanies = ref(false);
const tariffPlans = ref<BillingPlan[]>([]);
const loadingTariffPlans = ref(false);

// Опции для партнерских компаний
const partnerCompanyOptions = computed(() => {
  return partnerCompanies.value.map(company => ({
    value: company.id,
    title: `${company.name} (ID: ${company.id})`,
  }));
});

// Опции тарифных планов
const tariffPlanOptions = computed(() => {
  return tariffPlans.value.map(plan => ({
    value: plan.id,
    title: `${plan.name} - ${plan.price} ₽/${plan.billing_period === 'monthly' ? 'мес' : plan.billing_period === 'yearly' ? 'год' : plan.billing_period === 'daily' ? 'день' : plan.billing_period}`,
  }));
});

// Опции для типов скидок
const discountTypeOptions = DISCOUNT_TYPE_OPTIONS.map(option => ({
  value: option.value,
  title: option.title,
}));

// Computed для поля сайта
const websiteValue = computed({
  get: () => {
    const value = form.value.client_website || '';
    return value.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  },
  set: (val: string) => {
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

// Функция для форматирования телефона в формат E.164
const formatToE164 = (value: string): string => {
  if (!value) return '';
  
  let cleaned = value.replace(/[^\d+]/g, '');
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('8') && cleaned.length > 1) {
      cleaned = '+7' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') && cleaned.length > 1) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length > 0) {
      cleaned = '+7' + cleaned;
    } else {
      cleaned = '+';
    }
  }
  
  const digitsAfterPlus = cleaned.replace(/^\+/, '').replace(/\D/g, '');
  if (digitsAfterPlus.length > 15) {
    cleaned = '+' + digitsAfterPlus.substring(0, 15);
  }
  
  return cleaned;
};

// Функция для форматирования E.164 в читаемый формат
const formatPhoneDisplay = (e164Value: string): string => {
  if (!e164Value) return '';
  
  let cleaned = e164Value.replace(/[^\d+]/g, '');
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('8') && cleaned.length > 1) {
      cleaned = '+7' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') && cleaned.length > 1) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length > 0) {
      cleaned = '+7' + cleaned;
    }
  }
  
  if (cleaned.startsWith('+7') && cleaned.length >= 3) {
    const digits = cleaned.substring(2);
    
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
  
  return cleaned;
};

// Computed для отображения телефона
const phoneDisplayValue = computed({
  get: () => {
    return formatPhoneDisplay(form.value.client_phone || '');
  },
  set: (val: string) => {
    form.value.client_phone = formatToE164(val);
  }
});

const handlePhoneUpdate = (value: string) => {
  form.value.client_phone = formatToE164(value);
};

// Computed для поля email
const emailValue = computed({
  get: () => {
    return form.value.client_email || '';
  },
  set: (val: string) => {
    const filtered = val.replace(/[^a-zA-Z0-9@._-]/g, '');
    form.value.client_email = filtered;
  }
});

const handleEmailUpdate = (value: string) => {
  const filtered = value.replace(/[^a-zA-Z0-9@._-]/g, '');
  form.value.client_email = filtered;
};

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
  email: (value: string) => {
    if (!value) return true;
    if (!value.includes('@')) {
      return 'Email должен содержать символ @';
    }
    const latinPattern = /^[a-zA-Z0-9@._-]+$/;
    if (!latinPattern.test(value)) {
      return 'Email должен содержать только латинские буквы, цифры и символы @._-';
    }
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(value) || 'Неверный формат email';
  },
  phone: (value: string) => {
    if (!value) return true;
    const pattern = /^\+[1-9]\d{1,14}$/;
    return pattern.test(value) || 'Телефон должен быть в формате E.164 (например: +79161234567)';
  },
  inn: (value: string) => {
    if (!value) return true;
    const clientType = form.value.client_type;
    if (clientType === CLIENT_TYPES.ORGANIZATION) {
      const pattern = /^[0-9]{10}$|^[0-9]{13}$/;
      return pattern.test(value) || 'ИНН должен содержать 10 цифр, ОГРН - 13 цифр';
    } else if (clientType === CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR) {
      const pattern = /^[0-9]{12}$|^[0-9]{13}$/;
      return pattern.test(value) || 'ИНН должен содержать 12 цифр, ОГРНИП - 13 цифр';
    }
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
};

// Methods
const goBack = () => {
  router.push('/billing');
};

const onClientTypeChange = (clientType: ClientType) => {
  if (clientType === CLIENT_TYPES.PHYSICAL_PERSON) {
    form.value.client_kpp = '';
    form.value.client_address = '';
    passportExpanded.value = 0;
  } else if (clientType === CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR) {
    form.value.client_kpp = '';
    form.value.client_actual_address = '';
    form.value.client_snils = '';
    passportExpanded.value = null;
  } else if (clientType === CLIENT_TYPES.ORGANIZATION) {
    form.value.client_passport_series = '';
    form.value.client_passport_number = '';
    form.value.client_passport_issued_by = '';
    form.value.client_passport_issue_date = '';
    form.value.client_passport_department_code = '';
    form.value.client_registration_address = '';
    form.value.client_actual_address = '';
    form.value.client_snils = '';
    form.value.client_ogrnip = '';
    if (!form.value.client_legal_address) {
      form.value.client_address = '';
    }
  }
};

// Загрузка партнерских компаний
const loadPartnerCompanies = async () => {
  loadingCompanies.value = true;
  try {
    const response = await accountsService.getAccounts();
    
    // Фильтруем только партнерские компании (где account_type === 'partner' или hierarchy содержит партнерские признаки)
    const partnerAccounts = response.results.filter((account: any) => 
      account.type === 'partner' || account.hierarchy?.includes('Партнер')
    );
    
    partnerCompanies.value = partnerAccounts;
    console.log('🏢 Загружено партнерских компаний:', partnerCompanies.value.length);
  } catch (error: any) {
    console.error('Ошибка загрузки партнерских компаний:', error);
    showSnackbarMessage('Ошибка загрузки партнерских компаний', 'error');
    partnerCompanies.value = [];
  } finally {
    loadingCompanies.value = false;
  }
};

// Загрузка тарифных планов
const loadTariffPlans = async () => {
  loadingTariffPlans.value = true;
  try {
    const response = await billingService.getBillingPlans();
    
    if (response && Array.isArray(response)) {
      tariffPlans.value = response;
      console.log('💰 Загружено тарифных планов:', tariffPlans.value.length);
    }
  } catch (error: any) {
    console.error('Ошибка загрузки тарифных планов:', error);
    showSnackbarMessage('Ошибка загрузки тарифных планов', 'error');
    tariffPlans.value = [];
  } finally {
    loadingTariffPlans.value = false;
  }
};

const loadContract = async () => {
  const id = route.params.id;
  if (!id) {
    showSnackbarMessage('ID договора не указан', 'error');
    contractLoaded.value = false;
    return;
  }

  contractId.value = parseInt(id as string);
  if (isNaN(contractId.value)) {
    showSnackbarMessage('Некорректный ID договора', 'error');
    contractLoaded.value = false;
    return;
  }

  loading.value = true;
  try {
    const contract: ContractWithRelations = await contractsService.getContract(contractId.value);
    
    console.log('📋 Полученные данные договора из API:', contract);
    console.log('📋 Доступные поля:', Object.keys(contract));
    
    // Заполняем форму всеми данными договора
    form.value = {
      number: contract.number,
      title: contract.title,
      description: contract.description || '',
      contract_type: contract.contract_type || CONTRACT_TYPES.CLIENT,
      partner_company_id: contract.partner_company_id || undefined,
      client_type: (contract.client_type as ClientType) || CLIENT_TYPES.ORGANIZATION,
      counterparty_id: contract.counterparty_id || null,
      client_name: contract.client_name,
      client_short_name: contract.client_short_name || '',
      client_inn: contract.client_inn || '',
      client_kpp: contract.client_kpp || '',
      client_email: contract.client_email || '',
      client_phone: contract.client_phone || '',
      client_address: contract.client_address || '',
      client_legal_address: contract.client_legal_address || '',
      client_postal_address: contract.client_postal_address || '',
      client_ogrn: contract.client_ogrn || '',
      client_okpo: contract.client_okpo || '',
      client_director: contract.client_director || '',
      client_based_on: contract.client_based_on || '',
      client_passport_series: contract.client_passport_series || '',
      client_passport_number: contract.client_passport_number || '',
      client_passport_issued_by: contract.client_passport_issued_by || '',
      client_passport_issue_date: contract.client_passport_issue_date || '',
      client_passport_department_code: contract.client_passport_department_code || '',
      client_registration_address: contract.client_registration_address || '',
      client_actual_address: contract.client_actual_address || '',
      client_snils: contract.client_snils || '',
      client_ogrnip: contract.client_ogrnip || '',
      client_website: contract.client_website || '',
      client_bank_name: contract.client_bank_name || '',
      client_bank_bik: contract.client_bank_bik || '',
      client_bank_correspondent_account: contract.client_bank_correspondent_account || '',
      client_bank_account: contract.client_bank_account || '',
      client_bank_recipient: contract.client_bank_recipient || '',
      tariff_plan_id: contract.tariff_plan_id || undefined,
      discount_type: contract.discount_type || 'none',
      manual_discount_percent: contract.manual_discount_percent || 0,
      manual_discount_fixed: contract.manual_discount_fixed || 0,
      total_amount: contract.total_amount || '',
      currency: contract.currency || 'RUB',
      status: contract.status,
      is_active: contract.is_active !== undefined ? contract.is_active : true,
      account_id: undefined,
      manager_id: contract.manager_id ?? null,
    };

    contractLoaded.value = true;
  } catch (error: any) {
    console.error('Error loading contract:', error);
    showSnackbarMessage(error.message || 'Ошибка загрузки договора', 'error');
    contractLoaded.value = false;
  } finally {
    loading.value = false;
  }
};

const saveContract = async () => {
  if (!formRef.value || !formValid.value || !contractId.value) return;

  saving.value = true;
  try {
    // Подготавливаем данные для отправки
    const contractData: any = {
      number: form.value.number,
      title: form.value.title || `Договор с ${form.value.client_name}`,
      description: form.value.description || '',
      contract_type: form.value.contract_type,
      partner_company_id: form.value.partner_company_id || null,
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
      tariff_plan_id: form.value.tariff_plan_id || null,
      discount_type: form.value.discount_type || 'none',
      manual_discount_percent: form.value.manual_discount_percent || 0,
      manual_discount_fixed: form.value.manual_discount_fixed || 0,
      status: form.value.status || 'draft',
    };

    // Менеджера шлём только если можем назначать (BE игнорирует для не-admin) —
    // иначе не-admin не должен слать null и обнулять чужое назначение.
    if (canAssignManager.value) {
      contractData.manager_id = form.value.manager_id ?? null;
    }

    // Ф4b-followon: явная привязка/смена контрагента (клиентский договор).
    // Шлём только при выбранном значении: BE Updates(struct) сохраняет ненулевой
    // counterparty_id. Очистка поля контрагент не отвязывает (cp=0 пропускается GORM).
    if (form.value.contract_type === 'client' && form.value.counterparty_id) {
      contractData.counterparty_id = form.value.counterparty_id;
    }
    
    console.log('📤 Отправка данных договора:', JSON.stringify(contractData, null, 2));
    
    // Обновляем договор
    await contractsService.updateContract(contractId.value, contractData);
    
    showSnackbarMessage('Договор успешно обновлен', 'success');

    setTimeout(() => {
      router.push('/billing');
    }, 1500);
  } catch (error: any) {
    console.error('Error saving contract:', error);
    
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

// Lifecycle
// Менеджера договора назначает только admin/superadmin.
const canAssignManager = computed(() => canManageBilling());
const managers = ref<Array<{ id: number; name: string; role: string }>>([]);
const loadManagers = async () => {
  if (!canAssignManager.value) return;
  try {
    managers.value = await contractsService.getManagers();
  } catch {
    managers.value = [];
  }
};

onMounted(async () => {
  await Promise.all([
    loadContract(),
    loadPartnerCompanies(),
    loadTariffPlans(),
    loadManagers(),
  ]);
});
</script>

<style scoped>
.edit-contract-page {
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

.form-card,
.error-card {
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
  white-space: nowrap;
}

.website-input-container :deep(.apple-input-container) {
  flex: 1;
  position: relative;
}

.website-input-container :deep(.apple-input-wrapper) {
  padding-left: 0 !important;
}

.website-input-container :deep(.apple-input-field) {
  padding-left: 72px !important;
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
  .edit-contract-page {
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

.form-section :deep(.v-row) {
  align-items: flex-end;
}

.form-section .v-col > label.apple-input-label + .v-select,
.form-section .v-col > label.apple-input-label + .v-textarea {
  margin-top: 3px;
}

.form-section :deep(.v-col) {
  padding-bottom: 6px;
}
</style>
