<template>
  <main class="login-page">
    <section class="image-side">
      <img
        src="/assets/loginpage.png"
        alt="Erciyes Üniversitesi Kampüsü"
        class="campus-image"
      />
    </section>

    <section class="form-side">
      <Card class="login-card">
        <template #content>
          <div class="card-header">
            <div class="logos">
              <div class="logo-item">
                <img
                  src="/assets/eru_logo.png"
                  alt="Erciyes Üniversitesi"
                  class="eru-logo"
                />
              </div>

              <div class="logo-divider"></div>

              <div class="logo-item">
                <img
                  src="/assets/ardekLogo.png"
                  alt="Araştırma Dekanlığı"
                  class="ardek-logo"
                />
              </div>
            </div>

            <h1>Erciyes Üniversitesi</h1>
            <p>Veri Analitiği Sistemi</p>
          </div>

          <LoginForm />
        </template>
      </Card>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  width: 100%;
  height: 100vh;
  display: grid;
  grid-template-columns: 1.08fr 1fr;
  overflow: hidden;
  position: relative;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.image-side {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.image-side::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.campus-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.form-side {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 42px;
}

.login-card {
  width: 100%;
  max-width: 440px;
  border-radius: 18px;
}

.login-card :deep(.p-card-body) {
  padding: 42px 40px;
}

.login-card :deep(.p-card-content) {
  padding: 0;
}

.card-header {
  margin-bottom: 34px;
  text-align: center;
}

.logos {
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 18px;
}

.logo-item {
  width: 82px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eru-logo {
  width: 90px;
  height: 90px;
  object-fit: contain;
  display: block;
}

.ardek-logo {
  width: 62px;
  height: 82px;
  object-fit: contain;
  display: block;
}

.logo-divider {
  width: 1px;
  height: 34px;
  background: var(--p-surface-300);
}

.card-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.card-header p {
  margin: 8px 0 0;
  font-size: 15px;
  font-weight: 500;
}

@media (max-width: 1000px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .image-side {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .image-side::after {
    background: rgba(0, 0, 0, 0.45);
  }

  .form-side {
    position: relative;
    z-index: 1;
    padding: 28px;
    background: transparent;
  }
}
</style>