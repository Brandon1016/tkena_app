<script setup>
defineProps({

    vertical:{
        type:Boolean,
        default:false
    },

    spacing:{
        type:String,
        default:"md"
    },

    label:{
        type:String,
        default:""
    }

})
</script>
<template>

<div
    class="divider"
    :class="[
        `divider-spacing-${spacing}`,
        {
            'divider-vertical': vertical
        }
    ]"
>

    <template v-if="vertical">
        <!-- Nada más, la línea la dibuja el propio div -->
    </template>

    <template v-else-if="label">

        <span class="divider-line"></span>

        <span class="divider-label">
            {{ label }}
        </span>

        <span class="divider-line"></span>

    </template>

    <template v-else>

        <span class="divider-line"></span>

    </template>

</div>

</template>