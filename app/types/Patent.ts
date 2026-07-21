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

// ---------- Yeni patents API tipleri (idas-api / feature/patent) ----------

export type PatentTypeEnum = 'NATIONAL' | 'INTERNATIONAL'
export type PatentStatusEnum = 'APPLICATION' | 'REGISTRATION' | 'REJECTION'
export type InstitutionOwnershipEnum = 'UNIVERSITY' | 'INDIVIDUAL' | 'INSTITUTION'
export type PatentCategoryEnum = 'PATENT' | 'UTILITY_MODEL'

export interface ExternalInventor {
    name: string
    university: string
}

// GET /patents/admin/:id -> authors[]
export interface PatentAuthorRow {
    userId: string
    name: string
    surname: string
    title: string | null
}

// GET /patents/admin -> data[] (authors olmadan)
export interface PatentListRow {
    id: string
    title: string
    date: string
    year: number
    type: PatentTypeEnum
    category: PatentCategoryEnum
    applicationNumber: string | null
    applicationDate: string | null
    registrationDate: string | null
    patentStatus: PatentStatusEnum
    isCommercialized: boolean
    institutionOwnership: InstitutionOwnershipEnum
    source: string | null
    externalInventors: ExternalInventor[] | null
    hasInternationalCollaboration: boolean
    hasIndustryCollaboration: boolean
    hasNationalCollaboration: boolean
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface PatentListResponse {
    data: PatentListRow[]
    total: number
}

// GET /patents/admin/:id -> tek patent (authors dahil)
export interface PatentDetailResponse extends PatentListRow {
    authors: PatentAuthorRow[]
}
