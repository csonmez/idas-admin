import type { ColumnDef } from '@tanstack/vue-table'
import { createColumns, createDetailColumn, type ColumnConfig } from '@/components/DataTable/columnHelpers'

export interface Project {
  id: string
  title: string
  description: string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
  type: string
  incentiveType: string
  price: number
  startDate: string
  endDate?: string
  userId: string
  user: {
    id: string
    fullName: string
    email: string
    title: string
  }
  createdAt: Date
  updatedAt: Date
}

const columnConfigs: ColumnConfig[] = [
    {
        key: 'title',
        label: 'Proje Başlığı',
        sortable: false,
        type: 'text'
    },
    {
        key: 'type',
        label: 'Proje Türü',
        sortable: false,
        type: 'text'
    },
    {
        key: 'startDate',
        label: 'Başlangıç Tarihi',
        sortable: false,
        type: 'text',
        //tarhilerin dügn görükmesi için
        formatter: (value: string) => {
            if (!value) return '-'
            const date = new Date(value)
            return date.toLocaleDateString('tr-TR')
        }
    },
    {
        key: 'endDate',
        label: 'Bitiş Tarihi',
        sortable: false,
        type: 'text',
        //tarhilerin düzgün görükmesi için
        formatter: (value: string) => {
            if (!value) return '-'
            const date = new Date(value)
            return date.toLocaleDateString('tr-TR')
        }
    },
    {
        key: 'year',
        label: 'Yıl',
        sortable: false,
        type: 'text'
    }
]

export const columns: ColumnDef<Project>[] = [...createColumns<Project>(columnConfigs), createDetailColumn<Project>('/dashboard/projects/detail/:id', 'Detay')]


