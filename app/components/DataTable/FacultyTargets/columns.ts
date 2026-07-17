import type { ColumnDef } from '@tanstack/vue-table'
import { createColumns, createDetailColumn, type ColumnConfig } from '@/components/DataTable/columnHelpers'
import { h } from 'vue'

export interface FacultyTarget {
  id: string
  title: string
  year: number
  status: 'active' | 'completed' | 'pending'
  targetValue: number
  actualValue: number
  progress: number
  department: string
  lastUpdated: string
}

const columnConfigs: ColumnConfig[] = [
  {
    key: 'title',
    label: 'Hedef Adı',
    sortable: true,
    type: 'text',
    className: 'font-medium'
  },
  {
    key: 'year',
    label: 'Yıl',
    sortable: true,
    type: 'text',
    className: 'text-center'
  },
  {
    key: 'department',
    label: 'Bölüm',
    sortable: true,
    type: 'text',
    className: 'text-center text-sm'
  },
  {
    key: 'targetValue',
    label: 'Hedef Değer',
    sortable: true,
    type: 'text',
    className: 'text-center font-mono'
  },
  {
    key: 'actualValue',
    label: 'Gerçekleşen',
    sortable: true,
    type: 'text',
    className: 'text-center font-mono'
  },
  {
    key: 'progress',
    label: 'İlerleme',
    sortable: true,
    type: 'custom',
    className: 'w-full px-0',
    render: (value: number) => {
      // Progress bar gradient renk mantığı
      let gradientColor = ''
      
      if (value <= 15) {
        // %0-15: Koyu kırmızı
        gradientColor = 'bg-gradient-to-r from-red-900 to-red-800'
      } else if (value <= 20) {
        // %15-20: Koyu kırmızı-açık kırmızı
        gradientColor = 'bg-gradient-to-r from-red-800 to-red-600'
      } else if (value <= 35) {
        // %20-35: Açık kırmızı-turuncu
        gradientColor = 'bg-gradient-to-r from-red-600 to-orange-500'
      } else if (value <= 45) {
        // %35-45: Turuncu-koyu sarı
        gradientColor = 'bg-gradient-to-r from-orange-500 to-yellow-600'
      } else if (value <= 55) {
        // %45-55: Koyu sarı-açık sarı
        gradientColor = 'bg-gradient-to-r from-yellow-600 to-yellow-400'
      } else if (value <= 65) {
        // %55-65: Açık sarı-beyaz
        gradientColor = 'bg-gradient-to-r from-yellow-400 to-yellow-100'
      } else if (value <= 85) {
        // %65-85: Beyaz-açık yeşil
        gradientColor = 'bg-gradient-to-r from-yellow-100 to-green-300'
      } else if (value <= 99) {
        // %85-99: Açık yeşil-yeşil
        gradientColor = 'bg-gradient-to-r from-green-300 to-green-500'
      } else {
        // %100: Açık yeşil-yeşil-koyu yeşil
        gradientColor = 'bg-gradient-to-r from-green-400 via-green-500 to-green-700'
      }

      return h('div', { class: 'w-full px-0' }, [
        // Progress bar container - çok ince ve tam uzun
        h('div', { 
          class: 'relative w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-sm' 
        }, [
          // Progress bar fill - gradient ile
          h('div', { 
            class: `h-full ${gradientColor} transition-all duration-500 ease-in-out shadow-sm`,
            style: `width: ${Math.min(value, 100)}%`
          }),
          // Progress text overlay - küçük font
          h('div', { 
            class: 'absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800 drop-shadow-sm'
          }, `${Math.min(value, 100)}%`)
        ])
      ])
    }
  },
  {
    key: 'status',
    label: 'Durum',
    sortable: true,
    type: 'badge',
    badgeVariant: 'outline',
    badgeColorMap: {
      active: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    formatter: (value: string) => {
      const statusMap: Record<string, string> = {
        active: 'Aktif',
        completed: 'Tamamlandı',
        pending: 'Beklemede'
      }
      return statusMap[value] || value
    }
  }
]

export const columns: ColumnDef<FacultyTarget>[] = [
  ...createColumns<FacultyTarget>(columnConfigs),
  createDetailColumn<FacultyTarget>('/dashboard/faculties/targets/detail/:id', 'Detay')
]

export const filterableColumns = [
  {
    id: 'status',
    title: 'Durum',
    options: [
      { label: 'Aktif', value: 'active' },
      { label: 'Tamamlandı', value: 'completed' },
      { label: 'Beklemede', value: 'pending' },
    ],
  },
  {
    id: 'department',
    title: 'Bölümler',
    options: [
      { label: 'Tüm Bölümler', value: 'Tüm Bölümler' },
      { label: 'Mühendislik Bölümleri', value: 'Mühendislik Bölümleri' },
      { label: 'Ar-Ge Bölümleri', value: 'Ar-Ge Bölümleri' },
      { label: 'Sosyal Bilimler', value: 'Sosyal Bilimler' },
      { label: 'Fen Bilimleri', value: 'Fen Bilimleri' },
      { label: 'Dış İlişkiler', value: 'Dış İlişkiler' },
    ],
  },
  {
    id: 'year',
    title: 'Yıl',
    options: [
      { label: '2024', value: '2024' },
      { label: '2023', value: '2023' },
      { label: '2022', value: '2022' },
    ],
  },
]
