import type { ColumnDef } from '@tanstack/vue-table'
import { createColumns, createDetailColumn, type ColumnConfig } from '@/components/DataTable/columnHelpers'
import { h } from 'vue'

export interface DepartmentTarget {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  departmentId: string
  category: 'RESEARCH' | 'EDUCATION' | 'INFRASTRUCTURE' | 'COLLABORATION'
  progress: number
}

const columnConfigs: ColumnConfig[] = [  {
    key: 'title',
    label: 'Hedef Adı',
    sortable: true,
    type: 'custom',
    render: (value: unknown, row: DepartmentTarget) => {
      return h('div', { class: 'max-w-[200px]' }, [
        h('div', { class: 'font-medium text-sm break-words' }, row.title),
        h('div', { class: 'text-xs text-gray-500 break-words mt-1' }, row.description)
      ])
    }
  },
  {
    key: 'category',
    label: 'Kategori',
    sortable: true,
    type: 'badge',
    badgeColorMap: {
      'RESEARCH': 'bg-blue-100 text-blue-800',
      'EDUCATION': 'bg-green-100 text-green-800',
      'INFRASTRUCTURE': 'bg-purple-100 text-purple-800',
      'COLLABORATION': 'bg-orange-100 text-orange-800'
    },
    formatter: (value: string) => {
      const categoryMap: Record<string, string> = {
        'RESEARCH': 'Araştırma',
        'EDUCATION': 'Eğitim',
        'INFRASTRUCTURE': 'Altyapı',
        'COLLABORATION': 'İş Birliği'
      }
      return categoryMap[value] || value
    }
  },  {
    key: 'targetValue',
    label: 'Hedef',
    sortable: true,
    type: 'custom',
    render: (value: unknown, row: DepartmentTarget) => {
      return h('div', { class: 'text-center' }, [
        h('div', { class: 'font-mono font-medium' }, `${row.targetValue} ${row.unit}`),
        h('div', { class: 'text-xs text-gray-500' }, `Mevcut: ${row.currentValue}`)
      ])
    }
  },  {
    key: 'progress',
    label: 'İlerleme',
    sortable: true,
    type: 'custom',
    render: (value: unknown, row: DepartmentTarget) => {
      const progress = Math.round((row.currentValue / row.targetValue) * 100)
      
      // Progress bar gradient renk mantığı
      let gradientColor = ''
      
      if (progress <= 15) {
        gradientColor = 'bg-gradient-to-r from-red-900 to-red-800'
      } else if (progress <= 20) {
        gradientColor = 'bg-gradient-to-r from-red-800 to-red-600'
      } else if (progress <= 35) {
        gradientColor = 'bg-gradient-to-r from-red-600 to-orange-500'
      } else if (progress <= 45) {
        gradientColor = 'bg-gradient-to-r from-orange-500 to-yellow-600'
      } else if (progress <= 55) {
        gradientColor = 'bg-gradient-to-r from-yellow-600 to-yellow-400'
      } else if (progress <= 65) {
        gradientColor = 'bg-gradient-to-r from-yellow-400 to-yellow-100'
      } else if (progress <= 85) {
        gradientColor = 'bg-gradient-to-r from-yellow-100 to-green-300'
      } else if (progress <= 99) {
        gradientColor = 'bg-gradient-to-r from-green-300 to-green-500'
      } else {
        gradientColor = 'bg-gradient-to-r from-green-400 via-green-500 to-green-700'
      }

      return h('div', { class: 'w-full px-0' }, [
        h('div', { 
          class: 'relative w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-sm' 
        }, [
          h('div', { 
            class: `h-full ${gradientColor} transition-all duration-500 ease-in-out shadow-sm`,
            style: `width: ${Math.min(progress, 100)}%`
          }),
          h('div', { 
            class: 'absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800 drop-shadow-sm'
          }, `${Math.min(progress, 100)}%`)
        ])
      ])
    }
  },
  {
    key: 'deadline',
    label: 'Son Tarih',
    sortable: true,
    type: 'text',
    className: 'text-center text-sm',
    formatter: (value: string) => new Date(value).toLocaleDateString('tr-TR')
  },
  {
    key: 'priority',
    label: 'Öncelik',
    sortable: true,
    type: 'badge',
    badgeColorMap: {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-red-100 text-red-800'
    },
    formatter: (value: string) => {
      const priorityMap: Record<string, string> = {
        'LOW': 'Düşük',
        'MEDIUM': 'Orta',
        'HIGH': 'Yüksek'
      }
      return priorityMap[value] || value
    }
  },
  {
    key: 'status',
    label: 'Durum',
    sortable: true,
    type: 'badge',
    badgeColorMap: {
      'PENDING': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'OVERDUE': 'bg-red-100 text-red-800'
    },
    formatter: (value: string) => {
      const statusMap: Record<string, string> = {
        'PENDING': 'Beklemede',
        'IN_PROGRESS': 'Devam Ediyor',
        'COMPLETED': 'Tamamlandı',
        'OVERDUE': 'Gecikti'
      }
      return statusMap[value] || value
    }
  }
]

export const columns: ColumnDef<DepartmentTarget>[] = [
  ...createColumns<DepartmentTarget>(columnConfigs),
  createDetailColumn<DepartmentTarget>('/dashboard/departments/targets/detail/:id', 'Detay')
]

export const filterableColumns = [
  {
    id: 'status',
    title: 'Durum',
    options: [
      { label: 'Beklemede', value: 'PENDING' },
      { label: 'Devam Ediyor', value: 'IN_PROGRESS' },
      { label: 'Tamamlandı', value: 'COMPLETED' },
      { label: 'Gecikti', value: 'OVERDUE' }
    ]
  },
  {
    id: 'category',
    title: 'Kategori',
    options: [
      { label: 'Araştırma', value: 'RESEARCH' },
      { label: 'Eğitim', value: 'EDUCATION' },
      { label: 'Altyapı', value: 'INFRASTRUCTURE' },
      { label: 'İş Birliği', value: 'COLLABORATION' }
    ]
  },
  {
    id: 'priority',
    title: 'Öncelik',
    options: [
      { label: 'Düşük', value: 'LOW' },
      { label: 'Orta', value: 'MEDIUM' },
      { label: 'Yüksek', value: 'HIGH' }
    ]
  }
]
