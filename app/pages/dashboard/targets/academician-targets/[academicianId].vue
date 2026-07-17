<script setup lang="ts">
import type { Target, TargetItems, TargetIndicator, UserTarget, UserTargetIndicator, User } from '~/types'
import { ArrowLeft, Calendar } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import TargetIndicatorTable from '@/components/Admin/Academician/TargetIndicatorTable.vue'
import formatUserName from '@/utils/formatUserName'

const route = useRoute()
const router = useRouter()
const academicianId = computed(() => route.params.academicianId as string)

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear.toString())
const availableYears = [2022, 2023, 2024, 2025, 2026].filter((y) => y <= currentYear + 1).reverse()

const { data, pending, error, refresh } = await useAsyncData(
    `academician-target-detail-${academicianId.value}`,
    async () => {
        const [academicianRes, targetsRes, userTargetsRes] = await Promise.all([
            useRequest<User>(`/manager/users/${academicianId.value}`),
            useRequest<Target[] | { rows: Target[] }>('/manager/targets', { query: { onlyData: true } }),
            useRequest<UserTarget[]>(`/manager/user-targets`, {
                query: {
                    userId: academicianId.value,
                    includeAllYears: true,
                    onlyData: true
                }
            })
        ])

        const targetRows = Array.isArray(targetsRes) ? targetsRes : ((targetsRes as { rows: Target[] })?.rows ?? [])
        const userTargets = Array.isArray(userTargetsRes) ? userTargetsRes : []

        return {
            academician: academicianRes,
            targets: targetRows,
            userTargets
        }
    },
    { watch: [academicianId] }
)

const targetStructure = computed(() => {
    const year = Number(selectedYear.value)
    const targets = data.value?.targets ?? []
    const arr = Array.isArray(targets) ? targets : []
    return (arr as Target[]).find((t: Target) => t.year === year) ?? (arr as Target[])[0]
})

const currentUserTarget = computed(() => {
    const year = Number(selectedYear.value)
    return data.value?.userTargets?.find((ut: UserTarget) => ut.year === year) ?? null
})

const processedData = computed(() => {
    if (!targetStructure.value?.items) return []

    const items = targetStructure.value.items as TargetItems[]

    return items
        .map((category: TargetItems) => {
            const indicators = (category.indicators ?? [])
                .filter((ind: TargetIndicator) => ind.isAcademicianIndicator)
                .map((ind: TargetIndicator) => {
                    const categoryData = currentUserTarget.value?.data?.find((d: UserTargetIndicator) => d.targetId === category.id)
                    const indicatorData = categoryData?.indicators?.find((i: { indicatorId: string }) => i.indicatorId === ind.id)
                    return {
                        id: ind.id,
                        indicator: ind.indicator,
                        description: ind.description,
                        target: indicatorData?.target ?? null,
                        actual: indicatorData?.actual ?? null,
                        minValue: ind.minValue ?? 0,
                        maxValue: ind.maxValue ?? 999,
                        weight: ind.weight ?? 0
                    }
                })
            return {
                id: category.id,
                code: category.code,
                title: category.title,
                indicators
            }
        })
        .filter((cat) => cat.indicators.length > 0)
})

const userTargetId = computed(() => currentUserTarget.value?.id ?? null)

const getCategoryColor = (code: string) => {
    switch (code) {
        case 'kps':
            return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
        case 'klt':
            return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
        case 'isb':
            return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    }
}

const academicianDisplayName = computed(() => formatUserName(data.value?.academician ?? null) || 'Akademisyen')
const handleRefresh = () => refresh()
</script>

<template>
    <div class="flex-1 px-4 pb-8 md:px-8 md:pb-10">
        <div class="mx-auto w-full max-w-7xl">
            <div class="mb-6">
                <div class="flex items-center gap-3 mb-1">
                    <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0" @click="router.back()">
                        <ArrowLeft class="w-4 h-4" />
                    </Button>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Hedef Yönetimi – {{ academicianDisplayName }}</h1>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 ml-11 mb-3">Akademisyen hedeflerini yıl bazında görüntüleyin ve düzenleyin</p>
                <div class="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-900/50 px-5 py-3 shadow-sm backdrop-blur-sm">
                    <div class="flex items-center gap-2.5">
                        <Calendar class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <Label class="text-sm font-medium text-gray-600 dark:text-gray-400">Yıl</Label>
                        <Select v-model="selectedYear">
                            <SelectTrigger class="w-[110px] h-9 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="y in availableYears" :key="y" :value="String(y)">
                                    {{ y }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div v-if="pending" class="space-y-6">
                <Card v-for="i in 3" :key="i">
                    <CardHeader>
                        <Skeleton class="h-8 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div class="space-y-3">
                            <Skeleton class="h-12 w-full" />
                            <Skeleton class="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card v-else-if="error">
                <CardContent class="pt-6">
                    <div class="text-center py-8 space-y-4">
                        <div class="text-red-600 dark:text-red-400">
                            <p class="font-medium">Hedef verileri yüklenemedi</p>
                            <p class="text-sm mt-1">{{ error?.message ?? 'Bilinmeyen bir hata oluştu' }}</p>
                        </div>
                        <Button variant="outline" size="sm" @click="refresh()">Tekrar Dene</Button>
                    </div>
                </CardContent>
            </Card>

            <div v-else-if="processedData.length > 0 && currentUserTarget" class="space-y-6">
                <Card v-for="category in processedData" :key="category.code">
                    <CardHeader>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border" :class="getCategoryColor(category.code)">
                                    {{ category.title }}
                                </span>
                                <span class="text-sm text-gray-500 dark:text-gray-400"> ({{ category.indicators.length }} gösterge) </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TargetIndicatorTable
                            v-if="userTargetId"
                            :indicators="category.indicators"
                            :year="Number(selectedYear)"
                            :user-target-id="userTargetId"
                            :category-id="category.id"
                            @refresh="handleRefresh"
                        />
                    </CardContent>
                </Card>
            </div>

            <Card v-else-if="processedData.length > 0 && !currentUserTarget">
                <CardContent class="pt-6">
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">Bu yıl için henüz hedef verisi oluşturulmamış.</div>
                </CardContent>
            </Card>

            <Card v-else>
                <CardContent class="pt-6">
                    <div class="text-center py-8">
                        <p class="text-gray-500 dark:text-gray-400">Henüz hedef verisi bulunmuyor.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
