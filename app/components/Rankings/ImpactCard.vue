<script setup lang="ts">
import { TrendingUp, TrendingDown, Globe, FileText } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'

// ECharts imports
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register ECharts components
echarts.use([LineChart, BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

// Veri tipi
interface RankEntry {
    rank?: number
    rank_display?: string
}

interface RankingData {
    year: number
    overall?: RankEntry
    [key: string]: any // SDG verileri için
}

const { data: impactRawData } = await useFetch<RankingData[]>('/rankings/the_impact.json', {
    server: false
})

const data = computed<RankingData[]>(() => {
    if (!impactRawData.value) return []
    return [...impactRawData.value].sort((a, b) => a.year - b.year)
})
const selectedSDG = ref<number | null>(1)
const isGuidelineOpen = ref(false)

// PDF URL
const guidelinePdfUrl = '/rankings/THE-impact-guideline-2026.pdf'

const getRankDisplay = (entry?: RankEntry) => entry?.rank_display || entry?.rank?.toString() || ''

const getRankValue = (entry?: RankEntry) => {
    if (!entry) return 0

    const rankParts = entry.rank_display?.match(/\d+/g)?.map(Number) || []
    if (rankParts.length >= 2) {
        return Math.round((rankParts[0] + rankParts[1]) / 2)
    }
    if (rankParts.length === 1) {
        return rankParts[0]
    }

    return entry.rank || 0
}

// İstatistik hesaplama fonksiyonu
const calculateStats = (data: RankingData[]) => {
    if (!data.length) return null

    const rankEntries = data
        .map((d) => {
            const entry = d.overall || ({ rank: parseInt((d as any).rank) } as RankEntry)
            return {
                value: getRankValue(entry),
                display: getRankDisplay(entry)
            }
        })
        .filter((entry) => entry.value > 0)

    if (rankEntries.length === 0) return null

    const bestRank = Math.min(...rankEntries.map((entry) => entry.value))
    const worstRank = Math.max(...rankEntries.map((entry) => entry.value))
    const bestRankDisplay = rankEntries.find((entry) => entry.value === bestRank)?.display || bestRank.toString()
    const worstRankDisplay = rankEntries.find((entry) => entry.value === worstRank)?.display || worstRank.toString()
    let currentRankEntry = rankEntries[rankEntries.length - 1]

    // Eğer currentRank 0 veya geçersizse, en son geçerli rank'i kullan
    if (!currentRankEntry?.value || currentRankEntry.value === 0) {
        currentRankEntry = rankEntries.length > 0 ? rankEntries[rankEntries.length - 1] : { value: 1, display: '1' }
    }

    const previousRank: number = rankEntries.length > 1 ? rankEntries[rankEntries.length - 2].value : currentRankEntry.value
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

// THE Impact Rankings Chart Options
const impactChartOptions = computed(() => {
    const years = data.value.map((d) => d.year.toString())
    const rankings = data.value.map((d) => {
        const rank = getRankValue(d.overall)
        return rank === 0 ? null : rank // 0 ise null (boşluk)
    })
    const rankDisplays = data.value.map((d) => getRankDisplay(d.overall))
    const validRankings = rankings.filter((rank): rank is number => rank !== null)

    if (validRankings.length === 0) {
        return {
            backgroundColor: 'transparent',
            title: {
                text: 'Overall Impact verisi yükleniyor...',
                left: 'center',
                top: 'middle',
                textStyle: {
                    color: '#666',
                    fontSize: 16
                }
            }
        }
    }

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const param = params[0]
                if (!param.value) {
                    return `<strong>${param.name}</strong><br/>${param.marker} Sıralama: Veri bulunamadı`
                }
                return `<strong>${param.name}</strong><br/>${param.marker} Sıralama: ${rankDisplays[param.dataIndex] || `${param.value}. sıra`}`
            }
        },
        xAxis: {
            type: 'category',
            data: years
        },
        yAxis: {
            type: 'value',
            inverse: true, // Düşük sıra = daha iyi
            min: Math.min(...validRankings) - 10,
            max: Math.max(...validRankings) + 10,
            axisLabel: {
                formatter: '{value}. sıra'
            }
        },
        series: [
            {
                name: 'Sıralama',
                type: 'line',
                data: rankings,
                lineStyle: {
                    color: '#9333ea',
                    width: 3
                },
                itemStyle: {
                    color: '#9333ea'
                },
                smooth: false,
                symbol: 'circle',
                symbolSize: 6,
                connectNulls: false // Null değerlerde çizgiyi kesik göster
            }
        ]
    }
})

// SDG Names
const getSDGName = (sdgNumber: number): string => {
    const sdgNames: Record<number, string> = {
        1: 'Yoksulluğa Son',
        2: 'Açlığa Son',
        3: 'Sağlıklı ve Kaliteli Yaşam',
        4: 'Nitelikli Eğitim',
        5: 'Toplumsal Cinsiyet Eşitliği',
        6: 'Temiz Su ve Sanitasyon',
        7: 'Erişilebilir ve Temiz Enerji',
        8: 'İnsana Yakışır İş ve Ekonomik Büyüme',
        9: 'Sanayi, İnovasyon ve Altyapı',
        10: 'Eşitsizliklerin Azaltılması',
        11: 'Sürdürülebilir Şehir ve Topluluklar',
        12: 'Sorumlu Tüketim ve Üretim',
        13: 'İklim Eylemi',
        14: 'Sudaki Yaşam',
        15: 'Karasal Yaşam',
        16: 'Barış, Adalet ve Güçlü Kurumlar',
        17: 'Amaçlar için Ortaklıklar'
    }
    return sdgNames[sdgNumber] || `SDG ${sdgNumber}`
}

// SDG Data Keys
const getSDGDataKey = (sdgNumber: number): string => {
    const sdgKeys: Record<number, string> = {
        1: 'no_poverty',
        2: 'zero_hunger',
        3: 'good_health_and_well_being',
        4: 'quality_education',
        5: 'gender_equality',
        6: 'clean_water_and_sanitation',
        7: 'affordable_and_clean_energy',
        8: 'decent_work_and_economic_growth',
        9: 'industry_innovation_and_infrastructure',
        10: 'reduced_inequalities',
        11: 'sustainable_cities_and_communities',
        12: 'responsible_consumption_and_production',
        13: 'climate_action',
        14: 'life_below_water',
        15: 'life_on_land',
        16: 'peace_and_justice_strong_institutions',
        17: 'partnerships_for_the_goals'
    }
    return sdgKeys[sdgNumber] || ''
}

// SDG Chart Options
const getSDGChartOptions = (sdgNumber: number) => {
    const dataKey = getSDGDataKey(sdgNumber)
    if (!dataKey) {
        return {}
    }

    // Tüm yılları dahil et, sadece ranking'i null yap
    const years = data.value.map((d) => d.year.toString())
    const rankings = data.value.map((d) => {
        const sdgData = d[dataKey as keyof typeof d]
        if (sdgData && typeof sdgData === 'object' && 'rank' in sdgData) {
            const rank = getRankValue(sdgData as RankEntry)
            return rank === 0 ? null : rank // 0 ise null (boşluk)
        }
        return null // SDG verisi yoksa null
    })
    const rankDisplays = data.value.map((d) => {
        const sdgData = d[dataKey as keyof typeof d]
        if (sdgData && typeof sdgData === 'object' && 'rank' in sdgData) {
            return getRankDisplay(sdgData as RankEntry)
        }
        return ''
    })
    const validRankings = rankings.filter((rank): rank is number => rank !== null)

    // Hiç geçerli veri yoksa
    if (validRankings.length === 0) {
        return {
            backgroundColor: 'transparent',
            title: {
                text: 'Bu SDG için veri bulunamadı',
                left: 'center',
                top: 'middle',
                textStyle: {
                    color: '#666',
                    fontSize: 16
                }
            }
        }
    }

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const param = params[0]
                if (param.value === null || param.value === undefined) {
                    return `<strong>${param.name}</strong><br/>${param.marker} Sıralama: Veri bulunamadı`
                }
                return `<strong>${param.name}</strong><br/>${param.marker} Sıralama: ${rankDisplays[param.dataIndex] || `${param.value}. sıra`}`
            }
        },
        xAxis: {
            type: 'category',
            data: years
        },
        yAxis: {
            type: 'value',
            inverse: true, // Düşük sıra = daha iyi
            min: Math.min(...validRankings) - 10,
            max: Math.max(...validRankings) + 10,
            axisLabel: {
                formatter: '{value}. sıra'
            }
        },
        series: [
            {
                name: 'Sıralama',
                type: 'line',
                data: rankings,
                lineStyle: {
                    color: '#9333ea',
                    width: 3
                },
                itemStyle: {
                    color: '#9333ea'
                },
                smooth: false,
                symbol: 'circle',
                symbolSize: 6,
                connectNulls: false
            }
        ]
    }
}

const impactStats = computed(() => calculateStats(data.value))
</script>

<template>
    <Card>
        <CardHeader>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <Globe class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <CardTitle>THE Impact Rankings</CardTitle>
                        <CardDescription>Sürdürülebilir kalkınma hedefleri performansı</CardDescription>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-purple-600">{{ impactStats?.currentRankDisplay }}</div>
                    <div class="flex items-center gap-1 text-sm text-muted-foreground">
                        <span v-if="impactStats?.trend && impactStats.trend !== 0"> {{ impactStats.trend > 0 ? '+' : '' }}{{ impactStats.trend }} sıra </span>
                        <TrendingUp v-if="impactStats?.trend && impactStats.trend > 0" class="w-4 h-4 text-green-600" />
                        <TrendingDown v-else-if="impactStats?.trend && impactStats.trend < 0" class="w-4 h-4 text-red-600" />
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
                <!-- Ana Overall Impact Grafiği -->
                <div class="h-80">
                    <VChart :option="impactChartOptions" style="width: 100%; height: 100%" />
                </div>

                <!-- SDG Interactive Images & Chart -->
                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">Sürdürülebilir Kalkınma Hedefleri</h4>
                    <TooltipProvider>
                        <div class="grid grid-cols-6 md:grid-cols-9 lg:grid-cols-17 gap-2 mb-6">
                            <!-- SDG Images -->
                            <Tooltip v-for="sdg in 17" :key="sdg">
                                <TooltipTrigger as-child>
                                    <button :class="['transition-all duration-200 focus:outline-none', selectedSDG === sdg ? 'opacity-100' : 'opacity-30 hover:opacity-60']" @click="selectedSDG = sdg">
                                        <img :src="`/images/sustainability/sdg-en-${sdg}.png`" :alt="`SDG ${sdg} - ${getSDGName(sdg)}`" class="w-full h-auto rounded-lg" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>SDG {{ sdg }} - {{ getSDGName(sdg) }}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>

                    <!-- Seçilen SDG için grafik alanı -->
                    <div v-if="selectedSDG">
                        <h5 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">SDG {{ selectedSDG }} - {{ getSDGName(selectedSDG) }}</h5>
                        <div class="h-80">
                            <VChart :option="getSDGChartOptions(selectedSDG)" style="width: 100%; height: 100%" />
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
                    THE Impact Rankings Kılavuzu 2026
                </SheetTitle>
                <SheetDescription> THE Impact Rankings değerlendirme kılavuzu </SheetDescription>
            </SheetHeader>
            <div class="flex-1 p-6 pt-0">
                <div class="w-full h-[calc(100vh-120px)] border rounded-lg overflow-hidden">
                    <iframe :src="guidelinePdfUrl" class="w-full h-full" title="THE Impact Rankings Kılavuzu 2026" loading="lazy" />
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>
