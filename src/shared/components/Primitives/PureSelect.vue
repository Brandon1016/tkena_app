<script setup>
import { inject } from "vue"
import { formFieldKey } from "@/shared/services/formField"
import PureIcon from "./PureIcon.vue"

const field = inject(formFieldKey, null)

const props = defineProps({
  id: {
    type: String,
    default: null
  },

  modelValue: {
    type: [String, Number],
    default: ""
  },

  options: {
    type: Array,
    default: () => []
  },

  placeholder: {
    type: String,
    default: ""
  },

  labelKey: {
    type: String,
    default: "label"
  },

  valueKey: {
    type: String,
    default: "value"
  },

  icon: {
    type: String,
    default: ""
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
  },

  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  "update:modelValue",
  "change"
])

const updateValue = (event) => {
  const value = event.target.value

  emit("update:modelValue", value)
  emit("change", value)
}
</script>

<template>

  <div
    class="select-wrapper"
    :class="{
      'input-with-icon': icon
    }"
  >

    <PureIcon
      v-if="icon"
      :name="icon"
      class="input-icon-left"
    />

    <select
      class="form-select"
      :class="{
          'has-value': modelValue !== '',
        'input-with-icon': icon,
        'is-error': invalid ?? field?.invalid?.value
      }"
      :id="id ?? field?.inputId?.value"
      :value="modelValue"
      :required="required ?? field?.required?.value"
      :disabled="disabled || readonly"
      :aria-invalid="field?.invalid?.value"
      :aria-describedby="field?.describedBy?.value"
      @change="updateValue"
    >

      <option
        v-if="placeholder"
        value=""
        disabled
      >
        {{ placeholder }}
      </option>

      <option
        v-for="option in options"
        :key="option[valueKey]"
        :value="option[valueKey]"
      >
        {{ option[labelKey] }}
      </option>

    </select>

    <PureIcon
      name="keyboard_arrow_down"
      class="select-arrow"
    />

  </div>

</template>

<style scoped>
.form-select {
    color: var(--text-muted);
}

.form-select.has-value {
    color: var(--text-primary);
}
</style>