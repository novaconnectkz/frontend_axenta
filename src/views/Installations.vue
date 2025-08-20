<template>
  <div class="installations-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-tools" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Планирование монтажей</h1>
          <p class="page-subtitle">Управление монтажами, монтажниками и оборудованием</p>
        </div>
      </div>

      <div class="page-actions">
        <AppleButton variant="secondary" prepend-icon="mdi-calendar-today" @click="goToToday"
          data-testid="today-button">
          Сегодня
        </AppleButton>
        <AppleButton prepend-icon="mdi-plus" @click="openCreateDialog" data-testid="create-installation">
          Новый монтаж
        </AppleButton>
      </div>
    </div>

    <!-- Уведомление о демо режиме -->
    <v-alert v-if="isDemoMode" type="info" variant="tonal" class="mb-4 demo-alert" closable
      @click:close="hideDemoAlert = true" v-show="!hideDemoAlert">
      <template #prepend>
        <v-icon>mdi-information</v-icon>
      </template>
      <div class="demo-alert-content">
        <strong>Демо режим активен</strong>
        <p class="mb-0">Отображаются демонстрационные данные для ознакомления с интерфейсом управления монтажами.</p>
      </div>
    </v-alert>

    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard v-for="stat in stats" :key="stat.key" :title="stat.value.toString()" :subtitle="stat.label"
          :icon="stat.icon" :icon-color="stat.color" variant="outlined" class="stat-card" />
      </div>
    </div>

    <!-- Вкладки -->
    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="calendar">
        <v-icon class="mr-2">mdi-calendar</v-icon>
        Календарь
      </v-tab>
      <v-tab value="list">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        Список монтажей
      </v-tab>
      <v-tab value="installers">
        <v-icon class="mr-2">mdi-account-hard-hat</v-icon>
        Монтажники
      </v-tab>
      <v-tab value="equipment">
        <v-icon class="mr-2">mdi-tools</v-icon>
        Оборудование
      </v-tab>
    </v-tabs>

    <!-- Содержимое вкладок -->
    <v-tabs-window v-model="activeTab">
      <!-- Календарь -->
      <v-tabs-window-item value="calendar">
        <InstallationCalendar :installations="installations" :installers="installers" :loading="loading"
          @installation-click="openInstallationDialog" @date-click="openCreateDialogForDate"
          @installation-drop="handleInstallationDrop" />
      </v-tabs-window-item>

      <!-- Список монтажей -->
      <v-tabs-window-item value="list">
        <InstallationsList :installations="installations" :loading="loading"
          @installation-click="openInstallationDialog" @installation-edit="openEditDialog"
          @installation-delete="handleDelete" @installation-start="handleStart"
          @installation-complete="openCompleteDialog" @installation-cancel="openCancelDialog" />
      </v-tabs-window-item>

      <!-- Монтажники -->
      <v-tabs-window-item value="installers">
        <InstallersList :installers="installers" :loading="loading" @installer-click="openInstallerDialog"
          @installer-edit="openInstallerEditDialog" @installer-delete="handleInstallerDelete"
          @installer-toggle="handleInstallerToggle" />
      </v-tabs-window-item>

      <!-- Оборудование -->
      <v-tabs-window-item value="equipment">
        <EquipmentList :equipment="equipment" :loading="loading" @equipment-click="openEquipmentDialog"
          @equipment-edit="openEquipmentEditDialog" @equipment-delete="handleEquipmentDelete"
          @equipment-install="handleEquipmentInstall" />
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- Диалог создания/редактирования монтажа -->
    <InstallationDialog v-model="showInstallationDialog" :installation="selectedInstallation" :installers="installers"
      :locations="locations" :equipment="availableEquipment" @save="handleInstallationSave" />

    <!-- Диалог просмотра монтажа -->
    <InstallationViewDialog v-model="showViewDialog" :installation="selectedInstallation" />

    <!-- Диалог завершения монтажа -->
    <CompleteInstallationDialog v-model="showCompleteDialog" :installation="selectedInstallation"
      @complete="handleComplete" />

    <!-- Диалог отмены монтажа -->
    <CancelInstallationDialog v-model="showCancelDialog" :installation="selectedInstallation" @cancel="handleCancel" />

    <!-- Диалог монтажника -->
    <InstallerDialog v-model="showInstallerDialog" :installer="selectedInstaller" :locations="locations"
      @save="handleInstallerSave" />

    <!-- Диалог просмотра монтажника -->
    <InstallerViewDialog v-model="showInstallerViewDialog" :installer="selectedInstaller" />

    <!-- Диалог оборудования -->
    <EquipmentDialog v-model="showEquipmentDialog" :equipment="selectedEquipment" @save="handleEquipmentSave" />

    <!-- Диалог просмотра оборудования -->
    <EquipmentViewDialog v-model="showEquipmentViewDialog" :equipment="selectedEquipment" />
  </div>
</template>

<script setup lang="ts">
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import { installationsService } from "@/services/installationsService";
import type {
  CancelInstallationForm,
  CompleteInstallationForm,
  EquipmentBase,
  EquipmentForm,
  InstallationForm,
  InstallationStats,
  InstallationWithRelations,
  InstallerForm,
  InstallerWithRelations,
  LocationBase,
} from "@/types/installations";
import { useErrorHandler } from "@/utils/errorHandler";
import { computed, onMounted, ref } from "vue";

// Импорт компонентов
import CancelInstallationDialog from "@/components/Installations/CancelInstallationDialog.vue";
import CompleteInstallationDialog from "@/components/Installations/CompleteInstallationDialog.vue";
import EquipmentDialog from "@/components/Installations/EquipmentDialog.vue";
import EquipmentList from "@/components/Installations/EquipmentList.vue";
import EquipmentViewDialog from "@/components/Installations/EquipmentViewDialog.vue";
import InstallationCalendar from "@/components/Installations/InstallationCalendar.vue";
import InstallationDialog from "@/components/Installations/InstallationDialog.vue";
import InstallationsList from "@/components/Installations/InstallationsList.vue";
import InstallationViewDialog from "@/components/Installations/InstallationViewDialog.vue";
import InstallerDialog from "@/components/Installations/InstallerDialog.vue";
import InstallersList from "@/components/Installations/InstallersList.vue";
import InstallerViewDialog from "@/components/Installations/InstallerViewDialog.vue";

// Состояние компонента
const activeTab = ref("calendar");
const loading = ref(false);
const hideDemoAlert = ref(false);

// Данные
const installations = ref<InstallationWithRelations[]>([]);
const installers = ref<InstallerWithRelations[]>([]);
const equipment = ref<EquipmentBase[]>([]);
const locations = ref<LocationBase[]>([]);
const installationStats = ref<InstallationStats | null>(null);

// Диалоги
const showInstallationDialog = ref(false);
const showViewDialog = ref(false);
const showCompleteDialog = ref(false);
const showCancelDialog = ref(false);
const showInstallerDialog = ref(false);
const showInstallerViewDialog = ref(false);
const showEquipmentDialog = ref(false);
const showEquipmentViewDialog = ref(false);

// Выбранные элементы
const selectedInstallation = ref<InstallationWithRelations | null>(null);
const selectedInstaller = ref<InstallerWithRelations | null>(null);
const selectedEquipment = ref<EquipmentBase | null>(null);

// Доступное оборудование для монтажей
const availableEquipment = computed(() =>
  equipment.value.filter(item => item.status === "in_stock" || item.status === "reserved")
);

// Статистика для отображения
const stats = computed(() => {
  if (!installationStats.value) return [];

  const stats = installationStats.value;
  return [
    {
      key: "total",
      label: "Всего монтажей",
      value: stats.total,
      icon: "mdi-tools",
      color: "primary"
    },
    {
      key: "today",
      label: "Сегодня",
      value: stats.today,
      icon: "mdi-calendar-today",
      color: "success"
    },
    {
      key: "overdue",
      label: "Просроченные",
      value: stats.overdue,
      icon: "mdi-clock-alert",
      color: "error"
    },
    {
      key: "completion_rate",
      label: "Завершенность",
      value: `${Math.round(stats.completion_rate)}%`,
      icon: "mdi-check-circle",
      color: "info"
    }
  ];
});

// Обработчик ошибок
const { handleError } = useErrorHandler();

// Проверка демо режима
const isDemoMode = computed(() => installationsService.isMockMode());

// Загрузка данных
const loadData = async () => {
  loading.value = true;
  try {
    const [installationsRes, installersRes, equipmentRes, locationsRes, statsRes] = await Promise.all([
      installationsService.getInstallations(1, 1000),
      installationsService.getInstallers(1, 1000),
      installationsService.getEquipment(1, 1000),
      installationsService.getLocations(1, 1000),
      installationsService.getInstallationStats(),
    ]);

    installations.value = installationsRes.items;
    installers.value = installersRes.items;
    equipment.value = equipmentRes.items;
    locations.value = locationsRes.items;
    installationStats.value = statsRes;
  } catch (error) {
    handleError(error, "Ошибка загрузки данных");
  } finally {
    loading.value = false;
  }
};

// Обработчики диалогов

const openCreateDialog = () => {
  selectedInstallation.value = null;
  showInstallationDialog.value = true;
};

const openCreateDialogForDate = (_date: string) => {
  selectedInstallation.value = null;
  showInstallationDialog.value = true;
  // TODO: предустановить дату в диалоге
};

const openEditDialog = (installation: InstallationWithRelations) => {
  selectedInstallation.value = installation;
  showInstallationDialog.value = true;
};

const openInstallationDialog = (installation: InstallationWithRelations) => {
  selectedInstallation.value = installation;
  showViewDialog.value = true;
};

const openCompleteDialog = (installation: InstallationWithRelations) => {
  selectedInstallation.value = installation;
  showCompleteDialog.value = true;
};

const openCancelDialog = (installation: InstallationWithRelations) => {
  selectedInstallation.value = installation;
  showCancelDialog.value = true;
};

const openInstallerDialog = (installer?: InstallerWithRelations) => {
  selectedInstaller.value = installer || null;
  showInstallerViewDialog.value = !!installer;
  showInstallerDialog.value = !installer;
};

const openInstallerEditDialog = (installer: InstallerWithRelations) => {
  selectedInstaller.value = installer;
  showInstallerDialog.value = true;
};

const openEquipmentDialog = (equipment?: EquipmentBase) => {
  selectedEquipment.value = equipment || null;
  showEquipmentViewDialog.value = !!equipment;
  showEquipmentDialog.value = !equipment;
};

const openEquipmentEditDialog = (equipmentItem: EquipmentBase) => {
  selectedEquipment.value = equipmentItem;
  showEquipmentDialog.value = true;
};

// Обработчики действий

const handleInstallationSave = async (data: InstallationForm) => {
  try {
    if (selectedInstallation.value) {
      await installationsService.updateInstallation(selectedInstallation.value.id, data);
    } else {
      await installationsService.createInstallation(data);
    }
    showInstallationDialog.value = false;
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка сохранения монтажа");
  }
};

const handleDelete = async (installation: InstallationWithRelations) => {
  try {
    await installationsService.deleteInstallation(installation.id);
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка удаления монтажа");
  }
};

const handleStart = async (installation: InstallationWithRelations) => {
  try {
    await installationsService.startInstallation(installation.id);
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка начала монтажа");
  }
};

const handleComplete = async (data: CompleteInstallationForm) => {
  if (!selectedInstallation.value) return;

  try {
    await installationsService.completeInstallation(selectedInstallation.value.id, data);
    showCompleteDialog.value = false;
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка завершения монтажа");
  }
};

const handleCancel = async (data: CancelInstallationForm) => {
  if (!selectedInstallation.value) return;

  try {
    await installationsService.cancelInstallation(selectedInstallation.value.id, data);
    showCancelDialog.value = false;
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка отмены монтажа");
  }
};

const handleInstallationDrop = async (installationId: number, newDate: string, installerId?: number) => {
  try {
    const updateData: Partial<InstallationForm> = {
      scheduled_at: newDate,
    };

    if (installerId) {
      updateData.installer_id = installerId;
    }

    await installationsService.updateInstallation(installationId, updateData);
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка перемещения монтажа");
  }
};

const handleInstallerSave = async (data: InstallerForm) => {
  try {
    if (selectedInstaller.value) {
      await installationsService.updateInstaller(selectedInstaller.value.id, data);
    } else {
      await installationsService.createInstaller(data);
    }
    showInstallerDialog.value = false;
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка сохранения монтажника");
  }
};

const handleInstallerDelete = async (installer: InstallerWithRelations) => {
  try {
    await installationsService.deleteInstaller(installer.id);
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка удаления монтажника");
  }
};

const handleInstallerToggle = async (installer: InstallerWithRelations) => {
  try {
    if (installer.is_active) {
      await installationsService.deactivateInstaller(installer.id);
    } else {
      await installationsService.activateInstaller(installer.id);
    }
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка изменения статуса монтажника");
  }
};

const handleEquipmentSave = async (data: EquipmentForm) => {
  try {
    if (selectedEquipment.value) {
      await installationsService.updateEquipment(selectedEquipment.value.id, data);
    } else {
      await installationsService.createEquipment(data);
    }
    showEquipmentDialog.value = false;
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка сохранения оборудования");
  }
};

const handleEquipmentDelete = async (equipmentItem: EquipmentBase) => {
  try {
    await installationsService.deleteEquipment(equipmentItem.id);
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка удаления оборудования");
  }
};

const handleEquipmentInstall = async (equipmentItem: EquipmentBase, objectId: number) => {
  try {
    await installationsService.installEquipment(equipmentItem.id, objectId);
    await loadData();
  } catch (error) {
    handleError(error, "Ошибка установки оборудования");
  }
};

const goToToday = () => {
  // TODO: реализовать переход к сегодняшней дате в календаре
};

// Загрузка данных при монтировании
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.installations-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  color: rgb(var(--v-theme-primary));
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.page-subtitle {
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 4px 0 0 0;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  min-height: 120px;
}

.demo-alert {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.demo-alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.demo-alert-content strong {
  font-weight: 600;
  color: rgb(var(--v-theme-info));
}

.demo-alert-content p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .installations-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .page-actions {
    justify-content: stretch;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
