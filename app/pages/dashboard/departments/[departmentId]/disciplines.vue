<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, type Discipline } from '@/components/DataTable/Disciplines/columns'
import { Button } from '@/components/ui/button'

// Route parametrelerini al
const route = useRoute()
const departmentId = route.params.departmentId as string

// Anabilim dalı verileri
const disciplines = ref<Discipline[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const departmentName = ref<string>('')

// Backend'den bölüm anabilim dallarını getir
const fetchDepartmentDisciplines = async (departmentId: string) => {
  try {
    loading.value = true
    error.value = null

    // Backend API endpoint'i - manager service'den gelen veriler
    const response = await $fetch<any>('/api/manager/disciplines', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        page: 1,
        limit: 100,
        departmentId: departmentId,
        useFaculty: true,
        useDepartment: true
      }
    })

    // Backend'den gelen veriyi Discipline tipine dönüştür
    let backendDisciplines: any[] = []
    
    if (Array.isArray(response)) {
      backendDisciplines = response
    } else if (response?.data && Array.isArray(response.data)) {
      backendDisciplines = response.data
    } else if (response?.rows && Array.isArray(response.rows)) {
      backendDisciplines = response.rows
    } else if (response?.disciplines && Array.isArray(response.disciplines)) {
      backendDisciplines = response.disciplines
    } else if (response?.result && Array.isArray(response.result)) {
      backendDisciplines = response.result
    }
    
    // Backend'den gelen veriyi frontend formatına dönüştür
    const formattedDisciplines: Discipline[] = backendDisciplines.map(discipline => ({
      id: discipline.id,
      name: discipline.name,
      shortName: discipline.shortName,
      phone: discipline.phone,
      email: discipline.email,
      address: discipline.address,
      website: discipline.website,
      departmentId: discipline.departmentId,
      facultyId: discipline.facultyId,
      faculty: discipline.faculty?.name || null,
      department: {
        id: discipline.departmentId || departmentId,
        name: discipline.department?.name || 'Bilinmeyen Bölüm'
      },
      createdAt: discipline.createdAt ? new Date(discipline.createdAt) : new Date(),
      updatedAt: discipline.updatedAt ? new Date(discipline.updatedAt) : new Date(),
      deletedAt: discipline.deletedAt ? new Date(discipline.deletedAt) : null
    }))
    
    disciplines.value = formattedDisciplines
    
    // Bölüm adını al
    if (formattedDisciplines.length > 0 && formattedDisciplines[0].department) {
      departmentName.value = formattedDisciplines[0].department.name
    }
    
  } catch (err: any) {
    console.error('Bölüm anabilim dalları getirilemedi:', err)
    
    // Backend'den gelen error kodlarını handle et
    if (err?.data?.code) {
      switch (err.data.code) {
        case 'ERRORx001':
          error.value = 'Geçersiz istek parametreleri.'
          break
        case 'ERRORx002':
          error.value = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
          break
        case 'ERRORx008':
          error.value = 'Anabilim dalı bulunamadı.'
          break
        case 'AUTHx001':
          error.value = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.'
          break
        default:
          error.value = 'Bölüm anabilim dalları yüklenirken bir hata oluştu.'
      }
    } else if (err?.status) {
      switch (err.status) {
        case 401:
          error.value = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.'
          break
        case 403:
          error.value = 'Bu işlem için yetkiniz bulunmamaktadır.'
          break
        case 404:
          error.value = 'İstenen kaynak bulunamadı.'
          break
        case 500:
          error.value = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
          break
        default:
          error.value = 'Bölüm anabilim dalları yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Bölüm anabilim dalları yüklenirken bir hata oluştu.'
    }
    
    disciplines.value = []
  } finally {
    loading.value = false
  }
}

// İstatistikler
const stats = computed(() => {
  const disciplinesList = disciplines.value
  return {
    total: disciplinesList.length,
    active: disciplinesList.filter(d => !d.deletedAt).length,
    passive: disciplinesList.filter(d => d.deletedAt).length
  }
})

// Anabilim dalı filtreleme seçenekleri
const disciplineFilterableColumns = [
  {
    id: 'status',
    title: 'Durum',
    options: [
      { label: 'Aktif', value: 'ACTIVE' },
      { label: 'Pasif', value: 'PASSIVE' }
    ]
  }
]

// Sayfa yüklendiğinde verileri getir
onMounted(() => {
  fetchDepartmentDisciplines(departmentId)
})

// Refresh fonksiyonu
const refreshData = () => {
  fetchDepartmentDisciplines(departmentId)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center p-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Anabilim dalı verileri yükleniyor...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex items-center justify-center p-8">
      <div class="text-center">
        <p class="text-destructive mb-4">{{ error }}</p>
        <Button @click="refreshData" variant="outline">
          Tekrar Dene
        </Button>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Anabilim Dalları</h1>
      <p class="text-muted-foreground">{{ departmentName }} bölümünde bulunan anabilim dallarını görüntüleyin ve yönetin</p>
    </div>
    
    <!-- Stats Grid -->
    <div class="max-w-4xl grid gap-6 sm:gap-8 md:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Toplam Dal</h3>
        <p class="text-2xl font-bold text-blue-600">{{ stats.total }}</p>
        <p class="text-sm text-muted-foreground">Aktif anabilim dalı</p>
      </div>
      
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Aktif</h3>
        <p class="text-2xl font-bold text-green-600">{{ stats.active }}</p>
        <p class="text-sm text-muted-foreground">Aktif anabilim dalı</p>
      </div>
      
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Pasif</h3>
        <p class="text-2xl font-bold text-purple-600">{{ stats.passive }}</p>
        <p class="text-sm text-muted-foreground">Pasif anabilim dalı</p>
      </div>
    </div>
    
    <!-- DataTable -->
    <div class="max-w-4xl rounded-lg border p-6">
      <DataTable 
        :title="`${departmentName} Anabilim Dalları`"
        :description="`${departmentName} bölümünde bulunan anabilim dallarının listesi`"
        :data="disciplines as unknown as Record<string, unknown>[]"
        :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
        :filterable-columns="disciplineFilterableColumns"
      />
    </div>
  </div>
  </div>
</template>
