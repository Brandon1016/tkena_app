<!-- PureMenuItem.vue -->
<script setup>
import { inject, useSlots } from 'vue'
import { dropdownKey } from '@/shared/services/dropdown'

const props = defineProps({
  disabled: Boolean
})

const emit = defineEmits(['click'])

const dropdown = inject(dropdownKey)
const slots = useSlots()

function handleClick(event) {
  if (props.disabled) return

  emit('click', event)

  if (dropdown?.closeOnClick.value) {
    dropdown.close()
  }
}
</script>

<template>
  <div
    class="menu-item"
    :class="{ 'menu-item-disabled': disabled }"
    @click="handleClick"
  >
    <slot />
  </div>
</template>