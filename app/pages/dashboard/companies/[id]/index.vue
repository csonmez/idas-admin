<script setup lang="ts">
import { Building, Trash2, Clock, MoreHorizontal, Edit, Phone, Mail, Globe, MapPin, Hash, Users, CirclePlus, Percent, School } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { CompanyDetailResponse, CompanyAffiliationsResponse, StudentCompanyScopeResponse } from '@/types'

const route = useRoute()
const companyId = route.params.id as string

const isDeleting = ref(false)
const showDeleteDialog = ref(false)

// Akademisyen kaldırma onayı
const showRemoveDialog = ref(false)
const pendingRemoveId = ref<string | null>(null)

// Akademisyen ekleme modalı (istek kısmı henüz bağlı değil — TODO, akademisyen arama ucu bekleniyor)
const showAddAcademicianDialog = ref(false)
const searchAcademician = ref('')
const academicianResults = ref<{ id: string; name: string; surname: string }[]>([])
const selectedAcademician = ref<{ id: string; name: string; surname: string } | null>(null)
const selectedRole = ref('')
const ownershipInput = ref('')
const startDateInput = ref('')

// company_affiliation_role enum -> Türkçe etiket
const ROLE_OPTIONS = [
    { value: 'BOARD_MEMBER', label: 'Yönetim Kurulu Üyesi' },
    { value: 'CONSULTANT', label: 'Danışman' },
    { value: 'EMPLOYEE', label: 'Çalışan' },
    { value: 'MANAGER', label: 'Yönetici' },
    { value: 'PARTNER', label: 'Ortak' },
    { value: 'SHAREHOLDER', label: 'Hissedar' }
]
const roleLabel = (r?: string | null) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? (r || '-')

// idas-api admin detay: GET /companies/:id -> { company }
const {
    data,
    pending: loading,
    error,
    refresh
} = await useAsyncData(`company-${companyId}`, async () => {
    const res = await useRequest<CompanyDetailResponse>(`/companies/${companyId}`, { method: 'GET' })
    return res.company
})

const company = computed(() => data.value)

// Atanmış akademisyenler ayrı uçtan: GET /companies/:id/affiliations -> { rows } (sadece userId + rol)
const { data: affiliationsData, refresh: refreshAffiliations } = await useAsyncData(`company-${companyId}-affiliations`, async () => {
    return await useRequest<CompanyAffiliationsResponse>(`/companies/${companyId}/affiliations`, {
        method: 'GET',
        query: { page: 1, limit: 100 }
    })
})

const affiliationsList = computed(() => affiliationsData.value?.rows ?? [])

// Öğrenci firması akademik kapsamı: GET /companies/:id/student-academic-scope -> { scope }
// Akademisyen firmasında kapsam olmadığı için 404 döner; onu "kapsam yok" olarak ele alıyoruz.
const { data: scopeData, refresh: refreshScope } = await useAsyncData(`company-${companyId}-scope`, async () => {
    try {
        const res = await useRequest<StudentCompanyScopeResponse>(`/companies/${companyId}/student-academic-scope`, { method: 'GET' })
        return res.scope
    } catch {
        return null
    }
})

const scope = computed(() => scopeData.value)

// Öğrenci kapsamı tanımlama modalı (istek kısmı henüz bağlı değil — TODO, bölüm/ana bilim dalı listeleme ucu bekleniyor)
const showScopeDialog = ref(false)
const showScopeRemoveDialog = ref(false)
const departmentInput = ref('')
const disciplineInput = ref('')

const resetScopeForm = () => {
    departmentInput.value = ''
    disciplineInput.value = ''
}

// TODO: Bölüm/ana bilim dalı seçimi — idas-api'de departments/disciplines listeleme ucu henüz yok.
// Uç gelince seçim yapılıp PUT /companies/:id/student-academic-scope { departmentId, disciplineId? } bağlanacak.
const saveScope = async () => {
    $toast({ title: 'Bilgi', description: 'Öğrenci firması kapsamı tanımlama isteği henüz bağlanmadı (bölüm/ana bilim dalı listeleme ucu bekleniyor).' })
    showScopeDialog.value = false
    resetScopeForm()
}

const removeScope = async () => {
    try {
        await useRequest(`/companies/${companyId}/student-academic-scope`, { method: 'DELETE' })
        $toast({ title: 'Kapsam kaldırıldı', description: 'Öğrenci firması kapsamı kaldırıldı.' })
        await refreshScope()
    } catch {
        $toast({ title: 'Hata', description: 'Kapsam kaldırılırken bir hata oluştu.', variant: 'destructive' })
    } finally {
        showScopeRemoveDialog.value = false
    }
}

const resetAddAcademician = () => {
    searchAcademician.value = ''
    academicianResults.value = []
    selectedAcademician.value = null
    selectedRole.value = ''
    ownershipInput.value = ''
    startDateInput.value = ''
}

// Akademisyen arama: GET /users?search= -> { rows: [{ id, name, surname, ... }] } (izin: user:read)
let academicianSearchTimer: ReturnType<typeof setTimeout> | null = null
const searchAcademicians = () => {
    selectedAcademician.value = null
    const q = searchAcademician.value.trim()
    if (academicianSearchTimer) clearTimeout(academicianSearchTimer)
    if (q.length < 2) {
        academicianResults.value = []
        return
    }
    academicianSearchTimer = setTimeout(async () => {
        try {
            const res = await useRequest<{ rows: { id: string; name: string; surname: string }[] }>('/users', {
                method: 'GET',
                query: { search: q, limit: 10 }
            })
            academicianResults.value = res.rows ?? []
        } catch {
            academicianResults.value = []
        }
    }, 300)
}

const selectAcademician = (a: { id: string; name: string; surname: string }) => {
    selectedAcademician.value = a
    academicianResults.value = []
    searchAcademician.value = `${a.name} ${a.surname}`
}

// POST /companies/:id/affiliations { userId, role, ownershipPercentage?, startDate, endDate? }
const addAcademician = async () => {
    if (!selectedAcademician.value) {
        $toast({ title: 'Uyarı', description: 'Lütfen listeden bir akademisyen seçin.', variant: 'destructive' })
        return
    }
    if (!selectedRole.value) {
        $toast({ title: 'Uyarı', description: 'Lütfen bir rol seçin.', variant: 'destructive' })
        return
    }
    if (!startDateInput.value) {
        $toast({ title: 'Uyarı', description: 'Lütfen başlangıç tarihi seçin.', variant: 'destructive' })
        return
    }
    try {
        const body: Record<string, unknown> = {
            userId: selectedAcademician.value.id,
            role: selectedRole.value,
            startDate: startDateInput.value
        }
        if (ownershipInput.value !== '') body.ownershipPercentage = Number(ownershipInput.value)
        await useRequest(`/companies/${companyId}/affiliations`, { method: 'POST', body })
        $toast({ title: 'Akademisyen eklendi', description: 'Akademisyen firmaya tanımlandı.' })
        showAddAcademicianDialog.value = false
        resetAddAcademician()
        await refreshAffiliations()
    } catch {
        $toast({ title: 'Hata', description: 'Akademisyen eklenirken bir hata oluştu.', variant: 'destructive' })
    }
}

const confirmRemoveAcademician = (affiliationId: string) => {
    pendingRemoveId.value = affiliationId
    showRemoveDialog.value = true
}

const removeAcademician = async (affiliationId: string) => {
    try {
        await useRequest(`/companies/${companyId}/affiliations/${affiliationId}`, { method: 'DELETE' })
        $toast({ title: 'Akademisyen kaldırıldı', description: 'Akademisyen firma listesinden kaldırıldı.' })
        await refreshAffiliations()
    } catch {
        $toast({ title: 'Hata', description: 'Akademisyen kaldırılırken bir hata oluştu.', variant: 'destructive' })
    }
}

const deleteCompany = async () => {
    try {
        isDeleting.value = true
        await useRequest(`/companies/${companyId}`, { method: 'DELETE' })
        $toast({ title: 'Firma silindi', description: `${company.value?.name} firması sistemden kaldırıldı.` })
        navigateTo('/dashboard/companies')
    } catch {
        $toast({ title: 'Hata', description: 'Firma silinirken bir hata oluştu.', variant: 'destructive' })
    } finally {
        isDeleting.value = false
        showDeleteDialog.value = false
    }
}
</script>

<template>
    <div class="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div v-if="loading" class="animate-pulse space-y-4">
            <div class="h-10 bg-gray-200 rounded w-1/2"></div>
            <div class="h-40 bg-gray-200 rounded"></div>
        </div>

        <div v-else-if="error" class="text-center py-8 space-y-4">
            <div class="text-red-600 dark:text-red-400">
                <p class="font-medium">Firma bilgileri yüklenemedi</p>
                <p class="text-sm mt-1">{{ error?.message || 'Bilinmeyen bir hata oluştu' }}</p>
            </div>
            <Button variant="outline" size="sm" @click="refresh()">Tekrar Dene</Button>
        </div>

        <div v-else-if="company" class="space-y-6">
            <Card class="shadow-sm rounded-xl">
                <CardHeader>
                    <div class="flex items-start justify-between gap-4">
                        <CardTitle class="text-xl flex items-center gap-2">
                            <Building class="h-5 w-5 text-muted-foreground" />
                            {{ company.name }}
                        </CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="sm" class="h-8 w-8 p-0 shrink-0" aria-label="Firma işlemleri">
                                    <MoreHorizontal class="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem @click="navigateTo(`/dashboard/companies/${companyId}/update`)" class="text-gray-900 focus:text-gray-900 focus:bg-gray-100">
                                    <Edit class="h-4 w-4 mr-2" />
                                    Firmayı Güncelle
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="showDeleteDialog = true" class="text-gray-900 focus:text-gray-900 focus:bg-gray-100">
                                    <Trash2 class="h-4 w-4 mr-2" />
                                    Firmayı Sil
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div class="flex items-center gap-2">
                            <Hash class="h-4 w-4 text-muted-foreground shrink-0" />
                            <span class="text-muted-foreground">Vergi No:</span>
                            <span class="font-medium">{{ company.taxNumber }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Hash class="h-4 w-4 text-muted-foreground shrink-0" />
                            <span class="text-muted-foreground">Sicil No:</span>
                            <span>{{ company.companyRegistrationNumber || '-' }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Hash class="h-4 w-4 text-muted-foreground shrink-0" />
                            <span class="text-muted-foreground">Ticaret Sicil:</span>
                            <span>{{ company.tradeRegistryNumber || '-' }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Phone class="h-4 w-4 text-muted-foreground shrink-0" />
                            <span class="text-muted-foreground">Telefon:</span>
                            <span>{{ company.phone || '-' }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Mail class="h-4 w-4 text-muted-foreground shrink-0" />
                            <span class="text-muted-foreground">E-posta:</span>
                            <span>{{ company.email || '-' }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Globe class="h-4 w-4 text-muted-foreground shrink-0" />
                            <span class="text-muted-foreground">Web:</span>
                            <a v-if="company.website" :href="company.website" target="_blank" class="text-blue-600 hover:underline truncate">{{ company.website }}</a>
                            <span v-else>-</span>
                        </div>
                        <div class="flex items-start gap-2 sm:col-span-2">
                            <MapPin class="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span class="text-muted-foreground">Adres:</span>
                            <span>{{ company.address || '-' }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Clock class="h-4 w-4 text-muted-foreground shrink-0" />
                            <span class="text-muted-foreground">Eklenme:</span>
                            <span>{{ company.createdAt ? new Date(company.createdAt).toLocaleDateString('tr-TR') : '-' }}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Akademisyenler (firmaya atanmış) -->
            <Card class="shadow-sm rounded-xl">
                <CardHeader>
                    <div class="flex items-center justify-between">
                        <CardTitle class="flex items-center gap-2 text-lg">
                            <Users class="h-5 w-5" />
                            <span>Akademisyenler ({{ affiliationsList.length }})</span>
                        </CardTitle>
                        <Button variant="outline" size="sm" @click="showAddAcademicianDialog = true">
                            <CirclePlus class="h-4 w-4 mr-1" />
                            Akademisyen Ekle
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div v-if="affiliationsList.length === 0" class="text-center py-8 text-muted-foreground">
                        Bu firma için henüz akademisyen tanımlanmamış.
                    </div>
                    <div v-else class="space-y-3">
                        <div v-for="aff in affiliationsList" :key="aff.id" class="flex items-center justify-between p-3 border rounded-lg gap-4">
                            <div class="flex items-center gap-3 flex-wrap">
                                <button @click="navigateTo(`/dashboard/academicians/${aff.userId}`)" class="text-left font-medium transition-colors hover:text-blue-600 cursor-pointer">
                                    Akademisyeni Görüntüle
                                </button>
                                <Badge variant="outline" class="bg-blue-50 text-blue-700 border-blue-200">{{ roleLabel(aff.role) }}</Badge>
                                <span v-if="aff.ownershipPercentage" class="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Percent class="h-3 w-3" />{{ aff.ownershipPercentage }}
                                </span>
                                <span v-if="aff.startDate" class="text-xs text-muted-foreground">
                                    {{ new Date(aff.startDate).toLocaleDateString('tr-TR') }}<template v-if="aff.endDate"> – {{ new Date(aff.endDate).toLocaleDateString('tr-TR') }}</template>
                                </span>
                            </div>
                            <Button variant="ghost" size="sm" @click="confirmRemoveAcademician(aff.id)" class="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 shrink-0" aria-label="Akademisyeni kaldır">
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Öğrenci Firması Kapsamı (fakülte / bölüm / ana bilim dalı) -->
            <Card class="shadow-sm rounded-xl">
                <CardHeader>
                    <div class="flex items-center justify-between">
                        <CardTitle class="flex items-center gap-2 text-lg">
                            <School class="h-5 w-5" />
                            <span>Öğrenci Firması Kapsamı</span>
                        </CardTitle>
                        <div class="flex items-center gap-2">
                            <Button variant="outline" size="sm" @click="showScopeDialog = true">
                                <Edit v-if="scope" class="h-4 w-4 mr-1" />
                                <CirclePlus v-else class="h-4 w-4 mr-1" />
                                {{ scope ? 'Düzenle' : 'Kapsam Tanımla' }}
                            </Button>
                            <Button v-if="scope" variant="ghost" size="sm" @click="showScopeRemoveDialog = true" class="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" aria-label="Kapsamı kaldır">
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div v-if="!scope" class="text-center py-8 text-muted-foreground">
                        Bu firma öğrenci firması olarak tanımlanmamış (fakülte/bölüm/ana bilim dalı kapsamı yok).
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                        <div class="flex items-center gap-2">
                            <School class="h-4 w-4 text-muted-foreground shrink-0" />
                            <span class="text-muted-foreground">Fakülte:</span>
                            <span class="font-medium">{{ scope.academicUnitName }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <School class="h-4 w-4 text-muted-foreground shrink-0" />
                            <span class="text-muted-foreground">Bölüm:</span>
                            <span class="font-medium">{{ scope.departmentName }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <School class="h-4 w-4 text-muted-foreground shrink-0" />
                            <span class="text-muted-foreground">Ana Bilim Dalı:</span>
                            <span>{{ scope.disciplineName || '-' }}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Dialog v-model:open="showDeleteDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Firmayı Sil</DialogTitle>
                    <DialogDescription>
                        Bu işlem geri alınamaz. <strong>{{ company?.name }}</strong> firması kalıcı olarak silinecektir.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter class="flex gap-2">
                    <DialogClose as-child>
                        <Button variant="outline">İptal</Button>
                    </DialogClose>
                    <Button variant="destructive" @click="deleteCompany" :disabled="isDeleting">
                        <Trash2 v-if="!isDeleting" class="h-5 w-5 mr-2" />
                        <div v-else class="animate-spin rounded-full h-5 w-5 mr-2 border-b-2 border-white" />
                        {{ isDeleting ? 'Siliniyor...' : 'Firmayı Sil' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Akademisyen Kaldırma Onay Dialog -->
        <AlertDialog v-model:open="showRemoveDialog">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Akademisyeni Kaldır</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu akademisyeni firma listesinden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel @click="pendingRemoveId = null">İptal</AlertDialogCancel>
                    <AlertDialogAction
                        class="bg-red-600 hover:bg-red-700 text-white"
                        @click="pendingRemoveId && removeAcademician(pendingRemoveId); pendingRemoveId = null"
                    >
                        <Trash2 class="h-4 w-4 mr-2" />
                        Kaldır
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <!-- Akademisyen Ekleme Modalı (istek kısmı TODO — akademisyen arama ucu bekleniyor) -->
        <Dialog
            :open="showAddAcademicianDialog"
            @update:open="
                (v) => {
                    showAddAcademicianDialog = v
                    if (!v) resetAddAcademician()
                }
            "
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Akademisyen Ekle</DialogTitle>
                    <DialogDescription>Atanacak akademisyeni seçin.</DialogDescription>
                </DialogHeader>
                <div class="grid gap-3 py-2">
                    <div class="grid gap-2">
                        <label class="text-sm font-medium">Akademisyen</label>
                        <Input v-model="searchAcademician" placeholder="Akademisyen ara (en az 2 harf)..." @input="searchAcademicians" />
                        <p v-if="selectedAcademician" class="text-xs text-green-600">Seçildi: {{ selectedAcademician.name }} {{ selectedAcademician.surname }}</p>
                        <ul v-if="academicianResults.length" class="border rounded-md divide-y max-h-48 overflow-y-auto">
                            <li v-for="a in academicianResults" :key="a.id" class="px-3 py-2 hover:bg-muted cursor-pointer" @click="selectAcademician(a)">
                                {{ a.name }} {{ a.surname }}
                            </li>
                        </ul>
                    </div>
                    <div class="grid gap-2">
                        <label class="text-sm font-medium">Rol</label>
                        <Select v-model="selectedRole">
                            <SelectTrigger>
                                <SelectValue placeholder="Rol seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="opt in ROLE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="grid gap-2">
                            <label class="text-sm font-medium">Ortaklık % <span class="text-muted-foreground text-xs">(opsiyonel)</span></label>
                            <Input v-model="ownershipInput" type="number" min="0" max="100" placeholder="0-100" />
                        </div>
                        <div class="grid gap-2">
                            <label class="text-sm font-medium">Başlangıç Tarihi</label>
                            <Input v-model="startDateInput" type="date" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose as-child>
                        <Button variant="outline">İptal</Button>
                    </DialogClose>
                    <Button @click="addAcademician">
                        <CirclePlus class="h-4 w-4 mr-2" />
                        Ekle
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Öğrenci Firması Kapsamı Kaldırma Onay Dialog -->
        <AlertDialog v-model:open="showScopeRemoveDialog">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Kapsamı Kaldır</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu firmanın öğrenci firması kapsamını (fakülte/bölüm/ana bilim dalı) kaldırmak istediğinize emin misiniz?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction class="bg-red-600 hover:bg-red-700 text-white" @click="removeScope">
                        <Trash2 class="h-4 w-4 mr-2" />
                        Kaldır
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <!-- Öğrenci Firması Kapsamı Tanımlama/Düzenleme Modalı (PUT kısmı TODO — bölüm/ana bilim dalı listeleme ucu bekleniyor) -->
        <Dialog
            :open="showScopeDialog"
            @update:open="
                (v) => {
                    showScopeDialog = v
                    if (!v) resetScopeForm()
                }
            "
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Öğrenci Firması Kapsamı</DialogTitle>
                    <DialogDescription>Firmanın bağlı olduğu bölüm ve ana bilim dalını seçin. Fakülte bölümden otomatik türetilir.</DialogDescription>
                </DialogHeader>
                <div class="grid gap-3 py-2">
                    <div class="grid gap-2">
                        <label class="text-sm font-medium">Bölüm</label>
                        <Input v-model="departmentInput" placeholder="Bölüm ara..." />
                    </div>
                    <div class="grid gap-2">
                        <label class="text-sm font-medium">Ana Bilim Dalı <span class="text-muted-foreground text-xs">(opsiyonel)</span></label>
                        <Input v-model="disciplineInput" placeholder="Ana bilim dalı ara..." />
                    </div>
                    <p class="text-xs text-muted-foreground">Not: bölüm/ana bilim dalı listeleme ucu backend'e eklenince seçim aktifleşecek.</p>
                </div>
                <DialogFooter>
                    <DialogClose as-child>
                        <Button variant="outline">İptal</Button>
                    </DialogClose>
                    <Button @click="saveScope">
                        <CirclePlus class="h-4 w-4 mr-2" />
                        Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Card v-if="!company && !loading && !error" class="max-w-md mx-auto shadow-sm rounded-xl">
            <CardHeader>
                <CardTitle>Firma bulunamadı</CardTitle>
                <CardDescription>Aradığınız firma bulunamadı veya erişim izniniz yok.</CardDescription>
            </CardHeader>
            <CardContent class="flex justify-end">
                <Button @click="navigateTo('/dashboard/companies')">Geri Dön</Button>
            </CardContent>
        </Card>
    </div>
</template>
