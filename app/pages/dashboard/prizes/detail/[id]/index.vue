<script setup lang="ts">
import { Award, Users, Trash2, Clock, MoreHorizontal, Edit, Building, FileText } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { AwardDetailResponse, UserAwardsResponse } from '@/types'

const route = useRoute()
const prizeId = route.params.id as string

const isDeleting = ref(false)
const showDeleteDialog = ref(false)
const showRemoveDialog = ref(false)
const pendingRemoveId = ref<string | null>(null)

// idas-api admin detay: GET /awards/:id -> { award }
const {
    data,
    pending: loading,
    error,
    refresh
} = await useAsyncData(`prize-${prizeId}`, async () => {
    const res = await useRequest<AwardDetailResponse>(`/awards/${prizeId}`, { method: 'GET' })
    return res.award
})

const prize = computed(() => data.value)

// Ödül sahipleri ayrı uçtan: GET /awards/:id/user-awards -> { rows } (sadece userId)
const { data: recipientsData, refresh: refreshRecipients } = await useAsyncData(`prize-${prizeId}-recipients`, async () => {
    return await useRequest<UserAwardsResponse>(`/awards/${prizeId}/user-awards`, {
        method: 'GET',
        query: { page: 1, limit: 100 }
    })
})

const researchersList = computed(() => recipientsData.value?.rows ?? [])

const typeLabel = (t?: string | null) => (t === 'INTERNATIONAL' ? 'Uluslararası' : t === 'NATIONAL' ? 'Ulusal' : null)

// TODO: "Araştırmacı ekle" için kullanıcı arama gerekiyor; idas-api'de henüz kullanıcı
// arama endpoint'i yok (eski /manager/users kalktı). Endpoint eklenince POST
// /awards/:id/user-awards ({ userId }) ile ekleme dialogu geri gelecek.

const confirmRemoveResearcher = (userAwardId: string) => {
    pendingRemoveId.value = userAwardId
    showRemoveDialog.value = true
}

const removeResearcher = async (userAwardId: string) => {
    try {
        await useRequest(`/awards/${prizeId}/user-awards/${userAwardId}`, { method: 'DELETE' })
        $toast({ title: 'Araştırmacı kaldırıldı', description: 'Araştırmacı ödül listesinden kaldırıldı.' })
        await refreshRecipients()
    } catch {
        $toast({ title: 'Hata', description: 'Araştırmacı kaldırılırken bir hata oluştu.', variant: 'destructive' })
    }
}

const deletePrize = async () => {
    try {
        isDeleting.value = true
        await useRequest(`/awards/${prizeId}`, { method: 'DELETE' })
        $toast({ title: 'Ödül başarıyla silindi', description: `${prize.value?.title} ödülü sistemden kaldırıldı.` })
        navigateTo('/dashboard/prizes')
    } catch {
        $toast({ title: 'Hata', description: 'Ödül silinirken bir hata oluştu.', variant: 'destructive' })
    } finally {
        isDeleting.value = false
        showDeleteDialog.value = false
    }
}
</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
        <!-- Yükleniyor -->
        <div v-if="loading" class="space-y-4 mb-6">
            <div class="animate-pulse">
                <div class="h-10 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
            </div>
        </div>

        <!-- Hata -->
        <div v-else-if="error" class="text-center py-8 space-y-4 mb-6">
            <div class="text-red-600 dark:text-red-400">
                <p class="font-medium">Ödül bilgileri yüklenemedi</p>
                <p class="text-sm mt-1">{{ error?.message || 'Bilinmeyen bir hata oluştu' }}</p>
            </div>
            <Button variant="outline" size="sm" @click="refresh()">Tekrar Dene</Button>
        </div>

        <!-- Ödül içeriği -->
        <div v-if="prize" class="space-y-6">
            <!-- Ana Bilgiler -->
            <Card class="w-full max-w-full">
                <CardHeader>
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="flex items-center gap-2">
                                <CardTitle class="text-xl">{{ prize?.title }}</CardTitle>
                                <Badge v-if="prize?.year" variant="secondary" class="text-xs">{{ prize.year }}</Badge>
                                <Badge v-if="typeLabel(prize?.type)" variant="outline" class="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {{ typeLabel(prize?.type) }}
                                </Badge>
                            </div>
                            <CardDescription>Ödül ID: {{ prize.id }}</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="sm" class="h-8 w-8 p-0" aria-label="Ödül işlemleri">
                                    <MoreHorizontal class="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem @click="navigateTo(`/dashboard/prizes/detail/${prizeId}/update`)" class="text-gray-900 focus:text-gray-900 focus:bg-gray-100">
                                    <Edit class="h-4 w-4 mr-2" />
                                    Ödülü Güncelle
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="showDeleteDialog = true" class="text-gray-900 focus:text-gray-900 focus:bg-gray-100">
                                    <Trash2 class="h-4 w-4 mr-2" />
                                    Ödülü Sil
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Ödül Bilgileri -->
                        <div class="space-y-3">
                            <h4 class="font-medium text-sm text-muted-foreground">Ödül Bilgileri</h4>
                            <div class="space-y-2">
                                <div class="flex items-center space-x-2">
                                    <Award class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Ödül Türü:</span>
                                    <Badge v-if="typeLabel(prize?.type)" variant="outline" class="bg-blue-50 text-blue-700 border-blue-200">
                                        {{ typeLabel(prize?.type) }}
                                    </Badge>
                                    <span v-else class="text-sm text-muted-foreground">Belirtilmemiş</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Building class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Kurum:</span>
                                    <span class="text-sm">{{ prize?.organization || 'Belirtilmemiş' }}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Clock class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Ödül Tarihi:</span>
                                    <span class="text-sm">{{ prize?.date ? new Date(prize.date).toLocaleDateString('tr-TR') : 'Bilinmiyor' }}</span>
                                </div>
                                <div v-if="prize?.description" class="flex items-start space-x-2">
                                    <FileText class="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span class="text-sm font-medium">Açıklama:</span>
                                    <span class="text-sm">{{ prize.description }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Tarih Bilgileri -->
                        <div class="space-y-3">
                            <h4 class="font-medium text-sm text-muted-foreground">Tarih Bilgileri</h4>
                            <div class="space-y-2">
                                <div class="flex items-center space-x-2">
                                    <Clock class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Eklenme Tarihi:</span>
                                    <span class="text-sm">{{ prize?.createdAt ? new Date(prize.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor' }}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Clock class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Son Güncelleme:</span>
                                    <span class="text-sm">{{ prize?.updatedAt ? new Date(prize.updatedAt).toLocaleDateString('tr-TR') : 'Bilinmiyor' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Araştırmacı / Ödül Sahipleri -->
            <Card class="w-full max-w-full">
                <CardHeader>
                    <CardTitle class="flex items-center space-x-2">
                        <Users class="h-5 w-5" />
                        <span>Araştırmacı ({{ researchersList.length }})</span>
                    </CardTitle>
                    <!-- TODO: Araştırmacı ekleme, idas-api'ye kullanıcı arama endpoint'i eklenince geri gelecek -->
                </CardHeader>
                <CardContent>
                    <div v-if="researchersList.length === 0" class="text-center py-8 text-muted-foreground">
                        Bu ödül için henüz araştırmacı bilgisi bulunmuyor.
                    </div>
                    <div v-else class="space-y-3">
                        <div v-for="researcher in researchersList" :key="researcher.id" class="flex items-center justify-between p-3 border rounded-lg">
                            <button @click="navigateTo(`/dashboard/academicians/${researcher.userId}`)" class="text-left transition-colors hover:text-blue-600 cursor-pointer">
                                <p class="font-medium">Akademisyeni Görüntüle</p>
                            </button>
                            <Button variant="ghost" size="sm" @click="confirmRemoveResearcher(researcher.id)" class="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" aria-label="Araştırmacıyı kaldır">
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- Silme Dialog -->
        <Dialog v-model:open="showDeleteDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ödülü Sil</DialogTitle>
                    <DialogDescription>
                        Bu işlem geri alınamaz. <strong>{{ prize?.title }}</strong> ödülü kalıcı olarak silinecektir.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter class="flex gap-2">
                    <DialogClose as-child>
                        <Button variant="outline">İptal</Button>
                    </DialogClose>
                    <Button variant="destructive" @click="deletePrize" :disabled="isDeleting">
                        <Trash2 v-if="!isDeleting" class="h-5 w-5 mr-2" />
                        <div v-else class="animate-spin rounded-full h-5 w-5 mr-2 border-b-2 border-white" />
                        {{ isDeleting ? 'Siliniyor...' : 'Ödülü Sil' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Araştırmacı Kaldırma Onay Dialog -->
        <AlertDialog v-model:open="showRemoveDialog">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Araştırmacıyı Kaldır</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu araştırmacıyı ödül listesinden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel @click="pendingRemoveId = null">İptal</AlertDialogCancel>
                    <AlertDialogAction
                        class="bg-red-600 hover:bg-red-700 text-white"
                        @click="pendingRemoveId && removeResearcher(pendingRemoveId); pendingRemoveId = null"
                    >
                        <Trash2 class="h-4 w-4 mr-2" />
                        Kaldır
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <!-- Bulunamadı -->
        <Card v-if="!prize && !loading && !error" class="max-w-md mx-auto shadow-md border-t-4 border-t-red-500">
            <CardHeader>
                <CardTitle>Ödül bulunamadı</CardTitle>
                <CardDescription>Aradığınız ödül bulunamadı veya erişim izniniz yok.</CardDescription>
            </CardHeader>
            <CardContent class="flex justify-end">
                <Button @click="navigateTo('/dashboard/prizes')">Geri Dön</Button>
            </CardContent>
        </Card>
    </div>
</template>
