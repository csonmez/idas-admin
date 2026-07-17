<script setup lang="ts">
import { View } from 'lucide-vue-next'
import { createColumnHelper } from '@tanstack/vue-table'
import type { User, UserAcademicUnit, IApiResponse } from '~/types'

const NuxtLink = resolveComponent('NuxtLink')

interface Props {
    facultyId: string
}

const props = defineProps<Props>()

const currentPage = ref(1)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')

// Debounce için timer ref'i
let searchTimer: NodeJS.Timeout | null = null

// Search handler fonksiyonu
const handleSearch = (value: string) => {
    searchQuery.value = value

    // Önceki timer'ı temizle
    if (searchTimer) {
        clearTimeout(searchTimer)
    }

    // En az 3 karakter varsa veya boşsa arama yap
    if (value.length >= 3 || value.length === 0) {
        searchTimer = setTimeout(() => {
            debouncedSearchQuery.value = value
            currentPage.value = 1 // Arama yapıldığında ilk sayfaya dön
        }, 500) // 500ms debounce süresi
    }
}

const columnHelper = createColumnHelper<User>()

// Ünvan haritası
const titleMap: Record<NonNullable<User['title']>, string> = {
    PROF: 'Prof. Dr.',
    ASSOC_PROF: 'Doç. Dr.',
    ASSIST_PROF: 'Dr. Öğr. Üyesi',
    RESEARCH_ASSIST: 'Arş. Gör.',
    LECTURER: 'Öğr. Gör.',
    DOCTOR: 'Dr.'
}

// Tablo kolonları
const columns = [
    columnHelper.accessor((row) => `${row.name} ${row.surname}`, {
        id: 'academician',
        header: () => h('div', { class: 'p-2 min-w-[250px]' }, 'Akademisyen'),
        cell: ({ row }) => {
            const title = row.original.title
            return h('div', { class: 'flex flex-col p-2 min-w-[250px]' }, [
                h('span', { class: 'font-medium text-gray-900 dark:text-gray-100' }, `${title ? titleMap[title] : 'Belirtilmemiş'} ${row.original.name} ${row.original.surname}`),
                h('span', { class: 'text-sm text-gray-500 dark:text-gray-400' }, row.original.email)
            ])
        }
    }),
    columnHelper.accessor((row) => row.userAcademicUnits, {
        id: 'department',
        header: () => h('div', { class: 'p-2 min-w-[300px]' }, 'Bölüm'),
        cell: ({ row }) => {
            const department = row.original.userAcademicUnits?.find((u: UserAcademicUnit) => u.faculty?.id === props.facultyId)?.department?.name

            return h('div', { class: 'text-sm text-gray-700 dark:text-gray-300 p-2 min-w-[300px]' }, department ? department : '-')
        }
    }),
    columnHelper.accessor((row) => row.userAcademicUnits, {
        id: 'discipline',
        header: () => h('div', { class: 'p-2 min-w-[300px]' }, 'Ana Bilim Dalı'),
        cell: ({ row }) => {
            const discipline = row.original.userAcademicUnits?.find((u: UserAcademicUnit) => u.faculty?.id === props.facultyId)?.discipline?.name

            return h('div', { class: 'text-sm text-gray-700 dark:text-gray-300 p-2 min-w-[300px]' }, discipline ? discipline : '-')
        }
    }),
    columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    to: `/dashboard/academicians/${row.original.id}`,
                    class: 'inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                },
                () => h(View, { size: 16, class: 'text-gray-600 dark:text-gray-400' })
            )
        }
    })
]

const getFacultyMembers = async () => {
    const query: Record<string, string | number | boolean> = {
        select: 'id,name,surname,title,email,updatedAt,userAcademicUnits',
        useUserAcademicUnits: true,
        facultyId: props.facultyId,
        page: currentPage.value,
        sortBy: 'title',
        sortOrder: 'asc'
    }

    // Search parametresini ekle (en az 3 karakter varsa)
    if (debouncedSearchQuery.value && debouncedSearchQuery.value.length >= 3) {
        query.search = debouncedSearchQuery.value
    }

    const response = await useRequest<IApiResponse<User>>('/manager/users', {
        method: 'GET',
        query
    })
    return response
}

const { data: facultyMembers } = await useAsyncData(`faculty-members-${props.facultyId}`, getFacultyMembers, {
    watch: [currentPage, debouncedSearchQuery]
})
</script>

<template>
    <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-6">
            <!-- Header with Search -->
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Fakülte Akademisyenleri</h2>

                <!-- Search Input -->
                <div class="relative">
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Ara... (min. 3 karakter)"
                        class="w-64 px-3 py-1.5 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        @input="handleSearch(($event.target as HTMLInputElement).value)"
                    />
                    <svg class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
                <DataTable v-model:page="currentPage" :data="facultyMembers?.rows || []" :columns="columns" :api-pagination="facultyMembers?.pagination" class="min-w-[1000px] h-full" />
            </div>
        </div>
    </div>
</template>
