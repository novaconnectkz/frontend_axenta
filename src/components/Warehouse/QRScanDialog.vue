<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="400px"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-qrcode-scan" class="mr-2" />
        Сканирование QR кода
      </v-card-title>

      <v-card-text>
        <!-- Ввод QR кода вручную -->
        <v-text-field
          v-model="qrCode"
          label="QR код"
          variant="outlined"
          density="comfortable"
          placeholder="Введите или отсканируйте QR код"
          prepend-inner-icon="mdi-qrcode"
          @keyup.enter="handleScan"
        />

        <!-- Симуляция сканера (для демо) -->
        <v-card variant="outlined" class="scan-area mb-4">
          <v-card-text class="text-center py-8">
            <v-icon icon="mdi-qrcode-scan" size="64" color="primary" class="mb-4" />
            <div class="text-h6 mb-2">Сканер QR кодов</div>
            <div class="text-body-2 text-medium-emphasis mb-4">
              Наведите камеру на QR код оборудования
            </div>
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-camera"
              @click="simulateScan"
            >
              Симуляция сканирования
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Примеры QR кодов для тестирования -->
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-2">
            Примеры QR кодов для тестирования:
          </v-card-title>
          <v-card-text>
            <div class="demo-qr-codes">
              <v-chip
                v-for="qr in demoQRCodes"
                :key="qr"
                size="small"
                variant="outlined"
                class="ma-1"
                @click="qrCode = qr"
              >
                {{ qr }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>

        <!-- Результат поиска -->
        <v-alert
          v-if="searchResult"
          :type="searchResult.type"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ searchResult.message }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="$emit('update:modelValue', false)"
        >
          Отмена
        </v-btn>
        <v-btn
          color="primary"
          @click="handleScan"
          :loading="loading"
          :disabled="!qrCode"
        >
          Найти
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { warehouseService } from '@/services/warehouseService';

// Props
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  scanned: [qrCode: string];
}>();

// Состояние
const loading = ref(false);
const qrCode = ref('');
const searchResult = ref<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
} | null>(null);

// Демо QR коды
const demoQRCodes = [
  'EQ-1-GT06N001',
  'EQ-2-HIK2043001',
  'EQ-3-FMB920001',
  'EQ-4-PIR001',
  'EQ-5-CAT6001',
  'EQ-6-TPSG1008001',
];

// Методы
const handleScan = async () => {
  if (!qrCode.value.trim()) return;

  try {
    loading.value = true;
    searchResult.value = null;

    // Попытка найти оборудование по QR коду
    const equipment = await warehouseService.searchByQRCode(qrCode.value.trim());
    
    searchResult.value = {
      type: 'success',
      message: `Найдено: ${equipment.model} ${equipment.brand} (${equipment.serial_number})`,
    };

    // Эмитим событие с найденным QR кодом
    emit('scanned', qrCode.value.trim());
    
  } catch (error: any) {
    searchResult.value = {
      type: 'error',
      message: error.message || 'Оборудование с таким QR кодом не найдено',
    };
  } finally {
    loading.value = false;
  }
};

const simulateScan = () => {
  // Симуляция сканирования - выбираем случайный QR код
  const randomQR = demoQRCodes[Math.floor(Math.random() * demoQRCodes.length)];
  qrCode.value = randomQR;
  
  // Автоматически ищем
  setTimeout(() => {
    handleScan();
  }, 500);
};

const resetDialog = () => {
  qrCode.value = '';
  searchResult.value = null;
};

// Сброс при закрытии диалога
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    resetDialog();
  }
});
</script>

<style scoped>
:deep(.v-card-title) {
  background: rgba(var(--v-theme-primary), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.scan-area {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05), rgba(var(--v-theme-primary), 0.15));
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
}

.demo-qr-codes {
  max-height: 100px;
  overflow-y: auto;
}

.demo-qr-codes .v-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-qr-codes .v-chip:hover {
  transform: scale(1.05);
}
</style>
