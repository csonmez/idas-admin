<script setup lang="ts">
import { TrendingUp, TrendingDown, BarChart3, FileText } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'

// ECharts imports
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register ECharts components
echarts.use([LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

// Veri tipi
interface RankingData {
    year: number
    rank: number | string
}

// JSON veriyi useFetch ile al
const { data: theWorldRawData } = await useFetch<RankingData[]>('/rankings/the_world.json', {
    server: false
})

const data = computed<RankingData[]>(() => {
    if (!theWorldRawData.value) return []
    return [...theWorldRawData.value].sort((a, b) => a.year - b.year)
})
const isGuidelineOpen = ref(false)

// PDF URL
const guidelinePdfUrl = '/rankings/THE-world-guideline-2026.pdf'

const getRankValue = (rank: RankingData['rank']) => {
    if (typeof rank === 'number') return rank

    const rankParts = rank.match(/\d+/g)?.map(Number) || []
    if (rankParts.length >= 2) {
        return Math.round(((rankParts[0] || 0) + (rankParts[1] || 0)) / 2)
    }

    return rankParts[0] || 0
}

const getRankDisplay = (rank: RankingData['rank']) => rank.toString()

// İstatistik hesaplama fonksiyonu
const calculateStats = (data: RankingData[]) => {
    if (!data.length) return null

    const rankEntries = data
        .map((d) => ({
            value: getRankValue(d.rank),
            display: getRankDisplay(d.rank)
        }))
        .filter((entry) => entry.value > 0)

    if (rankEntries.length === 0) return null

    const bestRank = Math.min(...rankEntries.map((entry) => entry.value))
    const worstRank = Math.max(...rankEntries.map((entry) => entry.value))
    const bestRankDisplay = rankEntries.find((entry) => entry.value === bestRank)?.display || bestRank.toString()
    const worstRankDisplay = rankEntries.find((entry) => entry.value === worstRank)?.display || worstRank.toString()
    let currentRankEntry = rankEntries[rankEntries.length - 1] || { value: 1, display: '1' }

    if (!currentRankEntry?.value || currentRankEntry.value === 0) {
        currentRankEntry = rankEntries[rankEntries.length - 1] || { value: 1, display: '1' }
    }

    const previousRankEntry = rankEntries[rankEntries.length - 2]
    const previousRank: number = previousRankEntry ? previousRankEntry.value : currentRankEntry.value
    const trend = previousRank - currentRankEntry.value // Pozitif ise yükseliş

    return {
        bestRank,
        bestRankDisplay,
        worstRank,
        worstRankDisplay,
        currentRank: currentRankEntry.value,
        currentRankDisplay: currentRankEntry.display,
        trend,
        trendPercent: previousRank ? Math.round((trend / previousRank) * 100) : 0
    }
}

// THE World University Rankings Chart Options
const theWorldChartOptions = computed(() => {
    const years = data.value.map((d) => d.year.toString())
    const rankings = data.value.map((d) => getRankValue(d.rank))
    const rankDisplays = data.value.map((d) => getRankDisplay(d.rank))

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const param = params[0]
                return `<strong>${param.name}</strong><br/>${param.marker} Sıralama: ${rankDisplays[param.dataIndex]}`
            }
        },
        grid: {
            left: '10%',
            right: '5%',
            top: '15%',
            bottom: '15%'
        },
        xAxis: {
            type: 'category',
            data: years,
            axisLabel: {
                fontSize: 12
            }
        },
        yAxis: {
            type: 'value',
            inverse: true, // Düşük sıra = daha iyi
            min: Math.min(...rankings) - 50,
            max: Math.max(...rankings) + 50,
            axisLabel: {
                formatter: '{value}. sıra',
                fontSize: 12
            },
            splitLine: {
                lineStyle: {
                    color: '#e5e7eb',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: 'Sıralama',
                type: 'line',
                data: rankings,
                lineStyle: {
                    color: '#f59e0b',
                    width: 3
                },
                itemStyle: {
                    color: '#f59e0b',
                    borderColor: '#ffffff',
                    borderWidth: 2
                },
                symbol: 'circle',
                symbolSize: 8,
                smooth: false,
                emphasis: {
                    scale: 1.2
                },
                markPoint: {
                    data: [
                        {
                            type: 'min',
                            name: 'En İyi Sıra',
                            itemStyle: {
                                color: '#10b981'
                            }
                        },
                        {
                            type: 'max',
                            name: 'En Kötü Sıra',
                            itemStyle: {
                                color: '#ef4444'
                            }
                        }
                    ]
                }
            }
        ]
    }
})

// Computed stats
const theWorldStats = computed(() => calculateStats(data.value))
</script>

<template>
    <Card>
        <CardHeader>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                        <BarChart3 class="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <CardTitle>THE World University Rankings</CardTitle>
                        <CardDescription>Dünya üniversiteleri genel performans sıralaması</CardDescription>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-amber-600">{{ theWorldStats?.currentRankDisplay }}</div>
                    <div class="flex items-center gap-1 text-sm text-muted-foreground">
                        <span v-if="theWorldStats?.trend && theWorldStats.trend !== 0"> {{ theWorldStats.trend > 0 ? '+' : '' }}{{ theWorldStats.trend }} sıra </span>
                        <TrendingUp v-if="theWorldStats?.trend && theWorldStats.trend > 0" class="w-4 h-4 text-green-600" />
                        <TrendingDown v-else-if="theWorldStats?.trend && theWorldStats.trend < 0" class="w-4 h-4 text-red-600" />
                    </div>
                    <div class="mt-2">
                        <Sheet v-model:open="isGuidelineOpen">
                            <SheetTrigger as-child>
                                <Button variant="outline" size="sm" class="gap-2">
                                    <FileText class="w-4 h-4" />
                                    Kılavuz
                                </Button>
                            </SheetTrigger>
                        </Sheet>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div class="space-y-6">
                <!-- Ana THE World Grafiği -->
                <div class="h-80">
                    <VChart :option="theWorldChartOptions" style="width: 100%; height: 100%" />
                </div>

                <!-- İstatistik Özeti -->
                <div v-if="theWorldStats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-amber-600">{{ theWorldStats.currentRankDisplay }}</div>
                        <div class="text-sm text-muted-foreground">Güncel Sıra</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-green-600">{{ theWorldStats.bestRankDisplay }}</div>
                        <div class="text-sm text-muted-foreground">En İyi Sıra</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-red-600">{{ theWorldStats.worstRankDisplay }}</div>
                        <div class="text-sm text-muted-foreground">En Kötü Sıra</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold" :class="theWorldStats.trend > 0 ? 'text-green-600' : theWorldStats.trend < 0 ? 'text-red-600' : 'text-gray-600'">
                            {{ theWorldStats.trend > 0 ? '+' : '' }}{{ theWorldStats.trend }}
                        </div>
                        <div class="text-sm text-muted-foreground">Geçen Yıldan Değişim</div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>

    <!-- Kılavuz PDF Sheet -->
    <Sheet v-model:open="isGuidelineOpen">
        <SheetContent side="right" class="!w-[90vw] !max-w-[90vw] p-0" style="width: 65vw !important; max-width: 65vw !important">
            <SheetHeader class="p-6 pb-0">
                <SheetTitle class="flex items-center gap-2">
                    <FileText class="w-5 h-5" />
                    THE World University Rankings Kılavuzu 2026
                </SheetTitle>
                <SheetDescription> THE World University Rankings değerlendirme kılavuzu </SheetDescription>
            </SheetHeader>
            <div class="flex-1 p-6 pt-0">
                <div class="w-full h-[calc(100vh-120px)] border rounded-lg overflow-hidden">
                    <iframe :src="guidelinePdfUrl" class="w-full h-full" title="THE World University Rankings Kılavuzu 2026" loading="lazy" />
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>
