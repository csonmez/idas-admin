<script setup lang="ts">
import { Award, Users, Trash2, Clock, Globe, Home, Factory, MoreHorizontal, Edit, FileText } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { PatentDetailResponse } from '@/types'

const route = useRoute()
const patentId = route.params.id as string

const isDeleting = ref(false)
const showDeleteDialog = ref(false)
const showRemoveDialog = ref(false)
const pendingRemoveUserId = ref<string | null>(null)

// idas-api admin detay: GET /patents/admin/:id -> patent + authors[]
const {
    data,
    pending: loading,
    error,
    refresh
} = await useAsyncData(`patent-${patentId}`, async () => {
    return await useRequest<PatentDetailResponse>(`/patents/admin/${patentId}`, { method: 'GET' })
})

const patent = computed(() => data.value)
const researchersList = computed(() => patent.value?.authors ?? [])

const categoryLabel = (c?: string) => (c === 'UTILITY_MODEL' ? 'Faydalı Model' : c === 'PATENT' ? 'Patent' : '-')
const statusLabel = (s?: string) => (s === 'REGISTRATION' ? 'Tescil' : s === 'REJECTION' ? 'Ret' : s === 'APPLICATION' ? 'Başvuru' : '-')

// TODO: "Araştırmacı ekle" için kullanıcı arama gerekiyor; idas-api'de henüz kullanıcı
// arama endpoint'i yok (eski /manager/users kalktı). Endpoint eklenince PUT
// /patents/admin/:id ({ userIds: [...] }) ile ekleme dialogu geri gelecek.

const confirmRemoveResearcher = (userId: string) => {
    pendingRemoveUserId.value = userId
    showRemoveDialog.value = true
}

// idas-api'de ayrı user-patent ucu yok; araştırmacı PUT ile senkronlanır:
// kalan userId listesini gönderiyoruz (patent alanlarına dokunulmuyor).
const removeResearcher = async (userId: string) => {
    const remaining = (patent.value?.authors ?? []).filter((a) => a.userId !== userId).map((a) => a.userId)
    try {
        await useRequest(`/patents/admin/${patentId}`, {
            method: 'PUT',
            body: { userIds: remaining }
        })
        $toast({ title: 'Araştırmacı kaldırıldı', description: 'Araştırmacı patent listesinden kaldırıldı.' })
        await refresh()
    } catch {
        $toast({ title: 'Hata', description: 'Araştırmacı kaldırılırken bir hata oluştu.', variant: 'destructive' })
    }
}

const deletePatent = async () => {
    try {
        isDeleting.value = true
        await useRequest(`/patents/admin/${patentId}`, { method: 'DELETE' })
        $toast({ title: 'Patent başarıyla silindi', description: `${patent.value?.title} patenti sistemden kaldırıldı.` })
        navigateTo('/dashboard/patents')
    } catch {
        $toast({ title: 'Hata', description: 'Patent silinirken bir hata oluştu.', variant: 'destructive' })
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
                <p class="font-medium">Patent bilgileri yüklenemedi</p>
                <p class="text-sm mt-1">{{ error?.message || 'Bilinmeyen bir hata oluştu' }}</p>
            </div>
            <Button variant="outline" size="sm" @click="refresh()">Tekrar Dene</Button>
        </div>

        <!-- Patent içeriği -->
        <div v-if="patent" class="space-y-6">
            <!-- Ana Bilgiler -->
            <Card class="w-full max-w-full">
                <CardHeader>
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="flex items-center gap-2">
                                <CardTitle class="text-xl">{{ patent?.title }}</CardTitle>
                                <Badge v-if="patent?.year" variant="secondary" class="text-xs">
                                    {{ patent.year }}
                                </Badge>
                                <Badge
                                    v-if="patent?.type"
                                    variant="outline"
                                    :class="patent.type === 'INTERNATIONAL' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'"
                                    class="text-xs"
                                >
                                    {{ patent.type === 'INTERNATIONAL' ? 'Uluslararası' : 'Ulusal' }}
                                </Badge>
                            </div>
                            <CardDescription>Patent ID: {{ patent.id }}</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="sm" class="h-8 w-8 p-0" aria-label="Patent işlemleri">
                                    <MoreHorizontal class="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem @click="navigateTo(`/dashboard/patents/detail/${patentId}/update`)" class="text-gray-900 focus:text-gray-900 focus:bg-gray-100">
                                    <Edit class="h-4 w-4 mr-2" />
                                    Patenti Güncelle
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="showDeleteDialog = true" class="text-gray-900 focus:text-gray-900 focus:bg-gray-100">
                                    <Trash2 class="h-4 w-4 mr-2" />
                                    Patenti Sil
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Patent Bilgileri -->
                        <div class="space-y-3">
                            <h4 class="font-medium text-sm text-muted-foreground">Patent Bilgileri</h4>
                            <div class="space-y-2">
                                <div class="flex items-center space-x-2">
                                    <Award class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Patent Türü:</span>
                                    <Badge
                                        v-if="patent?.type"
                                        variant="outline"
                                        :class="patent.type === 'INTERNATIONAL' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'"
                                    >
                                        {{ patent.type === 'INTERNATIONAL' ? 'Uluslararası' : 'Ulusal' }}
                                    </Badge>
                                    <span v-else class="text-sm text-muted-foreground">Belirtilmemiş</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <FileText class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Kategori:</span>
                                    <span class="text-sm">{{ categoryLabel(patent?.category) }}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Award class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Durum:</span>
                                    <span class="text-sm">{{ statusLabel(patent?.patentStatus) }}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Clock class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Patent Tarihi:</span>
                                    <span class="text-sm">{{ patent?.date ? new Date(patent.date).toLocaleDateString('tr-TR') : 'Bilinmiyor' }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- İşbirliği Bilgileri -->
                        <div class="space-y-3">
                            <h4 class="font-medium text-sm text-muted-foreground">İşbirliği Bilgileri</h4>
                            <div class="space-y-2">
                                <div class="flex items-center space-x-2">
                                    <Home class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Ulusal İşbirliği:</span>
                                    <Badge :variant="patent?.hasNationalCollaboration ? 'default' : 'secondary'">
                                        {{ patent?.hasNationalCollaboration ? 'Var' : 'Yok' }}
                                    </Badge>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Globe class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Uluslararası İşbirliği:</span>
                                    <Badge :variant="patent?.hasInternationalCollaboration ? 'default' : 'secondary'">
                                        {{ patent?.hasInternationalCollaboration ? 'Var' : 'Yok' }}
                                    </Badge>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Factory class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Endüstri İşbirliği:</span>
                                    <Badge :variant="patent?.hasIndustryCollaboration ? 'default' : 'secondary'">
                                        {{ patent?.hasIndustryCollaboration ? 'Var' : 'Yok' }}
                                    </Badge>
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
                                    <span class="text-sm">{{ patent?.createdAt ? new Date(patent.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor' }}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Clock class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Son Güncelleme:</span>
                                    <span class="text-sm">{{ patent?.updatedAt ? new Date(patent.updatedAt).toLocaleDateString('tr-TR') : 'Bilinmiyor' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Araştırmacılar -->
            <Card class="w-full max-w-full">
                <CardHeader>
                    <CardTitle class="flex items-center space-x-2">
                        <Users class="h-5 w-5" />
                        <span>Araştırmacılar ({{ researchersList.length }})</span>
                    </CardTitle>
                    <!-- TODO: Araştırmacı ekleme, idas-api'ye kullanıcı arama endpoint'i eklenince geri gelecek -->
                </CardHeader>
                <CardContent>
                    <div v-if="researchersList.length === 0" class="text-center py-8 text-muted-foreground">
                        Bu patent için henüz araştırmacı bilgisi bulunmuyor.
                    </div>
                    <div v-else class="space-y-3">
                        <div v-for="researcher in researchersList" :key="researcher.userId" class="flex items-center justify-between p-3 border rounded-lg transition-opacity">
                            <div class="flex-1">
                                <button @click="navigateTo(`/dashboard/academicians/${researcher.userId}`)" class="text-left transition-colors hover:text-blue-600 cursor-pointer">
                                    <p class="font-medium">{{ researcher.name }} {{ researcher.surname }}</p>
                                </button>
                                <p v-if="researcher.title" class="text-sm text-muted-foreground mt-1">{{ researcher.title }}</p>
                            </div>
                            <Button variant="ghost" size="sm" @click="confirmRemoveResearcher(researcher.userId)" class="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" aria-label="Araştırmacıyı kaldır">
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
                    <DialogTitle>Patenti Sil</DialogTitle>
                    <DialogDescription>
                        Bu işlem geri alınamaz. <strong>{{ patent?.title }}</strong> patenti kalıcı olarak silinecektir.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter class="flex gap-2">
                    <DialogClose as-child>
                        <Button variant="outline">İptal</Button>
                    </DialogClose>
                    <Button variant="destructive" @click="deletePatent" :disabled="isDeleting">
                        <Trash2 v-if="!isDeleting" class="h-5 w-5 mr-2" />
                        <div v-else class="animate-spin rounded-full h-5 w-5 mr-2 border-b-2 border-white" />
                        {{ isDeleting ? 'Siliniyor...' : 'Patenti Sil' }}
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
                        Bu araştırmacıyı patent listesinden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel @click="pendingRemoveUserId = null">İptal</AlertDialogCancel>
                    <AlertDialogAction
                        class="bg-red-600 hover:bg-red-700 text-white"
                        @click="pendingRemoveUserId && removeResearcher(pendingRemoveUserId); pendingRemoveUserId = null"
                    >
                        <Trash2 class="h-4 w-4 mr-2" />
                        Kaldır
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <!-- Bulunamadı -->
        <Card v-if="!patent && !loading && !error" class="max-w-md mx-auto shadow-md border-t-4 border-t-red-500">
            <CardHeader>
                <CardTitle>Patent bulunamadı</CardTitle>
                <CardDescription>Aradığınız patent bulunamadı veya erişim izniniz yok.</CardDescription>
            </CardHeader>
            <CardContent class="flex justify-end">
                <Button @click="navigateTo('/dashboard/patents')">Geri Dön</Button>
            </CardContent>
        </Card>
    </div>
</template>
