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

// ---------- Yeni projects API tipleri (idas-api / feature/projects) ----------

export type ProjectGroup = 'ARDEB' | 'TEYDEB' | 'BIDEB' | 'INTERNATIONAL' | 'GOVERNMENT'

export interface ProjectPagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

// GET /projects -> { rows, pagination }
export interface ProjectListRow {
    id: string
    title: string
    totalBudget: string
    year: number
    group: ProjectGroup | null
    startDate: string | null
    endDate: string | null
    projectTypeId: string
    projectTypeName: string
    projectStatusId: string | null
    projectStatusName: string | null
    departmentId: string
    departmentName: string
    incomingBudgetTotal: string
    createdAt: string
}

export interface ProjectListResponse {
    rows: ProjectListRow[]
    pagination: ProjectPagination
}

// GET /projects/:id -> { project, users }
export interface ProjectDetailRow {
    id: string
    title: string
    totalBudget: string
    year: number
    group: ProjectGroup | null
    startDate: string | null
    endDate: string | null
    projectTypeId: string
    projectTypeName: string
    projectStatusId: string | null
    projectStatusName: string | null
    departmentId: string
    departmentName: string
    incomingBudgetTotal: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface ProjectUserRow {
    userProjectId: string
    userId: string
    userName: string
    userSurname: string
    projectRoleId: string | null
    projectRoleName: string | null
}

export interface ProjectDetailResponse {
    project: ProjectDetailRow
    users: ProjectUserRow[]
}

// GET /projects/:id/incoming-budgets -> { rows, pagination }
export interface ProjectIncomingBudget {
    id: string
    projectId: string
    year: number
    amount: string
    createdAt: string
}

export interface ProjectIncomingBudgetsResponse {
    rows: ProjectIncomingBudget[]
    pagination: ProjectPagination
}
