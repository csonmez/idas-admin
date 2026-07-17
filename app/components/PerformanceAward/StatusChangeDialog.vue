<script setup lang="ts">
import type { AwardStatus, ListType } from '@/types'

interface ScopeScoreSummary {
    id: string
    listType: ListType
    rank: number
    totalInGroup: number
    isTopTenPercent: boolean
}

const props = withDefaults(defineProps<{
    open: boolean
    awardId: string
    currentStatus: AwardStatus
    userName: string
    academicUnitLines?: string[]
    scopeScores?: ScopeScoreSummary[]
    scopeScoresLoading?: boolean
}>(), {
    academicUnitLines: () => [],
    scopeScores: () => [],
    scopeScoresLoading: false
})

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'changed'): void
}>()

const comment = ref('')
const loading = ref(false)
const commentError = ref('')

const newStatus = computed<AwardStatus>(() => (props.currentStatus === 'AWARDED' ? 'EXCLUDED' : 'AWARDED'))

const newStatusLabel = computed(() => (newStatus.value === 'EXCLUDED' ? 'Ödül dışı bırakıldı' : 'Ödül alıyor'))

const listTypeLabels: Record<ListType, string> = {
    UNIVERSITY: 'Üniversite',
    FACULTY: 'Fakülte',
    DEPARTMENT: 'Bölüm',
    DISCIPLINE: 'Anabilim Dalı'
}

const academicUnitLabels = ['Fakülte', 'Bölüm', 'Ana Bilim Dalı']

const handleClose = () => {
    comment.value = ''
    commentError.value = ''
    emit('update:open', false)
}

const handleSubmit = async () => {
    if (!comment.value.trim()) {
        commentError.value = 'Yorum zorunludur.'
        return
    }
    commentError.value = ''
    loading.value = true
    try {
        await useRequest(`/manager/performance-awards/${props.awardId}/status`, {
            method: 'PATCH',
            body: {
                status: newStatus.value,
                comment: comment.value.trim()
            }
        })
    } catch (error: any) {
        const code = error?.data?.code
        if (code === 'OPERATION_NOT_ALLOWED') {
            $toast({
                title: 'İşlem yapılamadı',
                description: 'Kullanıcı zaten bu durumda.',
                variant: 'destructive'
            })
        } else {
            $toast({
                title: 'Hata',
                description: error?.data?.message || 'Durum güncellenemedi.',
                variant: 'destructive'
            })
        }
        loading.value = false
        return
    } finally {
        loading.value = false
    }

    $toast({
        title: 'Durum güncellendi',
        description: `${props.userName} kullanıcısının durumu "${newStatusLabel.value}" olarak güncellendi.`
    })
    comment.value = ''
    emit('changed')
}
</script>

<template>
    <Dialog :open="open" @update:open="handleClose">
        <DialogContent class="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Durumu Değiştir</DialogTitle>
                <DialogDescription>Bu işlem geri alınabilir.</DialogDescription>
            </DialogHeader>

            <div class="space-y-4 py-2">
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
                    <div class="flex justify-between gap-4">
                        <span class="text-gray-500">İsim Soyisim</span>
                        <span class="font-medium text-right">{{ userName }}</span>
                    </div>
                    <div v-for="(line, index) in academicUnitLines" :key="line" class="flex justify-between gap-4">
                        <span class="text-gray-500">{{ academicUnitLabels[index] }}</span>
                        <span class="font-medium text-right">{{ line }}</span>
                    </div>
                </div>

                <div class="rounded-lg border border-gray-200 overflow-hidden text-xs">
                    <div class="bg-gray-50 px-3 py-2 font-semibold text-gray-600">Kapsam Sıralamaları</div>
                    <div v-if="scopeScoresLoading" class="px-3 py-3 text-muted-foreground">Kapsam sıralamaları yükleniyor...</div>
                    <div v-else-if="!scopeScores.length" class="px-3 py-3 text-muted-foreground">Gösterilecek kapsam sıralaması bulunamadı.</div>
                    <div v-else>
                        <div class="grid grid-cols-[1fr_90px_70px] border-b border-gray-200 bg-gray-50">
                            <div class="px-3 py-2 font-semibold text-gray-600">Kapsam</div>
                            <div class="px-3 py-2 text-right font-semibold text-gray-600">Sıralama</div>
                            <div class="px-3 py-2 text-center font-semibold text-gray-600">İlk %10</div>
                        </div>
                        <div class="divide-y divide-gray-100">
                            <div v-for="score in scopeScores" :key="score.id" class="grid grid-cols-[1fr_90px_70px]">
                                <div class="px-3 py-2 font-medium text-gray-700">{{ listTypeLabels[score.listType] }}</div>
                                <div class="px-3 py-2 text-right tabular-nums">{{ score.rank }} / {{ score.totalInGroup }}</div>
                                <div class="px-3 py-2 text-center">
                                    <span :class="`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${score.isTopTenPercent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`">
                                        {{ score.isTopTenPercent ? 'Evet' : 'Hayır' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label class="text-sm font-medium">Yorum <span class="text-red-500">*</span></label>
                    <Textarea v-model="comment" placeholder="Durum değişikliği için açıklama girin..." rows="3" :class="commentError ? 'border-red-400' : ''" />
                    <p v-if="commentError" class="text-xs text-red-500">{{ commentError }}</p>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" :disabled="loading" @click="handleClose">İptal</Button>
                <Button :disabled="loading" @click="handleSubmit">
                    <span v-if="loading" class="flex items-center gap-2">
                        <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Kaydediliyor...
                    </span>
                    <span v-else>Kaydet</span>
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
