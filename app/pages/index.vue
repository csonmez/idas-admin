<script setup lang="ts">
import { onMounted } from 'vue'

// Redirect to dashboard
definePageMeta({
  layout: 'default'
})

// Automatically redirect to login or dashboard based on auth status
onMounted(async () => {
  const { isLoggedIn } = useAuth()
  
  if (isLoggedIn.value) {
    navigateTo('/dashboard')
  } else {
    navigateTo('/login')
  }
})
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <p>Redirecting to dashboard...</p>
  </div>
</template>
