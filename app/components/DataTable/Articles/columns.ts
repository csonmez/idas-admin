import type { ColumnDef } from '@tanstack/vue-table'
import type { Article } from '@/types'
import { createColumns, createDetailColumn, type ColumnConfig } from '@/components/DataTable/columnHelpers'

// Q değeri badge mapping
const qValueBadgeMap = {
    Q1: 'default',
    Q2: 'secondary',
    Q3: 'outline',
    Q4: 'outline'
}

const columnConfigs: ColumnConfig[] = [
    {
        key: 'title',
        label: 'Makale Başlığı',
        sortable: true,
        type: 'text'
    },
    {
        key: 'journal',
        label: 'Dergi',
        sortable: true,
        type: 'text'
    },
    {
        key: 'qValue',
        label: 'Q Değeri',
        sortable: true,
        type: 'badge',
        badgeColorMap: qValueBadgeMap
    }
]

export const columns: ColumnDef<Article>[] = [...createColumns<Article>(columnConfigs), createDetailColumn<Article>('/dashboard/articles/:id', 'Detay')]
