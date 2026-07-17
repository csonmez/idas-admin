<script setup lang="ts">
import type { Faculty, IApiResponse } from '@/types'
import { createColumnHelper } from '@tanstack/vue-table'
import { View } from 'lucide-vue-next'
import { resolveComponent, h, ref, watch } from 'vue'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DataTable from '~/components/DataTable.vue'
const NuxtLink = resolveComponent('NuxtLink')

const currentPage = ref(1)
const search = ref('')
const filterableColumns = ref([])

const columnHelper = createColumnHelper<Faculty>()
const columns = [
    columnHelper.accessor('name', {
        header: () => h('div', { class: 'p-2' }, 'Fakülte Adı'),
        cell: ({ row }) =>
            h(
                'div',
                {
                    class: 'text-wrap leading-relaxed p-2',
                    style: 'overflow-wrap: break-word; word-break: break-word;'
                },
                row.getValue('name')
            )
    }),
    columnHelper.display({
        id: 'dean',
        header: () => h('div', { class: 'p-1 text-left' }, 'Dekan'),
        cell: ({ row }) => h('div', { class: 'p-1 text-left' }, formatUserName(row.original.dean))
    }),
    columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    to: `/dashboard/faculties/${row.original.id}`,
                    class: 'inline-flex items-center justify-end p-4 rounded-md hover:bg-gray-100 transition-colors w-full pr-8'
                },
                () => [h(View, { size: 16 })]
            )
        }
    })
]

const getFaculties = async () => {
    const response = await useRequest<IApiResponse<Faculty>>('/manager/faculties', {
        method: 'GET',
        query: {
            page: currentPage.value,
            search: search.value.length >= 3 ? search.value : undefined,
            type: 'FACULTY',
            select: 'id,name,userAcademicUnits',
            userAcademicUnitsSelect: 'user',
            userSelect: 'id,name,surname',
            sortBy: 'name',
            sortOrder: 'asc'
        }
    })

    return response
}

const { data: faculties } = await useAsyncData('faculties', getFaculties, {
    watch: [currentPage, search]
})

// Arama yapıldığında sayfa 1'e dön
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
                <CardTitle>Fakülteler</CardTitle>
            </CardHeader>
            <CardContent>
                <div class="overflow-x-auto">
                    <DataTable
                        v-model:page="currentPage"
                        v-model:search="search"
                        :data="faculties?.rows || []"
                        :columns="columns"
                        :api-pagination="faculties?.pagination"
                        :filterable-columns="filterableColumns"
                        title="Fakülteler"
                        description="Erciyes Üniversitesi fakültelerinin listesi"
                        class="min-w-[600px] h-full"
                    />
                </div>
            </CardContent>
        </Card>
    </div>
</template>
