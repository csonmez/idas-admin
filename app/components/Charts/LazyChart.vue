<script setup lang="ts">
const _props = defineProps<{
    categoryKey: string
    categoryName: string
    categoryIcon: string
    chartData: any
    stats: any
}>()

const chartRef = ref<HTMLElement>()
const isVisible = ref(false)
const hasLoaded = ref(false)

let observer: IntersectionObserver | null = null

onMounted(() => {
    if (chartRef.value) {
        observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasLoaded.value) {
                        isVisible.value = true
                        hasLoaded.value = true
                        // Bir kez yüklendikten sonra observer'ı kaldır
                        observer?.disconnect()
                    }
                })
            },
            {
                rootMargin: '100px', // 100px önce yüklemeye başla
                threshold: 0.1
            }
        )

        observer.observe(chartRef.value)
    }
})

onUnmounted(() => {
    observer?.disconnect()
})
</script>

<template>
    <div ref="chartRef" class="min-h-[400px]">
        <!-- Lazy loading -->
        <div v-if="!isVisible" class="h-96 flex items-center justify-center">
            <div class="text-center">
                <div class="text-4xl mb-4">{{ categoryIcon }}</div>
                <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p class="text-sm text-muted-foreground">{{ categoryName }} yükleniyor...</p>
            </div>
        </div>

        <!-- Actual chart -->
        <ChartsCategoryCard v-else :category-key="categoryKey" :category-name="categoryName" :category-icon="categoryIcon" :chart-data="chartData" :stats="stats" />
    </div>
</template>
