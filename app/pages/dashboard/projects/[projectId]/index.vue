<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { User as UserIcon, FileText, Wallet, CirclePlus, Loader, Trash2, MoreHorizontal, Edit } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import type { Project, User } from '@/types'
import { ref, watch } from 'vue'

const route = useRoute()
const router = useRouter()
const projectId = route.params.projectId as string

const project = computed(() => data.value)

const { data, pending, error, refresh } = await useAsyncData(`project-${projectId}`, async () => {
    return await useRequest<Project>(`/manager/projects/${projectId}`, {
        method: 'GET',
        query: {
            select: 'id,title,type,totalBudget,incomingBudget,year,projectType,startDate,endDate,incentiveType,incentiveAmount,createdAt,updatedAt,userProjects,userProjects.deletedAt,userProjects.user,userProjects.user.userAcademicUnits,userProjects.user.userAcademicUnits.academicUnit,projectIncomingBudgets'
        }
    })
})

const budgetTransfers = computed(() => {
    const items = project.value?.projectIncomingBudgets ?? []
    return [...items].sort((a, b) => a.year - b.year)
})

// Toplam aktarılan bütçe
const totalTransferredBudget = computed(() => {
    return budgetTransfers.value.reduce((total, t) => total + Number(t.amount), 0)
})

// Proje yürütücüsü (userProjects[0].user)
const executorDeletedLocally = ref(false)
const executorUserProject = computed(() => project.value?.userProjects?.[0] ?? null)
const projectExecutor = computed(() => executorUserProject.value?.user ?? null)
const isExecutorDeleted = computed(() => executorDeletedLocally.value || !!executorUserProject.value?.deletedAt)

// Ana akademik birim metni (fakülte - bölüm - anabilim dalı)
const mainAcademicUnitText = computed(() => {
    const user = projectExecutor.value
    if (!user?.userAcademicUnits) return ''
    const main = user.userAcademicUnits.find((u: any) => u.affiliationType === 'MAIN')
    if (!main) return ''
    const parts = [main.faculty?.name, main.department?.name, main.discipline?.name].filter(Boolean)
    return parts.join(' / ')
})

// Kullanıcı ekleme (tek kullanıcı - proje yürütücüsü)
const isOpenUserSearchDialog = ref(false)
const searchUser = ref('')
const users = ref<User[]>([])
const isLoadingUser = ref('')

const searchUsers = async () => {
    if (searchUser.value.length < 3) return
    try {
        const response = await useRequest<{ rows: User[] }>('/manager/users', {
            method: 'GET',
            query: {
                search: searchUser.value,
                limit: 5
            }
        })
        if (response && response.rows) {
            users.value = response.rows
        } else if (response && Array.isArray(response)) {
            users.value = response
        } else {
            users.value = []
        }
    } catch {
        users.value = []
    }
}

const addUserToProject = async (userId: string) => {
    try {
        isLoadingUser.value = userId
        await useRequest('/manager/user-projects', {
            method: 'POST',
            body: { userId, projectId }
        })
        isOpenUserSearchDialog.value = false
        searchUser.value = ''
        isLoadingUser.value = ''
        users.value = []
        await refresh()
    } catch (err: any) {
        isLoadingUser.value = ''
        if (err.data && err.data.code === 'ERRORx007') {
            $toast({
                title: 'Kullanıcı zaten ekli',
                description: 'Bu kullanıcı projeye zaten eklenmiş.',
                variant: 'destructive'
            })
        }
    }
}

const userProjectId = computed(() => project.value?.userProjects?.[0]?.id ?? null)
const showRemoveExecutorDialog = ref(false)
const showDeleteDialog = ref(false)
const isDeleting = ref(false)

const removeUserFromProject = async () => {
    const id = userProjectId.value
    if (!id) return
    try {
        await useRequest(`/manager/user-projects/${id}`, {
            method: 'DELETE'
        })
        showRemoveExecutorDialog.value = false
        executorDeletedLocally.value = true
        $toast({
            title: 'Proje yürütücüsü kaldırıldı',
            description: 'Proje yürütücüsü listeden kaldırıldı.'
        })
    } catch {
        $toast({
            title: 'Hata',
            description: 'Proje yürütücüsü kaldırılırken bir hata oluştu.',
            variant: 'destructive'
        })
    }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchUser, () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    if (searchUser.value.length >= 3) {
        searchTimeout = setTimeout(searchUsers, 300)
    } else {
        users.value = []
    }
})

// Bütçe ekleme
const currentYear = new Date().getFullYear()
const budgetYears = computed(() => {
    const arr: number[] = []
    for (let y = currentYear; y >= 2020; y--) arr.push(y)
    return arr
})
const isOpenBudgetDialog = ref(false)
const budgetYear = ref<string>(String(currentYear))
const budgetAmount = ref<number | ''>('')
const isAddingBudget = ref(false)

const resetBudgetForm = () => {
    budgetYear.value = String(currentYear)
    budgetAmount.value = ''
}

const deleteProject = async () => {
    try {
        isDeleting.value = true
        await useRequest(`/manager/projects/${projectId}`, {
            method: 'DELETE'
        })
        $toast({
            title: 'Proje başarıyla silindi',
            description: `${project.value?.title} projesi sistemden kaldırıldı.`
        })
        navigateTo('/dashboard/projects')
    } catch {
        $toast({
            title: 'Hata',
            description: 'Proje silinirken bir hata oluştu. Lütfen tekrar deneyiniz.',
            variant: 'destructive'
        })
    } finally {
        isDeleting.value = false
        showDeleteDialog.value = false
    }
}

const addBudget = async () => {
    const year = Number(budgetYear.value)
    const amount = Number(budgetAmount.value)
    if (!year || amount <= 0) {
        $toast({
            title: 'Geçersiz veri',
            description: 'Yıl ve tutar alanlarını kontrol edin.',
            variant: 'destructive'
        })
        return
    }
    try {
        isAddingBudget.value = true
        await useRequest('/manager/project-incoming-budgets', {
            method: 'POST',
            body: { projectId, year, amount }
        })
        $toast({
            title: 'Bütçe eklendi',
            description: `${year} yılı için ${amount.toLocaleString('tr-TR')} TL aktarılan tutar eklendi.`
        })
        isOpenBudgetDialog.value = false
        resetBudgetForm()
        await refresh()
    } catch {
        $toast({
            title: 'Hata',
            description: 'Bütçe eklenirken bir hata oluştu.',
            variant: 'destructive'
        })
    } finally {
        isAddingBudget.value = false
    }
}
</script>

<template>
    <div class="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <!-- Yükleniyor durumu -->
        <div v-if="pending" class="flex justify-center items-center min-h-[60vh]">
            <div class="flex flex-col items-center gap-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p class="text-muted-foreground">Proje bilgileri yükleniyor...</p>
            </div>
        </div>

        <!-- Hata durumu -->
        <div v-else-if="error" class="text-center py-8 space-y-4 mb-6">
            <div class="text-red-600 dark:text-red-400">
                <p class="font-medium">Proje bilgileri yüklenemedi</p>
                <p class="text-sm mt-1">{{ error?.message || 'Bilinmeyen bir hata oluştu' }}</p>
            </div>
            <Button variant="outline" size="sm" @click="refresh()">Tekrar Dene</Button>
        </div>

        <!-- Proje içeriği -->
        <div v-else-if="project" class="space-y-4 md:space-y-6">
            <!-- Proje Başlığı ve Durum Kartı -->
            <Card class="shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
                <CardContent class="pt-2">
                    <div class="flex items-start justify-between gap-4">
                        <h2 class="text-lg sm:text-xl md:text-2xl font-semibold leading-tight">{{ project.title }}</h2>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="sm" class="h-8 w-8 p-0 shrink-0" aria-label="Proje işlemleri menüsü">
                                    <MoreHorizontal class="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem class="text-gray-900 focus:text-gray-900 focus:bg-gray-100" @click="navigateTo(`/dashboard/projects/${projectId}/update`)">
                                    <Edit class="h-4 w-4 mr-2" />
                                    Projeyi Güncelle
                                </DropdownMenuItem>
                                <DropdownMenuItem class="text-gray-900 focus:text-gray-900 focus:bg-gray-100" @click="showDeleteDialog = true">
                                    <Trash2 class="h-4 w-4 mr-2" />
                                    Projeyi Sil
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            <!-- Proje ve Proje Yürütücüsü Kartları -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <!-- Proje Bilgileri -->
                <div>
                    <Card class="shadow-sm hover:shadow-md transition-shadow rounded-xl h-full flex flex-col">
                        <CardHeader class="px-4 sm:px-5">
                            <CardTitle class="text-base sm:text-lg flex items-center gap-2">
                                <FileText class="h-4 w-4 flex-shrink-0" />
                                <span>Proje Bilgileri</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="px-4 sm:px-5 pb-4 pt-0 flex-1">
                            <div class="space-y-3 sm:space-y-4">
                                <div class="flex justify-between items-center gap-4">
                                    <span class="text-xs sm:text-sm text-muted-foreground shrink-0">Proje Türü</span>
                                    <span class="text-sm sm:text-base font-medium text-right">{{ project.projectType?.name ?? '-' }}</span>
                                </div>
                                <div class="flex justify-between items-center gap-4">
                                    <span class="text-xs sm:text-sm text-muted-foreground shrink-0">Başlangıç</span>
                                    <span class="text-sm sm:text-base font-medium text-right">{{ project.startDate ? new Date(project.startDate).toLocaleDateString('tr-TR') : '-' }}</span>
                                </div>
                                <div class="flex justify-between items-center gap-4">
                                    <span class="text-xs sm:text-sm text-muted-foreground shrink-0">Bitiş</span>
                                    <span class="text-sm sm:text-base text-right">{{ project.endDate ? new Date(project.endDate).toLocaleDateString('tr-TR') : '-' }}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Finansal Bilgiler -->
                <div>
                    <Card class="shadow-sm hover:shadow-md transition-shadow rounded-xl h-full flex flex-col">
                        <CardHeader class="px-4 sm:px-5">
                            <div class="flex items-center justify-between">
                                <CardTitle class="text-base sm:text-lg flex items-center gap-2">
                                    <Wallet class="h-4 w-4 flex-shrink-0" />
                                    <span>Finansal Bilgiler</span>
                                </CardTitle>
                                <Button variant="outline" size="sm" class="h-8 w-8 p-0" aria-label="Bütçe ekle" @click="isOpenBudgetDialog = true">
                                    <CirclePlus class="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent class="px-4 sm:px-5 pb-4 pt-0 flex-1">
                            <div class="space-y-4">
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead class="text-foreground">Yıl</TableHead>
                                                <TableHead class="text-right text-foreground">Aktarılan Tutar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow v-if="budgetTransfers.length === 0">
                                                <TableCell colspan="2" class="text-center text-muted-foreground py-4"> Aktarılan tutar bulunmamaktadır. </TableCell>
                                            </TableRow>
                                            <TableRow v-for="transfer in budgetTransfers" :key="transfer.id">
                                                <TableCell class="font-medium text-foreground">{{ transfer.year }}</TableCell>
                                                <TableCell class="text-right text-foreground">{{ Number(transfer.amount).toLocaleString('tr-TR') }} TL</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div class="rounded-lg bg-muted/50 p-4 space-y-2 border border-border/50">
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-muted-foreground">Toplam Aktarılan</span>
                                        <span class="text-sm font-semibold">{{ totalTransferredBudget.toLocaleString('tr-TR') }} TL</span>
                                    </div>
                                    <div class="flex justify-between items-center pt-1">
                                        <span class="text-sm text-muted-foreground">Toplam Bütçe</span>
                                        <span class="text-base font-semibold">{{ project.totalBudget ? Number(project.totalBudget).toLocaleString('tr-TR') + ' TL' : '-' }}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Proje Yürütücüsü -->
                <div class="md:col-span-2">
                    <Card class="shadow-sm hover:shadow-md transition-shadow rounded-xl h-full flex flex-col">
                        <CardHeader>
                            <div class="flex items-center justify-between">
                                <CardTitle class="text-base sm:text-lg flex items-center gap-2">
                                    <UserIcon class="h-4 w-4 flex-shrink-0" />
                                    <span>Proje Yürütücüsü</span>
                                </CardTitle>
                                <Button v-if="!projectExecutor" variant="outline" size="sm" class="h-8 w-8 p-0" aria-label="Proje yürütücüsü ekle" @click="isOpenUserSearchDialog = true">
                                    <CirclePlus class="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent class="px-4 sm:px-5 pb-4 pt-0 flex-1">
                            <div v-if="projectExecutor" class="p-4 rounded-lg border border-border/50 space-y-2 transition-opacity" :class="isExecutorDeleted ? 'opacity-50 bg-red-50' : 'bg-muted/40'">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0 flex-1 flex items-center gap-2">
                                        <div>
                                            <p class="font-semibold text-sm sm:text-base break-words" :class="isExecutorDeleted ? 'line-through text-muted-foreground' : ''">
                                                <NuxtLink v-if="!isExecutorDeleted" :to="`/dashboard/academicians/${projectExecutor.id}`">{{ formatUserName(projectExecutor) }}</NuxtLink>
                                                <span v-else>{{ formatUserName(projectExecutor) }}</span>
                                            </p>
                                            <p v-if="mainAcademicUnitText" class="text-xs sm:text-sm text-muted-foreground pt-1">
                                                {{ mainAcademicUnitText }}
                                            </p>
                                        </div>
                                        <Badge v-if="isExecutorDeleted" variant="destructive" class="text-xs ml-1">Silindi</Badge>
                                    </div>
                                    <Button
                                        v-if="!isExecutorDeleted"
                                        variant="ghost"
                                        size="sm"
                                        class="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 shrink-0"
                                        aria-label="Proje yürütücüsünü kaldır"
                                        @click="showRemoveExecutorDialog = true"
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div v-else class="bg-muted/40 p-4 rounded-lg border border-border/50 text-center text-muted-foreground">Proje yürütücüsü bilgisi bulunamadı</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <!-- Proje Silme Dialog'u -->
        <Dialog v-if="project" v-model:open="showDeleteDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Projeyi Sil</DialogTitle>
                    <DialogDescription>
                        Bu işlem geri alınamaz. <strong>{{ project?.title }}</strong> projesi kalıcı olarak silinecektir.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter class="flex gap-2">
                    <DialogClose as-child>
                        <Button variant="outline">İptal</Button>
                    </DialogClose>
                    <Button variant="destructive" :disabled="isDeleting" @click="deleteProject">
                        <Trash2 v-if="!isDeleting" class="h-5 w-5 mr-2" />
                        <div v-else class="animate-spin rounded-full h-5 w-5 mr-2 border-b-2 border-white" />
                        {{ isDeleting ? 'Siliniyor...' : 'Projeyi Sil' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Proje Yürütücüsü Silme Onay Dialog'u -->
        <AlertDialog v-if="project" v-model:open="showRemoveExecutorDialog">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Proje yürütücüsünü kaldırmak istediğinize emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <strong>{{ projectExecutor ? formatUserName(projectExecutor) : '' }}</strong> proje yürütücüsü olarak kaldırılacak. Bu işlemi onaylıyor musunuz?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction class="bg-red-600 hover:bg-red-700" @click="removeUserFromProject"> Kaldır </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <!-- Bütçe Ekleme Dialog'u -->
        <Dialog
            v-if="project"
            :open="isOpenBudgetDialog"
            @update:open="
                (v) => {
                    isOpenBudgetDialog = v
                    if (!v) resetBudgetForm()
                }
            "
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Aktarılan Bütçe Ekle</DialogTitle>
                    <DialogDescription>Projeye yıl bazlı aktarılan tutar ekleyin.</DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid gap-2">
                        <label for="budget-year" class="text-sm font-medium">Yıl</label>
                        <Select v-model="budgetYear">
                            <SelectTrigger id="budget-year" class="w-full">
                                <SelectValue placeholder="Yıl seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem v-for="y in budgetYears" :key="y" :value="String(y)">
                                        {{ y }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="grid gap-2">
                        <label for="budget-amount" class="text-sm font-medium">Tutar (TL)</label>
                        <Input id="budget-amount" v-model.number="budgetAmount" type="number" min="0" step="1" placeholder="0" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose as-child>
                        <Button variant="outline">İptal</Button>
                    </DialogClose>
                    <Button :disabled="isAddingBudget" @click="addBudget">
                        <Loader v-if="isAddingBudget" class="h-4 w-4 mr-2 animate-spin" />
                        {{ isAddingBudget ? 'Ekleniyor...' : 'Ekle' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Proje Yürütücüsü Ekleme Dialog'u -->
        <Dialog v-if="project" :open="isOpenUserSearchDialog" @update:open="isOpenUserSearchDialog = false">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Akademisyen Arama</DialogTitle>
                    <DialogDescription>Arama yapmak için en az 3 karakter yazınız.</DialogDescription>
                </DialogHeader>
                <div class="flex flex-col items-center w-full">
                    <Input v-model="searchUser" type="text" class="w-full" placeholder="Arama..." />
                    <div v-if="users?.length" class="mt-4 w-full bg-white dark:bg-muted p-4 rounded-lg shadow-md">
                        <div class="max-h-64 overflow-y-auto">
                            <ul class="divide-y divide-gray-200 dark:divide-border">
                                <li v-for="user in users" :key="user.id" class="flex items-center justify-between py-2">
                                    <div class="flex flex-col">
                                        <span class="text-gray-700 dark:text-foreground">{{ user.name || '' }} {{ user.surname || '' }}</span>
                                        <small class="text-gray-500 dark:text-muted-foreground">{{ user.email || '' }}</small>
                                    </div>
                                    <Button size="sm" variant="outline" :disabled="isLoadingUser === user.id" @click="addUserToProject(user.id)">
                                        <Loader v-if="isLoadingUser === user.id" class="h-4 w-4 mr-2 animate-spin" />
                                        <span v-else>Ekle</span>
                                    </Button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <!-- Kayıt bulunamadı durumu -->
        <Card v-if="!project && !pending && !error" class="max-w-md mx-auto shadow-sm rounded-xl">
            <CardHeader>
                <CardTitle>Proje bulunamadı</CardTitle>
                <CardDescription>Aradığınız proje bulunamadı veya erişim izniniz yok.</CardDescription>
            </CardHeader>
            <CardContent class="flex justify-end">
                <Button @click="router.back()">Geri Dön</Button>
            </CardContent>
        </Card>
    </div>
</template>
