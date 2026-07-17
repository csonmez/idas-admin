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

const props = defineProps<{
    group: TrackingGroup
    isActive?: boolean
}>()

const emit = defineEmits<{
    click: []
}>()

const metCount = computed(() => props.group.indicators.filter((i) => i.coverage >= 1).length)
const nearCount = computed(() => props.group.indicators.filter((i) => i.coverage >= 0.9 && i.coverage < 1).length)
const missedCount = computed(() => props.group.indicators.filter((i) => i.coverage < 0.9).length)
const totalCount = computed(() => props.group.indicators.length)

const metRatio = computed(() => (totalCount.value > 0 ? metCount.value / totalCount.value : 0))

const statusColor = computed(() => {
    if (metRatio.value === 1) return 'text-green-600'
    if (metRatio.value >= 0.5) return 'text-amber-600'
    return 'text-red-600'
})

const progressColor = computed(() => {
    if (metRatio.value === 1) return 'bg-green-500'
    if (metRatio.value >= 0.5) return 'bg-amber-500'
    return 'bg-red-500'
})

const borderColor = computed(() => {
    if (!props.isActive) return 'border-border'
    if (metRatio.value === 1) return 'border-green-500'
    if (metRatio.value >= 0.5) return 'border-amber-500'
    return 'border-red-500'
})
</script>

<template>
    <div
        class="rounded-lg border-2 p-5 cursor-pointer transition-all hover:shadow-md"
        :class="[borderColor, isActive ? 'shadow-md bg-card' : 'bg-card/60 hover:bg-card']"
        @click="emit('click')"
    >
        <div class="flex items-start justify-between mb-3">
            <div>
                <h3 class="font-semibold text-base leading-tight">{{ group.title }}</h3>
                <span class="text-xs text-muted-foreground">Ağırlık: %{{ group.weight }}</span>
            </div>
            <span class="text-2xl font-bold" :class="statusColor">
                {{ metCount }}/{{ totalCount }}
            </span>
        </div>

        <div class="w-full bg-muted rounded-full h-2 mb-4 overflow-hidden">
            <div
                class="h-2 rounded-full transition-all duration-500"
                :class="progressColor"
                :style="{ width: `${metRatio * 100}%` }"
            />
        </div>

        <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded-md bg-green-50 dark:bg-green-950/30 p-2">
                <div class="text-lg font-bold text-green-600">{{ metCount }}</div>
                <div class="text-xs text-muted-foreground">Karşılandı</div>
            </div>
            <div class="rounded-md bg-amber-50 dark:bg-amber-950/30 p-2">
                <div class="text-lg font-bold text-amber-600">{{ nearCount }}</div>
                <div class="text-xs text-muted-foreground">Yakın</div>
            </div>
            <div class="rounded-md bg-red-50 dark:bg-red-950/30 p-2">
                <div class="text-lg font-bold text-red-600">{{ missedCount }}</div>
                <div class="text-xs text-muted-foreground">Eksik</div>
            </div>
        </div>

        <div class="mt-3 text-xs text-muted-foreground text-center">
            {{ metCount + nearCount }}/{{ totalCount }} göstergede hedefe ulaşıldı veya yaklaşıldı
        </div>
    </div>
</template>
