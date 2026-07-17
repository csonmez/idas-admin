<script setup lang="ts">
// Import sidebar components
import DisciplineSidebar from '@/components/Admin/Discipline/Sidebar.vue'

// UI bileşenleri
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { 
  Microscope,
  LayoutTemplate,
  MapPin,
  Phone,
  MessageSquareShare 
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

// Route ve ID için gerekli importlar
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'

// Anabilim Dalı arayüzü tanımı
interface Discipline {
  id: string
  name: string
  shortName?: string
  departmentId: string
  facultyId?: string
  address: string
  phone: string
  email?: string
  website: string
  department?: {
    id: string
    name: string
  }
  faculty?: {
    id: string
    name: string
  }
  createdAt?: Date
  updatedAt?: Date
}

// Route bilgisini al
const route = useRoute()
const disciplineId = route.params.disciplineId as string

// Anabilim dalı verileri
const discipline = ref<Discipline | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Backend'den anabilim dalı detayını getir
const fetchDisciplineDetail = async () => {
  try {
    loading.value = true
    error.value = null

    // Backend API endpoint'i - manager service'den gelen veriler
    const response = await $fetch<any>(`/api/manager/disciplines/${disciplineId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Authentication header'ı (gerçek uygulamada token'dan gelecek)
        // 'Authorization': 'Bearer your-token-here'
      },
      query: {
        useDepartment: true, // Bölüm bilgilerini de getir
        useFaculty: true, // Fakülte bilgilerini de getir
        onlyData: true // Sadece data kısmını getir
      }
    })

    // Backend'den gelen veriyi Discipline tipine dönüştür
    let disciplineData: any = null
    
    if (response?.data) {
      disciplineData = response.data
    } else if (response?.discipline) {
      disciplineData = response.discipline
    } else if (response?.result) {
      disciplineData = response.result
    } else {
      disciplineData = response
    }
    
    if (disciplineData) {
      // Backend'den gelen veriyi frontend formatına dönüştür
      const formattedDiscipline: Discipline = {
        id: disciplineData.id,
        name: disciplineData.name,
        shortName: disciplineData.shortName || disciplineData.short_name || '',
        departmentId: disciplineData.departmentId || disciplineData.department_id,
        facultyId: disciplineData.facultyId || disciplineData.faculty_id,
        phone: disciplineData.phone || '',
        email: disciplineData.email || '',
        address: disciplineData.address || '',
        website: disciplineData.website || '',
        department: disciplineData.department ? {
          id: disciplineData.department.id,
          name: disciplineData.department.name
        } : undefined,
        faculty: disciplineData.faculty ? {
          id: disciplineData.faculty.id,
          name: disciplineData.faculty.name
        } : disciplineData.department?.faculty ? {
          id: disciplineData.department.faculty.id,
          name: disciplineData.department.faculty.name
        } : undefined,
        createdAt: disciplineData.createdAt ? new Date(disciplineData.createdAt) : undefined,
        updatedAt: disciplineData.updatedAt ? new Date(disciplineData.updatedAt) : undefined
      }
      
      discipline.value = formattedDiscipline
    } else {
      error.value = 'Anabilim dalı bulunamadı.'
    }
  } catch (err: any) {
    console.error('Anabilim dalı detayı getirilemedi:', err)
    
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
          error.value = 'Anabilim dalı detayı yüklenirken bir hata oluştu.'
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
          error.value = 'Anabilim dalı bulunamadı.'
          break
        case 500:
          error.value = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
          break
        default:
          error.value = 'Anabilim dalı detayı yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Anabilim dalı detayı yüklenirken bir hata oluştu.'
    }
    
    discipline.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDisciplineDetail()
})

const refreshData = () => {
  fetchDisciplineDetail()
}
</script>

<template>
  <!-- Main content area with padding -->
  <div class="flex py-6 px-5">

    <!-- Main content with equal margins on both sides and proper spacing -->
    <div class="flex-1 flex flex-col gap-6 max-w-6xl mx-auto mr-16 ml-8">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center p-8">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-muted-foreground">Anabilim dalı bilgileri yükleniyor...</p>
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

      <!-- Anabilim Dalı Bilgileri Card -->
      <div v-else-if="discipline">
        <Card class="max-w-4xl mx-auto">
          <CardHeader class="pb-0">
            <CardTitle class="text-lg font-bold text-primary">Anabilim Dalı Bilgileri</CardTitle>
          </CardHeader>
          <CardContent class="pt-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div class="flex items-center space-x-3">
                <Microscope class="w-5 h-5 text-gray-500" />
                <div>
                  <p class="text-sm text-gray-600">Anabilim Dalı</p>
                  <p class="font-semibold">{{ discipline.name }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <LayoutTemplate class="w-5 h-5 text-gray-500" />
                <div>
                  <p class="text-sm text-gray-600">Bölüm</p>
                  <p class="font-semibold">{{ discipline.department?.name ?? '-' }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <MapPin class="w-8 h-8 text-gray-500" />
                <div>
                  <p class="text-sm text-gray-600">Adres</p>
                  <p class="font-semibold">{{ discipline.address || '-' }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <Phone class="w-5 h-5 text-gray-500" />
                <div>
                  <p class="text-sm text-gray-600">Telefon</p>
                  <p class="font-semibold">{{ discipline.phone || '-' }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-3 sm:col-span-2">
                <MessageSquareShare class="w-5 h-5 text-gray-500" />
                <div>
                  <p class="text-sm text-gray-600">Web Sitesi</p>
                  <p class="font-semibold">
                    <a v-if="discipline.website" :href="discipline.website" target="_blank" class="text-blue-600 hover:underline">
                      {{ discipline.website }}
                    </a>
                    <span v-else>-</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div v-else class="text-center mt-8">
        <p class="text-lg text-gray-500">Anabilim dalı bulunamadı.</p>
      </div>
    </div>
  </div>
</template>
