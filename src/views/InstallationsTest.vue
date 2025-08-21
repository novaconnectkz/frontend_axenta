<template>
  <div class="installations-test">
    <v-card>
      <v-card-title>
        <v-icon icon="mdi-tools" class="mr-2" />
        Тестовая страница монтажей
      </v-card-title>
      <v-card-text>
        <v-alert type="success" variant="tonal" class="mb-4">
          <template #prepend>
            <v-icon icon="mdi-check-circle" />
          </template>
          <strong>Навигация работает!</strong>
          <p class="mb-0">Вы успешно перешли на страницу монтажей.</p>
        </v-alert>

        <div class="test-info">
          <h3>Информация о маршруте:</h3>
          <ul>
            <li><strong>Путь:</strong> {{ $route.path }}</li>
            <li><strong>Название:</strong> {{ $route.name }}</li>
            <li><strong>Заголовок:</strong> {{ $route.meta?.title }}</li>
          </ul>
        </div>

        <div class="mt-4">
          <v-btn color="primary" to="/warehouse" prepend-icon="mdi-warehouse">
            Перейти на склад
          </v-btn>
          <v-btn color="secondary" to="/dashboard" prepend-icon="mdi-view-dashboard" class="ml-2">
            Вернуться на дашборд
          </v-btn>
        </div>

        <div class="mt-6">
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                Отладочная информация
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <pre>{{ JSON.stringify($route, null, 2) }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
// Простой тестовый компонент для проверки навигации
console.log('InstallationsTest component loaded successfully');
</script>

<style scoped>
.installations-test {
  padding: 24px;
}

.test-info {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 8px;
  padding: 16px;
}

.test-info ul {
  margin: 8px 0;
  padding-left: 20px;
}

.test-info li {
  margin: 4px 0;
}

pre {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 4px;
  padding: 12px;
  font-size: 0.875rem;
  overflow: auto;
}
</style>
