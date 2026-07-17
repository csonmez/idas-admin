<script setup lang="ts">
const props = defineProps<{
    values: Record<number, number | null | string | undefined>
    width?: number
    height?: number
}>()

const width = computed(() => props.width ?? 60)
const height = computed(() => props.height ?? 20)

// Veriyi işle
const processedData = computed(() => {
    const currentYear = new Date().getFullYear()
    const years = [currentYear - 2, currentYear - 1, currentYear]
    const data = years
        .map((year) => ({
            year,
            value: props.values[year]
        }))
        .filter((item) => {
            return item.value !== null && item.value !== undefined && item.value !== '-' && typeof item.value === 'number' && !isNaN(item.value)
        }) as Array<{ year: number; value: number }>

    if (data.length < 2) return null

    const values = data.map((d) => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1

    // SVG koordinatlarını hesapla
    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * (width.value - 4) + 2
        const y = height.value - 2 - ((item.value - minValue) / range) * (height.value - 4)
        return { x, y, value: item.value }
    })

    return {
        points,
        pathData: `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`,
        trend: values[values.length - 1] > values[0] ? 'up' : values[values.length - 1] < values[0] ? 'down' : 'stable'
    }
})

const strokeColor = computed(() => {
    if (!processedData.value) return '#6b7280'

    switch (processedData.value.trend) {
        case 'up':
            return '#059669'
        case 'down':
            return '#dc2626'
        default:
            return '#6b7280'
    }
})
</script>

<template>
    <div class="flex items-center justify-center">
        <svg v-if="processedData" :width="width" :height="height" class="overflow-visible">
            <!-- Background -->
            <rect x="0" y="0" :width="width" :height="height" fill="transparent" />

            <!-- Line Path -->
            <path :d="processedData.pathData" :stroke="strokeColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />

            <!-- Data Points -->
            <circle v-for="(point, index) in processedData.points" :key="index" :cx="point.x" :cy="point.y" r="1.5" :fill="strokeColor" />
        </svg>

        <!-- No Data -->
        <div v-else class="flex items-center justify-center text-gray-400" :style="{ width: width + 'px', height: height + 'px' }">
            <span class="text-xs">-</span>
        </div>
    </div>
</template>
