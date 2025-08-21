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
          <v-btn
            color="success"
            prepend-icon="mdi-plus"
            @click="showCreateEquipmentDialog = true"
          >
            Добавить оборудование
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-qrcode-scan"
            @click="showQRScanDialog = true"
          >
            Сканировать QR
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Статистика -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card color="success" variant="tonal">
          <v-card-text class="text-center">
            <v-icon icon="mdi-package-variant" size="40" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ stats.total_equipment }}</div>
            <div class="text-subtitle-2">Всего оборудования</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="info" variant="tonal">
          <v-card-text class="text-center">
            <v-icon icon="mdi-check-circle" size="40" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ stats.available_equipment }}</div>
            <div class="text-subtitle-2">Доступно</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="warning" variant="tonal">
          <v-card-text class="text-center">
            <v-icon icon="mdi-bookmark" size="40" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ stats.reserved_equipment }}</div>
            <div class="text-subtitle-2">Зарезервировано</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card :color="stats.low_stock_alerts > 0 ? 'error' : 'success'" variant="tonal">
          <v-card-text class="text-center">
            <v-icon :icon="stats.low_stock_alerts > 0 ? 'mdi-alert-circle' : 'mdi-shield-check'" size="40" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ stats.low_stock_alerts }}</div>
            <div class="text-subtitle-2">Уведомлений</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Вкладки -->
    <v-card>
      <v-tabs v-model="activeTab" bg-color="primary" show-arrows>
        <v-tab value="equipment">
          <v-icon start icon="mdi-package-variant" />
          Оборудование
        </v-tab>
        <v-tab value="operations">
          <v-icon start icon="mdi-swap-horizontal" />
          Операции
        </v-tab>
        <v-tab value="alerts">
          <v-icon start icon="mdi-alert" />
          Уведомления
          <v-badge
            v-if="activeAlerts > 0"
            :content="activeAlerts"
            color="error"
            class="ml-2"
          />
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
            <EquipmentCatalog 
              :equipment="equipment"
              :categories="categories"
              :loading="equipmentLoading"
              @create="handleCreateEquipment"
              @edit="handleEditEquipment"
              @delete="handleDeleteEquipment"
              @install="handleInstallEquipment"
              @uninstall="handleUninstallEquipment"
              @transfer="handleTransferEquipment"
              @refresh="loadEquipment"
            />
          </v-window-item>

          <!-- Вкладка: Операции -->
          <v-window-item value="operations">
            <WarehouseOperations
              :operations="operations"
              :loading="operationsLoading"
              @create="handleCreateOperation"
              @refresh="loadOperations"
            />
          </v-window-item>

          <!-- Вкладка: Уведомления -->
          <v-window-item value="alerts">
            <WarehouseAlerts
              :alerts="alerts"
              :loading="alertsLoading"
              @acknowledge="handleAcknowledgeAlert"
              @resolve="handleResolveAlert"
              @refresh="loadAlerts"
            />
          </v-window-item>

          <!-- Вкладка: Категории -->
          <v-window-item value="categories">
            <EquipmentCategories
              :categories="categories"
              :loading="categoriesLoading"
              @create="handleCreateCategory"
              @edit="handleEditCategory"
              @delete="handleDeleteCategory"
              @refresh="loadCategories"
            />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Диалоги -->
    <EquipmentDialog
      v-model="showCreateEquipmentDialog"
      :categories="categories"
      @created="handleEquipmentCreated"
    />

    <QRScanDialog
      v-model="showQRScanDialog"
      @scanned="handleQRScanned"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { warehouseService } from '@/services/warehouseService';
import type {
  EquipmentBase,
  EquipmentCategory,
  EquipmentForm,
  EquipmentInstallForm,
  EquipmentTransferForm,
  StockAlert,
  WarehouseOperation,
  WarehouseOperationForm,
} from '@/types/warehouse';
import type { WarehouseStats } from '@/types/dashboard';

// Импорт компонентов
import EquipmentCatalog from '@/components/Warehouse/EquipmentCatalog.vue';
import WarehouseOperations from '@/components/Warehouse/WarehouseOperations.vue';
import WarehouseAlerts from '@/components/Warehouse/WarehouseAlerts.vue';
import EquipmentCategories from '@/components/Warehouse/EquipmentCategories.vue';
import EquipmentDialog from '@/components/Warehouse/EquipmentDialog.vue';
import QRScanDialog from '@/components/Warehouse/QRScanDialog.vue';

// Состояние
const activeTab = ref('equipment');
const showCreateEquipmentDialog = ref(false);
const showQRScanDialog = ref(false);

// Данные
const equipment = ref<EquipmentBase[]>([]);
const operations = ref<WarehouseOperation[]>([]);
const alerts = ref<StockAlert[]>([]);
const categories = ref<EquipmentCategory[]>([]);
const stats = ref<WarehouseStats>({
  total_equipment: 0,
  available_equipment: 0,
  installed_equipment: 0,
  reserved_equipment: 0,
  maintenance_equipment: 0,
  broken_equipment: 0,
  low_stock_alerts: 0,
  categories_count: 0,
  recent_operations: 0,
  by_category: {},
  operations_by_type: {},
  alerts_by_severity: {},
});

// Состояния загрузки
const equipmentLoading = ref(false);
const operationsLoading = ref(false);
const alertsLoading = ref(false);
const categoriesLoading = ref(false);
const statsLoading = ref(false);

// Вычисляемые свойства
const activeAlerts = computed(() => 
  alerts.value.filter(alert => alert.status === 'active').length
);

// Методы загрузки данных
const loadEquipment = async () => {
  try {
    equipmentLoading.value = true;
    const response = await warehouseService.getEquipment();
    equipment.value = response.data;
  } catch (error: any) {
    console.error('Ошибка загрузки оборудования:', error);
  } finally {
    equipmentLoading.value = false;
  }
};

const loadOperations = async () => {
  try {
    operationsLoading.value = true;
    const response = await warehouseService.getWarehouseOperations({ limit: 50 });
    operations.value = response.data;
  } catch (error: any) {
    console.error('Ошибка загрузки операций:', error);
  } finally {
    operationsLoading.value = false;
  }
};

const loadAlerts = async () => {
  try {
    alertsLoading.value = true;
    const response = await warehouseService.getStockAlerts();
    alerts.value = response.data;
  } catch (error: any) {
    console.error('Ошибка загрузки уведомлений:', error);
  } finally {
    alertsLoading.value = false;
  }
};

const loadCategories = async () => {
  try {
    categoriesLoading.value = true;
    categories.value = await warehouseService.getEquipmentCategories();
  } catch (error: any) {
    console.error('Ошибка загрузки категорий:', error);
  } finally {
    categoriesLoading.value = false;
  }
};

const loadStats = async () => {
  try {
    statsLoading.value = true;
    stats.value = await warehouseService.getWarehouseStats();
  } catch (error: any) {
    console.error('Ошибка загрузки статистики:', error);
  } finally {
    statsLoading.value = false;
  }
};

// Обработчики событий оборудования
const handleCreateEquipment = (equipmentData: EquipmentForm) => {
  // Будет обрабатываться в компоненте EquipmentCatalog
  console.log('Создание оборудования:', equipmentData);
};

const handleEditEquipment = (id: number, equipmentData: Partial<EquipmentForm>) => {
  console.log('Редактирование оборудования:', id, equipmentData);
};

const handleDeleteEquipment = async (id: number) => {
  try {
    await warehouseService.deleteEquipment(id);
    await loadEquipment();
    await loadStats();
  } catch (error: any) {
    console.error('Ошибка удаления оборудования:', error);
  }
};

const handleInstallEquipment = async (id: number, data: EquipmentInstallForm) => {
  try {
    await warehouseService.installEquipment(id, data);
    await loadEquipment();
    await loadStats();
  } catch (error: any) {
    console.error('Ошибка установки оборудования:', error);
  }
};

const handleUninstallEquipment = async (id: number) => {
  try {
    await warehouseService.uninstallEquipment(id);
    await loadEquipment();
    await loadStats();
  } catch (error: any) {
    console.error('Ошибка снятия оборудования:', error);
  }
};

const handleTransferEquipment = async (data: EquipmentTransferForm) => {
  try {
    await warehouseService.transferEquipment(data);
    await loadEquipment();
    await loadOperations();
  } catch (error: any) {
    console.error('Ошибка перемещения оборудования:', error);
  }
};

// Обработчики событий операций
const handleCreateOperation = async (operationData: WarehouseOperationForm) => {
  try {
    await warehouseService.createWarehouseOperation(operationData);
    await loadOperations();
    await loadStats();
  } catch (error: any) {
    console.error('Ошибка создания операции:', error);
  }
};

// Обработчики событий уведомлений
const handleAcknowledgeAlert = async (id: number) => {
  try {
    await warehouseService.acknowledgeStockAlert(id);
    await loadAlerts();
  } catch (error: any) {
    console.error('Ошибка подтверждения уведомления:', error);
  }
};

const handleResolveAlert = async (id: number) => {
  try {
    await warehouseService.resolveStockAlert(id);
    await loadAlerts();
    await loadStats();
  } catch (error: any) {
    console.error('Ошибка разрешения уведомления:', error);
  }
};

// Обработчики событий категорий
const handleCreateCategory = async (categoryData: Omit<EquipmentCategory, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    await warehouseService.createEquipmentCategory(categoryData);
    await loadCategories();
  } catch (error: any) {
    console.error('Ошибка создания категории:', error);
  }
};

const handleEditCategory = async (id: number, categoryData: Partial<EquipmentCategory>) => {
  try {
    await warehouseService.updateEquipmentCategory(id, categoryData);
    await loadCategories();
  } catch (error: any) {
    console.error('Ошибка обновления категории:', error);
  }
};

const handleDeleteCategory = async (id: number) => {
  try {
    await warehouseService.deleteEquipmentCategory(id);
    await loadCategories();
  } catch (error: any) {
    console.error('Ошибка удаления категории:', error);
  }
};

// Обработчики диалогов
const handleEquipmentCreated = async () => {
  showCreateEquipmentDialog.value = false;
  await loadEquipment();
  await loadStats();
};

const handleQRScanned = async (qrCode: string) => {
  try {
    const equipment = await warehouseService.searchByQRCode(qrCode);
    // Переключаемся на вкладку оборудования и выделяем найденное
    activeTab.value = 'equipment';
    console.log('Найдено оборудование по QR:', equipment);
  } catch (error: any) {
    console.error('Ошибка поиска по QR коду:', error);
  }
  showQRScanDialog.value = false;
};

// Инициализация
onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadEquipment(),
    loadOperations(),
    loadAlerts(),
    loadCategories(),
  ]);
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

.stat-card {
  text-align: center;
  padding: 16px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
}
</style>
