<script setup lang="ts">
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const router = useRouter()
const { login } = useAuth()

const handleEmailBlur = () => {
  const trimmedEmail = email.value.trim()

  if (trimmedEmail && !trimmedEmail.includes('@')) {
    email.value = `${trimmedEmail}@erciyes.edu.tr`
  } else {
    email.value = trimmedEmail
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
      <span v-if="isLoading" class="loader"></span>
      <span>{{ isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}</span>
    </button>
  </form>
</template>

<style scoped>
.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  color: #111111;
  font-size: 14px;
  font-weight: 700;
}

.form-input {
  width: 100%;
  height: 50px;
  padding: 0 15px;
  border: 1.5px solid #111111;
  border-radius: 10px;
  background: #f3f4f6;
  color: #111111;
  font-size: 15px;
  outline: none;
  transition: 0.2s ease;
}

.form-input::placeholder {
  color: #4e5662;
}

.form-input:hover {
  background: #ffffff;
  border-color: #000000;
}

.form-input:focus {
  border-color: #000000;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.08);
}

.form-input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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
  height: 52px;
  margin-top: 6px;
  border: none;
  border-radius: 10px;
  background: #000000;
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s ease;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.login-button:hover {
  background: #1f1f1f;
  transform: translateY(-1px);
}

.login-button:active {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.loader {
  width: 17px;
  height: 17px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>