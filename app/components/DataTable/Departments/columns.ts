/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from '@tanstack/vue-table'
import { createColumns, createDetailColumn, type ColumnConfig } from '@/components/DataTable/columnHelpers'

export interface Department {
  id: string
  name: string
  facultyId?: string
  faculty?: {
    id: string
    name: string
  }
  address?: string
  phone?: string
  website?: string
  email?: string
  head?: string
  academicianCount?: number
  disciplineCount?: number
  createdAt?: Date
  updatedAt?: Date
}

const columnConfigs: ColumnConfig[] = [
  {
    key: 'name',
    label: 'Bölüm Adı',
    sortable: true,
    type: 'text'
  },
  {
    key: 'faculty',
    label: 'Fakülte',
    sortable: true,
    type: 'custom',
    render: (value: any, row: Department) => row.faculty?.name || '-'
  },
  {
    key: 'head',
    label: 'Bölüm Başkanı',
    sortable: true,
    type: 'text'
  },
  {
    key: 'academicianCount',
    label: 'Akademisyen Sayısı',
    sortable: true,
    type: 'count'
  },
  {
    key: 'disciplineCount',
    label: 'Ana Bilim Dalı Sayısı',
    sortable: true,
    type: 'count'
  }
]

export const columns: ColumnDef<Department>[] = [
  ...createColumns<Department>(columnConfigs),
  createDetailColumn<Department>('/dashboard/departments/:id', 'Detay')
]

export const filterableColumns = [
  {
    id: 'faculty',
    title: 'Fakülteler',
    options: [
      { label: 'Mühendislik Fakültesi', value: 'Mühendislik Fakültesi' },
      { label: 'Tıp Fakültesi', value: 'Tıp Fakültesi' },
      { label: 'Fen Fakültesi', value: 'Fen Fakültesi' },
      { label: 'İktisadi ve İdari Bilimler Fakültesi', value: 'İktisadi ve İdari Bilimler Fakültesi' },
    ],
  },
]
