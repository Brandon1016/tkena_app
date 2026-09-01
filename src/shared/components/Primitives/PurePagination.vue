<script setup>
import PureButton from '@/shared/components/Primitives/PureButton.vue'
import { computed } from 'vue'

const props = defineProps({

    page: {
        type: Number,
        required: true
    },

    pages: {
        type: Number,
        required: true
    },

    total: {
        type: Number,
        required: true
    },

    perPage: {
        type: Number,
        default: 10
    },

    maxVisibleButtons: {
        type: Number,
        default: 5
    }

})


const emit = defineEmits(['change'])


const startPage = computed(() => {

    if (props.pages <= props.maxVisibleButtons) {
        return 1
    }

    const half = Math.floor(props.maxVisibleButtons / 2)

    let start = props.page - half


    if (start < 1) {
        start = 1
    }


    if (start + props.maxVisibleButtons - 1 > props.pages) {
        start = props.pages - props.maxVisibleButtons + 1
    }


    return start

})


const visiblePages = computed(() => {

    const result = []

    const count = Math.min(
        props.maxVisibleButtons,
        props.pages
    )


    for (let i = 0; i < count; i++) {
        result.push(startPage.value + i)
    }


    return result

})


const changePage = (page) => {

    if (
        page < 1 ||
        page > props.pages ||
        page === props.page
    ) {
        return
    }


    emit('change', page)

}

</script>

<template>

<div class="pagination">

    <div class="pagination-info">

        {{ $t('shared.pagination.showing',{
            from:(page-1)*perPage+1,
            to:Math.min(page*perPage,total),
            total
        }) }}

    </div>


    <div class="pagination-controls">


        <PureButton
            variant="icon-only"
            size="sm"
            icon="first_page"
            :disabled="page === 1"
            @click="changePage(1)"
            iconOnly
        />


        <PureButton
            variant="icon-only"
            size="sm"
            icon="chevron_left"
            :disabled="page === 1"
            @click="changePage(props.page - 1)"
            iconOnly
        />


        <div class="pagination-pages">

            <PureButton
                v-for="item in visiblePages"
                :key="item"
                size="sm"
                :variant="
                    item === page
                    ? 'secondary'
                    : 'outline-2'
                "
                @click="changePage(item)"
            >
                {{ item }}
            </PureButton>

        </div>


        <PureButton
            variant="icon-only"
            size="sm"
            icon="chevron_right"
            :disabled="page === pages"
            @click="changePage(props.page + 1)"
            iconOnly
        />


        <PureButton
            variant="icon-only"
            size="sm"
            icon="last_page"
            :disabled="page === pages"
            @click="changePage(pages)"
            iconOnly
        />

    </div>

</div>

</template>