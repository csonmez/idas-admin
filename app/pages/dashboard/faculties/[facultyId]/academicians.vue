<script setup lang="ts">
import type { User, IApiResponse } from '@/types'
import { createColumnHelper } from '@tanstack/vue-table'
import { View } from 'lucide-vue-next'
import { h } from 'vue'

const NuxtLink = resolveComponent('NuxtLink')

const route = useRoute()
const facultyId = route.params.facultyId as string
const currentPage = ref(1)
const search = ref('')

const columnHelper = createColumnHelper<User>()
const titleMap: Record<NonNullable<User['title']>, string> = {
    PROF: 'Prof. Dr.',
    ASSOC_PROF: 'Doç. Dr.',
    ASSIST_PROF: 'Dr. Öğr. Üyesi',
    RESEARCH_ASSIST: 'Arş. Gör.',
    LECTURER: 'Öğr. Gör.',
    DOCTOR: 'Dr.'
}

const columns = [
    columnHelper.accessor((row) => `${row.name} ${row.surname}`, {
        id: 'name',
        header: () => h('div', { class: 'p-2' }, 'İsim Soyisim'),
        cell: ({ row }) => h('div', { 
            class: 'p-2 min-w-[200px]',
            style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
        }, [
            h('span', { class: 'font-medium' }, `${row.original.name} ${row.original.surname}`), 
            h('span', { class: 'text-sm text-muted-foreground' }, row.original.email)
        ])
    }),
    columnHelper.accessor((row) => row.userAcademicUnits?.[0]?.department?.name, {
        id: 'department',
        header: () => h('div', { class: 'p-2 min-w-[350px]' }, 'Bölüm'),
        cell: ({ row }) => h('div', { 
            class: 'p-2 min-w-[350px]',
            style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
        }, row.original.userAcademicUnits?.[0]?.department?.name || '-')
    }),
    columnHelper.accessor((row) => row.userAcademicUnits?.[0]?.discipline?.name, {
        id: 'discipline',
        header: () => h('div', { class: 'p-2 min-w-[350px]' }, 'Ana Bilim Dalı'),
        cell: ({ row }) => h('div', { 
            class: 'p-2 min-w-[350px]',
            style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
        }, row.original.userAcademicUnits?.[0]?.discipline?.name || '-')
    }),
    columnHelper.display({
        id: 'actions',
        header: () => h('div', { class: 'p-2 text-right min-w-[80px]' }, 'İşlemler'),
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    to: `/dashboard/academicians/${row.original.id}`,
                    class: 'inline-flex items-center justify-end p-4 rounded-md hover:bg-gray-100 transition-colors w-full pr-8'
                },
                () => [h(View, { size: 16 })]
            )
        }
    })
]

const getAcademicians = async () => {
    const response = await useRequest<IApiResponse<User>>('/manager/users', {
        method: 'GET',
        query: {
            attributes: 'id name surname title email updatedAt',
            useUserAcademicUnits: true,
            page: currentPage.value,
            search: search.value.length >= 3 ? search.value : undefined,
            facultyId
        }
    })
    return response
}

const { data: academicians } = await useAsyncData('faculty-academicians', getAcademicians, {
    watch: [currentPage, search] 
})

</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
        <Card>
            <CardHeader>
                <CardTitle>Akademisyenler</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable 
                    v-model:page="currentPage" 
                    v-model:search="search" 
                    :data="academicians?.rows || []" 
                    :columns="columns" 
                    :api-pagination="academicians?.pagination" 
                    class="min-w-[1500px] h-full overflow-x-auto w-full"
                />
            </CardContent>
        </Card>
    </div>
</template>
