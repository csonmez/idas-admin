<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { logout } = useAuth()

const handleLogout = () => {
  logout()
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="text-center">
        <div class="mx-auto h-16 w-16 text-red-500 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Erişim Reddedildi
        </h1>
        
        <p class="text-gray-600 mb-8">
          Bu sayfaya erişim yetkiniz bulunmamaktadır. Sadece yönetici yetkisi olan kullanıcılar bu sisteme erişebilir.
        </p>
        
        <div class="space-y-4">
          <button
            @click="handleLogout"
            class="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Çıkış Yap
          </button>
          
          <button
            @click="$router.go(-1)"
            class="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    </div>
  </div>
</template> 