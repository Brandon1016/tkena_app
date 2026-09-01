<script setup>
/**
 * REFACTOR: antes este componente armaba su propio panel flotante con
 * `position: absolute` dentro de su propio wrapper. Eso hacía que
 * cualquier ancestro con `overflow: hidden` (por ejemplo un PureCard, o
 * cualquier contenedor con scroll/recorte) cortara el panel de opciones,
 * dejándolo parcialmente invisible.
 *
 * Ahora reutiliza PureDropdown (Teleport a <body> + position: fixed +
 * flip automático si no cabe abajo + clamp dentro del viewport), el mismo
 * mecanismo ya usado por PureDateTime. Esto corrige el problema de raíz
 * para CUALQUIER lugar donde se use PureSelectOne, no solo el formulario.
 *
 * La API pública (props, emits, slots #selected y #option) no cambió.
 */
import { computed, inject } from "vue"
import { formFieldKey } from "@/shared/services/formField"
import PureDropdown from "./PureDropdown.vue"
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

const selected = computed(() =>
  props.options.find(
    option => option[props.valueKey] === props.modelValue
  )
)

function select(option, closeFn) {
  const value = option[props.valueKey]

  emit("update:modelValue", value)
  emit("change", value)

  closeFn?.()
}
</script>

<template>
  <PureDropdown placement="bottom-start" :disabled="disabled" match-trigger-width>
    <template #trigger>
      <button
        class="select-button"
        type="button"
        :disabled="disabled"
        :class="{
          'is-error': invalid ?? field?.invalid?.value
        }"
      >
        <slot
          name="selected"
          :option="selected"
        >
          {{ selected?.[labelKey] || placeholder }}
        </slot>
        <PureIcon
          name="keyboard_arrow_down"
          class="select-arrow"
        />
      </button>
    </template>

    <template #default="{ close }">
      <div
        v-for="option in options"
        :key="option[valueKey]"
        class="option"
        :class="{ selected: option[valueKey] === modelValue }"
        @click="select(option, close)"
      >
        <slot
          name="option"
          :option="option"
        >
          {{ option[labelKey] }}
        </slot>
      </div>
    </template>
  </PureDropdown>
</template>

<style scoped>
/* --- Select One --- */

.select-button {
    width: 100%;
    height: var(--input-heigth);

    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0 var(--space-10) 0 var(--space-4);

    background: var(--bg-surface);
    color: var(--text-secondary);

    font: inherit;

    border: 1px solid var(--border-color);
    border-radius: var(--radius-2xl);

    cursor: pointer;
    outline: none;

    transition:
        border-color .2s,
        box-shadow .2s;
}

.select-button:hover:not(:disabled) {
    border-color: var(--border-color-hover);
}

.select-button:focus {
    border-color: var(--focus-ring);
}

.select-button:disabled {
    background: var(--bg-surface-elevated);
    color: var(--text-muted);
    cursor: not-allowed;
    opacity: .6;
}

.select-button.is-error {
    border-color: var(--state-danger);
}

.option {
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  line-height: 28px;
  cursor: pointer;
  transition: background .15s;
}

.option:hover {
    background: var(--color-tertiary-light);
}

.option.selected {
    background: var(--bg-surface-elevated);
}
</style>