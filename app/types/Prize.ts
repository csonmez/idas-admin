import type { User } from '~/types/User'

export interface Prize {
    id: string
    title: string
    type?: string
    date?: Date
    year?: number
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    userPrizes?: UserPrize[]
}

export interface UserPrize {
    id: string
    userId: string
    prizeId: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    prize?: Prize
    user?: User
}
