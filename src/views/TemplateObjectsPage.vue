<template>
  <div class="template-objects-page">
    <v-container fluid>
      <div class="d-flex align-center gap-3 mb-4">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="$router.push('/settings?tab=templates')"
        />
        <div>
          <h1 class="text-h4 font-weight-bold">Шаблоны для создания объектов</h1>
          <p class="text-body-2 text-medium-emphasis">
            Управление шаблонами для создания объектов мониторинга
          </p>
        </div>
      </div>
      <ObjectTemplates />
    </v-container>
  </div>
</template>

<script setup lang="ts">
import ObjectTemplates from '@/components/Settings/ObjectTemplates.vue';
</script>

