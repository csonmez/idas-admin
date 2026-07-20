<script setup lang="ts">
import { BookOpen, Award, Users, Trash2, Clock, Globe, Home, Factory, MoreHorizontal, Edit } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { ArticleDetailResponse } from '@/types'
import { ref, computed } from 'vue'

// idas-api user-assignments cevabı: UserArticleRow (kayıt + kullanıcı ad/soyad/e-posta)
interface UserAssignment {
    id: string
    userId: string
    articleId: string
    verifiedAt: string | null
    deletedAt: string | null
    userName: string
    userSurname: string
    userEmail: string
}

const route = useRoute()
const articleId = route.params.id as string

const isDeleting = ref(false)
const showDeleteDialog = ref(false)
const showRemoveDialog = ref(false)
const pendingRemoveId = ref<string | null>(null)

// idas-api admin detay: GET /articles/:id -> { article, externalIds, keywords }
const {
    data,
    pending: loading,
    error,
    refresh
} = await useAsyncData(`article-${articleId}`, async () => {
    return await useRequest<ArticleDetailResponse>(`/articles/${articleId}`, { method: 'GET' })
})

// Makaleye atanmış kullanıcılar: GET /articles/:id/user-assignments -> { assignments }
const { data: assignmentsData, refresh: refreshAssignments } = await useAsyncData(`article-${articleId}-assignments`, async () => {
    return await useRequest<{ assignments: UserAssignment[] }>(`/articles/${articleId}/user-assignments`, { method: 'GET' })
})

const article = computed(() => data.value?.article)
const authorsList = computed(() => assignmentsData.value?.assignments ?? [])
const wosId = computed(() => data.value?.externalIds?.find((e) => e.source === 'WOS')?.externalId ?? null)

// TODO: "Yazar ekle" için kullanıcı arama gerekiyor; idas-api'de henüz kullanıcı arama
// endpoint'i yok (eski /manager/users kalktı). Endpoint eklenince POST
// /articles/:id/user-assignments ({ userId }) ile buraya ekleme dialogu geri gelecek.

const confirmRemoveAuthor = (userArticleId: string) => {
    pendingRemoveId.value = userArticleId
    showRemoveDialog.value = true
}

const removeAuthor = async (assignmentId: string) => {
    try {
        await useRequest(`/articles/${articleId}/user-assignments/${assignmentId}`, {
            method: 'DELETE'
        })
        $toast({
            title: 'Yazar kaldırıldı',
            description: 'Yazar makale yazarları listesinden kaldırıldı.'
        })
        await refreshAssignments()
    } catch (error: any) {
        $toast({
            title: 'Hata',
            description: 'Yazar kaldırılırken bir hata oluştu. Lütfen tekrar deneyiniz.',
            variant: 'destructive'
        })
    }
}

const deleteArticle = async () => {
    try {
        isDeleting.value = true
        await useRequest(`/articles/${articleId}`, {
            method: 'DELETE'
        })
        $toast({
            title: 'Makale başarıyla silindi',
            description: `${article.value?.title} makalesi sistemden kaldırıldı.`
        })
        navigateTo('/dashboard/articles')
    } catch (error: any) {
        $toast({
            title: 'Hata',
            description: 'Makale silinirken bir hata oluştu. Lütfen tekrar deneyiniz.',
            variant: 'destructive'
        })
    } finally {
        isDeleting.value = false
        showDeleteDialog.value = false
    }
}
</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
        <!-- Loading State -->
        <div v-if="loading" class="space-y-4 mb-6">
            <div class="animate-pulse">
                <div class="h-10 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8 space-y-4 mb-6">
            <div class="text-red-600 dark:text-red-400">
                <p class="font-medium">Makale bilgileri yüklenemedi</p>
                <p class="text-sm mt-1">{{ error?.message || 'Bilinmeyen bir hata oluştu' }}</p>
            </div>
            <Button variant="outline" size="sm" @click="refresh()">Tekrar Dene</Button>
        </div>

        <!-- Makale içeriği -->
        <div v-if="article" class="space-y-6">
            <!-- Ana Bilgiler -->
            <Card class="w-full max-w-full">
                <CardHeader>
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="flex items-center gap-2">
                                <CardTitle class="text-xl">{{ article?.title }}</CardTitle>
                                <Badge v-if="article?.publicationYear" variant="secondary" class="text-xs">
                                    {{ article.publicationYear }}
                                </Badge>
                            </div>
                            <CardDescription>
                                <a
                                    v-if="wosId"
                                    :href="`https://www.webofscience.com/wos/woscc/full-record/${wosId}`"
                                    target="_blank"
                                    class="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    WoS ID: {{ wosId }}
                                </a>
                                <span v-else class="text-muted-foreground">WoS ID: Mevcut değil</span>
                            </CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="sm" class="h-8 w-8 p-0" aria-label="Makale işlemleri menüsü">
                                    <MoreHorizontal class="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem @click="navigateTo(`/dashboard/articles/${articleId}/update`)" class="text-gray-900 focus:text-gray-900 focus:bg-gray-100">
                                    <Edit class="h-4 w-4 mr-2" />
                                    Makaleyi Güncelle
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="showDeleteDialog = true" class="text-gray-900 focus:text-gray-900 focus:bg-gray-100">
                                    <Trash2 class="h-4 w-4 mr-2" />
                                    Makaleyi Sil
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Dergi Bilgileri -->
                        <div class="space-y-3">
                            <h4 class="font-medium text-sm text-muted-foreground">Dergi Bilgileri</h4>
                            <div class="space-y-2">
                                <div class="flex items-center space-x-2">
                                    <BookOpen class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Dergi:</span>
                                    <span class="text-sm">{{ article?.journalName || 'Bilinmiyor' }}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Award class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Q Değeri:</span>
                                    <Badge variant="outline" class="bg-emerald-50 text-emerald-700 border-emerald-200">
                                        {{ article?.qValue || '-' }}
                                    </Badge>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Award class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">İlk %10:</span>
                                    <Badge :variant="article?.isTopTenPercent ? 'default' : 'secondary'" :class="article?.isTopTenPercent ? 'bg-purple-50 text-purple-700 border-purple-200' : ''">
                                        {{ article?.isTopTenPercent ? 'Evet' : 'Hayır' }}
                                    </Badge>
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
                                    <Badge :variant="article?.hasNationalCollaboration ? 'default' : 'secondary'">
                                        {{ article?.hasNationalCollaboration ? 'Var' : 'Yok' }}
                                    </Badge>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Globe class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Uluslararası İşbirliği:</span>
                                    <Badge :variant="article?.hasInternationalCollaboration ? 'default' : 'secondary'">
                                        {{ article?.hasInternationalCollaboration ? 'Var' : 'Yok' }}
                                    </Badge>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Factory class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Endüstri İşbirliği:</span>
                                    <Badge :variant="article?.hasIndustryCollaboration ? 'default' : 'secondary'">
                                        {{ article?.hasIndustryCollaboration ? 'Var' : 'Yok' }}
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
                                    <span class="text-sm">{{ article?.createdAt ? new Date(article.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor' }}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Clock class="h-4 w-4 text-muted-foreground" />
                                    <span class="text-sm font-medium">Son Güncelleme:</span>
                                    <span class="text-sm">{{ article?.updatedAt ? new Date(article.updatedAt).toLocaleDateString('tr-TR') : 'Bilinmiyor' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Atanmış Yazarlar (kurum içi kullanıcılar) -->
            <Card class="w-full max-w-full">
                <CardHeader>
                    <CardTitle class="flex items-center space-x-2">
                        <Users class="h-5 w-5" />
                        <span>Atanmış Yazarlar ({{ authorsList.length }})</span>
                    </CardTitle>
                    <!-- TODO: Yazar ekleme butonu, idas-api'ye kullanıcı arama endpoint'i eklenince geri gelecek -->
                </CardHeader>
                <CardContent>
                    <div v-if="authorsList.length === 0" class="text-center py-8 text-muted-foreground">Bu makaleye atanmış kullanıcı bulunmuyor.</div>
                    <div v-else class="space-y-3">
                        <div v-for="author in authorsList" :key="author.id" class="flex items-center justify-between p-3 border rounded-lg transition-opacity">
                            <div class="flex-1 flex items-center gap-2">
                                <div>
                                    <button @click="navigateTo(`/dashboard/academicians/${author.userId}`)" class="text-left transition-colors hover:text-blue-600 cursor-pointer">
                                        <p class="font-medium">{{ author.userName }} {{ author.userSurname }}</p>
                                    </button>
                                    <p class="text-sm text-muted-foreground mt-1">{{ author.userEmail }}</p>
                                </div>
                                <Badge v-if="author.verifiedAt" variant="outline" class="text-xs ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">Doğrulanmış</Badge>
                            </div>
                            <Button variant="ghost" size="sm" @click="confirmRemoveAuthor(author.id)" class="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" aria-label="Yazarı kaldır">
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- Silme Dialog'u -->
        <Dialog v-model:open="showDeleteDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Makaleyi Sil</DialogTitle>
                    <DialogDescription>
                        Bu işlem geri alınamaz. <strong>{{ article?.title }}</strong> makalesi kalıcı olarak silinecektir.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter class="flex gap-2">
                    <DialogClose as-child>
                        <Button variant="outline">İptal</Button>
                    </DialogClose>
                    <Button variant="destructive" @click="deleteArticle" :disabled="isDeleting">
                        <Trash2 v-if="!isDeleting" class="h-5 w-5 mr-2" />
                        <div v-else class="animate-spin rounded-full h-5 w-5 mr-2 border-b-2 border-white" />
                        {{ isDeleting ? 'Siliniyor...' : 'Makaleyi Sil' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Yazar Kaldırma Onay Dialog -->
        <AlertDialog v-model:open="showRemoveDialog">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Yazarı Kaldır</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu yazarı makale listesinden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel @click="pendingRemoveId = null">İptal</AlertDialogCancel>
                    <AlertDialogAction
                        class="bg-red-600 hover:bg-red-700 text-white"
                        @click="pendingRemoveId && removeAuthor(pendingRemoveId); pendingRemoveId = null"
                    >
                        <Trash2 class="h-4 w-4 mr-2" />
                        Kaldır
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <!-- Kayıt bulunamadı durumu -->
        <Card v-if="!article && !loading && !error" class="max-w-md mx-auto shadow-md border-t-4 border-t-red-500">
            <CardHeader>
                <CardTitle>Makale bulunamadı</CardTitle>
                <CardDescription>Aradığınız makale bulunamadı veya erişim izniniz yok.</CardDescription>
            </CardHeader>
            <CardContent class="flex justify-end">
                <Button @click="navigateTo('/dashboard/articles')">Geri Dön</Button>
            </CardContent>
        </Card>
    </div>
</template>
