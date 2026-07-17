import type { UserAcademicUnit } from './User'
import type { UserTarget } from './UserTarget'

export type ListType = 'UNIVERSITY' | 'FACULTY' | 'DEPARTMENT' | 'DISCIPLINE'
export type AwardStatus = 'AWARDED' | 'EXCLUDED'
export type AcademicTitle = 'PROF' | 'ASSOC_PROF' | 'ASSIST_PROF'

export interface PerformanceAwardRecord {
    id: string
    status: AwardStatus
    isManuallyAdded: boolean
}

export interface NestedPerformanceAwardScore {
    id: string
    listType: ListType
    rank: number
    totalInGroup: number
    isTopTenPercent: boolean
    performanceAward: PerformanceAwardRecord | null
}

export interface PerformanceAwardUser {
    id: string
    name: string
    surname: string
    email: string
    title: AcademicTitle
    userAcademicUnits: UserAcademicUnit[]
    /** GET /scores satırlarında ilgili yıl için gömülü UserTargets (boş dizi olabilir) */
    userTargets?: Pick<UserTarget, 'id' | 'year' | 'data'>[]
    /** Aynı yıl için kullanıcının diğer kapsamlardaki skor özetleri */
    performanceAwardScores?: NestedPerformanceAwardScore[]
}

export interface PerformanceAwardAcademicUnit {
    id: string
    faculty: { id: string; name: string }
    department: { id: string; name: string } | null
    discipline: { id: string; name: string } | null
}

export interface PerformanceAwardScore {
    id: string
    userId: string
    year: number
    listType: ListType
    kpsScore: string
    kltScore: string
    isbScore: string
    totalScore: string
    rank: number
    totalInGroup: number
    isTopTenPercent: boolean
    performanceAwardId: string | null
    userAcademicUnitId: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    user: PerformanceAwardUser
    performanceAward: PerformanceAwardRecord | null
    userAcademicUnit: PerformanceAwardAcademicUnit | null
}

export interface PerformanceAward {
    id: string
    userId: string
    year: number
    status: AwardStatus
    isManuallyAdded: boolean
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    user: PerformanceAwardUser
    scores: Omit<PerformanceAwardScore, 'user' | 'performanceAward' | 'userAcademicUnit'>[]
}

export interface PerformanceAwardScorePagination {
    currentPage: number
    itemsPerPage: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

export interface PerformanceAwardScoreResponse {
    rows: PerformanceAwardScore[]
    pagination: PerformanceAwardScorePagination
}

export interface CalculateResponse {
    message: string
    totalUsers: number
}
