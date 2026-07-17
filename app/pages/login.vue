<template>
    <div class="grid min-h-svh lg:grid-cols-2">
        <div class="flex flex-col gap-4 p-6 md:p-10">
            <div class="flex flex-1 items-center justify-center">
                <div class="w-full max-w-xs">
                    <Card class="md:w-96">
                        <CardContent>
                            <LoginForm />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
        <div class="bg-muted relative hidden lg:block">
            <img src="/logineru.jpg" alt="Login Background" class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
        </div>
    </div>
</template>

<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue'

definePageMeta({
    layout: 'auth',
    auth: false
})
</script>
