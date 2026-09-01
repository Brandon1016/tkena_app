<script setup>
import { ref, computed, provide, onMounted, onUnmounted, nextTick, watch } from "vue"
import { dropdownKey } from "@/shared/services/dropdown"

const props = defineProps({
  placement: {
    type: String,
    default: "bottom-end"
  },

  closeOnClick: {
    type: Boolean,
    default: true
  },

  disabled: {
    type: Boolean,
    default: false
  },
 matchTriggerWidth: {
    type: Boolean,
    default: false
  },
  // Tope de altura "normal" del panel (px). El clamp de emergencia por
  // viewport chico (ver updatePosition) puede REDUCIR este valor cuando
  // la ventana es más chica que esto, pero nunca lo agranda -- así un
  // panel corto se queda corto, y uno largo (ej. una lista de 150+
  // opciones) se limita a un tamaño razonable con scroll interno, en vez
  // de estirarse casi hasta el borde de la ventana en pantallas grandes.
  maxHeight: {
    type: Number,
    default: 400
  }
})

const triggerWidth = ref(0)
const emit = defineEmits([
  "open",
  "close"
])

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------

const open = ref(false)

const triggerRef = ref(null)
const menuRef = ref(null)

const menuStyle = ref({})

// -----------------------------------------------------------------------------
// Methods
// -----------------------------------------------------------------------------

const openMenu = async () => {
  if (props.disabled) return

  open.value = true

  await nextTick()

  await new Promise(resolve => requestAnimationFrame(resolve))

  updatePosition()

  emit("open")
}

const closeMenu = () => {
  if (!open.value) return

  open.value = false

  emit("close")
}

const toggleMenu = () => {
  open.value ? closeMenu() : openMenu()
}
const updatePosition = () => {
  if (!triggerRef.value || !menuRef.value) return

  const trigger = triggerRef.value.getBoundingClientRect()

  if (props.matchTriggerWidth) {
    triggerWidth.value = trigger.width
  }

  const menu = menuRef.value.getBoundingClientRect()

  const gap = 0
  const viewportMargin = 8 // separación mínima respecto al borde de la ventana

  // Tope de altura: el menor entre el "tamaño normal" (prop maxHeight,
  // 400px por defecto) y el espacio real disponible en la ventana. Así un
  // panel con pocas opciones no se agranda de más, y uno con muchas
  // opciones no se estira casi hasta el borde de la ventana -- solo se
  // reduce por debajo de los 400px cuando el viewport es más chico que eso.
  //
  // Importante: se calcula ANTES de decidir hacia dónde abrir, y se usa
  // esa altura ya limitada (no la altura natural sin recortar) tanto para
  // decidir el flip como para el posicionamiento final. Si no fuera así,
  // una lista muy larga (ej. 150+ opciones) mediría su altura natural
  // gigante y voltearía innecesariamente, aunque limitada a 400px hubiera
  // cabido perfecto hacia abajo.
  const maxHeight = Math.min(props.maxHeight, window.innerHeight - viewportMargin * 2)
  const alturaEfectiva = Math.min(menu.height, maxHeight)

  let top
  let left
  let placement = props.placement

  // Si el menú no cabe hacia abajo pero sí hacia arriba, se voltea
  // automáticamente (evita que quede cortado contra el borde inferior de
  // la ventana, ya que al ser position:fixed no genera scroll de página).
  const cabeAbajo = trigger.bottom + gap + alturaEfectiva <= window.innerHeight - viewportMargin
  const cabeArriba = trigger.top - gap - alturaEfectiva >= viewportMargin

  if (placement.startsWith('bottom') && !cabeAbajo && cabeArriba) {
    placement = placement.replace('bottom', 'top')
  } else if (placement.startsWith('top') && !cabeArriba && cabeAbajo) {
    placement = placement.replace('top', 'bottom')
  }

  switch (placement) {
    case "bottom-start":
      top = trigger.bottom + gap
      left = trigger.left
      break

    case "bottom-end":
      top = trigger.bottom + gap
      left = trigger.right - menu.width
      break

    case "top-start":
      top = trigger.top - alturaEfectiva - gap
      left = trigger.left
      break

    case "top-end":
      top = trigger.top - alturaEfectiva - gap
      left = trigger.right - menu.width
      break
  }

  left = Math.max(
    gap,
    Math.min(left, window.innerWidth - menu.width - gap)
  )

  // Red de seguridad final: si aun así el menú no cabe completo en ningún
  // lado (ventana muy chica), se ajusta el top para que el panel completo
  // quede dentro de la ventana (maxHeight/alturaEfectiva ya calculados arriba).
  top = Math.max(
    viewportMargin,
    Math.min(top, window.innerHeight - viewportMargin - alturaEfectiva)
  )

    menuStyle.value = {
    position: "fixed",
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 1000,
    maxHeight: `${maxHeight}px`,
    overflowY: 'auto',
    ...(props.matchTriggerWidth && {
      width: `${triggerWidth.value}px`
    })
  }
}

const handleClickOutside = (event) => {
  if (
    triggerRef.value?.contains(event.target) ||
    menuRef.value?.contains(event.target)
  ) {
    return
  }

  closeMenu()
}

const handleEscape = (event) => {
  if (event.key === "Escape") {
    closeMenu()
  }
}

const handleWindowChange = () => {
  if (open.value) {
    updatePosition()
  }
}
watch(menuRef, (menu) => {
  if (menu) {
    updatePosition()
  }
})

// -----------------------------------------------------------------------------
// Provide
// -----------------------------------------------------------------------------

provide(dropdownKey, {
  close: closeMenu,
  closeOnClick: computed(() => props.closeOnClick)
})

// -----------------------------------------------------------------------------
// Lifecycle
// -----------------------------------------------------------------------------

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
  document.addEventListener("keydown", handleEscape)

  window.addEventListener("resize", handleWindowChange)
  window.addEventListener("scroll", handleWindowChange, true)
})

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
  document.removeEventListener("keydown", handleEscape)

  window.removeEventListener("resize", handleWindowChange)
  window.removeEventListener("scroll", handleWindowChange, true)
})
</script>

<template>
  <div class="dropdown">

    <div
      ref="triggerRef"
      class="dropdown-trigger"
      @click="toggleMenu"
    >
      <slot name="trigger" />
    </div>

    <Teleport to="body">

      <Transition name="dropdown">

        <div
          v-if="open"
          ref="menuRef"
          class="dropdown-menu"
          :style="menuStyle"
        >
          <slot :close="closeMenu" />
        </div>

      </Transition>

    </Teleport>

  </div>
</template>