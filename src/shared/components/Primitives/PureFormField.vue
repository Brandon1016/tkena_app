<script setup>
import { computed, provide, useId } from 'vue'
import { formFieldKey } from '@/shared/services/formField'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  label: String,
  helper: String,
  error: String,
  required: Boolean,
  id: String,
  layout: {
    type: String,
    default: "vertical" // vertical | horizontal
  }
})

const generatedId = useId()

const inputId = computed(() => props.id ?? generatedId)

const helperId = computed(() => `${inputId.value}-helper`)
const errorId = computed(() => `${inputId.value}-error`)

const describedBy = computed(() => {
  const ids = []

  if (props.helper)
    ids.push(helperId.value)

  if (props.error)
    ids.push(errorId.value)

  return ids.join(' ')
})

provide(formFieldKey, {
  inputId,
  required: computed(() => props.required),
  invalid: computed(() => !!props.error),
  helperId,
  errorId,
  describedBy
})
</script>

<template>
<div
  class="form-group flex"
  :class="`form-group--${layout}`"
>
  <div class="form-field-content ">

    <label
      v-if="label"
      class="form-label"
      :for="inputId"
    >
      {{ label }}

      <span
        v-if="required"
        class="form-required"
      >
        *
      </span>
    </label>

    <small
      v-if="helper"
      :id="helperId"
      class="form-helper"
    >
      {{ helper }}
    </small>



  </div>

  <slot />
      <small
      v-if="error"
      :id="errorId"
      class="form-error"
    >
      {{ t(error) }}
    </small>
</div>

</template>