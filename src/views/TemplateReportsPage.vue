<template>
  <div class="template-reports-page">
    <v-container fluid>
      <div class="d-flex align-center gap-3 mb-4">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="$router.push('/settings?tab=templates')"
        />
      </div>
      <ReportTemplates />
    </v-container>
  </div>
</template>

<script setup lang="ts">
import ReportTemplates from '@/components/Settings/ReportTemplates.vue';
</script>

