<template>
  <v-card class="filters-card" flat>
    <v-card-text class="compact-card-text">
      <v-row no-gutters align="center" class="main-filters-row">
        <!-- Поиск -->
        <v-col cols="12" sm="12" md="4" lg="4" xl="4" class="search-col">
          <v-text-field 
            v-model="localFilters.search" 
            label="Поиск компаний" 
            variant="outlined" 
            density="compact" 
            clearable 
            hide-details
            rounded="lg"
            @input="debouncedEmitFilters"
            :color="isMultipleSearch ? 'primary' : undefined"
          >
            <template #prepend-inner>
              <v-tooltip :text="searchHint" location="bottom">
                <template #activator="{ props }">
                  <v-icon 
                    v-bind="props" 
                    size="small"
                    :icon="isMultipleSearch ? 'mdi-format-list-checks' : 'mdi-magnify'" 
                    :color="isMultipleSearch ? 'primary' : undefined"
                  />
                </template>
              </v-tooltip>
            </template>
            
            <template #append-inner v-if="isMultipleSearch">
              <v-tooltip text="Активен точный поиск по нескольким компаниям">
                <template #activator="{ props }">
                  <v-chip v-bind="props" size="x-small" color="primary" variant="flat">
                    {{ searchTermsArray.length }}
                  </v-chip>
                </template>
              </v-tooltip>
            </template>
          </v-text-field>
        </v-col>

        <!-- Статус -->
        <v-col cols="6" sm="4" md="2" lg="2" xl="2" class="status-col">
          <v-select 
            v-model="localFilters.is_active" 
            label="Статус" 
            :items="statusOptions" 
            variant="outlined"
            density="compact" 
            clearable 
            hide-details
            rounded="lg"
            @update:model-value="emitFilters"
          >
            <template #prepend-inner>
              <v-icon size="small">mdi-toggle-switch</v-icon>
            </template>
          </v-select>
        </v-col>

        <!-- Количество записей -->
        <v-col cols="6" sm="3" md="1" lg="1" xl="1" class="limit-col">
          <v-select 
            v-model="localFilters.limit" 
            label="На странице" 
            :items="limitOptions" 
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            @update:model-value="emitFilters"
          >
            <template #prepend-inner>
              <v-icon size="small">mdi-format-list-numbered</v-icon>
            </template>
          </v-select>
        </v-col>

        <!-- Действия -->
        <v-col cols="12" sm="5" md="5" lg="5" xl="5" class="filter-actions actions-col">
          <div class="actions-container">
            <!-- Кнопка дополнительных фильтров -->
            <v-btn
              variant="outlined"
              height="40"
              density="compact"
              rounded="lg"
              @click="showAdvancedFilters = !showAdvancedFilters"
              :prepend-icon="$vuetify.display.smAndDown ? undefined : 'mdi-tune'"
              :icon="$vuetify.display.smAndDown ? 'mdi-tune' : undefined"
              :append-icon="$vuetify.display.smAndDown ? undefined : (showAdvancedFilters ? 'mdi-chevron-up' : 'mdi-chevron-down')"
              :color="showAdvancedFilters || advancedFiltersCount > 0 ? 'primary' : 'default'"
              class="advanced-toggle-btn"
            >
              <span class="btn-text">Дополнительно</span>
              <v-badge 
                v-if="advancedFiltersCount > 0 && !showAdvancedFilters && !$vuetify.display.smAndDown"
                :content="advancedFiltersCount"
                color="success"
                inline
              />
            </v-btn>
            
            <v-btn 
              variant="outlined" 
              :prepend-icon="$vuetify.display.smAndDown ? undefined : 'mdi-filter-off'"
              :icon="$vuetify.display.smAndDown ? 'mdi-filter-off' : undefined"
              @click="clearFilters"
              height="40"
              color="warning"
              density="compact"
              rounded="lg"
              class="clear-btn"
            >
              <span class="btn-text">Сбросить</span>
            </v-btn>
            
            <v-btn 
              variant="outlined" 
              :prepend-icon="$vuetify.display.smAndDown ? undefined : 'mdi-refresh'"
              :icon="$vuetify.display.smAndDown ? 'mdi-refresh' : undefined"
              @click="$emit('refresh')" 
              :loading="loading"
              height="40"
              color="primary"
              density="compact"
              rounded="lg"
              class="refresh-btn"
            >
              <span class="btn-text">Обновить</span>
            </v-btn>
          </div>
        </v-col>
      </v-row>
      
      <!-- Чипы с найденными компаниями (вынесены из поля поиска) -->
      <v-row v-if="isMultipleSearch && searchTermsArray.length > 0" no-gutters class="mt-1">
        <v-col cols="12">
          <div class="search-chips">
            <v-chip
              v-for="(term, index) in searchTermsArray"
              :key="index"
              size="x-small"
              color="primary"
              variant="outlined"
              class="mr-1"
              closable
              @click:close="removeSearchTerm(index)"
            >
              {{ term }}
            </v-chip>
          </div>
        </v-col>
      </v-row>

      <!-- Дополнительные фильтры (коллапсируемые) -->
      <v-expand-transition>
        <div v-if="showAdvancedFilters" class="advanced-filters">
          <v-divider class="my-4">
            <template #default>
              <v-chip size="small" color="primary" variant="outlined">
                <v-icon start>mdi-filter-variant</v-icon>
                Дополнительные фильтры
              </v-chip>
            </template>
          </v-divider>
          
          <v-row class="advanced-filters-row">
            <!-- Город -->
            <v-col cols="12" sm="6" md="3">
              <v-select 
                v-model="localFilters.city" 
                label="Город" 
                :items="cityOptions" 
                variant="outlined"
                density="compact" 
                clearable 
                hide-details
                rounded="lg"
                @update:model-value="emitFilters"
              >
                <template #prepend-inner>
                  <v-icon color="primary" size="small">mdi-map-marker</v-icon>
                </template>
              </v-select>
            </v-col>
            
            <!-- Страна -->
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="localFilters.country"
                label="Страна"
                :items="countryOptions"
                variant="outlined"
                density="compact"
                clearable
                hide-details
                rounded="lg"
                @update:model-value="emitFilters"
              >
                <template #prepend-inner>
                  <v-icon color="success" size="small">mdi-flag</v-icon>
                </template>
              </v-select>
            </v-col>
            
            <!-- Язык -->
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="localFilters.language"
                label="Язык"
                :items="languageOptions"
                variant="outlined"
                density="compact"
                clearable
                hide-details
                rounded="lg"
                @update:model-value="emitFilters"
              >
                <template #prepend-inner>
                  <v-icon color="info" size="small">mdi-translate</v-icon>
                </template>
              </v-select>
            </v-col>
            
            <!-- Валюта -->
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="localFilters.currency"
                label="Валюта"
                :items="currencyOptions"
                variant="outlined"
                density="compact"
                clearable
                hide-details
                rounded="lg"
                @update:model-value="emitFilters"
              >
                <template #prepend-inner>
                  <v-icon color="warning" size="small">mdi-currency-rub</v-icon>
                </template>
              </v-select>
            </v-col>
          </v-row>
          
          <!-- Дополнительные настройки -->
          <v-row class="mt-2">
            <v-col cols="12" md="4">
              <v-switch
                v-model="localFilters.include_usage"
                label="Показать статистику использования"
                color="primary"
                density="compact"
                @update:model-value="emitFilters"
              >
                <template #prepend>
                  <v-icon color="primary">mdi-chart-line</v-icon>
                </template>
              </v-switch>
            </v-col>
            <v-col cols="12" md="8" class="d-flex align-center justify-end">
              <v-chip 
                size="small" 
                color="success" 
                variant="tonal"
                v-if="advancedFiltersCount > 0"
              >
                <v-icon start>mdi-check</v-icon>
                Активно фильтров: {{ advancedFiltersCount }}
              </v-chip>
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
    </v-card-text>

    <!-- Индикатор активных фильтров -->
    <v-card-actions v-if="hasActiveFilters" class="pt-0">
      <v-chip-group>
        <v-chip
          v-if="localFilters.search"
          size="small"
          closable
          @click:close="clearFilter('search')"
        >
          <v-icon start>mdi-magnify</v-icon>
          Поиск: {{ localFilters.search.length > 20 ? localFilters.search.substring(0, 20) + '...' : localFilters.search }}
        </v-chip>
        
        <v-chip
          v-if="localFilters.is_active !== null"
          size="small"
          closable
          @click:close="clearFilter('is_active')"
        >
          <v-icon start>mdi-toggle-switch</v-icon>
          {{ localFilters.is_active ? 'Активные' : 'Неактивные' }}
        </v-chip>
        
        <v-chip
          v-if="localFilters.city"
          size="small"
          closable
          @click:close="clearFilter('city')"
        >
          <v-icon start>mdi-map-marker</v-icon>
          {{ localFilters.city }}
        </v-chip>
        
        <v-chip
          v-if="localFilters.country && localFilters.country !== 'Russia'"
          size="small"
          closable
          @click:close="clearFilter('country')"
        >
          <v-icon start>mdi-flag</v-icon>
          {{ getCountryLabel(localFilters.country) }}
        </v-chip>
        
        <v-chip
          v-if="localFilters.language && localFilters.language !== 'ru'"
          size="small"
          closable
          @click:close="clearFilter('language')"
        >
          <v-icon start>mdi-translate</v-icon>
          {{ getLanguageLabel(localFilters.language) }}
        </v-chip>
        
        <v-chip
          v-if="localFilters.currency && localFilters.currency !== 'RUB'"
          size="small"
          closable
          @click:close="clearFilter('currency')"
        >
          <v-icon start>mdi-currency-rub</v-icon>
          {{ getCurrencyLabel(localFilters.currency) }}
        </v-chip>
      </v-chip-group>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CompanyFilters } from '@/types/companies'
import { 
  COMPANY_FILTERS_DEFAULTS,
  COUNTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  CURRENCY_OPTIONS
} from '@/types/companies'

// Props
interface Props {
  filters: CompanyFilters
  loading?: boolean
  companies?: Array<{ 
    city: string; 
    country?: string; 
    language?: string; 
    currency?: string;
    is_active: boolean;
  }>
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  companies: () => []
})

// Emits
const emit = defineEmits<{
  'update:filters': [filters: CompanyFilters]
  'refresh': []
}>()

// Reactive data
const localFilters = ref<CompanyFilters>({ ...props.filters })
const showAdvancedFilters = ref(false)

// Debounce функция
const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }) as T
}

// Динамические опции статуса на основе данных
const statusOptions = computed(() => {
  const activeCount = props.companies.filter(c => c.is_active).length
  const inactiveCount = props.companies.filter(c => !c.is_active).length
  
  return [
    { title: `Все (${props.companies.length})`, value: null },
    { title: `Активные (${activeCount})`, value: true },
    { title: `Неактивные (${inactiveCount})`, value: false }
  ]
})

const limitOptions = [10, 25, 50, 100]

// Динамические опции городов на основе данных
const cityOptions = computed(() => {
  const cities = new Set<string>()
  props.companies.forEach(company => {
    if (company.city && company.city.trim()) {
      cities.add(company.city.trim())
    }
  })
  
  const sortedCities = Array.from(cities).sort((a, b) => a.localeCompare(b, 'ru'))
  return sortedCities.map(city => ({ 
    title: `${city} (${props.companies.filter(c => c.city === city).length})`, 
    value: city 
  }))
})

// Динамические опции стран на основе данных
const countryOptions = computed(() => {
  const countries = new Set<string>()
  props.companies.forEach(company => {
    if (company.country && company.country.trim()) {
      countries.add(company.country.trim())
    }
  })
  
  const sortedCountries = Array.from(countries).sort((a, b) => a.localeCompare(b, 'ru'))
  return sortedCountries.map(country => {
    const countryLabel = COUNTRY_OPTIONS.find(opt => opt.value === country)?.label || country
    const count = props.companies.filter(c => c.country === country).length
    return { 
      title: `${countryLabel} (${count})`, 
      value: country 
    }
  })
})

// Динамические опции языков на основе данных
const languageOptions = computed(() => {
  const languages = new Set<string>()
  props.companies.forEach(company => {
    if (company.language && company.language.trim()) {
      languages.add(company.language.trim())
    }
  })
  
  const sortedLanguages = Array.from(languages).sort()
  return sortedLanguages.map(language => {
    const languageLabel = LANGUAGE_OPTIONS.find(opt => opt.value === language)?.label || language
    const count = props.companies.filter(c => c.language === language).length
    return { 
      title: `${languageLabel} (${count})`, 
      value: language 
    }
  })
})

// Динамические опции валют на основе данных
const currencyOptions = computed(() => {
  const currencies = new Set<string>()
  props.companies.forEach(company => {
    if (company.currency && company.currency.trim()) {
      currencies.add(company.currency.trim())
    }
  })
  
  const sortedCurrencies = Array.from(currencies).sort()
  return sortedCurrencies.map(currency => {
    const currencyLabel = CURRENCY_OPTIONS.find(opt => opt.value === currency)?.label || currency
    const count = props.companies.filter(c => c.currency === currency).length
    return { 
      title: `${currencyLabel} (${count})`, 
      value: currency 
    }
  })
})

// Computed properties
const isMultipleSearch = computed(() => {
  if (!localFilters.value.search) return false
  const searchTerms = localFilters.value.search.split(',').map(term => term.trim()).filter(term => term.length > 0)
  return searchTerms.length > 1
})

const searchTermsArray = computed(() => {
  if (!localFilters.value.search) return []
  return localFilters.value.search.split(',').map(term => term.trim()).filter(term => term.length > 0)
})

const searchHint = computed(() => {
  if (!localFilters.value.search) {
    return 'Введите название компании или несколько через запятую для точного поиска'
  }
  
  const searchTerms = localFilters.value.search.split(',').map(term => term.trim()).filter(term => term.length > 0)
  if (searchTerms.length > 1) {
    return `Поиск по ${searchTerms.length} компаниям: ${searchTerms.join(', ')}`
  }
  
  return 'Поиск по частичному совпадению или добавьте запятую для точного поиска'
})

const hasActiveFilters = computed(() => {
  const defaults = COMPANY_FILTERS_DEFAULTS
  return (
    localFilters.value.search !== defaults.search ||
    localFilters.value.is_active !== defaults.is_active ||
    localFilters.value.city !== defaults.city ||
    (localFilters.value.country && localFilters.value.country !== 'Russia') ||
    (localFilters.value.language && localFilters.value.language !== 'ru') ||
    (localFilters.value.currency && localFilters.value.currency !== 'RUB')
  )
})

const advancedFiltersCount = computed(() => {
  let count = 0
  if (localFilters.value.city) count++
  if (localFilters.value.country && localFilters.value.country !== 'Russia') count++
  if (localFilters.value.language && localFilters.value.language !== 'ru') count++
  if (localFilters.value.currency && localFilters.value.currency !== 'RUB') count++
  if (!localFilters.value.include_usage) count++ // Если выключена статистика
  return count
})

// Methods
const emitFilters = () => {
  localFilters.value.page = 1 // Сбрасываем страницу при изменении фильтров
  emit('update:filters', { ...localFilters.value })
}

const debouncedEmitFilters = debounce(emitFilters, 500)

const clearFilters = () => {
  localFilters.value = { ...COMPANY_FILTERS_DEFAULTS }
  emitFilters()
}

const clearFilter = (filterKey: keyof CompanyFilters) => {
  switch (filterKey) {
    case 'search':
    case 'city':
    case 'country':
    case 'language':
    case 'currency':
      localFilters.value[filterKey] = ''
      break
    case 'is_active':
      localFilters.value[filterKey] = null
      break
    case 'include_usage':
      localFilters.value[filterKey] = true
      break
    default:
      localFilters.value[filterKey] = COMPANY_FILTERS_DEFAULTS[filterKey] as any
  }
  emitFilters()
}

const removeSearchTerm = (index: number) => {
  const searchTerms = localFilters.value.search.split(',').map(term => term.trim()).filter(term => term.length > 0)
  searchTerms.splice(index, 1)
  localFilters.value.search = searchTerms.join(', ')
  debouncedEmitFilters()
}

// Helper methods для получения labels
const getCountryLabel = (value: string) => {
  const option = COUNTRY_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : value
}

const getLanguageLabel = (value: string) => {
  const option = LANGUAGE_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : value
}

const getCurrencyLabel = (value: string) => {
  const option = CURRENCY_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : value
}

// Watch для синхронизации с внешними изменениями
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters }
  },
  { deep: true }
)
</script>

<style scoped>
.filters-card {
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.compact-card-text {
  padding: 12px 16px !important;
}

.search-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.main-filters-row {
  align-items: center;
  min-height: 40px;
}

.filter-actions {
  display: flex;
  align-items: center;
  height: 100%;
}

.actions-container {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: flex-end;
  margin-left: 8px;
}

.advanced-toggle-btn {
  flex-shrink: 0;
}

/* Компактные поля ввода */
.v-text-field .v-field {
  min-height: 40px !important;
  border-radius: 12px !important;
}

.v-select .v-field {
  min-height: 40px !important;
  border-radius: 12px !important;
}

/* Высота кнопок устанавливается через height="40" в компонентах */

.advanced-filters {
  background: rgba(var(--v-theme-surface-variant), 0.2);
  border-radius: 12px;
  padding: 12px;
  margin-top: 8px;
}

.advanced-filters-row {
  margin-bottom: 4px;
}

.advanced-filters .v-select {
  transition: all 0.2s ease;
}

.advanced-filters .v-select:hover {
  transform: translateY(-1px);
}

.advanced-filters .v-text-field .v-field,
.advanced-filters .v-select .v-field {
  min-height: 40px !important;
}

/* Красивые переходы для expand */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Улучшенные стили для чипов активных фильтров */
.v-chip-group {
  flex-wrap: wrap;
  gap: 8px;
}

.v-chip {
  transition: all 0.2s ease;
  border-radius: 8px !important;
}

.v-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* Стили для кнопок */
.v-btn {
  border-radius: 12px !important;
  text-transform: none;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.v-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* Стили для полей ввода */
.v-text-field, .v-select {
  transition: all 0.2s ease;
}

.v-text-field:hover, .v-select:hover {
  transform: translateY(-1px);
}

/* Обеспечиваем правильный z-index для выпадающих меню */
.v-select .v-overlay {
  z-index: 2000 !important;
}

/* Понижаем z-index кнопок чтобы они не перекрывали выпадающие меню */
.actions-container .v-btn {
  z-index: 1 !important;
  position: relative;
}

/* Дополнительная защита от наложения */
.limit-col .v-select {
  position: relative;
  z-index: 10;
}

/* Адаптивная сетка с правильными отступами */

/* Отступы между колонками для разных разрешений */
.search-col {
  padding-right: 8px;
}

.status-col {
  padding: 0 4px;
}

.limit-col {
  padding: 0 4px;
}


.actions-col {
  padding-left: 8px;
}

/* Extra Large screens (1920px+) */
@media (min-width: 1920px) {
  .search-col {
    padding-right: 16px;
  }
  
  .actions-col {
    padding-left: 8px;
  }
  
  .actions-container {
    gap: 12px;
  }
}

/* Large screens (1200px - 1919px) */
@media (min-width: 1200px) and (max-width: 1919px) {
  .search-col {
    padding-right: 12px;
  }
  
  .actions-col {
    padding-left: 8px;
  }
  
  .actions-container {
    gap: 10px;
  }
}

/* Medium screens (960px - 1199px) */
@media (min-width: 960px) and (max-width: 1199px) {
  .search-col {
    padding-right: 8px;
  }
  
  .status-col {
    padding: 0 4px;
  }
  
  .limit-col {
    padding: 0 4px;
  }
  
  .actions-col {
    padding-left: 8px;
  }
  
  .actions-container {
    gap: 6px;
    justify-content: flex-start;
  }
}

/* Small tablets (768px - 959px) */
@media (min-width: 768px) and (max-width: 959px) {
  .compact-card-text {
    padding: 10px 12px !important;
  }
  
  .search-col {
    padding-right: 6px;
  }
  
  .status-col, .limit-col {
    padding: 0 3px;
  }
  
  .actions-col {
    padding-left: 6px;
  }
  
  .actions-container {
    justify-content: flex-end;
    gap: 4px;
  }
  
  .actions-container .v-btn {
    min-width: 80px;
    font-size: 0.8rem;
  }
}

/* Small screens (600px - 767px) */
@media (min-width: 600px) and (max-width: 767px) {
  .compact-card-text {
    padding: 8px 10px !important;
  }
  
  .search-col {
    padding-right: 4px;
  }
  
  .status-col, .limit-col {
    padding: 0 2px;
  }
  
  .actions-col {
    padding-left: 4px;
  }
  
  .actions-container {
    justify-content: space-between;
    gap: 8px;
  }
  
  .actions-container .v-btn {
    flex: 1;
    min-width: 80px;
  }
  
  /* Скрываем текст на маленьких экранах */
  .btn-text {
    display: none !important;
  }
  
  /* Делаем кнопки квадратными для иконок */
  .actions-container .v-btn {
    min-width: 44px !important;
    width: 44px !important;
    flex: none;
    padding: 0 !important;
  }
  
  /* Обеспечиваем отображение иконок */
  .actions-container .v-btn .v-icon {
    font-size: 20px !important;
  }
}

/* Mobile screens (320px - 599px) */
@media (max-width: 599px) {
  .filters-card {
    border-radius: 8px;
    margin-bottom: 12px;
  }
  
  .compact-card-text {
    padding: 8px !important;
  }
  
  .search-col {
    margin-bottom: 8px;
    padding: 0;
  }
  
  .status-col, .limit-col {
    padding: 0 2px;
    margin-bottom: 8px;
  }
  
  .actions-col {
    padding: 0;
  }
  
  .actions-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-left: 0;
  }
  
  /* Скрываем текст на мобильных */
  .btn-text {
    display: none !important;
  }
  
  /* Делаем кнопки квадратными для иконок */
  .actions-container .v-btn {
    width: 44px !important;
    min-width: 44px !important;
    flex: none;
    height: 40px !important;
    padding: 0 !important;
  }
  
  /* Обеспечиваем отображение иконок на мобильных */
  .actions-container .v-btn .v-icon {
    font-size: 20px !important;
  }
  
  .advanced-filters {
    padding: 8px;
  }
  
  .search-chips {
    gap: 2px;
  }
}

/* Темная тема */
.v-theme--dark .filters-card {
  background: rgba(33, 37, 41, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.v-theme--dark .advanced-filters {
  background: rgba(var(--v-theme-surface-bright), 0.08);
}
</style>
