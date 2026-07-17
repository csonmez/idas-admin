<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'

const error = useError()
console.log(error.value)

const handleError = () => {
    clearError({ redirect: '/dashboard' })
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center">
        <Card class="w-full max-w-md mx-4">
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <AlertCircle class="w-6 h-6 text-destructive" />
                    Bir Hata Oluştu
                </CardTitle>
                <CardDescription>Beklenmeyen bir hata oluştu.</CardDescription>
            </CardHeader>
            <CardContent>
                <p v-if="error?.statusCode" class="text-sm text-muted-foreground mb-4">Hata Kodu: {{ error.statusCode }}</p>
                <p class="text-sm text-muted-foreground">Bu hatayı almaya devam ederseniz, lütfen sistem yöneticisi ile iletişime geçin.</p>
            </CardContent>
            <CardFooter class="flex justify-end gap-4">
                <Button @click="handleError"> Anasayfa </Button>
            </CardFooter>
        </Card>
    </div>
</template>
