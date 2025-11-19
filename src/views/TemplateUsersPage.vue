<template>
  <div class="template-users-page">
    <v-container fluid>
      <div class="d-flex align-center gap-3 mb-4">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="$router.push('/settings?tab=templates')"
        />
        <div>
          <h1 class="text-h4 font-weight-bold">Шаблоны для создания УЗ</h1>
          <p class="text-body-2 text-medium-emphasis">
            Управление шаблонами для создания учетных записей
          </p>
        </div>
      </div>
      <UserTemplates />
    </v-container>
  </div>
</template>

<script setup lang="ts">
import UserTemplates from '@/components/Settings/UserTemplates.vue';
</script>

