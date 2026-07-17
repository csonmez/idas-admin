<script setup lang="ts">
import { valueUpdater } from '../lib/utils'
import { Button } from '@/components/ui/button'
// import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ColumnDef, ColumnFiltersState, ExpandedState, PaginationState, SortingState } from '@tanstack/vue-table'
import { FlexRender, getCoreRowModel, getExpandedRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useVueTable } from '@tanstack/vue-table'
import type { IPagination } from '~/types'

interface FilterableColumn {
    id: string
    title: string
    options: Array<{
        label: string
        value: string
    }>
}

interface DataTableProps {
    data: unknown[]
    columns: unknown[]
    page: number
    apiPagination?: IPagination
    loading?: boolean
    filterableColumns?: FilterableColumn[]
}

const props = defineProps<DataTableProps>()
const emit = defineEmits<{
    'update:page': [page: number]
}>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const rowSelection = ref({})
const expanded = ref<ExpandedState>({})
const tableData = computed(() => props.data)
const pagination = ref<PaginationState>({
    pageIndex: props.page,
    pageSize: 10
})

const table = useVueTable({
    get data() {
        return tableData.value || []
    },
    get rowCount() {
        return props.apiPagination?.totalItems || 0
    },
    columns: props.columns as ColumnDef<unknown, unknown>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true,
    onSortingChange: (updaterOrValue) => {
        valueUpdater(updaterOrValue, sorting)
    },
    onColumnFiltersChange: (updaterOrValue) => {
        valueUpdater(updaterOrValue, columnFilters)
    },
    onRowSelectionChange: (updaterOrValue) => {
        valueUpdater(updaterOrValue, rowSelection)
    },
    onExpandedChange: (updaterOrValue) => {
        valueUpdater(updaterOrValue, expanded)
    },
    // onGlobalFilterChange: (updaterOrValue) => {},
    onPaginationChange: (updaterOrValue) => valueUpdater(updaterOrValue, pagination),
    globalFilterFn: (row, columnId, value) => {
        const val = row.getValue(columnId)
        if (val === null || val === undefined) return false
        return String(val).toLowerCase().includes(String(value).toLowerCase())
    },
    state: {
        get sorting() {
            return sorting.value
        },
        get columnFilters() {
            return columnFilters.value
        },
        get rowSelection() {
            return rowSelection.value
        },
        get expanded() {
            return expanded.value
        },
        get globalFilter() {
            return ''
        },
        pagination: pagination.value
    }
})

// Pagination handlers
const handlePreviousPage = () => {
    if (props.page && props.page > 1) {
        emit('update:page', props.page - 1)
    }
}

const handleNextPage = () => {
    if (props.page) {
        emit('update:page', props.page + 1)
    }
}

defineExpose({ table })
</script>

<template>
    <div class="flex flex-col w-full max-w-full">
        <div class="flex-1 flex flex-col min-h-0">
            <div class="w-full">
                <div class="rounded-md border flex-1 flex flex-col min-h-0">
                    <div class="flex-1">
                        <div class="w-full">
                            <Table class="w-full">
                                <TableHeader>
                                    <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id" class="border-b">
                                        <TableHead
                                            v-for="header in headerGroup.headers"
                                            :key="header.id"
                                            class="h-10 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                                        >
                                            <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <!-- Loading durumu -->
                                    <TableRow v-if="loading">
                                        <TableCell :colspan="columns.length" class="h-16 text-center">
                                            <div class="flex items-center justify-center">
                                                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                                <span class="ml-2">Yükleniyor...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                    <!-- Veri durumu -->
                                    <template v-else-if="table.getRowModel().rows?.length">
                                        <template v-for="row in table.getRowModel().rows" :key="row.id">
                                            <TableRow :data-state="row.getIsSelected() ? 'selected' : undefined" class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="p-2 align-middle [&:has([role=checkbox])]:pr-0">
                                                    <div class="break-words">
                                                        <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow v-if="row.getIsExpanded()">
                                                <TableCell :colspan="row.getAllCells().length">
                                                    <slot name="expanded-row" :row="row">
                                                        {{ JSON.stringify(row.original) }}
                                                    </slot>
                                                </TableCell>
                                            </TableRow>
                                        </template>
                                    </template>

                                    <!-- Boş veri durumu -->
                                    <TableRow v-else>
                                        <TableCell :colspan="columns.length" class="h-16 text-center"> Sonuç bulunamadı. </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <div v-if="table.getRowModel().rows.length" class="flex items-center justify-end space-x-2 py-4">
                    <div class="flex-1 text-sm text-muted-foreground">
                        {{ table.getRowCount() }} kayıttan
                        {{ (props.page - 1) * 10 + 1 + '-' + ((props.page - 1) * 10 + table.getFilteredRowModel().rows.length) }}
                        arasındakiler gösteriliyor.
                    </div>
                    <div class="space-x-2">
                        <Button variant="outline" size="sm" :disabled="!apiPagination?.hasPrevPage" @click="handlePreviousPage"> Geri </Button>
                        <Button variant="outline" size="sm" :disabled="!apiPagination?.hasNextPage" @click="handleNextPage"> İleri </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
