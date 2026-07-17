import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
    scrollBehavior() {
        return new Promise((resolve) => {
            useNuxtApp().hooks.hookOnce('page:finish', () => {
                resolve({ top: 0, behavior: 'smooth' })
            })
        })
    }
}
