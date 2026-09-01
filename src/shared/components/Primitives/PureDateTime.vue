<script setup>
/**
 * PureDateTime.vue
 * -----------------------------------------------------------------------
 * Selector de fecha / hora / fecha-hora, construido sobre las piezas que
 * ya existen en el sistema (PureDropdown para el panel flotante, PureIcon
 * para los íconos, y la clase .form-input para heredar el estilo visual
 * de los demás campos).
 *
 * No usa ninguna librería externa de calendario -- es un calendario mensual
 * simple hecho a mano, suficiente para la mayoría de formularios. Si más
 * adelante necesitas cosas como rangos de fechas o vista de año/década,
 * probablemente valga más la pena migrar a una librería (ver nota al final
 * de este archivo).
 *
 * Uso:
 *   <PureDateTime v-model="fecha" type="date" />
 *   <PureDateTime v-model="hora" type="time" />
 *   <PureDateTime v-model="fechaHora" type="datetime" />
 *
 * El v-model siempre es un string en formato ISO:
 *   type="date"      -> "2026-08-26"
 *   type="time"      -> "14:30"
 *   type="datetime"  -> "2026-08-26T14:30"
 * (mismos formatos que usan los <input type="date/time/datetime-local">
 * nativos, para que sea fácil de mapear a setValue() del motor XForms).
 * -----------------------------------------------------------------------
 */
import { ref, computed, inject } from 'vue'
import { formFieldKey } from '@/shared/services/formField'
import PureDropdown from './PureDropdown.vue'
import PureIcon from './PureIcon.vue'

const field = inject(formFieldKey, null)

const props = defineProps({
  modelValue: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: 'date', // 'date' | 'time' | 'datetime'
    validator: (v) => ['date', 'time', 'datetime'].includes(v),
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: undefined,
  },
  invalid: {
    type: Boolean,
    default: undefined,
  },
  min: {
    type: String,
    default: null,
  },
  max: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const isRequired = computed(() => props.required ?? field?.required?.value ?? false)
const isInvalid = computed(() => props.invalid ?? field?.invalid?.value ?? false)

const mostrarFecha = computed(() => props.type === 'date' || props.type === 'datetime')
const mostrarHora = computed(() => props.type === 'time' || props.type === 'datetime')

// -------- Parseo del v-model --------

function parsear(valor) {
  if (!valor) return { fecha: null, hora: null }
  if (props.type === 'time') return { fecha: null, hora: valor }
  if (props.type === 'date') return { fecha: valor, hora: null }
  // datetime: "2026-08-26T14:30"
  const [fecha, hora] = valor.split('T')
  return { fecha: fecha ?? null, hora: hora ?? null }
}

function formatear({ fecha, hora }) {
  if (props.type === 'time') return hora ?? null
  if (props.type === 'date') return fecha ?? null
  if (!fecha && !hora) return null
  return `${fecha ?? ''}T${hora ?? '00:00'}`
}

const actual = computed(() => parsear(props.modelValue))

// -------- Texto mostrado en el campo --------

const textoMostrado = computed(() => {
  const { fecha, hora } = actual.value
  if (!fecha && !hora) return ''
  const partes = []
  if (fecha) partes.push(formatearFechaLegible(fecha))
  if (hora) partes.push(hora)
  return partes.join('  ')
})

function formatearFechaLegible(isoDate) {
  const [anio, mes, dia] = isoDate.split('-').map(Number)
  const d = new Date(anio, mes - 1, dia)
  return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// -------- Calendario --------

const hoy = new Date()
const mesVisible = ref(actual.value.fecha ? Number(actual.value.fecha.split('-')[1]) - 1 : hoy.getMonth())
const anioVisible = ref(actual.value.fecha ? Number(actual.value.fecha.split('-')[0]) : hoy.getFullYear())

const nombreMes = computed(() =>
  new Date(anioVisible.value, mesVisible.value, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
)

const diasDelMes = computed(() => {
  const primerDia = new Date(anioVisible.value, mesVisible.value, 1)
  const ultimoDia = new Date(anioVisible.value, mesVisible.value + 1, 0)
  const inicioOffset = primerDia.getDay() // 0=domingo

  const dias = []
  for (let i = 0; i < inicioOffset; i++) dias.push(null)
  for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(d)
  return dias
})

function aISO(dia) {
  const mm = String(mesVisible.value + 1).padStart(2, '0')
  const dd = String(dia).padStart(2, '0')
  return `${anioVisible.value}-${mm}-${dd}`
}

function esHoy(dia) {
  return (
    dia === hoy.getDate() &&
    mesVisible.value === hoy.getMonth() &&
    anioVisible.value === hoy.getFullYear()
  )
}

function esSeleccionado(dia) {
  return actual.value.fecha === aISO(dia)
}

function fueraDeRango(dia) {
  const iso = aISO(dia)
  if (props.min && iso < props.min.slice(0, 10)) return true
  if (props.max && iso > props.max.slice(0, 10)) return true
  return false
}

function mesAnterior() {
  if (mesVisible.value === 0) {
    mesVisible.value = 11
    anioVisible.value -= 1
  } else {
    mesVisible.value -= 1
  }
}

function mesSiguiente() {
  if (mesVisible.value === 11) {
    mesVisible.value = 0
    anioVisible.value += 1
  } else {
    mesVisible.value += 1
  }
}

function seleccionarDia(dia, cerrarFn) {
  if (fueraDeRango(dia)) return
  const nuevaFecha = aISO(dia)
  emit('update:modelValue', formatear({ fecha: nuevaFecha, hora: actual.value.hora }))
  if (props.type === 'date') cerrarFn?.()
}

// -------- Hora --------
// Reemplaza al <input type="time"> nativo a propósito: ese input tiene dos
// problemas -- (1) en varios navegadores MUESTRA "12:00 AM" como texto de
// relleno cuando está vacío, dando la falsa impresión de que ya hay una
// respuesta aunque el valor real siga siendo null; y (2) trae su propio
// ícono de reloj incorporado, duplicando el que ya agregamos nosotros.
// Con dos <select> propios controlamos el estado real sin ambigüedad.

const horas = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutos = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const horaActual = computed(() => actual.value.hora?.slice(0, 2) ?? '')
const minutoActual = computed(() => actual.value.hora?.slice(3, 5) ?? '')

function actualizarHora(nuevaHora, nuevoMinuto) {
  // Al elegir uno de los dos (hora o minuto), el otro se completa con "00"
  // si aún no se había elegido -- pero esto SOLO ocurre tras una acción
  // explícita del usuario sobre alguno de los selects, nunca antes (el
  // estado inicial se mantiene realmente vacío: "hh" / "mm").
  emit('update:modelValue', formatear({ fecha: actual.value.fecha, hora: `${nuevaHora}:${nuevoMinuto}` }))
}

function limpiar() {
  emit('update:modelValue', null)
}
</script>

<template>
  <PureDropdown placement="bottom-start">
    <template #trigger>
      <div
        class="datetime-trigger"
        :class="{ 'is-invalid': isInvalid, 'is-disabled': disabled }"
      >
        <PureIcon :name="type === 'time' ? 'schedule' : 'calendar_today'" size="sm" />
        <span class="datetime-text" :class="{ placeholder: !textoMostrado }">
          {{ textoMostrado || placeholder || '-- seleccionar --' }}
        </span>
        <button
          v-if="textoMostrado && !disabled && !readonly"
          type="button"
          class="datetime-clear"
          @click.stop="limpiar"
        >
          <PureIcon name="close" size="sm" />
        </button>
      </div>
    </template>

    <template #default="{ close }">
      <div class="datetime-panel" @click.stop>
        <div v-if="mostrarFecha" class="datetime-calendar">
          <div class="datetime-calendar-header">
            <button type="button" class="datetime-nav" @click="mesAnterior">
              <PureIcon name="chevron_left" size="sm" />
            </button>
            <span class="datetime-month-label">{{ nombreMes }}</span>
            <button type="button" class="datetime-nav" @click="mesSiguiente">
              <PureIcon name="chevron_right" size="sm" />
            </button>
          </div>

          <div class="datetime-weekdays">
            <span v-for="d in ['D', 'L', 'M', 'M', 'J', 'V', 'S']" :key="d">{{ d }}</span>
          </div>

          <div class="datetime-days">
            <span
              v-for="(dia, i) in diasDelMes"
              :key="i"
              class="datetime-day"
              :class="{
                empty: dia === null,
                today: dia !== null && esHoy(dia),
                selected: dia !== null && esSeleccionado(dia),
                disabled: dia !== null && fueraDeRango(dia),
              }"
              @click="dia !== null && seleccionarDia(dia, close)"
            >
              {{ dia }}
            </span>
          </div>
        </div>

        <div v-if="mostrarHora" class="datetime-time-row">
          <PureIcon name="schedule" size="sm" />
          <select
            class="datetime-time-select"
            :value="horaActual"
            @change="(e) => actualizarHora(e.target.value, minutoActual || '00')"
          >
            <option value="" disabled>hh</option>
            <option v-for="h in horas" :key="h" :value="h">{{ h }}</option>
          </select>
          <span class="datetime-time-sep">:</span>
          <select
            class="datetime-time-select"
            :value="minutoActual"
            @change="(e) => actualizarHora(horaActual || '00', e.target.value)"
          >
            <option value="" disabled>mm</option>
            <option v-for="m in minutos" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
      </div>
    </template>
  </PureDropdown>
</template>

<style scoped>
.datetime-trigger {
  /* Réplica deliberada de los valores visuales de .form-input, en vez de
     reutilizar esa clase compartida: .form-input trae una regla
     ".form-input:read-only" pensada para <input readonly> reales, pero
     el pseudo-selector CSS :read-only hace match con CUALQUIER elemento
     que no sea un control de formulario editable -- incluyendo un <div>
     como este por defecto. Al compartir la clase, ese estilo "apagado"
     se aplicaba siempre, sin relación con el campo real del formulario. */
  width: 100%;
  height: var(--input-heigth);
  padding: var(--space-1) var(--space-4);
  background: transparent;
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-2xl);
  outline: none;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);

  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  color: var(--text-primary);
  box-sizing: border-box;
}
.datetime-trigger:hover:not(.is-disabled) {
  border-color: var(--border-color-hover);
}
.datetime-trigger:focus-within {
  border-color: var(--focus-ring);
}
.datetime-trigger.is-disabled {
  cursor: not-allowed;
  color: color-mix(in srgb, var(--text-muted) 50%, transparent);
  background: var(--bg-input-disabled);
}
.datetime-trigger.is-invalid {
  border-color: var(--state-danger);
}
.datetime-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: inherit;
}
.datetime-text.placeholder {
  color: color-mix(in srgb, var(--text-muted) 50%, transparent);
}
.datetime-clear {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
}

.datetime-panel {
  background: var(--bg-surface-elevated, #fff);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  min-width: 260px;
  max-height: 100%;
  overflow-y: auto;
}

.datetime-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.datetime-month-label {
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
}
.datetime-nav {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-full);
  padding: var(--space-1);
}
.datetime-nav:hover {
  background: var(--bg-input-disabled);
}

.datetime-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: var(--text-p3-size, 0.8rem);
  color: var(--text-muted);
  margin-bottom: var(--space-1);
}

.datetime-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.datetime-day {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--text-p3-size, 0.85rem);
}
.datetime-day:hover:not(.empty):not(.disabled) {
  background: var(--bg-input-disabled);
}
.datetime-day.empty {
  cursor: default;
}
.datetime-day.today {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary, inherit);
}
.datetime-day.selected {
  background: var(--color-primary);
  color: white;
}
.datetime-day.disabled {
  color: color-mix(in srgb, var(--text-muted) 50%, transparent);
  cursor: not-allowed;
}

.datetime-time-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-color);
}
.datetime-time-select {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-family-base);
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
}
.datetime-time-sep {
  color: var(--text-muted);
  font-weight: var(--font-weight-semibold);
}
</style>

<!--
NOTA SOBRE ALTERNATIVAS:
Este calendario es deliberadamente simple (mes por mes, sin vista de año,
sin rangos, sin múltiples calendarios). Si más adelante necesitas algo más
avanzado, dos caminos honestos:

1. Mantener este componente y ampliarlo -- funciona bien para "una fecha,
   un formulario", que es el caso típico de ODK.

2. Adoptar una librería como VueDatePicker (@vuepic/vue-datepicker) o
   flatpickr -- dan más funciones (rangos, múltiples idiomas de calendario,
   accesibilidad más pulida) a cambio de que tengas que "forzar" sus
   estilos con tus tokens CSS (--color-primary, etc.) en vez de que ya
   vengan integrados como aquí.

Para el uso normal de un formulario ODK (una fecha/hora por campo), este
componente propio debería bastar sin agregar una dependencia más.
-->