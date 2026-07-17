<script setup lang="ts">
import type { Target, TargetItems, TargetIndicator, UserTarget, UserTargetIndicator, User } from '~/types'
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import TargetIndicatorTable from '@/components/Admin/Academician/TargetIndicatorTable.vue'

const route = useRoute()
const router = useRouter()

const academicianId = computed(() => route.params.academicianId as string)

// Get academician from parent layout
const academician = inject<ComputedRef<User | null>>('academician')

// Yıl yönetimi
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear.toString())
const availableYears = computed(() => {
    // Son 2 yıl + mevcut yıl (gelecek yıl kaldırıldı)
    return Array.from({ length: 3 }, (_, i) => currentYear - 2 + i).reverse()
})

// API çağrıları
const { data, pending, error, refresh } = await useAsyncData(
    `academician-targets-detail-${academicianId.value}`,
    async () => {
        const [targetStructureResponse, userTargetsResponse] = await Promise.all([
            useRequest<{ rows: Target[] }>('/manager/targets'),
            useRequest<UserTarget[]>('/manager/user-targets', {
                query: {
                    userId: academicianId.value,
                    onlyData: true
                }
            })
        ])

        return {
            targetStructure: targetStructureResponse?.rows?.[0],
            academicianTargets: userTargetsResponse || []
        }
    },
    { lazy: true }
)

// Veri işleme - Seçili yıla göre
const processedData = computed(() => {
    if (!data.value) return []

    const { targetStructure, academicianTargets } = data.value as {
        targetStructure: Target
        academicianTargets: UserTarget[]
    }

    if (!targetStructure?.items) return []

    const year = Number(selectedYear.value)
    const yearData = academicianTargets.find((at: UserTarget) => at.year === year)

    return targetStructure.items.map((category: TargetItems) => {
        const categoryData = yearData?.data.find((d: UserTargetIndicator) => d.targetId === category.id)

        return {
            id: category.id,
            code: category.code,
            title: category.title,
            weight: category.weight,
            indicators: category.indicators
                .filter((indicator: TargetIndicator) => indicator.isAcademicianIndicator)
                .map((indicator: TargetIndicator) => {
                    const indicatorData = categoryData?.indicators.find((i) => i.indicatorId === indicator.id)

                    return {
                        id: indicator.id,
                        indicator: indicator.indicator,
                        description: indicator.description,
                        target: indicatorData?.target ?? null,
                        actual: indicatorData?.actual ?? null,
                        minValue: indicator.minValue,
                        maxValue: indicator.maxValue,
                        weight: indicator.weight
                    }
                })
        }
    })
})

// UserTarget ID'sini bul (güncelleme için gerekli)
const userTargetId = computed(() => {
    if (!data.value) return null
    const year = Number(selectedYear.value)
    const yearData = data.value.academicianTargets.find((at: UserTarget) => at.year === year)
    return yearData?.id || null
})

// Kategori renkleri
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

const handleRefresh = () => {
    refresh()
}
</script>

<template>
    <div class="flex-1 px-4 pb-8 md:px-8 md:pb-10">
        <div class="mx-auto w-full max-w-7xl">
            <!-- Başlık, Geri Butonu ve Yıl Seçici -->
            <div class="mb-6">
                <div class="flex items-center justify-between gap-4 mb-2">
                    <div class="flex items-center gap-3">
                        <Button variant="ghost" size="icon" class="h-8 w-8" @click="router.back()">
                            <ArrowLeft class="w-4 h-4" />
                        </Button>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Hedef Yönetimi</h1>
                    </div>

                    <!-- Yıl Seçici -->
                    <div class="flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <Label class="text-sm font-medium text-gray-600 dark:text-gray-400">Yıl:</Label>
                        <Select v-model="selectedYear">
                            <SelectTrigger class="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="year in availableYears" :key="year" :value="year.toString()">
                                    {{ year }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 ml-11">Akademisyen hedeflerini yıl bazında görüntüleyin ve düzenleyin</p>
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="space-y-6">
                <Card v-for="i in 3" :key="i">
                    <CardHeader>
                        <Skeleton class="h-8 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div class="space-y-3">
                            <Skeleton class="h-12 w-full" />
                            <Skeleton class="h-12 w-full" />
                            <Skeleton class="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Error State -->
            <Card v-else-if="error">
                <CardContent class="pt-6">
                    <div class="text-center py-8 space-y-4">
                        <div class="text-red-600 dark:text-red-400">
                            <p class="font-medium">Hedef verileri yüklenemedi</p>
                            <p class="text-sm mt-1">{{ error.message || 'Bilinmeyen bir hata oluştu' }}</p>
                        </div>
                        <Button variant="outline" size="sm" @click="refresh()">Tekrar Dene</Button>
                    </div>
                </CardContent>
            </Card>

            <!-- Hedef Kategorileri -->
            <div v-else-if="processedData.length > 0" class="space-y-6">
                <Card v-for="category in processedData" :key="category.code">
                    <CardHeader>
                        <div class="flex items-center gap-3">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border" :class="getCategoryColor(category.code)">
                                {{ category.title }}
                            </span>
                            <span class="text-sm text-gray-500 dark:text-gray-400"> ({{ category.indicators.length }} gösterge) </span>
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
                        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">Bu yıl için henüz hedef verisi oluşturulmamış.</div>
                    </CardContent>
                </Card>
            </div>

            <!-- Empty State -->
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
