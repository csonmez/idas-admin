<template>
  <!-- Main content with padding -->
  <div class="flex flex-1 flex-col gap-6 p-6 pt-0 h-full w-full max-w-full overflow-y-auto">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center p-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Bölüm verileri yükleniyor...</p>
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
      :data="data as unknown as Record<string, unknown>[]"
      :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
      :filterable-columns="filterableColumns"
      title="Bölümler Listesi"
      description="Erciyes Üniversitesi bölümlerinin listesi ve detayları"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, filterableColumns, type Department } from '@/components/DataTable/Departments/columns'
import { Button } from '@/components/ui/button'
import { ref, onMounted } from 'vue'

// Bölüm verileri
const data = ref<Department[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Backend'den bölüm verilerini getir
const fetchDepartments = async () => {
  try {
    loading.value = true
    error.value = null

    // Backend API endpoint'i - manager service'den gelen veriler
    const response = await $fetch<any>('/api/manager/departments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        page: 1,
        limit: 100, // Backend'de maksimum 100
        useFaculty: true, // Fakülte bilgilerini de getir
        onlyData: true // Sadece data kısmını getir
      }
    })

    // Backend'den gelen veriyi Department tipine dönüştür
    let departments: any[] = []
    
    if (Array.isArray(response)) {
      departments = response
    } else if (response?.data && Array.isArray(response.data)) {
      departments = response.data
    } else if (response?.departments && Array.isArray(response.departments)) {
      departments = response.departments
    } else if (response?.result && Array.isArray(response.result)) {
      departments = response.result
    }
    
    // Backend'den gelen veriyi frontend formatına dönüştür
    const formattedDepartments: Department[] = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      facultyId: dept.facultyId || '',
      address: dept.address || '',
      phone: dept.phone || '',
      email: dept.email || '',
      website: dept.website || dept.webSite || '',
      head: dept.head || dept.headName || 'Belirtilmemiş',
      academicianCount: dept.academicianCount || dept.userCount || 0,
      disciplineCount: dept.disciplineCount || 0,
      faculty: {
        id: dept.faculty?.id || dept.facultyId || '',
        name: dept.faculty?.name || 'Bilinmeyen Fakülte'
      },
      createdAt: dept.createdAt ? new Date(dept.createdAt) : new Date(),
      updatedAt: dept.updatedAt ? new Date(dept.updatedAt) : new Date()
    }))
    
    data.value = formattedDepartments
  } catch (err: any) {
    console.error('Bölüm verileri getirilemedi:', err)
    
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
          error.value = 'Bölüm bulunamadı.'
          break
        case 'AUTHx001':
          error.value = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.'
          break
        default:
          error.value = 'Bölüm verileri yüklenirken bir hata oluştu.'
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
          error.value = 'Bölüm verileri yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Bölüm verileri yüklenirken bir hata oluştu.'
    }
    
    data.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDepartments()
})

const refreshData = () => {
  fetchDepartments()
}
</script>
