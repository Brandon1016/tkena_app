<script setup>
import { computed } from "vue"

import PureButton from "@/shared/components/Primitives/PureButton.vue"
import PureInput from "@/shared/components/Primitives/PureInput.vue"
import PureMultipleSelect from "@/shared/components/atoms/PureMultipleSelect.vue"
import PureSelectOne from "@/shared/components/Primitives/PureSelectOne.vue";

const props = defineProps({

  /**
   * Estado actual de los filtros
   */
  modelValue: {
    type: Object,
    required: true
  },

  /**
   * Definición de los filtros
   */
  schema: {
    type: Array,
    default: () => []
  },

  /**
   * frontend | backend
   */
  mode: {
    type: String,
    default: "frontend"
  },

  /**
   * Deshabilita todos los controles
   */
  loading: {
    type: Boolean,
    default: false
  }

})

const emit = defineEmits([
  "update:modelValue",
  "change"
])

function setValue(key, value) {

  const data = {
    ...props.modelValue,
    [key]: value
  }

  emit("update:modelValue", data)
  emit("change", data)

}

function clearFilters() {

  const data = {}

  props.schema.forEach(filter => {
    data[filter.key] = structuredClone(filter.default)
  })

  emit("update:modelValue", data)
  emit("change", data)

}

const hasFilters = computed(() => {

  return props.schema.some(filter => {

    const value = props.modelValue[filter.key]

    if (Array.isArray(value))
      return value.length > 0

    return (
      value !== "" &&
      value !== null &&
      value !== undefined
    )

  })

})
</script>

<template>

  <div class="pure-filter">

    <slot name="prepend" />

    <template
      v-for="filter in schema"
      :key="filter.key"
    >

      <div
        v-if="filter.visible !== false"
        class="filter-item"
      >

        <!-- Text -->

        <PureInput
          v-if="filter.type === 'text'"
          :modelValue="modelValue[filter.key]"
          @update:modelValue="value => setValue(filter.key, value)"
          :placeholder="filter.placeholder ? ($te(filter.placeholder) ? $t(filter.placeholder) : filter.placeholder) : ''"
          :disabled="loading"
        />

        <!-- SelectOne -->

        <PureSelectOne
          v-else-if="filter.type === 'select'"
          :modelValue="modelValue[filter.key]"
          @update:modelValue="value => setValue(filter.key, value)"
          :options="filter.options"
          :placeholder="filter.placeholder ? ($te(filter.placeholder) ? $t(filter.placeholder) : filter.placeholder) : ''"
          :disabled="loading"
        />

        <!-- Multiple Select -->

        <PureMultipleSelect
          v-else-if="filter.type === 'multiselect'"
          :modelValue="modelValue[filter.key]"
          @update:modelValue="value => setValue(filter.key, value)"
          :options="filter.options"
          :placeholder="filter.placeholder ? ($te(filter.placeholder) ? $t(filter.placeholder) : filter.placeholder) : ''"
          :disabled="loading"
        />

      </div>

    </template>

    <PureButton
      variant="tertiary"
      :disabled="!hasFilters || loading"
      @click="clearFilters"
    >
      {{ $t("common.clear_filters") }}
    </PureButton>

    <slot name="actions" />

  </div>

</template>

<style scoped>
.pure-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.filter-item {
  flex: 1 1 220px;
  min-width: 180px;
}
</style>