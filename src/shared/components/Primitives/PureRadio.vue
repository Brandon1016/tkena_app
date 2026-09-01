<script setup>
import { computed, inject } from 'vue'
import { formFieldKey } from '@/shared/services/formField'

const field = inject(formFieldKey, null)

const props = defineProps({
  value: {
    type: [String, Number, Boolean],
    required: true
  },

  modelValue: {
    type: [String, Number, Boolean],
    default: null
  },

  label: {
    type: String,
    default: ''
  },

  name: {
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

const isChecked = computed(() => props.modelValue === props.value)

function handleChange(event) {
  if (!event.target.checked) return

  emit('update:modelValue', props.value)
  emit('change', props.value)
}
</script>

<template>

  <label
    class="form-radio"
    :class="{
      'is-disabled': disabled,
      'is-error': invalid ?? field?.invalid?.value
    }"
  >

    <input
      :id="id ?? field?.inputId?.value"
      class="form-radio-input"
      type="radio"
      :value="value"
      :checked="isChecked"
      :disabled="disabled"
      :required="required ?? field?.required?.value"
      :name="name"
      :aria-invalid="field?.invalid?.value"
      :aria-describedby="field?.describedBy?.value"
      @change="handleChange"
    />

    <span class="form-radio-mark"></span>

    <span
      v-if="label"
      class="form-radio-label"
    >
      {{ label }}
    </span>

  </label>

</template>