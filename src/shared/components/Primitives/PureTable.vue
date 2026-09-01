<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import PureIcon from "@/shared/components/Primitives/PureIcon.vue";
import PurePagination from "@/shared/components/Primitives/PurePagination.vue";

const { t } = useI18n()

const props = defineProps({
  headers: {
    type: Array, // [{ label: 'Name', key: 'name', align: 'left', sortable: true }]
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: null
  },
  hoverable: {
    type: Boolean,
    default: true
  },
  striped: {
    type: Boolean,
    default: false
  },
   clickable: {
    type: Boolean,
    default: true
  },
  sortKey: String,
  sortOrder: {
    type: String,
    default: null // asc | desc | null

  },
  pagination: {
    type: Boolean,
    default: false
  },

  page: {
      type: Number,
      default: 1
  },

  pages: {
      type: Number,
      default: 1
  },

  total: {
      type: Number,
      default: 0
  },

  perPage: {
      type: Number,
      default: 10
  }
})

const emptyText = computed(() =>
  props.emptyText ?? t('table-base.noRecordsFound')
)

const emit = defineEmits([
    'row-click',
    'sort',
    'page-change'
])

const handleRowClick = (item, index) => {
    if (!props.clickable) return

    emit("row-click", item, index)
}

const handleSort = (header) => {
    if (!header.sortable) return

    emit("sort", header.key)
}

const handlePageChange = (page) => {
    emit('page-change', page)
}
</script>


<template>
  <div class="table-wrapper">

    <!-- Top Content -->
    <div
      v-if="$slots.top"
      class="table-top"
    >
      <slot name="top" />
    </div>  

    <div class="table-container">

      <table
        class="table"
        :class="{
          'table-hover': hoverable,
          'table-striped': striped
        }"
      >

        <!-- Header -->
        <thead class="table-head">

          <tr>

            <th
              v-for="header in headers"
              :key="header.key"
              scope="col"
              :class="[
                'table-header-cell',
                { 'table-sortable': header.sortable }
              ]"
              @click="header.sortable ? handleSort(header.key) : null"
            >
              <div class="table-header-content">
              <slot
                :name="'header-' + header.key"
                :header="header"
              >
                {{ $te(header.label) ? $t(header.label) : header.label }}
              </slot>
              <PureIcon
                  v-if="header.sortable"
                  :name="
                    sortKey === header.key
                      ? (sortOrder === 'asc'
                        ? 'keyboard_arrow_up'
                        : 'keyboard_arrow_down')
                        : 'unfold_more'
                  "
                  size="sm"
              />
              </div>

            </th>

          </tr>

        </thead>

        <!-- Body -->
        <tbody
          v-if="!loading"
          class="table-body"
        >

          <tr
            v-for="(item, index) in items"
            :key="item.id || index"
            class="table-row"
            :class="{
              'table-row-clickable': clickable
            }"
            @click="handleRowClick(item, index)"
          >

            <td
              v-for="header in headers"
              :key="header.key"
              class="table-cell"

            >

              <slot
                :name="'cell-' + header.key"
                :item="item"
                :value="item[header.key]"
                :index="index"
              >
                {{ item[header.key] }}
              </slot>

            </td>

          </tr>

          <!-- Empty -->
          <tr v-if="items.length === 0">

            <td
              :colspan="headers.length"
              class="table-empty"
            >

              <slot name="empty">

                <div class="table-empty-content">

                  <span class="material-symbols-outlined icon icon-xl">
                    inventory_2
                  </span>

                  <p>
                    {{ emptyText }}
                  </p>

                </div>

              </slot>

            </td>

          </tr>

        </tbody>

        <!-- Loading -->
        <tbody
          v-else
          class="table-body"
        >

          <tr
            v-for="i in 5"
            :key="i"
            class="table-loading-row"
          >

            <td
              v-for="header in headers"
              :key="header.key"
            >

              <div class="table-skeleton"></div>

            </td>

          </tr>

        </tbody>

      </table>

    </div>

    <div
    v-if="pagination || $slots.bottom"
    class="table-bottom"
>

    <slot name="bottom" />

    <PurePagination
        v-if="pagination"
        :page="page"
        :pages="pages"
        :total="total"
        :per-page="perPage"
        @change="handlePageChange"
    />

</div>

  </div>

</template>

