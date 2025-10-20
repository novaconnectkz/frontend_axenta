<template>
  <v-dialog v-model="dialog" max-width="800" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-help-circle</v-icon>
        Справка и инструкции
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
      </v-card-title>

      <v-card-text class="pa-0">
        <!-- Поиск -->
        <div class="pa-4 border-b">
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Поиск по инструкциям..."
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </div>

        <!-- Результаты поиска -->
        <div class="pa-4">
          <div v-if="filteredInstructions.length === 0 && searchQuery" class="text-center py-8">
            <v-icon size="48" color="grey-lighten-1">mdi-magnify</v-icon>
            <p class="text-grey mt-2">Ничего не найдено по запросу "{{ searchQuery }}"</p>
          </div>

          <div v-else-if="filteredInstructions.length === 0" class="text-center py-8">
            <v-icon size="48" color="grey-lighten-1">mdi-help-circle-outline</v-icon>
            <p class="text-grey mt-2">Инструкции не найдены</p>
          </div>

          <div v-else>
            <div
              v-for="instruction in filteredInstructions"
              :key="instruction.id"
              class="instruction-item mb-4"
            >
              <v-card variant="outlined" class="instruction-card">
                <v-card-title class="instruction-title">
                  <v-icon :icon="instruction.icon" class="mr-2" :color="instruction.color" />
                  {{ instruction.title }}
                </v-card-title>
                
                <v-card-text>
                  <div class="instruction-content">
                    <p class="instruction-description mb-3">{{ instruction.description }}</p>
                    
                    <div v-if="instruction.steps && instruction.steps.length > 0" class="instruction-steps">
                      <h4 class="text-subtitle-2 mb-2">Пошаговая инструкция:</h4>
                      <ol class="steps-list">
                        <li v-for="(step, index) in instruction.steps" :key="index" class="mb-2">
                          {{ step }}
                        </li>
                      </ol>
                    </div>

                    <div v-if="instruction.tips && instruction.tips.length > 0" class="instruction-tips mt-3">
                      <v-alert type="info" variant="tonal" density="compact">
                        <template #title>
                          <v-icon class="mr-1">mdi-lightbulb</v-icon>
                          Полезные советы:
                        </template>
                        <ul class="tips-list mt-2">
                          <li v-for="(tip, index) in instruction.tips" :key="index" class="mb-1">
                            {{ tip }}
                          </li>
                        </ul>
                      </v-alert>
                    </div>

                    <div v-if="instruction.keywords && instruction.keywords.length > 0" class="instruction-keywords mt-3">
                      <v-chip
                        v-for="keyword in instruction.keywords"
                        :key="keyword"
                        size="small"
                        variant="outlined"
                        class="mr-1 mb-1"
                      >
                        {{ keyword }}
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { helpInstructions } from '@/data/helpInstructions';

// Props
const props = defineProps<{
  modelValue: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Reactive data
const searchQuery = ref('');

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const filteredInstructions = computed(() => {
  if (!searchQuery.value.trim()) {
    return helpInstructions;
  }

  const query = searchQuery.value.toLowerCase();
  
  return helpInstructions.filter(instruction => {
    const searchableText = [
      instruction.title,
      instruction.description,
      ...instruction.steps || [],
      ...instruction.tips || [],
      ...instruction.keywords || []
    ].join(' ').toLowerCase();

    return searchableText.includes(query);
  });
});
</script>

<style scoped>
.instruction-item {
  transition: all 0.2s ease;
}

.instruction-card {
  transition: all 0.2s ease;
}

.instruction-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.instruction-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.instruction-description {
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.5;
}

.steps-list {
  padding-left: 1.5rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.steps-list li {
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.tips-list {
  padding-left: 1rem;
  margin: 0;
}

.tips-list li {
  margin-bottom: 0.25rem;
  line-height: 1.4;
}

.instruction-keywords {
  margin-top: 1rem;
}

.border-b {
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}
</style>
