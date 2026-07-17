<script setup lang="ts">
import type { Target, TargetItems, TargetIndicator, FacultyTarget, Faculty } from '~/types'
import { ArrowLeft, Calendar, CheckCheck, Loader, RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import UnitTargetIndicatorTable, { type UnitTargetIndicator } from '@/components/Target/UnitTargetIndicatorTable.vue'

const route = useRoute()
const router = useRouter()
const facultyId = computed(() => route.params.facultyId as string)

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear.toString())
const availableYears = [2022, 2023, 2024, 2025, 2026].filter((y) => y <= currentYear + 1).reverse()

const isLoading = ref(false)
const isCompleteLoading = ref(false)
const isRevokeLoading = ref(false)
const isOpenApproveDialog = ref(false)
const isOpenRevokeDialog = ref(false)
const formData = ref<Record<string, number | null>>({})

const { data, pending, error, refresh } = await useAsyncData(
    `faculty-target-detail-${facultyId.value}`,
    async () => {
        const [facultyRes, targetsRes, facultyTargetsRes] = await Promise.all([
            useRequest<Faculty>(`/manager/faculties/${facultyId.value}`),
            useRequest<Target[] | { rows: Target[] }>('/manager/targets', { query: { onlyData: true } }),
            useRequest<FacultyTarget[]>(`/manager/faculty-targets`, {
                query: { facultyId: facultyId.value, includeAllYears: true, onlyData: true }
            })
        ])

        const targetRows = Array.isArray(targetsRes) ? targetsRes : ((targetsRes as { rows: Target[] })?.rows ?? [])
        return {
            faculty: facultyRes,
            targets: targetRows,
            facultyTargets: facultyTargetsRes ?? []
        }
    },
    { watch: [facultyId] }
)

const targetStructure = computed(() => {
    const year = Number(selectedYear.value)
    const targets = data.value?.targets ?? []
    const arr = Array.isArray(targets) ? targets : []
    return (arr as Target[]).find((t: Target) => t.year === year) ?? (arr as Target[])[0]
})

const currentFacultyTarget = computed(() => {
    const year = Number(selectedYear.value)
    return data.value?.facultyTargets?.find((ft: FacultyTarget) => ft.year === year) ?? null
})

const getIndicatorValue = (targetId: string, indicatorId: string, type: 'target' | 'actual') => {
    const ft = currentFacultyTarget.value
    if (!ft?.data) return null
    const cat = ft.data.find((d: { targetId: string }) => d.targetId === targetId)
    const ind = cat?.indicators?.find((i: { indicatorId: string }) => i.indicatorId === indicatorId)
    if (!ind) return null
    const val = type === 'target' ? ind.target : ind.actual
    if (val === null || val === undefined || val === '-') return null
    return Number(val)
}

const processedData = computed(() => {
    if (!targetStructure.value?.items) return []

    const items = targetStructure.value.items as TargetItems[]

    return items.map((category: TargetItems) => {
        return {
            id: category.id,
            code: category.code,
            title: category.title,
            indicators: (category.indicators ?? []).map((ind: TargetIndicator) => ({
                id: ind.id,
                indicator: ind.indicator,
                description: ind.description,
                target: getIndicatorValue(category.id, ind.id, 'target'),
                actual: getIndicatorValue(category.id, ind.id, 'actual'),
                minValue: ind.minValue ?? 0,
                maxValue: ind.maxValue ?? 999,
                weight: ind.weight ?? 0
            })) as UnitTargetIndicator[]
        }
    })
})

watch(
    [data, selectedYear, () => currentFacultyTarget.value],
    () => {
        if (!targetStructure.value?.items) return
        const values: Record<string, number | null> = {}
        const items = targetStructure.value.items as TargetItems[]
        items.forEach((cat: TargetItems) => {
            cat.indicators?.forEach((ind: TargetIndicator) => {
                values[ind.id] = getIndicatorValue(cat.id, ind.id, 'target')
            })
        })
        formData.value = values
    },
    { immediate: true }
)

const getCategoryColor = (code: string) => {
    switch (code) {
        case 'kps':
            return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
        case 'klt':
            return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
        case 'isb':
            return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    }
}

const handleSave = async () => {
    if (!currentFacultyTarget.value || !targetStructure.value?.items) return
    try {
        isLoading.value = true
        const items = targetStructure.value.items as TargetItems[]
        const targetData = items.map((cat: TargetItems) => ({
            targetId: cat.id,
            indicators: (cat.indicators ?? []).map((ind: TargetIndicator) => ({
                indicatorId: ind.id,
                target: formData.value[ind.id],
                lastUpdatedAt: new Date()
            }))
        }))

        await useRequest(`/manager/faculties/${facultyId.value}/targets/${currentFacultyTarget.value.id}`, {
            method: 'PATCH',
            body: { data: targetData }
        })

        $toast({ title: 'Fakülte hedefleri başarıyla güncellendi.' })
        await refresh()
    } catch (err) {
        console.error(err)
        $toast({
            title: 'Hedefler kaydedilirken bir hata meydana geldi.',
            description: 'Lütfen daha sonra tekrar deneyiniz.',
            variant: 'destructive'
        })
    } finally {
        isLoading.value = false
    }
}

const handleComplete = async () => {
    if (!currentFacultyTarget.value) return
    try {
        isCompleteLoading.value = true
        await useRequest(`/manager/faculties/${facultyId.value}/targets/${currentFacultyTarget.value.id}/complete`, {
            method: 'PATCH'
        })
        $toast({ title: 'Fakülte hedefleri başarıyla onaylandı.' })
        isOpenApproveDialog.value = false
        await refresh()
    } catch (err) {
        console.error(err)
        $toast({
            title: 'Hedefler onaylanırken bir hata meydana geldi.',
            description: 'Lütfen daha sonra tekrar deneyiniz.',
            variant: 'destructive'
        })
    } finally {
        isCompleteLoading.value = false
    }
}

const handleRevoke = async () => {
    if (!currentFacultyTarget.value) return
    try {
        isRevokeLoading.value = true
        await useRequest(`/manager/faculties/${facultyId.value}/targets/${currentFacultyTarget.value.id}/revoke`, {
            method: 'PATCH'
        })
        $toast({ title: 'Onay başarıyla geri alındı.' })
        isOpenRevokeDialog.value = false
        await refresh()
    } catch (err) {
        console.error(err)
        $toast({
            title: 'Onay geri alınırken bir hata meydana geldi.',
            description: 'Lütfen daha sonra tekrar deneyiniz.',
            variant: 'destructive'
        })
    } finally {
        isRevokeLoading.value = false
    }
}

const isCompleted = computed(() => currentFacultyTarget.value?.status === 'COMPLETED')
const isInProgress = computed(() => currentFacultyTarget.value?.status === 'IN_PROGRESS')
const isActiveYear = computed(() => Number(selectedYear.value) === currentYear)
</script>

<template>
    <div class="flex-1 px-4 pb-8 md:px-8 md:pb-10">
        <div class="mx-auto w-full max-w-7xl">
            <div class="mb-6">
                <div class="flex items-center gap-3 mb-1">
                    <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0" @click="router.back()">
                        <ArrowLeft class="w-4 h-4" />
                    </Button>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Hedef Yönetimi – {{ data?.faculty?.name ?? 'Fakülte' }}</h1>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 ml-11 mb-3">Fakülte hedeflerini yıl bazında görüntüleyin ve düzenleyin</p>
                <div
                    class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-900/50 px-5 py-3 shadow-sm backdrop-blur-sm"
                >
                    <div class="flex items-center gap-2.5">
                        <Calendar class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <Label class="text-sm font-medium text-gray-600 dark:text-gray-400">Yıl</Label>
                        <Select v-model="selectedYear">
                            <SelectTrigger class="w-[110px] h-9 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="y in availableYears" :key="y" :value="String(y)">
                                    {{ y }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div v-if="currentFacultyTarget && Number(selectedYear) === currentYear" class="flex items-center gap-2">
                        <Button v-if="isInProgress" size="sm" :disabled="isCompleteLoading" @click="isOpenApproveDialog = true" class="h-9">
                            <Loader v-if="isCompleteLoading" class="w-4 h-4 mr-1.5 animate-spin" />
                            <CheckCheck v-else class="w-4 h-4 mr-1.5" />
                            Onayla
                        </Button>
                        <Button v-if="isCompleted" size="sm" variant="outline" :disabled="isRevokeLoading" @click="isOpenRevokeDialog = true" class="h-9">
                            <RotateCcw v-if="!isRevokeLoading" class="w-4 h-4 mr-1.5" />
                            <Loader v-else class="w-4 h-4 mr-1.5 animate-spin" />
                            Onayı Geri Al
                        </Button>
                    </div>
                </div>
            </div>

            <AlertDialog v-model:open="isOpenApproveDialog">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fakülte hedeflerini onaylamak istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription> {{ data?.faculty?.name }} fakültesinin {{ selectedYear }} yılı Ar-Ge hedeflerini onaylamak için "Onayla" butonuna tıklayınız. </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction @click="handleComplete" :disabled="isCompleteLoading">Onayla</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog v-model:open="isOpenRevokeDialog">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Onayı geri almak istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {{ data?.faculty?.name }} fakültesinin {{ selectedYear }} yılı hedef onayı geri alınacak. Hedefler yeniden düzenlenebilir hale gelecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction @click="handleRevoke" :disabled="isRevokeLoading" class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >Onayı Geri Al</AlertDialogAction
                        >
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div v-if="pending" class="space-y-6">
                <Card v-for="i in 3" :key="i">
                    <CardHeader>
                        <Skeleton class="h-8 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div class="space-y-3">
                            <Skeleton class="h-12 w-full" />
                            <Skeleton class="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card v-else-if="error">
                <CardContent class="pt-6">
                    <div class="text-center py-8 space-y-4">
                        <div class="text-red-600 dark:text-red-400">
                            <p class="font-medium">Hedef verileri yüklenemedi</p>
                            <p class="text-sm mt-1">{{ error?.message ?? 'Bilinmeyen bir hata oluştu' }}</p>
                        </div>
                        <Button variant="outline" size="sm" @click="refresh()">Tekrar Dene</Button>
                    </div>
                </CardContent>
            </Card>

            <div v-else-if="processedData.length > 0 && currentFacultyTarget" class="space-y-6">
                <Card v-for="category in processedData" :key="category.code">
                    <CardHeader>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border" :class="getCategoryColor(category.code)">
                                    {{ category.title }}
                                </span>
                                <span class="text-sm text-gray-500 dark:text-gray-400"> ({{ category.indicators.length }} gösterge) </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <UnitTargetIndicatorTable v-model="formData" :indicators="category.indicators" :disabled="isCompleted || !isActiveYear" :show-actual="true" @save="handleSave" />
                    </CardContent>
                </Card>
            </div>

            <Card v-else-if="processedData.length > 0 && !currentFacultyTarget">
                <CardContent class="pt-6">
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">Bu yıl için henüz hedef verisi oluşturulmamış.</div>
                </CardContent>
            </Card>

            <Card v-else>
                <CardContent class="pt-6">
                    <div class="text-center py-8">
                        <p class="text-gray-500 dark:text-gray-400">Henüz hedef verisi bulunmuyor.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
