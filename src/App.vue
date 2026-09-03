<script setup>
import FarmSelectorView from './components/FarmSelectorView.vue'
import LoginView from './components/LoginView.vue'
import { isAuthenticated, logout } from '@/shared/services/session'
</script>

<template>
	<LoginView v-if="!isAuthenticated" />

	<template v-else>
		<div class="session-bar">
			<button type="button" @click="logout">Cerrar sesión</button>
		</div>

		<FarmSelectorView />
	</template>
</template>

<style scoped>
.session-bar {
	display: flex;
	justify-content: flex-end;
	padding: 0.5rem 1.5rem;
}
</style>