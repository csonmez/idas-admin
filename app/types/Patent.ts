import type { User } from '~/types/User'

export interface Patent {
    id: string
    title?: string
    date: Date
    year: number
    type?: 'NATIONAL' | 'INTERNATIONAL'
    hasInternationalCollaboration?: boolean
    hasIndustryCollaboration?: boolean
    hasNationalCollaboration?: boolean
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    userPatents?: UserPatent[]
}

export interface UserPatent {
    id: string
    patentId: string
    patent: Patent
    userId: string
    user: User
    status: 'pending' | 'inProgress' | 'approved' | 'rejected'
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
}
