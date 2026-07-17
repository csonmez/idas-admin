import { type ColumnDef } from '@tanstack/vue-table'

// Course interface
export interface Course {
  id: string
  code: string
  name: string
  credits: number
  ects: number
  semester: string
  year: number
  disciplineId: string
  instructor: string
  status: 'ACTIVE' | 'PASSIVE'
}

// Define columns for the DataTable
export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: 'code',
    header: 'Kodu',
  },
  {
    accessorKey: 'name',
    header: 'Ders Adı',
  },
  {
    accessorKey: 'credits',
    header: 'Kredi',
  },
  {
    accessorKey: 'ects',
    header: 'AKTS',
  },
  {
    accessorKey: 'semester',
    header: 'Dönem',
  },
  {
    accessorKey: 'year',
    header: 'Yıl',
  },
  {
    accessorKey: 'instructor',
    header: 'Eğitmen',
  },
  {
    accessorKey: 'status',
    header: 'Durum',
    cell: ({ row }) => {
      const status = row.getValue('status')
      return status === 'ACTIVE' ? 'Aktif' : 'Pasif'
    },
  },
]

// Define filterable columns for the DataTable search
export const filterableColumns = [
  {
    id: 'code',
    title: 'Kodu',
    options: []
  },
  {
    id: 'name',
    title: 'Ders Adı',
    options: []
  },
  {
    id: 'instructor',
    title: 'Eğitmen',
    options: []
  },
]
