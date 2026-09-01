<script setup>
import { inject } from "vue"
import { formFieldKey } from "@/shared/services/formField"

const field = inject(formFieldKey, null)

const props = defineProps({
  id: {
    type: String,
    default: null
  },

  modelValue: {
    type: String,
    default: ""
  },

  placeholder: {
    type: String,
    default: ""
  },

  rows: {
    type: Number,
    default: 4
  },

  disabled: {
    type: Boolean,
    default: false
  },

  readonly: {
    type: Boolean,
    default: false
  },

  required: {
    type: Boolean,
    default: undefined
  },

  invalid: {
    type: Boolean,
    default: undefined
  },

  maxlength: {
    type: Number,
    default: null
  }
})

const emit = defineEmits([
  "update:modelValue",
  "input",
  "blur",
  "focus"
])

const updateValue = (event) => {
  const value = event.target.value

  emit("update:modelValue", value)
  emit("input", value)
}
</script>

<template>
  <textarea
    class="form-textarea"
    :class="{
      'is-error': invalid ?? field?.invalid?.value
    }"
    :id="id ?? field?.inputId?.value"
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required ?? field?.required?.value"
    :maxlength="maxlength"
    :aria-invalid="field?.invalid?.value"
    :aria-describedby="field?.describedBy?.value"
    @input="updateValue"
    @blur="$emit('blur', $event)"
    @focus="$emit('focus', $event)"
  />
</template>