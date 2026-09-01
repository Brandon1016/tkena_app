<script setup>
/**
 * CustomFormRenderer.vue
 * -----------------------------------------------------------------------
 * PROTOTIPO DE PRUEBA -- diseño simple, para validar el patrón:
 *
 *   - El JSON de tu endpoint define QUÉ se dibuja (estructura, labels,
 *     tipos, orden) -> tú tienes control total del diseño.
 *   - @getodk/xforms-engine (cargado desde el XML) define SI se muestra
 *     y CUÁNTO vale cada cosa en cada momento (relevant, calculate,
 *     opciones filtradas de selects en cascada).
 *
 * Cómo se conectan: cada nodo del motor tiene una "reference" tipo
 *   /rootid/SECTION_META/metadata/interviewername
 * y cada item de tu JSON tiene una posición equivalente en el árbol
 * (grupo > grupo > campo, usando los mismos "name"). Construimos un
 * mapa por esa ruta relativa para cruzar ambos.
 *
 * LIMITACIONES DE ESTE PROTOTIPO (a propósito, para mantenerlo simple):
 *   - No maneja `repeat` todavía (grupos con is_repeat=true se muestran
 *     una sola vez, sin poder agregar/quitar instancias).
 *   - Tipos soportados: note, text, integer, decimal, time, select_one,
 *     select_multiple. Cualquier otro tipo (geopoint, deviceid, start,
 *     upload...) se muestra como "tipo no soportado aún".
 *   - No valida `constraint` ni `required` visualmente todavía.
 * URLs esperadas del backend:
 *   XML                  : {API_BASE}/forms/{formId}/xform.xml
 *   JSON                 : {API_BASE}/forms/{formId}
 *   Submissions (crear)  : POST {API_BASE}/forms/{formId}/submissions/openrosa
 *   Submission a editar  : GET  {API_BASE}/forms/{formId}/submissions/{submissionId}/xml
 *   Submission (update)  : PUT  {API_BASE}/forms/{formId}/submissions/{submissionId}
 * -----------------------------------------------------------------------
 */
import { reactive, ref, shallowRef, onMounted } from 'vue'
import { loadForm } from '@getodk/xforms-engine'
import { authFetch } from '@/shared/services/session'
import PureButton from '@/shared/components/Primitives/PureButton.vue'
import PureSelectOne from '@/shared/components/Primitives/PureSelectOne.vue'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:9000'

const props = defineProps({
  // ID del formulario, ej: "0a1a12c2-d8f1-4197-b0d5-538f9d3e794f"
  formId: {
    type: String,
    required: true,
  },
  // Endpoint que devuelve el JSON del formulario. Por defecto usa
  // {API_BASE}/forms/{formId} -- pásalo explícito solo si necesitas
  // apuntar a otra URL.
  jsonEndpointUrl: {
    type: String,
    default: null,
  },
  // Si se pasa, se carga esa submission anterior para EDITAR en vez de
  // llenar un formulario en blanco. Usa editInstance() para que el motor
  // arme correctamente el deprecatedID (rastro de "esto reemplaza a...").
  submissionId: {
    type: String,
    default: null,
  },
  // Código de idioma con el que abrir el formulario, ej: "es" o "en".
  // Se compara contra el locale detectado por el motor (funciona cuando
  // el XLSForm nombra sus columnas como "English (en)" / "Spanish (es)",
  // que es como pyxform genera el atributo lang del XForm). Si no hay
  // match, se deja el idioma default del formulario sin avisar error.
  language: {
    type: String,
    default: null,
  },
})

const loading = ref(true)
const error = ref(null)
const formTitle = ref('')
const jsonItems = ref([])
const rootNode = shallowRef(null)

// Búsqueda EN VIVO (no un mapa precalculado): dado un nodo "ámbito" (root,
// un grupo, o una instancia de repeat) y un nombre, busca el hijo directo
// correspondiente recorriendo currentState.children -- siempre actualizado,
// porque currentState.children es reactivo. Esto es necesario para repeats:
// un mapa fijo construido una sola vez quedaría desactualizado en cuanto el
// usuario agrega/quita una fila (los índices de reference se renumeran).
function cambiarIdioma(idioma) {
  rootNode.value?.setLanguage(idioma)
}

async function cargarTodo() {
  loading.value = true
  error.value = null

  try {
    // 1. Traer el JSON (define QUÉ se dibuja)
    const jsonUrl = props.jsonEndpointUrl
      ?? `${API_BASE}/forms/${props.formId}`
    const respJson = await authFetch(jsonUrl)
    if (!respJson.ok) throw new Error(`Error ${respJson.status} al obtener el JSON del formulario`)
    const data = await respJson.json()
    formTitle.value = data.title ?? ''
    jsonItems.value = data.items ?? []

    // 2. Traer el XML y cargar el motor (define SI se muestra y CUÁNTO vale)
    const xmlUrl = `${API_BASE}/forms/${props.formId}/xform.xml`
    const respXml = await authFetch(xmlUrl, { headers: { Accept: 'application/xml' } })
    if (!respXml.ok) throw new Error(`Error ${respXml.status} al obtener el XML del formulario`)
    const xml = await respXml.text()

    const result = await loadForm(xml)
    if (result.status === 'failure') {
      throw new Error(result.error?.message ?? 'No se pudo cargar el motor del formulario')
    }

    let instance
    if (props.submissionId) {
      // Modo EDICIÓN: traer la submission anterior y cargarla con editInstance
      const subUrl = `${API_BASE}/forms/${props.formId}/submissions/${props.submissionId}/xml`
      const respSub = await authFetch(subUrl, { headers: { Accept: 'application/xml' } })
      if (!respSub.ok) throw new Error(`Error ${respSub.status} al obtener la submission a editar`)
      const xmlSubmissionAnterior = await respSub.text()

      // editInstance espera un objeto tipo FormData con el campo
      // "xml_submission_file" -- lo armamos aquí a partir del texto XML.
      const instanceData = new FormData()
      instanceData.append(
        'xml_submission_file',
        new Blob([xmlSubmissionAnterior], { type: 'text/xml' }),
        'submission.xml'
      )

      instance = await result.editInstance(
        {
          inputType: 'FORM_INSTANCE_INPUT_RESOLVED',
          data: [instanceData],
        },
        { stateFactory: reactive }
      )
    } else {
      // Modo CREACIÓN: formulario en blanco
      instance = result.createInstance({ stateFactory: reactive })
    }

    rootNode.value = instance.root

    // Si se pidió un idioma específico, buscamos el que coincida por su
    // locale detectado (ej. "es" -> encuentra "Español (es)") y lo aplicamos.
    // Si el formulario no define traducciones, el motor entrega un único
    // "idioma sintético" (language: '') -- en ese caso no tiene sentido
    // avisar nada, simplemente ese formulario no es multiidioma.
    const esFormularioMultiidioma =
      rootNode.value.languages.length > 1 || rootNode.value.languages[0]?.language !== ''

    if (props.language && esFormularioMultiidioma) {
      const idiomaSolicitado = rootNode.value.languages.find(
        (l) => l.locale?.language === props.language
      )
      if (idiomaSolicitado) {
        rootNode.value.setLanguage(idiomaSolicitado)
      } else {
        console.warn(
          `[CustomFormRenderer] No se encontró el idioma "${props.language}" entre los disponibles:`,
          rootNode.value.languages.map((l) => l.language)
        )
      }
    }

    // 3. Construir el mapa de cruce name-path <-> nodo del motor
    // La búsqueda de nodos ahora es en vivo (ver buscarHijoDirecto) --
    // no hace falta precomputar ningún índice aquí.
  } catch (e) {
    error.value = e.message ?? 'Error desconocido al cargar el formulario'
  } finally {
    loading.value = false
  }
}

onMounted(cargarTodo)

// -------- Submit (igual patrón que ya validamos antes) --------
const submitting = ref(false)
const submitError = ref(null)
const submitOk = ref(false)

async function enviarFormulario() {
  if (!rootNode.value) return
  submitting.value = true
  submitError.value = null
  submitOk.value = false

  try {
    const payload = await rootNode.value.prepareInstancePayload()

    // El motor ya valida required/constraint por nosotros: si algo falta o
    // es inválido, el status viene "pending" (o "max-size-exceeded" para
    // adjuntos en modo chunked) en vez de "ready". No enviamos en ese caso.
    if (payload.status !== 'ready') {
      const detalles = (payload.violations ?? [])
        .map((v) => `${v.reference} (${v.violation.condition}): ${v.violation.message?.asString ?? 'inválido'}`)
        .join('\n')
      throw new Error(`Faltan campos por completar o corregir:\n${detalles}`)
    }

    for (const instance of payload.data) {
      const body = new FormData()
      body.append('xml_submission_file', instance.instanceFile)
      for (const attachment of instance.attachments ?? []) {
        body.append(attachment.name, attachment)
      }

      // Modo edición -> PUT al recurso de la submission existente.
      // Modo creación -> POST al endpoint OpenRosa genérico.
      const url = props.submissionId
        ? `${API_BASE}/forms/${props.formId}/submissions/${props.submissionId}`
        : `${API_BASE}/forms/${props.formId}/submissions/openrosa`
      const method = props.submissionId ? 'PUT' : 'POST'

      const resp = await authFetch(url, { method, body })
      if (!resp.ok) throw new Error(`Error ${resp.status} al enviar`)
    }
    submitOk.value = true
  } catch (e) {
    submitError.value = e.message ?? 'No se pudo enviar el formulario'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="custom-form">
    <p v-if="loading">Cargando…</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <template v-else>
      <h1>{{ formTitle }}</h1>

      <!-- Solo se muestra si el formulario define más de un idioma; un
           formulario sin traducciones trae un único SyntheticDefaultLanguage
           y no tendría sentido mostrar un selector con una sola opción. -->
      <!-- OCULTO: ya no es necesario porque el idioma se define directo con
           el prop `language` (ver arriba). Se deja el código por si algún
           día se necesita permitir que el usuario cambie de idioma manual. -->
      <PureSelectOne
        v-if="false"
        class="language-select"
        :model-value="rootNode.currentState.activeLanguage.language"
        :options="rootNode.languages.map((l) => ({ value: l.language, label: l.language }))"
        @update:model-value="(val) => cambiarIdioma(rootNode.languages.find((l) => l.language === val))"
      />

      <!-- Componente recursivo declarado más abajo con defineOptions no
           es necesario: usamos un componente hijo separado para recorrer
           el árbol del JSON (ver FormItem más abajo, o el archivo aparte
           que se referencia si prefieres separarlo). -->
      <FormItemList v-if="rootNode" :items="jsonItems" :ambito="rootNode" />

      <PureButton :disabled="submitting" :loading="submitting" @click="enviarFormulario">
        {{ submitting ? 'Enviando…' : 'Enviar' }}
      </PureButton>
      <p v-if="submitOk" class="ok">¡Enviado correctamente!</p>
      <p v-if="submitError" class="error">{{ submitError }}</p>
    </template>
  </div>
</template>

<script>
// Componente auxiliar recursivo para recorrer grupos/campos del JSON.
// Vive en el mismo archivo por simplicidad del prototipo.
import { defineComponent, h } from 'vue'
import PureFormField from '@/shared/components/Primitives/PureFormField.vue'
import PureInput from '@/shared/components/Primitives/PureInput.vue'
import PureSelectOne from '@/shared/components/Primitives/PureSelectOne.vue'
import PureCheckBox from '@/shared/components/Primitives/PureCheckBox.vue'
import PureCard from '@/shared/components/Primitives/PureCard.vue'
import PureDateTime from '@/shared/components/Primitives/PureDateTime.vue'
import PureButton from '@/shared/components/Primitives/PureButton.vue'

// Búsqueda EN VIVO (no un mapa precalculado): dado un nodo "ámbito" (root,
// un grupo, o una instancia de repeat) y un nombre, busca el hijo directo
// correspondiente recorriendo currentState.children -- siempre actualizado,
// porque currentState.children es reactivo. Necesario para repeats: sus
// índices de reference se renumeran al agregar/quitar filas.
function nombreSinIndice(node) {
  const ultimo = node.currentState.reference.split('/').filter(Boolean).at(-1) ?? ''
  return ultimo.replace(/\[\d+\]$/, '')
}

function buscarHijoDirecto(ambito, nombre) {
  const hijos = ambito?.currentState?.children
  if (!hijos) return null
  return hijos.find((h) => nombreSinIndice(h) === nombre) ?? null
}

const FormItemList = defineComponent({
  name: 'FormItemList',
  props: {
    items: { type: Array, required: true },
    // Nodo del motor que sirve de "ámbito" de búsqueda para este nivel:
    // el root, un grupo, o una instancia específica de repeat. Los campos
    // de este nivel se buscan como hijos DIRECTOS de este nodo.
    ambito: { type: Object, required: true },
  },
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'item-list' },
        props.items.map((item) => renderItem(item, props.ambito))
      )
  },
})

function renderRepeat(item, ambito, rangeNode) {
  if (!rangeNode) {
    return h('div', { key: item.id, class: 'field warn' }, [
      h('label', item.label ?? item.name),
      h('p', `(repeat "${item.name}" sin nodo correspondiente en el motor)`),
    ])
  }

  const instancias = rangeNode.currentState.children // reactivo: se actualiza solo
  const esControlado = rangeNode.nodeType === 'repeat-range:controlled'
  // El label del motor ya resuelve variables ${...} contra las respuestas
  // actuales -- el del JSON es texto estático fijo, tal como se definió,
  // sin sustituir nada.
  const labelRepeat = rangeNode.currentState.label?.asString ?? item.label ?? item.name

  return h('div', { key: item.id, class: 'repeat-group' }, [
    labelRepeat ? h('h3', { class: 'repeat-title' }, labelRepeat) : null,

    ...instancias.map((instancia, i) =>
      h(
        PureCard,
        { key: instancia.nodeId, class: 'repeat-instance' },
        {
          default: () => [
            h('div', { class: 'repeat-instance-header' }, [
              h('span', `${labelRepeat} ${i + 1}`),
              // Quitar instancias solo tiene sentido (y solo existe el
              // método) en repeats NO controlados -- un repeat controlado
              // por repeat_count no permite que el cliente los agregue o
              // quite; el motor decide la cantidad según su fórmula.
              !esControlado
                ? h(
                    PureButton,
                    {
                      variant: 'danger',
                      size: 'sm',
                      onClick: () => rangeNode.removeInstances(i),
                    },
                    () => 'Quitar'
                  )
                : null,
            ]),
            h(FormItemList, { items: item.items, ambito: instancia }),
          ],
        }
      )
    ),

    !esControlado
      ? h(
          PureButton,
          { variant: 'secondary', onClick: () => rangeNode.addInstances() },
          () => `+ Agregar ${labelRepeat}`
        )
      : null,
  ])
}

function renderItem(item, ambito) {
  // Chequeo de relevancia UNIFICADO para cualquier tipo de item (grupo,
  // repeat, o campo) -- antes esto solo se hacía para grupos/campos, y los
  // repeats (título, contenido, botón de agregar) ignoraban `relevant` por
  // completo, ya que se despachaban a renderRepeat antes de llegar a este
  // chequeo.
  const engineNodeParaRelevancia = buscarHijoDirecto(ambito, item.name)
  const esRelevante = engineNodeParaRelevancia ? engineNodeParaRelevancia.currentState.relevant : true
  if (!esRelevante) return null

  if (item.kind === 'group' && item.is_repeat) {
    // Los repeats se resuelven aparte: cada instancia tiene su PROPIO
    // ámbito de búsqueda (no se puede usar un solo engineNode para todas).
    // Le pasamos el nodo ya encontrado para no buscarlo dos veces.
    return renderRepeat(item, ambito, engineNodeParaRelevancia)
  }

  const engineNode = engineNodeParaRelevancia

  if (item.kind === 'group') {
    const labelGrupo = engineNode?.currentState?.label?.asString ?? item.label
    return h(
      PureCard,
      { key: item.id, class: 'group', header: labelGrupo, expand: true },
      {
        default: () => h(FormItemList, { items: item.items, ambito: engineNode ?? ambito }),
      }
    )
  }

  // kind === 'field'
  // El JSON ya marca explícitamente qué campos no deben pintarse (ej. los
  // "calculate" invisibles) mediante "visible": false. Se respeta ese
  // valor directamente; el chequeo por type === 'calculate' queda como
  // respaldo por si algún campo calculado no trajera el flag.
  if (item.visible === false || item.type === 'calculate') return null
  if (!engineNode) {
    return h('div', { key: item.id, class: 'field warn' }, [
      h('label', item.label ?? item.name),
      h('p', `(sin nodo correspondiente en el motor para "${item.name}")`),
    ])
  }

  const esRequerido = engineNode.currentState.required === true

  // OJO: la existencia de una violación (campo inválido) es independiente
  // de si el XLSForm definió un required_message/constraint_message para
  // ese campo en particular. Antes usábamos el mensaje vacío como señal de
  // "no hay error", lo cual escondía el estado inválido en campos que
  // simplemente no tenían un mensaje personalizado definido. Ahora se usan
  // por separado: `invalido` decide el estilo de error, `mensajeError`
  // siempre tiene algún texto que mostrar (uno genérico si hace falta).
  const violation = engineNode.validationState?.violation
  const invalido = !!violation
  const mensajeError = violation
    ? violation.message?.asString ||
      (violation.condition === 'required' ? 'Este campo es requerido' : 'El valor ingresado no es válido')
    : ''

  // El label/hint del motor ya resuelve variables ${...} (ej. "${frijoles_label}")
  // contra las respuestas actuales, y se actualiza solo cuando esas
  // respuestas cambian (currentState es reactivo). El del JSON es el texto
  // estático original del XLSForm, sin sustituir -- solo se usa como
  // respaldo si por algo el motor no trae label para ese nodo.
  const labelResuelto = engineNode.currentState.label?.asString ?? item.label
  const hintResuelto = engineNode.currentState.hint?.asString ?? item.hint

  // note: no tiene input, solo texto -- se muestra fuera de PureFormField
  if (item.type === 'note') {
    return h('p', { key: item.id, class: 'note-text' }, labelResuelto)
  }

  let control

  switch (item.type) {
    case 'text':
      control = h(PureInput, {
        modelValue: engineNode.currentState.value,
        readonly: item.read_only,
        required: esRequerido,
        invalid: invalido,
        'onUpdate:modelValue': (val) => engineNode.setValue(val),
      })
      break

    case 'integer':
      control = h(PureInput, {
        type: 'number',
        step: 1,
        modelValue: engineNode.currentState.value?.toString() ?? '',
        readonly: item.read_only,
        required: esRequerido,
        invalid: invalido,
        'onUpdate:modelValue': (val) => engineNode.setValue(val === '' || val === null ? null : Number(val)),
      })
      break

    case 'decimal':
      control = h(PureInput, {
        type: 'number',
        modelValue: engineNode.currentState.value?.toString() ?? '',
        readonly: item.read_only,
        required: esRequerido,
        invalid: invalido,
        'onUpdate:modelValue': (val) => engineNode.setValue(val === '' || val === null ? null : Number(val)),
      })
      break

    // El motor exige segundos en time/dateTime ("14:30:00", no "14:30") --
    // falla EN SILENCIO (queda null) si faltan. El <input type="time">
    // nativo de PureDateTime habla en formato sin segundos, así que aquí
    // se agregan/quitan al cruzar la frontera con el motor.
    case 'date':
      control = h(PureDateTime, {
        type: 'date',
        modelValue: engineNode.currentState.value != null ? String(engineNode.currentState.value) : null,
        disabled: item.read_only,
        required: esRequerido,
        invalid: invalido,
        'onUpdate:modelValue': (val) => engineNode.setValue(val),
      })
      break

    case 'time':
      control = h(PureDateTime, {
        type: 'time',
        modelValue: engineNode.currentState.value != null ? String(engineNode.currentState.value).slice(0, 5) : null,
        disabled: item.read_only,
        required: esRequerido,
        invalid: invalido,
        'onUpdate:modelValue': (val) => engineNode.setValue(val ? `${val}:00` : null),
      })
      break

    case 'datetime':
    case 'dateTime':
      control = h(PureDateTime, {
        type: 'datetime',
        modelValue: engineNode.currentState.value != null ? String(engineNode.currentState.value).slice(0, 16) : null,
        disabled: item.read_only,
        required: esRequerido,
        invalid: invalido,
        'onUpdate:modelValue': (val) => engineNode.setValue(val ? `${val}:00` : null),
      })
      break

    case 'select_one': {
      // Opciones DINÁMICAS del motor (valueOptions) -- resuelve los
      // choice_filter (cascada) automáticamente sin replicar lógica.
      const opciones = (engineNode.currentState.valueOptions ?? []).map((op) => ({
        value: op.value,
        label: op.label?.asString ?? op.value,
      }))
      control = h(PureSelectOne, {
        modelValue: engineNode.currentState.value?.[0] ?? '',
        options: opciones,
        required: esRequerido,
        invalid: invalido,
        disabled: item.read_only,
        'onUpdate:modelValue': (val) => engineNode.selectValue(val || null),
      })
      break
    }

    case 'select_multiple': {
      // PureCheckBox maneja un booleano por opción -- una casilla por
      // cada valor posible, no un solo componente con array.
      const opciones = engineNode.currentState.valueOptions ?? []
      const seleccionados = new Set(engineNode.currentState.value)
      control = h(
        'div',
        { class: 'checkbox-group' },
        opciones.map((op) =>
          h(PureCheckBox, {
            key: op.value,
            label: op.label?.asString ?? op.value,
            modelValue: seleccionados.has(op.value),
            disabled: item.read_only,
            'onUpdate:modelValue': (checked) => {
              const actuales = new Set(engineNode.currentState.value)
              if (checked) actuales.add(op.value)
              else actuales.delete(op.value)
              engineNode.selectValues([...actuales])
            },
          })
        )
      )
      break
    }

    default:
      control = h('p', { class: 'warn' }, `Tipo "${item.type}" aún no soportado en este prototipo`)
  }

  // PureFormField ya trae label + asterisco de requerido + helper (hint)
  // + mensaje de error integrados -- no hace falta armarlos a mano.
  return h(
    PureFormField,
    {
      key: item.id,
      label: labelResuelto,
      helper: hintResuelto,
      required: esRequerido,
      error: mensajeError,
    },
    { default: () => control }
  )
}

export default {
  components: { FormItemList, PureFormField, PureInput, PureSelectOne, PureCheckBox, PureCard, PureButton },
}
</script>

<style>
/* NOTA: este bloque NO usa "scoped" a propósito. La mayoría del formulario
   (FormItemList/renderItem) se genera con h() a mano en el segundo
   <script>, fuera del <template> compilado -- y `<style scoped>` en Vue
   SOLO aplica el atributo data-v-... a nodos que salen del compilador de
   template. Los elementos creados por h() nunca lo reciben, así que un
   bloque scoped aquí simplemente NO APLICARÍA a casi nada del formulario
   (bug real que tuvimos: .checkbox-group nunca se aplicaba). Los nombres
   de clase usados abajo son lo bastante específicos para no chocar con el
   resto del sistema de diseño. */
.custom-form {
  max-width: 700px;
  margin: 0 auto;
  padding: 1.5rem;
}
.group {
  margin-bottom: 1.5rem;
}
.repeat-group {
  margin-bottom: 1.5rem;
}
.repeat-title {
  margin: 0 0 var(--space-3, 0.75rem);
}
.repeat-instance {
  margin-bottom: var(--space-3, 0.75rem);
}
.repeat-instance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3, 0.75rem);
  font-weight: 600;
}
.note-text {
  color: var(--text-secondary, #555);
  margin: 0.5rem 0;
}
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 0.4rem);
}
.warn {
  color: #b8860b;
  font-size: 0.85em;
  font-style: italic;
}
.error {
  color: #c0392b;
}
.ok {
  color: #27ae60;
}
</style>