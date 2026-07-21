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

// ---------- Yeni awards API tipleri (idas-api / feature/awards) ----------
// Not: Frontend "ödül/prize" der, backend "award" der; uçlar /awards altında.

export type AwardTypeEnum = 'NATIONAL' | 'INTERNATIONAL'

export interface AwardRecord {
    id: string
    title: string
    type: AwardTypeEnum | null
    organization: string | null
    description: string | null
    date: string
    year: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface AwardPagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

// GET /awards -> { rows, pagination }
export interface AwardListResponse {
    rows: AwardRecord[]
    pagination: AwardPagination
}

// GET /awards/:id -> { award }
export interface AwardDetailResponse {
    award: AwardRecord
}

// GET /awards/:id/user-awards -> { rows, pagination }  (sadece userId döner)
export interface UserAwardRow {
    id: string
    awardId: string
    userId: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface UserAwardsResponse {
    rows: UserAwardRow[]
    pagination: AwardPagination
}
