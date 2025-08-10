<template>
  <!-- Vuetify компонент-обертка -->
  <v-card 
    :loading="loading"
    :disabled="disabled"
    class="template-component"
    elevation="2"
  >
    <!-- Заголовок карточки -->
    <v-card-title v-if="title" class="d-flex align-center">
      <v-icon v-if="icon" :icon="icon" class="me-2" />
      {{ title }}
      
      <!-- Действия в заголовке -->
      <v-spacer />
      <slot name="header-actions" />
    </v-card-title>

    <!-- Основной контент -->
    <v-card-text>
      <!-- Сообщение об ошибке -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="clearError"
      >
        {{ error }}
      </v-alert>

      <!-- Основной слот для контента -->
      <slot :data="data" :loading="loading" />

      <!-- Список данных (если передан) -->
      <template v-if="items && items.length > 0">
        <v-list>
          <v-list-item
            v-for="item in items"
            :key="getItemKey(item)"
            :title="getItemTitle(item)"
            :subtitle="getItemSubtitle(item)"
            @click="handleItemClick(item)"
          >
            <template #prepend>
              <v-avatar v-if="getItemAvatar(item)" :image="getItemAvatar(item)" />
              <v-icon v-else-if="getItemIcon(item)" :icon="getItemIcon(item)" />
            </template>

            <template #append>
              <slot name="item-actions" :item="item">
                <v-btn
                  v-if="canEdit"
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  @click.stop="handleEdit(item)"
                />
                <v-btn
                  v-if="canDelete"
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click.stop="handleDelete(item)"
                />
              </slot>
            </template>
          </v-list-item>
        </v-list>
      </template>

      <!-- Пустое состояние -->
      <v-empty-state
        v-else-if="items && items.length === 0 && !loading"
        :headline="emptyStateTitle"
        :title="emptyStateSubtitle"
        :text="emptyStateText"
        icon="mdi-folder-open-outline"
      >
        <template #actions>
          <slot name="empty-actions" />
        </template>
      </v-empty-state>
    </v-card-text>

    <!-- Действия в футере -->
    <v-card-actions v-if="$slots['card-actions']">
      <slot name="card-actions" />
    </v-card-actions>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить этот элемент? Это действие нельзя отменить.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            Отмена
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            :loading="deleting"
            @click="confirmDelete"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, inject, computed, onMounted, type PropType } from 'vue'
import axios from 'axios'
import { AuthContext } from '@/context/auth'

// Типы для компонента
interface TemplateItem {
  id: number | string
  [key: string]: any
}

interface ApiResponse<T = any> {
  status: 'success' | 'error'
  data?: T
  error?: string
}

export default defineComponent({
  name: 'ComponentTemplate',
  
  props: {
    // Основные свойства
    title: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    
    // Данные
    items: {
      type: Array as PropType<TemplateItem[]>,
      default: () => []
    },
    data: {
      type: Object,
      default: () => ({})
    },
    
    // API настройки
    apiEndpoint: {
      type: String,
      default: ''
    },
    autoFetch: {
      type: Boolean,
      default: false
    },
    
    // Права доступа
    canEdit: {
      type: Boolean,
      default: true
    },
    canDelete: {
      type: Boolean,
      default: true
    },
    
    // Пустое состояние
    emptyStateTitle: {
      type: String,
      default: 'Нет данных'
    },
    emptyStateSubtitle: {
      type: String,
      default: 'Данные отсутствуют'
    },
    emptyStateText: {
      type: String,
      default: 'Попробуйте изменить критерии поиска или добавить новые данные.'
    },
    
    // Настройки отображения элементов
    itemTitleKey: {
      type: String,
      default: 'title'
    },
    itemSubtitleKey: {
      type: String,
      default: 'subtitle'
    },
    itemAvatarKey: {
      type: String,
      default: 'avatar'
    },
    itemIconKey: {
      type: String,
      default: 'icon'
    }
  },

  emits: [
    'item-click',
    'edit',
    'delete',
    'data-loaded',
    'error'
  ],

  setup(props, { emit }) {
    // Инъекция контекста аутентификации
    const auth = inject<AuthContext>('auth')!

    // Реактивные данные
    const error = ref<string>('')
    const deleteDialog = ref(false)
    const deleting = ref(false)
    const itemToDelete = ref<TemplateItem | null>(null)
    const internalLoading = ref(false)
    const internalData = ref<any>({})

    // Computed свойства
    const currentLoading = computed(() => props.loading || internalLoading.value)

    const hasPermission = computed(() => {
      if (!auth.user) return false
      const userRole = auth.user.role
      return ['admin', 'manager'].includes(userRole)
    })

    // Методы для работы с элементами списка
    const getItemKey = (item: TemplateItem): string | number => {
      return item.id || item.key || Math.random()
    }

    const getItemTitle = (item: TemplateItem): string => {
      return item[props.itemTitleKey] || item.name || item.title || 'Без названия'
    }

    const getItemSubtitle = (item: TemplateItem): string => {
      return item[props.itemSubtitleKey] || item.description || ''
    }

    const getItemAvatar = (item: TemplateItem): string => {
      return item[props.itemAvatarKey] || ''
    }

    const getItemIcon = (item: TemplateItem): string => {
      return item[props.itemIconKey] || 'mdi-circle'
    }

    // Обработчики событий
    const handleItemClick = (item: TemplateItem) => {
      emit('item-click', item)
    }

    const handleEdit = (item: TemplateItem) => {
      if (props.canEdit && hasPermission.value) {
        emit('edit', item)
      }
    }

    const handleDelete = (item: TemplateItem) => {
      if (props.canDelete && hasPermission.value) {
        itemToDelete.value = item
        deleteDialog.value = true
      }
    }

    const confirmDelete = async () => {
      if (!itemToDelete.value) return

      deleting.value = true
      try {
        if (props.apiEndpoint) {
          await deleteItem(itemToDelete.value.id)
        }
        emit('delete', itemToDelete.value)
        deleteDialog.value = false
        itemToDelete.value = null
      } catch (err) {
        error.value = 'Ошибка при удалении элемента'
      } finally {
        deleting.value = false
      }
    }

    const clearError = () => {
      error.value = ''
    }

    // API методы
    const fetchData = async () => {
      if (!props.apiEndpoint) return

      internalLoading.value = true
      error.value = ''

      try {
        const response = await axios.get<ApiResponse>(
          `http://localhost:8080/api${props.apiEndpoint}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`
            }
          }
        )

        if (response.data.status === 'success') {
          internalData.value = response.data.data
          emit('data-loaded', response.data.data)
        } else {
          error.value = response.data.error || 'Ошибка загрузки данных'
          emit('error', error.value)
        }
      } catch (err) {
        error.value = 'Ошибка сети при загрузке данных'
        emit('error', error.value)
        console.error('API Error:', err)
      } finally {
        internalLoading.value = false
      }
    }

    const deleteItem = async (id: string | number) => {
      if (!props.apiEndpoint) return

      const response = await axios.delete<ApiResponse>(
        `http://localhost:8080/api${props.apiEndpoint}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        }
      )

      if (response.data.status !== 'success') {
        throw new Error(response.data.error || 'Ошибка удаления')
      }
    }

    const createItem = async (data: any) => {
      if (!props.apiEndpoint) return

      const response = await axios.post<ApiResponse>(
        `http://localhost:8080/api${props.apiEndpoint}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.status !== 'success') {
        throw new Error(response.data.error || 'Ошибка создания')
      }

      return response.data.data
    }

    const updateItem = async (id: string | number, data: any) => {
      if (!props.apiEndpoint) return

      const response = await axios.put<ApiResponse>(
        `http://localhost:8080/api${props.apiEndpoint}/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.status !== 'success') {
        throw new Error(response.data.error || 'Ошибка обновления')
      }

      return response.data.data
    }

    // Хуки жизненного цикла
    onMounted(() => {
      if (props.autoFetch && props.apiEndpoint) {
        fetchData()
      }
    })

    // Возврат данных и методов для шаблона
    return {
      // Контекст аутентификации
      auth,
      
      // Реактивные данные
      error,
      deleteDialog,
      deleting,
      currentLoading,
      hasPermission,
      
      // Методы для работы с элементами
      getItemKey,
      getItemTitle,
      getItemSubtitle,
      getItemAvatar,
      getItemIcon,
      
      // Обработчики событий
      handleItemClick,
      handleEdit,
      handleDelete,
      confirmDelete,
      clearError,
      
      // API методы
      fetchData,
      createItem,
      updateItem,
      deleteItem
    }
  }
})
</script>

<style scoped>
.template-component {
  width: 100%;
}

/* Стили для загрузки */
.template-component .v-card-title {
  font-weight: 600;
}

/* Стили для пустого состояния */
.v-empty-state {
  margin: 2rem 0;
}

/* Кастомные стили для списка */
.v-list-item {
  transition: background-color 0.2s ease;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Стили для кнопок действий */
.v-list-item .v-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.v-list-item:hover .v-btn {
  opacity: 1;
}

/* Адаптивность */
@media (max-width: 768px) {
  .template-component .v-card-title {
    font-size: 1.1rem;
  }
  
  .v-list-item .v-btn {
    opacity: 1;
  }
}
</style>

<!--
ПРИМЕР ИСПОЛЬЗОВАНИЯ:

1. Простое использование с данными:
<ComponentTemplate
  title="Список пользователей"
  icon="mdi-account-group"
  :items="users"
  @edit="handleEditUser"
  @delete="handleDeleteUser"
/>

2. С автоматической загрузкой через API:
<ComponentTemplate
  title="Устройства"
  icon="mdi-devices"
  api-endpoint="/devices"
  :auto-fetch="true"
  :can-edit="hasEditPermission"
  :can-delete="hasDeletePermission"
  @data-loaded="onDevicesLoaded"
  @error="onError"
>
  <template #header-actions>
    <v-btn icon="mdi-plus" @click="addDevice" />
  </template>
  
  <template #item-actions="{ item }">
    <v-btn icon="mdi-eye" @click="viewDevice(item)" />
  </template>
</ComponentTemplate>

3. Кастомный контент:
<ComponentTemplate title="Статистика" icon="mdi-chart-line">
  <v-row>
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title>Активные устройства</v-card-title>
        <v-card-text>{{ activeDevicesCount }}</v-card-text>
      </v-card>
    </v-col>
  </v-row>
</ComponentTemplate>

ОСНОВНЫЕ ВОЗМОЖНОСТИ:
✅ Vuetify UI компоненты
✅ TypeScript типизация
✅ Inject аутентификации
✅ Автоматические API запросы через axios
✅ Обработка ошибок
✅ Права доступа по ролям
✅ Подтверждение удаления
✅ Пустые состояния
✅ Слоты для кастомизации
✅ Адаптивный дизайн
✅ Загрузочные состояния

РОЛИ ДОСТУПА:
- admin/manager: все операции
- tech: только назначенные заказы
- accountant: только просмотр

API ENDPOINT:
Базовый URL: http://localhost:8080/api
Автоматически добавляется Bearer токен в заголовки
-->
