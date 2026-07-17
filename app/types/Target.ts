export interface TargetIndicator {
    id: string
    indicatorGroup: string
    subIndicatorType: string
    indicator: string
    description: string
    dataSource: string
    inputType: string
    minValue: number
    maxValue: number
    weight: number
    isActive: boolean
    isIncludedCalculations: boolean
    order: string
    isDeleted: string
    isAcademicianIndicator: boolean
    deletedAt?: Date
}

export interface TargetItems {
    id: string
    code: string
    title: string
    description: string
    weight: number
    isActive: boolean
    order: number
    isDeleted: boolean
    deletedAt: Date
    indicators: TargetIndicator[]
}

export interface Target {
    id: string
    year: number
    termId: string
    items: TargetItems[]
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
}

interface TargetDataIndicator {
    indicatorId: string
    target: number | string
    actual: number | string
    lastUpdatedAt: Date
}

export interface TargetData {
    targetId: string
    indicators: TargetDataIndicator[]
}

interface UnitTarget {
    id: string
    userId: string
    targetId: string
    data: TargetData[]
    termId: string
    year: number
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
}

export type UniversityTarget = UnitTarget

export interface FacultyTarget extends UnitTarget {
    facultyId: string
}

export interface DepartmentTarget extends UnitTarget {
    departmentId: string
}

export interface DisciplineTarget extends UnitTarget {
    disciplineId: string
}
