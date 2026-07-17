<script setup lang="ts">
import type { Target } from '~/types'
import { Download, Loader } from 'lucide-vue-next'

definePageMeta({
    middleware: 'admin',
    layout: 'default'
})

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

interface TrackingSummary {
    targetId: string
    year: number
    groups: TrackingGroup[]
}

const activeGroupCode = ref<string>('')
const isExporting = ref(false)

const { data, status } = await useAsyncData('tracking-summary', async () => {
    const targets = await useRequest<Target[]>('/manager/targets', { query: { onlyData: true } })
    const target2026 = targets.find((t) => t.year === 2026)
    if (!target2026) return null

    const summary = await useRequest<TrackingSummary>(`/manager/targets/${target2026.id}/tracking-summary`)
    return summary
})

watchEffect(() => {
    if (data.value && data.value.groups.length && !activeGroupCode.value) {
        activeGroupCode.value = data.value.groups[0]!.code
    }
})

const activeGroup = computed(() => data.value?.groups.find((g) => g.code === activeGroupCode.value) ?? null)

const handleExport = async () => {
    if (!data.value?.targetId) return
    try {
        isExporting.value = true
        const config = useRuntimeConfig()
        const baseURL = config.public.apiBase || 'http://localhost:3000/api'
        const blob = await $fetch<Blob>(`/manager/targets/${data.value.targetId}/tracking-summary/export`, {
            baseURL,
            credentials: 'include',
            responseType: 'blob'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `arge-hedef-uyum-kontrolu-${data.value.year}.xlsx`
        a.click()
        URL.revokeObjectURL(url)
    } catch {
        $toast({ title: 'Excel indirilemedi.', description: 'Lütfen daha sonra tekrar deneyiniz.' })
    } finally {
        isExporting.value = false
    }
}
</script>

<template>
    <div class="flex flex-col gap-6 p-4 md:p-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold tracking-tight">Ar-Ge Hedef Uyum Kontrolü</h1>
                <p class="text-muted-foreground text-sm mt-1">{{ data?.year ?? 2026 }} yılı — Üniversite Ar-Ge hedefleri ile fakülte toplamlarının karşılaştırması</p>
            </div>
            <Button v-if="data" variant="outline" :disabled="isExporting" @click="handleExport">
                <Loader v-if="isExporting" class="w-4 h-4 mr-2 animate-spin" />
                <Download v-else class="w-4 h-4 mr-2" />
                Raporu İndir
            </Button>
        </div>

        <div v-if="status === 'pending'" class="flex items-center justify-center min-h-[400px]">
            <div class="flex items-center gap-2">
                <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span class="text-muted-foreground">Veriler yükleniyor...</span>
            </div>
        </div>

        <div v-else-if="!data" class="flex items-center justify-center min-h-[400px]">
            <div class="text-center">
                <div class="text-4xl mb-3">⚠️</div>
                <h3 class="text-lg font-semibold mb-1">Veri Bulunamadı</h3>
                <p class="text-muted-foreground text-sm">2026 yılına ait Ar-Ge hedef uyum verisi mevcut değil.</p>
            </div>
        </div>

        <template v-else>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TargetTrackingSummaryGroupCard v-for="group in data.groups" :key="group.groupId" :group="group" :is-active="activeGroupCode === group.code" @click="activeGroupCode = group.code" />
            </div>

            <Card v-if="activeGroup">
                <CardHeader class="pb-2">
                    <CardTitle class="text-lg">{{ activeGroup.title }}</CardTitle>
                    <p class="text-sm text-muted-foreground">Grup ağırlığı: %{{ activeGroup.weight }} — {{ activeGroup.indicators.length }} gösterge</p>
                </CardHeader>
                <CardContent class="p-5 pt-0">
                    <TargetTrackingSummaryIndicatorTable :group="activeGroup" />
                </CardContent>
            </Card>
        </template>
    </div>
</template>
