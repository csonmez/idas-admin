export default defineNuxtRouteMiddleware(async (to) => {
    const { isLoggedIn, isFetching, fetchUser } = useAuth()

    // Public sayfalar: login ve ana sayfa
    const publicRoutes = ['/login', '/']
    const isPublicRoute = publicRoutes.includes(to.path) || to.meta.auth === false

    // /login sayfasına gelindiğinde oturumu kontrol et
    if (to.path === '/login' && !isFetching.value) {
        await fetchUser()
        if (isLoggedIn.value) {
            return navigateTo('/dashboard')
        }
        return
    }

    // Korumalı sayfalarda oturum kontrolü
    if (!isPublicRoute && !isLoggedIn.value && !isFetching.value) {
        await fetchUser()

        if (!isLoggedIn.value) {
            return navigateTo('/login')
        }
    }

    if (!isPublicRoute && !isLoggedIn.value) {
        return navigateTo('/login')
    }
})
