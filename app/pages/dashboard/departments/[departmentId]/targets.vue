<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, type DepartmentTarget } from '@/components/DataTable/DepartmentTargets/columns'
import { Button } from '@/components/ui/button'

// Route parametrelerini al
const route = useRoute()
const departmentId = route.params.departmentId as string

// Bölüm hedef verileri
const targets = ref<DepartmentTarget[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const departmentName = ref<string>('')

// Target tipini Türkçe'ye çevir
const getTargetTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'dept_article': 'Bölüm Makale Hedefi',
    'dept_project': 'Bölüm Proje Hedefi',
    'dept_patent': 'Bölüm Patent Hedefi',
    'dept_prize': 'Bölüm Ödül Hedefi',
    'dept_postgraduate': 'Bölüm Doktora Hedefi',
    'dept_collaboration': 'Bölüm İş Birliği Hedefi'
  }
  return typeMap[type] || type
}

// Backend'den bölüm hedeflerini getir
const fetchDepartmentTargets = async (departmentId: string) => {
  try {
    loading.value = true
    error.value = null

    // Backend API endpoint'i - manager service'den gelen veriler
    const response = await $fetch<any>(`/api/manager/departments/${departmentId}/targets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        page: 1,
        limit: 100
      }
    })

    // Backend'den gelen veriyi DepartmentTarget tipine dönüştür
    let backendTargets: any[] = []
    
    if (Array.isArray(response)) {
      backendTargets = response
    } else if (response?.data && Array.isArray(response.data)) {
      backendTargets = response.data
    } else if (response?.targets && Array.isArray(response.targets)) {
      backendTargets = response.targets
    } else if (response?.result && Array.isArray(response.result)) {
      backendTargets = response.result
    }
    
    // Backend'den gelen veriyi frontend formatına dönüştür
    const formattedTargets: DepartmentTarget[] = backendTargets.map((target) => {
      // Data JSON'ını parse et
      let targetValue = 0
      let currentValue = 0
      let title = ''
      let description = ''
      let category: 'RESEARCH' | 'EDUCATION' | 'INFRASTRUCTURE' | 'COLLABORATION' = 'RESEARCH'
      
      if (target.data) {
        try {
          const dataArray = JSON.parse(target.data)
          if (Array.isArray(dataArray)) {
            // İlk item'ın target ve current değerlerini al
            const firstItem = dataArray[0]
            if (firstItem) {
              targetValue = firstItem.target || 0
              currentValue = firstItem.current || 0
              const typeName = getTargetTypeName(firstItem.type)
              title = `${typeName} - ${target.year || ''}`
              description = `${typeName} hedefi - ${target.year || ''} yılı`
              
              // Kategori belirle
              if (firstItem.type?.includes('article')) {
                category = 'RESEARCH'
              } else if (firstItem.type?.includes('project')) {
                category = 'RESEARCH'
              } else if (firstItem.type?.includes('collaboration')) {
                category = 'COLLABORATION'
              }
            }
          }
        } catch (e) {
          console.error('Data JSON parse hatası:', e)
        }
      }
      
      return {
        id: target.id,
        title: title || `Hedef ${target.targetId?.slice(0, 8)}`,
        description: description || `Hedef - ${target.year || ''}`,
        targetValue: targetValue,
        currentValue: currentValue,
        unit: 'adet',
        deadline: new Date().toISOString(),
        status: target.status || 'PENDING',
        priority: 'MEDIUM',
        departmentId: target.departmentId || departmentId,
        category: category,
        progress: targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0
      }
    })
    
    targets.value = formattedTargets
    
    // Bölüm adını al - department bilgisi artık yok, sadece departmentId var
    departmentName.value = 'Bölüm Hedefleri'
    
  } catch (err: any) {
    console.error('Bölüm hedefleri getirilemedi:', err)
    
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
          error.value = 'Hedef bulunamadı.'
          break
        case 'AUTHx001':
          error.value = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.'
          break
        default:
          error.value = 'Bölüm hedefleri yüklenirken bir hata oluştu.'
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
          error.value = 'Bölüm hedefleri yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Bölüm hedefleri yüklenirken bir hata oluştu.'
    }
    
    targets.value = []
  } finally {
    loading.value = false
  }
}

// İstatistikler
const stats = computed(() => {
  const targetsList = targets.value
  const activeTargets = targetsList.filter(t => t.status === 'IN_PROGRESS')
  const completedTargets = targetsList.filter(t => t.currentValue >= t.targetValue)
  
  return {
    total: targetsList.length,
    active: activeTargets.length,
    completed: completedTargets.length
  }
})

// Hedef filtreleme seçenekleri
const filterableColumns = [
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
  fetchDepartmentTargets(departmentId)
})

// Refresh fonksiyonu
const refreshData = () => {
  fetchDepartmentTargets(departmentId)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center p-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Hedef verileri yükleniyor...</p>
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
      <h1 class="text-3xl font-bold tracking-tight">Hedefler</h1>
      <p class="text-muted-foreground">{{ departmentName }} bölümünün hedeflerini görüntüleyin ve takip edin</p>
    </div>
    
    <!-- Stats Grid -->
    <div class="max-w-4xl grid gap-6 sm:gap-8 md:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Toplam Hedef</h3>
        <p class="text-2xl font-bold text-blue-600">{{ stats.total }}</p>
        <p class="text-sm text-muted-foreground">Aktif hedef sayısı</p>
      </div>
      
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Aktif</h3>
        <p class="text-2xl font-bold text-green-600">{{ stats.active }}</p>
        <p class="text-sm text-muted-foreground">Aktif hedef sayısı</p>
      </div>
      
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Tamamlanan</h3>
        <p class="text-2xl font-bold text-purple-600">{{ stats.completed }}</p>
        <p class="text-sm text-muted-foreground">Başarıyla tamamlanan</p>
      </div>
      
      <div class="rounded-lg border bg-white p-6 flex flex-col shadow-sm h-32">
        <h3 class="text-lg font-semibold mb-2">Devam Eden</h3>
        <p class="text-2xl font-bold text-orange-600">{{ stats.total - stats.completed }}</p>
        <p class="text-sm text-muted-foreground">Aktif olarak çalışılan</p>
      </div>
    </div>
    
    <!-- DataTable -->
    <div class="max-w-4xl rounded-lg border p-6">
      <DataTable 
        :title="`${departmentName} Hedefleri`"
        :description="`${departmentName} bölümünün hedeflerinin listesi ve ilerleme durumu`"
        :data="targets as unknown as Record<string, unknown>[]"
        :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
        :filterable-columns="filterableColumns"
      />
    </div>
    
    <!-- Empty State -->
    <div v-if="targets.length === 0" class="rounded-lg border p-8">
      <div class="text-center">
        <h3 class="text-lg font-semibold">Henüz Hedef Belirlenmemiş</h3>
        <p class="text-muted-foreground mt-2">Bu bölüm için henüz hedef tanımlanmamış</p>
      </div>
    </div>
  </div>
  </div>
</template>
