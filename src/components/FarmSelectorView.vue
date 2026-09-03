<script setup>
/**
 * FarmSelectorView.vue
 * -----------------------------------------------------------------------
 * Pasos previos a la selección de formulario, todos apilados en la misma
 * pantalla (no se ocultan entre sí, así se puede cambiar cualquiera sin
 * "volver atrás"):
 *   1. Lista de fincas del usuario (GET {API_BASE}/farms/).
 *   2. Al elegir finca, se piden sus unidades productivas
 *      (GET {API_BASE}/farm/{farmId}/productive-unit/).
 *   3. Al elegir también la unidad productiva, se consulta su ciclo activo
 *      (GET {API_BASE}/farm/{farmId}/productive-unit/{productiveUnitId}/cycle/active)
 *      solo para mostrarle al usuario, a modo informativo, qué contiene ese
 *      ciclo (production_category_description). El endpoint devuelve null
 *      si la unidad productiva no tiene ningún ciclo activo.
 * Una vez elegidas ambas, se muestra FormSelectorView debajo.
 * -----------------------------------------------------------------------
 */
import { ref, watch, onMounted } from 'vue'
import { authFetch } from '@/shared/services/session'
import FormSelectorView from './FormSelectorView.vue'
import PureSelectOne from '@/shared/components/Primitives/PureSelectOne.vue'
import PureFormField from '@/shared/components/Primitives/PureFormField.vue'
import PureCard from '@/shared/components/Primitives/PureCard.vue'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:9000'

const loading = ref(true)
const error = ref(null)
const farms = ref([])
const selectedFarmId = ref('')

const loadingUnits = ref(false)
const errorUnits = ref(null)
const productiveUnits = ref([])
const selectedProductiveUnitId = ref('')

async function cargarFincas() {
  loading.value = true
  error.value = null
  try {
    const resp = await authFetch(`${API_BASE}/farms/`)
    if (!resp.ok) throw new Error(`Error ${resp.status} al obtener la lista de fincas`)
    farms.value = await resp.json()
  } catch (e) {
    error.value = e.message ?? 'No se pudo cargar la lista de fincas'
  } finally {
    loading.value = false
  }
}

async function cargarUnidadesProductivas(farmId) {
  loadingUnits.value = true
  errorUnits.value = null
  productiveUnits.value = []
  try {
    const resp = await authFetch(`${API_BASE}/farm/${farmId}/productive-unit/`)
    if (!resp.ok) throw new Error(`Error ${resp.status} al obtener las unidades productivas`)
    productiveUnits.value = await resp.json()
  } catch (e) {
    errorUnits.value = e.message ?? 'No se pudo cargar la lista de unidades productivas'
  } finally {
    loadingUnits.value = false
  }
}

// Ciclo activo de la unidad productiva elegida -- puramente informativo,
// para que el usuario sepa qué se está registrando antes de elegir el
// formulario. El endpoint devuelve `null` (200 OK) cuando no hay ciclo
// activo, así que eso NO se trata como error.
const loadingCycle = ref(false)
const errorCycle = ref(null)
const activeCycle = ref(null)

async function cargarCicloActivo(farmId, productiveUnitId) {
  loadingCycle.value = true
  errorCycle.value = null
  activeCycle.value = null
  try {
    const resp = await authFetch(
      `${API_BASE}/farm/${farmId}/productive-unit/${productiveUnitId}/cycle/active`
    )
    if (!resp.ok) throw new Error(`Error ${resp.status} al obtener el ciclo activo`)
    activeCycle.value = await resp.json()
  } catch (e) {
    errorCycle.value = e.message ?? 'No se pudo cargar el ciclo activo'
  } finally {
    loadingCycle.value = false
  }
}

onMounted(cargarFincas)

watch(selectedFarmId, (farmId) => {
  selectedProductiveUnitId.value = ''
  if (farmId) cargarUnidadesProductivas(farmId)
})

watch(selectedProductiveUnitId, (productiveUnitId) => {
  activeCycle.value = null
  errorCycle.value = null
  if (productiveUnitId) cargarCicloActivo(selectedFarmId.value, productiveUnitId)
})
</script>

<template>
  <div class="farm-selector">
    <PureFormField label="Seleccione su finca">
      <PureSelectOne
        v-model="selectedFarmId"
        :options="farms"
        label-key="name"
        value-key="id"
        :disabled="loading"
        :placeholder="loading ? 'Cargando fincas…' : 'Selecciona una finca'"
      />
    </PureFormField>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="!loading && farms.length === 0" class="empty">No hay fincas disponibles.</p>

    <template v-if="selectedFarmId">
      <PureFormField label="Seleccione su unidad productiva">
        <PureSelectOne
          v-model="selectedProductiveUnitId"
          :options="productiveUnits"
          label-key="name"
          value-key="id"
          :disabled="loadingUnits"
          :placeholder="loadingUnits ? 'Cargando unidades productivas…' : 'Selecciona una unidad productiva'"
        />
      </PureFormField>
      <p v-if="errorUnits" class="error">{{ errorUnits }}</p>
      <p v-else-if="!loadingUnits && productiveUnits.length === 0" class="empty">
        No hay unidades productivas disponibles.
      </p>
    </template>

    <template v-if="selectedProductiveUnitId">
      <p v-if="loadingCycle" class="empty">Consultando ciclo activo…</p>
      <p v-else-if="errorCycle" class="error">{{ errorCycle }}</p>

      <PureCard v-else-if="activeCycle" class="active-cycle-card" header="🌱 Ciclo activo">
        <p class="active-cycle-description">
          {{ activeCycle.production_category_description || 'Este ciclo no tiene una descripción registrada.' }}
        </p>
        <p v-if="activeCycle.start_date" class="active-cycle-meta">
          Inicio: {{ new Date(activeCycle.start_date).toLocaleDateString('es') }}
        </p>
        <p v-if="activeCycle.end_date" class="active-cycle-meta">
          Finalización: {{ new Date(activeCycle.end_date).toLocaleDateString('es') }}
        </p>
      </PureCard>

      <p v-else class="empty">Esta unidad productiva no tiene un ciclo activo.</p>
    </template>

    <FormSelectorView v-if="selectedFarmId && selectedProductiveUnitId" />
  </div>
</template>

<style scoped>
.farm-selector {
  max-width: 700px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.error {
  color: #c0392b;
}
.empty {
  color: var(--text-secondary, #555);
}
.active-cycle-card {
  align-self: center;
  margin: 0 auto;
  border-left: 4px solid var(--color-primary, #2e7d32);
  background: var(--surface-subtle, #f4f9f4);
  text-align: center;
}
.active-cycle-description {
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
}
.active-cycle-meta {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: var(--text-secondary, #555);
}
</style>
