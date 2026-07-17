<script setup lang="ts">
import { createColumnHelper } from '@tanstack/vue-table'
import { h, resolveComponent } from 'vue'
import type { PerformanceAward, AwardStatus, ListType, NestedPerformanceAwardScore, IApiResponse } from '@/types'

const props = defineProps<{ year: number }>()
const emit = defineEmits<{ (e: 'status-changed'): void }>()

const NuxtLink = resolveComponent('NuxtLink')

const currentPage = ref(1)
const statusFilter = ref<AwardStatus | 'ALL'>('ALL')
const showStatusDialog = ref(false)
const selectedAward = ref<PerformanceAward | null>(null)
const selectedAwardScopeScores = ref<AwardScopeScore[]>([])
const scopeScoresLoading = ref(false)
const exportLoading = ref(false)

const handleExportAwards = async () => {
    exportLoading.value = true
    try {
        const config = useRuntimeConfig()
        const baseURL = config.public.apiBase || 'http://localhost:3000/api'
        const blob = await $fetch<Blob>('/manager/performance-awards/award-file', {
            baseURL,
            credentials: 'include',
            method: 'GET',
            query: { year: props.year },
            responseType: 'blob'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `performance-awards-${props.year}.xlsx`
        a.click()
        URL.revokeObjectURL(url)
    } catch {
        $toast({ title: 'Excel indirilemedi.', description: 'Lütfen daha sonra tekrar deneyiniz.', variant: 'destructive' })
    } finally {
        exportLoading.value = false
    }
}

const titleLabels: Record<string, string> = {
    PROF: 'Prof. Dr.',
    ASSOC_PROF: 'Doç. Dr.',
    ASSIST_PROF: 'Dr. Öğr. Üyesi'
}

const getAwardUserAcademicUnitLines = (award: PerformanceAward): string[] => {
    const unit = award.user.userAcademicUnits?.find((u) => u.affiliationType === 'MAIN')
    return [unit?.faculty?.name, unit?.department?.name, unit?.discipline?.name].filter(Boolean) as string[]
}

type AwardScopeScore = Pick<NestedPerformanceAwardScore, 'id' | 'listType' | 'rank' | 'totalInGroup' | 'isTopTenPercent'>

const SCOPE_ORDER: ListType[] = ['UNIVERSITY', 'FACULTY', 'DEPARTMENT', 'DISCIPLINE']

const toAwardScopeScore = (score: AwardScopeScore): AwardScopeScore => ({
    id: score.id,
    listType: score.listType,
    rank: score.rank,
    totalInGroup: score.totalInGroup,
    isTopTenPercent: score.isTopTenPercent
})

const sortScopeScores = (scores: AwardScopeScore[]) => [...scores].sort((a, b) => SCOPE_ORDER.indexOf(a.listType) - SCOPE_ORDER.indexOf(b.listType))

const mergeScopeScores = (...scoreGroups: AwardScopeScore[][]): AwardScopeScore[] => {
    const scoresByScope = new Map<ListType, AwardScopeScore>()
    for (const scores of scoreGroups) {
        for (const score of scores) {
            if (!scoresByScope.has(score.listType)) {
                scoresByScope.set(score.listType, toAwardScopeScore(score))
            }
        }
    }
    return sortScopeScores([...scoresByScope.values()])
}

const getAwardPayloadScopeScores = (award: PerformanceAward): AwardScopeScore[] => {
    return mergeScopeScores(award.user.performanceAwardScores ?? [], award.scores)
}

const fetchAwardScopeScores = async (award: PerformanceAward) => {
    scopeScoresLoading.value = true
    try {
        const response = await useRequest<PerformanceAwardScoreResponse>('/manager/performance-awards/scores', {
            method: 'GET',
            query: {
                year: props.year,
                limit: 100,
                search: award.user.email || `${award.user.name} ${award.user.surname}`
            }
        })
        const rowsForUser = response.rows.filter((score) => score.userId === award.userId)
        const nestedScores = rowsForUser.flatMap((score) => score.user.performanceAwardScores ?? [])
        const directScores = rowsForUser.map(toAwardScopeScore)
        selectedAwardScopeScores.value = mergeScopeScores(nestedScores, directScores, getAwardPayloadScopeScores(award))
    } catch {
        selectedAwardScopeScores.value = getAwardPayloadScopeScores(award)
        $toast({ title: 'Kapsam sıralamaları yüklenemedi.', description: 'Modal mevcut ödül kapsamlarıyla açıldı.', variant: 'destructive' })
    } finally {
        scopeScoresLoading.value = false
    }
}

const openStatusDialog = (award: PerformanceAward) => {
    selectedAward.value = award
    selectedAwardScopeScores.value = getAwardPayloadScopeScores(award)
    showStatusDialog.value = true
    fetchAwardScopeScores(award)
}

const getSortedAwardScopeScores = (award: PerformanceAward) => {
    const scoresByScope = new Map<ListType, AwardScopeScore>()
    for (const score of award.user.performanceAwardScores ?? []) {
        scoresByScope.set(score.listType, score)
    }
    for (const score of award.scores) {
        if (!scoresByScope.has(score.listType)) {
            scoresByScope.set(score.listType, score)
        }
    }
    return [...scoresByScope.values()].sort((a, b) => SCOPE_ORDER.indexOf(a.listType) - SCOPE_ORDER.indexOf(b.listType))
}

const columnHelper = createColumnHelper<PerformanceAward>()

const columns = [
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
                        class: 'font-medium text-sm text-gray-900 hover:text-gray-900 hover:no-underline'
                    },
                    () => `${user.name} ${user.surname}`
                ),
                h('span', { class: 'text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit' }, titleLabels[user.title] || user.title)
            ])
        }
    }),
    columnHelper.display({
        id: 'unit',
        header: () => h('div', { class: 'p-2 min-w-64' }, 'Fakülte / Bölüm / Ana Bilim Dalı'),
        cell: ({ row }) => {
            const lines = getAwardUserAcademicUnitLines(row.original)
            if (!lines.length) return h('div', { class: 'p-2 text-gray-400 text-sm' }, '-')

            return h(
                'div',
                { class: 'p-2 flex flex-col gap-0.5' },
                lines.map((line, index) => h('span', { class: index === 0 ? 'text-sm font-medium' : index === 1 ? 'text-xs text-gray-500' : 'text-xs text-gray-400' }, line))
            )
        }
    }),
    columnHelper.accessor('status', {
        header: () => h('div', { class: 'p-2 min-w-24 text-center' }, 'Durum'),
        cell: ({ row }) => {
            const isAwarded = row.original.status === 'AWARDED'
            return h(
                'div',
                { class: 'p-2 flex justify-center' },
                h('span', { class: `text-xs font-semibold px-2 py-1 rounded ${isAwarded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}` }, isAwarded ? 'Ödül alıyor' : 'Ödül dışı')
            )
        }
    }),
    columnHelper.display({
        id: 'actions',
        header: () => h('div', { class: 'p-2' }),
        cell: ({ row }) => {
            const isAwarded = row.original.status === 'AWARDED'
            return h(
                'div',
                { class: 'p-2' },
                h(
                    'button',
                    {
                        class: `text-xs px-3 py-1.5 rounded border font-medium transition-colors ${isAwarded ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`,
                        onClick: () => {
                            openStatusDialog(row.original)
                        }
                    },
                    isAwarded ? 'Ödül Dışı Bırak' : 'Ödüle Dahil Et'
                )
            )
        }
    })
]

const getAwards = async () => {
    const response = await useRequest<IApiResponse<PerformanceAward>>('/manager/performance-awards', {
        method: 'GET',
        query: {
            year: props.year,
            page: currentPage.value,
            limit: 10,
            status: statusFilter.value === 'ALL' ? undefined : statusFilter.value
        }
    })
    return response
}

const { data: awards, refresh } = await useAsyncData(`performance-awards-${props.year}`, getAwards, { watch: [currentPage, statusFilter] })

defineExpose({ refresh })

watch(statusFilter, () => {
    currentPage.value = 1
})

const handleStatusChanged = () => {
    showStatusDialog.value = false
    selectedAward.value = null
    refresh()
    emit('status-changed')
}
</script>

<template>
    <div class="px-6 pb-6">
        <!-- Filtreler -->
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <Select v-model="statusFilter">
                <SelectTrigger class="w-36">
                    <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Tümü</SelectItem>
                    <SelectItem value="AWARDED">Ödül alıyor</SelectItem>
                    <SelectItem value="EXCLUDED">Ödül dışı</SelectItem>
                </SelectContent>
            </Select>
            <Button size="sm" variant="outline" :disabled="exportLoading" @click="handleExportAwards">
                <span v-if="exportLoading" class="flex items-center gap-2">
                    <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    İndiriliyor...
                </span>
                <span v-else>Excel İndir</span>
            </Button>
        </div>

        <p class="text-sm text-gray-500 mb-3 font-medium">{{ year }} Yılı Performans Ödülleri</p>

        <div class="overflow-x-auto">
            <DataTable v-model:page="currentPage" :data="awards?.rows || []" :columns="columns" :api-pagination="awards?.pagination" :filterable-columns="[]" class="min-w-[900px]" />
        </div>
    </div>

    <!-- Durum Değiştir Dialog -->
    <PerformanceAwardStatusChangeDialog
        v-if="selectedAward"
        v-model:open="showStatusDialog"
        :award-id="selectedAward.id"
        :current-status="selectedAward.status"
        :user-name="`${titleLabels[selectedAward.user.title] || selectedAward.user.title} ${selectedAward.user.name} ${selectedAward.user.surname}`"
        :academic-unit-lines="getAwardUserAcademicUnitLines(selectedAward)"
        :scope-scores="selectedAwardScopeScores"
        :scope-scores-loading="scopeScoresLoading"
        @changed="handleStatusChanged"
    />
</template>
