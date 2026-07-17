<script setup lang="ts">
import type { Target, TargetItems, UniversityTarget } from '~/types'
import { CheckCheck, Loader } from 'lucide-vue-next'

const isLoading = ref(false)
const isCompleteLoading = ref(false)
const isOpenDialog = ref(false)
const currentStep = ref(1)
const formData = ref<Record<string, number | null>>({})

const getTargetIndicatorValue = (targetId: string, itemId: string) => {
    const year2026Data = historyData.value?.[2026]
    if (!year2026Data) return null
    const target = year2026Data.find((t: any) => t.targetId === targetId)
    const indicator = target?.indicators?.find((i: any) => i.indicatorId === itemId)

    if (!indicator || !indicator.target) return null

    return indicator.target
}
const handleSubmit = async (shouldApprove = false) => {
    try {
        isLoading.value = true
        const targetData =
            target.value?.items?.map((target: TargetItems) => ({
                targetId: target.id,
                indicators: target.indicators.map((indicator: { id: string }) => ({
                    indicatorId: indicator.id,
                    target: formData.value[indicator.id],
                    lastUpdatedAt: new Date()
                }))
            })) || []

        await useRequest(`/manager/university-targets/${universityTarget.value?.id}`, {
            method: 'PATCH',
            body: {
                data: targetData
            }
        })

        if (shouldApprove) {
            await completeUniversityTarget()
        }

        isLoading.value = false
        $toast({
            title: 'Üniversite Ar-Ge hedefleri başarıyla güncellendi.'
        })
    } catch (err: any) {
        console.log('err', err)
        isLoading.value = false
        $toast({
            title: 'Ar-Ge hedefleri kaydedilirken bir hata meydana geldi.',
            description: 'Lütfen daha sonra tekrar deneyiniz.'
        })
    }
}
const handleNext = () => {
    currentStep.value++
}
const handlePrev = () => {
    currentStep.value--
}
const completeUniversityTarget = async () => {
    try {
        isCompleteLoading.value = true
        await useRequest(`/manager/university-targets/${universityTarget.value?.id}/complete`, { method: 'PATCH' })
        $toast({
            title: 'Üniversite Ar-Ge hedefleri başarıyla onaylandı.'
        })
        isCompleteLoading.value = false
    } catch (err) {
        console.error(err)
        isCompleteLoading.value = false
        $toast({
            title: 'Ar-Ge hedefleri onaylanırken bir hata meydana geldi.',
            description: 'Lütfen daha sonra tekrar deneyiniz.'
        })
    }
}

const { data } = await useAsyncData('university-targets', async () => {
    const [targetResults, universityTargetResults] = await Promise.all([
        useRequest<Target[]>('/manager/targets', { query: { onlyData: true } }),
        useRequest<UniversityTarget[]>('/manager/university-targets', { query: { onlyData: true } })
    ])

    return { targetResult: targetResults.find((t) => t.year === 2026), universityTargetResults }
})

const currentYearTarget = computed(() => {
    const rows = data.value?.universityTargetResults
    if (!rows?.length) return undefined
    return rows.reduce((a: UniversityTarget, b: UniversityTarget) => (a.year > b.year ? a : b))
})
const target = computed(() => data.value?.targetResult)
const universityTarget = computed(() => currentYearTarget.value)
const historyData = computed(() => {
    const rows = data.value?.universityTargetResults
    if (!rows || !Array.isArray(rows)) return { 2022: [], 2023: [], 2024: [], 2025: [], 2026: [] }
    return {
        2022: rows.find((t: UniversityTarget) => t.year === 2022)?.data || [],
        2023: rows.find((t: UniversityTarget) => t.year === 2023)?.data || [],
        2024: rows.find((t: UniversityTarget) => t.year === 2024)?.data || [],
        2025: rows.find((t: UniversityTarget) => t.year === 2025)?.data || [],
        2026: rows.find((t: UniversityTarget) => t.year === 2026)?.data || []
    }
})
const kps = computed(() => target.value?.items?.find((target) => target.code === 'kps'))
const klt = computed(() => target.value?.items?.find((target) => target.code === 'klt'))
const isb = computed(() => target.value?.items?.find((target) => target.code === 'isb'))

watch(
    () => data.value,
    () => {
        if (!data.value?.universityTargetResults || !data.value?.targetResult) return

        const values: Record<string, number | null> = {}

        kps.value?.indicators?.forEach((item) => {
            values[item.id] = getTargetIndicatorValue((kps.value as TargetItems).id, item.id) as number | null
        })

        klt.value?.indicators?.forEach((item) => {
            values[item.id] = getTargetIndicatorValue((klt.value as TargetItems).id, item.id) as number | null
        })

        isb.value?.indicators?.forEach((item) => {
            values[item.id] = getTargetIndicatorValue((isb.value as TargetItems).id, item.id) as number | null
        })

        formData.value = values
    },
    { immediate: true }
)
</script>

<template>
    <div class="relative w-full gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
            <CardHeader class="flex flex-row justify-between items-center">
                <CardTitle>Erciyes Üniversitesi Ar-Ge Hedefleri</CardTitle>

                <AlertDialog v-model:open="isOpenDialog">
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Üniversite Ar-Ge hedeflerini onaylamak istediğinize emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription> Üniversitenin 2026 yılı Ar-Ge hedeflerini onaylamak için "Onayla" butonuna tıklayınız. </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction @click="completeUniversityTarget">Onayla</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button v-if="universityTarget && universityTarget.status === 'IN_PROGRESS'" :disabled="isCompleteLoading" @click="isOpenDialog = true">
                    <Loader v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                    <CheckCheck v-else class="h-4 w-4 me-1" />
                    Ar-Ge Hedeflerini Onayla
                </Button>
            </CardHeader>
            <CardContent class="p-5">
                <TargetKPS
                    v-if="currentStep === 1"
                    v-model="formData"
                    :indicators="kps?.indicators"
                    :target-id="kps?.id"
                    :history-data="historyData"
                    :is-completed="universityTarget?.status === 'COMPLETED'"
                    @next="handleNext"
                />
                <TargetKLT
                    v-if="currentStep === 2"
                    v-model="formData"
                    :indicators="klt?.indicators"
                    :target-id="klt?.id"
                    :history-data="historyData"
                    :is-completed="universityTarget?.status === 'COMPLETED'"
                    @next="handleNext"
                    @prev="handlePrev"
                />
                <TargetISB
                    v-if="currentStep === 3"
                    v-model="formData"
                    :indicators="isb?.indicators"
                    :is-loading="isLoading"
                    :is-completed="universityTarget?.status === 'COMPLETED'"
                    :target-id="isb?.id"
                    :history-data="historyData"
                    @submit="handleSubmit(false)"
                    @submit-and-approve="handleSubmit(true)"
                    @prev="handlePrev"
                />
            </CardContent>
        </Card>
    </div>
</template>
