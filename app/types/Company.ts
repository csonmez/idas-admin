// idas-api / feature/firm (company modülü) tipleri

export interface CompanyRecord {
    id: string
    name: string
    taxNumber: string
    companyRegistrationNumber: string | null
    tradeRegistryNumber: string | null
    address: string | null
    phone: string | null
    email: string | null
    website: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface CompanyPagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

// GET /companies -> { rows, pagination }
export interface CompanyListResponse {
    rows: CompanyRecord[]
    pagination: CompanyPagination
}

// GET /companies/:id -> { company }  (POST/PATCH de { company } döner)
export interface CompanyDetailResponse {
    company: CompanyRecord
}

// user_company_affiliations: firmaya atanmış akademisyen (rol + ortaklık + tarih)
// DB enum company_affiliation_role ile senkron
export type CompanyAffiliationRole = 'BOARD_MEMBER' | 'CONSULTANT' | 'EMPLOYEE' | 'MANAGER' | 'PARTNER' | 'SHAREHOLDER'

export interface CompanyAffiliationRow {
    id: string
    companyId: string
    userId: string
    role: CompanyAffiliationRole | string
    ownershipPercentage: string | null
    startDate: string
    endDate: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

// GET /companies/:id/affiliations -> { rows, pagination }
export interface CompanyAffiliationsResponse {
    rows: CompanyAffiliationRow[]
    pagination: CompanyPagination
}

// student_company_academic_scopes: öğrenci firmasının akademik kapsamı
// (fakülte/bölüm/ana bilim dalı). GET/PUT cevabı isimlerle join'li gelir.
export interface StudentCompanyScopeView {
    id: string
    companyId: string
    academicUnitId: string
    academicUnitName: string
    scopeLevel: string
    departmentId: string
    departmentName: string
    disciplineId: string | null
    disciplineName: string | null
}

// GET/PUT /companies/:id/student-academic-scope -> { scope }
export interface StudentCompanyScopeResponse {
    scope: StudentCompanyScopeView
}
