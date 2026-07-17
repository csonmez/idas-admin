<script setup lang="ts">
interface TrackingIndicator {
    indicatorId: string
    indicator: string
    weight: number
    indicatorGroup: number
    universityTarget: number
    facultiesTotal: number
    coverage: number
    gap: number
}

interface TrackingGroup {
    groupId: string
    code: string
    title: string
    weight: number
    indicators: TrackingIndicator[]
}

defineProps<{
    group: TrackingGroup
}>()

const coverageStatus = (coverage: number) => {
    if (coverage >= 1) return 'met'
    if (coverage >= 0.9) return 'near'
    return 'missed'
}

const coverageClass = (coverage: number) => {
    if (coverage >= 1) return 'text-green-600 font-semibold'
    if (coverage >= 0.9) return 'text-amber-600 font-semibold'
    return 'text-red-600 font-semibold'
}

const gapClass = (gap: number) => {
    if (gap > 0) return 'text-green-600'
    if (gap < 0) return 'text-red-600'
    return 'text-muted-foreground'
}

const progressBarColor = (coverage: number) => {
    if (coverage >= 1) return 'bg-green-500'
    if (coverage >= 0.9) return 'bg-amber-500'
    return 'bg-red-500'
}

const progressWidth = (coverage: number) => Math.min(coverage * 100, 100)

const formatNumber = (value: number) => {
    return new Intl.NumberFormat('tr-TR').format(value)
}

const formatCoverage = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value * 100)
}

const formatGap = (gap: number) => {
    const sign = gap > 0 ? '+' : ''
    return `${sign}${new Intl.NumberFormat('tr-TR').format(gap)}`
}

const statusBadge = (coverage: number) => {
    if (coverage >= 1) return { label: 'Karşılandı', class: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' }
    if (coverage >= 0.9) return { label: 'Yakın', class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' }
    return { label: 'Eksik', class: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' }
}
</script>

<template>
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b text-muted-foreground">
                    <th class="text-left py-3 pr-4 font-medium w-[35%]">Gösterge</th>
                    <th class="text-right py-3 px-3 font-medium w-[15%]">Üniversite Ar-Ge Hedefi</th>
                    <th class="text-right py-3 px-3 font-medium w-[15%]">Fakülteler Toplamı</th>
                    <th class="text-right py-3 px-3 font-medium w-[10%]">Fark</th>
                    <th class="text-center py-3 px-3 font-medium w-[20%]">Kapsama</th>
                    <th class="text-center py-3 pl-3 font-medium w-[5%]">Durum</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in group.indicators" :key="item.indicatorId" class="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td class="py-4 pr-4 leading-snug">
                        <span class="text-xs font-bold text-muted-foreground uppercase mr-1"> {{ group.code.toUpperCase() }}{{ item.indicatorGroup }}. </span>
                        {{ item.indicator }}
                    </td>
                    <td class="py-4 px-3 text-right font-mono tabular-nums">
                        {{ formatNumber(item.universityTarget) }}
                    </td>
                    <td class="py-4 px-3 text-right font-mono tabular-nums">
                        {{ formatNumber(item.facultiesTotal) }}
                    </td>
                    <td class="py-4 px-3 text-right font-mono tabular-nums" :class="gapClass(item.gap)">
                        {{ formatGap(item.gap) }}
                    </td>
                    <td class="py-4 px-3">
                        <div class="flex flex-col gap-1 items-center">
                            <span :class="coverageClass(item.coverage)"> %{{ formatCoverage(item.coverage) }} </span>
                            <div class="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div class="h-1.5 rounded-full transition-all duration-500" :class="progressBarColor(item.coverage)" :style="{ width: `${progressWidth(item.coverage)}%` }" />
                            </div>
                            <span v-if="item.coverage > 1" class="text-xs text-green-600"> +%{{ formatCoverage(item.coverage - 1) }} aşıldı </span>
                        </div>
                    </td>
                    <td class="py-4 pl-3 text-center">
                        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="statusBadge(item.coverage).class">
                            {{ statusBadge(item.coverage).label }}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
