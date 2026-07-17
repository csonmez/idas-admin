import type { AuthState, User } from '~/types'

export const useAuth = () => {
    const authState = useState<AuthState>('authState', () => ({
        user: null,
        isAdmin: false,
        isLoggedIn: false,
        isFetching: false
    }))

    const router = useRouter()

    // idas-api session cevabında roller `roles` alanında; eski API `rolePermissions` kullanıyordu — ikisini de destekle.
    // TEST_ADMIN: yerel seed kullanıcısının admin rolü (idas-api seed-login-user)
    const getRoles = (userObj: User): string[] => {
        const raw = (userObj as any).rolePermissions ?? (userObj as any).roles ?? []
        return (raw as Array<{ role?: string } | string>).map((rp) => (typeof rp === 'string' ? rp : (rp.role ?? '')))
    }

    const hasAdminRole = (userObj: User) =>
        getRoles(userObj).some((role) => ['DEVELOPER', 'SUPER_ADMIN', 'ADMIN', 'TEST_ADMIN'].includes(role))

    const setUser = (userObj: User) => {
        authState.value.isAdmin = hasAdminRole(userObj)
        authState.value.user = userObj
        authState.value.isLoggedIn = true
    }

    const login = async (data: { email: string; password: string }) => {
        try {
            authState.value.isFetching = true
            // idas-api: POST /account/session -> { user }
            const response = await useRequest<{ user: User }>('/account/session', {
                method: 'POST',
                body: data
            })

            // TODO: idas-api şu an session cevabında roles: [] dönüyor (rol yüklemesi henüz API'de yok).
            // Roller dönmeye başlayınca bu kontrol otomatik devreye girer; o zamana kadar boş rol = geç.
            if (getRoles(response.user).length > 0 && !hasAdminRole(response.user)) {
                // Oturum çerezi oluştu ama kullanıcı admin değil — oturumu hemen kapat
                await useRequest('/account/session', { method: 'DELETE' }).catch(() => {})
                return {
                    success: false,
                    error: 'Bu uygulamaya erişim yetkiniz bulunmamaktadır.'
                }
            }

            setUser(response.user)
            return { success: true, user: response.user }
        } catch (error: any) {
            console.error('Login error:', error)
            return {
                success: false,
                error: error?.status === 401 ? 'E-posta veya parola hatalı.' : error?.data?.error?.message || error?.message || 'Giriş yapılamadı'
            }
        } finally {
            authState.value.isFetching = false
        }
    }

    const fetchUser = async () => {
        try {
            authState.value.isFetching = true
            // idas-api: GET /account/session -> { user }
            const response = await useRequest<{ user: User }>('/account/session')
            setUser(response.user)
        } catch (err) {
            console.log('err', err)
            authState.value.user = null
            authState.value.isLoggedIn = false
            await router.push('/login')
        } finally {
            authState.value.isFetching = false
        }
    }

    const logout = async () => {
        try {
            // idas-api: DELETE /account/session
            await useRequest('/account/session', { method: 'DELETE' })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            authState.value.user = null
            authState.value.isLoggedIn = false
            authState.value.isAdmin = false

            await router.push('/login')
        }
    }

    const user = computed(() => authState.value.user)
    const isAdmin = computed(() => authState.value.isAdmin)
    const isLoggedIn = computed(() => authState.value.isLoggedIn)
    const isFetching = computed(() => authState.value.isFetching)

    return {
        user,
        isAdmin,
        isLoggedIn,
        isFetching,
        login,
        fetchUser,
        logout
    }
}
