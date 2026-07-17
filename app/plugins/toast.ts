import { toast } from 'vue-sonner'

interface ToastOptions {
    title: string
    description?: string
    variant?: 'default' | 'destructive'
}

const customToast = (options: ToastOptions) => {
    const { title, description, variant } = options

    if (variant === 'destructive') {
        return toast.error(title, { description })
    }

    return toast.success(title, { description })
}

export default defineNuxtPlugin(() => {
    globalThis.$toast = customToast
})
