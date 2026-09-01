<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : (disabled || loading)"
    class="btn"
    :class="[
      `btn-${variant}`,
      `btn-${size}`,
      {
        'btn-icon': !!icon,
        'btn-icon-only': iconOnly,
        'btn-full': fullWidth,
        'btn-disabled': disabled
      }
    ]"
    v-bind="$attrs"
  >
    <PureIcon
      v-if="loading"
      name="progress_activity"
      :size="size"
      class="spin"
    />

    <PureIcon
      v-else-if="icon"
      :name="icon"
      :size="size"
    />

    <span v-if="!iconOnly" class="btn-label">
      <slot />
    </span>

  </component>
</template>

<script setup>
import PureIcon from "./PureIcon.vue";
import { RouterLink } from 'vue-router'

defineProps({

  /**
   * Button style
   * primary | secondary | success | warning | danger | link / icon-only / menu
   */
  variant: {
    type: String,
    default: "primary"
  },

  /**
   * Button size
   * sm | md | lg
   */
  size: {
    type: String,
    default: "md"
  },

  /**
   * Material Symbols icon name
   */
  icon: {
    type: String,
    default: null
  },

  /**
   * Display only the icon
   */
  iconOnly: {
    type: Boolean,
    default: false
  },

  /**
   * Full width button
   */
  fullWidth: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: "button"
  },
  disabled: {
    type: Boolean,
    default: false
  },
    loading: {
    type: Boolean,
    default: false
  },

    to: String,

});
</script>

<style>
.spin {
  animation: spin 1s linear infinite;
}

.btn-label {
  width: 100%;
    display: flex;
  align-items: center;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>