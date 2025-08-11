<template>
  <div>
    <!-- Простая карточка с использованием Vuetify -->
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <slot>{{ content }}</slot>
      </v-card-text>
      <v-card-actions v-if="hasActions">
        <v-spacer />
        <slot name="actions">
          <v-btn color="primary" @click="$emit('action')">Действие</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";

export default defineComponent({
  name: "SimpleCard",
  
  props: {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    hasActions: {
      type: Boolean,
      default: false,
    },
  },
  
  emits: ["action"],
  
  setup(props) {
    const cardTitle = computed(() => props.title.toUpperCase());
    
    return {
      cardTitle,
    };
  },
});
</script>

<style scoped>
/* Стили для компонента */
.v-card {
  transition: transform 0.2s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>
