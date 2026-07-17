<script setup lang="ts">
import { TrendingUp, TrendingDown, Award, FileText } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'

// ECharts imports
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register ECharts components
echarts.use([LineChart, BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

// Veri tipi
interface RankingData {
    year: number
    rank: string
    rank_display: string
    // QS Kategorileri
    'Research & Discovery'?: {
        'Citations per Faculty'?: number
        'Academic Reputation'?: number
    }
    'Learning Experience'?: {
        'Faculty Student Ratio'?: number
    }
    Employability?: {
        'Employer Reputation'?: number
        'Employment Outcomes'?: number
    }
    'Global Engagement'?: {
        'International Student Ratio'?: number
        'International Research Network'?: number
        'International Faculty Ratio'?: number
    }
    Sustainability?: {
        'Sustainability Score'?: number
    }
}

const { data: qsRawData } = await useFetch<RankingData[]>('/rankings/qs.json', {
    server: false
})
const data = computed<RankingData[]>(() => {
    if (!qsRawData.value) return []
    return [...qsRawData.value].sort((a, b) => a.year - b.year)
})

// QS Methodology URL
const methodologyUrl = 'https://www.topuniversities.com/world-university-rankings/methodology'

// Link açma fonksiyonu
const openMethodologyLink = () => {
    window.open(methodologyUrl, '_blank', 'noopener,noreferrer')
}

// Veri hazır, herhangi bir yükleme gerekmiyor

// İstatistik hesaplama fonksiyonu
const calculateStats = (data: RankingData[]) => {
    if (!data.length) return null

    const ranks: number[] = data.map((d) => parseInt(d.rank)).filter((r: number) => r > 0)

    if (ranks.length === 0) return null

    const bestRank = Math.min(...ranks)
    const worstRank = Math.max(...ranks)
    let currentRank: number = ranks[ranks.length - 1]

    if (!currentRank || currentRank === 0) {
        const validRanks = ranks.filter((r: number) => r > 0)
        currentRank = validRanks.length > 0 ? validRanks[validRanks.length - 1] : 1
    }

    const previousRank: number = ranks.length > 1 ? ranks[ranks.length - 2] : currentRank
    const trend = previousRank - currentRank // Pozitif ise yükseliş

    return {
        bestRank,
        worstRank,
        currentRank,
        currentRankDisplay: data[data.length - 1]?.rank_display || currentRank.toString(),
        trend,
        trendPercent: previousRank ? Math.round((trend / previousRank) * 100) : 0
    }
}

// QS World University Rankings Chart Options
const qsChartOptions = computed(() => {
    const years = data.value.map((d) => d.year.toString())
    const rankings = data.value.map((d) => parseInt(d.rank))
    const rankingSeriesData = data.value.map((d) => ({
        value: parseInt(d.rank),
        rankDisplay: d.rank_display
    }))

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const param = params[0]
                return `<strong>${param.name}</strong><br/>${param.marker} Sıralama: ${param.data.rankDisplay}`
            }
        },
        grid: {
            top: 40,
            left: '8%',
            right: '5%',
            bottom: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: years
        },
        yAxis: {
            type: 'value',
            inverse: true, // Düşük sıra = daha iyi
            min: Math.min(...rankings) - 20,
            max: Math.max(...rankings) + 20,
            axisLabel: {
                formatter: '{value}. sıra'
            }
        },
        series: [
            {
                name: 'Sıralama',
                type: 'line',
                data: rankingSeriesData,
                lineStyle: {
                    color: '#2563eb',
                    width: 3
                },
                itemStyle: {
                    color: '#2563eb'
                },
                symbol: 'circle',
                symbolSize: 8,
                smooth: false
            }
        ]
    }
})

// QS Kategori Chart Seçenekleri
const createQSCategoryChartOptions = (category: string, mainCategory: keyof RankingData, subCategory: string, color: string) => {
    return computed(() => {
        const years = data.value.map((d) => d.year.toString())
        const values = data.value.map((d) => {
            const main = d[mainCategory] as any
            return main?.[subCategory] || 0
        })

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                    const param = params[0]
                    return `<strong>${param.name}</strong><br/>${param.marker} ${category}: ${param.value} puan`
                }
            },
            grid: {
                left: '15%',
                right: '5%',
                top: '15%',
                bottom: '20%'
            },
            xAxis: {
                type: 'category',
                data: years,
                axisLabel: {
                    fontSize: 10
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    fontSize: 10,
                    formatter: '{value}'
                },
                min: 0
            },
            series: [
                {
                    type: 'bar',
                    data: values,
                    itemStyle: {
                        color: color,
                        borderRadius: [2, 2, 0, 0]
                    },
                    barWidth: '60%'
                }
            ]
        }
    })
}

// QS Kategori Chart Options
const citationsChartOptions = createQSCategoryChartOptions('Citations per Faculty', 'Research & Discovery', 'Citations per Faculty', '#10b981')
const academicReputationChartOptions = createQSCategoryChartOptions('Academic Reputation', 'Research & Discovery', 'Academic Reputation', '#059669')
const facultyStudentChartOptions = createQSCategoryChartOptions('Faculty Student Ratio', 'Learning Experience', 'Faculty Student Ratio', '#3b82f6')
const employerReputationChartOptions = createQSCategoryChartOptions('Employer Reputation', 'Employability', 'Employer Reputation', '#f59e0b')
const employmentOutcomesChartOptions = createQSCategoryChartOptions('Employment Outcomes', 'Employability', 'Employment Outcomes', '#d97706')
const intlStudentRatioChartOptions = createQSCategoryChartOptions('International Student Ratio', 'Global Engagement', 'International Student Ratio', '#8b5cf6')
const intlResearchNetworkChartOptions = createQSCategoryChartOptions('International Research Network', 'Global Engagement', 'International Research Network', '#7c3aed')
const intlFacultyRatioChartOptions = createQSCategoryChartOptions('International Faculty Ratio', 'Global Engagement', 'International Faculty Ratio', '#6d28d9')
const sustainabilityChartOptions = createQSCategoryChartOptions('Sustainability Score', 'Sustainability', 'Sustainability Score', '#06b6d4')

// Computed stats
const qsStats = computed(() => calculateStats(data.value))
</script>

<template>
    <Card>
        <CardHeader>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Award class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle>QS World University Rankings</CardTitle>
                        <CardDescription>Dünya üniversiteleri akademik performans sıralaması</CardDescription>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-blue-600">{{ qsStats?.currentRankDisplay }}</div>
                    <div class="flex items-center gap-1 text-sm text-muted-foreground">
                        <span v-if="qsStats?.trend && qsStats.trend !== 0"> {{ qsStats.trend > 0 ? '+' : '' }}{{ qsStats.trend }} sıra </span>
                        <TrendingUp v-if="qsStats?.trend && qsStats.trend > 0" class="w-4 h-4 text-green-600" />
                        <TrendingDown v-else-if="qsStats?.trend && qsStats.trend < 0" class="w-4 h-4 text-red-600" />
                    </div>
                    <div class="mt-2">
                        <Button variant="outline" size="sm" class="gap-2" @click="openMethodologyLink">
                            <FileText class="w-4 h-4" />
                            Kılavuz
                        </Button>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <!-- Ana QS Grafiği -->
            <div class="space-y-6">
                <div class="h-80">
                    <VChart :option="qsChartOptions" style="width: 100%; height: 100%" />
                </div>

                <!-- QS Kategori Detay Grafikleri -->
                <div class="space-y-4">
                    <!-- Research & Discovery -->
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Research & Discovery</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Citations per Faculty</h5>
                                <div class="h-32">
                                    <VChart :option="citationsChartOptions" style="width: 100%; height: 100%" />
                                </div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Academic Reputation</h5>
                                <div class="h-32">
                                    <VChart :option="academicReputationChartOptions" style="width: 100%; height: 100%" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Employability -->
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Employability</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Employer Reputation</h5>
                                <div class="h-32">
                                    <VChart :option="employerReputationChartOptions" style="width: 100%; height: 100%" />
                                </div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Employment Outcomes</h5>
                                <div class="h-32">
                                    <VChart :option="employmentOutcomesChartOptions" style="width: 100%; height: 100%" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Learning Experience & Sustainability - Yan Yana -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <!-- Learning Experience -->
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Learning Experience</h4>
                            <div class="grid grid-cols-1 gap-4">
                                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                    <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Faculty Student Ratio</h5>
                                    <div class="h-32">
                                        <VChart :option="facultyStudentChartOptions" style="width: 100%; height: 100%" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sustainability -->
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Sustainability</h4>
                            <div class="grid grid-cols-1 gap-4">
                                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                    <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Sustainability Score</h5>
                                    <div class="h-32">
                                        <VChart :option="sustainabilityChartOptions" style="width: 100%; height: 100%" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Global Engagement -->
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Global Engagement</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">International Student Ratio</h5>
                                <div class="h-32">
                                    <VChart :option="intlStudentRatioChartOptions" style="width: 100%; height: 100%" />
                                </div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">International Research Network</h5>
                                <div class="h-32">
                                    <VChart :option="intlResearchNetworkChartOptions" style="width: 100%; height: 100%" />
                                </div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">International Faculty Ratio</h5>
                                <div class="h-32">
                                    <VChart :option="intlFacultyRatioChartOptions" style="width: 100%; height: 100%" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
