<script setup lang="ts">
import type { ProjectListRow, ProjectListResponse } from '@/types'
import { createColumnHelper } from '@tanstack/vue-table'
import { View, CirclePlus } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { h, resolveComponent } from 'vue'
import DataTable from '@/components/DataTable.vue'

const NuxtLink = resolveComponent('NuxtLink')

let searchTimer: ReturnType<typeof setTimeout> | null = null
const currentPage = ref(1)
const search = ref('')
const debouncedSearch = ref('')
const columnHelper = createColumnHelper<ProjectListRow>()
const columns = [
    columnHelper.accessor('title', {
        header: () => h('div', { class: 'p-2 min-w-64' }, 'Proje Başlığı'),
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
    columnHelper.accessor('projectType', {
        header: () => h('div', { class: 'p-2 text-right max-w-96' }, 'Proje Türü'),
        cell: ({ row }) =>
            h(
                'div',
                {
                    class: 'text-wrap leading-relaxed p-2 text-right max-w-96',
                    style: 'overflow-wrap: break-word; word-break: break-word;'
                },
                row.original.projectTypeName || '-'
            )
    }),
    columnHelper.accessor('startDate', {
        header: () => h('div', { class: 'p-2 text-right min-w-32' }, 'Başlangıç Tarihi'),
        cell: ({ row }) => {
            const value = row.getValue('startDate') as string | Date
            if (!value) return h('div', { class: 'p-2 text-right min-w-32' }, '-')
            return h('div', { class: 'p-2 text-right min-w-32' }, new Date(value).toLocaleDateString('tr-TR'))
        }
    }),
    columnHelper.accessor('endDate', {
        header: () => h('div', { class: 'p-2 text-right min-w-32' }, 'Bitiş Tarihi'),
        cell: ({ row }) => {
            const value = row.getValue('endDate') as string | Date
            if (!value) return h('div', { class: 'p-2 text-right min-w-32' }, '-')
            return h('div', { class: 'p-2 text-right min-w-32' }, new Date(value).toLocaleDateString('tr-TR'))
        }
    }),
    columnHelper.accessor('year', {
        header: () => h('div', { class: 'p-2 text-right' }, 'Yıl'),
        cell: ({ row }) => h('div', { class: 'p-2 text-right' }, row.getValue('year')?.toString() || '-')
    }),
    columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    to: `/dashboard/projects/${row.original.id}`,
                    class: 'inline-flex items-center justify-end p-4 rounded-md hover:bg-gray-100 transition-colors w-full pr-8'
                },
                () => [h(View, { size: 16 })]
            )
        }
    })
]

const getProjects = async () => {
    // idas-api admin listesi: GET /projects -> { rows, pagination }
    return await useRequest<ProjectListResponse>('/projects', {
        method: 'GET',
        query: {
            page: currentPage.value,
            limit: 10,
            search: debouncedSearch.value.length >= 3 ? debouncedSearch.value : undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        }
    })
}

const { data: projects } = await useAsyncData('projects', getProjects, {
    watch: [currentPage, debouncedSearch]
})

// idas-api pagination'ını DataTable'ın beklediği (totalItems/hasPrevPage/hasNextPage) yapıya çevir
const tablePagination = computed(() => {
    const pagination = projects.value?.pagination
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
    if (searchTimer) {
        clearTimeout(searchTimer)
    }
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
                    <CardTitle>Projeler</CardTitle>
                    <div class="flex items-center gap-2">
                        <Input v-model="search" type="text" placeholder="Proje ara..." class="max-w-xs" />
                        <TooltipProvider :delay-duration="0">
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <Button size="icon" variant="secondary" class="opacity-60 hover:opacity-600 rounded-full" @click="navigateTo('/dashboard/projects/create')">
                                        <CirclePlus class="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent> Proje Ekle </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div class="overflow-x-auto">
                    <DataTable v-model:page="currentPage" v-model:search="search" :data="projects?.rows || []" :columns="columns" :api-pagination="tablePagination" class="min-w-[800px] h-full" />
                </div>
            </CardContent>
        </Card>
    </div>
</template>
