<script setup>
import CustomFormRenderer from './components/CustomFormRenderer.vue'
import LoginView from './components/LoginView.vue'
import { isAuthenticated, logout } from '@/shared/services/session'
</script>

<template>
	<LoginView v-if="!isAuthenticated" />

	<template v-else>
		<div class="session-bar">
			<button type="button" @click="logout">Cerrar sesión</button>
		</div>

		<CustomFormRenderer
		  form-id="709060bb-cd61-4f93-a150-26bcd390a43e" language="es"
		/>

		<CustomFormRenderer
		  form-id="88933f9a-c3fc-4885-a368-101d57e4df0c" language="en"
		/>

		<CustomFormRenderer
		  form-id="1eb11333-b490-429e-b474-20e4df2454a1" language="en"
		/>

		<!--CustomFormRenderer
		  form-id="08a99111-f1c2-4eb2-840b-f430df0e9bfa" language="es"
		/-->

		<!--CustomFormRenderer
		  form-id="08a99111-f1c2-4eb2-840b-f430df0e9bfa" language="es" submission-id="db1f3a22-d3d4-484a-88a9-fd31dd6a0d85"
		/-->
	</template>
</template>

<style scoped>
.session-bar {
	display: flex;
	justify-content: flex-end;
	padding: 0.5rem 1.5rem;
}
</style>