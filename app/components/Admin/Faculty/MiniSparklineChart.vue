<script setup lang="ts">
interface Props {
    values: Record<number, number | null>
    width?: number
    height?: number
}

const props = withDefaults(defineProps<Props>(), {
    width: 60,
    height: 20
})

// Veriyi işle
const processedData = computed(() => {
    const years = [2022, 2023, 2024, 2025, 2026]
    const data = years
        .map((year) => ({
            year,
            value: props.values[year]
        }))
        .filter((item) => item.value !== null) as Array<{ year: number; value: number }>

    if (data.length < 2) return null

    const values = data.map((d) => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1

    // SVG koordinatlarını hesapla
    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * (props.width - 4) + 2
        const y = props.height - 2 - ((item.value - minValue) / range) * (props.height - 4)
        return { x, y, value: item.value }
    })

    return {
        points,
        pathData: `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`,
        trend: values[values.length - 1]! > values[0]! ? 'up' : values[values.length - 1]! < values[0]! ? 'down' : 'stable'
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
