import type { toast } from '@/components/ui/toast/use-toast'

declare global {
    // eslint-disable-next-line no-var
    var $toast: typeof toast
}

export interface IPagination {
    currentPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
    itemsPerPage: number
    totalItems: number
    totalPages: number
}
export interface IApiResponse<T> {
    rows: T[]
    pagination: IPagination
}

export * from './User'
export * from './Target'
export * from './UserTarget'
export * from './AuthState'
export * from './Term'
export * from './AcademicUnit'
export * from './Article'
export * from './Company'
export * from './Patent'
export * from './Prize'
export * from './Project'
export * from './Discipline'
export * from './Ticket'
export * from './Journal'
export * from './UserIncentiveApproval'
export * from './PerformanceAward'
