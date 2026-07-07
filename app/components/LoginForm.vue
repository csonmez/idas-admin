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
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <div class="form-field">
      <label for="email">E-posta</label>
      <InputText
        id="email"
        v-model="email"
        type="email"
        placeholder="E-posta adresiniz"
        :disabled="isLoading"
        required
        fluid
        @blur="handleEmailBlur"
      />
    </div>

    <div class="form-field">
      <label for="password">Parola</label>
      <Password
        id="password"
        v-model="password"
        placeholder="********"
        :feedback="false"
        toggle-mask
        :disabled="isLoading"
        required
        fluid
      />
    </div>

    <Button
      type="submit"
      class="login-button"
      :label="isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'"
      :loading="isLoading"
    />
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


.login-form :deep(.p-inputtext) {
  height: 50px;
  padding: 0 15px;
  border: 1.5px solid #111111;
  border-radius: 10px;
  background: #f3f4f6;
  color: #111111;
  font-size: 15px;
  transition: 0.2s ease;
}

.login-form :deep(.p-inputtext::placeholder) {
  color: #4e5662;
}

.login-form :deep(.p-inputtext:enabled:hover) {
  background: #ffffff;
  border-color: #000000;
}

.login-form :deep(.p-inputtext:enabled:focus) {
  border-color: #000000;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.08);
}

/* Buton */
.login-button {
  width: 100%;
  height: 52px;
  margin-top: 6px;
  border-radius: 10px;
  background: #000000;
  border-color: #000000;
  font-size: 15px;
  font-weight: 800;
  transition: 0.2s ease;
}

.login-button:enabled:hover {
  background: #1f1f1f;
  border-color: #1f1f1f;
  transform: translateY(-1px);
}

.login-button:enabled:active {
  transform: translateY(0);
}
</style>