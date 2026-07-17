<script setup lang="ts">
import { onMounted } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, RadarChart, HeatmapChart, ScatterChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, RadarComponent, DatasetComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// ECharts konfigürasyonu
echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    RadarComponent,
    DatasetComponent,
    VisualMapComponent,
    LineChart,
    BarChart,
    RadarChart,
    HeatmapChart,
    ScatterChart,
    CanvasRenderer
])

interface ChartData {
    categoryName: string
    categoryKey: string
    years: string[]
    publicationData: {
        name: string
        data: number[]
        color: string
    }[]
    perAcademicData: {
        name: string
        data: number[]
        color: string
    }[]
}

interface CategoryStats {
    latestYear: string
    topPerformer: { name: string; value: number; color: string }
    totalPublications: number
    universityCount: number
}

const props = defineProps<{
    categoryKey: string
    categoryName: string
    categoryIcon: string
    chartData: ChartData | null
    stats: CategoryStats | null
}>()

// Chart türü state
const chartType = ref<'line' | 'heatmap' | 'dual'>('line')
const showPerAcademic = ref(false)

const chartRenderKey = computed(() => `${props.categoryKey}-${chartType.value}-${showPerAcademic.value ? 'per-academic' : 'raw'}`)
const chartUpdateOptions = {
    notMerge: true,
    lazyUpdate: false
}

// Akademisyen sayısı kategorisi kontrolü
const isAcademicianCount = computed(() => props.categoryKey === 'Akademisyen_Sayisi')

// Akademisyen sayısı kategorisi için chart türünü line'da sabitle
onMounted(() => {
    if (isAcademicianCount.value) {
        chartType.value = 'line'
    }
})

// Chart options
const chartOptions = computed(() => {
    if (!props.chartData) return {}

    const data = showPerAcademic.value ? props.chartData.perAcademicData : props.chartData.publicationData

    const baseOptions = {
        backgroundColor: 'transparent',
        animation: true,
        animationDuration: 1000,

        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: {
                color: '#fff',
                fontSize: 12
            },
            axisPointer: {
                type: 'shadow',
                shadowStyle: {
                    color: 'rgba(150, 150, 150, 0.1)'
                }
            }
        },
        legend: {
            show: true,
            type: 'scroll',
            orient: 'horizontal',
            bottom: 0,
            left: 'center',
            textStyle: {
                fontSize: 10,
                color: '#666'
            },
            itemWidth: 12,
            itemHeight: 8,
            itemGap: 8,
            padding: [5, 0, 0, 0]
        },
        grid: {
            left: '8%',
            right: '8%',
            bottom: '15%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: props.chartData.years,
            axisLabel: {
                fontSize: 10,
                color: '#666'
            },
            axisTick: {
                show: false
            },
            axisLine: {
                lineStyle: {
                    color: '#e5e7eb'
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                fontSize: 10,
                color: '#666',
                formatter: (value: number) => {
                    if (value >= 1000) {
                        return `${(value / 1000).toFixed(1)}k`
                    }
                    return value.toString()
                }
            },
            axisTick: {
                show: false
            },
            axisLine: {
                show: false
            },
            splitLine: {
                lineStyle: {
                    color: '#f3f4f6',
                    type: 'dashed'
                }
            }
        }
    }

    if (chartType.value === 'line') {
        return {
            ...baseOptions,
            series: data.map((uni) => ({
                name: uni.name,
                type: 'line',
                data: uni.data,
                smooth: false,
                lineStyle: {
                    width: 2.5,
                    color: uni.color
                },
                itemStyle: {
                    color: uni.color,
                    borderWidth: 2,
                    borderColor: '#fff'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: uni.color + '20' },
                        { offset: 1, color: uni.color + '05' }
                    ])
                },
                emphasis: {
                    focus: 'series'
                }
            }))
        }
    } else if (chartType.value === 'heatmap') {
        // Heatmap için veri dönüştürme
        const heatmapData: any[] = []
        const maxValue = Math.max(...data.flatMap((uni) => uni.data))

        data.forEach((uni, uniIndex) => {
            uni.data.forEach((value, yearIndex) => {
                heatmapData.push([yearIndex, uniIndex, value])
            })
        })

        return {
            backgroundColor: 'transparent',
            animation: true,
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                textStyle: {
                    color: '#fff',
                    fontSize: 12
                },
                formatter: (params: any) => {
                    const yearIndex = params.value[0]
                    const uniIndex = params.value[1]
                    const value = params.value[2]
                    const year = props.chartData?.years[yearIndex]
                    const uniName = data[uniIndex].name
                    return `${uniName}<br/>${year}: ${value}`
                }
            },
            grid: {
                left: '15%',
                right: '8%',
                bottom: '15%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: props.chartData?.years || [],
                axisLabel: {
                    fontSize: 10,
                    color: '#666'
                },
                axisTick: {
                    show: false
                },
                axisLine: {
                    show: false
                }
            },
            yAxis: {
                type: 'category',
                data: data.map((uni) => uni.name),
                axisLabel: {
                    fontSize: 10,
                    color: '#666'
                },
                axisTick: {
                    show: false
                },
                axisLine: {
                    show: false
                }
            },
            visualMap: {
                min: 0,
                max: maxValue,
                show: false,
                inRange: {
                    color: [
                        '#fdfdfd', // Ultra açık gri-beyaz
                        '#fefefe', // Neredeyse beyaz
                        '#fffef7', // Çok çok açık krem
                        '#fffbf0', // Çok açık krem
                        '#fef7e0', // Açık sarımsı
                        '#fef3c7', // Açık sarı
                        '#fcd34d', // Orta sarı
                        '#f59e0b', // Turuncu
                        '#ea580c', // Koyu turuncu
                        '#dc2626' // Kırmızı
                    ]
                }
            },
            series: [
                {
                    name: 'Performans',
                    type: 'heatmap',
                    data: heatmapData,
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 1
                    },
                    emphasis: {
                        itemStyle: {
                            borderColor: '#333',
                            borderWidth: 2
                        }
                    }
                }
            ]
        }
    } else {
        // dual mode
        return {
            ...baseOptions,
            legend: {
                show: false
            },
            grid: {
                left: '20%',
                right: '20%',
                bottom: '15%',
                top: '10%',
                containLabel: false
            },
            yAxis: [
                {
                    type: 'value',
                    position: 'left',
                    name: 'Ham Sayı',
                    nameLocation: 'middle',
                    nameRotate: 90,
                    nameTextStyle: {
                        color: '#666',
                        fontSize: 11,
                        fontWeight: 'bold'
                    },
                    nameGap: 35,
                    axisLabel: {
                        fontSize: 10,
                        color: '#666',
                        formatter: (value: number) => {
                            if (value >= 1000) {
                                return `${(value / 1000).toFixed(1)}k`
                            }
                            return value.toString()
                        }
                    },
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: '#666'
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#f3f4f6',
                            type: 'dashed'
                        }
                    }
                },
                {
                    type: 'value',
                    position: 'right',
                    name: 'Akademisyen Başına',
                    nameLocation: 'middle',
                    nameRotate: 90,
                    nameTextStyle: {
                        color: '#666',
                        fontSize: 11,
                        fontWeight: 'bold'
                    },
                    nameGap: 35,
                    axisLabel: {
                        fontSize: 10,
                        color: '#666',
                        formatter: (value: number) => value.toFixed(2)
                    },
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: '#666'
                        }
                    },
                    splitLine: {
                        show: false
                    }
                }
            ],
            series: [
                // Ham sayı serisi
                ...props.chartData.publicationData.map((uni) => ({
                    name: uni.name + ' (Ham)',
                    type: 'bar',
                    data: uni.data,
                    itemStyle: {
                        color: uni.color + '80'
                    },
                    yAxisIndex: 0
                })),
                // Akademisyen başına serisi
                ...props.chartData.perAcademicData.map((uni) => ({
                    name: uni.name + ' (Başına)',
                    type: 'line',
                    data: uni.data,
                    lineStyle: {
                        color: uni.color,
                        width: 2
                    },
                    itemStyle: {
                        color: uni.color
                    },
                    yAxisIndex: 1
                }))
            ]
        }
    }
})

// Chart türü değiştirme
const switchChartType = (type: 'line' | 'heatmap' | 'dual') => {
    // Akademisyen sayısı kategorisinde sadece line chart'a izin ver
    if (isAcademicianCount.value && type !== 'line') {
        return
    }
    chartType.value = type
}

// Metrik türü değiştirme
const toggleMetric = () => {
    showPerAcademic.value = !showPerAcademic.value
}

// Performans göstergesi (şu an kullanılmıyor)
const _getPerformanceTrend = () => {
    if (!props.chartData) return null

    const data = showPerAcademic.value ? props.chartData.perAcademicData : props.chartData.publicationData

    const trends = data.map((uni) => {
        const firstYear = uni.data[0]
        const lastYear = uni.data[uni.data.length - 1]
        const change = lastYear - firstYear
        const percentage = firstYear > 0 ? (change / firstYear) * 100 : 0

        return {
            name: uni.name,
            change,
            percentage,
            isPositive: change > 0
        }
    })

    return trends.sort((a, b) => b.change - a.change)[0]
}

// Performans trendi (şu an kullanılmıyor ama gelecekte kullanılabilir)
// const topTrend = computed(() => getPerformanceTrend())

// Erciyes Üniversitesi'nin sıralamasını hesapla
const erciyesRanking = computed(() => {
    if (!props.chartData) return null

    const data = showPerAcademic.value ? props.chartData.perAcademicData : props.chartData.publicationData
    const latestYearIndex = props.chartData.years.length - 1

    // Son yıl verilerine göre sırala
    const ranking = data
        .map((uni, index) => ({
            name: uni.name,
            value: uni.data[latestYearIndex] || 0,
            originalIndex: index
        }))
        .sort((a, b) => b.value - a.value)

    // Erciyes'in sıralamasını bul
    const erciyesIndex = ranking.findIndex((item) => item.name.includes('Erciyes') || item.name.toLowerCase().includes('erciyes'))

    if (erciyesIndex === -1) return null

    return {
        rank: erciyesIndex + 1,
        value: ranking[erciyesIndex].value,
        total: ranking.length
    }
})

// Erciyes Üniversitesi'nin artış oranını hesapla
const erciyesGrowth = computed(() => {
    if (!props.chartData) return null

    const data = showPerAcademic.value ? props.chartData.perAcademicData : props.chartData.publicationData
    const erciyesData = data.find((uni) => uni.name.includes('Erciyes') || uni.name.toLowerCase().includes('erciyes'))

    if (!erciyesData || erciyesData.data.length < 2) return null

    const firstYear = erciyesData.data[0]
    const lastYear = erciyesData.data[erciyesData.data.length - 1]
    const change = lastYear - firstYear
    const percentage = firstYear > 0 ? (change / firstYear) * 100 : 0

    return {
        percentage,
        isPositive: change > 0,
        change
    }
})
</script>

<template>
    <Card class="hover:shadow-lg transition-all duration-300 group overflow-hidden">
        <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="text-2xl">{{ categoryIcon }}</div>
                    <div>
                        <CardTitle class="text-lg">{{ categoryName }}</CardTitle>
                        <CardDescription>
                            {{ isAcademicianCount ? 'Üniversite Akademisyen Sayıları' : (showPerAcademic ? 'Öğretim Üyesi Başına' : 'Ham Sayı') + ' Analizi' }}
                        </CardDescription>
                    </div>
                </div>

                <!-- Chart kontrolleri (Akademisyen sayısında gizli) -->
                <div v-if="!isAcademicianCount" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" :class="{ 'bg-muted': chartType === 'line' }" @click="switchChartType('line')"> 📈 </Button>
                    <Button variant="ghost" size="sm" :class="{ 'bg-muted': chartType === 'heatmap' }" @click="switchChartType('heatmap')"> 🏆 </Button>
                    <Button variant="ghost" size="sm" :class="{ 'bg-muted': chartType === 'dual' }" @click="switchChartType('dual')"> 📊📈 </Button>
                </div>
            </div>
        </CardHeader>

        <CardContent class="pt-0">
            <!-- Chart alanı -->
            <div class="h-64 mb-4">
                <VChart v-if="chartData" :key="chartRenderKey" :option="chartOptions" :update-options="chartUpdateOptions" class="w-full h-full" :autoresize="true" />
                <div v-else class="h-full bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                    <div class="text-center">
                        <div class="text-3xl mb-2">{{ categoryIcon }}</div>
                        <p class="text-sm text-muted-foreground">Veri yükleniyor...</p>
                    </div>
                </div>
            </div>

            <!-- Kontrol butonları (Akademisyen sayısında gizli) -->
            <div v-if="!isAcademicianCount" class="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" class="text-xs" @click="toggleMetric">
                    {{ showPerAcademic ? '📊 Ham Sayı' : '👤 Öğretim Üyesi Başına' }}
                </Button>
            </div>

            <!-- İstatistikler -->
            <div v-if="stats" class="grid grid-cols-2 gap-4">
                <!-- Erciyes Sıralaması -->
                <div class="text-center p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400">Erciyes</div>
                    <div class="text-xs text-blue-500 dark:text-blue-300">
                        {{ erciyesRanking ? `${erciyesRanking.rank}. sırada` : 'Sıralama bulunamadı' }}
                    </div>
                </div>

                <!-- Erciyes Artış Oranı -->
                <div
                    :class="[
                        'text-center p-2 rounded-lg',
                        erciyesGrowth?.isPositive
                            ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
                            : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
                    ]"
                >
                    <div :class="['text-lg font-bold', erciyesGrowth?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400']">
                        {{ erciyesGrowth ? `${erciyesGrowth.percentage.toFixed(1)}%` : '0%' }}
                    </div>
                    <div :class="['text-xs', erciyesGrowth?.isPositive ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300']">
                        {{ erciyesGrowth?.isPositive ? '📈 Artış' : '📉 Azalış' }}
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
