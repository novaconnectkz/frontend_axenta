<template>
  <div class="objects-page">
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-office-building" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Управление объектами</h1>
          <p class="page-subtitle">Мониторинг и управление объектами системы</p>
        </div>
      </div>
      
      <div class="page-actions">
        <v-btn variant="outlined" prepend-icon="mdi-export">
          Экспорт
        </v-btn>
        <v-btn variant="elevated" prepend-icon="mdi-plus" color="primary">
          Создать объект
        </v-btn>
      </div>
    </div>

    <!-- Простая таблица для тестирования -->
    <v-card class="mt-4">
      <v-card-title>
        <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
        Список объектов
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="items"
          class="elevation-1"
        >
          <template #item.status="{ item }">
            <v-chip
              :text="item.status"
              :color="item.status === 'active' ? 'success' : 'warning'"
              size="small"
            />
          </template>
          
          <template #item.actions="{ item }">
            <v-btn icon="mdi-eye" size="small" variant="text" />
            <v-btn icon="mdi-pencil" size="small" variant="text" />
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const headers = [
  { title: 'Название', value: 'name', sortable: true },
  { title: 'Тип', value: 'type', sortable: true },
  { title: 'Статус', value: 'status', sortable: true },
  { title: 'IMEI', value: 'imei', sortable: false },
  { title: 'Действия', value: 'actions', sortable: false, width: 120 },
];

const items = ref([
  {
    id: 1,
    name: 'Тестовый объект 1',
    type: 'vehicle',
    status: 'active',
    imei: '123456789012345',
  },
  {
    id: 2,
    name: 'Тестовый объект 2',
    type: 'equipment',
    status: 'inactive',
    imei: '987654321098765',
  },
]);
</script>

<style scoped>
.objects-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  color: #007AFF;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.page-subtitle {
  color: #666;
  margin: 4px 0 0 0;
}

.page-actions {
  display: flex;
  gap: 12px;
}
</style>
