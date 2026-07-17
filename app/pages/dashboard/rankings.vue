<script setup lang="ts">
import GreenMetricCard from '@/components/Rankings/GreenMetricCard.vue'
import QSCard from '@/components/Rankings/QSCard.vue'
import ImpactCard from '@/components/Rankings/ImpactCard.vue'
import TheWorldCard from '@/components/Rankings/TheWorldCard.vue'
</script>

<template>
    <main class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold tracking-tight">Üniversite Sıralamaları</h1>
                <p class="text-muted-foreground">Uluslararası sıralama sistemlerindeki yerimiz</p>
            </div>
        </div>

        <!-- Rankings Cards -->
        <div class="grid gap-6 pb-8">
            <!-- GreenMetric World University Rankings -->
            <GreenMetricCard />

            <!-- QS World University Rankings -->
            <QSCard />

            <!-- THE World University Rankings -->
            <TheWorldCard />

            <!-- THE Impact Rankings -->
            <ImpactCard />
        </div>
    </main>
</template>
