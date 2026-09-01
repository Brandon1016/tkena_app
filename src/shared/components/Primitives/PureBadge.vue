<script setup>
import PureIcon from "./PureIcon.vue"

defineProps({
  variant: {
    type: String,
    default: "neutral"
    // neutral | success | warning | danger | info
  },

  size: {
    type: String,
    default: "md"
    // sm | md | lg
  },

  icon: {
    type: String,
    default: ""
  }
})
</script>

<template>
  <span
    class="badge"
    :class="[
      `badge-${variant}`,
      `badge-${size}`
    ]"
  >
    <PureIcon
      v-if="icon"
      :name="icon"
      size="sm"
    />

    <slot />
  </span>
</template>