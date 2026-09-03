<script setup>
/**
 * OdkFormView.vue
 * -----------------------------------------------------------------------
 * 1. Pide el XForm (XML) a un endpoint FastAPI.
 * 2. Lo renderiza con <OdkWebForm> de @getodk/web-forms.
 * 3. Al hacer submit, envía el resultado a otro endpoint FastAPI.
 *
 * Instalación previa:
 *   npm install @getodk/web-forms
 *
 * Registro global del plugin (una sola vez, en main.js):
 *   import { webFormsPlugin } from '@getodk/web-forms'
 *   app.use(webFormsPlugin) // el CSS se inyecta automáticamente, no hace falta importarlo
 * -----------------------------------------------------------------------
 */
import { ref, onMounted } from 'vue'
import { OdkWebForm } from '@getodk/web-forms'

// -------- Configuración --------
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

const props = defineProps({
  // Ruta del archivo del formulario en el servidor, ej: "/opt/tkena/solved.xlsx"
  xformPath: {
    type: String,
    required: true,
  },
  // Tamaño máximo (en bytes) permitido para un envío. Requerido por OdkWebForm
  // para decidir cuándo partir el envío en chunks. Ajusta según lo que tu
  // backend acepte (aquí 10MB por defecto).
  submissionMaxSize: {
    type: Number,
    default: 10 * 1024 * 1024,
  },
})

// -------- Estado --------
const formXml = ref(null)
const loading = ref(false)
const error = ref(null)

const submitting = ref(false)
const submitError = ref(null)
const submitOk = ref(false)

// -------- 1. Traer el XML del formulario --------
async function cargarFormulario() {
  loading.value = true
  error.value = null
  try {
    const url = `${API_BASE}/forms/xform-preview?path=${encodeURIComponent(props.xformPath)}`
    const resp = await fetch(url, {
      headers: { Accept: 'application/xml', 'Accept-Language': 'es' },
    })
    if (!resp.ok) {
      throw new Error(`Error ${resp.status} al obtener el formulario`)
    }
    // El endpoint devuelve el XML crudo (Content-Type: application/xml)
    formXml.value = await resp.text()
  } catch (e) {
    error.value = e.message ?? 'No se pudo cargar el formulario'
  } finally {
    loading.value = false
  }
}

onMounted(cargarFormulario)

// -------- 2. Adjuntos del formulario (opcional) --------
// Solo necesitas esto si tu XForm referencia recursos externos (imágenes,
// media, etc.) que OdkWebForm deba resolver por su cuenta. Si tu XML no usa
// adjuntos, no pases esta prop al componente (ver <template> más abajo).
// Descomenta y ajusta la URL cuando tengas el endpoint real de adjuntos:
//
// async function fetchFormAttachment(url) {
//   const resp = await fetch(`${API_BASE}/forms/attachment?...`)
//   if (!resp.ok) throw new Error(`No se pudo obtener el adjunto: ${url}`)
//   return resp.blob()
// }

// -------- 3. Enviar el submit al backend --------
// Forma real del payload que entrega @submit (confirmada en runtime):
//   {
//     payloadType: 'monolithic',
//     status: 'ready',
//     data: [
//       { instanceFile: File (name: 'xml_submission_file', type: 'text/xml'),
//         attachments: File[] }
//     ],
//     submissionMeta: { submissionAction, submissionMethod, encryptionKey }
//   }
// `instanceFile` ya es un File/Blob usable directo en FormData.
async function handleSubmit(payload) {
  submitting.value = true
  submitError.value = null
  submitOk.value = false

  try {
    const instances = payload?.data ?? []
    if (instances.length === 0) {
      throw new Error('El envío no trae datos de instancia (payload.data vacío)')
    }

    // Caso normal: un solo envío (monolithic). Si en tu formulario llegaran
    // varias instancias, se manda una petición por cada una.
    for (const instance of instances) {
      const body = new FormData()
      body.append('xml_submission_file', instance.instanceFile)

      for (const attachment of instance.attachments ?? []) {
        body.append(attachment.name, attachment)
      }

      const resp = await fetch(`${API_BASE}/forms/submissions`, {
        method: 'POST',
        headers: { 'Accept-Language': 'es' }, // NO fijar Content-Type manualmente: el navegador arma el boundary
        body,
      })

      if (!resp.ok) {
        throw new Error(`Error ${resp.status} al enviar el formulario`)
      }

      // El endpoint actual es de DEBUG y devuelve un resumen JSON de lo que
      // llegó. Lo logueamos para verificar el payload; quítalo cuando
      // conectes el endpoint real de submissions.
      const debugInfo = await resp.json()
      console.log('[ODK submit] Resumen del backend:', debugInfo)
    }

    submitOk.value = true
  } catch (e) {
    submitError.value = e.message ?? 'No se pudo enviar el formulario'
  } finally {
    submitting.value = false
  }
}

// Para envíos muy grandes, OdkWebForm puede emitir @submit-chunked en vez de
// @submit (cuando el tamaño supera submissionMaxSize). Aún no confirmado en
// runtime la forma exacta de "chunks" -- si tu formulario llega a disparar
// este evento, agrega un console.log(chunks) aquí y ajusta igual que hicimos
// con handleSubmit.
async function handleSubmitChunked(chunks) {
  // "chunks" es un iterable/array de Blobs o FormData parciales, según la versión.
  // Aquí un ejemplo simple enviándolos secuencialmente al mismo endpoint.
  submitting.value = true
  submitError.value = null
  submitOk.value = false
  try {
    for (const chunk of chunks) {
      const resp = await fetch(`${API_BASE}/forms/submissions`, {
        method: 'POST',
        headers: { 'Accept-Language': 'es' },
        body: chunk,
      })
      if (!resp.ok) throw new Error(`Error ${resp.status} enviando un chunk`)
    }
    submitOk.value = true
  } catch (e) {
    submitError.value = e.message ?? 'No se pudo enviar el formulario (chunked)'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="odk-form-view">
    <p v-if="loading">Cargando formulario…</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <OdkWebForm
      v-else-if="formXml"
      :form-xml="formXml"
      :submission-max-size="submissionMaxSize"
      @submit="handleSubmit"
      @submit-chunked="handleSubmitChunked"
    />

    <p v-if="submitting">Enviando…</p>
    <p v-if="submitOk" class="ok">¡Formulario enviado correctamente!</p>
    <p v-if="submitError" class="error">{{ submitError }}</p>
  </div>
</template>

<style scoped>
.error {
  color: #c0392b;
}
.ok {
  color: #27ae60;
}
</style>