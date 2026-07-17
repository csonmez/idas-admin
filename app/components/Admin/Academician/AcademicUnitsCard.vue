<script setup lang="ts">
import { Pen, Plus, Trash2 } from 'lucide-vue-next'
import type { User, Faculty, Department, Discipline, RolePermission } from '~/types'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface EditableAcademicUnit {
    id?: string
    affiliationType: 'MAIN' | 'ADDITIONAL'
    facultyId?: string
    departmentId?: string
    disciplineId?: string
}

interface FormData {
    academicUnits: EditableAcademicUnit[]
    newUnit: EditableAcademicUnit
}

const props = defineProps<{
    user: User & {
        rolePermissions: RolePermission[]
    }
}>()
const emit = defineEmits<{
    (e: 'update:user'): void
}>()

const editingUnitId = ref<string | null>(null)
const isAddingUnit = ref(false)
const isLoading = ref(false)
const isOpenDeleteDialog = ref(false)
const unitToDelete = ref<string | null>(null)
const activeTab = ref<'unit' | 'role'>('unit')
const tempRole = ref<string | undefined>(undefined)
const tempPositionType = ref<'MAIN' | 'ADDITIONAL' | undefined>(undefined)
const originalRole = ref<string | undefined>(undefined)
const originalPositionType = ref<'MAIN' | 'ADDITIONAL' | undefined>(undefined)
const originalUnitData = ref<EditableAcademicUnit | null>(null)
const academicUnits = computed(() => props.user.userAcademicUnits || [])
const facultiesData = ref<Faculty[]>([])
const departmentsData = ref<{ [key: string]: Department[] }>({})
const disciplinesData = ref<{ [key: string]: Discipline[] }>({})

const formData: FormData = reactive({
    academicUnits: [],
    newUnit: {
        affiliationType: 'ADDITIONAL',
        facultyId: '',
        departmentId: '',
        disciplineId: ''
    }
})
const newUnitFacultyId = computed({
    get: () => formData.newUnit?.facultyId ?? '',
    set: (value: string) => {
        if (formData.newUnit) formData.newUnit.facultyId = value
    }
})
const newUnitDepartmentId = computed({
    get: () => formData.newUnit?.departmentId ?? '',
    set: (value: string) => {
        if (formData.newUnit) formData.newUnit.departmentId = value
    }
})
const newUnitDisciplineId = computed({
    get: () => formData.newUnit?.disciplineId ?? '',
    set: (value: string) => {
        if (formData.newUnit) formData.newUnit.disciplineId = value
    }
})

const fetchFaculties = async () => {
    try {
        const faculties = await useRequest<Faculty[]>('/manager/faculties', {
            method: 'GET',
            query: {
                attributes: 'id name type',
                isAll: true,
                type: 'FACULTY',
                onlyData: true
            }
        })
        facultiesData.value = faculties.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    } catch (error) {
        console.error(error)
        $toast({ title: 'Hata', description: 'Fakülte bilgileri yüklenirken bir hata oluştu.', variant: 'destructive' })
    }
}
const fetchDepartments = async (facultyId: string) => {
    try {
        const departments = await useRequest<Department[]>('/manager/departments', {
            method: 'GET',
            query: {
                attributes: 'id name facultyId',
                facultyId,
                isAll: true,
                onlyData: true
            }
        })
        departmentsData.value[facultyId] = departments.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    } catch (error) {
        console.error(error)
        $toast({ title: 'Hata', description: 'Bölüm bilgileri yüklenirken bir hata oluştu.', variant: 'destructive' })
    }
}
const fetchDisciplines = async (departmentId: string) => {
    try {
        const disciplines = await useRequest<Discipline[]>('/manager/disciplines', {
            method: 'GET',
            query: {
                attributes: 'id name departmentId',
                departmentId,
                isAll: true,
                onlyData: true
            }
        })
        disciplinesData.value[departmentId] = disciplines.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    } catch (error) {
        console.error(error)
        $toast({ title: 'Hata', description: 'Ana bilim dalı bilgileri yüklenirken bir hata oluştu.', variant: 'destructive' })
    }
}
const isUnitFormChanged = computed(() => {
    if (!editingUnitId.value || !originalUnitData.value) return false
    const currentUnit = formData.academicUnits.find((u) => u.id === editingUnitId.value)
    if (!currentUnit) return false

    return (
        currentUnit.affiliationType !== originalUnitData.value.affiliationType ||
        currentUnit.facultyId !== originalUnitData.value.facultyId ||
        currentUnit.departmentId !== originalUnitData.value.departmentId ||
        currentUnit.disciplineId !== originalUnitData.value.disciplineId
    )
})

const isRoleFormChanged = computed(() => {
    return tempRole.value !== originalRole.value || tempPositionType.value !== originalPositionType.value
})

const handleEditUnit = async (unitId: string) => {
    editingUnitId.value = unitId
    activeTab.value = 'unit'
    await fetchFaculties()
    const unit = formData.academicUnits.find((u) => u.id === unitId)
    if (unit) {
        originalUnitData.value = { ...unit }
        if (unit.facultyId) {
            await fetchDepartments(unit.facultyId)
        }
        if (unit.departmentId) {
            await fetchDisciplines(unit.departmentId)
        }
    }
}
const handleCancelEditUnit = () => {
    editingUnitId.value = null
    tempRole.value = undefined
    tempPositionType.value = undefined
    originalRole.value = undefined
    originalPositionType.value = undefined
    originalUnitData.value = null
    activeTab.value = 'unit'
    // Reset form data to original state
    formData.academicUnits =
        props.user.userAcademicUnits?.map((unit) => ({
            id: unit.id,
            affiliationType: unit.affiliationType,
            facultyId: unit.facultyId || '',
            departmentId: unit.departmentId || '',
            disciplineId: unit.disciplineId || ''
        })) || []
}
const handleSubmitUnit = async (unitId: string) => {
    try {
        isLoading.value = true
        const unit = formData.academicUnits.find((u) => u.id === unitId)
        if (!unit) return

        await useRequest(`/manager/users/${props.user.id}/academic-units/${unitId}`, {
            method: 'PATCH',
            body: unit
        })

        emit('update:user')

        $toast({ title: 'Başarılı', description: 'Akademik birim bilgileri güncellendi.' })
        editingUnitId.value = null
    } catch (error) {
        console.error(error)
        $toast({ title: 'Hata', description: 'Akademik birim bilgileri güncellenirken bir hata oluştu.', variant: 'destructive' })
    } finally {
        isLoading.value = false
    }
}
const handleAddUnit = async () => {
    isAddingUnit.value = true
    await fetchFaculties()
    formData.newUnit = {
        affiliationType: academicUnits.value.length === 0 ? 'MAIN' : 'ADDITIONAL',
        facultyId: '',
        departmentId: '',
        disciplineId: ''
    } as EditableAcademicUnit
}
const handleCancelAddUnit = () => {
    isAddingUnit.value = false
    formData.newUnit = {
        affiliationType: 'ADDITIONAL',
        facultyId: '',
        departmentId: '',
        disciplineId: ''
    }
}
const handleSubmitNewUnit = async () => {
    try {
        isLoading.value = true
        await useRequest(`/manager/users/${props.user.id}/academic-units`, {
            method: 'POST',
            body: formData.newUnit
        })

        emit('update:user')
        $toast({ title: 'Başarılı', description: 'Akademik birim başarıyla eklendi.' })
        isAddingUnit.value = false
        formData.newUnit = {
            affiliationType: 'ADDITIONAL',
            facultyId: '',
            departmentId: '',
            disciplineId: ''
        }
    } catch (error) {
        console.error(error)
        $toast({ title: 'Hata', description: 'Akademik birim eklenirken bir hata oluştu.', variant: 'destructive' })
    } finally {
        isLoading.value = false
    }
}
const handleDeleteUnit = async (unitId: string) => {
    try {
        isLoading.value = true
        await useRequest(`/manager/users/${props.user.id}/academic-units/${unitId}`, {
            method: 'DELETE'
        })

        emit('update:user')
        $toast({ title: 'Başarılı', description: 'Akademik birim başarıyla silindi.' })
    } catch (error) {
        console.error(error)
        $toast({ title: 'Hata', description: 'Akademik birim silinirken bir hata oluştu.', variant: 'destructive' })
    } finally {
        isLoading.value = false
        isOpenDeleteDialog.value = false
        unitToDelete.value = null
    }
}
const openDeleteDialog = (unitId: string) => {
    unitToDelete.value = unitId
    isOpenDeleteDialog.value = true
}

// Add watchers for newUnit selections
watch(newUnitFacultyId, async (newFacultyId) => {
    if (newFacultyId) {
        await fetchDepartments(newFacultyId)
        formData.newUnit.departmentId = ''
        formData.newUnit.disciplineId = ''
    }
})
watch(newUnitDepartmentId, async (newDepartmentId) => {
    if (newDepartmentId) {
        await fetchDisciplines(newDepartmentId)
        formData.newUnit.disciplineId = ''
    }
})
// Add watchers for existing units
watch(
    () => formData.academicUnits,
    async (newUnits) => {
        for (const unit of newUnits) {
            if (unit.facultyId && !departmentsData.value[unit.facultyId]) {
                await fetchDepartments(unit.facultyId)
            }
            if (unit.departmentId && !disciplinesData.value[unit.departmentId]) {
                await fetchDisciplines(unit.departmentId)
            }
        }
    },
    { deep: true }
)
// Initialize form data when user changes
watch(
    () => props.user,
    (newUser) => {
        if (newUser?.userAcademicUnits) {
            formData.academicUnits = newUser.userAcademicUnits.map((unit) => ({
                id: unit.id,
                affiliationType: unit.affiliationType,
                facultyId: unit.facultyId || '',
                departmentId: unit.departmentId || '',
                disciplineId: unit.disciplineId || ''
            }))
        }
    },
    { immediate: true }
)

const ROLES = [
    { value: 'DEAN', label: 'Dekan' },
    { value: 'DEPARTMENT_HEAD', label: 'Bölüm Başkanı' },
    { value: 'DISCIPLINE_HEAD', label: 'Ana Bilim Dalı Başkanı' }
] as const

const POSITION_TYPES = [
    { value: 'MAIN', label: 'Asıl Görev' },
    { value: 'ADDITIONAL', label: 'Ek Görev' }
] as const

const handleRoleTabOpen = (unitId: string) => {
    const rolePermission = props.user.rolePermissions?.find((rp) => rp.academicUnitId === unitId) as RolePermission | undefined
    tempRole.value = rolePermission?.role ?? undefined
    tempPositionType.value = rolePermission?.positionType
    originalRole.value = rolePermission?.role ?? undefined
    originalPositionType.value = rolePermission?.positionType
}
const handleRoleUpdate = async (unitId: string) => {
    try {
        isLoading.value = true
        const currentRolePermission = props.user.rolePermissions?.find((rp) => rp.academicUnitId === unitId) as RolePermission | undefined

        // Eğer mevcut rol varsa
        if (currentRolePermission?.id) {
            // NO_ROLE seçildiyse rolü sil
            if (tempRole.value === 'NO_ROLE') {
                await useRequest(`/manager/users/${props.user.id}/role-permissions/${currentRolePermission.id}`, {
                    method: 'DELETE'
                })
            }
            // Farklı bir rol seçildiyse güncelle
            else if (tempRole.value && (tempRole.value !== currentRolePermission.role || tempPositionType.value !== currentRolePermission.positionType)) {
                await useRequest(`/manager/users/${props.user.id}/role-permissions/${currentRolePermission.id}`, {
                    method: 'PATCH',
                    body: {
                        role: tempRole.value,
                        positionType: tempPositionType.value
                    }
                })
            }
        }
        // Mevcut rol yoksa ve NO_ROLE seçilmediyse yeni rol ekle
        else if (tempRole.value && tempRole.value !== 'NO_ROLE' && tempPositionType.value) {
            await useRequest(`/manager/users/${props.user.id}/role-permissions`, {
                method: 'POST',
                body: {
                    academicUnitId: unitId,
                    role: tempRole.value,
                    positionType: tempPositionType.value
                }
            })
        }

        emit('update:user')
        $toast({ title: 'Başarılı', description: 'Rol başarıyla güncellendi.' })
        editingUnitId.value = null
        activeTab.value = 'unit'
    } catch (error) {
        console.error(error)
        $toast({ title: 'Hata', description: 'Rol güncellenirken bir hata oluştu.', variant: 'destructive' })
    } finally {
        isLoading.value = false
    }
}
// const getRoleForUnit = (unitId: string) => {
//     const rolePermission = props.user.rolePermissions?.find((rp) => rp.academicUnitId === unitId)
//     return rolePermission?.role ?? 'NO_ROLE'
// }
// const getPositionTypeForUnit = (unitId: string) => {
//     const rolePermission = props.user.rolePermissions?.find((rp) => rp.academicUnitId === unitId) as RolePermission | undefined
//     return rolePermission?.positionType
// }
const getRoleLabelForUnit = (unitId: string) => {
    const rolePermission = props.user.rolePermissions?.find((rp) => rp.academicUnitId === unitId) as RolePermission | undefined
    if (!rolePermission?.role) return null

    const roleLabel = ROLES.find((r) => r.value === rolePermission.role)?.label
    const positionLabel = rolePermission.positionType === 'ADDITIONAL' ? '(Ek Görev)' : ''

    return `${roleLabel} ${positionLabel}`.trim()
}
</script>

<template>
    <Card class="mt-4">
        <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle>Akademik Birim Bilgileri</CardTitle>
            <Button v-if="!isAddingUnit" variant="outline" size="sm" @click="handleAddUnit">
                <Plus class="mr-2 h-4 w-4" />
                Birim Ekle
            </Button>
        </CardHeader>
        <CardContent>
            <div v-if="isAddingUnit" class="mb-6 p-4 border rounded-lg">
                <h3 class="text-lg font-medium mb-4">Yeni Birim</h3>
                <Form @submit="handleSubmitNewUnit">
                    <div class="space-y-4">
                        <FormField name="newUnit.affiliationType">
                            <FormItem>
                                <FormLabel>Birim Türü</FormLabel>
                                <Select v-model="formData.newUnit.affiliationType">
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Birim türü seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="MAIN">Ana Birim</SelectItem>
                                        <SelectItem value="ADDITIONAL">Ek Birim</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="newUnit.facultyId">
                            <FormItem>
                                <FormLabel>Fakülte</FormLabel>
                                <Select v-model="newUnitFacultyId">
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Fakülte seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem v-for="faculty in facultiesData" :key="faculty.id" :value="faculty.id">
                                            {{ faculty.name }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="newUnit.departmentId">
                            <FormItem>
                                <FormLabel>Bölüm</FormLabel>
                                <Select v-model="newUnitDepartmentId" :disabled="!newUnitFacultyId">
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Bölüm seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem v-for="department in departmentsData[newUnitFacultyId as string] || []" :key="department.id" :value="department.id">
                                            {{ department.name }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="newUnit.disciplineId">
                            <FormItem>
                                <FormLabel>Ana Bilim Dalı</FormLabel>
                                <Select v-model="newUnitDisciplineId" :disabled="!newUnitDepartmentId">
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Ana Bilim Dalı seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem v-for="discipline in disciplinesData[newUnitDepartmentId as string] || []" :key="discipline.id" :value="discipline.id">
                                            {{ discipline.name }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <div class="flex justify-end gap-4">
                            <Button variant="outline" type="button" :disabled="isLoading" @click="handleCancelAddUnit"> İptal </Button>
                            <Button type="submit" :loading="isLoading">Kaydet</Button>
                        </div>
                    </div>
                </Form>
            </div>

            <div class="space-y-6 divide-y">
                <div v-for="(unit, index) in academicUnits" :key="unit.id" :class="{ 'pt-6': index > 0 }">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium">{{ unit.affiliationType === 'MAIN' ? 'Ana Birim' : `Ek Birim` }}</h3>
                        <div class="flex items-center gap-2">
                            <Button v-if="editingUnitId !== unit.id" variant="outline" size="sm" @click="handleEditUnit(unit.id)">
                                <Pen class="mr-2 h-4 w-4" />
                                Düzenle
                            </Button>
                        </div>
                    </div>

                    <div v-if="editingUnitId === unit.id">
                        <Tabs v-model="activeTab" class="w-full">
                            <TabsList class="grid w-full grid-cols-2">
                                <TabsTrigger value="unit" @click="activeTab = 'unit'">Birim Bilgileri</TabsTrigger>
                                <TabsTrigger value="role" @click="handleRoleTabOpen(unit.id!)">Rol Yönetimi</TabsTrigger>
                            </TabsList>
                            <TabsContent value="unit">
                                <Form :initial-values="formData" @submit="handleSubmitUnit(unit.id)">
                                    <div v-if="formData.academicUnits[index]" class="space-y-4">
                                        <FormField :name="`academicUnits.${index}.affiliationType`">
                                            <FormItem>
                                                <FormLabel>Birim Türü</FormLabel>
                                                <Select v-model="formData.academicUnits[index]!.affiliationType">
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Birim türü seçiniz" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="MAIN">Ana Birim</SelectItem>
                                                        <SelectItem value="ADDITIONAL">Ek Birim</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        </FormField>

                                        <FormField :name="`academicUnits.${index}.facultyId`">
                                            <FormItem>
                                                <FormLabel>Fakülte</FormLabel>
                                                <Select v-model="formData.academicUnits[index]!.facultyId">
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Fakülte seçiniz" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem v-for="faculty in facultiesData" :key="faculty.id" :value="faculty.id">
                                                            {{ faculty.name }}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        </FormField>

                                        <FormField :name="`academicUnits.${index}.departmentId`">
                                            <FormItem>
                                                <FormLabel>Bölüm</FormLabel>
                                                <Select v-model="formData.academicUnits[index]!.departmentId" :disabled="!formData.academicUnits[index]!.facultyId">
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Bölüm seçiniz" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem v-for="department in departmentsData[formData.academicUnits[index]!.facultyId || ''] || []" :key="department.id" :value="department.id">
                                                            {{ department.name }}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        </FormField>

                                        <FormField :name="`academicUnits.${index}.disciplineId`">
                                            <FormItem>
                                                <FormLabel>Ana Bilim Dalı</FormLabel>
                                                <Select v-model="formData.academicUnits[index]!.disciplineId" :disabled="!formData.academicUnits[index]!.departmentId">
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Ana Bilim Dalı seçiniz" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem v-for="discipline in disciplinesData[formData.academicUnits[index]!.departmentId || ''] || []" :key="discipline.id" :value="discipline.id">
                                                            {{ discipline.name }}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        </FormField>

                                        <div class="flex justify-end gap-4">
                                            <Button variant="ghost" size="icon" type="button" :disabled="isLoading" @click="openDeleteDialog(unit.id)">
                                                <Trash2 class="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <div class="flex-1" />
                                            <Button variant="outline" type="button" :disabled="isLoading" @click="handleCancelEditUnit"> İptal </Button>
                                            <Button type="submit" :loading="isLoading" :disabled="!isUnitFormChanged">Kaydet</Button>
                                        </div>
                                    </div>
                                </Form>
                            </TabsContent>
                            <TabsContent value="role">
                                <Form>
                                    <div class="space-y-4 py-4">
                                        <FormField name="role">
                                            <FormItem>
                                                <FormLabel>Rol</FormLabel>
                                                <Select v-model="tempRole">
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue :placeholder="tempRole ? (ROLES.find((r) => r.value === tempRole)?.label ?? 'Rol Yok') : 'Rol seçiniz'" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="NO_ROLE">Rol Yok</SelectItem>
                                                        <SelectItem v-for="role in ROLES" :key="role.value" :value="role.value">
                                                            {{ role.label }}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        </FormField>

                                        <FormField v-if="tempRole && tempRole !== 'NO_ROLE'" name="positionType">
                                            <FormItem>
                                                <FormLabel>Görev Türü</FormLabel>
                                                <Select v-model="tempPositionType">
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue :placeholder="tempPositionType ? POSITION_TYPES.find((t) => t.value === tempPositionType)?.label : 'Görev türü seçiniz'" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem v-for="type in POSITION_TYPES" :key="type.value" :value="type.value">
                                                            {{ type.label }}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription> Asıl Görev: Bu rol kişinin ana görevi. Ek Görev: Bu rol kişinin ek görevi. </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        </FormField>

                                        <div class="flex justify-end gap-4">
                                            <Button variant="outline" type="button" :disabled="isLoading" @click="handleCancelEditUnit"> İptal </Button>
                                            <Button
                                                type="button"
                                                :loading="isLoading"
                                                :disabled="(tempRole && tempRole !== 'NO_ROLE' && !tempPositionType) || !isRoleFormChanged"
                                                @click="handleRoleUpdate(unit.id!)"
                                            >
                                                Kaydet
                                            </Button>
                                        </div>
                                    </div>
                                </Form>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div v-else>
                        <div class="space-y-4">
                            <div class="flex items-center gap-4 p-1">
                                <div class="grid gap-1">
                                    <p class="font-medium leading-none">Fakülte</p>
                                </div>
                                <div class="ml-auto font-medium">{{ unit.faculty?.name ?? '-' }}</div>
                            </div>
                            <div class="flex items-center gap-4 p-1">
                                <div class="grid gap-1">
                                    <p class="font-medium leading-none">Bölüm</p>
                                </div>
                                <div class="ml-auto font-medium">{{ unit.department?.name ?? '-' }}</div>
                            </div>
                            <div class="flex items-center gap-4 p-1">
                                <div class="grid gap-1">
                                    <p class="font-medium leading-none">Ana Bilim Dalı</p>
                                </div>
                                <div class="ml-auto font-medium">{{ unit.discipline?.name ?? '-' }}</div>
                            </div>
                            <div v-if="getRoleLabelForUnit(unit.id!)" class="flex items-center gap-4 p-1">
                                <div class="grid gap-1">
                                    <p class="font-medium leading-none">Rol</p>
                                </div>
                                <div class="ml-auto font-medium">{{ getRoleLabelForUnit(unit.id!) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>

    <AlertDialog v-model:open="isOpenDeleteDialog">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Akademik birimi silmek istediğinize emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription> Bu işlem geri alınamaz. Akademik birimi silmek için "Sil" butonuna tıklayınız. </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="isOpenDeleteDialog = false">İptal</AlertDialogCancel>
                <AlertDialogAction @click="handleDeleteUnit(unitToDelete!)">Sil</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
