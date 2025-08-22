<template>
  <div class="performance-page">
    <h1>Производительность и Безопасность</h1>
    <p>Система загружается...</p>

    <v-tabs v-model="activeTab">
      <v-tab value="overview">Обзор</v-tab>
      <v-tab value="cache">Кэш</v-tab>
      <v-tab value="database">БД</v-tab>
      <v-tab value="security">Безопасность</v-tab>
      <v-tab value="audit">Аудит</v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item value="overview">
        <v-card class="mt-4">
          <v-card-title>Обзор системы</v-card-title>
          <v-card-text>
            <p>Система работает нормально</p>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="cache">
        <v-card class="mt-4">
          <v-card-title>Управление кэшем</v-card-title>
          <v-card-text>
            <p>Кэш работает нормально</p>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="database">
        <v-card class="mt-4">
          <v-card-title>База данных</v-card-title>
          <v-card-text>
            <p>БД работает нормально</p>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="security">
        <v-card class="mt-4">
          <v-card-title>Безопасность</v-card-title>
          <v-card-text>
            <p>Безопасность в норме</p>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="audit">
        <v-card class="mt-4">
          <v-card-title>Аудит логи</v-card-title>
          <v-card-text>
            <p>Логи доступны</p>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref('overview')
</script>

<style scoped>
.performance-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
