<script setup lang="ts">
import type { IApiResponse, IPagination, UserIncentiveApproval, UserIncentiveApprovalStatus, UserIncentiveApprovalStatistics } from '@/types'
import { createColumnHelper } from '@tanstack/vue-table'
import { View, Users, CheckCircle2, Clock, TrendingUp, Banknote, BookOpen, FlaskConical, Lightbulb, Trophy, GraduationCap, Download, Loader } from 'lucide-vue-next'
import { h, resolveComponent } from 'vue'
import DataTable from '~/components/DataTable.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const TITLE_MAP: Record<string, string> = {
    PROF: 'Prof. Dr.',
    ASSOC_PROF: 'Doç. Dr.',
    ASSIST_PROF: 'Dr. Öğr. Üyesi',
    RESEARCH_ASSIST: 'Arş. Gör.',
    LECTURER: 'Öğr. Gör.',
    DOCTOR: 'Dr.'
}
const NuxtLink = resolveComponent('NuxtLink')

/** Liste verisi 2024 teşvik dönemine göre filtrelenir (term API'den çözülür) */
const FIXED_YEAR = 2024

let searchTimer: ReturnType<typeof setTimeout> | null = null
const currentPage = ref(1)
const search = ref('')
const debouncedSearch = ref('')
const statusFilter = ref<string | undefined>(undefined)
const filterableColumns = ref([])

const { data: incentiveTerms } = await useAsyncData('incentive-terms-for-approvals', () =>
    useRequest<Array<{ id: string; year: number }>>('/manager/incentive-terms', {
        method: 'GET',
        query: { onlyData: true }
    })
)

const termForFixedYear = computed(() => incentiveTerms.value?.find((t) => t.year === FIXED_YEAR) ?? null)

const STATUS_META: Record<UserIncentiveApprovalStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; class: string }> = {
    PENDING:     { label: 'Beklemede',   variant: 'outline',     class: 'border-yellow-400 text-yellow-700 bg-yellow-50' },
    IN_PROGRESS: { label: 'İşlemde',     variant: 'secondary',   class: 'border-blue-400 text-blue-700 bg-blue-50' },
    COMPLETED:   { label: 'Tamamlandı',  variant: 'default',     class: 'border-green-500 text-green-700 bg-green-50' },
    REJECTED:    { label: 'Reddedildi',  variant: 'destructive', class: '' },
    CANCELLED:   { label: 'İptal',       variant: 'outline',     class: 'border-gray-400 text-gray-500 bg-gray-50' }
}

const columnHelper = createColumnHelper<UserIncentiveApproval>()
const columns = [
    columnHelper.display({
        id: 'user',
        header: () => h('div', { class: 'p-2 min-w-44' }, 'İsim Soyisim'),
        cell: ({ row }) => {
            const u = row.original.user
            const name = [u?.name, u?.surname].filter(Boolean).join(' ') || '—'
            const titleTr = u?.title ? (TITLE_MAP[u.title] ?? u.title) : null
            return h('div', { class: 'p-2 min-w-44' }, [
                h('div', { class: 'font-medium leading-snug' }, name),
                titleTr ? h('div', { class: 'text-xs text-muted-foreground mt-0.5' }, titleTr) : null
            ])
        }
    }),
    columnHelper.display({
        id: 'year',
        header: () => h('div', { class: 'p-2' }, 'Dönem'),
        cell: ({ row }) => h('div', { class: 'p-2' }, row.original.incentiveTerm?.year != null ? String(row.original.incentiveTerm.year) : '—')
    }),
    columnHelper.display({
        id: 'approvalStatus',
        header: () => h('div', { class: 'p-2' }, 'Onay durumu'),
        cell: ({ row }) => {
            const meta = STATUS_META[row.original.status] ?? { label: row.original.status, variant: 'outline', class: '' }
            return h('div', { class: 'p-2' }, [
                h(Badge, { variant: meta.variant, class: meta.class }, () => meta.label)
            ])
        }
    }),
    columnHelper.display({
        id: 'total',
        header: () => h('div', { class: 'p-2 text-right' }, 'Toplam (TL)'),
        cell: ({ row }) =>
            h(
                'div',
                { class: 'p-2 text-right tabular-nums' },
                formatTl(row.original.amount?.total?.finalAmount)
            )
    }),
    columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    to: `/dashboard/user-incentive-approvals/${row.original.id}`,
                    class: 'inline-flex items-center justify-end p-4 rounded-md hover:bg-gray-100 transition-colors w-full pr-8'
                },
                () => [h(View, { size: 16 })]
            )
        }
    })
]

function formatTl(n: number | undefined) {
    if (n == null || Number.isNaN(n)) return '—'
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}


const emptyPagination = (): IPagination => ({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
})

const getApprovals = async (): Promise<IApiResponse<UserIncentiveApproval>> => {
    if (!termForFixedYear.value) {
        return { rows: [], pagination: emptyPagination() }
    }

    const query: Record<string, string | number | undefined> = {
        page: currentPage.value,
        limit: 10,
        incentiveTermId: termForFixedYear.value.id,
        select: 'id,amount,status,createdAt,updatedAt,user,incentiveTerm',
        userSelect: 'id,name,surname,email,title',
        incentiveTermSelect: 'id,year,status',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    }
    if (debouncedSearch.value.length >= 3) {
        query.search = debouncedSearch.value
    }
    if (statusFilter.value) {
        query.status = statusFilter.value
    }

    return useRequest<IApiResponse<UserIncentiveApproval>>('/manager/user-incentive-approvals', {
        method: 'GET',
        query
    })
}

const { data: approvals, pending } = await useAsyncData('user-incentive-approvals-list', getApprovals, {
    watch: [currentPage, debouncedSearch, statusFilter, termForFixedYear]
})

const emptyStatistics = (): UserIncentiveApprovalStatistics => ({
    total: 0,
    byStatus: { pending: 0, completed: 0 },
    completionRate: '0',
    amountTotals: {
        total: 0,
        completed: 0,
        pending: 0,
        byActivity: { article: 0, project: 0, patent: 0, prize: 0, postgraduate: 0 },
        byActivityCompleted: { article: 0, project: 0, patent: 0, prize: 0, postgraduate: 0 },
        byActivityPending: { article: 0, project: 0, patent: 0, prize: 0, postgraduate: 0 }
    }
})

const getStatistics = async (): Promise<UserIncentiveApprovalStatistics> => {
    if (!termForFixedYear.value) return emptyStatistics()
    return useRequest<UserIncentiveApprovalStatistics>('/manager/user-incentive-approvals/statistics', {
        method: 'GET',
        query: { incentiveTermId: termForFixedYear.value.id }
    })
}

const {
    data: statistics,
    pending: statisticsPending,
    error: statisticsError,
    refresh: refreshStatistics
} = await useAsyncData('user-incentive-approvals-statistics', getStatistics, {
    watch: [termForFixedYear],
    lazy: true
})

const ACTIVITY_META: Array<{ key: keyof UserIncentiveApprovalStatistics['amountTotals']['byActivity']; label: string; icon: any; color: string }> = [
    { key: 'article',      label: 'Makale',       icon: BookOpen,     color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' },
    { key: 'project',      label: 'Proje',        icon: FlaskConical, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400' },
    { key: 'patent',       label: 'Patent',       icon: Lightbulb,    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' },
    { key: 'prize',        label: 'Ödül',         icon: Trophy,       color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' },
    { key: 'postgraduate', label: 'Lisansüstü',   icon: GraduationCap, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400' }
]

const isExporting = ref(false)

const handleExportExcel = async () => {
    try {
        isExporting.value = true
        const config = useRuntimeConfig()
        const baseURL = config.public.apiBase || 'http://localhost:3000/api'
        const blob = await $fetch<Blob>('/manager/user-incentive-approvals/export-excel', {
            baseURL,
            credentials: 'include',
            responseType: 'blob',
            query: statusFilter.value ? { status: statusFilter.value } : undefined
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const suffix = statusFilter.value ? statusFilter.value.toLowerCase() : 'tum'
        a.download = `bilimsel-tesvik-${FIXED_YEAR}-${suffix}.xlsx`
        a.click()
        URL.revokeObjectURL(url)
    } catch {
        $toast({ title: 'Excel indirilemedi.', description: 'Lütfen daha sonra tekrar deneyiniz.', variant: 'destructive' })
    } finally {
        isExporting.value = false
    }
}

watch(search, (value) => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        debouncedSearch.value = value
        currentPage.value = 1
    }, 300)
})

watch(statusFilter, () => {
    currentPage.value = 1
})
</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
        <!-- İstatistik Kartları -->
        <div>
            <!-- Yüklenme -->
            <template v-if="statisticsPending">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div v-for="i in 4" :key="i" class="bg-card border shadow-sm rounded-xl p-4 flex flex-col gap-3">
                        <Skeleton class="h-4 w-28" />
                        <Skeleton class="h-8 w-20" />
                    </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div v-for="i in 3" :key="i" class="bg-card border shadow-sm rounded-xl p-4 flex flex-col gap-3">
                        <Skeleton class="h-4 w-28" />
                        <Skeleton class="h-8 w-20" />
                    </div>
                </div>
            </template>

            <!-- Hata -->
            <div v-else-if="statisticsError" class="bg-card border shadow-sm rounded-xl p-4 text-sm text-destructive mb-4">
                İstatistik verileri yüklenemedi.
                <button class="underline ml-2 text-foreground" @click="refreshStatistics()">Tekrar dene</button>
            </div>

            <!-- İçerik -->
            <template v-else-if="statistics">
                <!-- Satır 1: Kayıt özeti -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <!-- Toplam Kayıt -->
                    <div class="bg-card border shadow-sm rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Toplam Kayıt</p>
                            <p class="text-2xl font-bold mt-1">{{ statistics.total }}</p>
                        </div>
                        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                            <Users class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <!-- Onaylanan -->
                    <div class="bg-card border shadow-sm rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Onaylanan</p>
                            <p class="text-2xl font-bold mt-1 text-green-600">{{ statistics.byStatus.completed }}</p>
                        </div>
                        <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center shrink-0">
                            <CheckCircle2 class="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <!-- Bekleyen -->
                    <div class="bg-card border shadow-sm rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Bekleyen</p>
                            <p class="text-2xl font-bold mt-1 text-yellow-600">{{ statistics.byStatus.pending }}</p>
                        </div>
                        <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center shrink-0">
                            <Clock class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                    <!-- Tamamlanma Oranı -->
                    <div class="bg-card border shadow-sm rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Tamamlanma Oranı</p>
                            <p class="text-2xl font-bold mt-1">%{{ statistics.completionRate }}</p>
                        </div>
                        <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center shrink-0">
                            <TrendingUp class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                <!-- Satır 2: Tutar özeti -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="bg-card border shadow-sm rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Toplam Tutar</p>
                            <p class="text-xl font-bold mt-1 tabular-nums">{{ formatTl(statistics.amountTotals.total) }} ₺</p>
                        </div>
                        <div class="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                            <Banknote class="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                    </div>
                    <div class="bg-card border shadow-sm rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Onaylanan Tutar</p>
                            <p class="text-xl font-bold mt-1 text-green-600 tabular-nums">{{ formatTl(statistics.amountTotals.completed) }} ₺</p>
                        </div>
                        <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center shrink-0">
                            <Banknote class="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <div class="bg-card border shadow-sm rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Bekleyen Tutar</p>
                            <p class="text-xl font-bold mt-1 text-yellow-600 tabular-nums">{{ formatTl(statistics.amountTotals.pending) }} ₺</p>
                        </div>
                        <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center shrink-0">
                            <Banknote class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                </div>

                <!-- Satır 3: Faaliyet bazlı kırılımlar -->
                <div class="bg-card border shadow-sm rounded-xl p-4">
                    <p class="text-sm font-semibold text-muted-foreground mb-3">Faaliyet Bazlı Tutar Kırılımı</p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <div
                            v-for="act in ACTIVITY_META"
                            :key="act.key"
                            class="rounded-lg border p-3 flex flex-col gap-2"
                        >
                            <div class="flex items-center gap-2">
                                <div :class="['w-7 h-7 rounded-md flex items-center justify-center shrink-0', act.color]">
                                    <component :is="act.icon" class="w-4 h-4" />
                                </div>
                                <span class="text-xs font-medium">{{ act.label }}</span>
                            </div>
                            <div class="space-y-1">
                                <div class="flex justify-between items-center text-xs text-muted-foreground">
                                    <span>Toplam</span>
                                    <span class="tabular-nums font-medium text-foreground">{{ formatTl(statistics.amountTotals.byActivity[act.key]) }} ₺</span>
                                </div>
                                <div class="flex justify-between items-center text-xs text-muted-foreground">
                                    <span>Onaylanan</span>
                                    <span class="tabular-nums font-medium text-green-600">{{ formatTl(statistics.amountTotals.byActivityCompleted[act.key]) }} ₺</span>
                                </div>
                                <div class="flex justify-between items-center text-xs text-muted-foreground">
                                    <span>Bekleyen</span>
                                    <span class="tabular-nums font-medium text-yellow-600">{{ formatTl(statistics.amountTotals.byActivityPending[act.key]) }} ₺</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <Card>
            <CardHeader>
                <div class="flex flex-row justify-between items-start gap-4 flex-wrap">
                    <div>
                        <CardTitle>Bilimsel Teşvik</CardTitle>
                        <p class="text-sm text-muted-foreground mt-1">{{ FIXED_YEAR }} dönemi</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <Button variant="outline" :disabled="isExporting" @click="handleExportExcel">
                            <Loader v-if="isExporting" class="w-4 h-4 mr-2 animate-spin" />
                            <Download v-else class="w-4 h-4 mr-2" />
                            Excel İndir
                        </Button>
                        <Select
                            :model-value="statusFilter ?? 'ALL'"
                            @update:model-value="
                                (v) => {
                                    statusFilter = v === 'ALL' ? undefined : (v as string)
                                }
                            "
                        >
                            <SelectTrigger class="w-[180px]">
                                <SelectValue placeholder="Durum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL"> Tüm durumlar </SelectItem>
                                <SelectItem value="PENDING"> Beklemede </SelectItem>
                                <SelectItem value="COMPLETED"> Tamamlandı </SelectItem>
                            </SelectContent>
                        </Select>
                        <Input v-model="search" type="text" placeholder="İsim, soyisim, e-posta..." class="w-64" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p v-if="!termForFixedYear" class="text-sm text-destructive mb-4">
                    {{ FIXED_YEAR }} yılı için teşvik dönemi bulunamadı. Liste boş gösterilir.
                </p>
                <div class="overflow-x-auto">
                    <DataTable
                        v-model:page="currentPage"
                        :loading="pending"
                        :data="approvals?.rows || []"
                        :columns="columns"
                        :api-pagination="approvals?.pagination"
                        :filterable-columns="filterableColumns"
                        class="min-w-[900px] h-full"
                    />
                </div>
            </CardContent>
        </Card>
    </div>
</template>
