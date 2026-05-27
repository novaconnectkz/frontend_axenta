<template>
  <div ref="wrapRef" class="search-wrap" :class="{ mobile }">
    <div class="search-box" :class="{ focused: searchFocused || searchOpen }">
      <v-icon size="16" class="search-icon">mdi-magnify</v-icon>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск: объект, клиент, № контракта, № счёта..."
        class="search-input"
        @focus="onFocus"
        @blur="onSearchBlur"
        @input="onSearchInput"
        @keydown.escape="closeSearch"
      />
      <v-progress-circular v-show="searching" size="14" width="2" indeterminate color="primary" class="ml-2" />
      <v-icon v-show="!searching && searchQuery" size="16" class="clear-icon" @mousedown.prevent="clearSearch">mdi-close-circle</v-icon>
    </div>

    <Teleport to="body">
      <div
        v-if="searchOpen"
        class="search-dropdown"
        :style="dropdownStyle"
        @mousedown.prevent
      >
        <div v-if="!searchTotal && !searching && searchQuery.length >= 2" class="search-empty">
          Ничего не найдено
        </div>

        <template v-for="group in searchGroups" :key="group.key">
          <div v-if="group.items.length" class="search-group">
            <div class="search-group-title">
              <v-icon size="14" class="mr-2">{{ group.icon }}</v-icon>
              {{ group.label }} <span class="search-group-count">{{ group.items.length }}</span>
            </div>
            <div
              v-for="item in group.items"
              :key="item.id"
              class="search-item"
              @mousedown.prevent="goToResult(item)"
            >
              <div class="search-item-title">{{ item.title }}</div>
              <div v-if="item.subtitle" class="search-item-subtitle">{{ item.subtitle }}</div>
            </div>
          </div>
        </template>

        <div v-if="searchQuery.length < 2 && !searching" class="search-hint">
          Введите минимум 2 символа
        </div>

        <div v-if="searchQuery.length >= 2" class="search-scope">
          <div class="search-scope-title">Искать в</div>
          <div class="search-scope-chips">
            <button
              v-for="opt in scopeOptions"
              :key="opt.key"
              type="button"
              class="search-chip"
              :class="{ active: activeScope.has(opt.key) }"
              @mousedown.prevent="toggleScope(opt.key)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  dashboardKpiService,
  type SearchResponse,
  type SearchResultItem,
  type SearchScope,
} from "@/services/dashboardKpiService";

defineProps<{ mobile?: boolean }>();

const router = useRouter();

const wrapRef = ref<HTMLElement | null>(null);
const searchQuery = ref("");
const searchFocused = ref(false);
const searching = ref(false);
const searchResults = ref<SearchResponse>({
  objects: [],
  clients: [],
  contracts: [],
  invoices: [],
  users: [],
  installations: [],
  query: "",
});
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const dropdownPos = ref({ top: 0, right: 0, width: 480 });
const dropdownStyle = computed(() => ({
  top: dropdownPos.value.top + "px",
  right: dropdownPos.value.right + "px",
  width: dropdownPos.value.width + "px",
}));

function updateDropdownPos() {
  const el = wrapRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const desiredWidth = Math.max(rect.width, 480);
  const right = Math.max(8, window.innerWidth - rect.right);
  dropdownPos.value = {
    top: rect.bottom + 6,
    right,
    width: Math.min(desiredWidth, window.innerWidth - 16),
  };
}

function onFocus() {
  searchFocused.value = true;
  updateDropdownPos();
}

onMounted(() => {
  window.addEventListener("scroll", updateDropdownPos, true);
  window.addEventListener("resize", updateDropdownPos);
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateDropdownPos, true);
  window.removeEventListener("resize", updateDropdownPos);
});

const scopeOptions: { key: SearchScope; label: string }[] = [
  { key: "objects", label: "Объекты" },
  { key: "clients", label: "Учётные записи" },
  { key: "contracts", label: "Контракты" },
  { key: "invoices", label: "Счета" },
  { key: "users", label: "Пользователи" },
  { key: "installations", label: "Монтажи" },
];

// activeScope — set scope-чипсов. Пустой = искать везде.
const activeScope = reactive(new Set<SearchScope>());

function toggleScope(key: SearchScope) {
  if (activeScope.has(key)) activeScope.delete(key);
  else activeScope.add(key);
  // Перезапустить поиск с новым scope при изменении
  if (searchQuery.value.trim().length >= 2) runSearch();
}

// Dropdown открыт пока в поле есть ≥2 символа ИЛИ есть результаты — focus не требуем,
// чтобы posthook-blur от router/snackbar/setInterval не закрывал dropdown.
// Закрытие — только через Esc (closeSearch) или крестик (clearSearch).
const searchOpen = computed(
  () => searchQuery.value.length >= 2 || (searchFocused.value && searchTotal.value > 0),
);
const searchTotal = computed(
  () =>
    searchResults.value.objects.length +
    searchResults.value.clients.length +
    searchResults.value.contracts.length +
    searchResults.value.invoices.length +
    searchResults.value.users.length +
    searchResults.value.installations.length,
);
const searchGroups = computed(() => [
  { key: "objects", label: "Объекты", icon: "mdi-radar", items: searchResults.value.objects },
  { key: "clients", label: "Учётные записи", icon: "mdi-domain", items: searchResults.value.clients },
  { key: "contracts", label: "Контракты", icon: "mdi-file-document-outline", items: searchResults.value.contracts },
  { key: "invoices", label: "Счета", icon: "mdi-receipt-text-outline", items: searchResults.value.invoices },
  { key: "users", label: "Пользователи", icon: "mdi-account-circle-outline", items: searchResults.value.users },
  { key: "installations", label: "Монтажи", icon: "mdi-wrench-outline", items: searchResults.value.installations },
]);

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  if (searchQuery.value.trim().length < 2) {
    searchResults.value = {
      objects: [],
      clients: [],
      contracts: [],
      invoices: [],
      users: [],
      installations: [],
      query: "",
    };
    return;
  }
  searchTimer = setTimeout(runSearch, 300);
}

async function runSearch() {
  const q = searchQuery.value.trim();
  if (q.length < 2) return;
  searching.value = true;
  try {
    const scope = activeScope.size > 0 ? Array.from(activeScope) : undefined;
    searchResults.value = await dashboardKpiService.search(q, 15, scope);
  } catch {
    searchResults.value = {
      objects: [],
      clients: [],
      contracts: [],
      invoices: [],
      users: [],
      installations: [],
      query: q,
    };
  } finally {
    searching.value = false;
    updateDropdownPos();
  }
}

function onSearchBlur() {
  setTimeout(() => { searchFocused.value = false; }, 200);
}

function clearSearch() {
  searchQuery.value = "";
  searchResults.value = {
    objects: [],
    clients: [],
    contracts: [],
    invoices: [],
    users: [],
    installations: [],
    query: "",
  };
}

function closeSearch() {
  clearSearch();
  searchFocused.value = false;
}

function goToResult(item: SearchResultItem) {
  router.push(item.url);
  closeSearch();
}
</script>

<style scoped>
.search-wrap {
  position: relative;
  width: 380px;
  max-width: 100%;
}
.search-wrap.mobile { width: 100%; }

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e5e5ea;
  border-radius: 12px;
  padding: 8px 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-box.focused {
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}
.search-icon { color: #8e8e93; margin-right: 8px; }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #1d1d1f;
  font-family: inherit;
  min-width: 0;
}
.search-input::placeholder { color: #c7c7cc; }
.clear-icon { color: #c7c7cc; cursor: pointer; }
.clear-icon:hover { color: #8e8e93; }

[data-theme="dark"] .search-box {
  background: #1c1c1e;
  border-color: #38383a;
}
[data-theme="dark"] .search-box.focused {
  border-color: #0a84ff;
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.18);
}
[data-theme="dark"] .search-input { color: #f5f5f7; }
[data-theme="dark"] .search-input::placeholder { color: #636366; }
[data-theme="dark"] .search-icon { color: #98989d; }

@media (max-width: 768px) {
  .search-wrap { width: 100%; }
}
</style>

<!-- Стили dropdown без scoped — он Teleport'ится в body, scoped селекторы туда не дойдут. -->
<style>
.search-dropdown {
  position: fixed;
  max-height: 560px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e5e5ea;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 9999;
  padding: 8px 0;
}
.search-dropdown .search-empty,
.search-dropdown .search-hint {
  padding: 16px;
  text-align: center;
  color: #8e8e93;
  font-size: 13px;
}
.search-dropdown .search-group { padding: 4px 0; }
.search-dropdown .search-group + .search-group { border-top: 1px solid #f5f5f7; }
.search-dropdown .search-group-title {
  display: flex;
  align-items: center;
  padding: 8px 14px 6px;
  color: #8e8e93;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.search-dropdown .search-group-count {
  margin-left: auto;
  background: #f2f2f7;
  color: #6e6e73;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 10px;
  letter-spacing: 0;
}
.search-dropdown .search-item {
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.1s;
}
.search-dropdown .search-item:hover { background: #f5f5f7; }
.search-dropdown .search-item-title { font-size: 13px; font-weight: 500; color: #1d1d1f; }
.search-dropdown .search-item-subtitle { font-size: 11px; color: #8e8e93; margin-top: 1px; }

.search-dropdown .search-scope {
  border-top: 1px solid #f5f5f7;
  padding: 10px 14px 12px;
  background: #fafafc;
  border-radius: 0 0 14px 14px;
}
.search-dropdown .search-scope-title {
  color: #8e8e93;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.search-dropdown .search-scope-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.search-dropdown .search-chip {
  background: white;
  border: 1px solid #e5e5ea;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  color: #1d1d1f;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
  font-family: inherit;
}
.search-dropdown .search-chip:hover { background: #f5f5f7; }
.search-dropdown .search-chip.active {
  background: #007aff;
  border-color: #007aff;
  color: white;
}

[data-theme="dark"] .search-dropdown {
  background: #1c1c1e;
  border-color: #38383a;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
[data-theme="dark"] .search-dropdown .search-empty,
[data-theme="dark"] .search-dropdown .search-hint { color: #98989d; }
[data-theme="dark"] .search-dropdown .search-group + .search-group { border-top-color: #2c2c2e; }
[data-theme="dark"] .search-dropdown .search-group-title { color: #636366; }
[data-theme="dark"] .search-dropdown .search-group-count { background: #2c2c2e; color: #98989d; }
[data-theme="dark"] .search-dropdown .search-item:hover { background: #2c2c2e; }
[data-theme="dark"] .search-dropdown .search-item-title { color: #f5f5f7; }
[data-theme="dark"] .search-dropdown .search-item-subtitle { color: #98989d; }
[data-theme="dark"] .search-dropdown .search-scope {
  background: #2c2c2e;
  border-top-color: #38383a;
}
[data-theme="dark"] .search-dropdown .search-scope-title { color: #636366; }
[data-theme="dark"] .search-dropdown .search-chip {
  background: #1c1c1e;
  border-color: #38383a;
  color: #f5f5f7;
}
[data-theme="dark"] .search-dropdown .search-chip:hover { background: #2c2c2e; }
[data-theme="dark"] .search-dropdown .search-chip.active {
  background: #0a84ff;
  border-color: #0a84ff;
  color: white;
}
</style>
