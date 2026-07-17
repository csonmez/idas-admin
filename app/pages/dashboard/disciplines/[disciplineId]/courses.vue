<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, filterableColumns, type Course } from '@/components/DataTable/Courses/columns'
import { Button } from '@/components/ui/button'

// Route parametrelerini al
const route = useRoute()
const disciplineId = route.params.disciplineId as string

// Ders verileri
const data = ref<Course[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Backend'den anabilim dalına ait dersleri getir
const fetchCourses = async () => {
  try {
    loading.value = true
    error.value = null

    // Backend API endpoint'i - manager service'den gelen veriler
    const response = await $fetch<any>(`/api/manager/disciplines/${disciplineId}/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Authentication header'ı (gerçek uygulamada token'dan gelecek)
        // 'Authorization': 'Bearer your-token-here'
      },
      query: {
        isAll: true, // Tüm dersleri getir
        useInstructors: true, // Eğitmen bilgilerini de getir
        onlyData: true // Sadece data kısmını getir
      }
    })

    // Backend'den gelen veriyi Course tipine dönüştür
    let courses: any[] = []
    
    if (Array.isArray(response)) {
      courses = response
    } else if (response?.data && Array.isArray(response.data)) {
      courses = response.data
    } else if (response?.courses && Array.isArray(response.courses)) {
      courses = response.courses
    } else if (response?.result && Array.isArray(response.result)) {
      courses = response.result
    }
    
    // Backend'den gelen veriyi frontend formatına dönüştür
    const formattedCourses: Course[] = courses.map(course => ({
      id: course.id,
      code: course.code || '',
      name: course.name || '',
      credits: course.credits || course.credit || 0,
      ects: course.ects || course.ectsCredit || 0,
      semester: course.semester || course.term || '',
      year: course.year || course.academicYear || 1,
      disciplineId: course.disciplineId || course.discipline_id,
      instructor: course.instructor || course.instructors?.[0]?.name || '',
      instructors: course.instructors?.map((inst: any) => inst.name || inst.fullName || '') || [],
      status: course.deletedAt ? 'PASSIVE' : 'ACTIVE'
    }))
    
    data.value = formattedCourses
  } catch (err: any) {
    console.error('Ders verileri getirilemedi:', err)
    
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
          error.value = 'Ders bulunamadı.'
          break
        case 'AUTHx001':
          error.value = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.'
          break
        default:
          error.value = 'Ders verileri yüklenirken bir hata oluştu.'
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
          error.value = 'Ders verileri yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Ders verileri yüklenirken bir hata oluştu.'
    }
    
    data.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCourses()
})

const refreshData = () => {
  fetchCourses()
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center p-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Ders verileri yükleniyor...</p>
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
      title="Dersler"
      description="Anabilim dalı tarafından verilen dersler"
      :data="data as unknown as Record<string, unknown>[]"
      :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
      :filterable-columns="filterableColumns"
    />
  </div>
</template>
