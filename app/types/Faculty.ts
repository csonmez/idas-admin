import type { Department } from './Department'
import type { UserAcademicUnit } from './User'

export interface Faculty {
    id: string
    type: 'FACULTY' | 'INSTITUTE'
    name: string
    shortName?: string
    field?: 'HEALTH' | 'SOCIAL' | 'SCIENCE_ENGINEERING'
    phone?: string
    email?: string
    address?: string
    website?: string
    enableDisciplineHeadAccess?: boolean
    deletedAt?: Date
    createdAt: Date
    updatedAt: Date

    
    departments?: Department[]
    facultyTargets?: any[]
    userAcademicUnits?: UserAcademicUnit[]
}