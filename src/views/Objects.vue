<template>
  <div class="objects-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-office-building" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Управление объектами</h1>
          <p class="page-subtitle">Мониторинг и управление объектами системы</p>
        </div>
      </div>
      
      <div class="page-actions">
        <AppleButton
          variant="secondary"
          prepend-icon="mdi-export"
          @click="exportObjects"
          :loading="exporting"
          data-testid="export-button"
        >
          Экспорт
        </AppleButton>
        <AppleButton
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
          data-testid="create-button"
        >
          Создать объект
        </AppleButton>
      </div>
    </div>

    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard
          v-for="stat in stats"
          :key="stat.key"
          :title="stat.value.toString()"
          :subtitle="stat.label"
          :icon="stat.icon"
          :icon-color="stat.color"
          variant="outlined"
          class="stat-card"
        />
      </div>
    </div>

    <!-- ТЕСТ: Простой поиск -->
    <div style="background: red; padding: 20px; margin: 20px 0; color: white;">
      <h2>ТЕСТ ПОИСКА - ДОЛЖЕН БЫТЬ ВИДЕН</h2>
      <input type="text" placeholder="Тестовое поле поиска" style="padding: 10px; width: 100%;" />
    </div>

    <!-- Поиск объектов -->
    <v-card class="mb-4" variant="outlined" elevation="2">
      <v-card-title>
        <v-icon icon="mdi-magnify" class="mr-2" />
        Поиск объектов
      </v-card-title>
      
      <v-card-text>
        <v-text-field
          v-model="filters.search"
          placeholder="Поиск по названию, IMEI, номеру телефона..."
          prepend-icon="mdi-magnify"
          clearable
          variant="outlined"
          @input="debouncedSearch"
        />
      </v-card-text>
    </v-card>

    <!-- Фильтры -->
    <AppleCard class="filters-card" variant="outlined">
      <template #header>
        <div class="filters-header">
          <v-icon icon="mdi-filter" class="mr-2" />
          Фильтры
          <v-spacer />
          <AppleButton
            variant="text"
            size="small"
            @click="clearFilters"
            :disabled="!hasActiveFilters"
            data-testid="clear-filters"
          >
            Очистить
          </AppleButton>
        </div>
      </template>
      
      <div class="filters-content">
        <v-row>
          <v-col cols="12" md="3" v-if="!showAdvancedSearch">
            <AppleInput
              v-model="filters.search"
              placeholder="Быстрый поиск..."
              prepend-icon="mdi-magnify"
              clearable
              @input="debouncedSearch"
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Статус"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.type"
              :items="typeOptions"
              label="Тип"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.contract_id"
              :items="contractOptions"
              label="Договор"
              clearable
              variant="outlined"
              density="comfortable"
              :loading="loadingContracts"
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.location_id"
              :items="locationOptions"
              label="Локация"
              clearable
              variant="outlined"
              density="comfortable"
              :loading="loadingLocations"
            />
          </v-col>
          
          <v-col cols="12" md="1">
            <v-switch
              v-model="showDeletedObjects"
              label="Корзина"
              color="error"
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    </AppleCard>

    <!-- Список объектов -->
    <AppleCard class="objects-table-card" variant="outlined">
      <template #header>
        <div class="table-header">
          <div class="table-title-section">
            <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
            {{ showDeletedObjects ? 'Корзина объектов' : 'Список объектов' }}
            <v-chip
              v-if="objectsData"
              :text="objectsData.total.toString()"
              size="small"
              class="ml-2"
            />
          </div>
          
          <div class="table-actions">
            <!-- Кнопки массовых операций -->
            <div v-if="selectedObjects.length > 0" class="mass-actions">
              <v-chip
                :text="`Выбрано: ${selectedObjects.length}`"
                color="primary"
                variant="outlined"
                size="small"
                class="mr-2"
              />
              <AppleButton
                variant="secondary"
                size="small"
                prepend-icon="mdi-check-circle"
                @click="toggleAllObjectsActivity(true)"
                class="mr-2"
              >
                Активировать
              </AppleButton>
              <AppleButton
                variant="secondary"
                size="small"
                prepend-icon="mdi-pause-circle"
                @click="toggleAllObjectsActivity(false)"
                class="mr-2"
              >
                Деактивировать
              </AppleButton>
              <AppleButton
                variant="text"
                size="small"
                prepend-icon="mdi-close"
                @click="selectedObjects = []; selectAll = false"
              >
                Отменить выбор
              </AppleButton>
            </div>
            
            <v-btn-toggle
              v-model="viewMode"
              mandatory
              variant="outlined"
              density="compact"
            >
              <v-btn value="table" icon="mdi-table" />
              <v-btn value="grid" icon="mdi-grid" />
            </v-btn-toggle>
          </div>
        </div>
      </template>
      
      <!-- Таблица объектов -->
      <div v-if="viewMode === 'table'" class="table-container">
        <v-data-table
          :headers="tableHeaders"
          :items="objects"
          :loading="loading"
          :items-per-page="pagination.per_page"
          :page="pagination.page"
          :server-items-length="objectsData?.total || 0"
          :items-per-page-options="perPageOptions"
          :model-value="selectedObjects"
          @update:model-value="selectedObjects = $event"
          @update:page="handlePageChange"
          @update:items-per-page="handlePerPageChange"
          @update:sort-by="handleSortChange"
          item-value="id"
          show-select
          class="objects-table"
          no-data-text="Объекты не найдены"
          loading-text="Загрузка объектов..."
        >
          <!-- Активность -->
          <template #item.is_active="{ item }">
            <v-checkbox
              :model-value="item.is_active"
              @update:model-value="toggleObjectActivity(item, $event)"
              hide-details
              density="compact"
            />
          </template>
          
          <!-- ID -->
          <template #item.id="{ item }">
            <span class="font-mono">{{ item.id }}</span>
          </template>
          
          <!-- Название учетной записи -->
          <template #item.accountName="{ item }">
            <span>{{ item.accountName || 'Не указано' }}</span>
          </template>
          
          <!-- Создатель -->
          <template #item.creatorName="{ item }">
            <span>{{ item.creatorName || 'Не указан' }}</span>
          </template>
          
          <!-- Модель устройства -->
          <template #item.deviceTypeName="{ item }">
            <span>{{ item.deviceTypeName || 'Не указана' }}</span>
          </template>
          
          <!-- Номера телефонов -->
          <template #item.phoneNumbers="{ item }">
            <div v-if="item.phoneNumbers && item.phoneNumbers.length > 0">
              <div v-for="phone in item.phoneNumbers" :key="phone" class="text-caption">
                {{ phone }}
              </div>
            </div>
            <span v-else class="text-medium-emphasis">Не указаны</span>
          </template>
          
          <!-- Дата создания -->
          <template #item.createdAt="{ item }">
            <div class="text-caption">
              {{ formatDate(item.createdAt || item.created_at) }}
            </div>
          </template>
          
          <!-- Дата последнего сообщения -->
          <template #item.lastMessageDatetime="{ item }">
            <div v-if="item.lastMessageDatetime" class="text-caption">
              {{ formatDate(item.lastMessageDatetime) }}
            </div>
            <div v-else class="text-caption text-medium-emphasis">
              Нет данных
            </div>
          </template>
          
          <!-- Уникальный ID -->
          <template #item.uniqueId="{ item }">
            <span class="font-mono">{{ item.uniqueId || item.external_id || 'Не указан' }}</span>
          </template>

          <!-- Статус -->
          <template #item.status="{ item }">
            <v-chip
              :text="getStatusText(item.status)"
              :color="getStatusColor(item.status)"
              size="small"
              variant="tonal"
            />
          </template>
          
          <!-- Тип -->
          <template #item.type="{ item }">
            <div class="d-flex align-center">
              <v-icon :icon="getTypeIcon(item.type)" size="20" class="mr-2" />
              {{ getTypeText(item.type) }}
            </div>
          </template>
          
          <!-- Договор -->
          <template #item.contract="{ item }">
            <div v-if="item.contract">
              <div class="font-weight-medium">{{ item.contract.client_name }}</div>
              <div class="text-caption text-medium-emphasis">№{{ item.contract.id }}</div>
            </div>
          </template>
          
          <!-- Локация -->
          <template #item.location="{ item }">
            <div v-if="item.location">
              <v-icon icon="mdi-map-marker" size="16" class="mr-1" />
              {{ item.location.name }}
            </div>
          </template>
          
          <!-- Последняя активность -->
          <template #item.last_activity_at="{ item }">
            <div v-if="item.last_activity_at" class="text-caption">
              {{ formatDate(item.last_activity_at) }}
            </div>
            <div v-else class="text-caption text-medium-emphasis">
              Нет данных
            </div>
          </template>
          
          <!-- Плановое удаление -->
          <template #item.scheduled_delete_at="{ item }">
            <div v-if="item.scheduled_delete_at" class="d-flex align-center">
              <v-icon icon="mdi-clock-alert" size="16" color="warning" class="mr-1" />
              <span class="text-caption text-warning">
                {{ formatDate(item.scheduled_delete_at) }}
              </span>
            </div>
          </template>
          
          <!-- Действия -->
          <template #item.actions="{ item }">
            <div class="actions-cell">
              <template v-if="!showDeletedObjects">
                <v-tooltip text="Просмотр">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-eye"
                      size="small"
                      variant="text"
                      @click="viewObject(item)"
                    />
                  </template>
                </v-tooltip>
                
                <v-tooltip text="Редактировать">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      @click="editObject(item)"
                    />
                  </template>
                </v-tooltip>
                
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-dots-vertical"
                      size="small"
                      variant="text"
                    />
                  </template>
                  
                  <v-list density="compact">
                    <v-list-item
                      v-if="item.scheduled_delete_at"
                      prepend-icon="mdi-restore"
                      title="Отменить удаление"
                      @click="cancelScheduledDelete(item)"
                    />
                    <v-list-item
                      v-else
                      prepend-icon="mdi-clock-alert"
                      title="Запланировать удаление"
                      @click="scheduleDelete(item)"
                    />
                    <v-divider />
                    <v-list-item
                      prepend-icon="mdi-delete"
                      title="Удалить"
                      class="text-error"
                      @click="deleteObject(item)"
                    />
                  </v-list>
                </v-menu>
              </template>
              
              <template v-else>
                <v-tooltip text="Восстановить">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-restore"
                      size="small"
                      variant="text"
                      color="success"
                      @click="restoreObject(item)"
                    />
                  </template>
                </v-tooltip>
                
                <v-tooltip text="Удалить навсегда">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-delete-forever"
                      size="small"
                      variant="text"
                      color="error"
                      @click="permanentDeleteObject(item)"
                    />
                  </template>
                </v-tooltip>
              </template>
            </div>
          </template>
        </v-data-table>
      </div>
      
      <!-- Сетка объектов -->
      <div v-else class="grid-container">
        <div class="objects-grid">
          <AppleCard
            v-for="object in objects"
            :key="object.id"
            :title="object.name"
            :subtitle="getTypeText(object.type)"
            :icon="getTypeIcon(object.type)"
            variant="outlined"
            clickable
            hover
            class="object-card"
            @click="viewObject(object)"
          >
            <div class="object-card-content">
              <div class="object-info">
                <div class="info-row">
                  <v-icon icon="mdi-identifier" size="16" />
                  <span>{{ object.imei || 'Не указан' }}</span>
                </div>
                <div class="info-row">
                  <v-icon icon="mdi-phone" size="16" />
                  <span>{{ object.phone_number || 'Не указан' }}</span>
                </div>
                <div class="info-row">
                  <v-icon icon="mdi-map-marker" size="16" />
                  <span>{{ object.location?.name || 'Не указана' }}</span>
                </div>
              </div>
              
              <div class="object-status">
                <v-chip
                  :text="getStatusText(object.status)"
                  :color="getStatusColor(object.status)"
                  size="small"
                  variant="tonal"
                />
              </div>
            </div>
            
            <template #footer>
              <div class="object-card-actions">
                <AppleButton
                  variant="text"
                  size="small"
                  prepend-icon="mdi-eye"
                  @click.stop="viewObject(object)"
                >
                  Просмотр
                </AppleButton>
                <AppleButton
                  variant="text"
                  size="small"
                  prepend-icon="mdi-pencil"
                  @click.stop="editObject(object)"
                >
                  Изменить
                </AppleButton>
              </div>
            </template>
          </AppleCard>
        </div>
      </div>
    </AppleCard>

    <!-- Диалог создания/редактирования объекта -->
    <v-dialog
      v-model="objectDialog.show"
      max-width="800"
      persistent
    >
      <AppleCard>
        <template #header>
          <div class="dialog-header">
            <v-icon :icon="objectDialog.isEdit ? 'mdi-pencil' : 'mdi-plus'" class="mr-2" />
            {{ objectDialog.isEdit ? 'Редактирование объекта' : 'Создание объекта' }}
            <v-spacer />
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              @click="closeObjectDialog"
            />
          </div>
        </template>
        
        <v-form ref="objectFormRef" @submit.prevent="saveObject">
          <div class="form-content">
            <v-row>
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="objectForm.name"
                  label="Название объекта"
                  placeholder="Введите название"
                  required
                  :error-message="formErrors.name"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="objectForm.type"
                  :items="typeOptions"
                  label="Тип объекта"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="formErrors.type"
                />
              </v-col>
              
              <!-- Новые поля -->
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="objectForm.accountName"
                  label="Название учетной записи"
                  placeholder="Введите название учетной записи"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="objectForm.creatorName"
                  label="Создатель (ФИО)"
                  placeholder="Введите ФИО создателя"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="objectForm.deviceTypeName"
                  label="Модель устройства"
                  placeholder="Введите модель устройства"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="objectForm.uniqueId"
                  label="Уникальный ID"
                  placeholder="Введите уникальный идентификатор"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="objectForm.is_active"
                  label="Активный объект"
                  color="success"
                  hide-details
                />
              </v-col>
              
              <v-col cols="12">
                <AppleInput
                  v-model="objectForm.description"
                  label="Описание"
                  placeholder="Введите описание объекта"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="objectForm.imei"
                  label="IMEI"
                  placeholder="Введите IMEI устройства"
                  :error-message="formErrors.imei"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="objectForm.phone_number"
                  label="Основной номер телефона"
                  placeholder="+7 (XXX) XXX-XX-XX"
                />
              </v-col>
              
              <!-- Дополнительные номера телефонов -->
              <v-col cols="12">
                <div class="phone-numbers-section">
                  <div class="d-flex align-center mb-2">
                    <label class="text-subtitle-2">Дополнительные номера телефонов</label>
                    <v-spacer />
                    <v-btn
                      icon="mdi-plus"
                      size="small"
                      variant="outlined"
                      @click="addPhoneNumber"
                    />
                  </div>
                  <div v-for="(phone, index) in objectForm.phoneNumbers" :key="index" class="d-flex align-center mb-2">
                    <AppleInput
                      v-model="objectForm.phoneNumbers[index]"
                      placeholder="+7 (XXX) XXX-XX-XX"
                      density="compact"
                    />
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      class="ml-2"
                      @click="removePhoneNumber(index)"
                    />
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="objectForm.serial_number"
                  label="Серийный номер"
                  placeholder="Введите серийный номер"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="objectForm.contract_id"
                  :items="contractOptions"
                  label="Договор"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="formErrors.contract_id"
                  :loading="loadingContracts"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="objectForm.location_id"
                  :items="locationOptions"
                  label="Локация"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingLocations"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="objectForm.template_id"
                  :items="templateOptions"
                  label="Шаблон объекта"
                  clearable
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingTemplates"
                />
              </v-col>
              
              <v-col cols="12">
                <AppleInput
                  v-model="objectForm.address"
                  label="Адрес"
                  placeholder="Введите адрес объекта"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="objectForm.latitude"
                  label="Широта"
                  type="number"
                  placeholder="55.7558"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="objectForm.longitude"
                  label="Долгота"
                  type="number"
                  placeholder="37.6176"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="objectForm.notes"
                  label="Заметки"
                  placeholder="Дополнительная информация"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
            </v-row>
          </div>
        </v-form>
        
        <template #footer>
          <div class="dialog-actions">
            <AppleButton
              variant="secondary"
              @click="closeObjectDialog"
            >
              Отмена
            </AppleButton>
            <AppleButton
              @click="saveObject"
              :loading="saving"
            >
              {{ objectDialog.isEdit ? 'Сохранить' : 'Создать' }}
            </AppleButton>
          </div>
        </template>
      </AppleCard>
    </v-dialog>

    <!-- Диалог планового удаления -->
    <v-dialog
      v-model="scheduleDeleteDialog.show"
      max-width="500"
    >
      <AppleCard>
        <template #header>
          <v-icon icon="mdi-clock-alert" class="mr-2" color="warning" />
          Плановое удаление объекта
        </template>
        
        <div class="dialog-content">
          <p class="mb-4">
            Объект <strong>{{ scheduleDeleteDialog.object?.name }}</strong> 
            будет автоматически удален в указанную дату.
          </p>
          
          <AppleInput
            v-model="scheduleDeleteForm.scheduled_delete_at"
            label="Дата удаления"
            type="date"
            required
            :min="minDeleteDate"
            :error-message="scheduleDeleteErrors.scheduled_delete_at"
          />
        </div>
        
        <template #footer>
          <div class="dialog-actions">
            <AppleButton
              variant="secondary"
              @click="closeScheduleDeleteDialog"
            >
              Отмена
            </AppleButton>
            <AppleButton
              variant="danger"
              @click="confirmScheduleDelete"
              :loading="scheduling"
            >
              Запланировать
            </AppleButton>
          </div>
        </template>
      </AppleCard>
    </v-dialog>

    <!-- Диалог просмотра объекта -->
    <v-dialog
      v-model="viewDialog.show"
      max-width="900"
    >
      <AppleCard v-if="viewDialog.object">
        <template #header>
          <div class="view-dialog-header">
            <div class="object-title-section">
              <v-icon :icon="getTypeIcon(viewDialog.object.type)" size="24" class="mr-2" />
              <div>
                <h3>{{ viewDialog.object.name }}</h3>
                <p class="text-caption">{{ getTypeText(viewDialog.object.type) }}</p>
              </div>
            </div>
            <div class="object-status-section">
              <v-chip
                :text="getStatusText(viewDialog.object.status)"
                :color="getStatusColor(viewDialog.object.status)"
                variant="tonal"
              />
            </div>
            <v-spacer />
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              @click="closeViewDialog"
            />
          </div>
        </template>
        
        <div class="object-details">
          <v-row>
            <v-col cols="12" md="6">
              <div class="detail-section">
                <h4 class="section-title">Основная информация</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">IMEI:</span>
                    <span class="detail-value">{{ viewDialog.object.imei || 'Не указан' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Телефон:</span>
                    <span class="detail-value">{{ viewDialog.object.phone_number || 'Не указан' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Серийный номер:</span>
                    <span class="detail-value">{{ viewDialog.object.serial_number || 'Не указан' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Внешний ID:</span>
                    <span class="detail-value">{{ viewDialog.object.external_id || 'Не указан' }}</span>
                  </div>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" md="6">
              <div class="detail-section">
                <h4 class="section-title">Связи</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Договор:</span>
                    <span class="detail-value">
                      {{ viewDialog.object.contract?.client_name || 'Не указан' }}
                      <span v-if="viewDialog.object.contract" class="text-caption">
                        (№{{ viewDialog.object.contract.id }})
                      </span>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Локация:</span>
                    <span class="detail-value">{{ viewDialog.object.location?.name || 'Не указана' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Шаблон:</span>
                    <span class="detail-value">{{ viewDialog.object.template?.name || 'Не указан' }}</span>
                  </div>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" v-if="viewDialog.object.address">
              <div class="detail-section">
                <h4 class="section-title">Местоположение</h4>
                <div class="detail-item">
                  <v-icon icon="mdi-map-marker" size="16" class="mr-2" />
                  {{ viewDialog.object.address }}
                </div>
                <div v-if="viewDialog.object.latitude && viewDialog.object.longitude" class="detail-item mt-2">
                  <v-icon icon="mdi-crosshairs-gps" size="16" class="mr-2" />
                  {{ viewDialog.object.latitude }}, {{ viewDialog.object.longitude }}
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" v-if="viewDialog.object.notes">
              <div class="detail-section">
                <h4 class="section-title">Заметки</h4>
                <p class="detail-notes">{{ viewDialog.object.notes }}</p>
              </div>
            </v-col>
            
            <v-col cols="12" v-if="viewDialog.object.tags && viewDialog.object.tags.length">
              <div class="detail-section">
                <h4 class="section-title">Теги</h4>
                <div class="tags-container">
                  <v-chip
                    v-for="tag in viewDialog.object.tags"
                    :key="tag"
                    :text="tag"
                    size="small"
                    variant="outlined"
                    class="mr-2 mb-2"
                  />
                </div>
              </div>
            </v-col>
          </v-row>
        </div>
        
        <template #footer>
          <div class="dialog-actions">
            <AppleButton
              variant="secondary"
              prepend-icon="mdi-pencil"
              @click="editObjectFromView"
            >
              Редактировать
            </AppleButton>
            <AppleButton
              variant="danger"
              prepend-icon="mdi-delete"
              @click="deleteObjectFromView"
            >
              Удалить
            </AppleButton>
          </div>
        </template>
      </AppleCard>
    </v-dialog>

    <!-- Snackbar для уведомлений -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="bottom right"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import getObjectsService from '@/services/objectsService';
import type {
    ObjectFilters,
    ObjectForm,
    ObjectStatus,
    ObjectType,
    ObjectWithRelations,
    ScheduleDeleteForm,
} from '@/types/objects';
import { debounce } from 'lodash-es';
import { computed, onMounted, ref, watch } from 'vue';

// Получаем экземпляр сервиса
const objectsService = getObjectsService();

// Reactive data
const loading = ref(false);
const saving = ref(false);
const scheduling = ref(false);
const exporting = ref(false);
const objects = ref<ObjectWithRelations[]>([]);
const objectsData = ref<any>(null);
const viewMode = ref<'table' | 'grid'>('table');
const showDeletedObjects = ref(false);

// Поисковые состояния
const showSearchHistory = ref(false);
const showAdvancedSearch = ref(false);
const loadingSuggestions = ref(false);
const searchSuggestions = ref<Array<{ title: string; subtitle: string; icon: string; value: string }>>([]);
const searchHistory = ref<string[]>([]);

console.log('🔍 Search states initialized:', {
  showSearchHistory: showSearchHistory.value,
  showAdvancedSearch: showAdvancedSearch.value,
  loadingSuggestions: loadingSuggestions.value
});

// Расширенные фильтры
const advancedFilters = ref({
  accountName: '',
  creatorName: '',
  deviceTypeName: '',
  uniqueId: '',
  imei: '',
  phoneNumber: '',
});

// Состояние для массового выбора объектов
const selectedObjects = ref<number[]>([]);
const selectAll = ref(false);

// Pagination
const pagination = ref({
  page: 1,
  per_page: 50,
});

// Filters
const filters = ref<ObjectFilters>({
  search: '',
  status: undefined,
  type: undefined,
  contract_id: undefined,
  location_id: undefined,
  template_id: undefined,
});

// Options for selects
const contractOptions = ref<Array<{ title: string; value: number }>>([]);
const locationOptions = ref<Array<{ title: string; value: number }>>([]);
const templateOptions = ref<Array<{ title: string; value: number }>>([]);
const loadingContracts = ref(false);
const loadingLocations = ref(false);
const loadingTemplates = ref(false);

// Statistics
const stats = ref([
  { key: 'total', label: 'Всего объектов', value: 0, icon: 'mdi-office-building', color: 'primary' },
  { key: 'active', label: 'Активные', value: 0, icon: 'mdi-check-circle', color: 'success' },
  { key: 'inactive', label: 'Неактивные', value: 0, icon: 'mdi-pause-circle', color: 'warning' },
  { key: 'scheduled', label: 'К удалению', value: 0, icon: 'mdi-clock-alert', color: 'error' },
]);

// Object dialog
const objectDialog = ref({
  show: false,
  isEdit: false,
  object: null as ObjectWithRelations | null,
});

const objectForm = ref<ObjectForm>({
  name: '',
  type: '',
  description: '',
  
  // Новые поля
  accountName: '',
  creatorName: '',
  deviceTypeName: '',
  phoneNumbers: [],
  uniqueId: '',
  is_active: true,
  
  latitude: undefined,
  longitude: undefined,
  address: '',
  imei: '',
  phone_number: '',
  serial_number: '',
  contract_id: 0,
  template_id: undefined,
  location_id: 0,
  settings: '{}',
  tags: [],
  notes: '',
  external_id: '',
});

const formErrors = ref<Record<string, string>>({});
const objectFormRef = ref();

// Schedule delete dialog
const scheduleDeleteDialog = ref({
  show: false,
  object: null as ObjectWithRelations | null,
});

const scheduleDeleteForm = ref<ScheduleDeleteForm>({
  scheduled_delete_at: '',
});

const scheduleDeleteErrors = ref<Record<string, string>>({});

// View dialog
const viewDialog = ref({
  show: false,
  object: null as ObjectWithRelations | null,
});

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000,
});

// Computed
const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => 
    value !== undefined && value !== null && value !== ''
  );
});

const minDeleteDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
});

// Options
const statusOptions = [
  { title: 'Активный', value: 'active' },
  { title: 'Неактивный', value: 'inactive' },
  { title: 'Обслуживание', value: 'maintenance' },
  { title: 'К удалению', value: 'scheduled_delete' },
];

const typeOptions = [
  { title: 'Транспорт', value: 'vehicle' },
  { title: 'Оборудование', value: 'equipment' },
  { title: 'Актив', value: 'asset' },
  { title: 'Здание', value: 'building' },
  { title: 'Контейнер', value: 'container' },
];

// Быстрые фильтры
const quickFilters = ref([
  { key: 'active', label: 'Активные', icon: 'mdi-check-circle', filter: { is_active: true } },
  { key: 'inactive', label: 'Неактивные', icon: 'mdi-pause-circle', filter: { is_active: false } },
  { key: 'vehicles', label: 'Транспорт', icon: 'mdi-car', filter: { type: 'vehicle' } },
  { key: 'equipment', label: 'Оборудование', icon: 'mdi-tools', filter: { type: 'equipment' } },
  { key: 'scheduled_delete', label: 'К удалению', icon: 'mdi-clock-alert', filter: { status: 'scheduled_delete' } },
  { key: 'recent', label: 'Недавние', icon: 'mdi-clock-outline', filter: { ordering: '-created_at' } },
]);

// Table headers
const tableHeaders = computed(() => [
  { title: 'Активность', value: 'is_active', sortable: false, width: 100 },
  { title: 'ID', value: 'id', sortable: true },
  { title: 'Название', value: 'name', sortable: true },
  { title: 'Название учетной записи', value: 'accountName', sortable: true },
  { title: 'Создатель (ФИО)', value: 'creatorName', sortable: true },
  { title: 'Модель устройства', value: 'deviceTypeName', sortable: true },
  { title: 'Номера телефонов', value: 'phoneNumbers', sortable: false },
  { title: 'Дата создания', value: 'createdAt', sortable: true },
  { title: 'Дата последнего сообщения', value: 'lastMessageDatetime', sortable: true },
  { title: 'Уникальный ID', value: 'uniqueId', sortable: true },
  ...(showDeletedObjects.value 
    ? [{ title: 'Дата удаления', value: 'deleted_at', sortable: true }]
    : [{ title: 'Плановое удаление', value: 'scheduled_delete_at', sortable: true }]
  ),
  { title: 'Действия', value: 'actions', sortable: false, width: 120 },
]);

// Доступные значения для количества элементов на странице
const perPageOptions = [
  { title: '10 на странице', value: 10 },
  { title: '50 на странице', value: 50 },
  { title: '100 на странице', value: 100 },
  { title: '1000 на странице', value: 1000 },
];

// Methods
const loadObjects = async () => {
  try {
    loading.value = true;
    
    const response = showDeletedObjects.value
      ? await objectsService.getDeletedObjects(
          pagination.value.page,
          pagination.value.per_page,
          filters.value.search
        )
      : await objectsService.getObjects(
          pagination.value.page,
          pagination.value.per_page,
          filters.value
        );
    
    if (response.status === 'success') {
      objects.value = response.data.items;
      objectsData.value = response.data;
    } else {
      showSnackbar(response.error || 'Ошибка загрузки объектов', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка загрузки объектов:', error);
    showSnackbar('Ошибка загрузки объектов', 'error');
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const statsData = await objectsService.getObjectsStats();
    stats.value[0].value = statsData.total;
    stats.value[1].value = statsData.active;
    stats.value[2].value = statsData.inactive;
    stats.value[3].value = statsData.scheduled_for_delete;
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

const loadContracts = async () => {
  try {
    loadingContracts.value = true;
    // TODO: Реализовать загрузку договоров из API
    contractOptions.value = [
      { title: 'Договор №1 - ООО "Тест"', value: 1 },
      { title: 'Договор №2 - ИП Иванов', value: 2 },
    ];
  } catch (error) {
    console.error('Ошибка загрузки договоров:', error);
  } finally {
    loadingContracts.value = false;
  }
};

const loadLocations = async () => {
  try {
    loadingLocations.value = true;
    // TODO: Реализовать загрузку локаций из API
    locationOptions.value = [
      { title: 'Москва', value: 1 },
      { title: 'Санкт-Петербург', value: 2 },
      { title: 'Саратов', value: 3 },
    ];
  } catch (error) {
    console.error('Ошибка загрузки локаций:', error);
  } finally {
    loadingLocations.value = false;
  }
};

const loadTemplates = async () => {
  try {
    loadingTemplates.value = true;
    const response = await objectsService.getObjectTemplates(1, 100, { active_only: true });
    if (response.status === 'success') {
      templateOptions.value = response.data.items.map(template => ({
        title: template.name,
        value: template.id,
      }));
    }
  } catch (error) {
    console.error('Ошибка загрузки шаблонов:', error);
  } finally {
    loadingTemplates.value = false;
  }
};

// Debounced search
const debouncedSearch = debounce(() => {
  // Добавляем в историю поиска
  if (filters.value.search && filters.value.search.trim() && !searchHistory.value.includes(filters.value.search.trim())) {
    searchHistory.value.unshift(filters.value.search.trim());
    // Ограничиваем историю 10 элементами
    if (searchHistory.value.length > 10) {
      searchHistory.value = searchHistory.value.slice(0, 10);
    }
    // Сохраняем в localStorage
    localStorage.setItem('objects_search_history', JSON.stringify(searchHistory.value));
  }
  
  pagination.value.page = 1;
  loadObjects();
}, 500);

// Debounced advanced search
const debouncedAdvancedSearch = debounce(() => {
  // Применяем расширенные фильтры к основным фильтрам
  Object.assign(filters.value, advancedFilters.value);
  pagination.value.page = 1;
  loadObjects();
}, 500);

const clearFilters = () => {
  filters.value = {
    search: '',
    status: undefined,
    type: undefined,
    contract_id: undefined,
    location_id: undefined,
    template_id: undefined,
  };
  
  // Очищаем расширенные фильтры
  advancedFilters.value = {
    accountName: '',
    creatorName: '',
    deviceTypeName: '',
    uniqueId: '',
    imei: '',
    phoneNumber: '',
  };
  
  pagination.value.page = 1;
  loadObjects();
};

// Методы для работы с поиском
const handleSearchInput = async (value: string) => {
  if (!value || value.length < 2) {
    searchSuggestions.value = [];
    return;
  }
  
  loadingSuggestions.value = true;
  
  try {
    // Получаем предложения на основе существующих объектов
    const suggestions = [];
    
    // Добавляем предложения из истории поиска
    searchHistory.value
      .filter(item => item.toLowerCase().includes(value.toLowerCase()))
      .forEach(item => {
        suggestions.push({
          title: item,
          subtitle: 'Из истории поиска',
          icon: 'mdi-history',
          value: item
        });
      });
    
    // Добавляем предложения по типам поиска
    if (value.match(/^\d+$/)) {
      suggestions.push({
        title: `Поиск по ID: ${value}`,
        subtitle: 'Поиск объекта по идентификатору',
        icon: 'mdi-identifier',
        value: value
      });
    }
    
    if (value.match(/^\d{15}$/)) {
      suggestions.push({
        title: `Поиск по IMEI: ${value}`,
        subtitle: 'Поиск объекта по IMEI',
        icon: 'mdi-barcode',
        value: value
      });
    }
    
    if (value.match(/^\+?\d[\d\s\-\(\)]+$/)) {
      suggestions.push({
        title: `Поиск по номеру: ${value}`,
        subtitle: 'Поиск объекта по номеру телефона',
        icon: 'mdi-phone',
        value: value
      });
    }
    
    searchSuggestions.value = suggestions.slice(0, 8);
  } catch (error) {
    console.error('Ошибка получения предложений поиска:', error);
  } finally {
    loadingSuggestions.value = false;
  }
};

// Методы для работы с историей поиска
const loadSearchHistory = () => {
  try {
    const saved = localStorage.getItem('objects_search_history');
    if (saved) {
      searchHistory.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error('Ошибка загрузки истории поиска:', error);
  }
};

const clearSearchHistory = () => {
  searchHistory.value = [];
  localStorage.removeItem('objects_search_history');
};

const removeFromHistory = (index: number) => {
  searchHistory.value.splice(index, 1);
  localStorage.setItem('objects_search_history', JSON.stringify(searchHistory.value));
};

const applyHistorySearch = (searchTerm: string) => {
  filters.value.search = searchTerm;
  debouncedSearch();
};

// Методы для работы с быстрыми фильтрами
const isQuickFilterActive = (filter: any) => {
  return Object.entries(filter.filter).every(([key, value]) => {
    return filters.value[key as keyof typeof filters.value] === value;
  });
};

const toggleQuickFilter = (filter: any) => {
  if (isQuickFilterActive(filter)) {
    // Отключаем фильтр
    Object.keys(filter.filter).forEach(key => {
      if (key === 'ordering') {
        filters.value.ordering = 'name'; // Возвращаем к сортировке по умолчанию
      } else {
        (filters.value as any)[key] = undefined;
      }
    });
  } else {
    // Включаем фильтр
    Object.assign(filters.value, filter.filter);
  }
  
  pagination.value.page = 1;
  loadObjects();
};

// Dialog methods
const openCreateDialog = () => {
  objectDialog.value = {
    show: true,
    isEdit: false,
    object: null,
  };
  resetObjectForm();
};

const editObject = (object: ObjectWithRelations) => {
  objectDialog.value = {
    show: true,
    isEdit: true,
    object,
  };
  fillObjectForm(object);
};

const closeObjectDialog = () => {
  objectDialog.value.show = false;
  resetObjectForm();
  formErrors.value = {};
};

const resetObjectForm = () => {
  objectForm.value = {
    name: '',
    type: '',
    description: '',
    
    // Новые поля
    accountName: '',
    creatorName: '',
    deviceTypeName: '',
    phoneNumbers: [],
    uniqueId: '',
    is_active: true,
    
    latitude: undefined,
    longitude: undefined,
    address: '',
    imei: '',
    phone_number: '',
    serial_number: '',
    contract_id: 0,
    template_id: undefined,
    location_id: 0,
    settings: '{}',
    tags: [],
    notes: '',
    external_id: '',
  };
};

const fillObjectForm = (object: ObjectWithRelations) => {
  objectForm.value = {
    name: object.name,
    type: object.type,
    description: object.description,
    
    // Новые поля
    accountName: object.accountName || '',
    creatorName: object.creatorName || '',
    deviceTypeName: object.deviceTypeName || '',
    phoneNumbers: object.phoneNumbers || [],
    uniqueId: object.uniqueId || object.external_id || '',
    is_active: object.is_active,
    
    latitude: object.latitude,
    longitude: object.longitude,
    address: object.address,
    imei: object.imei,
    phone_number: object.phone_number,
    serial_number: object.serial_number,
    contract_id: object.contract_id,
    template_id: object.template_id,
    location_id: object.location_id,
    settings: object.settings,
    tags: object.tags,
    notes: object.notes,
    external_id: object.external_id,
  };
};

const saveObject = async () => {
  try {
    formErrors.value = {};
    
    // Валидация
    if (!objectForm.value.name.trim()) {
      formErrors.value.name = 'Название объекта обязательно';
      return;
    }
    if (!objectForm.value.type) {
      formErrors.value.type = 'Тип объекта обязателен';
      return;
    }
    if (!objectForm.value.contract_id) {
      formErrors.value.contract_id = 'Договор обязателен';
      return;
    }
    
    saving.value = true;
    
    const response = objectDialog.value.isEdit
      ? await objectsService.updateObject(objectDialog.value.object!.id, objectForm.value)
      : await objectsService.createObject(objectForm.value);
    
    if (response.status === 'success') {
      showSnackbar(
        objectDialog.value.isEdit ? 'Объект успешно обновлен' : 'Объект успешно создан',
        'success'
      );
      closeObjectDialog();
      await loadObjects();
      await loadStats();
    } else {
      showSnackbar(response.error || 'Ошибка сохранения объекта', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка сохранения объекта:', error);
    showSnackbar('Ошибка сохранения объекта', 'error');
  } finally {
    saving.value = false;
  }
};

const viewObject = (object: ObjectWithRelations) => {
  viewDialog.value = {
    show: true,
    object,
  };
};

const closeViewDialog = () => {
  viewDialog.value.show = false;
  viewDialog.value.object = null;
};

const editObjectFromView = () => {
  if (viewDialog.value.object) {
    closeViewDialog();
    editObject(viewDialog.value.object);
  }
};

const deleteObjectFromView = () => {
  if (viewDialog.value.object) {
    const object = viewDialog.value.object;
    closeViewDialog();
    deleteObject(object);
  }
};

const deleteObject = async (object: ObjectWithRelations) => {
  if (!confirm(`Вы уверены, что хотите удалить объект "${object.name}"?`)) {
    return;
  }
  
  try {
    const response = await objectsService.deleteObject(object.id);
    if (response.status === 'success') {
      showSnackbar('Объект успешно удален', 'success');
      await loadObjects();
      await loadStats();
    } else {
      showSnackbar(response.error || 'Ошибка удаления объекта', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка удаления объекта:', error);
    showSnackbar('Ошибка удаления объекта', 'error');
  }
};

const scheduleDelete = (object: ObjectWithRelations) => {
  scheduleDeleteDialog.value = {
    show: true,
    object,
  };
  scheduleDeleteForm.value.scheduled_delete_at = '';
};

const closeScheduleDeleteDialog = () => {
  scheduleDeleteDialog.value.show = false;
  scheduleDeleteDialog.value.object = null;
  scheduleDeleteForm.value.scheduled_delete_at = '';
  scheduleDeleteErrors.value = {};
};

const confirmScheduleDelete = async () => {
  try {
    scheduleDeleteErrors.value = {};
    
    if (!scheduleDeleteForm.value.scheduled_delete_at) {
      scheduleDeleteErrors.value.scheduled_delete_at = 'Дата удаления обязательна';
      return;
    }
    
    scheduling.value = true;
    
    const response = await objectsService.scheduleObjectDelete(
      scheduleDeleteDialog.value.object!.id,
      scheduleDeleteForm.value
    );
    
    if (response.status === 'success') {
      showSnackbar('Плановое удаление запланировано', 'success');
      closeScheduleDeleteDialog();
      await loadObjects();
      await loadStats();
    } else {
      showSnackbar(response.error || 'Ошибка планирования удаления', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка планирования удаления:', error);
    showSnackbar('Ошибка планирования удаления', 'error');
  } finally {
    scheduling.value = false;
  }
};

const cancelScheduledDelete = async (object: ObjectWithRelations) => {
  if (!confirm(`Отменить плановое удаление объекта "${object.name}"?`)) {
    return;
  }
  
  try {
    const response = await objectsService.cancelScheduledDelete(object.id);
    if (response.status === 'success') {
      showSnackbar('Плановое удаление отменено', 'success');
      await loadObjects();
      await loadStats();
    } else {
      showSnackbar(response.error || 'Ошибка отмены планового удаления', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка отмены планового удаления:', error);
    showSnackbar('Ошибка отмены планового удаления', 'error');
  }
};

const restoreObject = async (object: ObjectWithRelations) => {
  if (!confirm(`Восстановить объект "${object.name}"?`)) {
    return;
  }
  
  try {
    const response = await objectsService.restoreObject(object.id);
    if (response.status === 'success') {
      showSnackbar('Объект успешно восстановлен', 'success');
      await loadObjects();
      await loadStats();
    } else {
      showSnackbar(response.error || 'Ошибка восстановления объекта', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка восстановления объекта:', error);
    showSnackbar('Ошибка восстановления объекта', 'error');
  }
};

const permanentDeleteObject = async (object: ObjectWithRelations) => {
  if (!confirm(`ВНИМАНИЕ! Объект "${object.name}" будет удален навсегда. Это действие нельзя отменить. Продолжить?`)) {
    return;
  }
  
  try {
    const response = await objectsService.permanentDeleteObject(object.id);
    if (response.status === 'success') {
      showSnackbar('Объект окончательно удален', 'success');
      await loadObjects();
      await loadStats();
    } else {
      showSnackbar(response.error || 'Ошибка окончательного удаления', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка окончательного удаления:', error);
    showSnackbar('Ошибка окончательного удаления', 'error');
  }
};

const exportObjects = async () => {
  try {
    exporting.value = true;
    const blob = await objectsService.exportObjects('excel', filters.value);
    
    // Создаем ссылку для скачивания
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `objects_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showSnackbar('Экспорт завершен', 'success');
  } catch (error: any) {
    console.error('Ошибка экспорта:', error);
    showSnackbar('Ошибка экспорта объектов', 'error');
  } finally {
    exporting.value = false;
  }
};

// Pagination handlers
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  loadObjects();
};

const handlePerPageChange = (per_page: number) => {
  pagination.value.per_page = per_page;
  pagination.value.page = 1;
  loadObjects();
};

const handleSortChange = (sortBy: any[]) => {
  if (sortBy.length > 0) {
    const sort = sortBy[0];
    const field = sort.key;
    const order = sort.order === 'desc' ? '-' : '';
    filters.value.ordering = `${order}${field}`;
  } else {
    filters.value.ordering = 'name';
  }
  pagination.value.page = 1;
  loadObjects();
};

// Utility methods
const getStatusText = (status: ObjectStatus): string => {
  const statusMap = {
    active: 'Активный',
    inactive: 'Неактивный',
    maintenance: 'Обслуживание',
    scheduled_delete: 'К удалению',
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: ObjectStatus): string => {
  const colorMap = {
    active: 'success',
    inactive: 'warning',
    maintenance: 'info',
    scheduled_delete: 'error',
  };
  return colorMap[status] || 'default';
};

const getTypeText = (type: ObjectType): string => {
  const typeMap = {
    vehicle: 'Транспорт',
    equipment: 'Оборудование',
    asset: 'Актив',
    building: 'Здание',
    container: 'Контейнер',
  };
  return typeMap[type] || type;
};

const getTypeIcon = (type: ObjectType): string => {
  const iconMap = {
    vehicle: 'mdi-car',
    equipment: 'mdi-tools',
    asset: 'mdi-package-variant',
    building: 'mdi-office-building',
    container: 'mdi-package',
  };
  return iconMap[type] || 'mdi-help-circle';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

// Функции для работы с активностью объектов
const toggleObjectActivity = async (object: ObjectWithRelations, isActive: boolean) => {
  try {
    const response = await objectsService.updateObject(object.id, { is_active: isActive });
    if (response.status === 'success') {
      // Обновляем объект в локальном состоянии
      const index = objects.value.findIndex(obj => obj.id === object.id);
      if (index !== -1) {
        objects.value[index].is_active = isActive;
      }
      showSnackbar(
        `Объект "${object.name}" ${isActive ? 'активирован' : 'деактивирован'}`,
        'success'
      );
    } else {
      showSnackbar(response.error || 'Ошибка изменения активности объекта', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка изменения активности объекта:', error);
    showSnackbar('Ошибка изменения активности объекта', 'error');
  }
};

const toggleAllObjectsActivity = async (isActive: boolean) => {
  if (selectedObjects.value.length === 0) {
    showSnackbar('Выберите объекты для изменения активности', 'warning');
    return;
  }

  if (!confirm(`${isActive ? 'Активировать' : 'Деактивировать'} выбранные объекты (${selectedObjects.value.length} шт.)?`)) {
    return;
  }

  try {
    const promises = selectedObjects.value.map(objectId => 
      objectsService.updateObject(objectId, { is_active: isActive })
    );
    
    await Promise.all(promises);
    
    // Обновляем объекты в локальном состоянии
    objects.value.forEach(obj => {
      if (selectedObjects.value.includes(obj.id)) {
        obj.is_active = isActive;
      }
    });
    
    showSnackbar(
      `${selectedObjects.value.length} объект(ов) ${isActive ? 'активированы' : 'деактивированы'}`,
      'success'
    );
    
    selectedObjects.value = [];
    selectAll.value = false;
  } catch (error: any) {
    console.error('Ошибка массового изменения активности:', error);
    showSnackbar('Ошибка массового изменения активности объектов', 'error');
  }
};

const toggleObjectSelection = (objectId: number) => {
  const index = selectedObjects.value.indexOf(objectId);
  if (index > -1) {
    selectedObjects.value.splice(index, 1);
  } else {
    selectedObjects.value.push(objectId);
  }
  updateSelectAllState();
};

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedObjects.value = objects.value.map(obj => obj.id);
  } else {
    selectedObjects.value = [];
  }
};

const updateSelectAllState = () => {
  if (selectedObjects.value.length === 0) {
    selectAll.value = false;
  } else if (selectedObjects.value.length === objects.value.length) {
    selectAll.value = true;
  } else {
    selectAll.value = false;
  }
};

// Функции для работы с номерами телефонов
const addPhoneNumber = () => {
  objectForm.value.phoneNumbers?.push('');
};

const removePhoneNumber = (index: number) => {
  objectForm.value.phoneNumbers?.splice(index, 1);
};

// Watchers
watch([filters], () => {
  pagination.value.page = 1;
  loadObjects();
}, { deep: true });

watch(showDeletedObjects, () => {
  pagination.value.page = 1;
  loadObjects();
});

// Lifecycle
onMounted(async () => {
  console.log('🚀 Objects component mounted');
  
  // Загружаем историю поиска
  loadSearchHistory();
  
  await Promise.all([
    loadObjects(),
    loadStats(),
    loadContracts(),
    loadLocations(),
    loadTemplates(),
  ]);
  
  console.log('✅ Objects component fully loaded');
});
</script>

<style scoped>
.objects-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0;
}

/* Заголовок страницы */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  color: var(--apple-blue);
}

.page-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
  line-height: 1.4;
}

.page-actions {
  display: flex;
  gap: 12px;
}

/* Статистика */
.stats-section {
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  text-align: center;
}

/* Поиск */
.search-card {
  margin: 0;
}

.search-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.search-actions {
  display: flex;
  gap: 8px;
}

.search-content {
  padding: 0;
}

.main-search-section {
  margin-bottom: 16px;
}

.main-search-input {
  width: 100%;
}

.quick-filters-section {
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(60, 60, 67, 0.02);
  border-radius: 8px;
}

.quick-filters-title {
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.quick-filters-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-history-section {
  padding: 16px;
  background: rgba(60, 60, 67, 0.02);
  border-radius: 8px;
  margin-bottom: 16px;
}

.search-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.search-history-title {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.search-history-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.advanced-search-section {
  padding: 16px;
  background: rgba(60, 60, 67, 0.02);
  border-radius: 8px;
  margin-bottom: 16px;
}

.advanced-search-title {
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-size: 0.875rem;
}

/* Фильтры */
.filters-card {
  margin: 0;
}

.filters-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.filters-content {
  padding: 0;
}

/* Таблица */
.objects-table-card {
  margin: 0;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.table-title-section {
  display: flex;
  align-items: center;
}

.table-container {
  padding: 0;
}

.objects-table {
  background: transparent;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

/* Сетка объектов */
.grid-container {
  padding: 20px;
}

.objects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.object-card {
  height: 100%;
}

.object-card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.object-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.object-status {
  align-self: flex-start;
}

.object-card-actions {
  display: flex;
  gap: 8px;
}

/* Диалоги */
.dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.form-content {
  padding: 20px 0;
}

.dialog-content {
  padding: 20px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Просмотр объекта */
.view-dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.object-title-section {
  display: flex;
  align-items: center;
}

.object-status-section {
  margin-left: 16px;
}

.object-details {
  padding: 20px;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 120px;
}

.detail-value {
  color: var(--text-primary);
  flex: 1;
}

.detail-notes {
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Темная тема */
[data-theme="dark"] .page-icon {
  color: var(--apple-blue-light);
}

[data-theme="dark"] .page-title {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .page-subtitle {
  color: var(--text-secondary-dark);
}

[data-theme="dark"] .section-title {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .detail-label {
  color: var(--text-secondary-dark);
}

[data-theme="dark"] .detail-value {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .detail-notes {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .detail-item {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}

/* Темная тема для поиска */
[data-theme="dark"] .quick-filters-section {
  background: rgba(84, 84, 136, 0.04);
}

[data-theme="dark"] .search-history-section {
  background: rgba(84, 84, 136, 0.04);
}

[data-theme="dark"] .advanced-search-section {
  background: rgba(84, 84, 136, 0.04);
}

[data-theme="dark"] .quick-filters-title,
[data-theme="dark"] .search-history-title,
[data-theme="dark"] .advanced-search-title {
  color: var(--text-secondary-dark);
}

/* Адаптивность */
@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .page-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .objects-grid {
    grid-template-columns: 1fr;
  }
  
  .search-actions {
    flex-direction: column;
    gap: 4px;
  }
  
  .quick-filters-chips {
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .page-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .filters-content .v-row {
    margin: 0;
  }
  
  .filters-content .v-col {
    padding: 4px;
  }
}

/* Анимации */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Улучшения для таблицы */
.objects-table :deep(.v-data-table__wrapper) {
  border-radius: 12px;
  overflow: hidden;
}

.objects-table :deep(.v-data-table-header__content) {
  font-weight: 600;
  color: var(--text-primary);
}

.objects-table :deep(.v-data-table__td) {
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

[data-theme="dark"] .objects-table :deep(.v-data-table__td) {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}

/* Улучшения для карточек */
.object-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .object-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* Стили для новых элементов */
.mass-actions {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.phone-numbers-section {
  border: 1px solid rgba(60, 60, 67, 0.08);
  border-radius: 8px;
  padding: 16px;
  background: rgba(60, 60, 67, 0.02);
}

[data-theme="dark"] .phone-numbers-section {
  border-color: rgba(84, 84, 136, 0.16);
  background: rgba(84, 84, 136, 0.04);
}

.font-mono {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
}

/* Адаптивность для массовых действий */
@media (max-width: 960px) {
  .mass-actions {
    flex-wrap: wrap;
    gap: 8px;
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .table-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
