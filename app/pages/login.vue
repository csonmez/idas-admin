<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>

<template>
  <main class="login-page">
    <section class="image-side">
      <img
        src="/assets/loginpage.png"
        alt="Erciyes Üniversitesi"
        class="campus-image"
      />
    </section>

    <section class="form-side">
      <div class="login-card">
        <div class="card-header">
          <img src="/assets/eru_logo.png" alt="Erciyes Üniversitesi Logo" class="logo" />
          <h1>Erciyes Üniversitesi</h1>
          <p>Veri Analitiği Sistemi</p>
        </div>

        <LoginForm />
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  background: #f3f6ff;
  overflow: hidden;
}

.image-side {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Kurumsal renk katmanı — beğenmezsen bu bloğu sil */
.image-side::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(23, 37, 84, 0.35), rgba(23, 37, 84, 0.05));
  pointer-events: none;
}

.campus-image {
  width: 100%;
  height: 100vh;
  object-fit: cover;
  object-position: left;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.16);
}

.form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.logo {
  width: 100px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 12px;
}

.login-card {
  width: 100%;
  max-width: 430px;
  padding: 44px 40px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 26px 70px rgba(1, 43, 139, 0.13);
}

.card-header {
  margin-bottom: 30px;
  text-align: center;
}

.card-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 29px;
  font-weight: 800;
}

.card-header p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 15px;
}

@media (max-width: 1000px) {
  .login-page {
    grid-template-columns: 1fr;
    padding: 28px;
    overflow: auto;
  }

  .image-side {
    display: none;
  }

  .form-side {
    min-height: 100vh;
    padding: 0;
  }
}
</style>