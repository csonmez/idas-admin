<template>
    <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <!-- Header with Tabs and Export Buttons -->
        <div class="border-b border-gray-200">
            <div class="flex items-center justify-between px-6 pt-4">
                <!-- Title -->
                <h3 class="text-lg font-semibold text-gray-900">Yıllık Performans</h3>

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
                                <button
                                    class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    @click="exportChart('jpeg'), (showExportMenu = false)"
                                >
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
            <div class="w-full h-96">
                <div ref="chartRef" class="w-full h-full" />
            </div>

            <!-- Summary Stats -->
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">{{ totals.articles }}</div>
                    <div class="text-sm text-gray-500">Toplam Makale</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">{{ totals.patents }}</div>
                    <div class="text-sm text-gray-500">Toplam Patent</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-yellow-600">{{ totals.projects }}</div>
                    <div class="text-sm text-gray-500">Toplam Proje</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-red-600">{{ totals.prizes }}</div>
                    <div class="text-sm text-gray-500">Toplam Ödül</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Download, FileImage } from 'lucide-vue-next'

// ECharts bileşenlerini kaydet
echarts.use([TitleComponent, TooltipComponent, GridComponent, LegendComponent, LineChart, CanvasRenderer])

interface Props {
    academicianFullName: string
    yearlyData: {
        years: string[]
        articles: number[]
        projects: number[]
        prizes: number[]
        patents: number[]
    }
    totals: {
        articles: number
        projects: number
        prizes: number
        patents: number
    }
}

const props = defineProps<Props>()

// Export menu state
const showExportMenu = ref(false)

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// Chart options
const chartOptions = computed(() => {
    return {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#e5e7eb',
            textStyle: {
                color: '#374151'
            }
        },
        legend: {
            data: ['Makaleler', 'Patentler', 'Projeler', 'Ödüller'],
            bottom: 2
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '8%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: props.yearlyData.years,
            axisLabel: {
                color: '#6b7280'
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#6b7280'
            }
        },
        series: [
            {
                name: 'Makaleler',
                type: 'line',
                data: props.yearlyData.articles,
                smooth: false,
                lineStyle: { color: '#3b82f6' }
            },
            {
                name: 'Patentler',
                type: 'line',
                data: props.yearlyData.patents,
                smooth: false,
                lineStyle: { color: '#10b981' }
            },
            {
                name: 'Projeler',
                type: 'line',
                data: props.yearlyData.projects,
                smooth: false,
                lineStyle: { color: '#f59e0b' }
            },
            {
                name: 'Ödüller',
                type: 'line',
                data: props.yearlyData.prizes,
                smooth: false,
                lineStyle: { color: '#ef4444' }
            }
        ]
    }
})

// Chart'ı oluştur
const initChart = () => {
    if (chartRef.value && !chartInstance) {
        chartInstance = echarts.init(chartRef.value)
        chartInstance.setOption(chartOptions.value)
    }
}

// Chart'ı güncelle
const updateChart = () => {
    if (chartInstance) {
        chartInstance.setOption(chartOptions.value)
    }
}

// Export fonksiyonu
const exportChart = (format: 'png' | 'jpeg') => {
    if (chartInstance) {
        const url = chartInstance.getDataURL({
            type: format,
            pixelRatio: 2,
            backgroundColor: '#fff'
        })

        const link = document.createElement('a')
        link.download = `${props.academicianFullName.replace(/\s+/g, '-').replace(/\./g, '').toLowerCase()}-performans.${format}`
        link.href = url
        link.click()
    }
}

// Props değiştiğinde chart'ı güncelle
watch(() => props.yearlyData, updateChart, { deep: true })

onMounted(() => {
    initChart()

    // Resize listener
    const handleResize = () => {
        if (chartInstance) {
            chartInstance.resize()
        }
    }

    // Export menu click outside listener
    const handleClickOutside = (e: Event) => {
        const target = e.target as HTMLElement
        if (!target.closest('.export-menu')) {
            showExportMenu.value = false
        }
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('click', handleClickOutside)

    // Cleanup
    onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
        document.removeEventListener('click', handleClickOutside)
        if (chartInstance) {
            chartInstance.dispose()
        }
    })
})
</script>
