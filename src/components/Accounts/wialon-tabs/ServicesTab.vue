<template>
  <div class="t">
    <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Поиск услуг" density="compact" variant="outlined" hide-details clearable />
    <div v-if="loading" class="muted">Загрузка…</div>
    <div v-else class="list">
      <div v-for="s in filtered" :key="s.name" class="row">
        <div class="name">{{ s.name }}</div>
        <v-switch :model-value="s.active" color="primary" hide-details inset density="compact" @update:model-value="(v: boolean) => toggle(s, v)" />
        <div class="meta">
          <span v-if="s.max_usage > 0">{{ s.usage }} / {{ s.max_usage }}</span>
          <span v-else-if="s.max_usage === -1">∞</span>
          <span v-else>—</span>
        </div>
      </div>
      <div v-if="filtered.length === 0" class="muted">Ничего не найдено</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiClient } from '@/services/api';
import { computed, ref, watch } from 'vue';

interface ServiceItem { name: string; type: number; usage: number; max_usage: number; cost: string; interval: number; descr?: string; active: boolean }

const props = defineProps<{ connectionId: number; userId: number; visible: boolean }>();
const emit = defineEmits<{ (e: 'snack', p: { text: string; color: 'success'|'error'|'info' }): void }>();

const items = ref<ServiceItem[]>([]);
const loading = ref(false);
const search = ref('');

const load = async () => {
  if (!props.connectionId || !props.userId) return;
  loading.value = true;
  try {
    const r = await apiClient.get(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/services`);
    items.value = r.data?.services || [];
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка загрузки услуг', color: 'error' }); }
  finally { loading.value = false; }
};

watch(() => [props.visible, props.userId], () => { if (props.visible) load(); }, { immediate: true });

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return q ? items.value.filter(i => i.name.toLowerCase().includes(q)) : items.value;
});

const toggle = async (s: ServiceItem, v: boolean) => {
  try {
    await apiClient.put(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/services`, {
      name: s.name, type: s.type || 2, interval: s.interval, cost_table: v ? (s.cost || '0=0') : '',
    });
    s.active = v;
    s.max_usage = v ? -1 : 0;
    emit('snack', { text: 'Услуга обновлена', color: 'success' });
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка', color: 'error' }); }
};
</script>

<style scoped>
.t { display: flex; flex-direction: column; gap: 12px; max-height: 500px; }
.list { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
.row { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 6px 8px; border-radius: 8px; }
.row:hover { background: rgba(0,0,0,0.04); }
.name { font-size: 13px; }
.meta { font-size: 12px; color: rgba(0,0,0,0.6); min-width: 60px; text-align: right; }
.muted { font-size: 13px; color: rgba(0,0,0,0.5); padding: 16px 0; text-align: center; }
</style>
