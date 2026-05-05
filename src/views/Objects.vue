<template>
  <div class="objects-page">

    <!-- Уведомление о демо режиме -->
    <v-alert v-if="objectsService.isMockDataEnabled && objectsService.isMockDataEnabled()" type="info" variant="tonal"
      prominent border="start" class="demo-alert">
      <template #prepend>
        <v-icon icon="mdi-play-circle" size="24" />
      </template>
      <div class="alert-content">
        <div class="alert-title">Демонстрационный режим</div>
        <div class="alert-text">
          Отображаются демо данные. Это позволяет увидеть, как будет выглядеть интерфейс управления объектами.
          Все изменения в демо режиме не сохраняются.
        </div>
      </div>
    </v-alert>

    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard v-for="stat in stats" :key="stat.key" :title="stat.value.toString()" :subtitle="stat.label"
          :icon="stat.icon" :icon-color="stat.color" variant="outlined" :clickable="stat.key === 'trash'"
          :class="['stat-card', { 'clickable': stat.key === 'trash' }]"
          @click="stat.key === 'trash' ? openTrashDialog() : null" />
      </div>
    </div>

    <!-- Поиск + фильтры в одну линию -->
    <v-card class="mb-4" variant="outlined" elevation="2">
      <v-card-text class="py-3">
        <v-row align="center" no-gutters>
          <v-col cols="12" md="6" class="pr-3">
            <v-text-field v-model="filters.search" placeholder="Поиск по названию, IMEI, номеру телефона..."
              prepend-icon="mdi-magnify" clearable variant="outlined" density="compact" hide-details
              @input="debouncedSearch" />
          </v-col>

          <v-col cols="12" md="3" class="pr-3">
            <v-select v-model="filters.source" :items="sourceOptions" label="Система" clearable variant="outlined"
              density="compact" hide-details @update:model-value="loadObjects" />
          </v-col>

          <v-col cols="auto" class="pr-3">
            <v-btn
              :icon="showDeletedObjects ? 'mdi-delete' : 'mdi-delete-outline'"
              :color="showDeletedObjects ? 'error' : 'default'"
              variant="flat"
              density="comfortable"
              :title="showDeletedObjects ? 'Корзина (включена)' : 'Показать корзину'"
              @click="showDeletedObjects = !showDeletedObjects"
            />
          </v-col>

          <v-col v-if="hasActiveFilters" cols="auto">
            <v-btn
              icon="mdi-filter-off-outline"
              variant="flat"
              color="warning"
              density="comfortable"
              title="Сбросить активные фильтры"
              data-testid="clear-filters"
              @click="clearFilters"
            >
              <v-badge :content="activeFiltersCount" color="white" text-color="warning" inline />
            </v-btn>
          </v-col>

          <v-spacer />

          <v-col cols="auto">
            <v-btn-toggle v-model="viewMode" mandatory variant="outlined" density="compact">
              <v-btn value="table" icon="mdi-table" />
              <v-btn value="grid" icon="mdi-grid" />
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Список объектов -->
    <AppleCard class="objects-table-card" variant="outlined">
      <template v-if="selectedObjects.length > 0" #header>
        <div class="table-header table-header--compact">
          <div class="mass-actions">
            <v-chip :text="`Выбрано: ${selectedObjects.length}`" color="primary" variant="outlined" size="small"
              class="mr-2" />
            <AppleButton variant="secondary" size="small" prepend-icon="mdi-check-circle"
              @click="toggleAllObjectsActivity(true)" class="mr-2">
              Активировать
            </AppleButton>
            <AppleButton variant="secondary" size="small" prepend-icon="mdi-pause-circle"
              @click="toggleAllObjectsActivity(false)" class="mr-2">
              Деактивировать
            </AppleButton>
            <AppleButton variant="text" size="small" prepend-icon="mdi-close"
              @click="selectedObjects = []; selectAll = false">
              Отменить выбор
            </AppleButton>
          </div>
        </div>
      </template>

      <!-- Таблица объектов -->
      <div v-if="viewMode === 'table'" class="table-container">
        <v-data-table-server :headers="tableHeaders" :items="combinedObjects" :loading="false"
          :items-per-page="pagination.per_page" :page="pagination.page" :items-length="objectsData?.total || 0"
          :items-per-page-options="perPageOptions" :model-value="selectedObjects"
          @update:model-value="selectedObjects = $event" @update:page="handlePageChange"
          @update:items-per-page="handlePerPageChange" @update:sort-by="handleSortChange" item-value="id" show-select
          hide-default-footer
          class="objects-table" no-data-text="Объекты не найдены" loading-text="Загрузка объектов...">
          <!-- Заголовок колонки статуса — иконка вместо текста -->
          <template #header.is_active>
            <v-icon icon="mdi-power" size="20" :title="'Статус (вкл/выкл)'" />
          </template>

          <!-- Заголовок колонки планового удаления / даты удаления — иконка -->
          <template #header.scheduled_delete_at>
            <v-icon icon="mdi-clock-alert-outline" size="20" title="Плановое удаление" />
          </template>
          <template #header.deleted_at>
            <v-icon icon="mdi-delete-clock-outline" size="20" title="Дата удаления" />
          </template>

          <!-- Статус — иконка: зелёная (активный) / жёлтая (деактивирован) / красная (корзина) -->
          <template #item.is_active="{ item }">
            <v-icon
              v-if="showDeletedObjects || item.scheduledDelete || item.deleted_at || item.axenta_deleted_at"
              icon="mdi-delete-circle"
              color="error"
              size="22"
              title="В корзине"
            />
            <v-icon
              v-else-if="item.is_active"
              icon="mdi-check-circle"
              color="success"
              size="22"
              :title="'Активный (клик — деактивировать)'"
              style="cursor:pointer"
              @click="toggleObjectActivity(item, false)"
            />
            <v-icon
              v-else
              icon="mdi-pause-circle"
              color="warning"
              size="22"
              :title="'Деактивирован (клик — активировать)'"
              style="cursor:pointer"
              @click="toggleObjectActivity(item, true)"
            />
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
            <span class="font-mono text-caption">{{ item.uniqueId || item.external_id || 'Не указан' }}</span>
          </template>

          <!-- Заголовок колонки источника — иконка -->
          <template #header.source>
            <v-icon icon="mdi-source-branch" size="20" title="Источник" />
          </template>

          <!-- Источник — иконка с tooltip. axenta — облако, wialon (WH/WL) — спутник.
               Цвет wialon-иконки берётся по connection_id из палитры — каждое новое
               подключение автоматически получает свой оттенок. -->
          <template #item.source="{ item }">
            <v-icon
              v-if="item.source === 'axenta'"
              icon="mdi-cloud-outline"
              color="primary"
              size="22"
              :title="item.sourceLabel || 'Axenta Cloud'"
            />
            <v-icon
              v-else-if="item.source === 'wh' || item.source === 'wl'"
              icon="mdi-satellite-uplink"
              :color="getConnectionColor(item.connectionId)"
              size="22"
              :title="item.sourceLabel || (item.source === 'wh' ? 'Wialon Hosting' : 'Wialon Local')"
            />
            <v-icon v-else icon="mdi-help-circle-outline" color="grey" size="22" :title="item.source || ''" />
          </template>

          <!-- Статус -->
          <template #item.status="{ item }">
            <v-chip :text="getStatusText(item.status)" :color="getStatusColor(item.status)" size="small"
              variant="tonal" />
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
                <v-menu>
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-dots-vertical" size="20" class="actions-dots" />
                  </template>

                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-card-account-details-outline" title="Свойства объекта"
                      @click="viewObject(item)" />
                    <v-list-item prepend-icon="mdi-pencil" title="Редактировать" @click="editObject(item)" />
                    <v-divider />
                    <v-list-item prepend-icon="mdi-file-document-plus" title="Создать шаблон"
                      @click="createTemplateFromObject(item)" />
                    <v-divider />
                    <v-list-item v-if="item.scheduled_delete_at" prepend-icon="mdi-restore" title="Отменить удаление"
                      @click="cancelScheduledDelete(item)" />
                    <v-list-item v-else prepend-icon="mdi-clock-alert" title="Запланировать удаление"
                      @click="scheduleDelete(item)" />
                    <v-divider />
                    <v-list-item prepend-icon="mdi-delete" title="Удалить" class="text-error"
                      @click="deleteObject(item)" />
                  </v-list>
                </v-menu>
              </template>

              <template v-else>
                <v-tooltip text="Восстановить">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-restore" size="small" variant="text" color="success"
                      @click="restoreObject(item)" />
                  </template>
                </v-tooltip>

                <v-tooltip text="Удалить навсегда">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-delete-forever" size="small" variant="text" color="error"
                      @click="permanentDeleteObject(item)" />
                  </template>
                </v-tooltip>
              </template>
            </div>
          </template>
        </v-data-table-server>

        <!-- Кастомная пагинация (как в /accounts) -->
        <div class="compact-pagination" v-if="(objectsData?.total || 0) > 0">
          <v-select
            :model-value="pagination.per_page"
            :items="perPageOptions"
            variant="outlined"
            density="compact"
            class="items-select"
            hide-details
            @update:model-value="(v: number) => handlePerPageChange(v)"
          />
          <span class="range-info">{{ paginationRange }} из {{ objectsData?.total || 0 }}</span>
          <div class="nav-controls">
            <v-btn icon="mdi-page-first" variant="text" size="x-small"
              :disabled="pagination.page === 1" title="Первая"
              @click="handlePageChange(1)" />
            <v-btn icon="mdi-chevron-left" variant="text" size="x-small"
              :disabled="pagination.page === 1" title="Предыдущая"
              @click="handlePageChange(pagination.page - 1)" />
            <span class="page-info">{{ pagination.page }} / {{ paginationTotalPages }}</span>
            <v-btn icon="mdi-chevron-right" variant="text" size="x-small"
              :disabled="pagination.page >= paginationTotalPages" title="Следующая"
              @click="handlePageChange(pagination.page + 1)" />
            <v-btn icon="mdi-page-last" variant="text" size="x-small"
              :disabled="pagination.page >= paginationTotalPages" title="Последняя"
              @click="handlePageChange(paginationTotalPages)" />
          </div>
        </div>
      </div>

      <!-- Сетка объектов -->
      <div v-else class="grid-container">
        <div class="objects-grid">
          <AppleCard v-for="object in objects" :key="object.id" :title="object.name"
            :subtitle="getTypeText(object.type)" :icon="getTypeIcon(object.type)" variant="outlined" clickable hover
            class="object-card" @click="viewObject(object)">
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
                <v-chip :text="getStatusText(object.status)" :color="getStatusColor(object.status)" size="small"
                  variant="tonal" />
              </div>
            </div>

            <template #footer>
              <div class="object-card-actions">
                <AppleButton variant="text" size="small" prepend-icon="mdi-eye" @click.stop="viewObject(object)">
                  Просмотр
                </AppleButton>
                <AppleButton variant="text" size="small" prepend-icon="mdi-pencil" @click.stop="editObject(object)">
                  Изменить
                </AppleButton>
              </div>
            </template>
          </AppleCard>
        </div>
      </div>
    </AppleCard>

    <!-- Диалог создания/редактирования объекта -->
    <v-dialog v-model="objectDialog.show" max-width="800" @click:outside="closeObjectDialog">
      <AppleCard>
        <template #header>
          <div class="dialog-header">
            <v-icon :icon="objectDialog.isEdit ? 'mdi-pencil' : 'mdi-plus'" class="mr-2" />
            {{ objectDialog.isEdit ? 'Редактирование объекта' : 'Создание объекта' }}
            <v-spacer />
            <v-btn icon="mdi-close" variant="text" size="small" @click="closeObjectDialog" />
          </div>
        </template>

        <v-form ref="objectFormRef" @submit.prevent="saveObject">
          <div class="form-content">
            <!-- Шаблон объекта -->
            <v-row v-if="!objectDialog.isEdit">
              <v-col cols="12">
                <v-select v-model="selectedTemplate" :items="templateOptions" label="Шаблон объекта (опционально)"
                  variant="outlined" density="comfortable" clearable prepend-icon="mdi-file-document-outline"
                  @update:model-value="applyTemplate">
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon :icon="item.raw.icon || 'mdi-file-document-outline'" />
                      </template>
                      <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <!-- Основная информация -->
            <v-row>
              <v-col cols="12">
                <h3 class="form-section-title">Основная информация</h3>
              </v-col>

              <v-col cols="12" md="6">
                <AppleInput v-model="objectForm.name" label="Название объекта *" placeholder="Введите название" required
                  :error-message="formErrors.name" />
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="objectForm.type" :items="typeOptions" label="Тип объекта *" variant="outlined"
                  density="comfortable" required :error-messages="formErrors.type" />
              </v-col>

              <!-- Новые поля -->
              <v-col cols="12" md="6">
                <v-select v-model="objectForm.company_id" :items="companyOptions"
                  label="Название учетной записи (компании) *" variant="outlined" density="comfortable" required
                  :loading="loadingCompanies" :error-messages="formErrors.company_id" prepend-icon="mdi-domain"
                  item-title="name" item-value="id" placeholder="Выберите компанию" />
              </v-col>

              <v-col cols="12" md="6">
                <AppleInput v-model="objectForm.creatorName" label="Создатель (ФИО)"
                  placeholder="Введите ФИО создателя" />
              </v-col>

              <v-col cols="12" md="6">
                <AppleInput v-model="objectForm.deviceTypeName" label="Модель устройства"
                  placeholder="Введите модель устройства" />
              </v-col>

              <v-col cols="12" md="6">
                <AppleInput v-model="objectForm.uniqueId" label="Уникальный ID"
                  placeholder="Введите уникальный идентификатор" />
              </v-col>

              <v-col cols="12" md="6">
                <v-switch v-model="objectForm.is_active" label="Активный объект" color="success" hide-details />
              </v-col>

              <v-col cols="12">
                <AppleInput v-model="objectForm.description" label="Описание" placeholder="Введите описание объекта" />
              </v-col>

              <v-col cols="12" md="6">
                <AppleInput v-model="objectForm.imei" label="IMEI" placeholder="Введите IMEI устройства"
                  :error-message="formErrors.imei" />
              </v-col>

              <v-col cols="12" md="6">
                <AppleInput v-model="objectForm.phone_number" label="Основной номер телефона"
                  placeholder="+7 (XXX) XXX-XX-XX" />
              </v-col>

              <!-- Дополнительные номера телефонов -->
              <v-col cols="12">
                <div class="phone-numbers-section">
                  <div class="d-flex align-center mb-2">
                    <label class="text-subtitle-2">Дополнительные номера телефонов</label>
                    <v-spacer />
                    <v-btn icon="mdi-plus" size="small" variant="outlined" @click="addPhoneNumber" />
                  </div>
                  <div v-for="(phone, index) in objectForm.phoneNumbers" :key="index" class="d-flex align-center mb-2">
                    <AppleInput v-model="objectForm.phoneNumbers[index]" placeholder="+7 (XXX) XXX-XX-XX"
                      density="compact" />
                    <v-btn icon="mdi-delete" size="small" variant="text" color="error" class="ml-2"
                      @click="removePhoneNumber(index)" />
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <AppleInput v-model="objectForm.serial_number" label="Серийный номер"
                  placeholder="Введите серийный номер" />
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="objectForm.contract_id" :items="contractOptions" label="Договор" variant="outlined"
                  density="comfortable" :error-messages="formErrors.contract_id" :loading="false" />
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="objectForm.location_id" :items="locationOptions" label="Локация" variant="outlined"
                  density="comfortable" :loading="false" />
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="objectForm.template_id" :items="templateOptions" label="Шаблон объекта" clearable
                  variant="outlined" density="comfortable" :loading="false" />
              </v-col>

              <v-col cols="12">
                <AppleInput v-model="objectForm.address" label="Адрес" placeholder="Введите адрес объекта" />
              </v-col>

              <v-col cols="12" md="6">
                <AppleInput v-model="objectForm.latitude" label="Широта" type="number" placeholder="55.7558" />
              </v-col>

              <v-col cols="12" md="6">
                <AppleInput v-model="objectForm.longitude" label="Долгота" type="number" placeholder="37.6176" />
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="objectForm.notes" label="Заметки" placeholder="Дополнительная информация"
                  variant="outlined" rows="3" />
              </v-col>
            </v-row>
          </div>
        </v-form>

        <template #footer>
          <div class="dialog-actions">
            <AppleButton variant="secondary" @click="closeObjectDialog">
              Отмена
            </AppleButton>
            <AppleButton @click="saveObject" :loading="saving">
              {{ objectDialog.isEdit ? 'Сохранить' : 'Создать' }}
            </AppleButton>
          </div>
        </template>
      </AppleCard>
    </v-dialog>

    <!-- Диалог планового удаления -->
    <ScheduleDeleteDialog
      v-model="scheduleDeleteDialog.show"
      :object="scheduleDeleteDialog.object"
      :form="scheduleDeleteForm"
      :errors="scheduleDeleteErrors"
      :min-date="minDeleteDate"
      :loading="scheduling"
      @update:form="scheduleDeleteForm = $event"
      @close="closeScheduleDeleteDialog"
      @confirm="confirmScheduleDelete" />

    <!-- Диалог создания шаблона из объекта -->
    <CreateTemplateDialog
      v-model="createTemplateDialog.show"
      :object="createTemplateDialog.object"
      :form="createTemplateForm"
      :errors="createTemplateErrors"
      :loading="saving"
      @update:form="createTemplateForm = $event"
      @close="closeCreateTemplateDialog"
      @confirm="confirmCreateTemplate" />

    <!-- Диалог просмотра объекта -->
    <v-dialog v-model="viewDialog.show" max-width="900">
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
              <v-chip :text="getStatusText(viewDialog.object.status)" :color="getStatusColor(viewDialog.object.status)"
                variant="tonal" />
            </div>
            <v-spacer />
            <v-btn icon="mdi-close" variant="text" size="small" @click="closeViewDialog" />
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
                  <v-chip v-for="tag in viewDialog.object.tags" :key="tag" :text="tag" size="small" variant="outlined"
                    class="mr-2 mb-2" />
                </div>
              </div>
            </v-col>
          </v-row>
        </div>

        <template #footer>
          <div class="dialog-actions">
            <AppleButton variant="secondary" prepend-icon="mdi-pencil" @click="editObjectFromView">
              Редактировать
            </AppleButton>
            <AppleButton variant="danger" prepend-icon="mdi-delete" @click="deleteObjectFromView">
              Удалить
            </AppleButton>
          </div>
        </template>
      </AppleCard>
    </v-dialog>

    <!-- Snackbar для уведомлений -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right"
      variant="flat" :multi-line="false" :vertical="false" elevation="8" rounded="xl" class="modern-snackbar">
      <div class="snackbar-content">
        <v-icon :icon="getSnackbarIcon(snackbar.color)" size="20" class="mr-3" />
        <span class="snackbar-text">{{ snackbar.text }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" size="small" icon="mdi-close" @click="snackbar.show = false" />
      </template>
    </v-snackbar>

    <!-- Красивое уведомление об успехе -->
    <SuccessNotification v-model="successNotification.show" :title="successNotification.title"
      :message="successNotification.message" :details="successNotification.details"
      :show-timer="successNotification.showTimer" @timer-complete="onNotificationTimerComplete" />

    <!-- Диалог корзины объектов -->
    <ObjectsTrashDialog v-model="showTrashDialog" />

    <!-- FAB меню -->
    <AppleFAB icon="mdi-plus" :items="fabMenuItems" @item-click="handleFabAction" />
  </div>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleFAB from '@/components/Apple/AppleFAB.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import SuccessNotification from '@/components/Common/SuccessNotification.vue';
import CreateTemplateDialog from '@/components/Objects/CreateTemplateDialog.vue';
import ObjectsTrashDialog from '@/components/Objects/ObjectsTrashDialog.vue';
import ScheduleDeleteDialog from '@/components/Objects/ScheduleDeleteDialog.vue';
import { useAxentaAutoRefresh } from '@/services/axentaAutoRefreshService';
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Получаем экземпляр сервиса
const objectsService = getObjectsService();

// Получаем текущий маршрут и роутер
const route = useRoute();
const router = useRouter();

// Автоматическое обновление данных
const autoRefresh = useAxentaAutoRefresh();

// Reactive data
const loading = ref(false);
const saving = ref(false);
const scheduling = ref(false);
const exporting = ref(false);

// FAB Menu Items - элементы плавающего меню действий
const fabMenuItems = [
  {
    id: 'create',
    label: 'Создать объект',
    icon: 'mdi-plus',
    color: 'success' as const,
    action: () => openCreateDialog()
  },
  {
    id: 'export',
    label: 'Экспорт',
    icon: 'mdi-export',
    color: 'primary' as const,
    action: () => exportObjects()
  }
];

// Обработчик клика на элементе FAB меню (действие выполняется через item.action)
const handleFabAction = (_item: { id?: string; action?: () => void }) => {};
const objects = ref<ObjectWithRelations[]>([]);
const objectsData = ref<any>(null);
const viewMode = ref<'table' | 'grid'>('table');
const showDeletedObjects = ref<boolean>(false);
// Восстанавливаем из persisted после объявления (см. ниже applyPersisted)
const showTrashDialog = ref(false);

// combinedObjects читает из objects.value, который теперь приходит из /unified/objects
// (объединённый Axenta+WH+WL endpoint, см. loadObjects). Каждый item уже имеет поле source.
const combinedObjects = computed(() => objects.value);

// Поисковые состояния
const showSearchHistory = ref(false);
const showAdvancedSearch = ref(false);
const showFilters = ref(false);
const loadingSuggestions = ref(false);
const searchSuggestions = ref<Array<{ title: string; subtitle: string; icon: string; value: string }>>([]);
const searchHistory = ref<string[]>([]);

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

// Persist фильтров/пагинации в localStorage между сессиями
const OBJECTS_PERSIST_KEY = 'objects_page_state_v1';

const loadPersistedState = () => {
  try {
    const raw = localStorage.getItem(OBJECTS_PERSIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const savePersistedState = () => {
  try {
    localStorage.setItem(OBJECTS_PERSIST_KEY, JSON.stringify({
      search: filters.value.search,
      source: filters.value.source ?? null,
      ordering: filters.value.ordering,
      showDeleted: showDeletedObjects.value,
      page: pagination.value.page,
      per_page: pagination.value.per_page,
    }));
  } catch {/* ignore */}
};

const persisted = loadPersistedState();

if (persisted?.showDeleted) {
  showDeletedObjects.value = true;
}

// Pagination
const pagination = ref({
  page: persisted?.page ?? 1,
  per_page: persisted?.per_page ?? 10,
});

// Filters
const filters = ref<ObjectFilters & { source?: string | null }>({
  search: persisted?.search ?? '',
  status: undefined,
  type: undefined,
  contract_id: undefined,
  location_id: undefined,
  template_id: undefined,
  source: persisted?.source ?? null,
  ordering: persisted?.ordering ?? '-createdAt', // По умолчанию: новые сверху
});

// Options for selects
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const contractOptions = ref<Array<{ title: string; value: number }>>([]);
const locationOptions = ref<Array<{ title: string; value: number }>>([]);
const templateOptions = ref<Array<{ title: string; value: number }>>([]);
const loadingCompanies = ref(false);
const loadingContracts = ref(false);
const loadingLocations = ref(false);
const loadingTemplates = ref(false);

// Template selection
const selectedTemplate = ref(null);

// Statistics
const stats = ref([
  { key: 'total', label: 'Всего объектов', value: 0, icon: 'mdi-office-building', color: 'primary' },
  { key: 'active', label: 'Активные', value: 0, icon: 'mdi-check-circle', color: 'success' },
  { key: 'inactive', label: 'Неактивные', value: 0, icon: 'mdi-pause-circle', color: 'warning' },
  { key: 'trash', label: 'В корзине', value: 0, icon: 'mdi-delete', color: 'error' },
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
  company_id: 0, // ID компании
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

// Create template dialog
const createTemplateDialog = ref({
  show: false,
  object: null as ObjectWithRelations | null,
});

const createTemplateForm = ref({
  name: '',
  description: '',
  category: '',
  icon: '',
  color: '',
});

const createTemplateErrors = ref<Record<string, string>>({});

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000,
});

// Success notification
const successNotification = ref({
  show: false,
  title: '',
  message: '',
  details: '',
  showTimer: false,
});

// Computed
const hasActiveFilters = computed(() => {
  return !!(filters.value.search || filters.value.source) || showDeletedObjects.value;
});

const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.value.search) count++;
  if (filters.value.source) count++;
  if (showDeletedObjects.value) count++;
  return count;
});

// Пагинация (компактный footer в стиле /accounts)
const paginationTotalPages = computed(() => {
  const total = objectsData.value?.total || 0;
  return Math.max(1, Math.ceil(total / pagination.value.per_page));
});

const paginationRange = computed(() => {
  const total = objectsData.value?.total || 0;
  if (total === 0) return '0-0';
  const from = (pagination.value.page - 1) * pagination.value.per_page + 1;
  const to = Math.min(pagination.value.page * pagination.value.per_page, total);
  return `${from}-${to}`;
});

// Колонка "Плановое удаление" видна только если в snapshot есть хоть один объект
// с scheduled_delete_at (счётчик берём из stats.axenta_scheduled_delete).
const hasScheduledDeletes = computed(() => {
  const st: any = objectsData.value?.stats;
  if (st && typeof st.axenta_scheduled_delete === 'number') {
    return st.axenta_scheduled_delete > 0;
  }
  return objects.value.some((o: any) => o.scheduled_delete_at || o.scheduledDelete);
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

// Опции для фильтра по системе
const sourceOptions = [
  { title: 'Все системы', value: null },
  { title: 'Axenta', value: 'axenta' },
  { title: 'Wialon', value: 'wialon' },
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
  { title: '', value: 'is_active', sortable: false, width: 60, headerProps: { class: 'header-status-icon' } },
  { title: 'Наименование', value: 'name', sortable: true },
  { title: 'Учетка', value: 'accountName', sortable: true },
  { title: 'Протокол', value: 'deviceTypeName', sortable: true },
  { title: 'ID/IMEI', value: 'uniqueId', sortable: true },
  { title: '№ телефонов', value: 'phoneNumbers', sortable: false },
  { title: 'Создан', value: 'createdAt', sortable: true },
  { title: 'Сообщения', value: 'lastMessageDatetime', sortable: true },
  { title: '', value: 'source', sortable: true, width: 60 },
  ...(showDeletedObjects.value
    ? [{ title: '', value: 'deleted_at', sortable: true, width: 110, headerProps: { class: 'header-deleted-icon' } }]
    : (hasScheduledDeletes.value
        ? [{ title: '', value: 'scheduled_delete_at', sortable: true, width: 110, headerProps: { class: 'header-scheduled-icon' } }]
        : []
      )
  ),
  { title: '', value: 'actions', sortable: false, width: 56 },
]);

// Доступные значения для количества элементов на странице
const perPageOptions = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '25', value: 25 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
  { title: '150', value: 150 },
  { title: '300', value: 300 },
  { title: '500', value: 500 },
  { title: '1000', value: 1000 },
];

// Methods
const loadObjects = async () => {
  try {
    // Корзина — отдельный path (там нужны soft-deleted объекты Axenta)
    if (showDeletedObjects.value) {
      const response = await objectsService.getDeletedObjects(
        pagination.value.page,
        pagination.value.per_page,
        filters.value.search,
      );
      if (response.status === 'success') {
        objects.value = response.data.items || [];
        objectsData.value = response.data;
      } else {
        showSnackbar(response.error || 'Ошибка загрузки объектов', 'error');
        objects.value = [];
      }
      return;
    }

    // Основной путь — единый /unified/objects (Axenta + WH + WL)
    const response = await objectsService.getUnifiedObjects(
      pagination.value.page,
      pagination.value.per_page,
      filters.value,
    );

    if (response.status === 'success') {
      objects.value = (response.data.items || []) as any[];
      objectsData.value = response.data;

      // KPI — из stats endpoint'а в том же ответе (без дополнительного RTT)
      const st = response.data.stats;
      if (st) {
        stats.value[0].value = st.axenta_total + st.wialon_total;
        stats.value[1].value = st.axenta_active + st.wialon_active;
        stats.value[2].value = st.axenta_inactive;
        // [3] Корзина и [4] К удалению — только Axenta
        stats.value[4].value = st.axenta_scheduled_delete;
        // Корзина считается отдельным запросом ниже (live-проксирование Axenta /trash)
      }

      // Корзина — отдельным запросом (Axenta /trash, не покрыто snapshot)
      try {
        const trashStats = await objectsService.getTrashStats();
        stats.value[3].value = trashStats.count;
      } catch {
        stats.value[3].value = 0;
      }
    } else {
      showSnackbar((response as any).error || 'Ошибка загрузки объектов', 'error');
      objects.value = [];
    }
  } catch (error: any) {
    console.error('Ошибка загрузки объектов:', error);
    showSnackbar('Ошибка загрузки объектов: ' + (error.message || 'Неизвестная ошибка'), 'error');
    objects.value = [];
  }
};

// loadStats оставлен как fallback при изоляции (не вызывается — KPI идут из /unified/objects).
const loadStats = async () => {
  try {
    const statsData = await objectsService.getObjectsStats(true);
    stats.value[0].value = statsData.total;
    stats.value[1].value = statsData.active;
    stats.value[2].value = statsData.inactive;
    stats.value[4].value = statsData.scheduled_for_delete;
    try {
      const trashStats = await objectsService.getTrashStats();
      stats.value[3].value = trashStats.count;
    } catch {
      stats.value[3].value = 0;
    }
  } catch (error) {
    console.warn('Stats API недоступен:', error);
  }
};

const loadCompanies = async () => {
  try {
    loadingCompanies.value = true;
    const response = await objectsService.getCompanies();

    if (response.status === 'success') {
      companyOptions.value = response.data;
    } else {
      showSnackbar(response.error || 'Ошибка загрузки компаний', 'error');
    }
  } catch (error) {
    console.error('Ошибка загрузки компаний:', error);
    showSnackbar('Ошибка загрузки компаний', 'error');
  } finally {
    loadingCompanies.value = false;
  }
};

// loadContracts/loadLocations — фильтры в UI отключены, реальный API не реализован.
// Возвращаем пустые массивы (селекты filters.contract_id/location_id скрыты при пустом списке).
const loadContracts = async () => {
  contractOptions.value = [];
};

const loadLocations = async () => {
  locationOptions.value = [];
};

// Load templates
const loadTemplates = async () => {
  try {
    // Убираем loadingTemplates.value = true; чтобы не было loading индикаторов
    const response = await objectsService.getObjectTemplates();

    if (response.status === 'success') {
      templateOptions.value = response.data.items.map((template: any) => ({
        title: template.name,
        value: template.id,
        name: template.name,
        description: template.description,
        icon: template.icon,
        config: template.config,
        default_settings: template.default_settings,
        category: template.category
      }));
    }
  } catch (error: any) {
    console.error('Ошибка загрузки шаблонов:', error);
    showSnackbar('Ошибка загрузки шаблонов', 'error');
  }
  // Убираем finally блок
};

// Apply template to form
const applyTemplate = (templateId: number | null) => {
  if (!templateId) return;

  const template = templateOptions.value.find(t => t.value === templateId);
  if (!template) return;

  // Применяем настройки шаблона к форме
  objectForm.value.template_id = templateId;
  objectForm.value.type = template.category || objectForm.value.type;

  // Применяем настройки по умолчанию из шаблона
  if (template.default_settings) {
    try {
      const settings = JSON.parse(template.default_settings);
      objectForm.value.settings = JSON.stringify(settings);
    } catch (error) {
      console.warn('Ошибка парсинга настроек шаблона:', error);
    }
  }

  showSnackbar(`Шаблон "${template.name}" применен`, 'success');
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
    source: null,
  };
  advancedFilters.value = {
    accountName: '',
    creatorName: '',
    deviceTypeName: '',
    uniqueId: '',
    imei: '',
    phoneNumber: '',
  };
  showDeletedObjects.value = false;
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
  console.log('🎯 openCreateDialog вызван');
  objectDialog.value = {
    show: true,
    isEdit: false,
    object: null,
  };
  console.log('🎯 Диалог установлен в show: true');
  resetObjectForm();
  loadCompanies(); // Загружаем компании при открытии диалога
  loadTemplates(); // Загружаем шаблоны при открытии диалога
  console.log('🎯 openCreateDialog завершен, состояние:', objectDialog.value);
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
  console.log('🎯 closeObjectDialog вызван');
  objectDialog.value.show = false;
  console.log('🎯 Диалог установлен в show: false');
  resetObjectForm();
  formErrors.value = {};
  selectedTemplate.value = null;

  // Очищаем параметр action из URL, если он есть
  if (route.query.action === 'create') {
    console.log('🎯 Очищаем параметр action из URL');
    router.replace({ path: route.path });
  }
  console.log('🎯 closeObjectDialog завершен, состояние:', objectDialog.value);
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
    company_id: 0, // ID компании
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
    company_id: object.company_id,
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
      if (objectDialog.value.isEdit) {
        showSnackbar('Объект успешно обновлен', 'success');
      } else {
        showSuccessNotification(
          'Объект успешно создан',
          'Новый объект мониторинга добавлен в систему',
          `Создан объект: ${objectForm.value.name}`,
          true
        );
      }
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

const closeCreateTemplateDialog = () => {
  createTemplateDialog.value.show = false;
  createTemplateDialog.value.object = null;
  createTemplateForm.value = {
    name: '',
    description: '',
    category: '',
    icon: '',
    color: '',
  };
  createTemplateErrors.value = {};
};

// Trash dialog methods
const openTrashDialog = () => {
  console.log('🗑️ Opening trash dialog...');
  showTrashDialog.value = true;
  console.log('🗑️ showTrashDialog set to:', showTrashDialog.value);
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

const confirmCreateTemplate = async () => {
  try {
    createTemplateErrors.value = {};

    // Валидация
    if (!createTemplateForm.value.name.trim()) {
      createTemplateErrors.value.name = 'Название шаблона обязательно';
      return;
    }
    if (!createTemplateForm.value.category.trim()) {
      createTemplateErrors.value.category = 'Категория шаблона обязательна';
      return;
    }

    saving.value = true;

    const response = await objectsService.createTemplateFromObject(
      createTemplateDialog.value.object!.id,
      createTemplateForm.value
    );

    if (response.status === 'success') {
      showSnackbar('Шаблон успешно создан на основе объекта', 'success');
      closeCreateTemplateDialog();
      // Можно добавить перезагрузку шаблонов если нужно
    } else {
      showSnackbar(response.error || 'Ошибка создания шаблона', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка создания шаблона:', error);
    showSnackbar('Ошибка создания шаблона', 'error');
  } finally {
    saving.value = false;
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

const createTemplateFromObject = (object: ObjectWithRelations) => {
  createTemplateDialog.value = {
    show: true,
    object,
  };
  createTemplateForm.value = {
    name: `Шаблон на основе "${object.name}"`,
    description: `Шаблон создан на основе объекта "${object.name}"`,
    category: object.type || 'Стандартные',
    icon: 'mdi-office-building',
    color: '#1976D2',
  };
  createTemplateErrors.value = {};
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
// Палитра цветов для wialon-подключений. При добавлении нового connection_id
// он автоматически получает цвет по индексу (циклически). axenta использует свой
// фирменный синий через color="primary".
const CONNECTION_PALETTE = [
  'orange', 'purple', 'teal', 'pink', 'indigo', 'cyan',
  'amber', 'lime', 'deep-orange', 'green', 'blue-grey', 'red',
];

const getConnectionColor = (connectionId?: number | string | null): string => {
  if (connectionId === undefined || connectionId === null) return 'grey';
  const id = typeof connectionId === 'string' ? parseInt(connectionId, 10) || 0 : connectionId;
  return CONNECTION_PALETTE[Math.abs(id) % CONNECTION_PALETTE.length];
};

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

const showSnackbar = (text: string, color = 'info', timeout?: number) => {
  // Автоматически устанавливаем время показа в зависимости от типа
  const defaultTimeouts = {
    error: 6000,    // Ошибки показываем дольше
    warning: 5000,  // Предупреждения - стандартное время
    success: 4000,  // Успех - чуть меньше
    info: 4000,     // Информация - стандартное время
  };

  const finalTimeout = timeout || defaultTimeouts[color as keyof typeof defaultTimeouts] || 5000;

  snackbar.value = {
    show: true,
    text,
    color,
    timeout: finalTimeout
  };

  // Логируем для отладки
  console.log(`📢 Snackbar: ${text} (${color}, ${finalTimeout}ms)`);
};

const getSnackbarIcon = (color: string): string => {
  const iconMap = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
  };
  return iconMap[color as keyof typeof iconMap] || 'mdi-information';
};

// Функция для принудительного закрытия всех диалогов (для отладки)
const forceCloseAllDialogs = () => {
  console.log('🚨 Принудительно закрываем все диалоги');
  objectDialog.value.show = false;
  scheduleDeleteDialog.value.show = false;
  viewDialog.value.show = false;
  console.log('🎯 Все диалоги закрыты:', {
    objectDialog: objectDialog.value.show,
    scheduleDeleteDialog: scheduleDeleteDialog.value.show,
    viewDialog: viewDialog.value.show
  });
};

// Добавляем функцию в window для отладки
if (typeof window !== 'undefined') {
  (window as any).forceCloseAllDialogs = forceCloseAllDialogs;
}

const showSuccessNotification = (title: string, message: string, details?: string, showTimer = false) => {
  successNotification.value = {
    show: true,
    title,
    message,
    details: details || '',
    showTimer,
  };
};

const onNotificationTimerComplete = () => {
  console.log('Таймер уведомления завершен');
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
  savePersistedState();
}, { deep: true });

watch(showDeletedObjects, () => {
  pagination.value.page = 1;
  loadObjects();
  savePersistedState();
});

watch(pagination, () => savePersistedState(), { deep: true });

// Подписка на автообновление
let unsubscribeFromAutoRefresh: (() => void) | null = null;

// Lifecycle
onMounted(async () => {
  console.log('🚀 Objects component mounted');


  // Принудительно закрываем все диалоги при инициализации
  objectDialog.value.show = false;
  scheduleDeleteDialog.value.show = false;
  viewDialog.value.show = false;
  console.log('🎯 Все диалоги принудительно закрыты');

  // Подхватываем ?search=... из URL (например, из глобального поиска на дашборде)
  if (route.query.search && typeof route.query.search === 'string') {
    filters.value.search = route.query.search;
  }

  // Загружаем историю поиска
  loadSearchHistory();

  try {
    // Загружаем основные данные (объекты) в первую очередь
    await loadObjects();

    // Остальные данные загружаем опционально (не критично если не загрузятся)
    Promise.allSettled([
      loadCompanies(),
      loadContracts(),
      loadLocations(),
      loadTemplates(),
    ]).then(results => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const names = ['компании', 'договоры', 'локации', 'шаблоны'];
          console.warn(`⚠️ Не удалось загрузить ${names[index]}:`, result.reason);
        }
      });
    });
  } catch (error: any) {
    console.error('Ошибка инициализации страницы объектов:', error);
    showSnackbar('Ошибка загрузки объектов. Проверьте подключение к серверу.', 'error', 8000);
  }

  // Временно отключаем автообновление из-за проблем с auth context
  // autoRefresh.setInterval(10);
  // autoRefresh.start();

  // Подписываемся на изменения автообновления
  // unsubscribeFromAutoRefresh = autoRefresh.subscribe(() => {
  //   loadObjects();
  // });

  console.log('⚠️ Автообновление временно отключено для стабильности');

  // Проверяем, нужно ли открыть диалог создания объекта
  if (route.query.action === 'create') {
    console.log('🎯 Автоматически открываем диалог создания объекта');
    // Добавляем небольшую задержку, чтобы компонент полностью загрузился
    setTimeout(() => {
      console.log('🎯 Открываем диалог создания объекта с задержкой');
      openCreateDialog();
      console.log('🎯 Состояние диалога:', objectDialog.value);
    }, 500);
  }

  console.log('✅ Objects component fully loaded');
});

onUnmounted(() => {
  // Отписываемся от автообновления (если было включено)
  if (unsubscribeFromAutoRefresh) {
    unsubscribeFromAutoRefresh();
  }

  console.log('🔄 Objects component unmounted');
});
</script>

<style scoped>
.objects-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0;
}

.page-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
}

.auto-refresh-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-surface), 0.8);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-radius: 12px;
}

.refresh-status {
  display: flex;
  align-items: center;
}

/* Статистика */
.stats-section {
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  text-align: center;
}

.stat-card.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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

.actions-dots {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.actions-dots:hover {
  opacity: 1;
}

/* Компактная пагинация (как на /accounts) */
.compact-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 24px;
  flex-wrap: nowrap;
  white-space: nowrap;
  min-height: 40px;
}

.items-select {
  min-width: 60px !important;
  width: fit-content !important;
  max-width: 120px !important;
  flex-shrink: 0;
  height: 40px;
}
.items-select :deep(.v-field) {
  min-width: 60px !important;
  width: auto !important;
}
.items-select :deep(.v-field__input) {
  min-width: 0 !important;
  width: auto !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.range-info {
  font-size: 0.875rem;
  color: var(--text-secondary, #555);
  flex-shrink: 0;
  font-weight: 500;
  padding: 6px 10px;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 6px;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 4px;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 6px;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-primary, #555);
  font-weight: 600;
  min-width: 50px;
  text-align: center;
  padding: 4px 10px;
}

[data-theme="dark"] .range-info,
[data-theme="dark"] .nav-controls {
  background-color: rgba(255, 255, 255, 0.05);
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

/* Inline фильтры */
.inline-filters {
  display: flex;
  justify-content: flex-end;
  height: 40px;
  align-items: center;
}

.filters-toggle-inline {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-secondary, #f8f9fa);
  height: 40px;
  min-width: 120px;
  font-size: 14px;
}

.filters-toggle-inline:hover {
  background-color: var(--bg-tertiary, #e9ecef);
  border-color: var(--apple-blue, #007AFF);
}

.expanded-filters {
  margin-top: 12px;
}

/* Демо уведомление */
.demo-alert {
  margin-bottom: 24px;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  font-weight: 600;
  font-size: 1rem;
}

.alert-text {
  font-size: 0.875rem;
  opacity: 0.9;
}

/* Snackbar стили */
.v-snackbar {
  z-index: 2000 !important;
}

.v-snackbar .v-snackbar__wrapper {
  min-width: 320px;
  max-width: 500px;
}

.modern-snackbar {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
}

.modern-snackbar .v-snackbar__wrapper {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
}

.snackbar-content {
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 0.875rem;
}

.snackbar-text {
  line-height: 1.4;
}

/* Анимация появления snackbar */
.modern-snackbar .v-snackbar__wrapper {
  animation: slideInFromRight 0.3s ease-out;
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Темная тема для snackbar */
[data-theme="dark"] .modern-snackbar .v-snackbar__wrapper {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Принудительно отключаем backdrop для диалогов, если он создает проблемы */
.v-overlay--active .v-overlay__scrim {
  opacity: 0.3 !important;
  /* Уменьшаем прозрачность backdrop */
}

/* Альтернативно - полностью отключаем backdrop */
.no-backdrop .v-overlay__scrim {
  display: none !important;
}

/* Убираем размытие с основного контента */
.v-application--wrap {
  filter: none !important;
  backdrop-filter: none !important;
}

/* Стили для диалога создания объекта */
.form-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-color, #e0e0e0);
}

.dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.form-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 16px 0;
}

/* Адаптивность */
@media (max-width: 960px) {
  .page-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
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
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
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
  padding-inline: 8px !important;
}

.objects-table :deep(th.v-data-table__th) {
  padding-inline: 8px !important;
}

.objects-table :deep(.v-data-table__td:first-child),
.objects-table :deep(th.v-data-table__th:first-child) {
  padding-inline-start: 12px !important;
}

.objects-table :deep(.v-data-table__td:last-child),
.objects-table :deep(th.v-data-table__th:last-child) {
  padding-inline-end: 12px !important;
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

/* Стили для формы создания шаблона */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row>* {
  flex: 1;
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

  .form-row {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
