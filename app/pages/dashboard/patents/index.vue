<script setup lang="ts">
import type { Patent, IApiResponse } from '@/types'
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

const columnHelper = createColumnHelper<Patent>()
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
    const response = await useRequest<IApiResponse<Patent>>('/manager/patents', {
        method: 'GET',
        query: {
            page: currentPage.value,
            search: debouncedSearch.value.length >= 3 ? debouncedSearch.value : undefined,
            select: 'id,title,type,year'
        }
    })
    return response
}

const { data: patents } = await useAsyncData('patents', getPatents, {
    watch: [currentPage, debouncedSearch]
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
                  <DataTable v-model:page="currentPage" v-model:search="search" :data="patents?.rows || []" :columns="columns" :api-pagination="patents?.pagination" :filterable-columns="filterableColumns" class="min-w-[600px] h-full" />
              </div>
          </CardContent>
      </Card>
  </div>
</template>