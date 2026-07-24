<script setup lang="ts">
import type { CompanyRecord, CompanyListResponse } from '@/types'
import { createColumnHelper } from '@tanstack/vue-table'
import { View, CirclePlus } from 'lucide-vue-next'
import { h, resolveComponent } from 'vue'

const NuxtLink = resolveComponent('NuxtLink')

let searchTimer: ReturnType<typeof setTimeout> | null = null
const currentPage = ref(1)
const search = ref('')
const debouncedSearch = ref('')
const filterableColumns = ref([])

const columnHelper = createColumnHelper<CompanyRecord>()
const columns = [
    columnHelper.accessor('name', {
        header: () => h('div', { class: 'p-2 min-w-64' }, 'Firma Adı'),
        cell: ({ row }) => h('div', { class: 'text-wrap leading-relaxed p-2 min-w-64' }, row.getValue('name'))
    }),
    columnHelper.accessor('taxNumber', {
        header: () => h('div', { class: 'p-2' }, 'Vergi No'),
        cell: ({ row }) => h('div', { class: 'p-2' }, row.original.taxNumber || '-')
    }),
    columnHelper.accessor('phone', {
        header: () => h('div', { class: 'p-2 text-right' }, 'Telefon'),
        cell: ({ row }) => h('div', { class: 'p-2 text-right' }, row.original.phone || '-')
    }),
    columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    to: `/dashboard/companies/${row.original.id}`,
                    class: 'inline-flex items-center justify-end p-4 rounded-md hover:bg-gray-100 transition-colors w-full pr-8'
                },
                () => [h(View, { size: 16 })]
            )
        }
    })
]

const getCompanies = async () => {
    // idas-api admin listesi: GET /companies -> { rows, pagination }
    return await useRequest<CompanyListResponse>('/companies', {
        method: 'GET',
        query: {
            page: currentPage.value,
            limit: 10,
            search: debouncedSearch.value.length >= 3 ? debouncedSearch.value : undefined
        }
    })
}

const { data: companies } = await useAsyncData('companies', getCompanies, {
    watch: [currentPage, debouncedSearch]
})

const tablePagination = computed(() => {
    const pagination = companies.value?.pagination
    if (!pagination) return undefined
    return {
        totalItems: pagination.total,
        totalPages: pagination.totalPages,
        currentPage: pagination.page,
        itemsPerPage: pagination.limit,
        hasPrevPage: pagination.page > 1,
        hasNextPage: pagination.page < pagination.totalPages
    }
})

watch(search, (value) => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        debouncedSearch.value = value
        currentPage.value = 1
    }, 300)
})
</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
        <Card>
            <CardHeader>
                <div class="flex flex-row justify-between items-center gap-4 flex-wrap">
                    <CardTitle>Firmalar</CardTitle>
                    <div class="flex items-center gap-2">
                        <Input v-model="search" type="text" placeholder="Firma ara..." class="max-w-xs" />
                        <TooltipProvider :delay-duration="0">
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <Button size="icon" variant="secondary" class="opacity-60 hover:opacity-100 rounded-full" @click="navigateTo('/dashboard/companies/create')">
                                        <CirclePlus class="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Firma Ekle</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div class="overflow-x-auto">
                    <DataTable v-model:page="currentPage" v-model:search="search" :data="companies?.rows || []" :columns="columns" :api-pagination="tablePagination" :filterable-columns="filterableColumns" class="min-w-[600px] h-full" />
                </div>
            </CardContent>
        </Card>
    </div>
</template>
