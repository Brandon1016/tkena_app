<script setup>
/**
 * FormSelectorView.vue
 * -----------------------------------------------------------------------
 * Tras el login, en vez de mostrar formularios fijos, se pide la lista de
 * formularios disponibles (GET {API_BASE}/forms/?form_type_id=2) y se deja
 * elegir uno mediante un dropdown. Al seleccionar, se monta
 * CustomFormRenderer con el form-id elegido.
 * -----------------------------------------------------------------------
 */
import { ref, onMounted } from 'vue'
import { authFetch } from '@/shared/services/session'
import CustomFormRenderer from './CustomFormRenderer.vue'
import PureSelectOne from '@/shared/components/Primitives/PureSelectOne.vue'
import PureFormField from '@/shared/components/Primitives/PureFormField.vue'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:9000'
const FORM_TYPE_ID = 2

const loading = ref(true)
const error = ref(null)
const forms = ref([])
const selectedFormId = ref('')

async function cargarFormularios() {
  loading.value = true
  error.value = null
  try {
    const resp = await authFetch(`${API_BASE}/forms/?form_type_id=${FORM_TYPE_ID}`)
    if (!resp.ok) throw new Error(`Error ${resp.status} al obtener la lista de formularios`)
    forms.value = await resp.json()
  } catch (e) {
    error.value = e.message ?? 'No se pudo cargar la lista de formularios'
  } finally {
    loading.value = false
  }
}

onMounted(cargarFormularios)
</script>

<template>
  <div class="form-selector">
    <PureFormField label="Seleccione la actividad que desea registrar">
      <PureSelectOne
        v-model="selectedFormId"
        :options="forms"
        label-key="title"
        value-key="id"
        :disabled="loading"
        :placeholder="loading ? 'Cargando formularios…' : 'Selecciona un formulario'"
      />
    </PureFormField>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="!loading && forms.length === 0" class="empty">No hay formularios disponibles.</p>

    <CustomFormRenderer v-if="selectedFormId" :key="selectedFormId" :form-id="selectedFormId" language="es" />
  </div>
</template>

<style scoped>
.form-selector {
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
</style>
