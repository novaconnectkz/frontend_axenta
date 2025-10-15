<template>
    <v-dialog
      v-model="dialog"
      max-width="1000px"
      content-class="draggable-dialog-content"
    >
    <v-card class="trash-dialog">
      <v-card-title 
        class="d-flex align-center justify-space-between pa-4 draggable-header"
        @mousedown="handleMouseDown"
      >
        <div class="d-flex align-center">
          <v-icon icon="mdi-drag" class="me-2 text-medium-emphasis" size="20" />
          <v-icon icon="mdi-delete" class="me-3" color="error" size="24" />
          <span class="text-h6 unified-text-h6">Корзина объектов</span>
          <v-chip
            v-if="objectsData"
            :text="objectsData.total.toString()"
            size="small"
            color="error"
            class="ml-3 unified-chip"
          />
        </div>
        <div class="d-flex align-center gap-1">
          <v-btn
            icon="mdi-home"
            variant="text"
            @click="resetDialogPosition"
            title="Сбросить позицию диалога"
            class="unified-button-icon"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="closeDialog"
            class="unified-button-icon"
          />
        </div>
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
              class="unified-input"
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center justify-end">
            <span class="text-caption text-medium-emphasis unified-text-caption">
              {{ objectsData && objectsData.total > 0 ? `${objectsData.page || currentPage} из ${totalPages} страниц` : '' }}
            </span>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- Список объектов в корзине -->
      <v-card-text class="pa-0 flex-grow-1">
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

        <!-- Компактная таблица объектов -->
        <div v-else class="trash-objects-container">
          <v-data-table
            :headers="tableHeaders"
            :items="objects"
            :loading="loading"
            class="trash-objects-table"
            density="compact"
            :items-per-page="perPage"
            hide-default-footer
            v-model="selectedObjects"
            item-key="id"
          >
          <!-- Заголовок с чекбоксом "выбрать все" -->
          <template #header.data-table-select>
            <v-checkbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @update:model-value="toggleSelectAll"
              density="compact"
              hide-details
            />
          </template>

          <!-- Колонка с чекбоксом -->
          <template #item.data-table-select="{ item }">
            <v-checkbox
              :model-value="selectedObjects.includes(item)"
              @update:model-value="toggleObjectSelection(item)"
              density="compact"
              hide-details
            />
          </template>

          <!-- Колонка с датой удаления -->
          <template #item.deleted_at="{ item }">
            <span class="text-caption">
              {{ formatDate(item.deleted_at) }}
            </span>
          </template>

          <!-- Колонка с именем объекта -->
          <template #item.name="{ item }">
            <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
          </template>

          <!-- Колонка с IMEI -->
          <template #item.imei="{ item }">
            <span class="text-caption text-medium-emphasis">
              {{ item.imei || 'Не указан' }}
            </span>
          </template>

          <!-- Колонка с действиями -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-1">
              <v-btn
                color="success"
                variant="text"
                icon="mdi-restore"
                @click="restoreObject(item)"
                :loading="restoringObjects.includes(item.id)"
                class="unified-button-icon"
              />
              <v-btn
                color="error"
                variant="text"
                icon="mdi-delete-forever"
                @click="confirmPermanentDelete(item)"
                class="unified-button-icon"
              />
            </div>
          </template>
          </v-data-table>
        </div>

      </v-card-text>

      <v-divider />

      <!-- Действия -->
      <v-card-actions class="pa-4">
        <!-- Левая часть: Пагинация -->
        <div v-if="objectsData && objectsData.total > 0" class="d-flex align-center gap-3">
          <!-- Выбор количества записей на странице -->
          <div class="d-flex align-center gap-2">
            <span class="text-caption text-medium-emphasis unified-text-caption">Записей на странице:</span>
            <v-select
              v-model="perPage"
              :items="perPageOptions"
              variant="outlined"
              density="compact"
              hide-details
              style="min-width: 80px;"
              @update:model-value="handlePerPageChange"
              class="unified-select"
            />
          </div>

          <!-- Информация о текущем диапазоне -->
          <div class="text-caption text-medium-emphasis unified-text-caption">
            {{ currentRange }}
          </div>

          <!-- Навигация по страницам -->
          <div class="d-flex align-center gap-1">
            <v-btn
              icon="mdi-page-first"
              variant="text"
              :disabled="currentPage <= 1"
              @click="goToFirstPage"
              class="unified-button-icon"
            />
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              :disabled="currentPage <= 1"
              @click="goToPreviousPage"
              class="unified-button-icon"
            />
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              :disabled="currentPage >= totalPages"
              @click="goToNextPage"
              class="unified-button-icon"
            />
            <v-btn
              icon="mdi-page-last"
              variant="text"
              :disabled="currentPage >= totalPages"
              @click="goToLastPage"
              class="unified-button-icon"
            />
          </div>
        </div>

        <!-- Центральная часть: Счетчик выбранных -->
        <div v-if="selectedObjects.length > 0" class="d-flex align-center">
          <span class="text-caption text-medium-emphasis unified-text-caption">
            Выбрано: {{ selectedObjects.length }}
          </span>
        </div>
        
        <v-spacer />
        
        <!-- Правая часть: Все кнопки действий -->
        <div class="d-flex align-center gap-2">
          <!-- Групповые действия -->
          <v-btn
            v-if="selectedObjects.length > 0"
            color="success"
            variant="outlined"
            @click="restoreSelectedObjects"
            :loading="restoringObjects.length > 0"
            :disabled="selectedObjects.length === 0"
            class="unified-button-icon"
            title="Восстановить выбранные"
          >
            <v-icon icon="mdi-restore" />
          </v-btn>
          <v-btn
            v-if="selectedObjects.length > 0"
            color="error"
            variant="outlined"
            @click="confirmBulkDelete"
            :disabled="selectedObjects.length === 0"
            class="unified-button-icon"
            title="Удалить выбранные"
          >
            <v-icon icon="mdi-delete-forever" />
          </v-btn>
          
          <!-- Навигация -->
          <v-btn
            color="primary"
            variant="outlined"
            @click="goToObjectsPage"
            class="unified-button-icon"
            title="К списку объектов"
          >
            <v-icon icon="mdi-arrow-left" />
          </v-btn>
          <v-btn
            color="primary"
            @click="closeDialog"
            class="unified-button-icon"
            title="Закрыть"
          >
            <v-icon icon="mdi-close" />
          </v-btn>
        </div>
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
            class="unified-button"
          >
            Отмена
          </v-btn>
          <v-btn
            color="error"
            @click="permanentDeleteObject"
            :loading="deletingObject"
            class="unified-button"
          >
            Удалить навсегда
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения группового удаления -->
    <v-dialog
      v-model="showBulkDeleteConfirm"
      max-width="600px"
    >
      <v-card>
        <v-card-title class="text-h6">
          <v-icon icon="mdi-alert" color="error" class="me-2" />
          Групповое удаление
        </v-card-title>
        <v-card-text>
          <p>Вы уверены, что хотите окончательно удалить <strong>{{ selectedObjects.length }}</strong> объектов?</p>
          <div class="mt-3">
            <p class="text-body-2 font-weight-medium">Объекты для удаления:</p>
            <v-list density="compact" class="bg-grey-lighten-5 rounded">
              <v-list-item
                v-for="object in selectedObjects.slice(0, 5)"
                :key="object.id"
                class="py-1"
              >
                <v-list-item-title class="text-body-2">
                  {{ object.name }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-if="selectedObjects.length > 5" class="py-1">
                <v-list-item-title class="text-body-2 text-medium-emphasis">
                  ... и еще {{ selectedObjects.length - 5 }} объектов
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
          <p class="text-error mt-3">Это действие нельзя отменить!</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="showBulkDeleteConfirm = false"
            class="unified-button"
          >
            Отмена
          </v-btn>
          <v-btn
            color="error"
            @click="bulkDeleteObjects"
            :loading="deletingObject"
            class="unified-button"
          >
            Удалить {{ selectedObjects.length }} объектов
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
import { defineComponent, ref, computed, watch, nextTick, onUnmounted } from 'vue';
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
    
    // Опции для выбора количества записей на странице
    const perPageOptions = [
      { title: '5', value: 5 },
      { title: '10', value: 10 },
      { title: '20', value: 20 },
      { title: '50', value: 50 },
      { title: '100', value: 100 }
    ];

    // Состояние операций
    const restoringObjects = ref<number[]>([]);
    const deletingObject = ref(false);
    const showDeleteConfirm = ref(false);
    const objectToDelete = ref<ObjectWithRelations | null>(null);

    // Состояние выбора объектов
    const selectedObjects = ref<ObjectWithRelations[]>([]);
    const showBulkDeleteConfirm = ref(false);

    // Состояние для перетаскивания
    const isDragging = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });
    const dialogElement = ref<HTMLElement | null>(null); // Ссылка на фактический DOM-элемент содержимого диалога
    
    // Константы для localStorage
    const STORAGE_KEY = 'objectsTrashDialog_position';
    const SAVED_POSITION = ref<{ x: number; y: number } | null>(null);
    
    // Автообновление
    const autoRefreshInterval = ref<NodeJS.Timeout | null>(null);
    const AUTO_REFRESH_INTERVAL = 30000; // 30 секунд
    const isSilentRefreshing = ref(false);

    // Отслеживаем открытие диалога, чтобы получить элемент и установить начальную позицию
    watch(dialog, (newValue) => {
      if (newValue) {
        nextTick(() => {
          const overlayContent = document.querySelector('.draggable-dialog-content');
          if (overlayContent instanceof HTMLElement) {
            dialogElement.value = overlayContent;
            
            // Загружаем сохраненную позицию
            const savedPosition = loadDialogPosition();
            
            if (savedPosition) {
              // Используем сохраненную позицию
              dialogElement.value.style.left = `${savedPosition.x}px`;
              dialogElement.value.style.top = `${savedPosition.y}px`;
              dialogElement.value.style.transform = 'none';
              dialogElement.value.style.margin = '0';
              console.log('📍 Dialog positioned at saved location:', savedPosition);
            } else {
              // Используем центрированную позицию по умолчанию
              const rect = dialogElement.value.getBoundingClientRect();
              dialogElement.value.style.left = `${rect.left}px`;
              dialogElement.value.style.top = `${rect.top}px`;
              dialogElement.value.style.transform = 'none';
              dialogElement.value.style.margin = '0';
              console.log('📍 Dialog positioned at default center location');
            }
          }
        });
        
        // Запускаем автообновление при открытии диалога
        startAutoRefresh();
      } else {
        // Останавливаем автообновление при закрытии диалога
        stopAutoRefresh();
        
        // Сохраняем текущую позицию при закрытии диалога
        if (dialogElement.value) {
          const rect = dialogElement.value.getBoundingClientRect();
          saveDialogPosition(rect.left, rect.top);
        }
        dialogElement.value = null; // Очищаем ссылку при закрытии диалога
      }
    });

    // Заголовки таблицы
    const tableHeaders = [
      { title: '', value: 'data-table-select', sortable: false, width: 50 },
      { title: 'Дата удаления', value: 'deleted_at', sortable: true, width: 150 },
      { title: 'Имя объекта', value: 'name', sortable: true },
      { title: 'IMEI', value: 'imei', sortable: true, width: 120 },
      { title: 'Действия', value: 'actions', sortable: false, width: 100 }
    ];

    // Вычисляемое свойство для состояния чекбокса "выбрать все"
    const isAllSelected = computed(() => {
      return objects.value.length > 0 && selectedObjects.value.length === objects.value.length;
    });

    const isIndeterminate = computed(() => {
      return selectedObjects.value.length > 0 && selectedObjects.value.length < objects.value.length;
    });

    // Вычисляемые свойства для пагинации
    const currentRange = computed(() => {
      if (!objectsData.value || !objectsData.value.total) return '';
      const page = objectsData.value.page || currentPage.value;
      const perPageValue = objectsData.value.per_page || perPage.value;
      const total = objectsData.value.total;
      
      if (perPageValue <= 0) return '';
      
      const start = (page - 1) * perPageValue + 1;
      const end = Math.min(page * perPageValue, total);
      return `${start}-${end} из ${total}`;
    });

    const totalPages = computed(() => {
      if (!objectsData.value || !objectsData.value.total) return 0;
      const perPageValue = objectsData.value.per_page || perPage.value;
      if (perPageValue <= 0) return 0;
      return Math.ceil(objectsData.value.total / perPageValue);
    });

    // Debounced поиск
    const debouncedSearch = debounce(() => {
      currentPage.value = 1;
      loadObjects();
    }, 500);

    // Загрузка объектов из корзины
    const loadObjects = async (silent = false) => {
      try {
        if (silent) {
          isSilentRefreshing.value = true;
        } else {
          loading.value = true;
        }
        console.log('🗑️ Loading deleted objects...', {
          page: currentPage.value,
          per_page: perPage.value,
          search: searchQuery.value,
          silent
        });

        const response = await objectsService.getDeletedObjects(
          currentPage.value,
          perPage.value,
          searchQuery.value || undefined
        );

        if (response.status === 'success') {
          objects.value = response.data.items || [];
          
          // Убеждаемся, что у нас есть все необходимые поля для пагинации
          objectsData.value = {
            ...response.data,
            page: response.data.page || currentPage.value,
            per_page: response.data.per_page || perPage.value,
            total: response.data.total || objects.value.length
          };
          
          console.log('✅ Deleted objects loaded:', {
            count: objects.value.length,
            total: objectsData.value.total,
            page: objectsData.value.page,
            per_page: objectsData.value.per_page,
            fullResponse: response.data
          });
        } else {
          console.error('❌ Error loading deleted objects:', response.error);
          showSnackbar(response.error || 'Ошибка загрузки корзины', 'error');
        }
      } catch (error: any) {
        console.error('💥 Exception loading deleted objects:', error);
        if (!silent) {
          showSnackbar('Ошибка загрузки корзины', 'error');
        }
      } finally {
        if (silent) {
          isSilentRefreshing.value = false;
        } else {
          loading.value = false;
        }
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

    const handlePerPageChange = (newPerPage: number) => {
      perPage.value = newPerPage;
      currentPage.value = 1; // Сбрасываем на первую страницу
      loadObjects();
    };

    const goToFirstPage = () => {
      if (currentPage.value > 1) {
        currentPage.value = 1;
        loadObjects();
      }
    };

    const goToPreviousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        loadObjects();
      }
    };

    const goToNextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        loadObjects();
      }
    };

    const goToLastPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value = totalPages.value;
        loadObjects();
      }
    };

    const refreshData = () => {
      loadObjects();
    };

    // Методы для автообновления
    const startAutoRefresh = () => {
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value);
      }
      
      autoRefreshInterval.value = setInterval(() => {
        if (dialog.value && !loading.value && !isSilentRefreshing.value) {
          console.log('🔄 Auto-refreshing trash data...');
          loadObjects(true); // Тихое обновление
        }
      }, AUTO_REFRESH_INTERVAL);
      
      console.log('⏰ Auto-refresh started (30s interval)');
    };

    const stopAutoRefresh = () => {
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value);
        autoRefreshInterval.value = null;
        console.log('⏹️ Auto-refresh stopped');
      }
    };

    const closeDialog = () => {
      dialog.value = false;
    };

    const goToObjectsPage = () => {
      router.push('/objects');
      closeDialog();
    };

    // Очистка таймера при размонтировании компонента
    onUnmounted(() => {
      stopAutoRefresh();
    });

    // Методы для работы с позицией диалога
    const saveDialogPosition = (x: number, y: number) => {
      try {
        const position = { x, y };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        SAVED_POSITION.value = position;
        console.log('💾 Dialog position saved:', position);
      } catch (error) {
        console.warn('⚠️ Failed to save dialog position:', error);
      }
    };

    const loadDialogPosition = (): { x: number; y: number } | null => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const position = JSON.parse(saved);
          SAVED_POSITION.value = position;
          console.log('📂 Dialog position loaded:', position);
          return position;
        }
      } catch (error) {
        console.warn('⚠️ Failed to load dialog position:', error);
      }
      return null;
    };

    const clearDialogPosition = () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        SAVED_POSITION.value = null;
        console.log('🗑️ Dialog position cleared');
      } catch (error) {
        console.warn('⚠️ Failed to clear dialog position:', error);
      }
    };

    const resetDialogPosition = () => {
      clearDialogPosition();
      if (dialogElement.value) {
        // Центрируем диалог
        const rect = dialogElement.value.getBoundingClientRect();
        const centerX = (window.innerWidth - rect.width) / 2;
        const centerY = (window.innerHeight - rect.height) / 2;
        
        dialogElement.value.style.left = `${centerX}px`;
        dialogElement.value.style.top = `${centerY}px`;
        dialogElement.value.style.transform = 'none';
        dialogElement.value.style.margin = '0';
        
        // Сохраняем новую центрированную позицию
        saveDialogPosition(centerX, centerY);
        console.log('🏠 Dialog position reset to center');
      }
    };

    // Методы для перетаскивания
    const handleMouseDown = (event: MouseEvent) => {
      if (!dialogElement.value) return;

      isDragging.value = true;
      const rect = dialogElement.value.getBoundingClientRect();
      
      // Захватываем начальное смещение от клика мыши до верхнего левого угла диалога
      dragOffset.value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      
      // Убеждаемся, что диалог позиционируется для прямого манипулирования left/top
      dialogElement.value.style.transform = 'none'; // Удаляем центрирующее преобразование
      dialogElement.value.style.margin = '0'; // Удаляем любой стандартный отступ

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      event.preventDefault();
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.value || !dialogElement.value) return;
      
      const newX = event.clientX - dragOffset.value.x;
      const newY = event.clientY - dragOffset.value.y;

      dialogElement.value.style.left = `${newX}px`;
      dialogElement.value.style.top = `${newY}px`;
      dialogElement.value.style.transform = 'none'; // Важно для переопределения центрирующего преобразования
    };

    const handleMouseUp = () => {
      isDragging.value = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Сохраняем новую позицию после перетаскивания
      if (dialogElement.value) {
        const rect = dialogElement.value.getBoundingClientRect();
        saveDialogPosition(rect.left, rect.top);
      }
    };

    // Методы для работы с выбором объектов
    const toggleObjectSelection = (object: ObjectWithRelations) => {
      const index = selectedObjects.value.findIndex(item => item.id === object.id);
      if (index > -1) {
        selectedObjects.value.splice(index, 1);
      } else {
        selectedObjects.value.push(object);
      }
    };

    const clearSelection = () => {
      selectedObjects.value = [];
    };

    const selectAllObjects = () => {
      selectedObjects.value = [...objects.value];
    };

    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        // Если все выбраны, снимаем выбор со всех
        clearSelection();
      } else {
        // Если не все выбраны, выбираем все
        selectAllObjects();
      }
    };

    // Групповое восстановление объектов
    const restoreSelectedObjects = async () => {
      if (selectedObjects.value.length === 0) return;

      try {
        const objectIds = selectedObjects.value.map(obj => obj.id);
        restoringObjects.value.push(...objectIds);
        
        console.log('🔄 Restoring selected objects:', objectIds);

        // Восстанавливаем объекты по одному
        const results = await Promise.allSettled(
          selectedObjects.value.map(object => objectsService.restoreObject(object.id))
        );

        let successCount = 0;
        let errorCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.status === 'success') {
            successCount++;
          } else {
            errorCount++;
            console.error(`❌ Failed to restore object ${selectedObjects.value[index].id}:`, result);
          }
        });

        if (successCount > 0) {
          showSnackbar(`Восстановлено ${successCount} объектов`, 'success');
        }
        if (errorCount > 0) {
          showSnackbar(`Ошибка восстановления ${errorCount} объектов`, 'error');
        }

        // Очищаем выбор и перезагружаем данные
        clearSelection();
        await loadObjects();
      } catch (error: any) {
        console.error('💥 Exception restoring selected objects:', error);
        showSnackbar('Ошибка группового восстановления', 'error');
      } finally {
        restoringObjects.value = [];
      }
    };

    // Подтверждение группового удаления
    const confirmBulkDelete = () => {
      if (selectedObjects.value.length === 0) return;
      showBulkDeleteConfirm.value = true;
    };

    // Групповое удаление объектов
    const bulkDeleteObjects = async () => {
      if (selectedObjects.value.length === 0) return;

      try {
        deletingObject.value = true;
        const objectIds = selectedObjects.value.map(obj => obj.id);
        
        console.log('🗑️ Permanently deleting selected objects:', objectIds);

        // Удаляем объекты по одному
        const results = await Promise.allSettled(
          selectedObjects.value.map(object => objectsService.permanentDeleteObject(object.id))
        );

        let successCount = 0;
        let errorCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.status === 'success') {
            successCount++;
          } else {
            errorCount++;
            console.error(`❌ Failed to delete object ${selectedObjects.value[index].id}:`, result);
          }
        });

        if (successCount > 0) {
          showSnackbar(`Удалено ${successCount} объектов`, 'success');
        }
        if (errorCount > 0) {
          showSnackbar(`Ошибка удаления ${errorCount} объектов`, 'error');
        }

        // Очищаем выбор и перезагружаем данные
        clearSelection();
        await loadObjects();
      } catch (error: any) {
        console.error('💥 Exception bulk deleting objects:', error);
        showSnackbar('Ошибка группового удаления', 'error');
      } finally {
        deletingObject.value = false;
        showBulkDeleteConfirm.value = false;
      }
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

    const formatDate = (dateString: string | undefined) => {
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
      perPage,
      perPageOptions,
      currentRange,
      totalPages,
      restoringObjects,
      deletingObject,
      showDeleteConfirm,
      objectToDelete,
      selectedObjects,
      showBulkDeleteConfirm,
      tableHeaders,
      isAllSelected,
      isIndeterminate,
      isDragging,
      dialogElement,
      SAVED_POSITION,
      isSilentRefreshing,

      // Методы
      debouncedSearch,
      loadObjects,
      restoreObject,
      confirmPermanentDelete,
      permanentDeleteObject,
      handlePageChange,
      handlePerPageChange,
      goToFirstPage,
      goToPreviousPage,
      goToNextPage,
      goToLastPage,
      refreshData,
      startAutoRefresh,
      stopAutoRefresh,
      closeDialog,
      goToObjectsPage,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      saveDialogPosition,
      loadDialogPosition,
      clearDialogPosition,
      resetDialogPosition,
      toggleObjectSelection,
      selectAllObjects,
      toggleSelectAll,
      restoreSelectedObjects,
      confirmBulkDelete,
      bulkDeleteObjects,

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
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.draggable-header {
  cursor: move;
  user-select: none;
}

.draggable-header:hover {
  background-color: rgb(var(--v-theme-surface-variant));
  transition: background-color 0.2s ease;
}

.trash-objects-container {
  max-height: 400px;
  overflow-y: auto;
}

.trash-objects-table {
  height: 100%;
}

.trash-objects-table :deep(.v-data-table__wrapper) {
  overflow: visible;
}

.trash-objects-table :deep(.v-data-table__td) {
  padding: 8px 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
}

.trash-objects-table :deep(.v-data-table__th) {
  padding: 8px 16px;
  font-weight: 600;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
}

/* Единый стиль для всех элементов управления */
.unified-control {
  height: 44px !important;
  border-radius: 10px !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 14px !important;
}

/* Стили для полей ввода */
.unified-input :deep(.v-field) {
  height: 44px !important;
  border-radius: 10px !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 14px !important;
}

.unified-input :deep(.v-field__input) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 14px !important;
}

/* Стили для селектов */
.unified-select :deep(.v-field) {
  height: 44px !important;
  border-radius: 10px !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 14px !important;
}

.unified-select :deep(.v-field__input) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 14px !important;
}

/* Стили для кнопок */
.unified-button {
  height: 36px !important;
  border-radius: 8px !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

/* Стили для маленьких кнопок */
.unified-button-small {
  height: 36px !important;
  border-radius: 8px !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

/* Стили для иконок кнопок */
.unified-button-icon {
  height: 36px !important;
  width: 36px !important;
  border-radius: 8px !important;
}

/* Стили для текста */
.unified-text {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 14px !important;
}

.unified-text-caption {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 14px !important;
}

.unified-text-h6 {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 14px !important;
  font-weight: 600 !important;
}

/* Стили для чипов */
.unified-chip {
  border-radius: 8px !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}
</style>

