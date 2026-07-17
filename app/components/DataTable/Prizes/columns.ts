import type { ColumnDef } from '@tanstack/vue-table'
import { createColumns, createDetailColumn, type ColumnConfig } from '@/components/DataTable/columnHelpers'
import { h } from 'vue'
import { Calendar } from 'lucide-vue-next'

export interface Prize {
  id: string
  title: string
  description: string
  status: 'RECEIVED' | 'NOMINATED' | 'REJECTED'
  price: number
  date: string
  userId: string
  user: {
    id: string
    fullName: string
    email: string
    title: string
    name: string
    surname: string
  }
  organization: string
  category: string
  evaluationDetails?: string
  awardedBy?: string
  criteria?: string[]
  relatedProjects?: string[]
  createdAt: Date
  updatedAt: Date
}

const columnConfigs: ColumnConfig[] = [
  {
    key: 'title',
    label: 'Ödül Adı',
    sortable: true,
    type: 'text'
  },
  {
    key: 'organization',
    label: 'Kuruluş',
    sortable: true,
    type: 'text'
  },
  {
    key: 'category',
    label: 'Kategori',
    sortable: true,
    type: 'text'
  },
  {
    key: 'price',
    label: 'Ödül Tutarı',
    sortable: true,
    type: 'text',
    formatter: (value: number) => `₺${value.toLocaleString()}`
  },  {
    key: 'status',
    label: 'Durum',
    sortable: true,
    type: 'badge',
    badgeVariant: 'outline',
    badgeColorMap: {
      RECEIVED: 'bg-blue-100 text-blue-800 border-blue-300',
      NOMINATED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300'
    },
    formatter: (value: string) => {
      const statusMap: Record<string, string> = {
        RECEIVED: 'Alındı',
        NOMINATED: 'Aday',
        REJECTED: 'Reddedildi'
      }
      return statusMap[value] || value
    }
  },
  {
    key: 'date',
    label: 'Tarih',
    sortable: true,
    type: 'custom',
    render: (value: string) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(Calendar, { class: 'h-4 w-4 text-gray-500' }),
        h('span', { class: 'text-sm' }, new Date(value).toLocaleDateString('tr-TR'))
      ])
    }
  }
]

export const columns: ColumnDef<Prize>[] = [
  ...createColumns<Prize>(columnConfigs),
  createDetailColumn<Prize>('/dashboard/prizes/detail/:id', 'Detay')
]

export const filterableColumns = [
  {
    id: 'status',
    title: 'Durum',
    options: [
      { label: 'Alındı', value: 'RECEIVED' },
      { label: 'Aday', value: 'NOMINATED' },
      { label: 'Reddedildi', value: 'REJECTED' },
    ],
  },
  {
    id: 'category',
    title: 'Kategori',
    options: [
      { label: 'Araştırma', value: 'Araştırma' },
      { label: 'Eğitim', value: 'Eğitim' },
      { label: 'Hizmet', value: 'Hizmet' },
      { label: 'Yenilikçilik', value: 'Yenilikçilik' },
    ],
  },
]
