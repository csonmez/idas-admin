<script setup lang="ts">
import type { Department, DepartmentTarget } from '@/types'
import { createColumnHelper } from '@tanstack/vue-table'
import { h, ref, computed, watch, resolveComponent } from 'vue'
import { Eye } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DataTable from '~/components/DataTable.vue'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import formatUserName from '@/utils/formatUserName'

const NuxtLink = resolveComponent('NuxtLink')

interface DepartmentWithFaculty extends Department {
    faculty?: { id?: string; name?: string }
    head?: string
    headName?: string
    departmentHead?: { name?: string; surname?: string; title?: string } | string
    userAcademicUnits?: Array<{ user?: { name?: string; surname?: string; title?: string } }>
}

interface DepartmentWithTargetStatus {
    department: DepartmentWithFaculty
    target2026: DepartmentTarget | null
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

const currentPage = ref(1)
const search = ref('')
const facultyFilter = ref<string>('all')
const filterableColumns = ref([])

const normalizeToArray = <T,>(response: unknown): T[] => {
    if (Array.isArray(response)) return response as T[]
    if (response && typeof response === 'object') {
        const r = response as Record<string, unknown>
        if (Array.isArray(r.data)) return r.data as T[]
        if (Array.isArray(r.rows)) return r.rows as T[]
        if (Array.isArray(r.departments)) return r.departments as T[]
        if (Array.isArray(r.result)) return r.result as T[]
    }
    return []
}

const { data, pending } = await useAsyncData('department-targets-page', async () => {
    const [departmentsResponse, departmentTargetsResponse] = await Promise.all([
        useRequest('/manager/departments', {
            method: 'GET',
            query: {
                select: 'id,name,faculty',
                enableDisciplineHeadAccess: false,
                onlyData: true,
                useFaculty: true,
                sortBy: 'name',
                sortOrder: 'asc'
            }
        }),
        useRequest('/manager/department-targets', {
            method: 'GET',
            query: {
                year: 2026,
                onlyData: true
            }
        })
    ])

    const departments = normalizeToArray<DepartmentWithFaculty>(departmentsResponse)
    const departmentTargets = normalizeToArray<DepartmentTarget>(departmentTargetsResponse)

    return { departments, departmentTargets }
})

const tableData = computed<DepartmentWithTargetStatus[]>(() => {
    const departments = data.value?.departments ?? []
    const departmentTargets = data.value?.departmentTargets ?? []

    return [...departments]
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'tr'))
        .map((department) => {
            const target2026 = departmentTargets.find((dt) => dt.departmentId === department.id) ?? null
            return { department, target2026 }
        })
})

const uniqueFaculties = computed(() => {
    const seen = new Set<string>()
    const result: Array<{ id: string; name: string }> = []
    for (const row of tableData.value) {
        const dept = row.department
        const facultyId = dept.faculty?.id
        const facultyName = dept.faculty?.name ?? 'Belirtilmemiş'
        const key = facultyId ?? facultyName
        if (key && !seen.has(key)) {
            seen.add(key)
            result.push({ id: key, name: facultyName })
        }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
})

const filteredTableData = computed<DepartmentWithTargetStatus[]>(() => {
    if (facultyFilter.value === 'all') return tableData.value
    return tableData.value.filter((row) => {
        const dept = row.department
        const facultyId = dept.faculty?.id
        const facultyName = dept.faculty?.name ?? 'Belirtilmemiş'
        const key = facultyId ?? facultyName
        return key === facultyFilter.value
    })
})

watch(facultyFilter, () => {
    currentPage.value = 1
})

const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * 10
    return filteredTableData.value.slice(start, start + 10)
})

const apiPagination = computed(() => {
    const total = filteredTableData.value.length
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
    const rows = filteredTableData.value
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
        { key: 'total', count: s.total, label: 'Toplam Bölüm', cardClass: 'bg-card', colorClass: '' },
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

const columnHelper = createColumnHelper<DepartmentWithTargetStatus>()
const columns = [
    columnHelper.accessor((row) => row.department.name, {
        id: 'name',
        header: () => h('div', { class: 'p-2' }, 'Bölüm Adı'),
        cell: ({ row }) =>
            h(
                'div',
                {
                    class: 'text-wrap leading-relaxed p-2',
                    style: 'overflow-wrap: break-word; word-break: break-word;'
                },
                row.original.department.name
            )
    }),
    columnHelper.display({
        id: 'faculty',
        header: () => h('div', { class: 'p-2 text-left' }, 'Fakülte'),
        cell: ({ row }) => {
            const facultyName = row.original.department.faculty?.name ?? 'Belirtilmemiş'
            return h(
                'div',
                {
                    class: 'text-wrap leading-relaxed p-2 text-left',
                    style: 'overflow-wrap: break-word; word-break: break-word;'
                },
                facultyName
            )
        }
    }),
    columnHelper.display({
        id: 'head',
        header: () => h('div', { class: 'p-2 text-left' }, 'Bölüm Başkanı'),
        cell: ({ row }) => {
            const dept = row.original.department
            const dh = dept.departmentHead
            let headName: string
            if (dh) {
                headName = typeof dh === 'string' ? dh : formatUserName(dh as Parameters<typeof formatUserName>[0]) || 'Belirtilmemiş'
            } else {
                const headUser = dept.userAcademicUnits?.[0]?.user
                headName = headUser ? formatUserName(headUser as Parameters<typeof formatUserName>[0]) || 'Belirtilmemiş' : (dept.head ?? dept.headName ?? 'Belirtilmemiş')
            }
            return h(
                'div',
                {
                    class: 'text-wrap leading-relaxed p-2 text-left',
                    style: 'overflow-wrap: break-word; word-break: break-word;'
                },
                headName
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
            const id = row.original.department.id
            return h(
                NuxtLink,
                {
                    to: `/dashboard/targets/department-targets/${id}`,
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
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Bölüm 2026 Hedef Durumları</CardTitle>
                        <p class="text-sm text-muted-foreground mt-1">Bölümlerin 2026 yılı Ar-Ge hedef giriş durumları</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <Label for="faculty-filter" class="text-sm whitespace-nowrap">Fakülte:</Label>
                        <Select v-model="facultyFilter" name="faculty-filter">
                            <SelectTrigger class="w-[220px]">
                                <SelectValue placeholder="Tüm fakülteler" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm fakülteler</SelectItem>
                                <SelectItem v-for="f in uniqueFaculties" :key="f.id" :value="f.id">
                                    {{ f.name }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
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
