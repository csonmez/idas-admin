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

  if (!email.value || !password.value) {
    error.value = 'Lütfen e-posta ve parola alanlarını doldurunuz.'
    return
  }

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
      :label="isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'"
      :loading="isLoading"
      fluid
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
  font-size: 14px;
  font-weight: 600;
}

.login-form :deep(.p-password) {
  width: 100%;
}

.login-form :deep(.p-password-input) {
  width: 100%;
}
</style>