export interface TermPeriod {
    id: string
    termId: string
    year: number
    periodType: 'PERFORMANCE' | 'INCENTIVE'
    performanceType: 'UNIVERSITY' | 'FACULTY' | 'DEPARTMENT' | 'DISCIPLINE' | 'ACADEMICIAN'
    startDate: Date
    endDate: Date
    additionalMin: number
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
}

export interface Term {
    id: string
    year: number
    performanceStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
    incentiveStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
    termPeriods: TermPeriod[]
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
}

export interface TermState {
    terms: Term[]
    termPeriods: TermPeriod[]
    term: Term | null
    termPeriod: TermPeriod | null
}
