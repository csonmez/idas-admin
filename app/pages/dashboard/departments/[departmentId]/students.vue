<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, filterableColumns } from '@/components/DataTable/Postgraduates/columns'
import type { Postgraduate } from '~/types/Postgraduate'
import { Button } from '@/components/ui/button'

// Route parametrelerini al
const route = useRoute()
const departmentId = route.params.departmentId as string

// Lisansüstü öğrenci verileri
const postgraduates = ref<Postgraduate[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const departmentName = ref<string>('')

// Backend'den bölüm lisansüstü öğrencilerini getir
const fetchDepartmentPostgraduates = async (departmentId: string) => {
  try {
    loading.value = true
    error.value = null

    // Backend API endpoint'i - manager service'den gelen veriler
    const response = await $fetch<any>(`/api/manager/departments/${departmentId}/postgraduates`, {
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

    // Backend'den gelen veriyi User tipine dönüştür
    let students: any[] = []
    
    if (Array.isArray(response)) {
      students = response
    } else if (response?.data && Array.isArray(response.data)) {
      students = response.data
    } else if (response?.rows && Array.isArray(response.rows)) {
      students = response.rows
    } else if (response?.users && Array.isArray(response.users)) {
      students = response.users
    } else if (response?.result && Array.isArray(response.result)) {
      students = response.result
    }
    
    // UserPostgraduate verilerini Postgraduate tipine dönüştür
    const formattedPostgraduates: Postgraduate[] = students.map(userPostgraduate => {
      // UserPostgraduate modelinden Postgraduate formatına dönüştür
      const postgraduate = userPostgraduate.postgraduate
      const user = userPostgraduate.user
      
      return {
        id: postgraduate?.id || userPostgraduate.id,
        title: postgraduate?.studentFullName || '',
        type: 'DOKTORA', // Varsayılan olarak doktora
        subject: user?.userAcademicUnits?.[0]?.department?.name || '',
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
          academicUnits: user.userAcademicUnits || [],
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
    
    postgraduates.value = formattedPostgraduates
    
    // Bölüm adını al
    if (formattedPostgraduates.length > 0) {
      departmentName.value = formattedPostgraduates[0].subject
    } else {
      // Eğer öğrenci yoksa bölüm adını API'den al
      try {
        const departmentResponse = await $fetch<any>(`/api/manager/departments/${departmentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        departmentName.value = departmentResponse?.name || 'Bilinmeyen Bölüm'
      } catch (err) {
        departmentName.value = 'Bilinmeyen Bölüm'
      }
    }
    
  } catch (err: any) {
    console.error('Bölüm lisansüstü öğrencileri getirilemedi:', err)
    
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
          error.value = 'Lisansüstü öğrenci bulunamadı.'
          break
        case 'AUTHx001':
          error.value = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.'
          break
        default:
          error.value = 'Bölüm lisansüstü öğrencileri yüklenirken bir hata oluştu.'
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
          error.value = 'Bölüm lisansüstü öğrencileri yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Bölüm lisansüstü öğrencileri yüklenirken bir hata oluştu.'
    }
    
    postgraduates.value = []
  } finally {
    loading.value = false
  }
}

// İstatistikler
const stats = computed(() => {
  const students = postgraduates.value
  const typeGroups = {
    yuksekLisans: students.filter(s => s.type === 'YUKSEK_LISANS').length,
    doktora: students.filter(s => s.type === 'DOKTORA').length,
    butunlesikDoktora: students.filter(s => s.type === 'BUTUNLESIK_DOKTORA').length
  }
  
  const statusGroups = {
    devamEdiyor: students.filter(s => s.status === 'DEVAM_EDIYOR').length,
    tamamlandi: students.filter(s => s.status === 'TAMAMLANDI').length,
    terk: students.filter(s => s.status === 'TERK').length
  }
  
  return {
    total: students.length,
    typeGroups,
    statusGroups
  }
})

// Sayfa yüklendiğinde verileri getir
onMounted(() => {
  fetchDepartmentPostgraduates(departmentId)
})

// Refresh fonksiyonu
const refreshData = () => {
  fetchDepartmentPostgraduates(departmentId)
}

</script>

<template>
  <div class="space-y-6">
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

    <!-- Content -->
    <div v-else class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Lisansüstü Öğrenciler</h1>
      <p class="text-muted-foreground">{{ departmentName }} bölümünde kayıtlı lisansüstü öğrencileri görüntüleyin ve yönetin</p>
    </div>
    
    <!-- Stats Grid -->
    <div class="max-w-4xl grid gap-6 sm:gap-8 md:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Toplam Öğrenci</h3>
        <p class="text-2xl font-bold text-blue-600">{{ stats.total }}</p>
        <p class="text-sm text-muted-foreground">Lisansüstü öğrenci sayısı</p>
      </div>
      
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Yüksek Lisans</h3>
        <p class="text-2xl font-bold text-purple-600">{{ stats.typeGroups.yuksekLisans }}</p>
        <p class="text-sm text-muted-foreground">YL öğrenci sayısı</p>
      </div>
      
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Doktora</h3>
        <p class="text-2xl font-bold text-orange-600">{{ stats.typeGroups.doktora }}</p>
        <p class="text-sm text-muted-foreground">PhD öğrenci sayısı</p>
      </div>
      
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Devam Eden</h3>
        <p class="text-2xl font-bold text-green-600">{{ stats.statusGroups.devamEdiyor }}</p>
        <p class="text-sm text-muted-foreground">Aktif öğrenci sayısı</p>
      </div>
    </div>
    
    <!-- DataTable -->
    <div class="max-w-4xl rounded-lg border p-6">
      <DataTable 
        :title="`${departmentName} Lisansüstü Öğrencileri`"
        :description="`${departmentName} bölümünde kayıtlı lisansüstü öğrencilerinin listesi`"
        :data="postgraduates as unknown as Record<string, unknown>[]"
        :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
        :filterable-columns="filterableColumns"
      />
    </div>
    
    <!-- Empty State -->
    <div v-if="postgraduates.length === 0" class="rounded-lg border p-8">
      <div class="text-center">
        <h3 class="text-lg font-semibold">Henüz Lisansüstü Öğrenci Yok</h3>
        <p class="text-muted-foreground mt-2">Bu bölümde henüz kayıtlı lisansüstü öğrenci bulunmuyor</p>
      </div>
    </div>
  </div>
  </div>
</template>
