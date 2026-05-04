<template>
  <div class="t">
    <div v-if="loading" class="muted">Загрузка…</div>
    <div v-else>
      <div v-for="f in fields" :key="f.id" class="row">
        <v-text-field v-model="f.name" label="Имя" density="compact" variant="outlined" hide-details />
        <v-text-field v-model="f.value" label="Значение" density="compact" variant="outlined" hide-details />
        <v-btn icon="mdi-content-save" size="small" variant="text" color="primary" :loading="savingId === f.id" @click="save(f)" />
        <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" :loading="deletingId === f.id" @click="del(f)" />
      </div>
      <div v-if="fields.length === 0" class="muted">Произвольных полей нет</div>
    </div>
    <div class="add">
      <v-text-field v-model="newField.name" label="Имя нового поля" density="compact" variant="outlined" hide-details />
      <v-text-field v-model="newField.value" label="Значение" density="compact" variant="outlined" hide-details />
      <v-btn color="primary" size="small" :disabled="!newField.name" :loading="creating" @click="create">Добавить</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiClient } from '@/services/api';
import { ref, watch } from 'vue';

interface Field { id: number; name: string; value: string }

const props = defineProps<{ connectionId: number; userId: number; visible: boolean }>();
const emit = defineEmits<{ (e: 'snack', p: { text: string; color: 'success'|'error'|'info' }): void }>();

const fields = ref<Field[]>([]);
const loading = ref(false);
const creating = ref(false);
const savingId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const newField = ref({ name: '', value: '' });

const load = async () => {
  if (!props.connectionId || !props.userId) return;
  loading.value = true;
  try {
    const r = await apiClient.get(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/custom-fields`);
    fields.value = r.data?.fields || [];
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка загрузки полей', color: 'error' }); }
  finally { loading.value = false; }
};

watch(() => [props.visible, props.userId], () => { if (props.visible) load(); }, { immediate: true });

const save = async (f: Field) => {
  savingId.value = f.id;
  try {
    await apiClient.post(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/custom-fields`, f);
    emit('snack', { text: 'Поле сохранено', color: 'success' });
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка', color: 'error' }); }
  finally { savingId.value = null; }
};

const del = async (f: Field) => {
  deletingId.value = f.id;
  try {
    await apiClient.delete(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/custom-fields/${f.id}`);
    fields.value = fields.value.filter(x => x.id !== f.id);
    emit('snack', { text: 'Удалено', color: 'success' });
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка', color: 'error' }); }
  finally { deletingId.value = null; }
};

const create = async () => {
  creating.value = true;
  try {
    await apiClient.post(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/custom-fields`, { id: 0, ...newField.value });
    newField.value = { name: '', value: '' };
    await load();
    emit('snack', { text: 'Создано', color: 'success' });
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка', color: 'error' }); }
  finally { creating.value = false; }
};
</script>

<style scoped>
.t { display: flex; flex-direction: column; gap: 12px; }
.row { display: grid; grid-template-columns: 1fr 1fr auto auto; gap: 8px; align-items: center; padding: 4px 0; }
.add { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center; padding-top: 12px; border-top: 1px dashed rgba(0,0,0,0.1); }
.muted { font-size: 13px; color: rgba(0,0,0,0.5); padding: 16px 0; text-align: center; }
</style>
