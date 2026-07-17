<script setup lang="ts">
import type { ColumnFiltersState, PaginationState } from '@tanstack/vue-table'
import { FlexRender, createColumnHelper, getCoreRowModel, getSortedRowModel, useVueTable } from '@tanstack/vue-table'
import { Loader, ShieldAlert, View, CirclePlus } from 'lucide-vue-next'
import { h, resolveComponent } from 'vue'
import { cn, valueUpdater } from '~/lib/utils'
import type { User, IApiResponse } from '~/types'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const NuxtLink = resolveComponent('NuxtLink')
const router = useRouter()

const isLoading = ref(false)
const search = ref('')
const columnHelper = createColumnHelper<User>()
const titleMap: Record<string, string> = {
    PROF: 'Prof. Dr.',
    ASSOC_PROF: 'Doç. Dr.',
    ASSIST_PROF: 'Dr. Öğr. Üyesi',
    RESEARCH_ASSIST: 'Arş. Gör.',
    LECTURER: 'Öğr. Gör.',
    DOCTOR: 'Dr.'
}
const columns = [
    columnHelper.accessor((row) => row.name + ' ' + row.surname, {
        header: 'İsim Soyisim',
        cell: ({ row }) => {
            const title = row.original.title
            return h('div', { class: 'flex flex-col' }, [
                h('span', { class: 'font-medium' }, row.original.name + ' ' + row.original.surname),
                h('span', { class: 'text-sm text-muted-foreground' }, titleMap[title as string] || '')
            ])
        }
    }),
    columnHelper.accessor((row) => row.userAcademicUnits, {
        header: 'Fakülte',
        cell: ({ row }) =>
            h(
                'div',
                { class: 'text-wrap' },
                (row.original.userAcademicUnits || []).map((u) => h('p', {}, u.faculty?.name))
            )
    }),
    columnHelper.accessor((row) => row.userAcademicUnits, {
        header: 'Bölüm',
        cell: ({ row }) =>
            h(
                'div',
                { class: 'text-wrap' },
                (row.original.userAcademicUnits || []).map((u) => h('p', {}, u.department?.name))
            )
    }),
    columnHelper.accessor((row) => row.userAcademicUnits, {
        header: 'Ana Bilim Dalı',
        cell: ({ row }) =>
            h(
                'div',
                { class: 'text-wrap' },
                (row.original.userAcademicUnits || []).map((u) => h('p', {}, u.discipline?.name))
            )
    }),
    columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
            return h(
                NuxtLink,
                {
                    to: `/dashboard/academicians/${row.original.id}`,
                    class: 'flex items-center justify-end w-25'
                },
                () => h(View, { size: 16 })
            )
        }
    })
]
const pagination = ref<PaginationState>({
    pageIndex: 1,
    pageSize: 10
})
const columnFilters = ref<ColumnFiltersState>([])
const getCanPreviousPage = computed(() => pagination.value.pageIndex > 1)
const getCanNextPage = computed(() => pagination.value.pageIndex < table.getPageCount())
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const formSchema = toTypedSchema(
    z.object({
        name: z.string({ required_error: 'İsim alanı zorunludur' }).min(1, { message: 'İsim alanı zorunludur' }),
        surname: z.string({ required_error: 'Soyisim alanı zorunludur' }).min(1, { message: 'Soyisim alanı zorunludur' }),
        email: z
            .string({ required_error: 'Kullanıcı adı alanı zorunludur' })
            .trim()
            .toLowerCase()
            .refine((value) => !value.includes('@'), {
                message: 'Lütfen sadece kullanıcı adınızı yazınız.'
            })
            .transform((value) => value + '@erciyes.edu.tr'),
        title: z.string({ required_error: 'Unvan alanı zorunludur' }).min(1, { message: 'Unvan alanı zorunludur' })
    })
)
const formRef = ref()

const onSubmit = async (values: Record<string, any>) => {
    try {
        isSubmitting.value = true
        const response = await useRequest<User>('/manager/users', {
            method: 'POST',
            body: values
        })

        if (response?.id) {
            router.push(`/dashboard/academicians/${response.id}`)
            formRef.value?.resetForm()
        }
    } catch (error: any) {
        console.error('Error creating academician:', error)
        if (error.data?.code === 'ERRORx007') {
            $toast({
                title: 'E-posta adresi zaten kayıtlı',
                description: 'Lütfen farklı bir kullanıcı adı ile tekrar deneyiniz.',
                variant: 'destructive'
            })
        } else {
            $toast({
                title: 'Bir hata meydana geldi',
                description: 'Akademisyen eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.',
                variant: 'destructive'
            })
        }
    } finally {
        isSubmitting.value = false
        isDialogOpen.value = false
    }
}
const getAcademicians = async () => {
    const response = await useRequest<IApiResponse<User>>('/manager/users', {
        method: 'GET',
        query: {
            select: 'id,name,surname,title,email,updatedAt,userAcademicUnits',
            page: pagination.value.pageIndex,
            userAcademicUnitsSelect: 'id,faculty,department,discipline',
            facultySelect: 'id,name',
            departmentSelect: 'id,name',
            disciplineSelect: 'id,name',
            userType: 'ACADEMICIAN',
            search: search.value,
            sortBy: 'title',
            sortOrder: 'asc'
        }
    })
    return response
}

const { data: academicians, refresh, pending: isFetchingAcademicians } = await useAsyncData('university-academicians', getAcademicians)

const table = useVueTable({
    get data() {
        return academicians.value ? academicians.value?.rows : []
    },
    columns,
    manualPagination: true,
    manualFiltering: true,
    get rowCount() {
        return academicians.value ? academicians.value.pagination.totalItems : 0
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: (updaterOrValue) => valueUpdater(updaterOrValue, pagination),
    state: {
        get columnFilters() {
            return columnFilters.value
        },
        pagination: pagination.value
    }
})

watch(
    () => pagination.value.pageIndex,
    () => refresh()
)
watch(search, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        pagination.value.pageIndex = 1
    }
    if (search.value.length >= 3 || !search.value.length) {
        refresh()
    }
})
watch(isDialogOpen, (newValue) => {
    if (!newValue) {
        formRef.value?.resetForm()
    }
})
</script>

<template>
    <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
        <Card>
            <CardHeader>
                <div class="flex flex-row justify-between items-center gap-4 flex-wrap">
                    <CardTitle>Akademisyenler</CardTitle>
                    <div class="flex items-center gap-2">
                        <Input v-model="search" type="text" placeholder="Akademisyen ara..." class="max-w-xs" />
                        <TooltipProvider :delay-duration="0">
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <Button size="icon" variant="secondary" class="opacity-60 hover:opacity-600 rounded-full" @click="isDialogOpen = true">
                                        <CirclePlus class="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent> Akademisyen Ekle </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div class="relative overflow-x-auto">
                    <Table v-if="table.getRowModel().rows?.length">
                        <TableHeader>
                            <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                                <TableHead
                                    v-for="header in headerGroup.headers"
                                    :key="header.id"
                                    :data-pinned="header.column.getIsPinned()"
                                    :class="cn({ 'sticky bg-background/95': header.column.getIsPinned() }, header.column.getIsPinned() === 'left' ? 'left-0' : 'right-0')"
                                >
                                    <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <template v-if="table.getRowModel().rows?.length">
                                <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
                                    <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                        <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                    </TableCell>
                                </TableRow>
                            </template>

                            <TableRow v-else>
                                <TableCell :colspan="columns.length" class="h-24 text-center">Akademisyen bulunamadı. </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <Alert v-else class="bg-amber-50 border-amber-100">
                        <ShieldAlert class="h-4 w-4" />
                        <AlertDescription>
                            <p>Akademisyen bulunamadı.</p>
                        </AlertDescription>
                    </Alert>
                    <div v-if="isFetchingAcademicians" class="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
                        <Loader />
                    </div>
                </div>
                <div v-if="table.getRowModel().rows.length" class="flex items-center justify-end space-x-2 py-4">
                    <div class="flex-1 text-sm text-muted-foreground">
                        {{ table.getRowCount() }} kayıttan
                        {{ (pagination.pageIndex - 1) * 10 + 1 + '-' + ((pagination.pageIndex - 1) * 10 + table.getFilteredRowModel().rows.length) }}
                        arasındakiler gösteriliyor.
                    </div>
                    <div class="space-x-2">
                        <Button variant="outline" size="sm" :disabled="!getCanPreviousPage" @click="table.previousPage()">Geri</Button>
                        <Button variant="outline" size="sm" :disabled="!getCanNextPage" @click="table.nextPage()">İleri</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Dialog v-model:open="isDialogOpen">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Akademisyen Ekle</DialogTitle>
                    <DialogDescription> Yeni akademisyen bilgilerini girin. Kaydettiğinizde detay sayfasına yönlendirileceksiniz. </DialogDescription>
                </DialogHeader>
                <Form
                    ref="formRef"
                    :validation-schema="formSchema"
                    :initial-values="{
                        name: '',
                        surname: '',
                        email: '',
                        title: ''
                    }"
                    class="space-y-4"
                    @submit="onSubmit"
                >
                    <FormField v-slot="{ componentField }" :validate-on-mount="false" name="name">
                        <FormItem>
                            <FormLabel>İsim</FormLabel>
                            <FormControl>
                                <Input v-bind="componentField" placeholder="İsim giriniz" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" :validate-on-mount="false" name="surname">
                        <FormItem>
                            <FormLabel>Soyisim</FormLabel>
                            <FormControl>
                                <Input v-bind="componentField" placeholder="Soyisim giriniz" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" :validate-on-mount="false" name="email">
                        <FormItem>
                            <FormLabel>E-posta adresi</FormLabel>
                            <FormControl>
                                <div class="relative">
                                    <Input v-bind="componentField" type="email" placeholder="Kullanıcı adını yazınız" />
                                    <Label class="absolute right-2 top-1/2 transform -translate-y-1/2">@erciyes.edu.tr</Label>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" :validate-on-mount="false" name="title">
                        <FormItem>
                            <FormLabel>Unvan</FormLabel>
                            <FormControl>
                                <Select v-bind="componentField">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Unvan seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem v-for="(label, value) in titleMap" :key="value" :value="value">
                                            {{ label }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <DialogFooter>
                        <Button type="button" variant="outline" @click="isDialogOpen = false">İptal</Button>
                        <Button type="submit" :disabled="isSubmitting">
                            <Loader v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                            Kaydet
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    </div>
</template>
