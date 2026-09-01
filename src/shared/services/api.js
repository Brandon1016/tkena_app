import axios from "axios";
import i18n from "@/shared/plugins/i18n";
import { useAuthStore } from "@/modules/auth/stores/auth.store.js";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://0.0.0.1:9000",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para incluir el token y el idioma en cada petición
api.interceptors.request.use(
    (config) => {
    const authStore = useAuthStore();

    // Incluir token de autorización
    if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`;
        }

    // Incluir el idioma actual para el backend
    config.headers['Accept-Language'] = i18n.global.locale.value;

    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const authStore = useAuthStore();

            authStore.logout();

            const currentPath = window.location.pathname;

            if (
                currentPath !== "/sesion-error" &&
                currentPath !== "/login" &&
                currentPath !== "/"
            ) {
                window.location.href = "/sesion-error";
            }
        }

        return Promise.reject(error);
    }
);

export default api;