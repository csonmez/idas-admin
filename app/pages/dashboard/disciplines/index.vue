<template>
  <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
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

    <!-- DataTable bileşeni -->
    <DataTable 
      v-else
      title="Anabilim Dalları Listesi"
      description="Erciyes Üniversitesi anabilim dallarının listesi ve detayları"
      :data="data as unknown as Record<string, unknown>[]"
      :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
      :filterable-columns="filterableColumns"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, filterableColumns, type Discipline } from '@/components/DataTable/Disciplines/columns'
import { Button } from '@/components/ui/button'
import { ref, onMounted } from 'vue'

// Anabilim dalı verileri
const data = ref<Discipline[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Backend'den anabilim dalı verilerini getir
const fetchDisciplines = async () => {
  try {
    loading.value = true
    error.value = null

    // Backend API endpoint'i - manager service'den gelen veriler
    const response = await $fetch<any>('/api/manager/disciplines', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Authentication header'ı (gerçek uygulamada token'dan gelecek)
        // 'Authorization': 'Bearer your-token-here'
      },
      query: {
        isAll: true, // Tüm anabilim dallarını getir
        useDepartment: true, // Bölüm bilgilerini de getir
        onlyData: true // Sadece data kısmını getir
      }
    })

    // Backend'den gelen veriyi Discipline tipine dönüştür
    let disciplines: any[] = []
    
    if (Array.isArray(response)) {
      disciplines = response
    } else if (response?.data && Array.isArray(response.data)) {
      disciplines = response.data
    } else if (response?.disciplines && Array.isArray(response.disciplines)) {
      disciplines = response.disciplines
    } else if (response?.result && Array.isArray(response.result)) {
      disciplines = response.result
    }
    
    // Backend'den gelen veriyi frontend formatına dönüştür
    const formattedDisciplines: Discipline[] = disciplines.map(discipline => ({
      id: discipline.id,
      name: discipline.name,
      shortName: discipline.shortName || discipline.short_name || '',
      departmentId: discipline.departmentId || discipline.department_id,
      facultyId: discipline.facultyId || discipline.faculty_id,
      phone: discipline.phone || '',
      email: discipline.email || '',
      address: discipline.address || '',
      website: discipline.website || '',
      department: discipline.department ? {
        id: discipline.department.id,
        name: discipline.department.name
      } : undefined,
      faculty: discipline.faculty?.name || discipline.department?.faculty?.name || '',
      createdAt: discipline.createdAt ? new Date(discipline.createdAt) : undefined,
      updatedAt: discipline.updatedAt ? new Date(discipline.updatedAt) : undefined,
      deletedAt: discipline.deletedAt ? new Date(discipline.deletedAt) : null
    }))
    
    data.value = formattedDisciplines
  } catch (err: any) {
    console.error('Anabilim dalı verileri getirilemedi:', err)
    
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
          error.value = 'Anabilim dalı verileri yüklenirken bir hata oluştu.'
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
          error.value = 'Anabilim dalı verileri yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Anabilim dalı verileri yüklenirken bir hata oluştu.'
    }
    
    data.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDisciplines()
})

const refreshData = () => {
  fetchDisciplines()
}
</script>
