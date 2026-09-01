<script setup>
import { ref } from 'vue'
import { login } from '@/shared/services/session'
import PureFormField from '@/shared/components/Primitives/PureFormField.vue'
import PureInput from '@/shared/components/Primitives/PureInput.vue'
import PureButton from '@/shared/components/Primitives/PureButton.vue'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:9000'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

async function onSubmit() {
  loading.value = true
  error.value = null
  try {
    await login(API_BASE, username.value, password.value)
  } catch (e) {
    error.value = e.message ?? 'No se pudo iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="login-view" @submit.prevent="onSubmit">
    <h1>Iniciar sesión</h1>

    <PureFormField label="Usuario" required>
      <PureInput
        v-model="username"
        name="username"
        autocomplete="username"
        required
      />
    </PureFormField>

    <PureFormField label="Contraseña" required>
      <PureInput
        v-model="password"
        type="password"
        name="password"
        autocomplete="current-password"
        required
      />
    </PureFormField>

    <PureButton type="submit" :disabled="loading" :loading="loading" full-width>
      {{ loading ? 'Ingresando…' : 'Ingresar' }}
    </PureButton>

    <p v-if="error" class="login-error">{{ error }}</p>
  </form>
</template>

<style scoped>
.login-view {
  max-width: 360px;
  margin: 3rem auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.login-error {
  color: #c0392b;
}
</style>
