<script setup lang="ts">
import type { Target, TargetItems, TargetIndicator, UserTarget, UserTargetIndicator } from '~/types'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { ListChecks } from 'lucide-vue-next'
import MiniSparklineChart from '@/components/Admin/Academician/MiniSparklineChart.vue'

const props = defineProps<{ academicianId: string }>()
const router = useRouter()

const academicianId = computed(() => props.academicianId)

const { data, pending, error, refresh } = await useAsyncData(
    `academician-targets-${academicianId.value}`,
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

// Veri işleme - Kategorilere göre gruplama
const processedData = computed(() => {
    if (!data.value) return []

    const { targetStructure, academicianTargets } = data.value as {
        targetStructure: Target
        academicianTargets: UserTarget[]
    }

    if (!targetStructure?.items) return []

    const years = [2023, 2024, 2025]

    return targetStructure.items.map((category: TargetItems) => {
        const categoryData = {
            code: category.code,
            title: category.title,
            weight: category.weight,
            indicators: category.indicators.map((indicator: TargetIndicator) => {
                const yearlyValues: { [key: number]: number | null } = {}
                const trends: number[] = []

                years.forEach((year: number) => {
                    const yearData = academicianTargets.find((at: UserTarget) => at.year === year)

                    if (yearData) {
                        const categoryData = yearData.data.find((d: UserTargetIndicator) => d.targetId === category.id)

                        if (categoryData) {
                            const indicatorData = categoryData.indicators.find((i) => i.indicatorId === indicator.id)

                            if (indicatorData) {
                                const value = indicatorData.actual !== undefined ? indicatorData.actual : indicatorData.target
                                yearlyValues[year] = value
                            } else {
                                yearlyValues[year] = null
                            }
                        } else {
                            yearlyValues[year] = null
                        }
                    } else {
                        yearlyValues[year] = null
                    }
                })

                // Calculate trend for the last 4 years
                const values = years.map((year) => yearlyValues[year] || 0)
                trends.push(...values)

                return {
                    id: indicator.id,
                    indicator: indicator.indicator,
                    weight: indicator.weight,
                    yearlyValues,
                    trend: trends
                }
            })
        }

        return categoryData
    })
})

// Kategori renkleri
const getCategoryColor = (code: string) => {
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

// Navigasyon fonksiyonu
const navigateToTargets = () => {
    router.push(`/dashboard/academicians/${props.academicianId}/targets`)
}
</script>

<template>
    <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Akademisyen Hedefleri</h2>
                <Button variant="outline" size="sm" @click="navigateToTargets">
                    <ListChecks class="w-4 h-4 mr-2" />
                    Detaylı Göster
                </Button>
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="space-y-4">
                <Skeleton class="h-6 w-32 mb-4" />
                <div class="space-y-3">
                    <div v-for="i in 6" :key="i" class="space-y-2">
                        <Skeleton class="h-10 w-full" />
                        <div class="pl-4 space-y-1">
                            <Skeleton class="h-4 w-3/4" />
                            <Skeleton class="h-4 w-1/2" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-8 space-y-4">
                <div class="text-red-600 dark:text-red-400">
                    <p class="font-medium">Hedef verileri yüklenemedi</p>
                    <p class="text-sm mt-1">{{ error.message || 'Bilinmeyen bir hata oluştu' }}</p>
                </div>
                <Button variant="outline" size="sm" @click="refresh()"> Tekrar Dene </Button>
            </div>

            <!-- Accordion Categories -->
            <div v-else-if="processedData.length > 0">
                <Accordion type="single" collapsible class="w-full">
                    <AccordionItem v-for="category in processedData" :key="category.code" :value="category.code">
                        <AccordionTrigger class="text-left">
                            <div class="flex items-center gap-3">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border" :class="getCategoryColor(category.code)">
                                    {{ category.title }}
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead>
                                        <tr class="border-b border-gray-200 dark:border-gray-700">
                                            <th class="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Gösterge</th>
                                            <th
                                                v-for="year in [new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear()]"
                                                :key="year"
                                                class="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400"
                                            >
                                                {{ year }}
                                            </th>
                                            <th class="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="indicator in category.indicators" :key="indicator.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <!-- Gösterge Adı -->
                                            <td class="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">
                                                {{ indicator.indicator }}
                                            </td>

                                            <!-- Yıllık Değerler -->
                                            <td
                                                v-for="year in [new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear()]"
                                                :key="year"
                                                class="py-3 px-2 text-center text-sm text-gray-700 dark:text-gray-300"
                                            >
                                                {{ indicator.yearlyValues[year] ?? '-' }}
                                            </td>

                                            <!-- Trend Chart -->
                                            <td class="py-3 px-2 text-center">
                                                <MiniSparklineChart :values="indicator.yearlyValues" :width="60" :height="20" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">Henüz hedef verisi bulunmuyor.</p>
            </div>
        </div>
    </div>
</template>
