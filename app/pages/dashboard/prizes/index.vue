<script setup lang="ts">
import type { Prize, IApiResponse } from '@/types'
import { createColumnHelper } from '@tanstack/vue-table'
import { View, CirclePlus } from 'lucide-vue-next'
import { h, resolveComponent } from 'vue'

const NuxtLink = resolveComponent('NuxtLink')

let searchTimer: ReturnType<typeof setTimeout> | null = null
const currentPage = ref(1)
const search = ref('')
const debouncedSearch = ref('')
const filterableColumns = ref([])

const columnHelper = createColumnHelper<Prize>()
const columns = [
    columnHelper.accessor('title', {
        header: () => h('div', { class: 'p-2 min-w-64' }, 'Ödül Başlığı'),
        cell: ({ row }) =>
            h('div', { class: 'text-wrap leading-relaxed p-2 min-w-64', style: 'overflow-wrap: break-word; word-break: break-word;' }, row.getValue('title'))
    }),
    columnHelper.accessor('year', {
        header: () => h('div', { class: 'p-2' }, 'Yıl'),
        cell: ({ row }) =>
            h('div', { class: 'text-wrap leading-relaxed p-2 min-w-20', style: 'overflow-wrap: break-word; word-break: break-word;' }, row.original.year?.toString() || '-')
    }),
    columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    to: `/dashboard/prizes/detail/${row.original.id}`,
                    class: 'inline-flex items-center justify-end p-4 rounded-md hover:bg-gray-100 transition-colors w-full pr-8'
                },
                () => [h(View, { size: 16 })]
            )
        }
    })
]

const getPrizes = async () => {
    const response = await useRequest<IApiResponse<Prize>>('/manager/prizes', {
        method: 'GET',
        query: {
            page: currentPage.value,
            search: debouncedSearch.value.length >= 3 ? debouncedSearch.value : undefined,
            select: 'id,title,year'
        }
    })
    return response
}

const { data: prizes } = await useAsyncData('prizes', getPrizes, {
    watch: [currentPage, debouncedSearch]
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
                    <CardTitle>Ödüller</CardTitle>
                    <div class="flex items-center gap-2">
                        <Input v-model="search" type="text" placeholder="Ödül ara..." class="max-w-xs" />
                        <TooltipProvider :delay-duration="0">
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <Button size="icon" variant="secondary" class="opacity-60 hover:opacity-100 rounded-full" @click="navigateTo('/dashboard/prizes/create')">
                                        <CirclePlus class="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ödül Ekle</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div class="overflow-x-auto">
                    <DataTable v-model:page="currentPage" v-model:search="search" :data="prizes?.rows || []" :columns="columns" :api-pagination="prizes?.pagination" :filterable-columns="filterableColumns" class="min-w-[600px] h-full"/>
                </div>
            </CardContent>
        </Card>
    </div>
</template>