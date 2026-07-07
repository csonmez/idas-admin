type LoginPayload = {
  email: string
  password: string
}

type LoginResult = {
  success: boolean
  error?: string
  data?: unknown
}

export const useAuth = () => {
  const login = async (payload: LoginPayload): Promise<LoginResult> => {
    try {
      const response = await $fetch('http://localhost:3000/api/auth/admin-login', {
        method: 'POST',
        body: payload,
        credentials: 'include'
      })

      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      console.error('Login request error:', error)

      return {
        success: false,
        error:
          error?.data?.message ||
          error?.data?.error ||
          'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.'
      }
    }
  }

  const fetchMe = async () => {
    try {
      const response = await $fetch('http://localhost:3000/api/me', {
        method: 'GET',
        credentials: 'include'
      })
      return response      
    } catch {
      return null          
    }
  }

  return {
    login,
    fetchMe
  }
}