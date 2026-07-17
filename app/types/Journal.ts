import type { Article } from './Article'

export interface JournalMetrics {
    id: string
    journalId: string
    year: number
    qValue?: QValue | null
    isPenalized?: boolean
    impactFactor?: number
    percentile?: number
    isTopTenPercent?: boolean
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    articles?: Article[]
    journal?: Journal
}

export interface Journal {
    id: string
    name: string
    abbreviation?: string
    issn?: string
    eissn?: string
    type?: JournalType | null
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    articles?: Article[]
    journalMetrics?: JournalMetrics[]
}
// Enums for better type safety
export enum QValue {
    Q1 = 'Q1',
    Q2 = 'Q2',
    Q3 = 'Q3',
    Q4 = 'Q4'
}

export enum JournalType {
    REGULAR = 'REGULAR',
    CONFERENCE = 'CONFERENCE',
    BOOK = 'BOOK'
}
