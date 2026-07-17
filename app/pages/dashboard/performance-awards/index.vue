<script setup lang="ts">
import { MoreHorizontal, Trophy } from 'lucide-vue-next'
import type { CalculateResponse } from '@/types'

const year = ref(2025)
const activeTab = ref<'scores' | 'awards'>('scores')
const calculateLoading = ref(false)
const showCalculateConfirm = ref(false)
const scoresTabRef = ref<{ refresh: () => void } | null>(null)
const awardsTabRef = ref<{ refresh: () => void } | null>(null)

const refreshAll = () => {
    scoresTabRef.value?.refresh()
    awardsTabRef.value?.refresh()
}

const handleCalculate = async () => {
    calculateLoading.value = true
    showCalculateConfirm.value = false
    try {
        const result = await useRequest<CalculateResponse>('/manager/performance-awards/calculate', {
            method: 'POST',
            body: { year: year.value }
        })
        $toast({
            title: 'Hesaplama tamamlandı',
            description: `${result.totalUsers} kullanıcı işlendi.`
        })
        refreshAll()
    } catch (error: any) {
        if (error?.status === 429) {
            $toast({
                title: 'Hesaplama devam ediyor',
                description: 'Hesaplama devam ediyor, lütfen bekleyin.',
                variant: 'destructive'
            })
        } else {
            $toast({
                title: 'Hata',
                description: error?.data?.message || 'Hesaplama başlatılamadı.',
                variant: 'destructive'
            })
        }
    } finally {
        calculateLoading.value = false
    }
}
</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
        <Card>
            <CardHeader>
                <div class="flex flex-row justify-between items-center gap-4 flex-wrap">
                    <div class="flex items-center gap-2">
                        <Trophy class="h-5 w-5 text-yellow-500" />
                        <CardTitle>Performans Ödülleri</CardTitle>
                        <Badge variant="outline" class="ml-1">{{ year }}</Badge>
                    </div>
                    <div class="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button size="icon" variant="ghost" class="opacity-60 hover:opacity-100">
                                    <MoreHorizontal class="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem @click="showCalculateConfirm = true">Hesaplamayı Yenile</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <CardContent class="p-0">
                <Tabs v-model="activeTab" class="w-full">
                    <div class="px-6">
                        <TabsList class="mb-4 grid h-auto w-full grid-cols-2 gap-1.5 bg-transparent p-0">
                            <TabsTrigger
                                value="scores"
                                class="h-10 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900 data-[state=active]:border-green-600 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                            >
                                Skorlar
                            </TabsTrigger>
                            <TabsTrigger
                                value="awards"
                                class="h-10 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900 data-[state=active]:border-green-600 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                            >
                                Ödüller
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="scores" class="mt-0">
                        <PerformanceAwardScoresTab ref="scoresTabRef" :year="year" @status-changed="refreshAll" />
                    </TabsContent>
                    <TabsContent value="awards" class="mt-0">
                        <PerformanceAwardAwardsTab ref="awardsTabRef" :year="year" @status-changed="refreshAll" />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        <!-- Hesaplama Onay Dialog -->
        <AlertDialog :open="showCalculateConfirm" @update:open="showCalculateConfirm = $event">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hesaplamayı Yenile</AlertDialogTitle>
                    <AlertDialogDescription>{{ year }} yılı performans hesaplaması yeniden yapılacak. Devam etmek istiyor musunuz?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction :disabled="calculateLoading" @click="handleCalculate">
                        <span v-if="calculateLoading" class="flex items-center gap-2">
                            <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Hesaplanıyor...
                        </span>
                        <span v-else>Evet, Hesapla</span>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
</template>
