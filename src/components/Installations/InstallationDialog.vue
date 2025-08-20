<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    persistent
  >
    <AppleCard>
      <template #header>
        <div class="dialog-header">
          <v-icon icon="mdi-tools" class="mr-2" />
          {{ isEditing ? 'Редактирование монтажа' : 'Создание монтажа' }}
        </div>
      </template>

      <v-form ref="form" @submit.prevent="handleSubmit">
        <div class="dialog-content">
          <v-row>
            <!-- Основная информация -->
            <v-col cols="12">
              <h4 class="section-title">Основная информация</h4>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.type"
                :items="typeOptions"
                label="Тип работы"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.priority"
                :items="priorityOptions"
                label="Приоритет"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.scheduled_at"
                label="Дата и время"
                type="datetime-local"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.estimated_duration"
                label="Планируемая длительность (мин)"
                type="number"
                min="15"
                max="480"
                :rules="[rules.required, rules.duration]"
                variant="outlined"
                density="comfortable"
                suffix="мин"
              />
            </v-col>

            <!-- Объект и монтажник -->
            <v-col cols="12">
              <h4 class="section-title">Назначение</h4>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.object_id"
                :items="objectOptions"
                label="Объект мониторинга"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                :loading="loadingObjects"
                @update:search="searchObjects"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon icon="mdi-office-building" />
                    </template>
                    <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.subtitle }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.installer_id"
                :items="availableInstallers"
                label="Монтажник"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                :loading="loadingInstallers"
                @update:model-value="checkInstallerAvailability"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar size="32">
                        <v-icon icon="mdi-account-hard-hat" />
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.subtitle }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
            
            <v-col v-if="installerWarning" cols="12">
              <v-alert
                type="warning"
                variant="tonal"
                density="compact"
              >
                {{ installerWarning }}
              </v-alert>
            </v-col>

            <!-- Местоположение -->
            <v-col cols="12">
              <h4 class="section-title">Местоположение</h4>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.location_id"
                :items="locationOptions"
                label="Локация (город)"
                variant="outlined"
                density="comfortable"
                clearable
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.client_contact"
                label="Контакт клиента"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                placeholder="+7 (900) 123-45-67"
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="formData.address"
                label="Адрес"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                rows="2"
                placeholder="Полный адрес места выполнения работ"
              />
            </v-col>

            <!-- Дополнительная информация -->
            <v-col cols="12">
              <h4 class="section-title">Дополнительная информация</h4>
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Описание работ"
                variant="outlined"
                density="comfortable"
                rows="3"
                placeholder="Детальное описание выполняемых работ"
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Заметки"
                variant="outlined"
                density="comfortable"
                rows="2"
                placeholder="Дополнительные заметки для монтажника"
              />
            </v-col>

            <!-- Стоимость -->
            <v-col cols="12">
              <h4 class="section-title">Стоимость</h4>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-checkbox
                v-model="formData.is_billable"
                label="Платная услуга"
                density="comfortable"
              />
            </v-col>
            
            <v-col v-if="formData.is_billable" cols="12" md="4">
              <v-text-field
                v-model.number="formData.cost"
                label="Общая стоимость"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                prefix="₽"
              />
            </v-col>
            
            <v-col v-if="formData.is_billable" cols="12" md="4">
              <v-text-field
                v-model.number="formData.labor_cost"
                label="Стоимость работ"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                prefix="₽"
              />
            </v-col>

            <!-- Оборудование -->
            <v-col cols="12">
              <h4 class="section-title">Оборудование</h4>
            </v-col>
            
            <v-col cols="12">
              <v-select
                v-model="formData.equipment_ids"
                :items="equipmentOptions"
                label="Необходимое оборудование"
                multiple
                chips
                variant="outlined"
                density="comfortable"
                clearable
              >
                <template #chip="{ props, item }">
                  <v-chip v-bind="props">
                    <template #prepend>
                      <v-icon icon="mdi-tools" size="small" />
                    </template>
                    {{ item.title }}
                  </v-chip>
                </template>
                
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon icon="mdi-tools" />
                    </template>
                    <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.subtitle }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
          </v-row>
        </div>
      </v-form>

      <template #actions>
        <div class="dialog-actions">
          <AppleButton
            variant="secondary"
            @click="handleCancel"
          >
            Отмена
          </AppleButton>
          
          <AppleButton
            type="submit"
            :loading="saving"
            @click="handleSubmit"
          >
            {{ isEditing ? 'Сохранить' : 'Создать' }}
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import { installationsService } from "@/services/installationsService";
import { objectsService } from "@/services/objectsService";
import type {
    EquipmentBase,
    InstallationForm,
    InstallationWithRelations,
    InstallerWithRelations,
    LocationBase,
} from "@/types/installations";
import type { ObjectWithRelations } from "@/types/objects";
import { useErrorHandler } from "@/utils/errorHandler";
import { debounce } from "lodash-es";
import { computed, onMounted, ref, watch } from "vue";

interface Props {
  modelValue: boolean;
  installation?: InstallationWithRelations | null;
  installers: InstallerWithRelations[];
  locations: LocationBase[];
  equipment: EquipmentBase[];
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "save", data: InstallationForm): void;
}

const props = withDefaults(defineProps<Props>(), {
  installation: null,
});

const emit = defineEmits<Emits>();

// Состояние формы
const form = ref();
const saving = ref(false);
const loadingObjects = ref(false);
const loadingInstallers = ref(false);

// Данные для автокомплита объектов
const objects = ref<ObjectWithRelations[]>([]);
const installerWarning = ref("");

// Форма данных
const formData = ref<InstallationForm>({
  type: "монтаж",
  priority: "normal",
  scheduled_at: "",
  estimated_duration: 60,
  object_id: 0,
  installer_id: 0,
  location_id: undefined,
  client_contact: "",
  address: "",
  description: "",
  notes: "",
  is_billable: false,
  cost: 0,
  labor_cost: 0,
  materials_cost: 0,
  equipment_ids: [],
});

// Правила валидации
const rules = {
  required: (value: any) => !!value || "Поле обязательно для заполнения",
  duration: (value: number) => {
    if (!value) return "Поле обязательно для заполнения";
    if (value < 15) return "Минимальная длительность 15 минут";
    if (value > 480) return "Максимальная длительность 8 часов";
    return true;
  },
};

// Вычисляемые свойства
const isEditing = computed(() => !!props.installation);

// Опции для селектов
const typeOptions = [
  { title: "Монтаж", value: "монтаж" },
  { title: "Диагностика", value: "диагностика" },
  { title: "Демонтаж", value: "демонтаж" },
  { title: "Обслуживание", value: "обслуживание" },
];

const priorityOptions = [
  { title: "Низкий", value: "low" },
  { title: "Обычный", value: "normal" },
  { title: "Высокий", value: "high" },
  { title: "Срочный", value: "urgent" },
];

const locationOptions = computed(() =>
  props.locations.map(location => ({
    title: `${location.city}, ${location.region}`,
    value: location.id,
  }))
);

const equipmentOptions = computed(() =>
  props.equipment.map(item => ({
    title: `${item.brand} ${item.model}`,
    subtitle: `${item.type} - ${item.serial_number}`,
    value: item.id,
  }))
);

const objectOptions = computed(() =>
  objects.value.map(object => ({
    title: object.name,
    subtitle: `${object.type}${object.imei ? ` - IMEI: ${object.imei}` : ''}`,
    value: object.id,
  }))
);

// Доступные монтажники (фильтруем по дате и времени)
const availableInstallers = computed(() => {
  if (!formData.value.scheduled_at) {
    return props.installers.map(installer => ({
      title: `${installer.first_name} ${installer.last_name}`,
      subtitle: `${installer.type} - ${installer.specialization.join(', ')}`,
      value: installer.id,
    }));
  }

  // TODO: Здесь можно добавить проверку доступности монтажника на выбранную дату
  return props.installers.map(installer => ({
    title: `${installer.first_name} ${installer.last_name}`,
    subtitle: `${installer.type} - ${installer.specialization.join(', ')}`,
    value: installer.id,
  }));
});

// Обработчик ошибок
const { handleError } = useErrorHandler();

// Поиск объектов
const searchObjects = debounce(async (search: string) => {
  if (!search || search.length < 2) return;
  
  loadingObjects.value = true;
  try {
    const response = await objectsService.getObjects(1, 20, { search });
    objects.value = response.data.items;
  } catch (error) {
    handleError(error, "Ошибка поиска объектов");
  } finally {
    loadingObjects.value = false;
  }
}, 300);

// Проверка доступности монтажника
const checkInstallerAvailability = async (installerId: number) => {
  if (!installerId || !formData.value.scheduled_at) {
    installerWarning.value = "";
    return;
  }

  try {
    const date = new Date(formData.value.scheduled_at).toISOString().split('T')[0];
    const workload = await installationsService.getInstallerWorkload(installerId, date);
    
    if (workload.workload_percentage > 80) {
      installerWarning.value = `Монтажник сильно загружен на эту дату (${workload.workload_percentage}%)`;
    } else if (workload.workload_percentage > 50) {
      installerWarning.value = `Монтажник загружен на эту дату (${workload.workload_percentage}%)`;
    } else {
      installerWarning.value = "";
    }
  } catch (error) {
    installerWarning.value = "";
  }
};

// Инициализация формы
const initializeForm = () => {
  if (props.installation) {
    // Редактирование существующего монтажа
    const installation = props.installation;
    const scheduledDate = new Date(installation.scheduled_at);
    
    formData.value = {
      type: installation.type,
      priority: installation.priority,
      scheduled_at: scheduledDate.toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
      estimated_duration: installation.estimated_duration,
      object_id: installation.object_id,
      installer_id: installation.installer_id,
      location_id: installation.location_id || undefined,
      client_contact: installation.client_contact,
      address: installation.address,
      description: installation.description || "",
      notes: installation.notes || "",
      is_billable: installation.is_billable,
      cost: installation.cost || 0,
      labor_cost: installation.labor_cost || 0,
      materials_cost: installation.materials_cost || 0,
      equipment_ids: installation.equipment?.map(eq => eq.id) || [],
    };
    
    // Загружаем объект для отображения в автокомплите
    // Создаем минимальный объект для автокомплита
    objects.value = [{
      ...installation.object,
      created_at: "",
      updated_at: "",
      description: "",
      address: "",
      status: "active" as any,
      is_active: true,
      contract_id: 0,
      location_id: 0,
      settings: "",
      tags: [],
      notes: "",
      external_id: "",
      imei: installation.object.imei || "",
      phone_number: installation.object.phone_number || "",
      serial_number: "",
    }];
  } else {
    // Создание нового монтажа
    const now = new Date();
    now.setMinutes(0, 0, 0); // Округляем до часа
    now.setHours(now.getHours() + 1); // Добавляем час
    
    formData.value = {
      type: "монтаж",
      priority: "normal",
      scheduled_at: now.toISOString().slice(0, 16),
      estimated_duration: 60,
      object_id: 0,
      installer_id: 0,
      location_id: undefined,
      client_contact: "",
      address: "",
      description: "",
      notes: "",
      is_billable: false,
      cost: 0,
      labor_cost: 0,
      materials_cost: 0,
      equipment_ids: [],
    };
    
    objects.value = [];
  }
};

// Обработчики
const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    emit("save", { ...formData.value });
  } catch (error) {
    handleError(error, "Ошибка сохранения монтажа");
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  emit("update:modelValue", false);
};

// Отслеживание изменений
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeForm();
  }
});

watch(() => formData.value.scheduled_at, () => {
  if (formData.value.installer_id) {
    checkInstallerAvailability(formData.value.installer_id);
  }
});

watch(() => formData.value.installer_id, (newId) => {
  if (newId) {
    checkInstallerAvailability(newId);
  }
});

// Загрузка начальных данных объектов
onMounted(async () => {
  try {
    const response = await objectsService.getObjects(1, 50);
    objects.value = response.data.items;
  } catch (error) {
    // Игнорируем ошибку, объекты будут загружены при поиске
  }
});
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-content {
  padding: 24px 0;
  max-height: 70vh;
  overflow-y: auto;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  margin: 0 0 8px 0;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  padding-bottom: 4px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Адаптивность */
@media (max-width: 768px) {
  .dialog-content {
    max-height: 60vh;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
}
</style>
