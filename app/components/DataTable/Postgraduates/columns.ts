/* eslint-disable @typescript-eslint/no-explicit-any */
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { createColumns, createDetailColumn, type ColumnConfig } from '@/components/DataTable/columnHelpers'
import type { Postgraduate } from '~/types/Postgraduate'

const columnConfigs: ColumnConfig[] = [  {
    key: 'title',
    label: 'Tez Başlığı',
    sortable: true,
    type: 'text',
    className: 'max-w-[250px] break-words'
  },
  {
    key: 'studentName',
    label: 'Öğrenci',
    sortable: true,
    type: 'custom',
    render: (value: any, row: Postgraduate) => {
      return h('div', { class: 'max-w-[150px]' }, [
        h('div', { class: 'font-medium text-sm break-words' }, `${row.studentName} ${row.studentSurname}`),
        h('div', { class: 'text-xs text-gray-500 break-words mt-1' }, row.studentEmail || '')
      ])
    }
  },
  {
    key: 'user.fullName',
    label: 'Danışman',
    sortable: true,
    type: 'custom',    render: (value: any, row: Postgraduate) => {
      return h('div', { class: 'max-w-[150px]' }, [
        h('div', { class: 'font-medium text-sm break-words' }, row.user?.fullName || '-'),
        h('div', { class: 'text-xs text-gray-500 break-words mt-1' }, row.user?.title ? getTitleText(row.user.title) : '-')
      ])
    }
  },
  {
    key: 'subject',
    label: 'Bölüm',
    sortable: true,
    type: 'text',
    className: 'max-w-[120px] break-words'
  },
  {
    key: 'type',
    label: 'Tür',
    sortable: true,
    type: 'badge',
    badgeColorMap: {
      'YUKSEK_LISANS': 'bg-blue-100 text-blue-800',
      'DOKTORA': 'bg-purple-100 text-purple-800',
      'BUTUNLESIK_DOKTORA': 'bg-indigo-100 text-indigo-800'
    },
    formatter: (value: string) => getTypeText(value)
  },
  {
    key: 'status',
    label: 'Durum',
    sortable: true,
    type: 'badge',
    badgeColorMap: {
      'DEVAM_EDIYOR': 'bg-green-100 text-green-800',
      'TAMAMLANDI': 'bg-blue-100 text-blue-800',
      'TERK': 'bg-red-100 text-red-800'
    },
    formatter: (value: string) => getStatusText(value)
  },  {
    key: 'startDate',
    label: 'Başlangıç',
    sortable: true,
    type: 'text',
    formatter: (value: Date) => value ? value.toLocaleDateString('tr-TR') : '-'
  },
  {
    key: 'endDate',
    label: 'Bitiş',
    sortable: true,
    type: 'text',
    formatter: (value: Date) => value ? value.toLocaleDateString('tr-TR') : '-'
  }
]

// Yardımcı fonksiyonlar
function getTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    'YUKSEK_LISANS': 'Yüksek Lisans',
    'DOKTORA': 'Doktora',
    'BUTUNLESIK_DOKTORA': 'Bütünleşik Doktora'
  }
  return typeMap[type] || type
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'DEVAM_EDIYOR': 'Devam Ediyor',
    'TAMAMLANDI': 'Tamamlandı',
    'TERK': 'Terk'
  }
  return statusMap[status] || status
}

function getTitleText(title: string): string {
  const titleMap: Record<string, string> = {
    'PROF': 'Prof. Dr.',
    'ASSOC_PROF': 'Doç. Dr.',
    'ASSIST_PROF': 'Dr. Öğr. Üyesi',
    'LECTURER': 'Öğr. Gör.',
    'INSTRUCTOR': 'Öğr. Gör. Dr.',
    'RESEARCH_ASSISTANT': 'Arş. Gör.'
  }
  return titleMap[title] || title
}

export const columns: ColumnDef<Postgraduate>[] = [
  ...createColumns<Postgraduate>(columnConfigs),
  createDetailColumn<Postgraduate>('/dashboard/postgraduates/detail/:id', 'Detay')
]

export const filterableColumns = [
  {
    id: 'status',
    title: 'Durum',
    options: [
      { label: 'Devam Ediyor', value: 'DEVAM_EDIYOR' },
      { label: 'Tamamlandı', value: 'TAMAMLANDI' },
      { label: 'Terk', value: 'TERK' }
    ]
  },
  {
    id: 'type',
    title: 'Tür',
    options: [
      { label: 'Yüksek Lisans', value: 'YUKSEK_LISANS' },
      { label: 'Doktora', value: 'DOKTORA' },
      { label: 'Bütünleşik Doktora', value: 'BUTUNLESIK_DOKTORA' }
    ]
  },  {
    id: 'subject',
    title: 'Bölüm',
    options: [
      { label: 'Bilgisayar Mühendisliği', value: 'Bilgisayar Mühendisliği' },
      { label: 'Elektrik-Elektronik Mühendisliği', value: 'Elektrik-Elektronik Mühendisliği' },
      { label: 'Makine Mühendisliği', value: 'Makine Mühendisliği' },
      { label: 'Endüstri Mühendisliği', value: 'Endüstri Mühendisliği' },
      { label: 'İnşaat Mühendisliği', value: 'İnşaat Mühendisliği' }
    ]
  }
]
