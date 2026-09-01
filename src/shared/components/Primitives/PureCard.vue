<script setup>
import PureDivider from "@/shared/components/Primitives/PureDivider.vue";

/**
 * PureCard - Componente tarjeta flexible con slots y opciones de ancho
 */
const props = defineProps({
  /**
   * Si es `true`, la tarjeta ocupa el 100% del ancho del contenedor.
   * Si es `false`, se ajusta al contenido (fit-content) sin desbordar.
   */
  expand: {
    type: Boolean,
    default: false,
  },
  /**
   * Añade la clase `card-clickable` para efectos hover de interacción.
   */
  clickable: {
    type: Boolean,
    default: false,
  },
  header: {
    type: String
  },
  footer:{
    type: String,
  }
})
</script>

<template>

    <div
      class="card"
      :class="{
        'card-clickable': clickable,
        'card-expand': expand,
        'card-fit': !expand,
      }"
    >
      <!-- HEADER (opcional) -->
      <div v-if="props.header" class="card-header">
        <h3>{{props.header}}</h3>
        <PureDivider/>
      </div>

      <!-- BODY (siempre presente) -->
      <div class="card-body p2">
        <slot />
      </div>

      <!-- FOOTER (opcional) -->
      <div v-if="props.footer" class="card-footer p2">
        {{props.footer}}
      </div>
    </div>

</template>

<style>

</style>
