<script setup lang="ts">
import type { FacultyTarget, Target } from '~/types'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import MiniSparklineChart from './MiniSparklineChart.vue'

const props = defineProps<{ facultyId: string }>()

const facultyId = computed(() => props.facultyId)

const { data, pending, error, refresh } = await useAsyncData(
    `faculty-targets-${facultyId.value}`,
    async () => {
        const [targetStructure, facultyTargets] = await Promise.all([
            useRequest<{ rows: Target[] }>('/manager/targets'),
            useRequest<FacultyTarget[]>(`/manager/faculty-targets`, {
                query: {
                    facultyId: facultyId.value,
                    onlyData: true,
                    includeAllYears: true
                }
            })
        ])

        return { targetStructure: targetStructure.rows[0], facultyTargets }
    },
    { lazy: true }
)

const processedData = computed(() => {
    if (!data.value) return []

    const { targetStructure, facultyTargets } = data.value
    if (!targetStructure) return []

    const categories: Array<{
        categoryCode: string
        categoryTitle: string
        status: string | null
        indicators: Array<{
            indicatorId: string
            indicatorName: string
            values: Record<number, number | null>
            status2026: string | null
            trend: 'up' | 'down' | 'stable'
        }>
    }> = []

    // Son 4 yıl
    const years = [2022, 2023, 2024, 2025, 2026]

    targetStructure.items.forEach((category) => {
        const indicators: Array<{
            indicatorId: string
            indicatorName: string
            values: Record<number, number | null>
            status2026: string | null
            trend: 'up' | 'down' | 'stable'
        }> = []

        const ft2026 = facultyTargets.find((ft) => ft.year === 2026)
        const categoryStatus = ft2026?.status ?? null

        category.indicators.forEach((indicator) => {
            const values: Record<number, number | null> = {}

            years.forEach((year) => {
                const yearData = facultyTargets.find((ft) => ft.year === year)

                if (yearData) {
                    const categoryData = yearData.data.find((d) => d.targetId === category.id)

                    if (categoryData) {
                        const indicatorData = categoryData.indicators.find((i) => i.indicatorId === indicator.id)
                        if (indicatorData) {
                            // 2026 ve sonrası için target, diğer yıllar için actual değerlerini oku
                            const value = year >= 2026 ? indicatorData.target : indicatorData.actual
                            values[year] = value === null || value === '-' ? null : Number(value) || null
                        } else {
                            values[year] = null
                        }
                    } else {
                        values[year] = null
                    }
                } else {
                    values[year] = null
                }
            })

            // Trend hesaplama
            const validValues = Object.values(values).filter((v) => v !== null) as number[]
            let trend: 'up' | 'down' | 'stable' = 'stable'

            if (validValues.length >= 2) {
                const first = validValues[0]!
                const last = validValues[validValues.length - 1]!
                if (last > first) trend = 'up'
                else if (last < first) trend = 'down'
            }

            const yearData2026 = facultyTargets.find((ft) => ft.year === 2026)
            const status2026 = yearData2026?.status ?? null

            indicators.push({
                indicatorId: indicator.id,
                indicatorName: indicator.indicator,
                values,
                status2026,
                trend
            })
        })

        categories.push({
            categoryCode: category.code,
            categoryTitle: category.title,
            status: categoryStatus,
            indicators
        })
    })

    return categories
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
</script>

<template>
    <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Fakülte Hedefleri</h2>

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
                    <AccordionItem v-for="category in processedData" :key="category.categoryCode" :value="category.categoryCode">
                        <AccordionTrigger class="text-left">
                            <div class="flex items-center gap-3">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border" :class="getCategoryColor(category.categoryCode)">
                                    {{ category.categoryTitle }}
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead>
                                        <tr class="border-b border-gray-200 dark:border-gray-700">
                                            <th class="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Gösterge</th>
                                            <th class="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">2022</th>
                                            <th class="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">2023</th>
                                            <th class="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">2024</th>
                                            <th class="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">2025</th>
                                            <th
                                                class="text-center py-3 px-2 text-sm font-medium italic"
                                                :class="category.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'"
                                            >
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger class="cursor-default">2026*</TooltipTrigger>
                                                        <TooltipContent>Hedef değerleri</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </th>
                                            <th class="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr
                                            v-for="indicator in category.indicators"
                                            :key="indicator.indicatorId"
                                            class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <!-- Gösterge Adı -->
                                            <td class="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">
                                                {{ indicator.indicatorName }}
                                            </td>

                                            <!-- Yıllık Değerler -->
                                            <td class="py-3 px-2 text-center text-sm text-gray-700 dark:text-gray-300">
                                                {{ indicator.values[2022] ?? '-' }}
                                            </td>
                                            <td class="py-3 px-2 text-center text-sm text-gray-700 dark:text-gray-300">
                                                {{ indicator.values[2023] ?? '-' }}
                                            </td>
                                            <td class="py-3 px-2 text-center text-sm text-gray-700 dark:text-gray-300">
                                                {{ indicator.values[2024] ?? '-' }}
                                            </td>
                                            <td class="py-3 px-2 text-center text-sm text-gray-700 dark:text-gray-300">
                                                {{ indicator.values[2025] ?? '-' }}
                                            </td>
                                            <td
                                                class="py-3 px-2 text-center text-sm font-medium italic"
                                                :class="indicator.status2026 === 'COMPLETED' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'"
                                            >
                                                {{ indicator.values[2026] ?? '-' }}
                                            </td>
                                            <!-- Trend Chart -->
                                            <td class="py-3 px-2 text-center">
                                                <MiniSparklineChart :values="indicator.values" :width="60" :height="20" />
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
