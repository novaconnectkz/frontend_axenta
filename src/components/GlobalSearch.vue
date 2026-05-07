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
      <v-progress-circular v-if="searching" size="14" width="2" indeterminate color="primary" class="ml-2" />
      <v-icon v-else-if="searchQuery" size="16" class="clear-icon" @mousedown.prevent="clearSearch">mdi-close-circle</v-icon>
    </div>

    <Teleport to="body">
      <div
        v-if="searchOpen"
        class="search-dropdown"
        :style="dropdownStyle"
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
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { dashboardKpiService, type SearchResponse, type SearchResultItem } from "@/services/dashboardKpiService";

defineProps<{ mobile?: boolean }>();

const router = useRouter();

const wrapRef = ref<HTMLElement | null>(null);
const searchQuery = ref("");
const searchFocused = ref(false);
const searching = ref(false);
const searchResults = ref<SearchResponse>({ objects: [], clients: [], query: "" });
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

const searchOpen = computed(() => searchFocused.value && (searchQuery.value.length > 0 || searchTotal.value > 0));
const searchTotal = computed(() => searchResults.value.objects.length + searchResults.value.clients.length);
const searchGroups = computed(() => [
  { key: "objects", label: "Объекты", icon: "mdi-radar", items: searchResults.value.objects },
  { key: "clients", label: "Учётные записи", icon: "mdi-domain", items: searchResults.value.clients },
]);

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  if (searchQuery.value.trim().length < 2) {
    searchResults.value = { objects: [], clients: [], query: "" };
    return;
  }
  searchTimer = setTimeout(runSearch, 300);
}

async function runSearch() {
  const q = searchQuery.value.trim();
  if (q.length < 2) return;
  searching.value = true;
  try {
    searchResults.value = await dashboardKpiService.search(q, 8);
  } catch {
    searchResults.value = { objects: [], clients: [], query: q };
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
  searchResults.value = { objects: [], clients: [], query: "" };
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
  max-height: 480px;
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
</style>
