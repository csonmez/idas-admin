<script setup lang="ts">
import { Award, BookOpen, Building2, ExternalLink, Factory, Flag, Globe, LockOpen, Tag, Users, Zap, MoreHorizontal, Edit, Trash2, CirclePlus, Loader } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { ArticleAuthorRow, ArticleAuthorsResponse, ArticleDetailResponse } from '@/types'
import { ref, computed } from 'vue'

const route = useRoute()
const articleId = route.params.id as string

const isDeleting = ref(false)
const showDeleteDialog = ref(false)
const showRemoveDialog = ref(false)
const pendingRemoveId = ref<string | null>(null)

// Kurum içi yazar ekleme modalı (istek kısmı henüz bağlı değil — TODO)
const showAddAuthorDialog = ref(false)
const searchAcademician = ref('')
const academicianResults = ref<{ id: string; name: string; surname: string }[]>([])
const selectedAcademician = ref<{ id: string; name: string; surname: string } | null>(null)
const newAuthorOrder = ref<number | ''>('')
const newAuthorCorresponding = ref(false)

// idas-api admin detay: GET /articles/:id -> { article, externalIds, keywords }
const {
    data,
    pending: loading,
    error,
    refresh
} = await useAsyncData(`article-${articleId}`, async () => {
    return await useRequest<ArticleDetailResponse>(`/articles/${articleId}`, { method: 'GET' })
})

// Yazarlar: GET /articles/:id/authors -> { rows, pagination } (kurum içi/dışı, sıra, birim)
const { data: authorsData, refresh: refreshAuthors } = await useAsyncData(`article-${articleId}-authors`, async () => {
    return await useRequest<ArticleAuthorsResponse>(`/articles/${articleId}/authors`, { method: 'GET', query: { limit: 50 } })
})

const article = computed(() => data.value?.article)
const keywords = computed(() => data.value?.keywords ?? [])
const externalIds = computed(() => data.value?.externalIds ?? [])
const authors = computed(() => authorsData.value?.rows ?? [])
const internalAuthors = computed(() => authors.value.filter((a) => a.isInternal))
const externalAuthors = computed(() => authors.value.filter((a) => !a.isInternal))

const authorDisplayName = (author: ArticleAuthorRow) => {
    if (author.isInternal && author.userName) {
        return `${author.userName} ${author.userSurname ?? ''}`.trim()
    }
    return author.fullName
}

const authorAffiliation = (author: ArticleAuthorRow) => {
    if (author.isInternal) {
        const parts = [author.facultyName, author.departmentName, author.disciplineName].filter(Boolean)
        if (parts.length) return parts.join(' / ')
    }
    return [author.institutionName, author.country].filter(Boolean).join(', ')
}

const externalIdUrl = (source: string, externalId: string) => {
    if (source === 'WOS') return `https://www.webofscience.com/wos/woscc/full-record/${externalId}`
    // Scopus'ta iki id biçimi var (2-s2.0-XXX ve düz sayı) — ikisi de aynı linkin sonuna eklenir
    if (source === 'SCOPUS') return `https://www.scopus.com/pages/publications/${externalId.replace(/^2-s2\.0-/, '')}`
    return null
}

const externalSourceLabel = (source: string) => {
    if (source === 'WOS') return 'Web of Science'
    if (source === 'SCOPUS') return 'Scopus'
    return source
}

const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

const publicationLabel = computed(() => {
    if (!article.value) return ''
    const { publicationMonth, publicationYear } = article.value
    return publicationMonth ? `${monthNames[publicationMonth - 1]} ${publicationYear}` : String(publicationYear)
})

const earlyAccessLabel = computed(() => {
    if (!article.value?.isEarlyAccess) return null
    const { earlyAccessMonth, earlyAccessYear } = article.value
    if (!earlyAccessYear) return 'Early Access'
    return earlyAccessMonth ? `Early Access — ${monthNames[earlyAccessMonth - 1]} ${earlyAccessYear}` : `Early Access — ${earlyAccessYear}`
})

const journalRef = computed(() => {
    if (!article.value) return ''
    const parts: string[] = []
    if (article.value.volume) parts.push(`Cilt ${article.value.volume}`)
    if (article.value.issue) parts.push(`Sayı ${article.value.issue}`)
    if (article.value.pageRange) parts.push(`s. ${article.value.pageRange}`)
    return parts.join(', ')
})

const qValueClass = (qValue: string | null) => {
    switch (qValue) {
        case 'Q1':
            return 'bg-emerald-100 text-emerald-800 border-emerald-200'
        case 'Q2':
            return 'bg-sky-100 text-sky-800 border-sky-200'
        case 'Q3':
            return 'bg-amber-100 text-amber-800 border-amber-200'
        case 'Q4':
            return 'bg-red-100 text-red-800 border-red-200'
        default:
            return 'bg-muted text-muted-foreground border-transparent'
    }
}

const formatNumber = (value: string | null | undefined, digits = 2) => {
    if (value == null || value === '') return '—'
    const num = Number(value)
    return Number.isNaN(num) ? value : num.toLocaleString('tr-TR', { maximumFractionDigits: digits })
}

const collaborations = computed(() => {
    if (!article.value) return []
    return [
        { label: 'Ulusal İş Birliği', active: article.value.hasNationalCollaboration, icon: Flag },
        { label: 'Uluslararası İş Birliği', active: article.value.hasInternationalCollaboration, icon: Globe },
        { label: 'Sanayi İş Birliği', active: article.value.hasIndustryCollaboration, icon: Factory }
    ].filter((item) => item.active)
})

const confirmRemoveAuthor = (authorRowId: string) => {
    pendingRemoveId.value = authorRowId
    showRemoveDialog.value = true
}

const removeAuthor = async (authorRowId: string) => {
    try {
        await useRequest(`/articles/${articleId}/authors/${authorRowId}`, { method: 'DELETE' })
        $toast({ title: 'Yazar kaldırıldı', description: 'Yazar makale yazarları listesinden kaldırıldı.' })
        await refreshAuthors()
    } catch {
        $toast({ title: 'Hata', description: 'Yazar kaldırılırken bir hata oluştu. Lütfen tekrar deneyiniz.', variant: 'destructive' })
    }
}

const resetAddAuthorForm = () => {
    searchAcademician.value = ''
    academicianResults.value = []
    selectedAcademician.value = null
    newAuthorOrder.value = ''
    newAuthorCorresponding.value = false
}

// TODO: Akademisyen arama — develop'ta kullanıcı/akademisyen arama ucu henüz yok.
// Uç eklenince burada GET ile aratıp sonuçları academicianResults'a dolduracağız.
const searchAcademicians = async () => {
    // TODO: uç gelince -> GET /users?search=... (veya /academicians) -> academicianResults
}

const selectAcademician = (a: { id: string; name: string; surname: string }) => {
    selectedAcademician.value = a
    academicianResults.value = []
    searchAcademician.value = `${a.name} ${a.surname}`
}

// TODO (hoca: "istek atma kısmı en son kalsın"): kurum içi yazar ekleme isteği henüz bağlı değil.
// Hazır olunca -> POST /articles/${articleId}/authors
//   { fullName, isInternal: true, userId: selectedAcademician.id, authorOrder, isCorrespondingAuthor, source }
// sonra refreshAuthors()
const addInternalAuthor = async () => {
    $toast({ title: 'Bilgi', description: 'Yazar ekleme isteği henüz bağlanmadı (akademisyen arama ucu bekleniyor).' })
    showAddAuthorDialog.value = false
    resetAddAuthorForm()
}

const deleteArticle = async () => {
    try {
        isDeleting.value = true
        await useRequest(`/articles/${articleId}`, { method: 'DELETE' })
        $toast({ title: 'Makale başarıyla silindi', description: `${article.value?.title} makalesi sistemden kaldırıldı.` })
        navigateTo('/dashboard/articles')
    } catch {
        $toast({ title: 'Hata', description: 'Makale silinirken bir hata oluştu. Lütfen tekrar deneyiniz.', variant: 'destructive' })
    } finally {
        isDeleting.value = false
        showDeleteDialog.value = false
    }
}
</script>

<template>
    <div class="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <!-- Yükleniyor -->
        <div v-if="loading" class="animate-pulse space-y-4">
            <div class="h-10 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-48"></div>
        </div>

        <!-- Hata -->
        <div v-else-if="error" class="text-center py-8 space-y-4">
            <div class="text-red-600 dark:text-red-400">
                <p class="font-medium">Makale bilgileri yüklenemedi</p>
                <p class="text-sm mt-1">{{ error?.message || 'Bilinmeyen bir hata oluştu' }}</p>
            </div>
            <Button variant="outline" size="sm" @click="refresh()">Tekrar Dene</Button>
        </div>

        <template v-else-if="article">
            <!-- Başlık kartı -->
            <Card>
                <CardHeader>
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex flex-col gap-3">
                            <CardTitle class="flex flex-wrap items-center gap-2.5 text-xl leading-snug">
                                <span>{{ article.title }}</span>
                                <Badge variant="secondary" class="text-sm">{{ publicationLabel }}</Badge>
                            </CardTitle>
                            <div class="flex flex-wrap items-center gap-2">
                                <Badge v-if="article.isTopTenPercent" variant="outline" class="border-violet-200 bg-violet-50 text-violet-700">
                                    <Award class="h-3 w-3 mr-1" />
                                    İlk %10'luk Dilim
                                </Badge>
                                <Badge v-if="article.isOpenAccess" variant="outline" class="border-emerald-200 bg-emerald-50 text-emerald-700">
                                    <LockOpen class="h-3 w-3 mr-1" />
                                    Açık Erişim
                                </Badge>
                                <Badge v-if="earlyAccessLabel" variant="outline" class="border-amber-200 bg-amber-50 text-amber-700">
                                    <Zap class="h-3 w-3 mr-1" />
                                    {{ earlyAccessLabel }}
                                </Badge>
                                <Badge v-for="collab in collaborations" :key="collab.label" variant="outline" class="border-blue-200 bg-blue-50 text-blue-700">
                                    <component :is="collab.icon" class="h-3 w-3 mr-1" />
                                    {{ collab.label }}
                                </Badge>
                            </div>
                            <CardDescription v-if="journalRef" class="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span class="text-muted-foreground">{{ journalRef }}</span>
                            </CardDescription>
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <a
                                    v-if="article.doi"
                                    :href="`https://doi.org/${article.doi}`"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
                                >
                                    <ExternalLink class="h-3.5 w-3.5" />
                                    DOI: {{ article.doi }}
                                </a>
                                <template v-for="externalId in externalIds" :key="externalId.id">
                                    <a
                                        v-if="externalIdUrl(externalId.source, externalId.externalId)"
                                        :href="externalIdUrl(externalId.source, externalId.externalId)!"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
                                    >
                                        <ExternalLink class="h-3.5 w-3.5" />
                                        {{ externalSourceLabel(externalId.source) }}
                                    </a>
                                    <span v-else class="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                        {{ externalId.source }}: {{ externalId.externalId }}
                                    </span>
                                </template>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="sm" class="h-8 w-8 p-0 shrink-0" aria-label="Makale işlemleri menüsü">
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
            </Card>

            <div class="grid gap-4 md:grid-cols-3 md:items-start lg:gap-6">
                <!-- Yazarlar -->
                <Card class="md:col-span-2">
                    <CardHeader>
                        <CardTitle class="flex flex-wrap items-center justify-between gap-2">
                            <span class="flex items-center gap-2">
                                <Users class="h-5 w-5 text-muted-foreground" />
                                Yazar Bilgileri
                            </span>
                            <div class="flex items-center gap-2">
                            <Button variant="outline" size="sm" @click="showAddAuthorDialog = true">
                                <CirclePlus class="h-4 w-4 mr-1" />
                                Yazar Ekle
                            </Button>
                            <Dialog v-if="externalAuthors.length">
                                <DialogTrigger as-child>
                                    <Button variant="outline" size="sm">Kurum Dışı Yazarlar ({{ externalAuthors.length }})</Button>
                                </DialogTrigger>
                                <DialogContent class="max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Kurum Dışı Yazarlar</DialogTitle>
                                    </DialogHeader>
                                    <div class="max-h-80 overflow-y-auto pr-2">
                                        <ul class="divide-y">
                                            <li v-for="author in externalAuthors" :key="author.id" class="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                                                <div class="flex flex-col gap-1">
                                                    <span class="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                                                        {{ authorDisplayName(author) }}
                                                        <span class="text-xs font-normal text-muted-foreground">{{ author.authorOrder }}. yazar</span>
                                                        <Badge v-if="author.isCorrespondingAuthor" variant="outline" class="text-muted-foreground">Sorumlu yazar</Badge>
                                                    </span>
                                                    <span v-if="authorAffiliation(author)" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Building2 class="h-3 w-3 shrink-0" />
                                                        {{ authorAffiliation(author) }}
                                                    </span>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <template v-if="internalAuthors.length">
                            <h4 class="mb-3 text-sm font-semibold">Kurum İçi Yazarlar</h4>
                            <ul class="divide-y">
                                <li v-for="author in internalAuthors" :key="author.id" class="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                    <div class="flex flex-col gap-1">
                                        <span class="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                                            <button v-if="author.userId" @click="navigateTo(`/dashboard/academicians/${author.userId}`)" class="hover:text-blue-600 cursor-pointer">
                                                {{ authorDisplayName(author) }}
                                            </button>
                                            <span v-else>{{ authorDisplayName(author) }}</span>
                                            <span class="text-xs font-normal text-muted-foreground">{{ author.authorOrder }}. yazar</span>
                                            <Badge v-if="author.isCorrespondingAuthor" variant="outline" class="text-muted-foreground">Sorumlu yazar</Badge>
                                        </span>
                                        <span v-if="authorAffiliation(author)" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Building2 class="h-3 w-3 shrink-0" />
                                            {{ authorAffiliation(author) }}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="sm" @click="confirmRemoveAuthor(author.id)" class="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 shrink-0" aria-label="Yazarı kaldır">
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </li>
                            </ul>
                        </template>
                        <p v-else class="text-sm text-muted-foreground">Kurum içi yazar bulunmuyor.</p>
                    </CardContent>
                </Card>

                <!-- Dergi ve metrikleri -->
                <Card>
                    <CardHeader>
                        <CardTitle class="flex items-center gap-2 text-base leading-snug">
                            <BookOpen class="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>{{ article.journalName }}</span>
                        </CardTitle>
                        <CardDescription v-if="article.journalAbbreviation && article.journalAbbreviation !== article.journalName">
                            {{ article.journalAbbreviation }}
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="grid gap-2.5 text-sm">
                        <div class="flex items-center justify-between">
                            <span class="text-muted-foreground">Q Değeri</span>
                            <Badge v-if="article.qValue" variant="outline" :class="qValueClass(article.qValue)">{{ article.qValue }}</Badge>
                            <span v-else>—</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-muted-foreground">Etki Faktörü</span>
                            <span class="font-semibold">{{ formatNumber(article.impactFactor) }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-muted-foreground">Yüzdelik</span>
                            <span class="font-semibold">{{ formatNumber(article.percentile, 1) }}</span>
                        </div>
                        <div v-if="article.metricYear" class="flex items-center justify-between">
                            <span class="text-muted-foreground">Metrik Yılı</span>
                            <span class="flex items-center gap-1.5">
                                {{ article.metricYear }}
                                <Badge v-if="article.metricStatus === 'PROVISIONAL'" variant="outline" class="text-muted-foreground">Geçici</Badge>
                            </span>
                        </div>
                        <Separator class="my-1" />
                        <div class="flex items-center justify-between">
                            <span class="text-muted-foreground">ISSN</span>
                            <span>{{ article.journalIssn ?? '—' }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-muted-foreground">e-ISSN</span>
                            <span>{{ article.journalEissn ?? '—' }}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Özet -->
            <Card v-if="article.abstractText">
                <CardHeader>
                    <CardTitle>Özet</CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-sm leading-relaxed text-muted-foreground">{{ article.abstractText }}</p>
                </CardContent>
            </Card>

            <!-- Anahtar kelimeler -->
            <Card v-if="keywords.length">
                <CardHeader>
                    <CardTitle class="flex items-center gap-2">
                        <Tag class="h-5 w-5 text-muted-foreground" />
                        Anahtar Kelimeler
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="flex flex-wrap gap-2">
                        <Badge v-for="keyword in keywords" :key="keyword.id" variant="secondary">{{ keyword.keywordName }}</Badge>
                    </div>
                </CardContent>
            </Card>
        </template>

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

        <!-- Kurum İçi Yazar Ekleme Modalı (istek kısmı TODO — akademisyen arama ucu bekleniyor) -->
        <Dialog
            :open="showAddAuthorDialog"
            @update:open="
                (v) => {
                    showAddAuthorDialog = v
                    if (!v) resetAddAuthorForm()
                }
            "
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yazar Ekle</DialogTitle>
                    <DialogDescription>Atanacak akademisyeni seçin. (Alanlar zorunlu değildir.)</DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-2">
                    <div class="grid gap-2">
                        <label class="text-sm font-medium">Akademisyen</label>
                        <Input v-model="searchAcademician" placeholder="Akademisyen ara..." @input="searchAcademicians" />
                        <p class="text-xs text-muted-foreground">Not: akademisyen arama ucu backend'e eklenince aktifleşecek.</p>
                        <ul v-if="academicianResults.length" class="border rounded-md divide-y max-h-48 overflow-y-auto">
                            <li v-for="a in academicianResults" :key="a.id" class="px-3 py-2 hover:bg-muted cursor-pointer" @click="selectAcademician(a)">
                                {{ a.name }} {{ a.surname }}
                            </li>
                        </ul>
                    </div>
                    <div class="grid gap-2">
                        <label class="text-sm font-medium">Yazar Sırası</label>
                        <Input v-model.number="newAuthorOrder" type="number" min="1" placeholder="Örn. 1" />
                    </div>
                    <div class="flex items-center gap-2">
                        <Checkbox :model-value="newAuthorCorresponding" @update:model-value="(v) => (newAuthorCorresponding = !!v)" />
                        <label class="text-sm font-normal">Sorumlu yazar</label>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose as-child>
                        <Button variant="outline">İptal</Button>
                    </DialogClose>
                    <Button @click="addInternalAuthor">
                        <CirclePlus class="h-4 w-4 mr-2" />
                        Ekle
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Kayıt bulunamadı -->
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
