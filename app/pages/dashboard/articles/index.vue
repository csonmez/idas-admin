<script setup lang="ts">
import type { ArticleListResponse, ArticleListRow } from '@/types'
import { createColumnHelper } from '@tanstack/vue-table'
import { View, CirclePlus } from 'lucide-vue-next'
import { h, resolveComponent } from 'vue'
import DataTable from '@/components/DataTable.vue'

const NuxtLink = resolveComponent('NuxtLink')

const currentPage = ref(1)

const filterableColumns = ref([
    {
        id: 'qValue',
        title: 'Q Değerleri',
        options: [
            { label: 'Q1', value: 'Q1' },
            { label: 'Q2', value: 'Q2' },
            { label: 'Q3', value: 'Q3' },
            { label: 'Q4', value: 'Q4' }
        ]
    }
])
const search = ref('')
const columnHelper = createColumnHelper<ArticleListRow>()
const columns = [
    columnHelper.accessor('title', {
        header: () => h('div', { class: 'p-2 min-w-64' }, 'Makale İsmi'),
        cell: ({ row }) =>
            h(
                'div',
                {
                    class: 'text-wrap leading-relaxed p-2 min-w-64',
                    style: 'overflow-wrap: break-word; word-break: break-word;'
                },
                row.getValue('title')
            )
    }),
    columnHelper.accessor('journalName', {
        header: () => h('div', { class: 'p-2 min-w-64' }, 'Dergi'),
        cell: ({ row }) =>
            h(
                'div',
                {
                    class: 'text-wrap leading-relaxed p-2 min-w-64',
                    style: 'overflow-wrap: break-word; word-break: break-word;'
                },
                row.original.journalName || '-'
            )
    }),
    columnHelper.accessor('publicationYear', {
        header: () => h('div', { class: 'p-2' }, 'Yıl'),
        cell: ({ row }) =>
            h(
                'div',
                {
                    class: 'text-wrap leading-relaxed p-2 min-w-20',
                    style: 'overflow-wrap: break-word; word-break: break-word;'
                },
                row.original.publicationYear || '-'
            )
    }),
    columnHelper.accessor('qValue', {
        header: () => h('div', { class: 'p-2 text-right' }, 'Q Değeri'),
        cell: ({ row }) => h('div', { class: 'p-2 text-right' }, row.original.qValue || '-')
    }),
    columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    to: `/dashboard/articles/${row.original.id}`,
                    class: 'inline-flex items-center justify-end p-4 rounded-md hover:bg-gray-100 transition-colors w-full pr-8'
                },
                () => [h(View, { size: 16 })]
            )
        }
    })
]
const getArticles = async () => {
    // idas-api admin listesi: GET /articles -> { rows, pagination }
    return await useRequest<ArticleListResponse>('/articles', {
        method: 'GET',
        query: {
            page: currentPage.value,
            limit: 10,
            search: search.value.length >= 3 ? search.value : undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        }
    })
}

const { data: articles } = await useAsyncData('articles', getArticles, {
    watch: [currentPage, search]
})

// idas-api pagination'ını DataTable'ın beklediği (totalItems/hasPrevPage/hasNextPage) yapıya çevir
const tablePagination = computed(() => {
    const pagination = articles.value?.pagination
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

watch(search, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        currentPage.value = 1
    }
})
</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
        <Card>
            <CardHeader>
                <div class="flex flex-row justify-between items-center gap-4 flex-wrap">
                    <CardTitle>Makaleler</CardTitle>
                    <div class="flex items-center gap-2">
                        <Input v-model="search" type="text" placeholder="Makale ara..." class="max-w-xs" />
                        <TooltipProvider :delay-duration="0">
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <Button size="icon" variant="secondary" class="opacity-60 hover:opacity-600 rounded-full" @click="navigateTo('/dashboard/articles/create')">
                                        <CirclePlus class="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent> Makale Ekle </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div class="overflow-x-auto">
                    <DataTable
                        v-model:page="currentPage"
                        v-model:search="search"
                        :data="articles?.rows || []"
                        :columns="columns"
                        :api-pagination="tablePagination"
                        :filterable-columns="filterableColumns"
                        class="min-w-[800px] h-full"
                    />
                </div>
            </CardContent>
        </Card>
    </div>
</template>
