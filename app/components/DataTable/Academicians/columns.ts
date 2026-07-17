import type { ColumnDef } from '@tanstack/vue-table'
import { createColumns, createDetailColumn, type ColumnConfig, titleBadgeMap } from '@/components/DataTable/columnHelpers'
import { h } from 'vue'

export interface Academician {
  id: string
  name: string
  email: string
  department?: string
  status: 'ACTIVE' | 'PASSIVE'
  title: 'PROF' | 'ASSOC_PROF' | 'ASSIST_PROF' | 'RESEARCH_ASSIST' | 'LECTURER' | 'DOCTOR'
  iban?: string
  faculty?: string
  discipline?: string
  facultyId?: string
  departmentId?: string
  disciplineId?: string
  phone?: string
  createdAt?: Date
  updatedAt?: Date
}

// Ünvan mapping fonksiyonu
const getTitleDisplay = (title: string) => {
  const titleMap: Record<string, string> = {
    PROF: 'Profesör',
    ASSOC_PROF: 'Doçent',
    ASSIST_PROF: 'Dr. Öğr. Üyesi',
    RESEARCH_ASSIST: 'Araştırma Görevlisi',
    LECTURER: 'Öğr. Gör.',
    DOCTOR: 'Doktor'
  }
  return titleMap[title] || title
}

const columnConfigs: ColumnConfig[] = [
  {
    key: 'name',
    label: 'İsim Soyisim',
    sortable: false,
    type: 'custom',
    render: (value: string, row: Academician) => {
      return h('div', { class: 'flex flex-col' }, [
        h('div', { class: 'font-medium' }, (value || '-').toUpperCase()),
        h('div', { class: 'text-sm text-muted-foreground' }, getTitleDisplay(row.title))
      ])
    }
  },
  {
    key: 'faculty',
    label: 'Fakülte',
    sortable: false,
    type: 'text'
  },
  {
    key: 'department',
    label: 'Bölüm',
    sortable: false,
    type: 'text'
  },
  {
    key: 'discipline',
    label: 'Ana Bilim Dalı',
    sortable: false,
    type: 'text'
  }
]

export const columns: ColumnDef<Academician>[] = [
  ...createColumns<Academician>(columnConfigs),
  createDetailColumn<Academician>('/dashboard/academicians/:id', '')
]

export const filterableColumns = [
  {
    id: 'faculty',
    title: 'Fakülteler',
    options: [
      { label: 'Havacılık ve Uzay Bilimleri Fakültesi', value: 'Havacılık ve Uzay Bilimleri Fakültesi' },
      { label: 'Tıp Fakültesi', value: 'Tıp Fakültesi' },
      { label: 'Edebiyat Fakültesi', value: 'Edebiyat Fakültesi' },
    ],
  },
  {
    id: 'department',
    title: 'Bölümler',
    options: [
      { label: 'Uçak Gövde ve Motor Bakımı Bölümü', value: 'Uçak Gövde ve Motor Bakımı Bölümü' },
      { label: 'Dahili Tıp Bilimleri Bölümü', value: 'Dahili Tıp Bilimleri Bölümü' },
      { label: 'Tarih Bölümü', value: 'Tarih Bölümü' },
    ],
  },
  {
    id: 'discipline',
    title: 'Ana Bilim Dalları',
    options: [
      { label: 'Uçak Motor Anabilim Dalı', value: 'Uçak Motor Anabilim Dalı' },
      { label: 'Göğüs Hastalıkları Anabilim Dalı', value: 'Göğüs Hastalıkları Anabilim Dalı' },
      { label: 'Yakınçağ Tarihi Anabilim Dalı', value: 'Yakınçağ Tarihi Anabilim Dalı' },
    ],
  },
]
