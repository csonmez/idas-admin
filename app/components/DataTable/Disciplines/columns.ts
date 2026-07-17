import type { ColumnDef } from '@tanstack/vue-table'
import { createColumns, createDetailColumn, type ColumnConfig } from '@/components/DataTable/columnHelpers'

export interface Discipline {
  id: string
  name: string | null
  shortName: string | null
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  departmentId: string | null
  facultyId?: string | null
  faculty?: string | null
  department?: {
    id: string
    name: string
  }
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

const columnConfigs: ColumnConfig[] = [
  {
    key: 'name',
    label: 'Anabilim Dalı Adı',
    sortable: true,
    type: 'text'
  },
  {
    key: 'shortName',
    label: 'Kısa Adı',
    sortable: true,
    type: 'text'
  },
  {
    key: 'department',
    label: 'Bölüm',
    sortable: true,
    type: 'custom',
    render: (value: unknown, row: Discipline) => row.department?.name || '-'
  },
  {
    key: 'phone',
    label: 'Telefon',
    sortable: false,
    type: 'text'
  },
  {
    key: 'email',
    label: 'E-posta',
    sortable: false,
    type: 'text'
  }
]

export const columns: ColumnDef<Discipline>[] = [
  ...createColumns<Discipline>(columnConfigs),
  createDetailColumn<Discipline>('/dashboard/disciplines/:id', 'Detay')
]

export const filterableColumns = [
  {
    id: 'department',
    title: 'Bölümler',
    options: [
      { label: 'Bilgisayar Mühendisliği', value: 'Bilgisayar Mühendisliği' },
      { label: 'Elektrik-Elektronik Mühendisliği', value: 'Elektrik-Elektronik Mühendisliği' },
      { label: 'Makine Mühendisliği', value: 'Makine Mühendisliği' },
      { label: 'İç Hastalıkları', value: 'İç Hastalıkları' },
    ],
  }
]
