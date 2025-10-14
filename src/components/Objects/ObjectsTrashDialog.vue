<template>
  <v-dialog
    v-model="dialog"
    max-width="1200px"
    scrollable
    persistent
  >
    <v-card class="trash-dialog">
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-delete" class="me-3" color="error" size="24" />
          <span class="text-h6">Корзина объектов</span>
          <v-chip
            v-if="objectsData"
            :text="objectsData.total.toString()"
            size="small"
            color="error"
            class="ml-3"
          />
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-divider />

      <!-- Поиск и фильтры -->
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="searchQuery"
              label="Поиск в корзине"
              placeholder="Введите название, IMEI или номер телефона..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @input="debouncedSearch"
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center">
            <v-btn
              color="primary"
              variant="outlined"
              @click="refreshData"
              :loading="loading"
              class="me-2"
            >
              <v-icon start icon="mdi-refresh" />
              Обновить
            </v-btn>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">
              {{ objectsData ? `${objectsData.page} из ${Math.ceil(objectsData.total / objectsData.per_page)} страниц` : '' }}
            </span>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- Список объектов в корзине -->
      <v-card-text class="pa-0" style="max-height: 500px;">
        <div v-if="loading" class="d-flex justify-center align-center pa-8">
          <v-progress-circular indeterminate color="primary" />
          <span class="ml-3">Загрузка объектов из корзины...</span>
        </div>

        <div v-else-if="objects.length === 0" class="d-flex flex-column align-center justify-center pa-8">
          <v-icon icon="mdi-delete-empty" size="64" color="grey-lighten-1" />
          <h3 class="text-h6 mt-4 mb-2">Корзина пуста</h3>
          <p class="text-body-2 text-medium-emphasis text-center">
            В корзине нет удаленных объектов
          </p>
        </div>

        <v-list v-else class="trash-objects-list">
          <v-list-item
            v-for="object in objects"
            :key="object.id"
            class="trash-object-item"
          >
            <template #prepend>
              <v-avatar
                :color="getObjectStatusColor(object.status)"
                size="40"
                class="me-3"
              >
                <v-icon :icon="getObjectTypeIcon(object.type)" color="white" />
              </v-avatar>
            </template>

            <v-list-item-title class="text-h6 mb-1">
              {{ object.name }}
            </v-list-item-title>

            <v-list-item-subtitle class="mb-2">
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                  :color="getObjectStatusColor(object.status)"
                  size="small"
                  variant="tonal"
                >
                  {{ getObjectStatusText(object.status) }}
                </v-chip>
                <v-chip
                  v-if="object.type"
                  size="small"
                  variant="outlined"
                >
                  {{ object.type }}
                </v-chip>
                <v-chip
                  v-if="object.imei"
                  size="small"
                  variant="outlined"
                  color="info"
                >
                  IMEI: {{ object.imei }}
                </v-chip>
              </div>
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex flex-column align-end gap-2">
                <div class="text-caption text-medium-emphasis">
                  Удален: {{ formatDate(object.deleted_at) }}
                </div>
                <div class="d-flex gap-1">
                  <v-btn
                    color="success"
                    variant="outlined"
                    size="small"
                    @click="restoreObject(object)"
                    :loading="restoringObjects.includes(object.id)"
                  >
                    <v-icon start icon="mdi-restore" />
                    Восстановить
                  </v-btn>
                  <v-btn
                    color="error"
                    variant="outlined"
                    size="small"
                    @click="confirmPermanentDelete(object)"
                  >
                    <v-icon start icon="mdi-delete-forever" />
                    Удалить
                  </v-btn>
                </div>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <!-- Пагинация -->
        <v-pagination
          v-if="objectsData && objectsData.total > objectsData.per_page"
          v-model="currentPage"
          :length="Math.ceil(objectsData.total / objectsData.per_page)"
          :total-visible="5"
          class="pa-4"
          @update:model-value="handlePageChange"
        />
      </v-card-text>

      <v-divider />

      <!-- Действия -->
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          @click="goToObjectsPage"
        >
          <v-icon start icon="mdi-arrow-left" />
          К списку объектов
        </v-btn>
        <v-btn
          color="primary"
          @click="closeDialog"
        >
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Диалог подтверждения окончательного удаления -->
    <v-dialog
      v-model="showDeleteConfirm"
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-h6">
          <v-icon icon="mdi-alert" color="error" class="me-2" />
          Окончательное удаление
        </v-card-title>
        <v-card-text>
          <p>Вы уверены, что хотите окончательно удалить объект <strong>{{ objectToDelete?.name }}</strong>?</p>
          <p class="text-error">Это действие нельзя отменить!</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="showDeleteConfirm = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="error"
            @click="permanentDeleteObject"
            :loading="deletingObject"
          >
            Удалить навсегда
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar для уведомлений -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ObjectsService } from '@/services/objectsService';
import type { ObjectWithRelations } from '@/types/objects';
import { debounce } from 'lodash-es';

export default defineComponent({
  name: 'ObjectsTrashDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const router = useRouter();
    const objectsService = ObjectsService.getInstance();
    
    // Состояние для snackbar
    const snackbar = ref({
      show: false,
      text: '',
      color: 'info',
      timeout: 5000
    });

    // Локальная реализация showSnackbar
    const showSnackbar = (text: string, color = 'info', timeout?: number) => {
      const defaultTimeouts = {
        error: 6000,
        warning: 5000,
        success: 4000,
        info: 4000,
      };
      
      const finalTimeout = timeout || defaultTimeouts[color as keyof typeof defaultTimeouts] || 5000;
      
      snackbar.value = { 
        show: true, 
        text, 
        color, 
        timeout: finalTimeout 
      };
      
      console.log(`📢 Snackbar: ${text} (${color}, ${finalTimeout}ms)`);
    };

    // Состояние диалога
    const dialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    // Данные
    const objects = ref<ObjectWithRelations[]>([]);
    const objectsData = ref<any>(null);
    const loading = ref(false);
    const searchQuery = ref('');
    const currentPage = ref(1);
    const perPage = ref(20);

    // Состояние операций
    const restoringObjects = ref<number[]>([]);
    const deletingObject = ref(false);
    const showDeleteConfirm = ref(false);
    const objectToDelete = ref<ObjectWithRelations | null>(null);

    // Debounced поиск
    const debouncedSearch = debounce(() => {
      currentPage.value = 1;
      loadObjects();
    }, 500);

    // Загрузка объектов из корзины
    const loadObjects = async () => {
      try {
        loading.value = true;
        console.log('🗑️ Loading deleted objects...', {
          page: currentPage.value,
          per_page: perPage.value,
          search: searchQuery.value
        });

        const response = await objectsService.getDeletedObjects(
          currentPage.value,
          perPage.value,
          searchQuery.value || undefined
        );

        if (response.status === 'success') {
          objects.value = response.data.items || [];
          objectsData.value = response.data;
          console.log('✅ Deleted objects loaded:', {
            count: objects.value.length,
            total: response.data.total
          });
        } else {
          console.error('❌ Error loading deleted objects:', response.error);
          showSnackbar(response.error || 'Ошибка загрузки корзины', 'error');
        }
      } catch (error: any) {
        console.error('💥 Exception loading deleted objects:', error);
        showSnackbar('Ошибка загрузки корзины', 'error');
      } finally {
        loading.value = false;
      }
    };

    // Восстановление объекта
    const restoreObject = async (object: ObjectWithRelations) => {
      try {
        restoringObjects.value.push(object.id);
        console.log('🔄 Restoring object:', object.id);

        const response = await objectsService.restoreObject(object.id);
        
        if (response.status === 'success') {
          showSnackbar(`Объект "${object.name}" восстановлен`, 'success');
          await loadObjects(); // Перезагружаем список
        } else {
          showSnackbar(response.error || 'Ошибка восстановления объекта', 'error');
        }
      } catch (error: any) {
        console.error('💥 Exception restoring object:', error);
        showSnackbar('Ошибка восстановления объекта', 'error');
      } finally {
        restoringObjects.value = restoringObjects.value.filter(id => id !== object.id);
      }
    };

    // Подтверждение окончательного удаления
    const confirmPermanentDelete = (object: ObjectWithRelations) => {
      objectToDelete.value = object;
      showDeleteConfirm.value = true;
    };

    // Окончательное удаление объекта
    const permanentDeleteObject = async () => {
      if (!objectToDelete.value) return;

      try {
        deletingObject.value = true;
        console.log('🗑️ Permanently deleting object:', objectToDelete.value.id);

        const response = await objectsService.permanentDeleteObject(objectToDelete.value.id);
        
        if (response.status === 'success') {
          showSnackbar(`Объект "${objectToDelete.value.name}" удален навсегда`, 'success');
          await loadObjects(); // Перезагружаем список
        } else {
          showSnackbar(response.error || 'Ошибка удаления объекта', 'error');
        }
      } catch (error: any) {
        console.error('💥 Exception permanently deleting object:', error);
        showSnackbar('Ошибка удаления объекта', 'error');
      } finally {
        deletingObject.value = false;
        showDeleteConfirm.value = false;
        objectToDelete.value = null;
      }
    };

    // Обработчики
    const handlePageChange = (page: number) => {
      currentPage.value = page;
      loadObjects();
    };

    const refreshData = () => {
      loadObjects();
    };

    const closeDialog = () => {
      dialog.value = false;
    };

    const goToObjectsPage = () => {
      router.push('/objects');
      closeDialog();
    };

    // Утилиты
    const getObjectStatusColor = (status: string) => {
      const statusColors: Record<string, string> = {
        'active': 'success',
        'inactive': 'warning',
        'deleted': 'error',
        'scheduled_for_deletion': 'orange'
      };
      return statusColors[status] || 'grey';
    };

    const getObjectStatusText = (status: string) => {
      const statusTexts: Record<string, string> = {
        'active': 'Активный',
        'inactive': 'Неактивный',
        'deleted': 'Удален',
        'scheduled_for_deletion': 'Запланирован к удалению'
      };
      return statusTexts[status] || status;
    };

    const getObjectTypeIcon = (type: string) => {
      const typeIcons: Record<string, string> = {
        'vehicle': 'mdi-car',
        'person': 'mdi-account',
        'asset': 'mdi-package-variant',
        'default': 'mdi-monitor'
      };
      return typeIcons[type] || typeIcons.default;
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return 'Не указано';
      return new Date(dateString).toLocaleString('ru-RU');
    };

    // Watchers
    watch(dialog, (newValue) => {
      if (newValue) {
        loadObjects();
      }
    });

    return {
      // Состояние
      dialog,
      objects,
      objectsData,
      loading,
      searchQuery,
      currentPage,
      restoringObjects,
      deletingObject,
      showDeleteConfirm,
      objectToDelete,

      // Методы
      debouncedSearch,
      loadObjects,
      restoreObject,
      confirmPermanentDelete,
      permanentDeleteObject,
      handlePageChange,
      refreshData,
      closeDialog,
      goToObjectsPage,

      // Утилиты
      getObjectStatusColor,
      getObjectStatusText,
      getObjectTypeIcon,
      formatDate,
      
      // Snackbar
      snackbar
    };
  }
});
</script>

<style scoped>
.trash-dialog {
  border-radius: 16px;
}

.trash-objects-list {
  max-height: 400px;
  overflow-y: auto;
}

.trash-object-item {
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  transition: background-color 0.2s ease;
}

.trash-object-item:hover {
  background-color: rgb(var(--v-theme-surface-variant));
}

.trash-object-item:last-child {
  border-bottom: none;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}
</style>
