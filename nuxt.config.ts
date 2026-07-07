import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: ['@primevue/nuxt-module'],

  primevue: {
    options: {
      theme: {
        preset: Aura
      }
    }
  }
})