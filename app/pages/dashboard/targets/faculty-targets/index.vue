<script setup lang="ts">
import type { Faculty, FacultyTarget } from '@/types'
import { createColumnHelper } from '@tanstack/vue-table'
import { h, ref, computed, resolveComponent } from 'vue'
import { Eye } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DataTable from '~/components/DataTable.vue'
import { Badge } from '@/components/ui/badge'

interface FacultyWithTargetStatus {
    faculty: Faculty
    target2026: FacultyTarget | null
}

const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return 'outline'
    switch (status) {
        case 'COMPLETED':
            return 'default'
        case 'IN_PROGRESS':
            return 'secondary'
        case 'PENDING':
            return 'outline'
        case 'REJECTED':
        case 'CANCELLED':
            return 'destructive'
        default:
            return 'outline'
    }
}

const getStatusLabel = (status: string | null) => {
    if (!status) return 'Hedef Girilmedi'
    const labels: Record<string, string> = {
        COMPLETED: 'Tamamlandı',
        IN_PROGRESS: 'Devam Ediyor',
        PENDING: 'Devam Ediyor',
        REJECTED: 'Reddedildi',
        CANCELLED: 'İptal'
    }
    return labels[status] ?? status
}

const NuxtLink = resolveComponent('NuxtLink')
const currentPage = ref(1)
const search = ref('')
const filterableColumns = ref([])

const { data, pending } = await useAsyncData('faculty-targets-page', async () => {
    const [facultiesData, facultyTargetsData] = await Promise.all([
        useRequest<Faculty[]>('/manager/faculties', {
            method: 'GET',
            query: {
                onlyData: true,
                type: 'FACULTY',
                select: 'id,name,userAcademicUnits',
                userAcademicUnitsSelect: 'user',
                userSelect: 'id,name,surname',
                sortBy: 'name',
                sortOrder: 'asc'
            }
        }),
        useRequest<FacultyTarget[]>('/manager/faculty-targets', {
            method: 'GET',
            query: {
                year: 2026,
                onlyData: true
            }
        })
    ])

    return { faculties: facultiesData, facultyTargets: facultyTargetsData }
})

const tableData = computed<FacultyWithTargetStatus[]>(() => {
    const faculties = [...(data.value?.faculties ?? [])].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'tr'))
    const facultyTargets = data.value?.facultyTargets ?? []

    return faculties.map((faculty: Faculty) => {
        const target2026 = facultyTargets.find((ft) => ft.facultyId === faculty.id) ?? null
        return { faculty, target2026 }
    })
})

const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * 10
    return tableData.value.slice(start, start + 10)
})

const apiPagination = computed(() => {
    const total = tableData.value.length
    const totalPages = Math.ceil(total / 10) || 1
    return {
        currentPage: currentPage.value,
        hasPrevPage: currentPage.value > 1,
        hasNextPage: currentPage.value < totalPages,
        itemsPerPage: 10,
        totalItems: total,
        totalPages
    }
})

const stats = computed(() => {
    const rows = tableData.value
    return {
        total: rows.length,
        completed: rows.filter((r) => r.target2026?.status === 'COMPLETED').length,
        inProgress: rows.filter((r) => r.target2026?.status === 'IN_PROGRESS' || r.target2026?.status === 'PENDING').length,
        noTarget: rows.filter((r) => !r.target2026?.status).length
    }
})

const statCards = computed(() => {
    const s = stats.value
    return [
        { key: 'total', count: s.total, label: 'Toplam Fakülte', cardClass: 'bg-card', colorClass: '' },
        {
            key: 'completed',
            count: s.completed,
            label: 'Tamamlandı',
            cardClass: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
            colorClass: 'text-green-600 dark:text-green-400'
        },
        {
            key: 'inProgress',
            count: s.inProgress,
            label: 'Devam Ediyor',
            cardClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900',
            colorClass: 'text-amber-600 dark:text-amber-400'
        },
        { key: 'noTarget', count: s.noTarget, label: 'Hedef Girilmedi', cardClass: 'bg-muted/30', colorClass: 'text-muted-foreground' }
    ]
})

const columnHelper = createColumnHelper<FacultyWithTargetStatus>()
const columns = [
    columnHelper.accessor((row) => row.faculty.name, {
        id: 'name',
        header: () => h('div', { class: 'p-2' }, 'Fakülte Adı'),
        cell: ({ row }) =>
            h(
                'div',
                {
                    class: 'text-wrap leading-relaxed p-2',
                    style: 'overflow-wrap: break-word; word-break: break-word;'
                },
                row.original.faculty.name
            )
    }),
    columnHelper.display({
        id: 'dean',
        header: () => h('div', { class: 'p-2 text-left' }, 'Dekan'),
        cell: ({ row }) => {
            const faculty = row.original.faculty as {
                dean?: { name?: string; surname?: string }
                userAcademicUnits?: Array<{ user?: { name?: string; surname?: string } }>
                academicUnits?: Array<{ user?: { name?: string; surname?: string } }>
            }
            const dean = faculty.dean ?? faculty.userAcademicUnits?.[0]?.user ?? faculty.academicUnits?.[0]?.user
            const deanName = formatUserName((dean ?? null) as Parameters<typeof formatUserName>[0]) || 'Belirtilmemiş'
            return h(
                'div',
                {
                    class: 'text-wrap leading-relaxed p-2 text-left',
                    style: 'overflow-wrap: break-word; word-break: break-word;'
                },
                deanName
            )
        }
    }),
    columnHelper.display({
        id: 'targetStatus',
        header: () => h('div', { class: 'p-2 text-left' }, '2026 Hedef Durumu'),
        cell: ({ row }) => {
            const status = row.original.target2026?.status ?? null
            const label = getStatusLabel(status)
            const variant = getStatusBadgeVariant(status) as 'default' | 'secondary' | 'destructive' | 'outline'
            return h(
                Badge,
                {
                    variant,
                    class:
                        status === 'COMPLETED' ? 'bg-green-600 hover:bg-green-600 text-white' : status === 'IN_PROGRESS' || status === 'PENDING' ? 'bg-yellow-400 hover:bg-yellow-400 text-black' : ''
                },
                () => label
            )
        }
    }),
    columnHelper.display({
        id: 'actions',
        header: () => h('div', { class: 'p-2 text-center' }, 'İşlem'),
        cell: ({ row }) => {
            const id = row.original.faculty.id
            return h(
                NuxtLink,
                {
                    to: `/dashboard/targets/faculty-targets/${id}`,
                    class: 'inline-flex items-center justify-center rounded-md text-primary hover:bg-accent hover:text-accent-foreground h-8 w-8 shrink-0',
                    title: 'Detay'
                },
                () => h(Eye, { class: 'h-4 w-4' })
            )
        }
    })
]
</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
        <div v-if="!pending" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="card in statCards" :key="card.key" class="rounded-lg border p-4 shadow-sm" :class="card.cardClass">
                <div class="text-2xl font-bold" :class="card.colorClass">{{ card.count }}</div>
                <div class="text-sm text-muted-foreground">{{ card.label }}</div>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Fakülte 2026 Hedef Durumları</CardTitle>
                <p class="text-sm text-muted-foreground mt-1">Fakültelerin 2026 yılı Ar-Ge hedef giriş durumları</p>
            </CardHeader>
            <CardContent>
                <div v-if="pending" class="flex items-center justify-center min-h-[300px]">
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span class="text-muted-foreground">Veriler yükleniyor...</span>
                    </div>
                </div>
                <div v-else class="overflow-x-auto">
                    <DataTable
                        v-model:page="currentPage"
                        v-model:search="search"
                        :data="paginatedData"
                        :columns="columns"
                        :api-pagination="apiPagination"
                        :filterable-columns="filterableColumns"
                        :loading="pending"
                        class="min-w-[600px] h-full"
                    />
                </div>
            </CardContent>
        </Card>
    </div>
</template>
