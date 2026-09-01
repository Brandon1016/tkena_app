import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import { webFormsPlugin } from '@getodk/web-forms'
import './assets/css/index.css'

// Config mínima de vue-i18n -- PureFormField.vue usa useI18n()/t() para el
// mensaje de error, así que el plugin debe estar instalado aunque no
// tengas traducciones reales todavía.
const i18n = createI18n({
  legacy: false, // requerido para poder usar useI18n() (Composition API)
  locale: 'es',
  fallbackLocale: 'es',
  messages: {
    es: {},
  },
  // PureFormField usa t(error) tratando el mensaje como clave de i18n, pero
  // por ahora pasamos texto plano (sin catálogo de traducciones real) --
  // esto evita el spam de warnings "[intlify] Not found ... key" en consola.
  // Cuando exista un catálogo real de traducciones, esto puede quitarse.
  missingWarn: false,
  fallbackWarn: false,
})

const app = createApp(App)
app.use(webFormsPlugin)
app.use(i18n)
app.mount('#app')