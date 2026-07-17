<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, type Academician } from '@/components/DataTable/Academicians/columns'
import { Button } from '@/components/ui/button'

// Route parametrelerini al
const route = useRoute()
const disciplineId = route.params.disciplineId as string

// Current route name for sidebar
const routeName = 'admin-disciplines-disciplineId-academics'

// Akademisyen verileri
const data = ref<Academician[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const disciplineName = ref<string>('')

// Backend'den anabilim dalına ait akademisyenleri getir
const fetchAcademicians = async () => {
  try {
    loading.value = true
    error.value = null

    // Mevcut endpoint'i kullan - discipline'e göre kullanıcıları getir
    const response = await $fetch<any>('/api/manager/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Authentication header'ı (gerçek uygulamada token'dan gelecek)
        // 'Authorization': 'Bearer your-token-here'
      },
      query: {
        disciplineId: disciplineId, // Discipline ID'ye göre filtrele
        limit: 100 // Schema'ya uygun limit
      }
    })

    // Backend'den gelen veriyi Academician tipine dönüştür
    let academicians: any[] = []
    
    if (Array.isArray(response)) {
      academicians = response
    } else if (response?.data && Array.isArray(response.data)) {
      academicians = response.data
    } else if (response?.academicians && Array.isArray(response.academicians)) {
      academicians = response.academicians
    } else if (response?.result && Array.isArray(response.result)) {
      academicians = response.result
    }
    
    // Backend'den gelen veriyi frontend formatına dönüştür
    const formattedAcademicians: Academician[] = academicians.map(academician => ({
      id: academician.id,
      name: academician.name + ' ' + academician.surname,
      email: academician.email || '',
      title: academician.title || '',
      faculty: academician.userAcademicUnits?.[0]?.faculty?.name || '',
      department: academician.userAcademicUnits?.[0]?.department?.name || '',
      discipline: academician.userAcademicUnits?.[0]?.discipline?.name || '',
      facultyId: academician.userAcademicUnits?.[0]?.faculty?.id,
      departmentId: academician.userAcademicUnits?.[0]?.department?.id,
      disciplineId: academician.userAcademicUnits?.[0]?.discipline?.id,
      status: academician.status || 'ACTIVE',
      phone: academician.phone || '',
      iban: academician.iban || ''
    }))
    
    data.value = formattedAcademicians

    // Anabilim dalı adını da al
    if (academicians.length > 0 && academicians[0].userAcademicUnits?.[0]?.discipline?.name) {
      disciplineName.value = academicians[0].userAcademicUnits[0].discipline.name
    }
  } catch (err: any) {
    console.error('Akademisyen verileri getirilemedi:', err)
    
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
          error.value = 'Akademisyen verileri yüklenirken bir hata oluştu.'
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
          error.value = 'Akademisyen verileri yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Akademisyen verileri yüklenirken bir hata oluştu.'
    }
    
    data.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAcademicians()
})

const refreshData = () => {
  fetchAcademicians()
}

// Akademisyen filtreleme seçenekleri
const filterableColumns = [
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
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
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

    <!-- DataTable bileşeni -->
    <DataTable 
      v-else
      title="Akademisyenler"
      description="Anabilim dalına ait akademisyen listesi"
      :data="data as unknown as Record<string, unknown>[]"
      :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
      :filterable-columns="filterableColumns"
    />
  </div>
</template>
