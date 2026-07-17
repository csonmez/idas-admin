<script setup lang="ts">
// ECharts manual imports
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, DatasetComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Download, FileImage } from 'lucide-vue-next'

// Register ECharts components
echarts.use([TitleComponent, TooltipComponent, GridComponent, LegendComponent, DatasetComponent, BarChart, LineChart, PieChart, CanvasRenderer])

// Props interface
interface FacultyStats {
    facultyId: string
    totalAcademicians: number
    stats: {
        articles: {
            total: number
            perAcademician: number
            byYear: Record<string, number>
        }
        patents: {
            total: number
            perAcademician: number
            byYear: Record<string, number>
        }
        projects: {
            total: number
            perAcademician: number
            byYear: Record<string, number>
        }
        prizes: {
            total: number
            perAcademician: number
            byYear: Record<string, number>
        }
    }
    topPerformers: Array<{
        academicianId: string
        name: string
        totalPublications: number
    }>
}

interface Props {
    statsData: FacultyStats
}

const props = defineProps<Props>()

// Tab state
const activeTab = ref('trend')

// Export menu state
const showExportMenu = ref(false)

// Close menu when clicking outside
onMounted(() => {
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        if (!target.closest('.export-menu')) {
            showExportMenu.value = false
        }
    })
})

// Chart instance refs
const overviewChartRef = ref()
const trendChartRef = ref()
const averageChartRef = ref()

// Years for trend analysis
const years = ['2019', '2020', '2021', '2022', '2023', '2024']

// Colors for different metrics
const colors = {
    articles: '#3b82f6', // Blue
    patents: '#10b981', // Green
    projects: '#f59e0b', // Yellow
    prizes: '#ef4444' // Red
}

// Trend Chart - Yearly progression (2019-2024)
const trendChartOptions = computed(() => ({
    title: {
        text: 'Yıllık Performans Trendi (2019-2024)',
        left: 'center',
        textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
        }
    },
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        data: ['Makaleler', 'Patentler', 'Projeler', 'Ödüller'],
        bottom: 10
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: years,
        axisLabel: { fontSize: 12 }
    },
    yAxis: {
        type: 'value',
        axisLabel: { fontSize: 12 }
    },
    series: [
        {
            name: 'Makaleler',
            type: 'line',
            data: years.map((year) => props.statsData.stats.articles.byYear[year] || 0),
            lineStyle: { color: colors.articles },
            itemStyle: { color: colors.articles },
            smooth: false
        },
        {
            name: 'Patentler',
            type: 'line',
            data: years.map((year) => props.statsData.stats.patents.byYear[year] || 0),
            lineStyle: { color: colors.patents },
            itemStyle: { color: colors.patents },
            smooth: false
        },
        {
            name: 'Projeler',
            type: 'line',
            data: years.map((year) => props.statsData.stats.projects.byYear[year] || 0),
            lineStyle: { color: colors.projects },
            itemStyle: { color: colors.projects },
            smooth: false
        },
        {
            name: 'Ödüller',
            type: 'line',
            data: years.map((year) => props.statsData.stats.prizes.byYear[year] || 0),
            lineStyle: { color: colors.prizes },
            itemStyle: { color: colors.prizes },
            smooth: false
        }
    ]
}))

// Average Chart - Per academician averages
const averageChartOptions = computed(() => ({
    title: {
        text: 'Akademisyen Başına Ortalama',
        left: 'center',
        textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
        }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
    xAxis: {
        type: 'value',
        axisLabel: { fontSize: 12 }
    },
    yAxis: {
        type: 'category',
        data: ['Ödüller', 'Projeler', 'Patentler', 'Makaleler'],
        axisLabel: { fontSize: 12 }
    },
    series: [
        {
            name: 'Ortalama',
            type: 'bar',
            data: [
                { value: props.statsData.stats.prizes.perAcademician, itemStyle: { color: colors.prizes } },
                { value: props.statsData.stats.projects.perAcademician, itemStyle: { color: colors.projects } },
                { value: props.statsData.stats.patents.perAcademician, itemStyle: { color: colors.patents } },
                { value: props.statsData.stats.articles.perAcademician, itemStyle: { color: colors.articles } }
            ],
            barWidth: '60%'
        }
    ]
}))

// Export functions
const exportChart = (format: 'png' | 'jpg') => {
    let chartRef: any = null
    let fileName = ''

    // Get current chart reference and filename
    if (activeTab.value === 'overview') {
        chartRef = overviewChartRef.value
        fileName = 'fakülte-performans-genel-bakış'
    } else if (activeTab.value === 'trend') {
        chartRef = trendChartRef.value
        fileName = 'fakülte-performans-yıllık-trend'
    } else if (activeTab.value === 'average') {
        chartRef = averageChartRef.value
        fileName = 'fakülte-performans-ortalamalar'
    }

    if (chartRef) {
        // PNG/JPG export using vue-echarts getDataURL method
        const url = chartRef.getDataURL({
            type: format,
            pixelRatio: 2,
            backgroundColor: '#fff'
        })

        const link = document.createElement('a')
        link.download = `${fileName}.${format}`
        link.href = url
        link.click()
    }
}
</script>

<template>
    <div class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <!-- Header with Tabs and Export Buttons -->
        <div class="border-b border-gray-200">
            <div class="flex items-center justify-between px-6 pt-4">
                <!-- Tab Navigation -->
                <nav class="flex space-x-8">
                    <button
                        :class="[
                            activeTab === 'trend' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
                        ]"
                        @click="activeTab = 'trend'"
                    >
                        Yıllık Trend
                    </button>
                    <button
                        :class="[
                            activeTab === 'average' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
                        ]"
                        @click="activeTab = 'average'"
                    >
                        Ortalamalar
                    </button>
                </nav>

                <!-- Export Buttons -->
                <div class="flex items-center space-x-2">
                    <div class="relative export-menu">
                        <button
                            class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                            @click="showExportMenu = !showExportMenu"
                        >
                            <Download class="w-4 h-4" />
                            Dışa Aktar
                        </button>

                        <!-- Export Menu -->
                        <div v-if="showExportMenu" class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                            <div class="py-1">
                                <button class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" @click="exportChart('png'), (showExportMenu = false)">
                                    <FileImage class="w-4 h-4" />
                                    PNG olarak indir
                                </button>
                                <button class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" @click="exportChart('jpg'), (showExportMenu = false)">
                                    <FileImage class="w-4 h-4" />
                                    JPG olarak indir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chart Content -->
        <div class="p-6">
            <!-- Trend Chart -->
            <div v-if="activeTab === 'trend'" class="w-full h-96">
                <VChart ref="trendChartRef" :option="trendChartOptions" style="width: 100%; height: 100%" />
            </div>

            <!-- Average Chart -->
            <div v-if="activeTab === 'average'" class="w-full h-96">
                <VChart ref="averageChartRef" :option="averageChartOptions" style="width: 100%; height: 100%" />
            </div>

            <!-- Summary Stats -->
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">{{ statsData.stats.articles.total }}</div>
                    <div class="text-sm text-gray-500">Toplam Makale</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">{{ statsData.stats.patents.total }}</div>
                    <div class="text-sm text-gray-500">Toplam Patent</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-yellow-600">{{ statsData.stats.projects.total }}</div>
                    <div class="text-sm text-gray-500">Toplam Proje</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-red-600">{{ statsData.stats.prizes.total }}</div>
                    <div class="text-sm text-gray-500">Toplam Ödül</div>
                </div>
            </div>
        </div>
    </div>
</template>
