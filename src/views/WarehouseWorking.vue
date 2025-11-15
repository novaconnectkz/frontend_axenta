<template>
  <div class="warehouse-page">
    <!-- Заголовок страницы -->
    <div class="page-header mb-6">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-warehouse" size="32" class="mr-3" />
          <div>
            <h1 class="text-h4 font-weight-bold">Управление складом</h1>
            <p class="text-subtitle-1 text-medium-emphasis ma-0">
              Каталог оборудования, складские операции и уведомления
            </p>
          </div>
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn color="success" prepend-icon="mdi-plus" @click="showCreateDialog = true">
            Добавить оборудование
          </v-btn>
          <v-btn color="primary" prepend-icon="mdi-qrcode-scan" @click="showQRDialog = true">
            Сканировать QR
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Вкладки -->
    <v-card>
      <v-tabs v-model="activeTab" bg-color="primary" show-arrows>
        <v-tab value="equipment">
          <v-icon start icon="mdi-package-variant" />
          Оборудование
        </v-tab>
        <v-tab value="sim-cards">
          <v-icon start icon="mdi-sim" />
          SIM-карты
        </v-tab>
        <v-tab value="operations">
          <v-icon start icon="mdi-swap-horizontal" />
          Операции
        </v-tab>
        <v-tab value="alerts">
          <v-icon start icon="mdi-alert" />
          Уведомления
          <v-badge v-if="activeAlerts > 0" :content="activeAlerts" color="error" class="ml-2" />
        </v-tab>
        <v-tab value="categories">
          <v-icon start icon="mdi-tag-multiple" />
          Категории
        </v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="activeTab">
          <!-- Вкладка: Оборудование -->
          <v-window-item value="equipment">
            <!-- Панель управления -->
            <div class="equipment-controls mb-4">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="searchQuery" placeholder="Поиск оборудования..."
                    prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" hide-details clearable />
                </v-col>
                <v-col cols="12" md="6">
                  <div class="d-flex align-center justify-end ga-2">
                    <v-btn-toggle v-model="viewMode" mandatory variant="outlined" density="comfortable">
                      <v-btn value="list" size="small">
                        <v-icon icon="mdi-format-list-bulleted" />
                        <span class="ml-1 d-none d-sm-inline">Список</span>
                      </v-btn>
                      <v-btn value="grid" size="small">
                        <v-icon icon="mdi-view-grid" />
                        <span class="ml-1 d-none d-sm-inline">Плитки</span>
                      </v-btn>
                    </v-btn-toggle>
                    <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="refreshEquipment">
                      Обновить
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </div>

            <!-- Панель массовых операций -->
            <v-slide-y-transition>
              <v-card v-if="selectedEquipment.length > 0" color="primary" variant="tonal"
                class="bulk-actions-panel mb-4">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-checkbox-marked-circle" class="mr-2" />
                      <span class="font-weight-medium">
                        Выбрано {{ selectedEquipment.length }} {{ getEquipmentWord(selectedEquipment.length) }}
                      </span>
                    </div>
                    <div class="d-flex align-center ga-2">
                      <v-btn color="info" variant="outlined" size="small" prepend-icon="mdi-swap-horizontal"
                        @click="showBulkTransferDialog = true" :disabled="!canBulkTransfer">
                        Массовый перенос
                      </v-btn>
                      <v-btn color="warning" variant="outlined" size="small" prepend-icon="mdi-bookmark"
                        @click="bulkReserve" :disabled="!canBulkReserve">
                        Зарезервировать
                      </v-btn>
                      <v-btn color="success" variant="outlined" size="small" prepend-icon="mdi-check"
                        @click="bulkSetAvailable" :disabled="!canBulkSetAvailable">
                        Сделать доступным
                      </v-btn>
                      <v-btn variant="outlined" size="small" prepend-icon="mdi-close" @click="clearSelection">
                        Отменить выбор
                      </v-btn>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-slide-y-transition>

            <!-- Список (таблица) -->
            <div v-if="viewMode === 'list'" class="equipment-table">
              <v-data-table :headers="equipmentHeaders" :items="filteredEquipment" item-key="id" class="elevation-1"
                :items-per-page="10" :search="searchQuery">
                <template #header.select>
                  <div class="d-flex justify-center">
                    <v-checkbox
                      :model-value="selectedEquipment.length === filteredEquipment.filter(canSelectItem).length && filteredEquipment.filter(canSelectItem).length > 0"
                      :indeterminate="isIndeterminate" @update:model-value="toggleSelectAll" density="comfortable"
                      hide-details />
                  </div>
                </template>

                <template #item.select="{ item }">
                  <div class="d-flex justify-center">
                    <v-checkbox :model-value="isSelected(item.id)" @update:model-value="toggleSelection(item.id)"
                      :disabled="!canSelectItem(item)" density="comfortable" hide-details />
                  </div>
                </template>

                <template #item.type="{ item }">
                  <div class="d-flex align-center">
                    <v-icon :icon="getTypeIcon(item.type)" class="mr-2" />
                    {{ getTypeLabel(item.type) }}
                  </div>
                </template>

                <template #item.status="{ item }">
                  <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                    {{ getStatusLabel(item.status) }}
                  </v-chip>
                </template>

                <template #item.purchase_price="{ item }">
                  <span class="font-weight-medium">
                    {{ formatPrice(item.purchase_price) }}
                  </span>
                </template>

                <template #item.actions="{ item }">
                  <div class="d-flex align-center ga-1">
                    <v-btn icon="mdi-eye" variant="text" size="small" @click="viewEquipment(item)" title="Просмотр" />
                    <v-btn icon="mdi-pencil" variant="text" size="small" @click="editEquipment(item)"
                      title="Редактировать" />
                    <v-btn v-if="item.status === 'in_stock'" icon="mdi-arrow-right" variant="text" size="small"
                      color="success" @click="installEquipment(item)" title="Установить" />
                    <v-btn icon="mdi-swap-horizontal" variant="text" size="small" color="info"
                      @click="transferEquipment(item)" title="Переместить" />
                  </div>
                </template>
              </v-data-table>
            </div>

            <!-- Плитки (сетка карточек) -->
            <div v-else class="equipment-grid">
              <v-row>
                <v-col v-for="item in filteredEquipment" :key="item.id" cols="12" sm="6" md="4" lg="3">
                  <v-card elevation="2" class="equipment-card"
                    :class="{ 'equipment-card--selected': isSelected(item.id) }">
                    <v-card-title class="d-flex align-center justify-space-between">
                      <div class="d-flex align-center">
                        <v-checkbox :model-value="isSelected(item.id)" @update:model-value="toggleSelection(item.id)"
                          :disabled="!canSelectItem(item)" density="comfortable" hide-details class="mr-2" />
                        <v-icon :icon="getTypeIcon(item.type)" class="mr-2" />
                        <div>
                          <div class="text-subtitle-1 font-weight-bold">{{ item.model }}</div>
                          <div class="text-caption text-medium-emphasis">{{ item.brand }}</div>
                        </div>
                      </div>
                      <v-menu>
                        <template #activator="{ props }">
                          <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
                        </template>
                        <v-list density="compact">
                          <v-list-item @click="viewEquipment(item)">
                            <template #prepend>
                              <v-icon icon="mdi-eye" />
                            </template>
                            <v-list-item-title>Просмотр</v-list-item-title>
                          </v-list-item>
                          <v-list-item @click="editEquipment(item)">
                            <template #prepend>
                              <v-icon icon="mdi-pencil" />
                            </template>
                            <v-list-item-title>Редактировать</v-list-item-title>
                          </v-list-item>
                          <v-divider />
                          <v-list-item v-if="item.status === 'in_stock'" @click="installEquipment(item)">
                            <template #prepend>
                              <v-icon icon="mdi-arrow-right" color="success" />
                            </template>
                            <v-list-item-title>Установить</v-list-item-title>
                          </v-list-item>
                          <v-list-item @click="transferEquipment(item)">
                            <template #prepend>
                              <v-icon icon="mdi-swap-horizontal" color="info" />
                            </template>
                            <v-list-item-title>Переместить</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </v-card-title>

                    <v-card-text class="py-2">
                      <!-- Статус -->
                      <div class="mb-3">
                        <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                          {{ getStatusLabel(item.status) }}
                        </v-chip>
                      </div>

                      <!-- Основная информация -->
                      <div class="equipment-info">
                        <div class="info-row">
                          <v-icon icon="mdi-barcode" size="16" class="mr-2" />
                          <span class="text-caption text-medium-emphasis">S/N:</span>
                          <span class="text-body-2 font-weight-medium ml-1">{{ item.serial_number }}</span>
                        </div>

                        <div v-if="item.warehouse_location" class="info-row">
                          <v-icon icon="mdi-map-marker" size="16" class="mr-2" />
                          <span class="text-caption text-medium-emphasis">Локация:</span>
                          <span class="text-body-2 font-weight-medium ml-1">{{ item.warehouse_location }}</span>
                        </div>

                        <div v-if="item.purchase_price" class="info-row">
                          <v-icon icon="mdi-currency-rub" size="16" class="mr-2" />
                          <span class="text-caption text-medium-emphasis">Цена:</span>
                          <span class="text-body-2 font-weight-medium ml-1">{{ formatPrice(item.purchase_price)
                            }}</span>
                        </div>
                      </div>
                    </v-card-text>

                    <v-card-actions>
                      <v-btn color="primary" variant="outlined" size="small" block @click="viewEquipment(item)">
                        Подробнее
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <!-- Сообщение если ничего не найдено -->
            <div v-if="filteredEquipment.length === 0" class="text-center py-8">
              <v-icon icon="mdi-package-variant-closed" size="64" color="grey" />
              <div class="text-h6 mt-4">Оборудование не найдено</div>
              <div class="text-body-2 text-medium-emphasis">
                Попробуйте изменить параметры поиска
              </div>
            </div>
          </v-window-item>

          <!-- Вкладка: SIM-карты -->
          <v-window-item value="sim-cards">
            <SimCardsList ref="simCardsListRef" />
          </v-window-item>

          <!-- Вкладка: Операции -->
          <v-window-item value="operations">
            <v-timeline side="end" density="compact">
              <v-timeline-item v-for="operation in operations" :key="operation.id"
                :dot-color="getOperationColor(operation.type)" size="small">
                <template #icon>
                  <v-icon :icon="getOperationIcon(operation.type)" size="16" />
                </template>

                <v-card variant="outlined" class="operation-card mb-2">
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <v-chip :color="getOperationColor(operation.type)" size="small" variant="tonal">
                        {{ getOperationLabel(operation.type) }}
                      </v-chip>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatDateTime(operation.created_at) }}
                      </div>
                    </div>
                    <div class="text-subtitle-2 font-weight-bold mb-1">
                      {{ operation.description }}
                    </div>
                    <div class="text-body-2">
                      {{ operation.from_location }} → {{ operation.to_location }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-window-item>

          <!-- Вкладка: Уведомления -->
          <v-window-item value="alerts">
            <div v-if="alerts.length === 0" class="text-center py-8">
              <v-icon icon="mdi-check-circle" size="64" color="success" />
              <div class="text-h6 mt-4">Уведомлений нет</div>
              <div class="text-body-2 text-medium-emphasis">
                Все складские процессы в порядке
              </div>
            </div>

            <div v-else>
              <v-card v-for="alert in alerts" :key="alert.id" variant="outlined" class="alert-card mb-3"
                :class="getAlertCardClass(alert)">
                <v-card-text>
                  <div class="d-flex align-start">
                    <v-icon :icon="getAlertIcon(alert.type)" :color="getSeverityColor(alert.severity)"
                      class="mr-3 mt-1" />
                    <div class="flex-grow-1">
                      <div class="d-flex align-center justify-space-between mb-2">
                        <v-chip :color="getSeverityColor(alert.severity)" size="small" variant="tonal">
                          {{ getSeverityLabel(alert.severity) }}
                        </v-chip>
                        <div class="text-caption text-medium-emphasis">
                          {{ formatDateTime(alert.created_at) }}
                        </div>
                      </div>
                      <div class="text-subtitle-1 font-weight-bold mb-1">
                        {{ alert.title }}
                      </div>
                      <div class="text-body-2">
                        {{ alert.description }}
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-window-item>

          <!-- Вкладка: Категории -->
          <v-window-item value="categories">
            <v-row>
              <v-col v-for="category in categories" :key="category.id" cols="12" sm="6" md="4">
                <v-card elevation="2">
                  <v-card-title class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-tag" class="mr-2" />
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">{{ category.name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ category.code }}</div>
                      </div>
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <div v-if="category.description" class="text-body-2 mb-3">
                      {{ category.description }}
                    </div>
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-caption text-medium-emphasis">Минимальный остаток:</span>
                      <v-chip size="small" variant="tonal">
                        {{ category.min_stock_level }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Простые диалоги -->
    <v-dialog v-model="showCreateDialog" max-width="500px">
      <v-card>
        <v-card-title>Добавление оборудования</v-card-title>
        <v-card-text>
          <p>Здесь будет форма добавления нового оборудования.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCreateDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showQRDialog" max-width="400px">
      <v-card>
        <v-card-title>Сканирование QR кода</v-card-title>
        <v-card-text>
          <p>Здесь будет интерфейс сканирования QR кодов.</p>
          <v-text-field v-model="qrCode" label="QR код" variant="outlined" prepend-inner-icon="mdi-qrcode" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showQRDialog = false">Закрыть</v-btn>
          <v-btn color="primary" @click="searchByQR">Найти</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог массового переноса -->
    <v-dialog v-model="showBulkTransferDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-swap-horizontal" class="mr-2" />
          Массовый перенос оборудования
        </v-card-title>

        <v-card-text>
          <!-- Информация о выбранном оборудовании -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-package-variant" class="mr-2" />
              Выбранное оборудование ({{ selectedEquipmentItems.length }})
            </v-card-title>
            <v-card-text>
              <div class="selected-equipment-list">
                <v-chip v-for="item in selectedEquipmentItems" :key="item.id" size="small" variant="outlined"
                  class="ma-1" closable @click:close="toggleSelection(item.id)">
                  <v-icon :icon="getTypeIcon(item.type)" start size="14" />
                  {{ item.model }} ({{ item.serial_number }})
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Форма переноса -->
          <v-form ref="bulkTransferForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-select v-model="bulkTransferData.from_location" label="Откуда (текущее местоположение)"
                  :items="currentLocations" variant="outlined" density="comfortable" readonly
                  prepend-inner-icon="mdi-map-marker-minus" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="bulkTransferData.to_location" label="Куда (новое местоположение)"
                  :items="warehouseLocations" variant="outlined" density="comfortable" :rules="[rules.required]"
                  prepend-inner-icon="mdi-map-marker-plus" required />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="bulkTransferData.notes" label="Причина переноса" variant="outlined"
                  density="comfortable" rows="3" placeholder="Укажите причину массового переноса оборудования..." />
              </v-col>
            </v-row>

            <!-- Предупреждения -->
            <v-alert v-if="hasInstalledEquipment" type="warning" variant="tonal" density="compact" class="mb-4">
              <template #prepend>
                <v-icon icon="mdi-alert" />
              </template>
              Внимание! В выборке есть установленное оборудование, которое нельзя перенести
            </v-alert>

            <v-alert v-if="hasBrokenEquipment" type="error" variant="tonal" density="compact" class="mb-4">
              <template #prepend>
                <v-icon icon="mdi-alert-circle" />
              </template>
              В выборке есть сломанное оборудование. Проверьте целесообразность переноса
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="outlined" @click="showBulkTransferDialog = false">
            Отмена
          </v-btn>
          <v-btn color="info" @click="executeBulkTransfer"
            :disabled="!bulkTransferData.to_location || transferableCount === 0" :loading="bulkTransferLoading">
            Перенести ({{ transferableCount }})
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import SimCardsList from '@/components/Warehouse/SimCardsList.vue';
import type { ComponentPublicInstance } from 'vue';

// Состояние
const activeTab = ref(localStorage.getItem('warehouse-active-tab') || 'equipment');
const simCardsListRef = ref<ComponentPublicInstance & { loadSimCards?: () => Promise<void> } | null>(null);
const showCreateDialog = ref(false);
const showQRDialog = ref(false);
const searchQuery = ref('');
const qrCode = ref('');
const viewMode = ref(localStorage.getItem('warehouse-view-mode') || 'list'); // 'list' или 'grid'
const selectedEquipment = ref<number[]>([]); // Выбранное оборудование для массовых операций
const showBulkTransferDialog = ref(false);
const bulkTransferLoading = ref(false);
const bulkTransferForm = ref();

// Данные для массового переноса
const bulkTransferData = ref({
  from_location: '',
  to_location: '',
  notes: '',
});

const equipment = ref([
  {
    id: 1,
    type: 'GPS-tracker',
    model: 'GT06N',
    brand: 'Concox',
    serial_number: 'GT06N001',
    status: 'in_stock',
    warehouse_location: 'A1-01',
    purchase_price: '2500.00',
  },
  {
    id: 2,
    type: 'IP-camera',
    model: 'DS-2CD2043G2-I',
    brand: 'Hikvision',
    serial_number: 'HIK2043001',
    status: 'in_stock',
    warehouse_location: 'B2-03',
    purchase_price: '8500.00',
  },
  {
    id: 3,
    type: 'GPS-tracker',
    model: 'Teltonika FMB920',
    brand: 'Teltonika',
    serial_number: 'FMB920001',
    status: 'installed',
    warehouse_location: '',
    purchase_price: '4200.00',
  },
  {
    id: 4,
    type: 'Sensor',
    model: 'PIR-Motion-01',
    brand: 'Generic',
    serial_number: 'PIR001',
    status: 'in_stock',
    warehouse_location: 'C1-05',
    purchase_price: '850.00',
  },
  {
    id: 5,
    type: 'Cable',
    model: 'UTP Cat6',
    brand: 'CommScope',
    serial_number: 'CAT6-305M-001',
    status: 'in_stock',
    warehouse_location: 'D3-01',
    purchase_price: '12500.00',
  },
  {
    id: 6,
    type: 'Switch',
    model: 'TL-SG1008D',
    brand: 'TP-Link',
    serial_number: 'TPSG1008001',
    status: 'reserved',
    warehouse_location: 'E1-02',
    purchase_price: '1200.00',
  },
  {
    id: 7,
    type: 'GPS-tracker',
    model: 'GT06N',
    brand: 'Concox',
    serial_number: 'GT06N002',
    status: 'maintenance',
    warehouse_location: 'A1-02',
    purchase_price: '2500.00',
  },
  {
    id: 8,
    type: 'IP-camera',
    model: 'DS-2CD2043G2-I',
    brand: 'Hikvision',
    serial_number: 'HIK2043002',
    status: 'broken',
    warehouse_location: 'F1-01',
    purchase_price: '8500.00',
  },
]);

const operations = ref([
  {
    id: 1,
    type: 'receive',
    description: 'Поступление нового оборудования от поставщика',
    from_location: 'Поставщик',
    to_location: 'A1-01',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    type: 'issue',
    description: 'Выдача оборудования для монтажа',
    from_location: 'A1-03',
    to_location: 'Объект ТЦ Галерея',
    created_at: '2024-03-15T14:30:00Z',
  },
  {
    id: 3,
    type: 'transfer',
    description: 'Перемещение оборудования между полками',
    from_location: 'E2-01',
    to_location: 'E1-02',
    created_at: '2024-03-10T09:15:00Z',
  },
]);

const alerts = ref([
  {
    id: 1,
    type: 'low_stock',
    title: 'Низкий остаток IP-камер',
    description: 'На складе осталось только 3 IP-камеры модели DS-2CD2043G2-I',
    severity: 'high',
    created_at: '2024-03-20T10:00:00Z',
  },
  {
    id: 2,
    type: 'expired_warranty',
    title: 'Истекла гарантия на оборудование',
    description: 'У GPS трекера GT06N002 истекла гарантия',
    severity: 'medium',
    created_at: '2024-03-15T00:00:00Z',
  },
  {
    id: 3,
    type: 'maintenance_due',
    title: 'Требуется обслуживание',
    description: 'IP-камера HIK2043002 требует планового обслуживания',
    severity: 'low',
    created_at: '2024-03-22T08:00:00Z',
  },
]);

const categories = ref([
  {
    id: 1,
    name: 'GPS-трекеры',
    description: 'GPS трекеры для мониторинга транспорта и объектов',
    code: 'GPS',
    min_stock_level: 15,
  },
  {
    id: 2,
    name: 'IP-камеры',
    description: 'IP камеры видеонаблюдения различных типов',
    code: 'CAM',
    min_stock_level: 10,
  },
  {
    id: 3,
    name: 'Датчики',
    description: 'Датчики движения, температуры, влажности',
    code: 'SENS',
    min_stock_level: 20,
  },
]);

// Локации склада для переноса
const warehouseLocations = [
  { value: 'A1-01', title: 'Зона A, стеллаж 1, полка 01' },
  { value: 'A1-02', title: 'Зона A, стеллаж 1, полка 02' },
  { value: 'A1-03', title: 'Зона A, стеллаж 1, полка 03' },
  { value: 'B2-01', title: 'Зона B, стеллаж 2, полка 01' },
  { value: 'B2-02', title: 'Зона B, стеллаж 2, полка 02' },
  { value: 'B2-03', title: 'Зона B, стеллаж 2, полка 03' },
  { value: 'C1-01', title: 'Зона C, стеллаж 1, полка 01' },
  { value: 'C1-05', title: 'Зона C, стеллаж 1, полка 05' },
  { value: 'C1-06', title: 'Зона C, стеллаж 1, полка 06' },
  { value: 'D3-01', title: 'Зона D, стеллаж 3, полка 01' },
  { value: 'E1-02', title: 'Зона E, стеллаж 1, полка 02' },
  { value: 'F1-01', title: 'Зона F, стеллаж 1, полка 01' },
];

// Правила валидации
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
};

// Заголовки таблицы оборудования
const equipmentHeaders = [
  { title: '', key: 'select', sortable: false, width: '50px' },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Модель', key: 'model', sortable: true },
  { title: 'Бренд', key: 'brand', sortable: true },
  { title: 'Серийный №', key: 'serial_number', sortable: true },
  { title: 'Статус', key: 'status', sortable: true },
  { title: 'Локация', key: 'warehouse_location', sortable: true },
  { title: 'Цена', key: 'purchase_price', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false, width: '150px' },
];

// Вычисляемые свойства
const activeAlerts = computed(() =>
  alerts.value.filter(alert => alert.severity === 'high' || alert.severity === 'critical').length
);

const filteredEquipment = computed(() => {
  if (!searchQuery.value) return equipment.value;

  const search = searchQuery.value.toLowerCase();
  return equipment.value.filter(item =>
    item.model.toLowerCase().includes(search) ||
    item.brand.toLowerCase().includes(search) ||
    item.serial_number.toLowerCase().includes(search) ||
    item.type.toLowerCase().includes(search)
  );
});

// Вычисляемые свойства для массовых операций
const selectedEquipmentItems = computed(() =>
  equipment.value.filter(item => selectedEquipment.value.includes(item.id))
);

const isIndeterminate = computed(() =>
  selectedEquipment.value.length > 0 && selectedEquipment.value.length < filteredEquipment.value.length
);

const canBulkTransfer = computed(() =>
  selectedEquipmentItems.value.some(item => item.status === 'in_stock' || item.status === 'reserved')
);

const canBulkReserve = computed(() =>
  selectedEquipmentItems.value.some(item => item.status === 'in_stock')
);

const canBulkSetAvailable = computed(() =>
  selectedEquipmentItems.value.some(item => item.status === 'reserved' || item.status === 'maintenance')
);

const hasInstalledEquipment = computed(() =>
  selectedEquipmentItems.value.some(item => item.status === 'installed')
);

const hasBrokenEquipment = computed(() =>
  selectedEquipmentItems.value.some(item => item.status === 'broken')
);

const transferableCount = computed(() =>
  selectedEquipmentItems.value.filter(item =>
    item.status === 'in_stock' || item.status === 'reserved'
  ).length
);

const currentLocations = computed(() => {
  const locations = [...new Set(selectedEquipmentItems.value.map(item => item.warehouse_location))];
  return locations.filter(loc => loc).map(loc => ({ value: loc, title: loc }));
});

// Утилиты
const getTypeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'GPS-tracker': 'mdi-crosshairs-gps',
    'IP-camera': 'mdi-camera',
    'Sensor': 'mdi-radar',
    'Cable': 'mdi-cable-data',
    'Switch': 'mdi-switch',
  };
  return iconMap[type] || 'mdi-package-variant';
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'in_stock': 'success',
    'reserved': 'warning',
    'installed': 'info',
    'maintenance': 'purple',
    'broken': 'error',
  };
  return colorMap[status] || 'grey';
};

const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    'in_stock': 'В наличии',
    'reserved': 'Зарезервировано',
    'installed': 'Установлено',
    'maintenance': 'На обслуживании',
    'broken': 'Сломано',
  };
  return labelMap[status] || status;
};

const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    'GPS-tracker': 'GPS-трекер',
    'IP-camera': 'IP-камера',
    'Sensor': 'Датчик',
    'Cable': 'Кабель',
    'Switch': 'Коммутатор',
  };
  return labelMap[type] || type;
};

const getOperationColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'receive': 'success',
    'issue': 'info',
    'transfer': 'warning',
    'inventory': 'purple',
    'maintenance': 'orange',
    'disposal': 'error',
  };
  return colorMap[type] || 'grey';
};

const getOperationIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'receive': 'mdi-package-down',
    'issue': 'mdi-package-up',
    'transfer': 'mdi-swap-horizontal',
    'inventory': 'mdi-clipboard-list',
    'maintenance': 'mdi-wrench',
    'disposal': 'mdi-delete',
  };
  return iconMap[type] || 'mdi-swap-horizontal';
};

const getOperationLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    'receive': 'Поступление',
    'issue': 'Выдача',
    'transfer': 'Перемещение',
    'inventory': 'Инвентаризация',
    'maintenance': 'Обслуживание',
    'disposal': 'Списание',
  };
  return labelMap[type] || type;
};

const getSeverityColor = (severity: string) => {
  const colorMap: Record<string, string> = {
    'low': 'info',
    'medium': 'warning',
    'high': 'orange',
    'critical': 'error',
  };
  return colorMap[severity] || 'grey';
};

const getSeverityLabel = (severity: string) => {
  const labelMap: Record<string, string> = {
    'low': 'Низкий',
    'medium': 'Средний',
    'high': 'Высокий',
    'critical': 'Критический',
  };
  return labelMap[severity] || severity;
};

const getAlertIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'low_stock': 'mdi-package-variant',
    'expired_warranty': 'mdi-shield-alert',
    'maintenance_due': 'mdi-wrench-clock',
    'equipment_movement': 'mdi-swap-horizontal',
  };
  return iconMap[type] || 'mdi-alert';
};

const getAlertCardClass = (alert: any) => {
  if (alert.severity === 'critical') return 'alert-card--critical';
  if (alert.severity === 'high') return 'alert-card--high';
  return '';
};

const formatPrice = (price: string) => {
  const num = parseFloat(price);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU');
};

// Методы для работы с выбором
const isSelected = (id: number) => selectedEquipment.value.includes(id);

const canSelectItem = (item: any) => {
  // Можно выбирать только оборудование, которое не установлено
  return item.status !== 'installed';
};

const toggleSelection = (id: number) => {
  const index = selectedEquipment.value.indexOf(id);
  if (index > -1) {
    selectedEquipment.value.splice(index, 1);
  } else {
    const item = equipment.value.find(eq => eq.id === id);
    if (item && canSelectItem(item)) {
      selectedEquipment.value.push(id);
    }
  }
};

const toggleSelectAll = (value: boolean | null) => {
  if (value) {
    selectedEquipment.value = filteredEquipment.value
      .filter(item => canSelectItem(item))
      .map(item => item.id);
  } else {
    selectedEquipment.value = [];
  }
};

const clearSelection = () => {
  selectedEquipment.value = [];
};

const getEquipmentWord = (count: number) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'единиц';
  }

  switch (lastDigit) {
    case 1: return 'единица';
    case 2:
    case 3:
    case 4: return 'единицы';
    default: return 'единиц';
  }
};

// Обработчики действий
const viewEquipment = (item: any) => {
  console.log('Просмотр оборудования:', item.id);
  // TODO: Открыть диалог просмотра
};

const editEquipment = (item: any) => {
  console.log('Редактирование оборудования:', item.id);
  // TODO: Открыть диалог редактирования
};

const installEquipment = (item: any) => {
  console.log('Установка оборудования:', item.id);
  // TODO: Открыть диалог установки
};

const transferEquipment = (item: any) => {
  console.log('Перемещение оборудования:', item.id);
  // TODO: Открыть диалог перемещения
};

const refreshEquipment = () => {
  console.log('Обновление списка оборудования');
  // TODO: Перезагрузить данные
};

const searchByQR = () => {
  console.log('Поиск по QR коду:', qrCode.value);
  showQRDialog.value = false;
  // TODO: Найти оборудование по QR коду
};

// Обработчики массовых операций
const bulkReserve = async () => {
  const availableItems = selectedEquipmentItems.value.filter(item => item.status === 'in_stock');
  console.log(`Резервирование ${availableItems.length} единиц оборудования:`, availableItems.map(i => i.model));

  // Симуляция операции
  availableItems.forEach(item => {
    const equipmentItem = equipment.value.find(eq => eq.id === item.id);
    if (equipmentItem) {
      equipmentItem.status = 'reserved';
    }
  });

  clearSelection();
  // TODO: Отправить запрос на сервер
};

const bulkSetAvailable = async () => {
  const reservedItems = selectedEquipmentItems.value.filter(item =>
    item.status === 'reserved' || item.status === 'maintenance'
  );
  console.log(`Освобождение ${reservedItems.length} единиц оборудования:`, reservedItems.map(i => i.model));

  // Симуляция операции
  reservedItems.forEach(item => {
    const equipmentItem = equipment.value.find(eq => eq.id === item.id);
    if (equipmentItem) {
      equipmentItem.status = 'in_stock';
    }
  });

  clearSelection();
  // TODO: Отправить запрос на сервер
};

const executeBulkTransfer = async () => {
  if (!bulkTransferData.value.to_location) return;

  try {
    bulkTransferLoading.value = true;

    const transferableItems = selectedEquipmentItems.value.filter(item =>
      item.status === 'in_stock' || item.status === 'reserved'
    );

    console.log(`Массовый перенос ${transferableItems.length} единиц оборудования:`);
    console.log('- Откуда:', currentLocations.value.map(l => l.value));
    console.log('- Куда:', bulkTransferData.value.to_location);
    console.log('- Причина:', bulkTransferData.value.notes);
    console.log('- Оборудование:', transferableItems.map(i => `${i.model} (${i.serial_number})`));

    // Симуляция переноса
    transferableItems.forEach(item => {
      const equipmentItem = equipment.value.find(eq => eq.id === item.id);
      if (equipmentItem) {
        equipmentItem.warehouse_location = bulkTransferData.value.to_location;
      }
    });

    // Создаем операции для каждого элемента
    const newOperations = transferableItems.map(item => ({
      id: Date.now() + Math.random(),
      type: 'transfer',
      description: `Массовый перенос: ${item.model}`,
      from_location: item.warehouse_location,
      to_location: bulkTransferData.value.to_location,
      created_at: new Date().toISOString(),
    }));

    operations.value.unshift(...newOperations);

    // Очищаем форму и выбор
    bulkTransferData.value = {
      from_location: '',
      to_location: '',
      notes: '',
    };
    clearSelection();
    showBulkTransferDialog.value = false;

    // TODO: Отправить запрос на сервер
    console.log('✅ Массовый перенос выполнен успешно');

  } catch (error) {
    console.error('Ошибка массового переноса:', error);
  } finally {
    bulkTransferLoading.value = false;
  }
};

// Watchers
watch(viewMode, (newMode) => {
  localStorage.setItem('warehouse-view-mode', newMode);
});

watch(activeTab, async (newTab) => {
  localStorage.setItem('warehouse-active-tab', newTab);
  
  // Загружаем данные SIM-карт при переключении на вкладку
  if (newTab === 'sim-cards') {
    // Ждем, пока компонент отрендерится
    await nextTick();
    setTimeout(() => {
      simCardsListRef.value?.loadSimCards?.();
    }, 100);
  }
});

// Инициализация
onMounted(async () => {
  console.log('Страница склада загружена успешно');
  console.log('Режим просмотра:', viewMode.value);
  
  // Если активная вкладка - SIM-карты, загружаем данные после монтирования
  if (activeTab.value === 'sim-cards') {
    // Ждем, пока компонент отрендерится
    await nextTick();
    setTimeout(() => {
      simCardsListRef.value?.loadSimCards?.();
    }, 200);
  }
});
</script>

<style scoped>
.warehouse-page {
  padding: 24px;
}

.page-header {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
}

.equipment-card {
  height: 100%;
  transition: all 0.3s ease;
}

.equipment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.equipment-card--selected {
  border: 2px solid rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.bulk-actions-panel {
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.equipment-controls {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
  padding: 16px;
}

.equipment-table {
  min-height: 400px;
}

/* Стили для выравнивания в таблице */
.equipment-table :deep(.v-data-table__td) {
  vertical-align: middle !important;
  padding: 8px 16px !important;
}

.equipment-table :deep(.v-data-table__th) {
  vertical-align: middle !important;
  padding: 12px 16px !important;
}

/* Центрирование чекбоксов */
.equipment-table :deep(.v-data-table__td:first-child),
.equipment-table :deep(.v-data-table__th:first-child) {
  text-align: center !important;
  padding: 8px !important;
}

.equipment-grid {
  min-height: 400px;
}

.equipment-info {
  min-height: 80px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  min-height: 20px;
}

.selected-equipment-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
}

.operation-card {
  transition: all 0.2s ease;
}

.operation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.alert-card {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.alert-card--critical {
  border-left-color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.05);
}

.alert-card--high {
  border-left-color: rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.05);
}

/* Адаптивность */
@media (max-width: 768px) {
  .warehouse-page {
    padding: 16px;
  }

  .page-header {
    padding: 16px;
  }

  .page-header .d-flex {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
