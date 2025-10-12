<template>
  <div class="real-objects-list">
    <div class="header">
      <h2>🚗 Реальные объекты из Axenta Cloud</h2>
      <div class="controls">
        <button @click="loadObjects" :disabled="loading" class="btn-primary">
          {{ loading ? 'Загрузка...' : 'Обновить' }}
        </button>
        <button @click="loginWithRealCredentials" :disabled="authLoading" class="btn-secondary">
          {{ authLoading ? 'Авторизация...' : 'Войти как glomos' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-if="authStatus" class="auth-status" :class="authStatus.type">
      {{ authStatus.message }}
    </div>

    <div v-if="loading" class="loading">
      🔄 Загружаем объекты...
    </div>

    <div v-else-if="objects.length > 0" class="objects-grid">
      <div class="stats">
        📊 Найдено объектов: <strong>{{ totalObjects }}</strong> | 
        Страница: <strong>{{ currentPage }}</strong> из <strong>{{ totalPages }}</strong>
      </div>

      <div class="object-card" v-for="object in objects" :key="object.id">
        <div class="object-header">
          <h3>{{ object.name }}</h3>
          <span class="object-status" :class="object.status">
            {{ object.is_active ? '🟢 Активен' : '🔴 Неактивен' }}
          </span>
        </div>
        
        <div class="object-details">
          <div class="detail-row">
            <span class="label">ID:</span>
            <span class="value">{{ object.id }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Уникальный ID:</span>
            <span class="value">{{ object.uniqueId }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Компания:</span>
            <span class="value">{{ object.accountName }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Создатель:</span>
            <span class="value">{{ object.creatorName }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Устройство:</span>
            <span class="value">{{ object.deviceTypeName }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Телефоны:</span>
            <span class="value">{{ object.phoneNumbers?.join(', ') || 'Не указаны' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Последнее сообщение:</span>
            <span class="value">{{ formatDate(object.lastMessageDatetime) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Создан:</span>
            <span class="value">{{ formatDate(object.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="pagination">
        <button 
          @click="loadPage(currentPage - 1)" 
          :disabled="currentPage <= 1 || loading"
          class="btn-pagination"
        >
          ← Предыдущая
        </button>
        <span class="page-info">
          Страница {{ currentPage }} из {{ totalPages }}
        </span>
        <button 
          @click="loadPage(currentPage + 1)" 
          :disabled="currentPage >= totalPages || loading"
          class="btn-pagination"
        >
          Следующая →
        </button>
      </div>
    </div>

    <div v-else-if="!loading" class="no-objects">
      📭 Объекты не найдены. Попробуйте авторизоваться.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '@/context/auth';
import { getObjectsService } from '@/services/objectsService';
import type { ObjectWithRelations } from '@/types/objects';

// Сервисы
const auth = useAuth();
const objectsService = getObjectsService();

// Состояние
const loading = ref(false);
const authLoading = ref(false);
const error = ref('');
const objects = ref<ObjectWithRelations[]>([]);
const authStatus = ref<{message: string, type: 'success' | 'error'} | null>(null);

// Пагинация
const currentPage = ref(1);
const totalObjects = ref(0);
const totalPages = ref(0);
const perPage = ref(20);

// Авторизация с реальными данными
const loginWithRealCredentials = async () => {
  authLoading.value = true;
  authStatus.value = null;
  error.value = '';

  try {
    await auth.login({
      username: 'glomos',
      password: 'A51ewweB'
    });
    
    authStatus.value = {
      message: '✅ Успешная авторизация как glomos!',
      type: 'success'
    };
    
    // Автоматически загружаем объекты после авторизации
    setTimeout(() => {
      loadObjects();
    }, 1000);
    
  } catch (err: any) {
    console.error('Ошибка авторизации:', err);
    authStatus.value = {
      message: `❌ Ошибка авторизации: ${err.message}`,
      type: 'error'
    };
  } finally {
    authLoading.value = false;
  }
};

// Загрузка объектов
const loadObjects = async () => {
  if (!auth.isAuthenticated.value) {
    error.value = 'Необходима авторизация';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    console.log('🔄 Загружаем объекты, страница:', currentPage.value);
    
    const response = await objectsService.getObjects(
      currentPage.value, 
      perPage.value, 
      { ordering: 'name' }
    );
    
    console.log('📋 Ответ сервиса:', response);

    if (response.status === 'success') {
      objects.value = response.data.items;
      totalObjects.value = response.data.total;
      totalPages.value = response.data.total_pages;
      
      console.log(`✅ Загружено ${objects.value.length} объектов из ${totalObjects.value}`);
    } else {
      throw new Error(response.error || 'Неизвестная ошибка');
    }
  } catch (err: any) {
    console.error('❌ Ошибка загрузки объектов:', err);
    error.value = `Ошибка загрузки: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// Загрузка конкретной страницы
const loadPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  
  currentPage.value = page;
  await loadObjects();
};

// Форматирование даты
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Не указано';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// Загружаем при монтировании, если уже авторизованы
onMounted(() => {
  if (auth.isAuthenticated.value) {
    loadObjects();
  }
});
</script>

<style scoped>
.real-objects-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e5e5e7;
}

.header h2 {
  margin: 0;
  color: #1d1d1f;
  font-size: 24px;
}

.controls {
  display: flex;
  gap: 12px;
}

.btn-primary, .btn-secondary, .btn-pagination {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #007aff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056cc;
}

.btn-secondary {
  background: #f2f2f7;
  color: #1d1d1f;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e5ea;
}

.btn-pagination {
  background: #f2f2f7;
  color: #1d1d1f;
  padding: 8px 16px;
  font-size: 13px;
}

.btn-pagination:hover:not(:disabled) {
  background: #e5e5ea;
}

.btn-primary:disabled, .btn-secondary:disabled, .btn-pagination:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #f44336;
}

.auth-status {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.auth-status.success {
  background: #e8f5e8;
  color: #2e7d32;
  border-left: 4px solid #4caf50;
}

.auth-status.error {
  background: #ffebee;
  color: #c62828;
  border-left: 4px solid #f44336;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.stats {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #495057;
}

.objects-grid {
  display: grid;
  gap: 16px;
}

.object-card {
  background: white;
  border: 1px solid #e5e5e7;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.object-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.object-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.object-header h3 {
  margin: 0;
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  margin-right: 12px;
}

.object-status {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.object-status.active {
  background: #e8f5e8;
  color: #2e7d32;
}

.object-status.inactive {
  background: #ffebee;
  color: #c62828;
}

.object-details {
  display: grid;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 140px;
  font-size: 13px;
}

.value {
  color: #1d1d1f;
  text-align: right;
  font-size: 13px;
  word-break: break-word;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 20px 0;
}

.page-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.no-objects {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .controls {
    justify-content: center;
  }

  .object-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .value {
    text-align: left;
  }
}
</style>
