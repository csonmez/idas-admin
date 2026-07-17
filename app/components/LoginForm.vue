<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
    class?: HTMLAttributes['class']
}>()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const router = useRouter()
const { login } = useAuth()

const handleEmailBlur = () => {
    if (email.value && !email.value.includes('@')) {
        email.value = `${email.value}@erciyes.edu.tr`
    }
}

const handleSubmit = async (event: Event) => {
    event.preventDefault()
    error.value = ''
    isLoading.value = true

    try {
        const result = await login({ email: email.value, password: password.value })

        if (result.success) {
            await nextTick()

            router.push('/dashboard')
        } else {
            error.value = result.error || 'Giriş yapılamadı'
        }
    } catch (err) {
        console.error('Login error:', err)
        error.value = 'Bir hata oluştu. Lütfen tekrar deneyin.'
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <form :class="cn('flex flex-col gap-6', props.class)" @submit="handleSubmit">
        <div class="flex justify-center mb-2 items-center gap-2">
            <img src="/logo1.png" alt="Logo" class="h-22 w-auto" />
            <img src="/logo2.png" alt="Ardek Logo" class="h-20 w-auto" />
        </div>
        <div class="flex flex-col items-center gap-1 text-center">
            <h1 class="text-2xl font-bold">Erciyes Üniversitesi</h1>
            <h1 class="text-2xl font-bold">Veri Analitiği Sistemi</h1>
        </div>

        <!-- Error message -->
        <div v-if="error" class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
            {{ error }}
        </div>

        <div class="grid gap-6">
            <div class="grid gap-3">
                <Label for="email">E-posta</Label>
                <Input id="email" v-model="email" type="email" placeholder="E-posta adresiniz" required :disabled="isLoading" @blur="handleEmailBlur" />
            </div>
            <div class="grid gap-3">
                <div class="flex items-center">
                    <Label for="password">Parola</Label>
                </div>
                <Input id="password" v-model="password" type="password" placeholder="********" required :disabled="isLoading" />
            </div>
            <Button type="submit" class="w-full" :disabled="isLoading">
                <span v-if="isLoading">Giriş yapılıyor...</span>
                <span v-else>Giriş Yap</span>
            </Button>
        </div>
    </form>
</template>
