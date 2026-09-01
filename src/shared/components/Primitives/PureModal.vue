<script setup>
import {computed, useSlots} from "vue"
import PureButton from "@/shared/components/Primitives/PureButton.vue";

const slots = useSlots()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },

  size: {
    type: String,
    default: "md"
  },

  persistent: {
    type: Boolean,
    default: false
  },

  showCloseButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  "update:modelValue",
  "open",
  "close"
])


const hasAside = computed(() => !!slots.aside)
const hasHeader = computed(() => !!slots.header)
const hasFooter = computed(() => !!slots.footer)

function close() {
  if (props.persistent) return

  emit("update:modelValue", false)
  emit("close")
}

function onOverlayClick(event) {
  if (event.target === event.currentTarget) {
    close()
  }
}
</script>

<template>

  <Teleport to="body">

    <Transition name="fade">

      <div
          v-if="modelValue"
          class="modal-overlay"
          @click="onOverlayClick"
      >

        <div
            class="modal"
            :class="`modal-${size}`"
        >
          <header class="modal-header">

            <div class="modal-header-top" v-if="hasHeader">
              <slot name="header"/>

              <PureButton
                  v-if="showCloseButton"
                  icon="close"
                  variant="icon-only"
                  icon-only
                  @click="close"
              />
            </div>

          </header>

          <div
              class="modal-layout"
              :class="{
                        'has-aside': hasAside
                    }"
              style=" flex: 1;"
          >

            <!-- Aside -->
            <div style="height: 100%">
              <aside
                  v-if="hasAside"
                  class="modal-aside"
              >
                <slot name="aside"/>
              </aside>
            </div>

            <!-- Main -->

            <div class="modal-content block">
              <section class="modal-body">

                <slot/>

              </section>

            </div>


          </div>

          <footer
              v-if="hasFooter"
              class="modal-footer"
          >

            <slot name="footer"/>

          </footer>
        </div>

      </div>

    </Transition>

  </Teleport>

</template>