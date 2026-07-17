import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, ScanEye } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface ColumnConfig {
    key: string
    label: string
    sortable?: boolean
    type?: 'text' | 'badge' | 'count' | 'date' | 'link' | 'custom'
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
    badgeColorMap?: Record<string, string>
    formatter?: (value: any) => string
    render?: (value: any, row: any) => any
    className?: string
}

export interface ActionConfig {
    entityType: string
    detailUrlPattern?: string
    editUrlPattern?: string
    customItems?: any[]
    enableQuickView?: boolean
    enableCopyId?: boolean
    enableEdit?: boolean
    enableDelete?: boolean
    enableView?: boolean
}

// Create a sortable header
export function createSortableHeader(label: string, key: string) {
    return ({ column }: { column: any }) =>
        h(
            Button,
            {
                variant: 'ghost',
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
            },
            () => [label, h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
        )
}

// Create a simple text column
export function createTextColumn<T>(config: ColumnConfig): ColumnDef<T> {
    return {
        accessorKey: config.key as keyof T,
        header: config.sortable ? createSortableHeader(config.label, config.key) : config.label,
        cell: ({ row }) => {
            const value = row.getValue(config.key)
            const displayValue = config.formatter ? config.formatter(value) : value || '-'
            return config.className ? h('div', { class: config.className }, String(displayValue)) : String(displayValue)
        }
    }
}

// Create a badge column
export function createBadgeColumn<T>(config: ColumnConfig): ColumnDef<T> {
    return {
        accessorKey: config.key as keyof T,
        header: config.sortable ? createSortableHeader(config.label, config.key) : config.label,
        cell: ({ row }) => {
            const value = row.getValue(config.key)
            if (!value) return '-'

            let variant: 'default' | 'secondary' | 'destructive' | 'outline' = config.badgeVariant || 'default'
            let customClass = ''

            if (config.badgeColorMap && typeof value === 'string') {
                const mappedValue = config.badgeColorMap[value]
                // Check if it's a standard variant
                if (mappedValue === 'default' || mappedValue === 'secondary' || mappedValue === 'destructive' || mappedValue === 'outline') {
                    variant = mappedValue
                } else if (mappedValue) {
                    // Use custom CSS class
                    customClass = mappedValue
                }
            }

            const displayValue = config.formatter ? config.formatter(value) : value

            if (customClass) {
                return h('span', { class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customClass}` }, String(displayValue))
            }

            return h(Badge, { variant }, () => String(displayValue))
        }
    }
}

// Create a count badge column
export function createCountColumn<T>(config: ColumnConfig): ColumnDef<T> {
    return {
        accessorKey: config.key as keyof T,
        header: config.sortable ? createSortableHeader(config.label, config.key) : config.label,
        cell: ({ row }) => {
            const value = row.getValue(config.key)
            const count = value && typeof value === 'number' ? value : 0
            return h(Badge, { variant: 'secondary' }, () => count.toString())
        }
    }
}

// Create a detail button column
export function createDetailColumn<T>(urlPattern: string, label: string = 'Detay'): ColumnDef<T> {
    return {
        id: 'detail',
        header: () => {
            return h('div', { class: 'flex flex-col items-center' }, [h('span', {}, label)])
        },
        enableHiding: false,
        cell: ({ row }) => {
            const id = (row.original as any).id
            const url = urlPattern.replace(':id', id)

            return h('div', { class: 'flex justify-center' }, [
                h(
                    'button',
                    {
                        onClick: () => {
                            if (typeof window !== 'undefined') {
                                window.location.href = url
                            }
                        },
                        class: 'p-2 rounded-full hover:bg-blue-100 transition-colors group',
                        title: `${label} sayfasına git`
                    },
                    [h(ScanEye, { class: 'h-5 w-5 text-gray-900 group-hover:text-gray-700 transition-colors' })]
                )
            ])
        }
    }
}

// Create a custom column with render function
export function createCustomColumn<T>(config: ColumnConfig): ColumnDef<T> {
    return {
        accessorKey: config.key as keyof T,
        header: config.sortable ? createSortableHeader(config.label, config.key) : config.label,
        cell: ({ row }) => {
            const value = row.getValue(config.key)
            if (config.render) {
                const rendered = config.render(value, row.original)
                return config.className ? h('div', { class: config.className }, [rendered]) : rendered
            }
            return value || '-'
        }
    }
}

// Utility function to create columns from config array
export function createColumns<T>(configs: ColumnConfig[]): ColumnDef<T>[] {
    const columns: ColumnDef<T>[] = []

    configs.forEach((config) => {
        switch (config.type) {
            case 'badge':
                columns.push(createBadgeColumn<T>(config))
                break
            case 'count':
                columns.push(createCountColumn<T>(config))
                break
            case 'custom':
                columns.push(createCustomColumn<T>(config))
                break
            default:
                columns.push(createTextColumn<T>(config))
        }
    })

    return columns
}

// Common status badge mappings
export const statusBadgeMap = {
    ACTIVE: 'default',
    PASSIVE: 'secondary',
    COMPLETED: 'default',
    PAUSED: 'secondary',
    CANCELLED: 'destructive'
}

// Common title badge mappings
export const titleBadgeMap = {
    PROF: 'default',
    ASSOC_PROF: 'secondary',
    ASSIST_PROF: 'outline',
    RESEARCH_ASSIST: 'outline',
    LECTURER: 'secondary',
    DOCTOR: 'outline'
}
