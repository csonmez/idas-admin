<script setup lang="ts">
import { createColumnHelper } from '@tanstack/vue-table'
import { h, resolveComponent } from 'vue'
import { ChevronDown, ChevronRight, Info } from 'lucide-vue-next'
import type {
    PerformanceAwardScore,
    PerformanceAwardScoreResponse,
    PerformanceAwardUser,
    NestedPerformanceAwardScore,
    PerformanceAwardRecord,
    ListType,
    Faculty,
    Department,
    Discipline,
    Target,
    TargetItems,
    TargetIndicator,
    UserTargetIndicator
} from '@/types'

const props = defineProps<{ year: number }>()
const emit = defineEmits<{ (e: 'status-changed'): void }>()

const NuxtLink = resolveComponent('NuxtLink')
const TooltipProvider = resolveComponent('TooltipProvider')
const Tooltip = resolveComponent('Tooltip')
const TooltipTrigger = resolveComponent('TooltipTrigger')
const TooltipContent = resolveComponent('TooltipContent')

let searchTimer: ReturnType<typeof setTimeout> | null = null

const currentPage = ref(1)
const search = ref('')
const debouncedSearch = ref('')
const scopeFilter = ref<ListType>('UNIVERSITY')
const facultyId = ref<string | undefined>(undefined)
/** Bölüm kapsamı: seçilen fakülte (enableDisciplineHeadAccess: false) */
const depFacultyId = ref<string | undefined>(undefined)
/** Anabilim dalı kapsamı: seçilen fakülte (enableDisciplineHeadAccess: true) */
const disFacultyId = ref<string | undefined>(undefined)
const departmentId = ref<string | undefined>(undefined)
const disciplineId = ref<string | undefined>(undefined)

const titleLabels: Record<string, string> = {
    PROF: 'Prof. Dr.',
    ASSOC_PROF: 'Doç. Dr.',
    ASSIST_PROF: 'Dr. Öğr. Üyesi'
}

const columnHelper = createColumnHelper<PerformanceAwardScore>()

const columns = [
    columnHelper.display({
        id: 'expand',
        header: () => h('div', { class: 'p-2 w-10' }),
        cell: ({ row }) =>
            h('div', { class: 'p-2' }, [
                h(
                    'button',
                    {
                        type: 'button',
                        class: 'text-gray-400 hover:text-gray-600 transition-colors',
                        onClick: (e: MouseEvent) => {
                            e.stopPropagation()
                            row.toggleExpanded()
                        }
                    },
                    h(row.getIsExpanded() ? ChevronDown : ChevronRight, { size: 16 })
                )
            ])
    }),
    columnHelper.accessor('rank', {
        header: () => h('div', { class: 'p-2 min-w-20' }, 'Sıralama'),
        cell: ({ row }) => h('div', { class: 'p-2 text-sm font-medium' }, `${row.original.rank} / ${row.original.totalInGroup}`)
    }),
    columnHelper.accessor('user', {
        id: 'academician',
        header: () => h('div', { class: 'p-2 min-w-48' }, 'Akademisyen'),
        cell: ({ row }) => {
            const user = row.original.user
            return h('div', { class: 'p-2 flex flex-col gap-1' }, [
                h(
                    NuxtLink,
                    {
                        to: `/dashboard/academicians/${user.id}`,
                        class: 'font-medium text-sm'
                    },
                    () => `${user.name} ${user.surname}`
                ),
                h('span', { class: 'text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit' }, titleLabels[user.title] || user.title)
            ])
        }
    }),
    columnHelper.accessor('userAcademicUnit', {
        id: 'unit',
        header: () => h('div', { class: 'p-2 min-w-52' }, 'Fakülte / Bölüm'),
        cell: ({ row }) => {
            const unit = row.original.user.userAcademicUnits.find((u) => u.affiliationType === 'MAIN')
            if (!unit) return h('div', { class: 'p-2 text-gray-400 text-sm' }, '-')
            return h('div', { class: 'p-2 flex flex-col gap-0.5' }, [
                h('span', { class: 'text-sm font-medium' }, unit.faculty?.name ?? '-'),
                unit.department ? h('span', { class: 'text-xs text-gray-500' }, unit.department?.name ?? '-') : null,
                unit.discipline ? h('span', { class: 'text-xs text-gray-400' }, unit.discipline?.name ?? '-') : null
            ])
        }
    }),
    columnHelper.accessor('kpsScore', {
        header: () => h('div', { class: 'p-2 min-w-20 text-right' }, 'KPS'),
        cell: ({ row }) => h('div', { class: 'p-2 text-sm text-right' }, row.original.kpsScore)
    }),
    columnHelper.accessor('kltScore', {
        header: () => h('div', { class: 'p-2 min-w-20 text-right' }, 'KLT'),
        cell: ({ row }) => h('div', { class: 'p-2 text-sm text-right' }, row.original.kltScore)
    }),
    columnHelper.accessor('isbScore', {
        header: () => h('div', { class: 'p-2 min-w-20 text-right' }, 'ISB'),
        cell: ({ row }) => h('div', { class: 'p-2 text-sm text-right' }, row.original.isbScore)
    }),
    columnHelper.accessor('totalScore', {
        header: () => h('div', { class: 'p-2 min-w-24 text-right' }, 'Toplam Puan'),
        cell: ({ row }) => h('div', { class: 'p-2 text-sm font-bold text-right' }, row.original.totalScore)
    }),
    columnHelper.accessor('isTopTenPercent', {
        header: () => h('div', { class: 'p-2 min-w-28 text-center' }, 'İlk %10'),
        cell: ({ row }) => {
            const isTop = row.original.isTopTenPercent
            const isExcluded = row.original.performanceAward?.status === 'EXCLUDED'
            const isManual = row.original.performanceAward?.isManuallyAdded

            const badge = h('span', { class: `text-xs font-semibold px-2 py-1 rounded ${isTop ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}` }, isTop ? 'Evet' : 'Hayır')

            const manualIcon = isManual
                ? h(TooltipProvider, { delayDuration: 0 }, () =>
                      h(Tooltip, {}, () => [
                          h(TooltipTrigger, { asChild: true }, () => h('span', { class: 'inline-flex items-center cursor-default text-blue-400 hover:text-blue-600' }, h(Info, { size: 13 }))),
                          h(TooltipContent, {}, () => 'Manuel olarak eklendi')
                      ])
                  )
                : null

            return h('div', { class: 'p-2 flex flex-col items-center gap-1' }, [
                h('div', { class: 'flex items-center gap-1' }, [badge, manualIcon]),
                isExcluded ? h('span', { class: 'text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700' }, 'Ödül dışı bırakıldı') : null
            ])
        }
    })
]

const yearRef = toRef(props, 'year')

const { data: targetStructureResponse, pending: targetsPending } = await useAsyncData(
    () => `performance-award-scores-targets-${yearRef.value}`,
    () => useRequest<{ rows: Target[] }>('/manager/targets'),
    { watch: [yearRef] }
)

/** Seçili yıla uygun hedef şablonu; yoksa ilk kayıt */
const targetTemplate = computed(() => {
    const rows = targetStructureResponse.value?.rows ?? []
    return rows.find((t) => t.year === yearRef.value) ?? rows[0] ?? null
})

const getIndicatorEntry = (userData: UserTargetIndicator[] | undefined, categoryId: string, indicatorId: string) => {
    const cat = userData?.find((d) => d.targetId === categoryId)
    const list = cat?.indicators as { indicatorId: string; target?: number | null; actual?: number | null }[] | undefined
    return list?.find((i) => i.indicatorId === indicatorId)
}

const formatIndicatorValue = (v: number | null | undefined) => {
    if (v === null || v === undefined) return '—'
    return String(v)
}

const indicatorFallbackLabel = (categoryCode: string, ind: TargetIndicator): string => {
    const c = categoryCode.toLowerCase()
    const prefix = c === 'kps' ? 'KPS' : c === 'klt' ? 'KLT' : c === 'isb' ? 'ISB' : categoryCode ? categoryCode.toUpperCase().slice(0, 3) : '?'
    const g = String(ind.indicatorGroup ?? '').trim()
    const sub = ind.subIndicatorType
    if (!sub || sub === 'a') return `${prefix}${g}`
    return `${prefix}${g}${sub}`
}

const indicatorTooltipText = (ind: TargetIndicator, categoryCode: string): string => {
    const d = ind.description?.trim()
    if (d) return d
    return ind.indicator?.trim() || indicatorFallbackLabel(categoryCode, ind)
}

const getExpandedTargetCategories = (user: PerformanceAwardUser) => {
    const tmpl = targetTemplate.value
    if (!tmpl?.items?.length) return []

    const ut = user.userTargets?.find((x) => x.year === yearRef.value) ?? user.userTargets?.[0]
    const data = ut?.data ?? []

    return tmpl.items.map((category: TargetItems) => ({
        id: category.id,
        code: category.code,
        title: category.title,
        indicators: category.indicators.map((indicator: TargetIndicator) => {
            const entry = getIndicatorEntry(data, category.id, indicator.id)
            return {
                id: indicator.id,
                displayText: indicatorTooltipText(indicator, category.code),
                tooltipText: indicatorTooltipText(indicator, category.code),
                actual: entry?.actual
            }
        })
    }))
}

/** KPS / KLT / ISB sabit sırada üç sütun (şablonda yoksa boş sütun) */
const GROUP_COLUMN_ORDER = ['kps', 'klt', 'isb'] as const

const getExpandedGroupColumns = (user: PerformanceAwardUser) => {
    const cats = getExpandedTargetCategories(user)
    return GROUP_COLUMN_ORDER.map((code) => cats.find((c) => c.code.toLowerCase() === code) ?? null)
}

const listTypeLabels: Record<ListType, string> = {
    UNIVERSITY: 'Üniversite',
    FACULTY: 'Fakülte',
    DEPARTMENT: 'Bölüm',
    DISCIPLINE: 'Anabilim Dalı'
}

const SCOPE_ORDER: ListType[] = ['UNIVERSITY', 'FACULTY', 'DEPARTMENT', 'DISCIPLINE']

const getSortedNestedScores = (user: PerformanceAwardUser): NestedPerformanceAwardScore[] => {
    const scores = user.performanceAwardScores ?? []
    return [...scores].sort((a, b) => SCOPE_ORDER.indexOf(a.listType) - SCOPE_ORDER.indexOf(b.listType))
}

const getNestedScopeUnitName = (user: PerformanceAwardUser, listType: ListType): string => {
    const unit = user.userAcademicUnits.find((u) => u.affiliationType === 'MAIN')
    if (!unit) return '—'
    switch (listType) {
        case 'UNIVERSITY':
            return unit.faculty?.name ?? '—'
        case 'FACULTY':
            return unit.faculty?.name ?? '—'
        case 'DEPARTMENT':
            return unit.department?.name ?? '—'
        case 'DISCIPLINE':
            return unit.discipline?.name ?? '—'
    }
}

const getUserAcademicUnitLines = (user: PerformanceAwardUser): string[] => {
    const unit = user.userAcademicUnits.find((u) => u.affiliationType === 'MAIN')
    return [unit?.faculty?.name, unit?.department?.name, unit?.discipline?.name].filter(Boolean) as string[]
}

const { data: faculties } = await useAsyncData('performance-award-scores-faculties', () =>
    useRequest<Faculty[]>('/manager/faculties', {
        method: 'GET',
        query: {
            onlyData: true,
            type: 'FACULTY'
        }
    })
)

// onlyData: true ile gelen listede backend sortBy uygulamayabiliyor; fakülte sayfası sayfalı modda sıralı geliyor.
const sortedFaculties = computed(() => [...(faculties.value ?? [])].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'tr', { sensitivity: 'base' })))

const facultiesForDepartmentScope = computed(() => sortedFaculties.value.filter((f) => !f.enableDisciplineHeadAccess))

const facultiesForDisciplineScope = computed(() => sortedFaculties.value.filter((f) => f.enableDisciplineHeadAccess === true))

const normalizeToArray = <T,>(response: unknown): T[] => {
    if (Array.isArray(response)) return response as T[]
    if (response && typeof response === 'object') {
        const r = response as Record<string, unknown>
        if (Array.isArray(r.data)) return r.data as T[]
        if (Array.isArray(r.rows)) return r.rows as T[]
        if (Array.isArray(r.departments)) return r.departments as T[]
        if (Array.isArray(r.disciplines)) return r.disciplines as T[]
        if (Array.isArray(r.result)) return r.result as T[]
    }
    return []
}

const emptyScoresResponse = (): PerformanceAwardScoreResponse => ({
    rows: [],
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
    }
})

const { data: departmentsForScope, pending: departmentsPending } = await useAsyncData(
    'performance-award-scores-departments-by-faculty',
    async () => {
        const fid = depFacultyId.value
        if (!fid) return [] as Department[]
        const res = await useRequest<Department[]>('/manager/departments', {
            method: 'GET',
            query: {
                facultyId: fid,
                onlyData: true,
                useFaculty: true,
                isAll: true,
                sortBy: 'name',
                sortOrder: 'asc'
            }
        })
        return normalizeToArray<Department>(res)
    },
    { watch: [depFacultyId], default: () => [] as Department[] }
)

const { data: disciplinesForScope, pending: disciplinesPending } = await useAsyncData(
    'performance-award-scores-disciplines-by-faculty',
    async () => {
        const fid = disFacultyId.value
        if (!fid) return [] as Discipline[]
        const res = await useRequest<Discipline[]>('/manager/disciplines', {
            method: 'GET',
            query: {
                facultyId: fid,
                onlyData: true,
                useDepartment: true,
                useFaculty: true,
                isAll: true,
                sortBy: 'name',
                sortOrder: 'asc'
            }
        })
        return normalizeToArray<Discipline>(res)
    },
    { watch: [disFacultyId], default: () => [] as Discipline[] }
)

const sortedDepartmentsForScope = computed(() => [...(departmentsForScope.value ?? [])].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'tr', { sensitivity: 'base' })))

const sortedDisciplinesForScope = computed(() => [...(disciplinesForScope.value ?? [])].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'tr', { sensitivity: 'base' })))

const getScores = async () => {
    if (scopeFilter.value === 'DEPARTMENT' && !departmentId.value) {
        return emptyScoresResponse()
    }
    if (scopeFilter.value === 'DISCIPLINE' && !disciplineId.value) {
        return emptyScoresResponse()
    }
    const response = await useRequest<PerformanceAwardScoreResponse>('/manager/performance-awards/scores', {
        method: 'GET',
        query: {
            year: props.year,
            page: currentPage.value,
            limit: 10,
            scope: scopeFilter.value,
            facultyId: scopeFilter.value === 'FACULTY' ? facultyId.value : undefined,
            departmentId: scopeFilter.value === 'DEPARTMENT' ? departmentId.value : undefined,
            disciplineId: scopeFilter.value === 'DISCIPLINE' ? disciplineId.value : undefined,
            search: debouncedSearch.value.length >= 3 ? debouncedSearch.value : undefined
        }
    })
    return response
}

const { data: scores, refresh } = await useAsyncData(`performance-award-scores-${props.year}`, getScores, {
    watch: [currentPage, debouncedSearch, facultyId, departmentId, disciplineId]
})

defineExpose({ refresh })

watch(search, (value) => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        debouncedSearch.value = value
        currentPage.value = 1
    }, 300)
})

watch(scopeFilter, (val) => {
    currentPage.value = 1
    if (val === 'FACULTY') {
        facultyId.value = sortedFaculties.value[0]?.id
        depFacultyId.value = undefined
        disFacultyId.value = undefined
        departmentId.value = undefined
        disciplineId.value = undefined
    } else if (val === 'DEPARTMENT') {
        facultyId.value = undefined
        disFacultyId.value = undefined
        disciplineId.value = undefined
        depFacultyId.value = facultiesForDepartmentScope.value[0]?.id
        departmentId.value = undefined
    } else if (val === 'DISCIPLINE') {
        facultyId.value = undefined
        depFacultyId.value = undefined
        departmentId.value = undefined
        disFacultyId.value = facultiesForDisciplineScope.value[0]?.id
        disciplineId.value = undefined
    } else {
        facultyId.value = undefined
        depFacultyId.value = undefined
        disFacultyId.value = undefined
        departmentId.value = undefined
        disciplineId.value = undefined
        refresh()
    }
})

watch(faculties, (list) => {
    if (scopeFilter.value === 'FACULTY' && list?.length && !facultyId.value) {
        facultyId.value = sortedFaculties.value[0]?.id
    }
    if (scopeFilter.value === 'DEPARTMENT' && list?.length && !depFacultyId.value && facultiesForDepartmentScope.value[0]) {
        depFacultyId.value = facultiesForDepartmentScope.value[0].id
    }
    if (scopeFilter.value === 'DISCIPLINE' && list?.length && !disFacultyId.value && facultiesForDisciplineScope.value[0]) {
        disFacultyId.value = facultiesForDisciplineScope.value[0].id
    }
})

watch(depFacultyId, () => {
    departmentId.value = undefined
    currentPage.value = 1
})

watch(disFacultyId, () => {
    disciplineId.value = undefined
    currentPage.value = 1
})

watch([sortedDepartmentsForScope, departmentsPending, scopeFilter], () => {
    if (scopeFilter.value !== 'DEPARTMENT') return
    if (departmentsPending.value) return
    const list = sortedDepartmentsForScope.value
    if (!list?.length) {
        departmentId.value = undefined
        return
    }
    if (!departmentId.value || !list.some((d) => d.id === departmentId.value)) {
        departmentId.value = list[0]?.id
    }
})

watch([sortedDisciplinesForScope, disciplinesPending, scopeFilter], () => {
    if (scopeFilter.value !== 'DISCIPLINE') return
    if (disciplinesPending.value) return
    const list = sortedDisciplinesForScope.value
    if (!list?.length) {
        disciplineId.value = undefined
        return
    }
    if (!disciplineId.value || !list.some((d) => d.id === disciplineId.value)) {
        disciplineId.value = list[0]?.id
    }
})

watch(facultyId, () => {
    currentPage.value = 1
})

watch(departmentId, () => {
    currentPage.value = 1
})

watch(disciplineId, () => {
    currentPage.value = 1
})

const getCategoryBadgeClass = (code: string) => {
    switch (code) {
        case 'kps':
            return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'klt':
            return 'bg-green-50 text-green-700 border-green-200'
        case 'isb':
            return 'bg-purple-50 text-purple-700 border-purple-200'
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200'
    }
}

/** DataTable slot satırı `original` tipini bilmez */
const expandedRowScore = (row: { original: unknown }): PerformanceAwardScore => row.original as PerformanceAwardScore

/** Kullanıcının tekil ödül kaydını nested skorlar içinden çıkarır */
const getUserAwardRecord = (user: PerformanceAwardUser): PerformanceAwardRecord | null => {
    const scores = user.performanceAwardScores ?? []
    for (const s of scores) {
        if (s.performanceAward) return s.performanceAward
    }
    return null
}

// --- Ödül durum dialogu state ---
const showStatusDialog = ref(false)
const statusDialogScore = ref<PerformanceAwardScore | null>(null)

// --- Manuel ödül ekleme dialogu state ---
const showManualAddDialog = ref(false)
const manualAddScore = ref<PerformanceAwardScore | null>(null)
const manualAddComment = ref('')
const manualAddCommentError = ref('')
const manualAddLoading = ref(false)

const openStatusDialog = (score: PerformanceAwardScore) => {
    statusDialogScore.value = score
    showStatusDialog.value = true
}

const openManualAddDialog = (score: PerformanceAwardScore) => {
    manualAddScore.value = score
    manualAddComment.value = ''
    manualAddCommentError.value = ''
    showManualAddDialog.value = true
}

const handleStatusChanged = () => {
    showStatusDialog.value = false
    statusDialogScore.value = null
    refresh()
    emit('status-changed')
}

const handleManualAdd = async () => {
    if (!manualAddComment.value.trim()) {
        manualAddCommentError.value = 'Yorum zorunludur.'
        return
    }
    if (!manualAddScore.value) return
    manualAddCommentError.value = ''
    manualAddLoading.value = true
    const user = manualAddScore.value.user
    try {
        await useRequest('/manager/performance-awards/manual', {
            method: 'POST',
            body: {
                userId: user.id,
                year: props.year,
                listTypes: [manualAddScore.value.listType],
                comment: manualAddComment.value.trim()
            }
        })
    } catch (error: any) {
        const code = error?.data?.code
        if (code === 'DUPLICATE') {
            $toast({ title: 'Zaten listede', description: 'Kullanıcı zaten aktif ödül listesinde.', variant: 'destructive' })
        } else {
            $toast({ title: 'Hata', description: error?.data?.message || 'Ödüle eklenemedi.', variant: 'destructive' })
        }
        manualAddLoading.value = false
        return
    } finally {
        manualAddLoading.value = false
    }

    $toast({ title: 'Ödüle eklendi', description: `${user.name} ${user.surname} ödül listesine eklendi.` })
    showManualAddDialog.value = false
    manualAddScore.value = null
    manualAddComment.value = ''
    refresh()
    emit('status-changed')
}
</script>

<template>
    <div class="px-6 pb-6">
        <!-- Filtreler -->
        <div class="flex flex-wrap gap-3 mb-4">
            <Input v-model="search" type="text" placeholder="İsim, soyad veya e-posta ara..." class="max-w-xs" />
            <Select v-model="scopeFilter">
                <SelectTrigger class="w-44">
                    <SelectValue placeholder="Kapsam Seç" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="UNIVERSITY">Üniversite</SelectItem>
                    <SelectItem value="FACULTY">Fakülte</SelectItem>
                    <SelectItem value="DEPARTMENT">Bölüm</SelectItem>
                    <SelectItem value="DISCIPLINE">Anabilim Dalı</SelectItem>
                </SelectContent>
            </Select>
            <Select v-if="scopeFilter === 'FACULTY'" v-model="facultyId">
                <SelectTrigger class="w-64">
                    <SelectValue placeholder="Fakülte Seç" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="f in sortedFaculties" :key="f.id" :value="f.id">
                        {{ f.name }}
                    </SelectItem>
                </SelectContent>
            </Select>

            <template v-if="scopeFilter === 'DEPARTMENT'">
                <span v-if="!facultiesForDepartmentScope.length" class="text-sm text-amber-700 self-center">
                    Bölüm kapsamı için uygun fakülte bulunamadı (enableDisciplineHeadAccess kapalı olan fakülte yok).
                </span>
                <template v-else>
                    <Select v-model="depFacultyId">
                        <SelectTrigger class="w-64">
                            <SelectValue placeholder="Fakülte Seç" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="f in facultiesForDepartmentScope" :key="f.id" :value="f.id">
                                {{ f.name }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Select v-model="departmentId" :disabled="!depFacultyId || departmentsPending">
                        <SelectTrigger class="w-64">
                            <SelectValue :placeholder="departmentsPending ? 'Yükleniyor...' : 'Bölüm seçin'" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="d in sortedDepartmentsForScope" :key="d.id" :value="d.id">
                                {{ d.name }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <span v-if="depFacultyId && !departmentsPending && !sortedDepartmentsForScope.length" class="text-sm text-muted-foreground self-center"> Bu fakültede bölüm yok. </span>
                </template>
            </template>

            <template v-if="scopeFilter === 'DISCIPLINE'">
                <span v-if="!facultiesForDisciplineScope.length" class="text-sm text-amber-700 self-center">
                    Anabilim dalı kapsamı için uygun fakülte bulunamadı (enableDisciplineHeadAccess açık fakülte yok).
                </span>
                <template v-else>
                    <Select v-model="disFacultyId">
                        <SelectTrigger class="w-64">
                            <SelectValue placeholder="Fakülte Seç" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="f in facultiesForDisciplineScope" :key="f.id" :value="f.id">
                                {{ f.name }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Select v-model="disciplineId" :disabled="!disFacultyId || disciplinesPending">
                        <SelectTrigger class="w-64">
                            <SelectValue :placeholder="disciplinesPending ? 'Yükleniyor...' : 'Anabilim dalı seçin'" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="disc in sortedDisciplinesForScope" :key="disc.id" :value="disc.id">
                                {{ disc.name ?? '—' }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <span v-if="disFacultyId && !disciplinesPending && !sortedDisciplinesForScope.length" class="text-sm text-muted-foreground self-center"> Bu fakültede anabilim dalı yok. </span>
                </template>
            </template>
        </div>

        <!-- Tablo başlığı -->
        <p class="text-sm text-gray-500 mb-3 font-medium">{{ year }} Yılı Performans Skorları</p>

        <div class="overflow-x-auto">
            <DataTable v-model:page="currentPage" :data="scores?.rows || []" :columns="columns" :api-pagination="scores?.pagination" :filterable-columns="[]" class="min-w-[1200px]">
                <template #expanded-row="{ row }">
                    <div class="border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm">

                        <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[220px_auto] lg:items-start lg:justify-start">
                            <!-- Ödül Kaydı Paneli -->
                            <div class="rounded-md border border-gray-200 bg-white px-4 py-3">
                                <div class="flex h-full flex-col justify-between gap-4">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ödül Kaydı</span>
                                        <div class="flex items-center">
                                            <template v-if="getUserAwardRecord(expandedRowScore(row).user)">
                                                <template v-if="getUserAwardRecord(expandedRowScore(row).user)!.status === 'AWARDED'">
                                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                                        Ödül alıyor
                                                        <span v-if="getUserAwardRecord(expandedRowScore(row).user)!.isManuallyAdded" class="font-normal text-blue-500">(M)</span>
                                                    </span>
                                                </template>
                                                <template v-else>
                                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">Ödül dışı bırakıldı</span>
                                                </template>
                                            </template>
                                            <template v-else>
                                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-500">Ödül almıyor</span>
                                            </template>
                                        </div>
                                    </div>
                                    <div>
                                        <template v-if="getUserAwardRecord(expandedRowScore(row).user)">
                                            <button
                                                type="button"
                                                :class="`w-full text-xs px-3 py-1.5 rounded border font-medium transition-colors ${getUserAwardRecord(expandedRowScore(row).user)!.status === 'AWARDED' ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`"
                                                @click="openStatusDialog(expandedRowScore(row))"
                                            >
                                                {{ getUserAwardRecord(expandedRowScore(row).user)!.status === 'AWARDED' ? 'Ödül Dışı Bırak' : 'Ödüle Dahil Et' }}
                                            </button>
                                        </template>
                                        <template v-else-if="expandedRowScore(row).user.performanceAwardScores?.length">
                                            <button
                                                type="button"
                                                class="w-full text-xs px-3 py-1.5 rounded border font-medium transition-colors border-green-300 text-green-600 hover:bg-green-50"
                                                @click="openManualAddDialog(expandedRowScore(row))"
                                            >
                                                Ödüle Dahil Et
                                            </button>
                                        </template>
                                    </div>
                                </div>
                            </div>

                            <!-- Diğer kapsamlardaki sıralama -->
                            <template v-if="expandedRowScore(row).user.performanceAwardScores?.length">
                                <div class="min-w-0 rounded-md border border-gray-200 bg-white p-4">
                                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kapsam Bazlı Sıralama</p>
                                    <div class="overflow-x-auto rounded-md border border-gray-200">
                                        <div class="min-w-[500px] text-xs">
                                            <div class="grid grid-cols-[90px_200px_80px_70px] bg-gray-50 border-b border-gray-200">
                                                <div class="px-3 py-2 font-semibold text-gray-600">Kapsam</div>
                                                <div class="px-3 py-2 font-semibold text-gray-600">Birim</div>
                                                <div class="px-3 py-2 text-right font-semibold text-gray-600">Sıralama</div>
                                                <div class="px-3 py-2 text-center font-semibold text-gray-600">İlk %10</div>
                                            </div>
                                            <div class="divide-y divide-gray-100">
                                                <div
                                                    v-for="ns in getSortedNestedScores(expandedRowScore(row).user)"
                                                    :key="ns.id"
                                                    class="grid grid-cols-[90px_200px_80px_70px] hover:bg-gray-50"
                                                >
                                                    <div class="px-3 py-2 font-medium text-gray-700">
                                                        {{ listTypeLabels[ns.listType] }}
                                                    </div>
                                                    <div class="px-3 py-2 text-gray-500 truncate">
                                                        {{ getNestedScopeUnitName(expandedRowScore(row).user, ns.listType) }}
                                                    </div>
                                                    <div class="px-3 py-2 text-right font-medium tabular-nums">
                                                        {{ ns.rank }} / {{ ns.totalInGroup }}
                                                    </div>
                                                    <div class="px-3 py-2 text-center">
                                                        <span
                                                            :class="`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${ns.isTopTenPercent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`"
                                                        >
                                                            {{ ns.isTopTenPercent ? 'Evet' : 'Hayır' }}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <div class="rounded-md border border-gray-200 bg-white p-4">
                            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hedef Detayları</p>
                            <div v-if="targetsPending" class="text-muted-foreground">Hedef şablonu yükleniyor...</div>
                            <div v-else-if="!targetTemplate?.items?.length" class="text-muted-foreground">Bu yıl için hedef şablonu bulunamadı.</div>
                            <template v-else>
                                <div v-if="!getExpandedTargetCategories(expandedRowScore(row).user).some((c) => c.indicators.length)" class="text-muted-foreground">
                                    Gösterilecek akademisyen göstergesi yok veya hedef verisi bulunmuyor.
                                </div>
                                <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div v-for="(category, colIdx) in getExpandedGroupColumns(expandedRowScore(row).user)" :key="category?.id ?? 'col-' + colIdx" class="min-w-0">
                                        <template v-if="category && category.indicators.length">
                                            <div class="mb-2">
                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border" :class="getCategoryBadgeClass(category.code)">
                                                    {{ category.title }}
                                                </span>
                                            </div>
                                            <div class="rounded-md border border-gray-200 bg-white divide-y divide-gray-100">
                                                <div v-for="ind in category.indicators" :key="ind.id" class="flex min-w-0 items-center justify-between gap-2 px-2.5 py-1.5 text-xs">
                                                    <TooltipProvider :delay-duration="0">
                                                        <Tooltip>
                                                            <TooltipTrigger as-child>
                                                                <span
                                                                    class="min-w-0 max-w-[20rem] flex-1 cursor-default truncate text-xs text-gray-800"
                                                                >
                                                                    {{ ind.displayText }}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent class="max-w-sm text-left">
                                                                {{ ind.tooltipText }}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <span class="tabular-nums font-medium text-gray-800 text-right">{{ formatIndicatorValue(ind.actual) }}</span>
                                                </div>
                                            </div>
                                        </template>
                                        <div v-else class="rounded-md border border-dashed border-gray-200 bg-white/50 px-2 py-6 text-center text-xs text-muted-foreground">—</div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </template>
            </DataTable>
        </div>
    </div>

    <!-- PATCH: Ödülden çıkar / Tekrar dahil et dialogu -->
    <PerformanceAwardStatusChangeDialog
        v-if="statusDialogScore"
        v-model:open="showStatusDialog"
        :award-id="getUserAwardRecord(statusDialogScore.user)!.id"
        :current-status="getUserAwardRecord(statusDialogScore.user)!.status"
        :user-name="`${titleLabels[statusDialogScore.user.title] || statusDialogScore.user.title} ${statusDialogScore.user.name} ${statusDialogScore.user.surname}`"
        :academic-unit-lines="getUserAcademicUnitLines(statusDialogScore.user)"
        :scope-scores="getSortedNestedScores(statusDialogScore.user)"
        @changed="handleStatusChanged"
    />

    <!-- POST manual: Ödüle ekle dialogu -->
    <Dialog v-if="manualAddScore" :open="showManualAddDialog" @update:open="showManualAddDialog = $event">
        <DialogContent class="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Ödüle Dahil Et</DialogTitle>
                <DialogDescription>Kullanıcı manuel olarak ödül listesine eklenecek.</DialogDescription>
            </DialogHeader>
            <div class="space-y-4 py-2">
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
                    <div class="flex justify-between gap-4">
                        <span class="text-gray-500">İsim Soyisim</span>
                        <span class="font-medium text-right">{{ titleLabels[manualAddScore.user.title] || manualAddScore.user.title }} {{ manualAddScore.user.name }} {{ manualAddScore.user.surname }}</span>
                    </div>
                    <div v-for="(line, index) in getUserAcademicUnitLines(manualAddScore.user)" :key="line" class="flex justify-between gap-4">
                        <span class="text-gray-500">{{ ['Fakülte', 'Bölüm', 'Ana Bilim Dalı'][index] }}</span>
                        <span class="font-medium text-right">{{ line }}</span>
                    </div>
                </div>

                <div class="rounded-lg border border-gray-200 overflow-hidden text-xs">
                    <div class="bg-gray-50 px-3 py-2 font-semibold text-gray-600">Kapsam Sıralamaları</div>
                    <div v-if="!getSortedNestedScores(manualAddScore.user).length" class="px-3 py-3 text-muted-foreground">Gösterilecek kapsam sıralaması bulunamadı.</div>
                    <div v-else>
                        <div class="grid grid-cols-[1fr_90px_70px] border-b border-gray-200 bg-gray-50">
                            <div class="px-3 py-2 font-semibold text-gray-600">Kapsam</div>
                            <div class="px-3 py-2 text-right font-semibold text-gray-600">Sıralama</div>
                            <div class="px-3 py-2 text-center font-semibold text-gray-600">İlk %10</div>
                        </div>
                        <div class="divide-y divide-gray-100">
                            <div v-for="score in getSortedNestedScores(manualAddScore.user)" :key="score.id" class="grid grid-cols-[1fr_90px_70px]">
                                <div class="px-3 py-2 font-medium text-gray-700">{{ listTypeLabels[score.listType] }}</div>
                                <div class="px-3 py-2 text-right tabular-nums">{{ score.rank }} / {{ score.totalInGroup }}</div>
                                <div class="px-3 py-2 text-center">
                                    <span :class="`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${score.isTopTenPercent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`">
                                        {{ score.isTopTenPercent ? 'Evet' : 'Hayır' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label class="text-sm font-medium">Yorum <span class="text-red-500">*</span></label>
                    <Textarea v-model="manualAddComment" placeholder="Manuel ekleme gerekçesini açıklayın..." rows="3" :class="manualAddCommentError ? 'border-red-400' : ''" />
                    <p v-if="manualAddCommentError" class="text-xs text-red-500">{{ manualAddCommentError }}</p>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" :disabled="manualAddLoading" @click="showManualAddDialog = false">İptal</Button>
                <Button :disabled="manualAddLoading" @click="handleManualAdd">
                    <span v-if="manualAddLoading" class="flex items-center gap-2">
                        <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Ekleniyor...
                    </span>
                    <span v-else>Ekle</span>
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>