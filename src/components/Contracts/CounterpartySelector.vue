<template>
  <div class="counterparty-selector">
    <label class="apple-input-label">
      <v-icon icon="mdi-account-cash" size="18" class="mr-1" />
      Контрагент (единый лицевой счёт)
    </label>
    <v-autocomplete
      :model-value="modelValue ?? null"
      :items="items"
      :loading="loading"
      item-title="name"
      item-value="id"
      placeholder="Поиск по названию или ИНН…"
      variant="outlined"
      density="compact"
      clearable
      no-filter
      hide-details="auto"
      persistent-hint
      hint="Пусто — контрагент определится автоматически по ИНН/имени. Выберите существующего, чтобы привязать договор к его общему лицевому счёту."
      @update:search="onSearch"
      @update:model-value="onSelect"
    >
      <template #item="{ props, item }">
        <v-list-item v-bind="props" :title="item.raw.name">
          <template #subtitle>
            {{ item.raw.tax_id ? `ИНН ${item.raw.tax_id}` : "без ИНН" }}
          </template>
          <template v-if="item.raw.manual_review" #append>
            <v-icon
              icon="mdi-alert-circle-outline"
              color="warning"
              size="18"
              title="Требует проверки"
            />
          </template>
        </v-list-item>
      </template>
    </v-autocomplete>
  </div>
</template>

<script setup lang="ts">
/**
 * Ф4b-followon: выбор существующего контрагента для привязки договора к его
 * единому лицевому счёту. Пусто → BE авто-резолвит/создаёт контрагента (Ф4a).
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import counterpartiesService, {
  type CounterpartySearchItem,
} from "@/services/counterpartiesService";

const props = defineProps<{
  modelValue?: number | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: number | null): void;
}>();

const items = ref<CounterpartySearchItem[]>([]);
const loading = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let searchSeq = 0; // отбрасываем устаревшие ответы (out-of-order)

// Слияние seed-элемента (выбранный) с результатами поиска без дублей.
const mergeItem = (it: CounterpartySearchItem) => {
  if (!items.value.some((x) => x.id === it.id)) {
    items.value = [it, ...items.value];
  }
};

const onSearch = (q: string) => {
  if (searchTimer) clearTimeout(searchTimer);
  const query = (q || "").trim();
  if (query.length < 2) return;
  const seq = ++searchSeq;
  searchTimer = setTimeout(async () => {
    loading.value = true;
    try {
      const res = await counterpartiesService.search(query);
      if (seq === searchSeq) items.value = res; // только самый свежий ответ
    } catch (e) {
      console.warn("Ошибка поиска контрагентов:", e);
    } finally {
      if (seq === searchSeq) loading.value = false;
    }
  }, 300);
};

const onSelect = (value: number | null) => {
  emit("update:modelValue", value ?? null);
};

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

// Предзагрузка имени уже выбранного контрагента (форма редактирования).
const seedSelected = async (id?: number | null) => {
  if (!id) return;
  if (items.value.some((x) => x.id === id)) return;
  try {
    const cp = await counterpartiesService.get(id);
    if (cp?.id) {
      mergeItem({
        id: cp.id,
        name: cp.name,
        tax_id: cp.tax_id,
        id_type: cp.id_type,
        manual_review: cp.manual_review,
      });
    }
  } catch (e) {
    console.warn("Не удалось загрузить контрагента:", e);
  }
};

onMounted(() => seedSelected(props.modelValue));
watch(
  () => props.modelValue,
  (id) => seedSelected(id)
);
</script>

<style scoped>
.counterparty-selector {
  width: 100%;
}
.apple-input-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--apple-label, rgba(0, 0, 0, 0.7));
  margin-bottom: 4px;
}
</style>
