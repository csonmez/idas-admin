import type { User } from '~/types/User'

export interface Project {
    id: string
    title: string
    type: string
    totalBudget: number
    incomingBudget: number
    year: number
    projectType: {
        id: string
        name: string
    }
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    group?: 'ARDEB' | 'TEYDEB' | 'BIDEB' | 'INTERNATIONAL' | 'GOVERNMENT'
    startDate?: Date
    endDate?: Date
    incentiveType?: string
    incentiveAmount?: number
    user?: User
    userProjects?: UserProject[]
    projectIncomingBudgets?: Array<{
        id: string
        amount: string | number
        year: number
    }>
}

export interface UserProject {
    id: string
    userId: string
    projectId: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    project?: Project
    user?: User
}
