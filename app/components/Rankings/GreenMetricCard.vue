<script setup lang="ts">
import { TrendingUp, TrendingDown, Leaf, FileText } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import VChart from '@/components/VChart.vue'

// Veri tipi
interface RankingData {
    year: number
    score?: string
    rank: string
    si?: number // Yapı ve Altyapı
    ec?: number // Enerji ve İklim
    ws?: number // Atık
    wr?: number // Su
    tr?: number // Ulaşım
    ed?: number // Eğitim
}

// State
const isLoading = ref(true)
const data = ref<RankingData[]>([])
const isGuidelineOpen = ref(false)

// PDF URL
const guidelinePdfUrl = '/rankings/UI-GreenMetric-Guideline-2026.pdf'

// Veri yükleme
const loadGreenMetricData = async () => {
    try {
        isLoading.value = true
        const greenMetric = await $fetch<RankingData[]>('/rankings/green_metric.json')
        data.value = greenMetric.sort((a, b) => a.year - b.year)
    } catch (error) {
        console.error('GreenMetric verileri yüklenemedi:', error)
        $toast({
            title: 'Hata',
            description: 'GreenMetric sıralama verileri yüklenirken bir hata oluştu.',
            variant: 'destructive'
        })
    } finally {
        isLoading.value = false
    }
}

// Sayfa yüklendiğinde verileri çek
onMounted(() => {
    loadGreenMetricData()
})

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
        trend,
        trendPercent: previousRank ? Math.round((trend / previousRank) * 100) : 0
    }
}

// GreenMetric Dual Axis Chart Options
const greenMetricDualChartOptions = computed(() => {
    const years = data.value.map((d) => d.year.toString())
    const rankings = data.value.map((d) => {
        const rank = parseInt(d.rank)
        return rank === 0 ? null : rank // 0 ise null (boşluk)
    })
    const scores = data.value.map((d) => (d.score ? parseFloat(d.score) : null))

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            formatter: (params: any) => {
                let result = `<strong>${params[0].name}</strong><br/>`
                params.forEach((param: any) => {
                    if (param.seriesName === 'Sıralama') {
                        if (param.value === null) {
                            result += `${param.marker} ${param.seriesName}: Veri bulunamadı<br/>`
                        } else {
                            result += `${param.marker} ${param.seriesName}: ${param.value}. sıra<br/>`
                        }
                    } else {
                        result += `${param.marker} ${param.seriesName}: ${param.value} puan<br/>`
                    }
                })
                return result
            }
        },
        legend: {
            data: ['Sıralama', 'Skor'],
            bottom: 0
        },
        xAxis: {
            type: 'category',
            data: years,
            axisPointer: {
                type: 'shadow'
            }
        },
        yAxis: [
            {
                type: 'value',
                name: 'Sıralama',
                inverse: true, // Düşük sıra = daha iyi
                position: 'left',
                min: Math.min(...rankings.filter((r) => r !== null)) - 10, // En iyi sıradan 10 düşük
                max: Math.max(...rankings.filter((r) => r !== null)) + 10, // En kötü sıradan 10 yüksek
                axisLabel: {
                    formatter: '{value}. sıra'
                },
                splitLine: {
                    show: false
                }
            },
            {
                type: 'value',
                name: 'Skor',
                position: 'right',
                min: 0,
                max: Math.max(...scores.filter((s) => s !== null)) + 500, // En yüksek skordan 500 fazla
                axisLabel: {
                    formatter: '{value} puan'
                }
            }
        ],
        series: [
            {
                name: 'Sıralama',
                type: 'line',
                yAxisIndex: 0,
                data: rankings,
                lineStyle: {
                    color: '#ef4444',
                    width: 3
                },
                itemStyle: {
                    color: '#ef4444'
                },
                symbol: 'circle',
                symbolSize: 8,
                smooth: false
            },
            {
                name: 'Skor',
                type: 'bar',
                yAxisIndex: 1,
                data: scores,
                itemStyle: {
                    color: '#10b981',
                    opacity: 0.7
                },
                barWidth: '40%'
            }
        ]
    }
})

// Kategori chart seçenekleri oluşturma fonksiyonu
const createCategoryChartOptions = (category: string, dataKey: keyof RankingData, color: string) => {
    return computed(() => {
        const years = data.value.map((d) => d.year.toString())
        const values = data.value.map((d) => (d[dataKey] as number) || 0)

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

// Kategori chart seçenekleri
const siChartOptions = createCategoryChartOptions('Yapı ve Altyapı', 'si', '#10b981')
const ecChartOptions = createCategoryChartOptions('Enerji ve İklim', 'ec', '#f59e0b')
const wsChartOptions = createCategoryChartOptions('Atık', 'ws', '#ef4444')
const wrChartOptions = createCategoryChartOptions('Su', 'wr', '#3b82f6')
const trChartOptions = createCategoryChartOptions('Ulaşım', 'tr', '#8b5cf6')
const edChartOptions = createCategoryChartOptions('Eğitim', 'ed', '#06b6d4')

// Computed stats
const greenMetricStats = computed(() => calculateStats(data.value))
</script>

<template>
    <Card>
        <CardHeader>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <Leaf class="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <CardTitle>GreenMetric World University Rankings</CardTitle>
                        <CardDescription>Sürdürülebilirlik ve çevre performansı sıralaması</CardDescription>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-green-600">{{ greenMetricStats?.currentRank }}. sıra</div>
                    <div class="flex items-center gap-1 text-sm text-muted-foreground">
                        <span v-if="greenMetricStats?.trend && greenMetricStats.trend !== 0"> {{ greenMetricStats.trend > 0 ? '+' : '' }}{{ greenMetricStats.trend }} sıra </span>
                        <TrendingUp v-if="greenMetricStats?.trend && greenMetricStats.trend > 0" class="w-4 h-4 text-green-600" />
                        <TrendingDown v-else-if="greenMetricStats?.trend && greenMetricStats.trend < 0" class="w-4 h-4 text-red-600" />
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
            <!-- Dual Axis Chart: Sıralama + Skor -->
            <div class="space-y-6">
                <div class="h-80">
                    <VChart :option="greenMetricDualChartOptions" style="width: 100%; height: 100%" />
                </div>

                <!-- Kategori Detay Grafikleri - 3x2 Grid -->
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <!-- Yapı ve Altyapı -->
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yapı ve Altyapı (SI)</h5>
                            <div class="h-32">
                                <VChart :option="siChartOptions" style="width: 100%; height: 100%" />
                            </div>
                        </div>

                        <!-- Enerji ve İklim -->
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enerji ve İklim (EC)</h5>
                            <div class="h-32">
                                <VChart :option="ecChartOptions" style="width: 100%; height: 100%" />
                            </div>
                        </div>

                        <!-- Atık -->
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Atık (WS)</h5>
                            <div class="h-32">
                                <VChart :option="wsChartOptions" style="width: 100%; height: 100%" />
                            </div>
                        </div>

                        <!-- Su -->
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Su (WR)</h5>
                            <div class="h-32">
                                <VChart :option="wrChartOptions" style="width: 100%; height: 100%" />
                            </div>
                        </div>

                        <!-- Ulaşım -->
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ulaşım (TR)</h5>
                            <div class="h-32">
                                <VChart :option="trChartOptions" style="width: 100%; height: 100%" />
                            </div>
                        </div>

                        <!-- Eğitim -->
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eğitim (ED)</h5>
                            <div class="h-32">
                                <VChart :option="edChartOptions" style="width: 100%; height: 100%" />
                            </div>
                        </div>
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
                    GreenMetric Kılavuzu 2026
                </SheetTitle>
                <SheetDescription> UI GreenMetric World University Rankings değerlendirme kılavuzu </SheetDescription>
            </SheetHeader>
            <div class="flex-1 p-6 pt-0">
                <div class="w-full h-[calc(100vh-120px)] border rounded-lg overflow-hidden">
                    <iframe :src="guidelinePdfUrl" class="w-full h-full" title="GreenMetric Kılavuzu 2026" loading="lazy" />
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>
