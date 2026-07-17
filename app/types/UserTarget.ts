export interface UserTargetIndicator {
    targetId: string
    indicators: [
        {
            indicatorId: string
            target: number
            actual: number
            lastUpdatedAt: Date
        }
    ]
}

export interface UserTarget {
    id: string
    userId: string
    targetId: string
    data: UserTargetIndicator[]
    termId: string
    year: number
    status: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
}
