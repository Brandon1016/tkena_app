<script setup>
import { computed, inject } from "vue"
import { formFieldKey } from "@/shared/services/formField"
import PureIcon from "./PureIcon.vue"

const field = inject(formFieldKey, null)

const props = defineProps({
  id: {
    type: String,
    default: null
  },

  name: {
    type: String,
    default: undefined
  },

  modelValue: {
    type: [String, Number],
    default: ""
  },

  type: {
    type: String,
    default: "text"
  },

  placeholder: {
    type: String,
    default: ""
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
  },

  min: {
    type: Number,
    default: undefined
  },

  max: {
    type: Number,
    default: undefined
  },

  step: {
    type: Number,
    default: undefined
  },

  maxlength: {
    type: Number,
    default: undefined
  },

  autocomplete: {
    type: String,
    default: undefined
  },

  inputmode: {
    type: String,
    default: undefined
  }
})

const emit = defineEmits([
  "update:modelValue",
  "input",
  "blur",
  "focus"
])

const inputId = computed(() => props.id ?? field?.inputId?.value)

const isRequired = computed(() =>
  props.required ?? field?.required?.value ?? false
)

const isInvalid = computed(() =>
  props.invalid ?? field?.invalid?.value ?? false
)

const describedBy = computed(() =>
  field?.describedBy?.value || undefined
)

const updateValue = (event) => {
  let value = event.target.value

  if (props.type === "number") {
    value = value === "" ? null : Number(value)
  }

  emit("update:modelValue", value)
  emit("input", value)
}
</script>

<template>
  <div
    class="input-wrapper"
    :class="{
      'input-with-icon': icon
    }"
  >
    <PureIcon
      v-if="icon"
      :name="icon"
      class="input-icon-left"
    />

    <input
      :id="inputId"
      :name="name"
      class="form-input"
      :class="{
        'is-error': isInvalid,
        'input-with-icon': icon
      }"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="isRequired"
      :disabled="disabled"
      :readonly="readonly"
      :min="min"
      :max="max"
      :step="step"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :aria-invalid="isInvalid"
      :aria-describedby="describedBy"
      @input="updateValue"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
  </div>
</template>