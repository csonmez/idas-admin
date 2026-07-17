<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, type Academician } from '@/components/DataTable/Academicians/columns'
import { Button } from '@/components/ui/button'

// Route parametrelerini al
const route = useRoute()
const departmentId = route.params.departmentId as string

// Akademisyen verileri
const academicians = ref<Academician[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const departmentName = ref<string>('')

// Backend'den bölüm akademisyenlerini getir
const fetchDepartmentAcademicians = async (departmentId: string) => {
  try {
    loading.value = true
    error.value = null

    // Backend API endpoint'i - manager service'den gelen veriler
    const response = await $fetch<any>('/api/manager/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        page: 1,
        limit: 100,
        departmentId: departmentId,
        useUserAcademicUnits: true
      }
    })

    // Backend'den gelen veriyi Academician tipine dönüştür
    let users: any[] = []
    
    if (Array.isArray(response)) {
      users = response
    } else if (response?.data && Array.isArray(response.data)) {
      users = response.data
    } else if (response?.users && Array.isArray(response.users)) {
      users = response.users
    } else if (response?.result && Array.isArray(response.result)) {
      users = response.result
    }
    
    // User verilerini Academician tipine dönüştür
    const formattedAcademicians: Academician[] = users.map(user => ({
      id: user.id,
      name: user.fullName || `${user.name} ${user.surname}`,
      email: user.email,
      department: user.academicUnits?.[0]?.department?.name || '',
      status: user.status as 'ACTIVE' | 'PASSIVE',
      title: user.title as 'PROF' | 'ASSOC_PROF' | 'ASSIST_PROF' | 'RESEARCH_ASSIST' | 'LECTURER' | 'DOCTOR',
      faculty: user.academicUnits?.[0]?.faculty?.name || '',
      discipline: user.academicUnits?.[0]?.discipline?.name || '',
      facultyId: user.academicUnits?.[0]?.facultyId || '',
      departmentId: user.academicUnits?.[0]?.departmentId || departmentId,
      disciplineId: user.academicUnits?.[0]?.disciplineId || '',
      phone: user.phone || '',
      iban: user.iban || '',
      createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined
    }))
    
    academicians.value = formattedAcademicians
    
    // Bölüm adını al
    if (formattedAcademicians.length > 0) {
      departmentName.value = formattedAcademicians[0].department || 'Bilinmeyen Bölüm'
    }
    
  } catch (err: any) {
    console.error('Bölüm akademisyenleri getirilemedi:', err)
    
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
          error.value = 'Akademisyen bulunamadı.'
          break
        case 'AUTHx001':
          error.value = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.'
          break
        default:
          error.value = 'Bölüm akademisyenleri yüklenirken bir hata oluştu.'
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
          error.value = 'Bölüm akademisyenleri yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Bölüm akademisyenleri yüklenirken bir hata oluştu.'
    }
    
    academicians.value = []
  } finally {
    loading.value = false
  }
}

// İstatistikler
const stats = computed(() => {
  const academiciansList = academicians.value
  const titleCounts = {
    PROF: academiciansList.filter(a => a.title === 'PROF').length,
    ASSOC_PROF: academiciansList.filter(a => a.title === 'ASSOC_PROF').length,
    ASSIST_PROF: academiciansList.filter(a => a.title === 'ASSIST_PROF').length
  }
  
  return {
    total: academiciansList.length,
    professors: titleCounts.PROF,
    associateProfessors: titleCounts.ASSOC_PROF,
    assistantProfessors: titleCounts.ASSIST_PROF
  }
})

// Akademisyen tipine göre filtreleme için options
const academicianFilterableColumns = [
  {
    id: 'title',
    title: 'Unvan',
    options: [
      { label: 'Profesör', value: 'PROF' },
      { label: 'Doçent', value: 'ASSOC_PROF' },
      { label: 'Dr. Öğr. Üyesi', value: 'ASSIST_PROF' },
      { label: 'Öğr. Gör.', value: 'LECTURER' },
      { label: 'Araş. Gör.', value: 'RESEARCH_ASSIST' }
    ]
  },
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
  fetchDepartmentAcademicians(departmentId)
})

// Refresh fonksiyonu
const refreshData = () => {
  fetchDepartmentAcademicians(departmentId)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center p-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Akademisyen verileri yükleniyor...</p>
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
      <h1 class="text-3xl font-bold tracking-tight">Akademisyenler</h1>
      <p class="text-muted-foreground">{{ departmentName }} bölümünde görev yapan akademisyenleri görüntüleyin ve yönetin</p>
    </div>
    
    <!-- Stats Grid -->
    <div class="max-w-4xl grid gap-6 sm:gap-8 md:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Profesör</h3>
        <p class="text-2xl font-bold text-blue-600">{{ stats.professors }}</p>
        <p class="text-sm text-muted-foreground">Prof. Dr. unvanında</p>
      </div>
      
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Doçent</h3>
        <p class="text-2xl font-bold text-green-600">{{ stats.associateProfessors }}</p>
        <p class="text-sm text-muted-foreground">Doç. Dr. unvanında</p>
      </div>
      
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Dr. Öğr. Üyesi</h3>
        <p class="text-2xl font-bold text-purple-600">{{ stats.assistantProfessors }}</p>
        <p class="text-sm text-muted-foreground">Öğretim üyesi</p>
      </div>
    </div>
    
    <!-- DataTable -->
    <div class="max-w-4xl rounded-lg border p-6">
      <DataTable 
        :title="`${departmentName} Akademisyenleri`"
        :description="`${departmentName} bölümünde görev yapan akademisyenlerin listesi`"
        :data="academicians as unknown as Record<string, unknown>[]"
        :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
        :filterable-columns="academicianFilterableColumns"
      />
    </div>
  </div>
  </div>
</template>
