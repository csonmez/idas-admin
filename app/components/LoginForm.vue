<script setup lang="ts">
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

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true

  try {
    const result = await login({
      email: email.value,
      password: password.value
    })

    if (result.success) {
      await nextTick()
      await router.push('/dashboard')
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
  <form class="login-form" @submit.prevent="handleSubmit">
    <div v-if="error" class="error-box">
      {{ error }}
    </div>

    <div class="form-field">
      <label for="email">E-posta</label>
      <input
        id="email"
        v-model="email"
        type="email"
        placeholder="E-posta adresiniz"
        class="form-input"
        :disabled="isLoading"
        required
        @blur="handleEmailBlur"
      />
    </div>

    <div class="form-field">
      <label for="password">Parola</label>
      <input
        id="password"
        v-model="password"
        type="password"
        placeholder="********"
        class="form-input"
        :disabled="isLoading"
        required
      />
    </div>

    <button type="submit" class="login-button" :disabled="isLoading">
      {{ isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
    </button>
  </form>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  color: #172554;
  font-size: 14px;
  font-weight: 700;
}

.form-input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #f9fafb;
  color: #111827;
  font-size: 15px;
  outline: none;
  transition: 0.2s ease;
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-input:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.error-box {
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 14px;
  line-height: 1.4;
}

.login-button {
  width: 100%;
  height: 46px;
  margin-top: 4px;
  border: none;
  border-radius: 10px;
  background: #172554;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.login-button:hover {
  background: #1d4ed8;
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>