import type { User } from './User'

export interface AuthState {
    user: User | null
    isAdmin: boolean
    isLoggedIn: boolean
    isFetching: boolean
}