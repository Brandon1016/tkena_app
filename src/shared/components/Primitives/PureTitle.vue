<template>
  <header class="page-title">
    <h1 class="page-title-heading">
      {{ title }}
    </h1>

    <p v-if="subtitle"
      class="p1"
    >
      {{ subtitle }}
    </p>

    <PureDivider class="page-title-divider" spacing="sm" />
  </header>
</template>

<script setup>
import PureDivider from './PureDivider.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>

