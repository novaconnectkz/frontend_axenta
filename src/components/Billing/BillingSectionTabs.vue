<template>
  <!--
    Фаза A IA-реструктуризации: общая полоса табов раздела «Биллинг».
    Объединяет точку входа «Контрагенты» (/counterparties) с биллинг-вкладками
    (/billing?tab=...). Рендерится на обеих страницах — единая навигация раздела.
  -->
  <v-tabs :model-value="activeTab" color="primary" class="mb-6" @update:model-value="onTab">
    <v-tab value="counterparties">
      <v-icon left>mdi-account-cash</v-icon>
      Контрагенты
    </v-tab>
    <v-tab value="contracts">
      <v-icon left>mdi-file-document-multiple</v-icon>
      Договоры
    </v-tab>
    <v-tab value="subscriptions">
      <v-icon left>mdi-credit-card</v-icon>
      Подписки
    </v-tab>
    <v-tab value="invoices">
      <v-icon left>mdi-file-document</v-icon>
      Счета
    </v-tab>
    <v-tab v-if="canEditSettings" value="settings">
      <v-icon left>mdi-cog</v-icon>
      Настройки
    </v-tab>
  </v-tabs>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { canManageBilling } from '@/utils/billingRole'

const route = useRoute()
const router = useRouter()

const canEditSettings = computed(() => canManageBilling())

// Активная вкладка выводится из маршрута: /counterparties → «Контрагенты»,
// /billing → ?tab (по умолчанию «Договоры»).
const activeTab = computed(() => {
  if (route.path === '/counterparties') return 'counterparties'
  return (route.query.tab as string) || 'contracts'
})

function onTab(value: unknown) {
  const tab = String(value)
  if (tab === activeTab.value) return
  if (tab === 'counterparties') {
    router.push('/counterparties')
  } else {
    router.push({ path: '/billing', query: { tab } })
  }
}
</script>
