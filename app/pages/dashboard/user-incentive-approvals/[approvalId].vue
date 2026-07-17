<script setup lang="ts">
import type { IncentiveAmountBucket, UpdateUserIncentiveApprovalBody, UserIncentiveApproval, UserIncentiveApprovalStatus } from '@/types'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const route = useRoute()
const approvalId = computed(() => route.params.approvalId as string)

const statusDraft = ref<UserIncentiveApprovalStatus>('PENDING')
const isOpenConfirmDialog = ref(false)

const { data: approval, refresh, pending } = await useAsyncData(
    `uia-detail-${approvalId.value}`,
    () =>
        useRequest<UserIncentiveApproval>(`/manager/user-incentive-approvals/${approvalId.value}`, {
            method: 'GET',
            query: {
                select: 'id,userId,incentiveTermId,amount,status,createdAt,updatedAt,user,incentiveTerm',
                userSelect: 'id,name,surname,email,title,iban',
                incentiveTermSelect: 'id,year,status'
            }
        }),
    { watch: [approvalId] }
)

watch(
    approval,
    (a) => {
        if (a?.status) {
            statusDraft.value = a.status
        }
    },
    { immediate: true }
)

watch(statusDraft, () => {
    if (!approval.value) return
    isOpenConfirmDialog.value = statusDraft.value !== approval.value.status
})

const categoryRows = computed(() => {
    const a = approval.value?.amount
    if (!a) return []
    const entries: { key: string; label: string; bucket: IncentiveAmountBucket }[] = [
        { key: 'article', label: 'Makale', bucket: a.article },
        { key: 'project', label: 'Proje', bucket: a.project },
        { key: 'patent', label: 'Patent', bucket: a.patent },
        { key: 'prize', label: 'Ödül', bucket: a.prize },
        { key: 'postgraduate', label: 'Yüksek lisans', bucket: a.postgraduate },
        { key: 'total', label: 'Toplam', bucket: a.total }
    ]
    return entries.filter((e) => e.bucket != null)
})

function formatTl(n: number | undefined) {
    if (n == null || Number.isNaN(n)) return '—'
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function formatDate(iso: string | undefined) {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
    } catch {
        return iso
    }
}

function statusLabel(status: string) {
    const map: Record<string, string> = {
        PENDING: 'Beklemede',
        IN_PROGRESS: 'İşlemde',
        COMPLETED: 'Tamamlandı',
        REJECTED: 'Reddedildi',
        CANCELLED: 'İptal'
    }
    return map[status] || status
}

const userDisplayName = computed(() => {
    const u = approval.value?.user
    if (!u) return '—'
    return [u.name, u.surname].filter(Boolean).join(' ') || '—'
})

const updateStatus = async () => {
    if (!approval.value || !statusDraft.value) return
    try {
        isOpenConfirmDialog.value = false
        const body: UpdateUserIncentiveApprovalBody = { status: statusDraft.value }
        await useRequest<UserIncentiveApproval>(`/manager/user-incentive-approvals/${approvalId.value}`, {
            method: 'PATCH',
            body
        })
        $toast({
            title: 'Başarılı',
            description: 'Onay durumu güncellendi.'
        })
        await refresh()
    } catch {
        $toast({
            title: 'Hata',
            description: 'Durum güncellenemedi.',
            variant: 'destructive'
        })
    }
}
</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink as-child>
                        <NuxtLink to="/dashboard/user-incentive-approvals"> Kullanıcı teşvik onayları </NuxtLink>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage> Detay </BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

        <div v-if="pending" class="flex items-center justify-center p-12 text-muted-foreground"> Yükleniyor... </div>

        <template v-else-if="approval">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-semibold tracking-tight">{{ userDisplayName }}</h1>
                    <p class="text-sm text-muted-foreground mt-1">
                        {{ approval.user?.email }} · {{ approval.incentiveTerm?.year != null ? `${approval.incentiveTerm.year} dönemi` : '—' }}
                    </p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <Select v-model="statusDraft" :disabled="pending">
                        <SelectTrigger class="w-[220px]">
                            <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDING"> Beklemede </SelectItem>
                            <SelectItem value="COMPLETED"> Tamamlandı </SelectItem>
                        </SelectContent>
                    </Select>

                    <AlertDialog v-model:open="isOpenConfirmDialog">
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle> Onay durumunu değiştirmek istiyor musunuz? </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Durum <b>{{ statusLabel(approval.status) }}</b> iken <b>{{ statusLabel(statusDraft) }}</b> olarak güncellenecek.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    @click="
                                        () => {
                                            if (approval) statusDraft = approval.status
                                            isOpenConfirmDialog = false
                                        }
                                    "
                                >
                                    İptal
                                </AlertDialogCancel>
                                <AlertDialogAction @click="updateStatus"> Kaydet </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle class="text-base">Kullanıcı</CardTitle>
                    </CardHeader>
                    <CardContent class="text-sm space-y-2">
                        <p><span class="text-muted-foreground">Ad Soyad:</span> {{ userDisplayName }}</p>
                        <p><span class="text-muted-foreground">E-posta:</span> {{ approval.user?.email || '—' }}</p>
                        <p><span class="text-muted-foreground">Unvan:</span> {{ approval.user?.title || '—' }}</p>
                        <p><span class="text-muted-foreground">IBAN:</span> {{ approval.user?.iban || '—' }}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle class="text-base">Dönem ve kayıt</CardTitle>
                    </CardHeader>
                    <CardContent class="text-sm space-y-2">
                        <p><span class="text-muted-foreground">Yıl:</span> {{ approval.incentiveTerm?.year ?? '—' }}</p>
                        <p><span class="text-muted-foreground">Dönem durumu:</span> {{ approval.incentiveTerm?.status ? statusLabel(approval.incentiveTerm.status) : '—' }}</p>
                        <p><span class="text-muted-foreground">Oluşturulma:</span> {{ formatDate(approval.createdAt) }}</p>
                        <p><span class="text-muted-foreground">Güncellenme:</span> {{ formatDate(approval.updatedAt) }}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle class="text-base">Tutar kırılımı (TL)</CardTitle>
                </CardHeader>
                <CardContent class="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead class="min-w-[120px]">Kategori</TableHead>
                                <TableHead class="text-right">Adet</TableHead>
                                <TableHead class="text-right">Nihai</TableHead>
                                <TableHead class="text-right">Limit uyarısı</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow v-for="row in categoryRows" :key="row.key">
                                <TableCell class="font-medium">{{ row.label }}</TableCell>
                                <TableCell class="text-right tabular-nums">{{ row.bucket?.count ?? '—' }}</TableCell>
                                <TableCell class="text-right tabular-nums">{{ formatTl(row.bucket?.finalAmount) }}</TableCell>
                                <TableCell class="text-right">
                                    <Badge v-if="row.bucket?.exceedsLimit" variant="destructive"> Limit aşıldı </Badge>
                                    <span v-else class="text-muted-foreground">—</span>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </template>

        <div v-else class="text-muted-foreground"> Kayıt bulunamadı. </div>
    </div>
</template>
