export interface RolePermission {
    id: string
    userId: string
    user: User
    academicUnitId: string
    permissions: string[]
    role:
        | 'DEVELOPER'
        | 'SUPER_ADMIN'
        | 'ADMIN'
        | 'RECTOR'
        | 'VICE_RECTOR'
        | 'DEAN'
        | 'VICE_DEAN'
        | 'DEPARTMENT_HEAD'
        | 'VICE_DEPARTMENT'
        | 'DISCIPLINE_HEAD'
        | 'VICE_DISCIPLINE'
        | 'INSTITUTE_HEAD'
        | 'VICE_INSTITUTE'
    positionType?: 'MAIN' | 'ADDITIONAL'
}

export interface UserAcademicUnit {
    id: string
    userId: string
    facultyId?: string
    departmentId?: string
    disciplineId?: string
    affiliationType: 'MAIN' | 'ADDITIONAL'
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    // Relations
    rolePermissions?: RolePermission[]
    department?: {
        id: string
        name: string
    }
    discipline?: {
        id: string
        name: string
    }
    faculty?: {
        id: string
        name: string
    }
    user?: User
}

export interface AuthState {
    user: User | null
    isAdmin: boolean
    isLoggedIn: boolean
    isFetching: boolean
}

export interface User {
    id: string
    name: string
    surname: string
    email: string
    password?: string
    userType: 'ACADEMICIAN' | 'POSTDOC' | 'STAFF'
    title?: 'PROF' | 'ASSOC_PROF' | 'ASSIST_PROF' | 'RESEARCH_ASSIST' | 'LECTURER' | 'DOCTOR'
    status?: 'ACTIVE' | 'PASSIVE'
    iban?: string
    isSetPassword?: boolean
    temp?: any
    lastNotifyAt?: Date
    performanceEndDate?: Date
    incentiveEndDate?: Date
    deletedAt?: Date
    createdAt: Date
    updatedAt: Date
    userAcademicUnits?: UserAcademicUnit[]
    rolePermissions?: RolePermission[]
}
