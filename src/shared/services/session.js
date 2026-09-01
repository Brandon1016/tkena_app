/**
 * session.js
 * -----------------------------------------------------------------------
 * Manejo mínimo de sesión (sin axios/pinia) para autenticar contra el
 * backend con JWT bearer token (POST /auth/login -> access_token). El
 * token se persiste en localStorage y se expone como estado reactivo para
 * que la UI (App.vue) pueda mostrar login o formularios según corresponda.
 * -----------------------------------------------------------------------
 */
import { computed, ref } from 'vue'

const TOKEN_KEY = 'tkena_access_token'
const REFRESH_TOKEN_KEY = 'tkena_refresh_token'

const token = ref(localStorage.getItem(TOKEN_KEY))

export const isAuthenticated = computed(() => !!token.value)

function setSession({ access_token, refresh_token }) {
  token.value = access_token
  localStorage.setItem(TOKEN_KEY, access_token)
  if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
}

export function clearSession() {
  token.value = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// El backend expone /auth/login con OAuth2PasswordRequestForm (FastAPI):
// espera application/x-www-form-urlencoded con "username" y "password".
export async function login(apiBase, username, password) {
  const body = new URLSearchParams()
  body.set('username', username)
  body.set('password', password)

  const resp = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!resp.ok) {
    throw new Error(
      resp.status === 401
        ? 'Usuario o contraseña incorrectos'
        : `Error ${resp.status} al iniciar sesión`
    )
  }

  const data = await resp.json()
  setSession(data)
  return data
}

export function logout() {
  clearSession()
}

// Wrapper de fetch() que agrega el header Authorization con el token
// actual. Si el server responde 401 (token vencido o inválido) limpia la
// sesión para que la app vuelva a mostrar el login.
export async function authFetch(url, options = {}) {
  const headers = new Headers(options.headers || {})
  if (token.value) headers.set('Authorization', `Bearer ${token.value}`)

  const resp = await fetch(url, { ...options, headers })
  if (resp.status === 401) clearSession()
  return resp
}
