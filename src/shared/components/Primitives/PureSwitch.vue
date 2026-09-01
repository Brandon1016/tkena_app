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

  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  "update:modelValue",
  "change"
])

const updateValue = (event) => {
  const value = event.target.checked

  emit("update:modelValue", value)
  emit("change", value)
}
</script>

<template>
  <div class="form-group-horizontal">

    <label
      class="form-switch"
      :class="{
        'is-disabled': disabled,
        'is-error': invalid ?? field?.invalid?.value
      }"
    >
      <input
        class="form-switch-input"
        type="checkbox"
        :id="id ?? field?.inputId?.value"
        :checked="modelValue"
        :required="required ?? field?.required?.value"
        :disabled="disabled"
        :aria-invalid="field?.invalid?.value"
        :aria-describedby="field?.describedBy?.value"
        @change="updateValue"
      >

      <span class="form-switch-slider"></span>
    </label>
    </div>
</template>