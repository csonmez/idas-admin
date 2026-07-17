export type UserIncentiveApprovalStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'

export interface IncentiveAmountBucket {
    count: number
    amount: number
    includedAmount: number
    notIncludedAmount: number
    limitedIncludedAmount: number
    finalAmount: number
    exceedsLimit: boolean
}

export interface UserIncentiveApprovalAmount {
    article: IncentiveAmountBucket
    project: IncentiveAmountBucket
    patent: IncentiveAmountBucket
    prize: IncentiveAmountBucket
    postgraduate: IncentiveAmountBucket
    total: IncentiveAmountBucket
}

export interface UserIncentiveApprovalUserRef {
    id: string
    name?: string
    surname?: string
    email?: string
    title?: string | null
    iban?: string | null
}

export interface UserIncentiveApprovalTermRef {
    id: string
    year?: number
    status?: UserIncentiveApprovalStatus
}

export interface UserIncentiveApproval {
    id: string
    userId: string
    incentiveTermId: string
    amount: UserIncentiveApprovalAmount
    status: UserIncentiveApprovalStatus
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    user?: UserIncentiveApprovalUserRef
    incentiveTerm?: UserIncentiveApprovalTermRef
}

export interface UpdateUserIncentiveApprovalBody {
    status?: UserIncentiveApprovalStatus
    amount?: UserIncentiveApprovalAmount
}

export interface UserIncentiveApprovalStatisticsActivityTotals {
    article: number
    project: number
    patent: number
    prize: number
    postgraduate: number
}

export interface UserIncentiveApprovalStatisticsAmountTotals {
    total: number
    completed: number
    pending: number
    byActivity: UserIncentiveApprovalStatisticsActivityTotals
    byActivityCompleted: UserIncentiveApprovalStatisticsActivityTotals
    byActivityPending: UserIncentiveApprovalStatisticsActivityTotals
}

export interface UserIncentiveApprovalStatistics {
    total: number
    byStatus: {
        pending: number
        completed: number
    }
    completionRate: string
    amountTotals: UserIncentiveApprovalStatisticsAmountTotals
}
