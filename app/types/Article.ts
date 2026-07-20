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

// ---------- Yeni articles API tipleri (idas-api) ----------

export type JournalMetricStatus = 'PROVISIONAL' | 'FINAL'

export interface ArticleListRow {
    id: string
    title: string
    doi: string | null
    publicationYear: number
    isOpenAccess: boolean
    isEarlyAccess: boolean
    authorCount: number
    internalAuthorCount: number
    journalName: string
    qValue: string | null
    metricStatus: JournalMetricStatus | null
    createdAt: string
}

export interface ArticlePagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

export interface ArticleListResponse {
    rows: ArticleListRow[]
    pagination: ArticlePagination
}

export interface ArticleDetail {
    id: string
    title: string
    normalizedTitle: string | null
    doi: string | null
    publicationDateRaw: string | null
    publicationYear: number
    publicationMonth: number | null
    earlyAccessDateRaw: string | null
    earlyAccessYear: number | null
    earlyAccessMonth: number | null
    isEarlyAccess: boolean
    journalId: string
    journalMetricId: string | null
    isOpenAccess: boolean
    hasInternationalCollaboration: boolean
    hasIndustryCollaboration: boolean
    hasNationalCollaboration: boolean
    authorCount: number
    internalAuthorCount: number
    abstractText: string | null
    volume: string | null
    issue: string | null
    pageRange: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    journalName: string
    journalAbbreviation: string | null
    journalIssn: string | null
    journalEissn: string | null
    metricYear: number | null
    metricSource: string | null
    metricStatus: JournalMetricStatus | null
    qValue: string | null
    impactFactor: string | null
    percentile: string | null
    isTopTenPercent: boolean | null
}

export interface ArticleExternalId {
    id: string
    articleId: string
    source: string
    externalId: string
}

export interface ArticleKeyword {
    id: string
    articleId: string
    keywordId: string
    keywordName: string
    normalizedName: string
    source: string
}

export interface ArticleDetailResponse {
    article: ArticleDetail
    externalIds: ArticleExternalId[]
    keywords: ArticleKeyword[]
}
