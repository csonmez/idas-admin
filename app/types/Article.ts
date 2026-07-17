import type { Journal, JournalMetrics } from './Journal'
import type { User } from './User'

export interface Article {
    id: string
    wosId: string
    title: string
    publicationDate?: string
    year?: number
    journalId: string
    journalMetricId: string
    isOpenAccess?: boolean
    isTopTenPercent?: boolean
    earlyAccessDate?: string
    hasInternationalCollaboration?: boolean
    hasIndustryCollaboration?: boolean
    hasNationalCollaboration?: boolean
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    citationCount: number
    isEarlyAccess: boolean
    journal?: Journal
    journalMetric?: JournalMetrics
    userArticles?: UserArticle[]
}

export interface UserArticle {
    id: string
    userId: string
    articleId: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    article?: Article
    user?: User
}
