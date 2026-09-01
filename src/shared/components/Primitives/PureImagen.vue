<script setup>

defineProps({
    src: String,
    alt: {
        type: String,
        default: ""
    },

    size: {
        type: String,
        default: "md"
        // xs sm md lg xl
    },

    variant: {
        type: String,
        default: "default"
        // default avatar rounded circle
    },

    fit: {
        type: String,
        default: "contain"
        // contain cover fill
    },

    ratio: {
        type: String,
        default: null
        // 1:1 4:3 16:9
    },

    loading: {
        type: String,
        default: "lazy"
    }
})

</script>

<template>
<div class="pure-image">
  <img
      class="pure-image"
      :class="[
          `image-${size}`,
          `image-${variant}`,
          ratio && `ratio-${ratio.replace(':','-')}`
      ]"
      :src="src"
      :alt="alt"
      :loading="loading"
      :style="{
          objectFit: fit
      }"
  />
</div>

</template>