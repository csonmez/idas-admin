// Department.ts
import type { Faculty } from "./Faculty";
import type { Discipline } from "~/types/Discipline";/*
import type { UserAcademicUnit } from "~/types/UserAcademicUnit";
import type { DepartmentTarget } from "~/types/DepartmentTarget";
import type { Target } from "~/types/Target";
import type { TermPeriodException } from "~/types/TermPeriodException";*/


export interface Department {
    id: string
    name: string
    shortName?: string
    phone?: string
    email?: string
    address?: string
    website?: string
    facultyId: string
    faculty?: Faculty
    disciplines?: Discipline[]/*
    academicUnits?: UserAcademicUnit[]
    departmentTargets?: DepartmentTarget[]
    targets?: Target[]
    termPeriodExceptions?: TermPeriodException[]*/
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
}