<script setup lang="ts">
import type { ColumnFiltersState, PaginationState } from '@tanstack/vue-table'
import { FlexRender, createColumnHelper, getCoreRowModel, getSortedRowModel, useVueTable } from '@tanstack/vue-table'
import { refDebounced } from '@vueuse/core'
import { Check, ChevronDown, Loader, View } from 'lucide-vue-next'
import { h } from 'vue'
import { cn, valueUpdater } from '~/lib/utils'
import type { IApiResponse, Ticket } from '~/types'

const NuxtLink = resolveComponent('NuxtLink')

const isLoading = ref(false)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const statusFilter = ref('')
const typeFilter = ref('')

const statusOptions = [
    { label: 'Tümü', value: '' },
    { label: 'Bekliyor', value: 'PENDING' },
    { label: 'İşleniyor', value: 'IN_PROGRESS' },
    { label: 'Tamamlandı', value: 'COMPLETED' },
    { label: 'Kapatıldı', value: 'CLOSED' }
]

const typeOptions = [
    { label: 'Tümü', value: '' },
    { label: 'Makale', value: 'UserArticle' },
    { label: 'Proje', value: 'UserProject' },
    { label: 'Ödül', value: 'UserPrize' },
    { label: 'Patent', value: 'UserPatent' },
    { label: 'Doktora Mezun', value: 'UserPostgraduate' },
    { label: 'Diğer', value: 'OTHER' }
]
const columnHelper = createColumnHelper<Ticket>()
const columns = [
    columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ row }) => h('div', {}, row.original.id.split('-')[0])
    }),
    columnHelper.accessor('title', {
        header: 'Başlık',
        cell: ({ row }) => h('div', { class: 'text-wrap w-50' }, row.getValue('title'))
    }),
    columnHelper.accessor('user', {
        header: 'Kullanıcı',
        cell: ({ row }) => {
            const user = row.original.user
            if (!user) return h('div', {}, 'Bilinmeyen Kullanıcı')
            return h('div', {}, formatUserName(user))
        }
    }),
    columnHelper.accessor('status', {
        header: 'Durum',
        cell: ({ row }) =>
            h(
                'div',
                {
                    class: `2xl:w-48 ${
                        row.getValue('status') === 'PENDING'
                            ? 'text-yellow-500'
                            : row.getValue('status') === 'IN_PROGRESS'
                              ? 'text-cyan-500'
                              : row.getValue('status') === 'COMPLETED'
                                ? 'text-green-500'
                                : row.getValue('status') === 'CLOSED'
                                  ? 'text-red-500'
                                  : 'text-blue-500'
                    }`
                },
                row.getValue('status') === 'PENDING' ? 'Bekliyor' : row.getValue('status') === 'COMPLETED' ? 'Tamamlandı' : row.getValue('status') === 'CLOSED' ? 'Kapatıldı' : 'İşleniyor'
            )
    }),
    columnHelper.accessor('updatedAt', {
        header: 'Son Güncelleme Tarihi',
        cell: ({ row }) => h('div', {}, new Date(row.getValue('updatedAt')).toLocaleString())
    }),
    columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    name: 'dashboard-tickets-id',
                    to: `/dashboard/tickets/${row.original.id}`
                },
                [h(View, { size: 16 })]
            )
        }
    })
]
const pagination = ref<PaginationState>({
    pageIndex: 1,
    pageSize: 10
})

// Initialize from route query parameters
const route = useRoute()
const router = useRouter()

// Set initial values from URL query parameters
const { status, type, page } = route.query
if (status) {
    statusFilter.value = status as string
}
if (type) {
    typeFilter.value = type as string
}
if (page) {
    pagination.value.pageIndex = parseInt(page as string) || 1
}
const columnFilters = ref<ColumnFiltersState>([])
const apiPagination = ref<{ hasNextPage: boolean; hasPrevPage: boolean; totalItems: number; currentPage: number; itemsPerPage: number } | null>(null)
const getCanPreviousPage = computed(() => apiPagination.value?.hasPrevPage ?? pagination.value.pageIndex > 1)
const getCanNextPage = computed(() => apiPagination.value?.hasNextPage ?? pagination.value.pageIndex < table.getPageCount())

const getTickets = async () => {
    isLoading.value = true

    // Query parametrelerini hazırla
    const queryParams: Record<string, string | number | boolean> = {
        select: 'id,title,user,status,updatedAt',
        page: pagination.value.pageIndex,
        search: debouncedSearch.value,
        orderField: 'updatedAt',
        orderDirection: 'DESC',
        useUser: true
    }

    // Sadece geçerli değerleri ekle
    if (statusFilter.value && statusFilter.value !== '') {
        queryParams.status = statusFilter.value
    }
    if (typeFilter.value && typeFilter.value !== '') {
        queryParams.type = typeFilter.value
    }

    const response = await useRequest<IApiResponse<Ticket>>('/manager/tickets', {
        method: 'GET',
        query: queryParams
    })
    isLoading.value = false

    // Update pagination info from response
    if (response?.pagination) {
        apiPagination.value = {
            hasNextPage: response.pagination.hasNextPage,
            hasPrevPage: response.pagination.hasPrevPage,
            totalItems: response.pagination.totalItems,
            currentPage: response.pagination.currentPage,
            itemsPerPage: response.pagination.itemsPerPage
        }
        // Sync local pagination state with API response
        pagination.value.pageIndex = response.pagination.currentPage
        pagination.value.pageSize = response.pagination.itemsPerPage
    }

    // Update URL query parameters
    const query: Record<string, string> = {}
    if (statusFilter.value && statusFilter.value !== '') {
        query.status = statusFilter.value
    }
    if (typeFilter.value && typeFilter.value !== '') {
        query.type = typeFilter.value
    }
    if (pagination.value.pageIndex > 1) {
        query.page = pagination.value.pageIndex.toString()
    }

    router.replace({ query })

    return response
}

const { data: tickets, refresh } = await useAsyncData('admin-tickets', getTickets, {
    watch: [debouncedSearch]
})

const table = useVueTable({
    get data() {
        return tickets.value ? tickets.value.rows : []
    },
    columns,
    manualPagination: true,
    manualFiltering: true,
    get rowCount() {
        return apiPagination.value?.totalItems ?? tickets.value?.pagination?.totalItems ?? 0
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: (updaterOrValue) => valueUpdater(updaterOrValue, pagination),
    state: {
        get columnFilters() {
            return columnFilters.value
        },
        pagination: pagination.value
    }
})

watch(
    () => pagination.value.pageIndex,
    () => refresh()
)
watch(debouncedSearch, () => {
    pagination.value.pageIndex = 1
})
watch(statusFilter, () => {
    pagination.value.pageIndex = 1
    refresh()
})
watch(typeFilter, () => {
    pagination.value.pageIndex = 1
    refresh()
})
</script>

<template>
    <div class="w-full gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
            <CardHeader>
                <CardTitle class="flex justify-between items-center">
                    <span>Destek Talepleri</span>
                </CardTitle>
            </CardHeader>
            <CardContent class="p-5">
                <div class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center py-4">
                    <div class="flex gap-2 sm:gap-3 flex-nowrap">
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="outline" class="w-[180px] justify-between">
                                    <span
                                        >Durum:
                                        {{
                                            statusFilter
                                                ? statusFilter === 'PENDING'
                                                    ? 'Bekliyor'
                                                    : statusFilter === 'IN_PROGRESS'
                                                      ? 'İşleniyor'
                                                      : statusFilter === 'COMPLETED'
                                                        ? 'Tamamlandı'
                                                        : statusFilter === 'CLOSED'
                                                          ? 'Kapatıldı'
                                                          : ''
                                                : 'Tümü'
                                        }}</span
                                    >
                                    <ChevronDown class="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent class="w-[180px]">
                                <DropdownMenuRadioGroup v-model="statusFilter">
                                    <DropdownMenuRadioItem v-for="statusOption in statusOptions" :key="statusOption.value || 'all'" :value="statusOption.value">
                                        <span>{{ statusOption.label }}</span>
                                        <Check v-if="statusFilter === statusOption.value" class="ml-auto h-4 w-4" />
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="outline" class="w-[220px] justify-between">
                                    <span
                                        >Talep Türü:
                                        {{
                                            typeFilter
                                                ? typeFilter === 'UserArticle'
                                                    ? 'Makale'
                                                    : typeFilter === 'UserProject'
                                                      ? 'Proje'
                                                      : typeFilter === 'UserPrize'
                                                        ? 'Ödül'
                                                        : typeFilter === 'UserPatent'
                                                          ? 'Patent'
                                                          : typeFilter === 'UserPostgraduate'
                                                            ? 'Doktora Mezun'
                                                            : 'Diğer'
                                                : 'Tümü'
                                        }}</span
                                    >
                                    <ChevronDown class="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent class="w-[220px]">
                                <DropdownMenuRadioGroup v-model="typeFilter">
                                    <DropdownMenuRadioItem v-for="typeOption in typeOptions" :key="typeOption.value || 'all'" :value="typeOption.value">
                                        <span>{{ typeOption.label }}</span>
                                        <Check v-if="typeFilter === typeOption.value" class="ml-auto h-4 w-4" />
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div class="flex justify-end items-center gap-2 w-full sm:w-auto">
                        <Input v-model="search" type="text" placeholder="Talep ara..." class="w-60 sm:w-72 md:w-60 lg:w-72" />
                    </div>
                </div>
                <div class="rounded-md relative">
                    <Table>
                        <TableHeader>
                            <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                                <TableHead
                                    v-for="header in headerGroup.headers"
                                    :key="header.id"
                                    :data-pinned="header.column.getIsPinned()"
                                    :class="cn({ 'sticky bg-background/95': header.column.getIsPinned() }, header.column.getIsPinned() === 'left' ? 'left-0' : 'right-0')"
                                >
                                    <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <template v-if="table.getRowModel().rows?.length">
                                <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
                                    <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                        <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                    </TableCell>
                                </TableRow>
                            </template>

                            <TableRow v-else>
                                <TableCell :colspan="columns.length" class="h-24 text-center"> Destek talebi bulunamadı. </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
                        <Loader />
                    </div>
                </div>
                <div v-if="table.getRowModel().rows.length" class="flex items-center justify-end space-x-2 py-4">
                    <div class="flex-1 text-sm text-muted-foreground">
                        {{ apiPagination?.totalItems ?? table.getRowCount() }} kayıttan
                        {{
                            apiPagination
                                ? (apiPagination.currentPage - 1) * apiPagination.itemsPerPage + 1 + '-' + Math.min(apiPagination.currentPage * apiPagination.itemsPerPage, apiPagination.totalItems)
                                : (pagination.pageIndex - 1) * 10 + 1 + '-' + ((pagination.pageIndex - 1) * 10 + table.getFilteredRowModel().rows.length)
                        }}
                        arasındakiler gösteriliyor.
                    </div>
                    <div class="space-x-2">
                        <Button variant="outline" size="sm" :disabled="!getCanPreviousPage" @click="table.previousPage()"> Geri </Button>
                        <Button variant="outline" size="sm" :disabled="!getCanNextPage" @click="table.nextPage()"> İleri </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
