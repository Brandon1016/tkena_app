<template>
    <span
        class="material-symbols-outlined icon"
        :class="[
            `icon-${size}`,
            {
                'icon-filled': filled
            }
        ]"
    >
        {{ name }}
    </span>
</template>

<script setup>
defineProps({
    name: {
        type: String,
        required: true
    },

    size: {
        type: String,
        default: 'md'
    },

    filled: {
        type: Boolean,
        default: false
    }
})
</script>