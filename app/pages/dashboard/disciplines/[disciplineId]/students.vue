<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, filterableColumns } from '@/components/DataTable/Postgraduates/columns'
import type { Postgraduate } from '~/types/Postgraduate'
import { Button } from '@/components/ui/button'

// Route parametrelerini al
const route = useRoute()
const disciplineId = route.params.disciplineId as string

// Öğrenci verileri
const data = ref<Postgraduate[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Backend'den lisansüstü öğrenci verilerini getir
const fetchStudents = async () => {
  try {
    loading.value = true
    error.value = null

    // Discipline'e ait kullanıcıları al
    const response = await $fetch<any>(`/api/manager/disciplines/${disciplineId}/postgraduates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        limit: 1000,
        onlyData: true,
        _t: Date.now() // Cache busting
      }
    })

    let students: any[] = []
    if (Array.isArray(response)) {
      students = response
    } else if (response?.data && Array.isArray(response.data)) {
      students = response.data
    } else if (response?.rows && Array.isArray(response.rows)) {
      students = response.rows
    } else if (response?.result && Array.isArray(response.result)) {
      students = response.result
    }

    // Backend'den gelen veriyi frontend formatına dönüştür
    const formattedStudents: Postgraduate[] = students.map(userPostgraduate => {
      // UserPostgraduate modelinden Postgraduate formatına dönüştür
      const postgraduate = userPostgraduate.postgraduate
      const user = userPostgraduate.user
      
      return {
        id: postgraduate?.id || userPostgraduate.id,
        title: postgraduate?.studentFullName || '',
        type: 'DOKTORA', // Varsayılan olarak doktora
        subject: user?.department || '', // Bölüm bilgisini buraya ekle
        studentName: postgraduate?.studentFullName?.split(' ')[0] || '',
        studentSurname: postgraduate?.studentFullName?.split(' ').slice(1).join(' ') || '',
        studentEmail: user?.email || '',
        startDate: userPostgraduate.createdAt ? new Date(userPostgraduate.createdAt) : new Date(),
        endDate: postgraduate?.graduateDate ? new Date(postgraduate.graduateDate) : undefined,
        status: userPostgraduate.deletedAt ? 'TERK' : 'DEVAM_EDIYOR',
        userId: user?.id || '',
        user: user ? {
          id: user.id,
          name: user.name || '',
          surname: user.surname || '',
          fullName: `${user.name || ''} ${user.surname || ''}`.trim(),
          email: user.email || '',
          password: '',
          userType: user.userType || 'ACADEMICIAN',
          title: user.title || '',
          status: user.status || 'ACTIVE',
          iban: '',
          isSetPassword: false,
          lastNotifyAt: '',
          performanceEndDate: '',
          incentiveEndDate: '',
          rolePermissions: [],
          academicUnits: [],
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
        } : {
          id: '',
          name: '',
          surname: '',
          fullName: '',
          email: '',
          password: '',
          userType: 'ACADEMICIAN',
          title: '',
          status: 'ACTIVE',
          iban: '',
          isSetPassword: false,
          lastNotifyAt: '',
          performanceEndDate: '',
          incentiveEndDate: '',
          rolePermissions: [],
          academicUnits: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: userPostgraduate.createdAt ? new Date(userPostgraduate.createdAt) : new Date(),
        updatedAt: userPostgraduate.updatedAt ? new Date(userPostgraduate.updatedAt) : new Date(),
      }
    })
    
    data.value = formattedStudents
  } catch (err: any) {
    console.error('Öğrenci verileri getirilemedi:', err)
    
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
          error.value = 'Öğrenci bulunamadı.'
          break
        case 'AUTHx001':
          error.value = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.'
          break
        default:
          error.value = 'Öğrenci verileri yüklenirken bir hata oluştu.'
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
          error.value = 'Öğrenci verileri yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Öğrenci verileri yüklenirken bir hata oluştu.'
    }
    
    data.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStudents()
})

const refreshData = () => {
  fetchStudents()
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center p-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Öğrenci verileri yükleniyor...</p>
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
      title="Lisansüstü Öğrenci Listesi"
      description="Anabilim dalına kayıtlı lisansüstü öğrencilerin listesi"
      :data="data as unknown as Record<string, unknown>[]"
      :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
      :filterable-columns="filterableColumns"
    />
  </div>
</template>
