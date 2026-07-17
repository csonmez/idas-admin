import type { FacultyTarget } from '~/types/Target'
import type { UserAcademicUnit, User } from './User'

export interface Faculty {
    id: string
    type: 'FACULTY' | 'INSTITUTE'
    name: string
    shortName: string
    field: 'HEALTH' | 'SOCIAL' | 'SCIENCE_AND_ENGINEERING'
    dean: User
    phone: string
    email: string
    address: string
    website: string
    enableDisciplineHeadAccess: boolean
    facultyTargets: FacultyTarget[]
    facultyTarget?: FacultyTarget
    academicUnits: UserAcademicUnit[]
    departments?: Department[]
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
}

export interface Department {
    id: string
    name: string
    shortName: string
    phone: string
    email: string
    address: string
    website: string
    facultyId: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
}

// Discipline artık types/Discipline.ts'de tanımlandığı için burada tanımlamıyoruz