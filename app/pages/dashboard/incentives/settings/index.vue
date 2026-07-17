<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader, Calculator, Save } from 'lucide-vue-next'
import { useRequest } from '~/composables/useRequest'

interface Incentive {
    id: string
    year: number
    activityType: string
    code: string
    description: string
    amount: string
    incentiveTermId: string
    status: string
    isIncludedLimit: boolean
    createdAt: string
    updatedAt: string
}

interface SummaryItem {
    userCount: number
    finalAmount: number
}

interface IncentiveTerm {
    id: string
    year: number
    status: string
    summary: {
        prize: SummaryItem
        patent: SummaryItem
        article: SummaryItem
        project: SummaryItem
        postgraduate: SummaryItem
    }
    pricingStatus: string
    createdAt: string
    updatedAt: string
}

// Önce term'leri çek
const {
    data: incentiveTermsData,
    pending: termsLoading,
    refresh: _refreshTerms
} = await useAsyncData('incentive-terms', async () => {
    return await useRequest<IncentiveTerm[]>('/manager/incentive-terms', { query: { onlyData: true } })
})

// Term'leri yıla göre sırala (en büyükten küçüğe)
const sortedTerms = computed(() => {
    if (!incentiveTermsData.value) return []
    return [...incentiveTermsData.value].sort((a, b) => b.year - a.year)
})

// Seçili yıl ve term
const selectedYear = ref<number | null>(null)
const selectedTerm = computed(() => {
    if (!selectedYear.value) return null
    return sortedTerms.value.find((term) => term.year === selectedYear.value) || null
})

// İlk yüklemede en büyük yılı seç
watchEffect(() => {
    if (!selectedYear.value && sortedTerms.value.length > 0) {
        selectedYear.value = sortedTerms.value[0].year
    }
})

// Seçili term'e göre incentive'ları çek
const {
    data: incentivesData,
    pending: incentivesLoading,
    refresh: _refreshIncentives
} = await useAsyncData(
    'incentives',
    async () => {
        if (!selectedTerm.value?.id) return []
        return await useRequest<Incentive[]>('/manager/incentives', {
            query: {
                onlyData: true,
                termId: selectedTerm.value.id
            }
        })
    },
    {
        watch: [selectedTerm]
    }
)

// 2024 yılı verilerini karşılaştırma için çek
const term2024 = computed(() => {
    return sortedTerms.value.find((term) => term.year === 2024) || null
})

const { data: incentives2024Data, pending: incentives2024Loading } = await useAsyncData(
    'incentives-2024',
    async () => {
        if (!term2024.value?.id) return []
        return await useRequest<Incentive[]>('/manager/incentives', {
            query: {
                onlyData: true,
                termId: term2024.value.id
            }
        })
    },
    {
        watch: [term2024]
    }
)

const incentives2024 = computed(() => incentives2024Data.value || [])

// Reactive state
const incentives = computed(() => incentivesData.value || [])
const isCalculating = ref(false)
const updatingActivityTypes = ref<Record<string, boolean>>({}) // Her aktivite türü için ayrı loading durumu
const isUpdated = ref(false) // Güncelleme yapıldıktan sonra true olur

// 2024 ve 2025 yılları için sadece görüntüleme modu
const isReadOnly = computed(() => selectedYear.value === 2024 || selectedYear.value === 2025)

// Local amount değerleri için state (düzenlenen değerler)
const localAmounts = ref<Record<string, string>>({})
// Local isIncludedLimit değerleri için state
const localIncludedLimits = ref<Record<string, boolean>>({})

// Sayfa yüklendiğinde veya yıl değiştiğinde local state'leri başlat
watchEffect(() => {
    if (incentives.value.length > 0) {
        // Yıl değiştiğinde local state'leri sıfırla ve yeniden doldur
        localAmounts.value = {}
        localIncludedLimits.value = {}
        incentives.value.forEach((incentive) => {
            localAmounts.value[incentive.id] = incentive.amount
            localIncludedLimits.value[incentive.id] = incentive.isIncludedLimit
        })
    }
})

// Aktivite türlerine göre grupla ve amount'a göre sırala (yüksekten düşüğe)
const groupedIncentives = computed(() => {
    const groups: Record<string, Incentive[]> = {}
    incentives.value.forEach((incentive) => {
        if (!groups[incentive.activityType]) {
            groups[incentive.activityType] = []
        }
        groups[incentive.activityType].push(incentive)
    })

    // Her grup için amount'a göre yüksekten düşüğe sırala
    Object.keys(groups).forEach((activityType) => {
        groups[activityType].sort((a, b) => {
            const amountA = parseFloat(a.amount) || 0
            const amountB = parseFloat(b.amount) || 0
            return amountB - amountA // Yüksekten düşüğe
        })
    })

    return groups
})

// 2024 yılı için gruplandırılmış incentive'lar
const groupedIncentives2024 = computed(() => {
    const groups: Record<string, Incentive[]> = {}
    incentives2024.value.forEach((incentive) => {
        if (!groups[incentive.activityType]) {
            groups[incentive.activityType] = []
        }
        groups[incentive.activityType].push(incentive)
    })

    // Her grup için amount'a göre yüksekten düşüğe sırala
    Object.keys(groups).forEach((activityType) => {
        groups[activityType].sort((a, b) => {
            const amountA = parseFloat(a.amount) || 0
            const amountB = parseFloat(b.amount) || 0
            return amountB - amountA // Yüksekten düşüğe
        })
    })

    return groups
})

// Belirli bir incentive için 2024 yılındaki karşılığını bul
const get2024Amount = (activityType: string, description: string) => {
    const incentives2024OfType = groupedIncentives2024.value[activityType] || []
    const match = incentives2024OfType.find((inc) => inc.description === description)
    return match?.amount || '-'
}

// Aktivite türü sırası
const activityTypeOrder = ['ARTICLE', 'PROJECT', 'PATENT', 'PRIZE', 'POSTGRADUATE']

// Filtrelenmiş aktivite türleri (en az bir incentive'i olanlar)
const availableActivityTypes = computed(() => {
    return activityTypeOrder.filter((type) => (groupedIncentives.value[type]?.length ?? 0) > 0)
})

// Summary hesaplamaları
const totalUserCount = computed(() => {
    if (!selectedTerm.value?.summary) return 0
    const summary = selectedTerm.value.summary
    return summary.prize.userCount + summary.patent.userCount + summary.article.userCount + summary.project.userCount + summary.postgraduate.userCount
})

const totalAmount = computed(() => {
    if (!selectedTerm.value?.summary) return 0
    const summary = selectedTerm.value.summary
    return summary.prize.finalAmount + summary.patent.finalAmount + summary.article.finalAmount + summary.project.finalAmount + summary.postgraduate.finalAmount
})

// Para formatı
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value)
}

// ActivityType Türkçe çevirileri
const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        PRIZE: 'Ödül',
        PATENT: 'Patent',
        ARTICLE: 'Makale',
        PROJECT: 'Proje',
        POSTGRADUATE: 'Doktora Mezun'
    }
    return labels[type] || type
}

// Amount değerini güncelle
const updateAmount = (incentiveId: string, value: string) => {
    localAmounts.value[incentiveId] = value
    // Amount değiştiğinde güncelleme durumunu sıfırla
    isUpdated.value = false
}

// isIncludedLimit değerini güncelle
// const updateIncludedLimit = (incentiveId: string, value: boolean) => {
//     localIncludedLimits.value[incentiveId] = value
//     // Değişiklik olduğunda güncelleme durumunu sıfırla
//     isUpdated.value = false
// }

// Belirli bir aktivite türü için değişiklik var mı kontrolü
const hasChangesForActivityType = (activityType: string) => {
    const typeIncentives = groupedIncentives.value[activityType] || []
    return typeIncentives.some((incentive) => {
        const localAmount = localAmounts.value[incentive.id]
        const localIncludedLimit = localIncludedLimits.value[incentive.id]
        return (localAmount && localAmount !== incentive.amount) || localIncludedLimit !== incentive.isIncludedLimit
    })
}

// Belirli bir aktivite türü için güncelleme işlevi
const updateAmountsForActivityType = async (activityType: string) => {
    // TODO: Bu fonksiyonu doldurun
    // Belirli aktivite türüne ait amount değerlerini API'ye gönder
    // Her bir incentive için ayrı ayrı PATCH isteği atılacak: /manager/incentives/{id}
    try {
        updatingActivityTypes.value[activityType] = true

        const typeIncentives = groupedIncentives.value[activityType] || []
        const updates = typeIncentives.filter((incentive) => {
            const localAmount = localAmounts.value[incentive.id]
            const localIncludedLimit = localIncludedLimits.value[incentive.id]
            return (localAmount && localAmount !== incentive.amount) || localIncludedLimit !== incentive.isIncludedLimit
        })

        // Her bir incentive için ayrı PATCH isteği
        await Promise.all(
            updates.map((incentive) =>
                useRequest(`/manager/incentives/${incentive.id}`, {
                    method: 'PATCH',
                    body: {
                        amount: localAmounts.value[incentive.id],
                        isIncludedLimit: localIncludedLimits.value[incentive.id]
                    }
                })
            )
        )

        // Güncelleme başarılı olduğunda local değerleri güncelle
        updates.forEach((incentive) => {
            incentive.amount = localAmounts.value[incentive.id]
            incentive.isIncludedLimit = localIncludedLimits.value[incentive.id]
        })

        isUpdated.value = true

        $toast({
            title: 'Başarılı',
            description: `${getActivityTypeLabel(activityType)} teşvik tutarları güncellendi.`
        })
    } catch (error: unknown) {
        console.error('Güncelleme hatası:', error)
        const errorMessage = error instanceof Error ? error.message : 'Güncelleme sırasında bir hata oluştu.'
        $toast({
            title: 'Hata',
            description: errorMessage,
            variant: 'destructive'
        })
    } finally {
        updatingActivityTypes.value[activityType] = false
    }
}

// Hesapla işlevi
const calculateSummary = async () => {
    if (!selectedTerm.value?.id) {
        $toast({
            title: 'Hata',
            description: 'Teşvik dönemi bulunamadı.',
            variant: 'destructive'
        })
        return
    }

    try {
        isCalculating.value = true

        // Yeniden hesaplama isteği
        await useRequest(`/manager/incentives/recalculate/${selectedTerm.value.id}`, {
            method: 'POST'
        })

        // Summary değerlerini yeniden çek
        await _refreshTerms()

        $toast({
            title: 'Başarılı',
            description: 'Özet bilgiler yeniden hesaplandı.'
        })
    } catch (error: unknown) {
        console.error('Hesaplama hatası:', error)
        const errorMessage = error instanceof Error ? error.message : 'Hesaplama sırasında bir hata oluştu.'
        $toast({
            title: 'Hata',
            description: errorMessage,
            variant: 'destructive'
        })
    } finally {
        isCalculating.value = false
    }
}

const isLoading = computed(() => incentivesLoading.value || termsLoading.value)

// 2026 seçiliyse 2024 verilerini göster
const showComparisonColumn = computed(() => selectedYear.value === 2026)
</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-4 md:p-6 h-full w-full max-w-full overflow-y-auto">
        <!-- Başlık -->
        <div class="flex items-center justify-between gap-4">
            <div class="flex flex-col gap-2">
                <h1 class="text-2xl font-bold">Teşvik Ayarları</h1>
                <p class="text-muted-foreground">Teşvik tutarlarını düzenleyin ve özet bilgileri görüntüleyin</p>
            </div>

            <div class="flex items-center gap-3 bg-card border rounded-lg px-4 py-3 shadow-sm">
                <span class="text-sm font-medium whitespace-nowrap">Teşvik Yılı:</span>
                <Select :model-value="selectedYear?.toString() || ''" @update:model-value="(value) => (selectedYear = parseInt(value as string))">
                    <SelectTrigger class="w-[140px]">
                        <SelectValue placeholder="Yıl seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="term in sortedTerms" :key="term.id" :value="term.year.toString()">
                            {{ term.year }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <!-- Loading durumu -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
            <Loader class="h-8 w-8 animate-spin text-primary" />
        </div>

        <!-- İçerik -->
        <div v-else class="flex flex-col gap-6">
            <!-- Summary Kartları -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Makale -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Makale</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-2">
                        <div>
                            <p class="text-sm text-muted-foreground">Kişi Sayısı</p>
                            <div class="text-2xl font-bold">{{ selectedTerm?.summary?.article?.userCount.toLocaleString('tr-TR') || 0 }}</div>
                        </div>
                        <div>
                            <p class="text-sm text-muted-foreground">Toplam Tutar</p>
                            <div class="text-2xl font-bold">₺{{ formatCurrency(selectedTerm?.summary?.article?.finalAmount || 0) }}</div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Proje -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Proje</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-2">
                        <div>
                            <p class="text-sm text-muted-foreground">Kişi Sayısı</p>
                            <div class="text-2xl font-bold">{{ selectedTerm?.summary?.project?.userCount.toLocaleString('tr-TR') || 0 }}</div>
                        </div>
                        <div>
                            <p class="text-sm text-muted-foreground">Toplam Tutar</p>
                            <div class="text-2xl font-bold">₺{{ formatCurrency(selectedTerm?.summary?.project?.finalAmount || 0) }}</div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Patent -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Patent</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-2">
                        <div>
                            <p class="text-sm text-muted-foreground">Kişi Sayısı</p>
                            <div class="text-2xl font-bold">{{ selectedTerm?.summary?.patent?.userCount.toLocaleString('tr-TR') || 0 }}</div>
                        </div>
                        <div>
                            <p class="text-sm text-muted-foreground">Toplam Tutar</p>
                            <div class="text-2xl font-bold">₺{{ formatCurrency(selectedTerm?.summary?.patent?.finalAmount || 0) }}</div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Ödül -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Ödül</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-2">
                        <div>
                            <p class="text-sm text-muted-foreground">Kişi Sayısı</p>
                            <div class="text-2xl font-bold">{{ selectedTerm?.summary?.prize?.userCount.toLocaleString('tr-TR') || 0 }}</div>
                        </div>
                        <div>
                            <p class="text-sm text-muted-foreground">Toplam Tutar</p>
                            <div class="text-2xl font-bold">₺{{ formatCurrency(selectedTerm?.summary?.prize?.finalAmount || 0) }}</div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Doktora Mezun -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Doktora Mezun</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-2">
                        <div>
                            <p class="text-sm text-muted-foreground">Kişi Sayısı</p>
                            <div class="text-2xl font-bold">{{ selectedTerm?.summary?.postgraduate?.userCount.toLocaleString('tr-TR') || 0 }}</div>
                        </div>
                        <div>
                            <p class="text-sm text-muted-foreground">Toplam Tutar</p>
                            <div class="text-2xl font-bold">₺{{ formatCurrency(selectedTerm?.summary?.postgraduate?.finalAmount || 0) }}</div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Genel Toplam -->
                <Card class="bg-primary text-primary-foreground border-primary shadow-lg">
                    <CardHeader>
                        <CardTitle class="text-lg font-bold">Genel Toplam</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-2">
                        <div>
                            <p class="text-sm opacity-90">Toplam Kişi</p>
                            <div class="text-3xl font-bold">{{ totalUserCount.toLocaleString('tr-TR') }}</div>
                        </div>
                        <div>
                            <p class="text-sm opacity-90">Toplam Tutar</p>
                            <div class="text-3xl font-bold">₺{{ formatCurrency(totalAmount) }}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Hesapla Butonu -->
            <div v-if="!isReadOnly" class="flex justify-end">
                <Button class="gap-2" size="lg" :disabled="!isUpdated || isCalculating" @click="calculateSummary">
                    <Calculator v-if="!isCalculating" class="h-5 w-5" />
                    <Loader v-else class="h-5 w-5 animate-spin" />
                    {{ isCalculating ? 'Hesaplanıyor...' : 'Hesapla' }}
                </Button>
            </div>

            <!-- Aktivite Türüne Göre Card'lar -->
            <div class="flex flex-col gap-6">
                <Card v-for="activityType in availableActivityTypes" :key="activityType" class="overflow-hidden">
                    <CardHeader class="flex flex-row items-center justify-between">
                        <CardTitle>{{ getActivityTypeLabel(activityType) }}</CardTitle>
                        <Button
                            v-if="!isReadOnly && hasChangesForActivityType(activityType)"
                            class="gap-2"
                            :disabled="updatingActivityTypes[activityType]"
                            @click="updateAmountsForActivityType(activityType)"
                        >
                            <Save v-if="!updatingActivityTypes[activityType]" class="h-4 w-4" />
                            <Loader v-else class="h-4 w-4 animate-spin" />
                            {{ updatingActivityTypes[activityType] ? 'Güncelleniyor...' : 'Güncelle' }}
                        </Button>
                    </CardHeader>
                    <div class="max-h-[400px] overflow-y-auto px-6 pb-6" style="max-height: 400px; overflow-y: auto">
                        <Table>
                            <TableHeader class="sticky top-0 bg-background z-10">
                                <TableRow>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead v-if="showComparisonColumn" class="w-[200px] text-center text-muted-foreground">2024 Tutarı (₺)</TableHead>
                                    <TableHead class="w-[200px]">Tutar (₺)</TableHead>
                                    <!-- <TableHead class="w-[150px] text-center">Limite Dahil</TableHead> -->
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow v-for="incentive in groupedIncentives[activityType]" :key="incentive.id">
                                    <TableCell class="max-w-md">
                                        <span class="text-sm">{{ incentive.description }}</span>
                                    </TableCell>
                                    <TableCell v-if="showComparisonColumn" class="text-center text-muted-foreground">
                                        <span class="text-sm">{{ get2024Amount(activityType, incentive.description) === '-' ? '-' : '₺' + get2024Amount(activityType, incentive.description) }}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            class="w-full"
                                            placeholder="Tutar girin"
                                            :model-value="localAmounts[incentive.id] || incentive.amount"
                                            :disabled="isReadOnly"
                                            @update:model-value="(value) => updateAmount(incentive.id, String(value))"
                                        />
                                    </TableCell>
                                    <!-- <TableCell class="text-center">
                                        <div class="flex items-center justify-center">
                                            <Checkbox
                                                :model-value="localIncludedLimits[incentive.id]"
                                                :disabled="isReadOnly"
                                                @update:model-value="(value: boolean) => updateIncludedLimit(incentive.id, value)"
                                            />
                                        </div>
                                    </TableCell> -->
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    </div>
</template>
