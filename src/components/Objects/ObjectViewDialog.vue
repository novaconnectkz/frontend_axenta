<template>
  <v-dialog v-model="show" max-width="900">
    <AppleCard v-if="object">
      <template #header>
        <div class="view-dialog-header">
          <div class="object-title-section">
            <v-icon :icon="getTypeIcon(object.type)" size="24" class="mr-2" />
            <div>
              <h3>{{ object.name }}</h3>
              <p class="text-caption">{{ getTypeText(object.type) }}</p>
            </div>
          </div>
          <div class="object-status-section">
            <v-chip :text="getStatusText(object.status)" :color="getStatusColor(object.status)" variant="tonal" />
          </div>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
        </div>
      </template>

      <div class="object-details">
        <v-row>
          <v-col cols="12" md="6">
            <div class="detail-section">
              <h4 class="section-title">Основная информация</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">IMEI:</span>
                  <span class="detail-value">{{ object.imei || 'Не указан' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Телефон:</span>
                  <span class="detail-value">{{ object.phone_number || 'Не указан' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Серийный номер:</span>
                  <span class="detail-value">{{ object.serial_number || 'Не указан' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Внешний ID:</span>
                  <span class="detail-value">{{ object.external_id || 'Не указан' }}</span>
                </div>
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="detail-section">
              <h4 class="section-title">Связи</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Договор:</span>
                  <span class="detail-value">
                    {{ object.contract?.client_name || 'Не указан' }}
                    <span v-if="object.contract" class="text-caption">
                      (№{{ object.contract.id }})
                    </span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Локация:</span>
                  <span class="detail-value">{{ object.location?.name || 'Не указана' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Шаблон:</span>
                  <span class="detail-value">{{ object.template?.name || 'Не указан' }}</span>
                </div>
              </div>
            </div>
          </v-col>

          <v-col cols="12" v-if="object.address">
            <div class="detail-section">
              <h4 class="section-title">Местоположение</h4>
              <div class="detail-item">
                <v-icon icon="mdi-map-marker" size="16" class="mr-2" />
                {{ object.address }}
              </div>
              <div v-if="object.latitude && object.longitude" class="detail-item mt-2">
                <v-icon icon="mdi-crosshairs-gps" size="16" class="mr-2" />
                {{ object.latitude }}, {{ object.longitude }}
              </div>
            </div>
          </v-col>

          <v-col cols="12" v-if="object.notes">
            <div class="detail-section">
              <h4 class="section-title">Заметки</h4>
              <p class="detail-notes">{{ object.notes }}</p>
            </div>
          </v-col>

          <v-col cols="12" v-if="object.tags && object.tags.length">
            <div class="detail-section">
              <h4 class="section-title">Теги</h4>
              <div class="tags-container">
                <v-chip v-for="tag in object.tags" :key="tag" :text="tag" size="small" variant="outlined"
                  class="mr-2 mb-2" />
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <AppleButton variant="secondary" prepend-icon="mdi-pencil" @click="$emit('edit')">
            Редактировать
          </AppleButton>
          <AppleButton variant="danger" prepend-icon="mdi-delete" @click="$emit('delete')">
            Удалить
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import {
  getStatusColor,
  getStatusText,
  getTypeIcon,
  getTypeText,
} from '@/utils/objectsHelpers';

defineProps<{
  object: any | null;
}>();

const show = defineModel<boolean>('show', { required: true });

defineEmits<{
  close: [];
  edit: [];
  delete: [];
}>();
</script>

<style scoped>
.view-dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.object-title-section {
  display: flex;
  align-items: center;
}

.object-status-section {
  margin-left: 16px;
}

.object-details {
  padding: 20px;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 120px;
}

.detail-value {
  color: var(--text-primary);
  flex: 1;
}

.detail-notes {
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

[data-theme="dark"] .section-title,
[data-theme="dark"] .detail-value {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .detail-label {
  color: var(--text-secondary-dark);
}

[data-theme="dark"] .detail-item {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}
</style>
