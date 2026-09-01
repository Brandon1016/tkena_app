<script setup>
defineProps({

    columns: {
        type: [String, Number],
        default: 1
    },

    gap: {
        type: String,
        default: "md"
    },

    responsive: {
        type: Boolean,
        default: true
    }

})
</script>

<template>

<div
    class="pure-grid"
    :class="[
        `grid-cols-${columns}`,
        `grid-gap-${gap}`,
        {
            'grid-responsive': responsive
        }
    ]"
>

    <slot/>

</div>



</template>

<style>
  @media (max-width:768px){

  .grid-responsive{

      grid-template-columns:1fr !important;

  }

}
</style>