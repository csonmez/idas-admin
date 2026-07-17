import type { ColumnDef } from '@tanstack/vue-table'
import type { Patent } from '@/types'
import { createColumns, createDetailColumn, type ColumnConfig } from '@/components/DataTable/columnHelpers'

const columnConfigs: ColumnConfig[] = [
    {
        key: 'title',
        label: 'Patent Başlığı',
        sortable: true,
        type: 'text'
    },
    {
        key: 'type',
        label: 'Patent Türü',
        sortable: true,
        type: 'text'
    },
    {
        key: 'year',
        label: 'Yıl',
        sortable: true,
        type: 'text'
    }
]

export const columns: ColumnDef<Patent>[] = [...createColumns<Patent>(columnConfigs), createDetailColumn<Patent>('/dashboard/patents/detail/:id', 'Detay')]
