import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import i18n from '@/shared/plugins/i18n'

const t = (key) => i18n.global.t(key)

const baseConfig = {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    customClass: {
        popup: 'swal-custom-popup',
        confirmButton: 'swal-custom-confirm',
        cancelButton: 'swal-custom-cancel'
    }
}
/**
 * Custom SweetAlert2 configuration to match the theme
 */
const Toast = Swal.mixin({
    ...baseConfig,

    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,

    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
})

const notifications = {

    /**
     * Show a success alert
     */
    success(titleKey, textKey = '') {
        return Swal.fire({
            ...baseConfig,
            icon: 'success',
            title: titleKey,
            text: textKey,
            showConfirmButton: false,
            timer: 1000
        })
    },

    /**
     * Show an error alert
     */
    error(titleKey, textKey = '') {
        return Swal.fire({
            ...baseConfig,
            icon: 'error',
            title: t(titleKey),
            text: textKey ? t(textKey) : ''
        })
    },

    /**
     * Show a confirmation dialog
     */
    confirm(
        title,
        text = '',
        {
            confirmButtonText = i18n.global.t('common.confirm'),
            cancelButtonText = i18n.global.t('common.cancel')
        } = {}
    ) {
        return Swal.fire({
            ...baseConfig,
            title,
            text,
            icon: 'warning',

            showCancelButton: true,
            confirmButtonText,
            cancelButtonText
        })
    },

    /**
     * Show a toast notification
     */
    toast(title, icon = 'success') {
        return Toast.fire({
            icon,
            title
        })
    },
    confirmDelete(
    title,
    text = '',
    {
        confirmButtonText = i18n.global.t('common.delete'),
        cancelButtonText = i18n.global.t('common.cancel')
    } = {}
) {
    return Swal.fire({
        ...baseConfig,
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
            ...baseConfig.customClass,
            confirmButton: 'swal-custom-danger',
            cancelButton: 'swal-custom-cancel'
        }
    })
},
}

export default notifications
