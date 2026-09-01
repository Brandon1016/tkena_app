<template>
  <button
    type="button"
    class="tag"
    :class="[
      `tag-${variant}`,
      `tag-${size}`,
      {
        'tag-full': fullWidth
      }
    ]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <PureIcon
      v-if="icon"
      :name="icon"
      :size="size"
    />

    <span class="tag-label">
      <slot />
    </span>
  </button>
</template>

<script setup>
import PureIcon from './PureIcon.vue'

defineProps({
  /**
   * primary | secondary
   */
  variant: {
    type: String,
    default: 'primary'
  },

  /**
   * sm | md | lg
   */
  size: {
    type: String,
    default: 'md'
  },

  /**
   * Material Symbol
   */
  icon: {
    type: String,
    default: null
  },

  /**
   * Width 100%
   */
  fullWidth: {
    type: Boolean,
    default: false
  },

  /**
   * Disabled state
   */
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>