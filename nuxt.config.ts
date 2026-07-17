import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
    ssr: false,
    nitro: {
        preset: 'static'
    },
    app: {
        head: {
            title: 'Erciyes Üniversitesi Veri Analitiği Sistemi',
            meta: [{ name: 'description', content: 'Erciyes Üniversitesi Veri Analitiği Sistemi' }],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
                { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
                { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
                { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
            ]
        }
    },
    modules: ['@nuxt/eslint', 'shadcn-nuxt'],
    shadcn: {
        prefix: '',
        componentDir: '@/components/ui'
    },
    components: {
        dirs: ['~/components', '~/components/ui']
    },
    css: ['~/assets/css/tailwind.css'],
    runtimeConfig: {
        public: {
            apiBase: 'http://localhost:3000/api'
        }
    },
    vite: {
        plugins: [tailwindcss() as any],
        server: {
            proxy: {
                '/api': {
                    target: 'http://localhost:3000',
                    changeOrigin: true
                }
            }
        }
    },
    compatibilityDate: '2025-05-15',
    devtools: { enabled: false },
    devServer: {
        port: 4023
    },
    build: {
        transpile: ['vue-echarts', 'echarts', 'vee-validate']
    }
})
