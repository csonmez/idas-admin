export const useRequest = <T>(url: string, options: Record<string, any> = {}): Promise<T> => {
    const config = useRuntimeConfig()

    const method = ((options.method as string) || 'GET').toUpperCase()
    const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

    const doRequest = async (): Promise<T> => {
        const headers: Record<string, string> = {
            ...(options.headers || {})
        }

        // idas-api CSRF double-submit: yazma isteklerinden önce token al ve header'a koy
        if (needsCsrf) {
            const { token } = await $fetch<{ token: string }>('/csrf-token', {
                baseURL: config.public.apiBase as string,
                credentials: 'include'
            })
            headers['x-csrf-token'] = token
        }

        return $fetch<T>(url, {
            baseURL: config.public.apiBase as string,
            credentials: 'include',
            ...options,
            headers
        })
    }

    return doRequest().catch((error) => {
        console.error('Request error:', error)

        // /account/session'daki 401 "yanlış şifre" veya "henüz giriş yapılmadı" demektir,
        // oturum süresi dolması değil — o yüzden mesajı çevirme, olduğu gibi fırlat
        if (error?.status === 401 && url !== '/account/session') {
            throw new Error('Oturum süreniz dolmuştur. Lütfen tekrar giriş yapın.')
        }

        if (error?.status === 403) {
            throw new Error('Yetkiniz yok')
        }

        throw error
    })
}
