<script setup lang="ts">
import type { PatentListRow, PatentListResponse } from '@/types'
import { createColumnHelper } from '@tanstack/vue-table'
import { View,CirclePlus } from 'lucide-vue-next'
const NuxtLink = resolveComponent('NuxtLink')

let searchTimer: ReturnType<typeof setTimeout> | null = null
const currentPage = ref(1)
const search = ref('')
const debouncedSearch = ref('')
const filterableColumns = ref([
  {
    id: 'type',
        title: 'Patent Türü',
    options: [
            { label: 'Ulusal', value: 'NATIONAL' },
            { label: 'Uluslararası', value: 'INTERNATIONAL' }
        ]
    }
])

const pageSize = 10
const columnHelper = createColumnHelper<PatentListRow>()
const columns = [
    columnHelper.accessor('title', {
        header: 'Patent Başlığı',
        cell: ({ row }) => h('div', { class: 'text-wrap w-80' }, row.getValue('title'))
    }),
    columnHelper.accessor('type', {
        header: () => h('div', { class: 'w-[300px] flex justify-end items-center pr-8' }, 'Patent Türü'),
        cell: ({ row }) => h('div', { class: 'w-[300px] flex justify-end items-center pr-8' }, row.getValue('type') === 'INTERNATIONAL' ? 'Uluslararası' : 'Ulusal')
    }),
    columnHelper.accessor('year', {
        header: () => h('div', { class: 'w-[200px] flex justify-end items-center pr-0' }, 'Yıl'),
        cell: ({ row }) => h('div', { class: 'w-[200px] flex justify-end items-center pr-0' }, row.getValue('year')?.toString() || '-')
    }),
    columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    to: `/dashboard/patents/detail/${row.original.id}`,
                    class: 'inline-flex items-center justify-end p-4 rounded-md hover:bg-gray-100 transition-colors w-full pr-8'
                },
                () => [h(View, { size: 16 })]
            )
        }
    })
]

const getPatents = async () => {
    // idas-api admin listesi: GET /patents/admin -> { data, total }, sayfalama limit/offset
    return await useRequest<PatentListResponse>('/patents/admin', {
        method: 'GET',
        query: {
            limit: pageSize,
            offset: (currentPage.value - 1) * pageSize,
            search: debouncedSearch.value.length >= 3 ? debouncedSearch.value : undefined
        }
    })
}

const { data: patents } = await useAsyncData('patents', getPatents, {
    watch: [currentPage, debouncedSearch]
})

// idas-api {data,total} -> DataTable'ın beklediği pagination yapısına çevir
const tablePagination = computed(() => {
    const total = patents.value?.total
    if (total === undefined || total === null) return undefined
    const totalPages = Math.ceil(total / pageSize) || 1
    return {
        totalItems: total,
        totalPages,
        currentPage: currentPage.value,
        itemsPerPage: pageSize,
        hasPrevPage: currentPage.value > 1,
        hasNextPage: currentPage.value < totalPages
    }
})

// Arama yapıldığında debounce uygula ve sayfa 1'e dön
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
                  <CardTitle>Patentler</CardTitle>
                  <div class="flex items-center gap-2">
                      <Input v-model="search" type="text" placeholder="Patent ara..." class="max-w-xs" />
                      <TooltipProvider :delay-duration="0">
                          <Tooltip>
                              <TooltipTrigger as-child>
                                  <Button size="icon" variant="secondary" class="opacity-60 hover:opacity-600 rounded-full" @click="navigateTo('/dashboard/patents/create')">
                                      <CirclePlus class="h-3.5 w-3.5" />
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent> Patent Ekle </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              <div class="overflow-x-auto">
                  <DataTable v-model:page="currentPage" v-model:search="search" :data="patents?.data || []" :columns="columns" :api-pagination="tablePagination" :filterable-columns="filterableColumns" class="min-w-[600px] h-full" />
              </div>
          </CardContent>
      </Card>
  </div>
</template>