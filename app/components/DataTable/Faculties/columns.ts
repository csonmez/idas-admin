import type { ColumnDef } from '@tanstack/vue-table'
import { createColumns, createDetailColumn, type ColumnConfig } from '@/components/DataTable/columnHelpers'

export interface Faculty {
  id: string
  name: string
  dean: string
  departmentCount: number
  establishmentYear: number
  status: 'active' | 'passive'
  phone: string
  email: string
  website: string
}

// Status badge mapping with green/red colors
const statusBadgeMap = {
  active: 'bg-green-100 text-green-800 border-green-300',
  passive: 'bg-red-100 text-red-800 border-red-300'
}

const columnConfigs: ColumnConfig[] = [
  {
    key: 'name',
    label: 'Fakülte Adı',
    sortable: true,
    type: 'text'
  },
  {
    key: 'dean',
    label: 'Dekan',
    sortable: true,
    type: 'text'
  },
  {
    key: 'departmentCount',
    label: 'Bölüm Sayısı',
    sortable: true,
    type: 'count'
  },
  {
    key: 'establishmentYear',
    label: 'Kuruluş Yılı',
    sortable: true,
    type: 'text'
  },  {
    key: 'status',
    label: 'Durum',
    sortable: true,
    type: 'badge',
    badgeVariant: 'outline',
    badgeColorMap: statusBadgeMap,
    formatter: (value: string) => value === 'active' ? 'Aktif' : 'Pasif'
  }
]

export const columns: ColumnDef<Faculty>[] = [
  ...createColumns<Faculty>(columnConfigs),
  createDetailColumn<Faculty>('/dashboard/faculties/:id', 'Detay')
]

export const filterableColumns = [
  {
    id: 'status',
    title: 'Durumlar',
    options: [
      { label: 'Aktif', value: 'active' },
      { label: 'Pasif', value: 'passive' },
    ],
  }
]
