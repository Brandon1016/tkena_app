<script setup>
import { inject } from 'vue'
import { formFieldKey } from '@/shared/services/formField'
import PureIcon from './PureIcon.vue'

const field = inject(formFieldKey, null)

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },

  label: {
    type: String,
    default: ''
  },

  disabled: {
    type: Boolean,
    default: false
  },

  required: {
    type: Boolean,
    default: undefined
  },

  name: {
    type: String,
    default: ''
  },

  id: {
    type: String,
    default: null
  },

  invalid: {
    type: Boolean,
    default: undefined
  }
})

const emit = defineEmits([
  'update:modelValue',
  'change'
])

function handleChange(event) {
  const checked = event.target.checked

  emit('update:modelValue', checked)
  emit('change', checked)
}
</script>

<template>
  <label
    class="form-checkbox"
    :class="{
      'is-disabled': disabled,
      'is-error': invalid ?? field?.invalid?.value
    }"
  >
    <input
      :id="id ?? field?.inputId?.value"
      type="checkbox"
      class="form-checkbox-input"
      :checked="modelValue"
      :disabled="disabled"
      :required="required ?? field?.required?.value"
      :name="name"
      :aria-invalid="field?.invalid?.value"
      :aria-describedby="field?.describedBy?.value"
      @change="handleChange"
    />

    <span class="form-checkbox-mark">
      <PureIcon
        name="check"
        size="sm"
      />
    </span>

    <span
      v-if="label"
      class="form-checkbox-label"
    >
      {{ label }}
    </span>

  </label>
</template>