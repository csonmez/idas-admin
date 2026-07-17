// Discipline.ts
import type { Department } from "./Department";

export interface Discipline {
    id: string
    name: string | null
    shortName: string | null
    phone: string | null
    email: string | null
    address: string | null
    website: string | null
    departmentId: string | null
    department?: Department
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}