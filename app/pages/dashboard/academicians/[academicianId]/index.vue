<script setup lang="ts">
import type { User } from '~/types'
import { ScrollText, Shapes, BrainCircuit, Award } from 'lucide-vue-next'
import TargetsCard from '~/components/Admin/Academician/TargetsCard.vue'
import DataList from '~/components/Admin/Academician/DataList.vue'
import AcademicianLineChart from '~/components/Charts/specialized/AcademicianLineChart.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

const route = useRoute()

const academicianId = computed(() => route.params.academicianId as string)

// Get academician from parent layout
const academician = inject<ComputedRef<User | null>>('academician')

// Computed values from statsData
const totals = computed(() => {
    if (!statsData.value?.stats) {
        return {
            articles: 0,
            projects: 0,
            prizes: 0,
            patents: 0
        }
    }
    return {
        articles: statsData.value.stats.articles.total,
        projects: statsData.value.stats.projects.total,
        prizes: statsData.value.stats.prizes.total,
        patents: statsData.value.stats.patents.total
    }
})

const yearlyDistribution = computed(() => {
    if (!statsData.value?.stats) return null

    const stats = statsData.value.stats
    const years = Object.keys(stats.articles.byYear).sort()

    return {
        years,
        articles: years.map((year) => stats.articles.byYear[year] || 0),
        projects: years.map((year) => stats.projects.byYear[year] || 0),
        prizes: years.map((year) => stats.prizes.byYear[year] || 0),
        patents: years.map((year) => stats.patents.byYear[year] || 0)
    }
})

const refreshAll = () => {
    refreshStats()
}

const {
    data: statsData,
    pending: statsPending,
    error: statsError,
    refresh: refreshStats
} = await useAsyncData(
    `admin-academician-stats-${route.params.academicianId}`,
    async () => {
        return await useRequest<{
            stats: {
                articles: {
                    total: number
                    byYear: Record<string, number>
                }
                patents: {
                    total: number
                    byYear: Record<string, number>
                }
                projects: {
                    total: number
                    byYear: Record<string, number>
                }
                prizes: {
                    total: number
                    byYear: Record<string, number>
                }
            }
            summary: {
                totalActivities: number
                mostActiveYear: string | null
                activitiesThisYear: number
            }
        }>(`/manager/users/${route.params.academicianId}/stats`, {
            method: 'GET'
        })
    },
    { lazy: true }
)
</script>

<template>
    <div class="flex-1 px-4 pb-8 md:px-8 md:pb-10">
        <div class="mx-auto w-full max-w-7xl h-full">
            <!-- İstatistik Kartları -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <!-- Stats Loading State -->
                <template v-if="statsPending">
                    <div v-for="i in 4" :key="i" class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="space-y-2">
                                <Skeleton class="h-4 w-24" />
                                <Skeleton class="h-8 w-16" />
                            </div>
                            <Skeleton class="h-12 w-12 rounded-lg" />
                        </div>
                    </div>
                </template>

                <!-- Stats Error State -->
                <template v-else-if="statsError">
                    <div class="col-span-full bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div class="text-center py-8 space-y-4">
                            <div class="text-red-600 dark:text-red-400">
                                <p class="font-medium">İstatistik verileri yüklenemedi</p>
                                <p class="text-sm mt-1">{{ statsError.message || 'Bilinmeyen bir hata oluştu' }}</p>
                            </div>
                            <Button variant="outline" size="sm" @click="refreshAll()">Tekrar Dene</Button>
                        </div>
                    </div>
                </template>

                <!-- İstatistik Kartları Content -->
                <template v-else>
                    <!-- Makale Sayısı -->
                    <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Makale</p>
                                    <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">2019-2025</span>
                                </div>
                                <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {{ totals.articles }}
                                </p>
                            </div>
                            <div class="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center ml-4">
                                <ScrollText class="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <!-- Proje Sayısı -->
                    <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Proje</p>
                                    <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">2024-2025</span>
                                </div>
                                <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {{ totals.projects }}
                                </p>
                            </div>
                            <div class="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center ml-4">
                                <Shapes class="w-7 h-7 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>

                    <!-- Patent Sayısı -->
                    <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Patent</p>
                                    <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">2022-2025</span>
                                </div>
                                <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {{ totals.patents }}
                                </p>
                            </div>
                            <div class="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center ml-4">
                                <BrainCircuit class="w-7 h-7 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>

                    <!-- Ödül Sayısı -->
                    <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Ödül</p>
                                    <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">2024-2025</span>
                                </div>
                                <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {{ totals.prizes }}
                                </p>
                            </div>
                            <div class="w-14 h-14 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center ml-4">
                                <Award class="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Akademisyen Performans Chart'ı -->
            <div class="mb-6">
                <!-- Stats Loading State -->
                <div v-if="statsPending" class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div class="space-y-4">
                        <Skeleton class="h-6 w-48" />
                        <div class="flex items-center gap-4 mb-4">
                            <Skeleton class="h-4 w-20" />
                            <Skeleton class="h-4 w-24" />
                            <Skeleton class="h-4 w-20" />
                            <Skeleton class="h-4 w-24" />
                        </div>
                        <Skeleton class="h-64 w-full rounded" />
                    </div>
                </div>

                <!-- Stats Error State -->
                <div v-else-if="statsError" class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div class="text-center py-8 space-y-4">
                        <div class="text-red-600 dark:text-red-400">
                            <p class="font-medium">Performans verileri yüklenemedi</p>
                            <p class="text-sm mt-1">{{ statsError.message || 'Bilinmeyen bir hata oluştu' }}</p>
                        </div>
                        <Button variant="outline" size="sm" @click="refreshAll()">Tekrar Dene</Button>
                    </div>
                </div>

                <!-- Stats Content -->
                <div v-else-if="yearlyDistribution">
                    <AcademicianLineChart :academician-full-name="formatUserName(academician || null)" :yearly-data="yearlyDistribution" :totals="totals" />
                </div>

                <!-- Stats Empty State -->
                <div v-else class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div class="text-center py-8">
                        <p class="text-gray-500 dark:text-gray-400">İstatistik verileri bulunamadı.</p>
                    </div>
                </div>
            </div>

            <!-- Akademisyen Hedefleri -->
            <div class="mb-6">
                <TargetsCard :academician-id="academicianId" />
            </div>

            <!-- Akademisyen Makaleleri -->
            <div class="mb-6">
                <DataList :academician-id="academicianId" type="articles" />
            </div>

            <!-- Akademisyen Projeleri -->
            <div class="mb-6">
                <DataList :academician-id="academicianId" type="projects" />
            </div>

            <!-- Akademisyen Ödülleri -->
            <div class="mb-6">
                <DataList :academician-id="academicianId" type="prizes" />
            </div>

            <!-- Akademisyen Patentleri -->
            <div class="mb-6">
                <DataList :academician-id="academicianId" type="patents" />
            </div>
        </div>
    </div>
</template>
