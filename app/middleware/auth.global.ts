export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const { fetchMe } = useAuth()
  const user = await fetchMe()

  if (!user) {
    return navigateTo('/login')
  }
})