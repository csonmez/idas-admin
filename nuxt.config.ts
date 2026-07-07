import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

const ArdekPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f5f5f5',
      100: '#e5e5e5',
      200: '#d4d4d4',
      300: '#a3a3a3',
      400: '#737373',
      500: '#525252',
      600: '#404040',
      700: '#262626',
      800: '#171717',
      900: '#0a0a0a',
      950: '#000000'
    }
  }
})

export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: false
  },

  modules: ['@primevue/nuxt-module'],

  primevue: {
    options: {
      theme: {
        preset: ArdekPreset
      }
    }
  }
})