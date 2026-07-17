<script setup lang="ts">
import type { Target, TargetItems, FacultyTarget, Faculty, UniversityTarget } from '~/types'
import { CheckCheck, Loader } from 'lucide-vue-next'

const route = useRoute()

const isLoading = ref(false)
const isCompleteLoading = ref(false)
const isOpenDialog = ref(false)
const currentStep = ref(1)
const formData = ref<Record<string, number | null>>({})

const target = computed(() => data.value?.targetResult)
const facultyTarget = computed(() => data.value?.facultyTargetResult)
const historyData = computed(() => ({
    2022: data.value?.facultyTargetResults.find((t) => t.year === 2022)?.data || [],
    2023: data.value?.facultyTargetResults.find((t) => t.year === 2023)?.data || [],
    2024: data.value?.facultyTargetResults.find((t) => t.year === 2024)?.data || []
}))
const universityHistoryData = computed(() => ({
    2022: data.value?.universityTargetResults.find((t) => t.year === 2022)?.data || [],
    2023: data.value?.universityTargetResults.find((t) => t.year === 2023)?.data || [],
    2024: data.value?.universityTargetResults.find((t) => t.year === 2024)?.data || [],
    2025: data.value?.universityTargetResults.find((t) => t.year === 2025)?.data || []
}))
const kps = computed(() => target.value?.items.find((target) => target.code === 'kps'))
const klt = computed(() => target.value?.items.find((target) => target.code === 'klt'))
const isb = computed(() => target.value?.items.find((target) => target.code === 'isb'))

const getTargetIndicatorValue = (targetId: string, itemId: string) => {
    const target = facultyTarget.value?.data.find((t) => t.targetId === targetId)
    const indicator = target?.indicators.find((i) => i.indicatorId === itemId)

    if (!indicator || (indicator && !indicator.target)) return null

    return indicator.target
}
const handleSubmit = async (shouldApprove = false) => {
    try {
        isLoading.value = true
        const targetData =
            target.value?.items.map((target: TargetItems) => ({
                targetId: target.id,
                indicators: target.indicators.map((indicator: { id: string }) => ({
                    indicatorId: indicator.id,
                    target: formData.value[indicator.id],
                    // actual: 0,
                    lastUpdatedAt: new Date()
                }))
            })) || []

        await useRequest(`/manager/faculties/${route.params.facultyId}/targets/${route.params.targetId}`, {
            method: 'PATCH',
            body: {
                data: targetData
            }
        })

        if (shouldApprove) {
            await completeFacultyTarget()
        }

        isLoading.value = false
        $toast({
            title: 'Fakülte hedefleri başarıyla güncellendi.'
        })
        navigateTo(`/admin/faculties`)
    } catch (err: any) {
        console.log('err', err)
        isLoading.value = false
        $toast({
            title: 'Hedefler kaydedilirken bir hata meydana geldi.',
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
const completeFacultyTarget = async () => {
    try {
        isCompleteLoading.value = true
        await useRequest(`/manager/faculties/${route.params.facultyId}/targets/${route.params.targetId}/complete`, { method: 'PATCH' })
        $toast({
            title: 'Fakülte hedefleri başarıyla onaylandı.'
        })
        isCompleteLoading.value = false
        navigateTo(`/admin/faculties`)
    } catch (err) {
        console.error(err)
        isCompleteLoading.value = false
        $toast({
            title: 'Hedefler onaylanırken bir hata meydana geldi.',
            description: 'Lütfen daha sonra tekrar deneyiniz.'
        })
    }
}

const { data } = await useAsyncData(`faculty-target-${route.params.targetId}`, async () => {
    const [faculty, targetResults, facultyTargetResult, facultyTargetResults, universityTargetResults] = await Promise.all([
        useRequest<Faculty>(`/manager/faculties/${route.params.facultyId}`),
        useRequest<Target[]>('/user/targets', { query: { onlyData: true } }),
        useRequest<FacultyTarget>(`/manager/faculties/${route.params.facultyId}/targets/${route.params.targetId}`),
        useRequest<FacultyTarget[]>(`/manager/faculties/${route.params.facultyId}/targets`, { query: { facultyId: route.params.facultyId, onlyData: true } }),
        useRequest<UniversityTarget[]>(`/manager/universities/targets`, { query: { onlyData: true } })
    ])

    return { faculty, targetResult: targetResults[0], facultyTargetResult, facultyTargetResults, universityTargetResults }
})

watch(
    () => data.value,
    () => {
        if (!data.value) return

        const values: Record<string, number | null> = {}

        kps.value?.indicators.forEach((item) => {
            values[item.id] = getTargetIndicatorValue((kps.value as TargetItems).id, item.id)
        })

        klt.value?.indicators.forEach((item) => {
            values[item.id] = getTargetIndicatorValue((klt.value as TargetItems).id, item.id)
        })

        isb.value?.indicators.forEach((item) => {
            values[item.id] = getTargetIndicatorValue((isb.value as TargetItems).id, item.id)
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
                <CardTitle>2025 Yılı {{ data?.faculty?.name }} Ar-Ge Hedefleri</CardTitle>

                <AlertDialog v-model:open="isOpenDialog">
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Fakülte hedeflerini onaylamak istediğinize emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Fakültenin 2025 yılı hedeflerini onaylamak için "Onayla" butonuna tıklayınız.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction @click="completeFacultyTarget">Onayla</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button v-if="facultyTarget && facultyTarget.status === 'IN_PROGRESS'" :disabled="isCompleteLoading" @click="isOpenDialog = true">
                    <Loader v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                    <CheckCheck v-else class="h-4 w-4 me-1" />
                    Hedefleri Onayla
                </Button>
            </CardHeader>
            <CardContent class="p-5">
                <Tabs default-value="faculty-target">
                    <TabsList class="w-full grid grid-cols-2">
                        <TabsTrigger value="faculty-target">Fakülte Ar-Ge Hedefleri</TabsTrigger>
                        <TabsTrigger value="university-target">Üniversite Ar-Ge Hedefleri</TabsTrigger>
                    </TabsList>
                    <TabsContent value="faculty-target">
                        <TargetKPS
                            v-if="currentStep === 1"
                            v-model="formData"
                            :indicators="kps?.indicators"
                            :target-id="kps?.id"
                            :history-data="historyData"
                            :is-completed="facultyTarget?.status === 'COMPLETED'"
                            :is-only-shown="false"
                            @next="handleNext"
                        />
                        <TargetKLT
                            v-if="currentStep === 2"
                            v-model="formData"
                            :indicators="klt?.indicators"
                            :target-id="klt?.id"
                            :history-data="historyData"
                            :is-completed="facultyTarget?.status === 'COMPLETED'"
                            :is-only-shown="false"
                            @next="handleNext"
                            @prev="handlePrev"
                        />
                        <TargetISB
                            v-if="currentStep === 3"
                            v-model="formData"
                            :indicators="isb?.indicators"
                            :is-loading="isLoading"
                            :is-completed="facultyTarget?.status === 'COMPLETED'"
                            :target-id="isb?.id"
                            :history-data="historyData"
                            :is-only-shown="false"
                            @submit="handleSubmit(false)"
                            @submit-and-approve="handleSubmit(true)"
                            @prev="handlePrev"
                        />
                    </TabsContent>
                    <TabsContent value="university-target">
                        <TargetKPS
                            v-if="currentStep === 1"
                            v-model="formData"
                            :indicators="kps?.indicators"
                            :target-id="kps?.id"
                            :history-data="universityHistoryData"
                            :is-completed="true"
                            :is-only-shown="true"
                            @next="handleNext"
                        />
                        <TargetKLT
                            v-if="currentStep === 2"
                            v-model="formData"
                            :indicators="klt?.indicators"
                            :target-id="klt?.id"
                            :history-data="universityHistoryData"
                            :is-completed="true"
                            :is-only-shown="true"
                            @next="handleNext"
                            @prev="handlePrev"
                        />
                        <TargetISB
                            v-if="currentStep === 3"
                            v-model="formData"
                            :indicators="isb?.indicators"
                            :is-loading="isLoading"
                            :is-completed="true"
                            :is-only-shown="true"
                            :target-id="isb?.id"
                            :history-data="universityHistoryData"
                            @submit="handleSubmit(false)"
                            @submit-and-approve="handleSubmit(true)"
                            @prev="handlePrev"
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
</template>

