<script setup lang="ts">
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, DatasetComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([TitleComponent, TooltipComponent, GridComponent, LegendComponent, DatasetComponent, BarChart, LineChart, PieChart, CanvasRenderer])

interface ChartProps {
    type: 'bar' | 'line' | 'pie'
    data: any[]
    title?: string
    height?: string
    customOptions?: Record<string, any>
}

const props = withDefaults(defineProps<ChartProps>(), {
    height: '400px',
    title: ''
})

const chartOptions = computed(() => {
    const baseOptions = {
        title: props.title
            ? {
                  text: props.title,
                  left: 'center',
                  textStyle: {
                      fontSize: 16,
                      fontWeight: 'bold'
                  }
              }
            : undefined,
        tooltip: {
            trigger: props.type === 'pie' ? 'item' : 'axis',
            axisPointer:
                props.type !== 'pie'
                    ? {
                          type: 'shadow'
                      }
                    : undefined
        },
        ...props.customOptions
    }

    // Chart type specific options
    switch (props.type) {
        case 'bar':
            return {
                ...baseOptions,
                xAxis: {
                    type: 'category',
                    data: props.data.map((item) => item.name),
                    axisLabel: { fontSize: 12 }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { fontSize: 12 }
                },
                series: [
                    {
                        name: 'Değer',
                        type: 'bar',
                        data: props.data.map((item) => item.value),
                        itemStyle: {
                            color: '#3b82f6'
                        },
                        barWidth: '60%'
                    }
                ]
            }

        case 'line':
            return {
                ...baseOptions,
                xAxis: {
                    type: 'category',
                    data: props.data.map((item) => item.name),
                    axisLabel: { fontSize: 12 }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { fontSize: 12 }
                },
                series: [
                    {
                        name: 'Değer',
                        type: 'line',
                        data: props.data.map((item) => item.value),
                        lineStyle: {
                            color: '#10b981'
                        },
                        itemStyle: {
                            color: '#10b981'
                        },
                        smooth: true
                    }
                ]
            }

        case 'pie':
            return {
                ...baseOptions,
                legend: {
                    orient: 'horizontal',
                    bottom: 'bottom'
                },
                series: [
                    {
                        name: 'Değer',
                        type: 'pie',
                        radius: '70%',
                        data: props.data,
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            }

        default:
            return baseOptions
    }
})
</script>

<template>
    <div class="w-full" :style="{ height: height }">
        <VChart :option="chartOptions" style="width: 100%; height: 100%" />
    </div>
</template>
