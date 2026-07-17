<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, filterableColumns, type DepartmentTarget } from '@/components/DataTable/DepartmentTargets/columns'
import { Button } from '@/components/ui/button'

// Route parametrelerini al
const route = useRoute()
const disciplineId = route.params.disciplineId as string

// Hedef verileri
const data = ref<DepartmentTarget[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Backend'den anabilim dalı hedeflerini getir
const fetchTargets = async () => {
  try {
    loading.value = true
    error.value = null

    // Mevcut endpoint'i kullan
    const response = await $fetch<any>(`/api/manager/disciplines/${disciplineId}/targets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        onlyData: true,
        _t: Date.now() // Cache busting
      }
    })

    // Backend'den gelen veriyi DepartmentTarget tipine dönüştür
    let targets: any[] = []
    
    if (Array.isArray(response)) {
      targets = response
    } else if (response?.data && Array.isArray(response.data)) {
      targets = response.data
    } else if (response?.rows && Array.isArray(response.rows)) {
      targets = response.rows
    } else if (response?.targets && Array.isArray(response.targets)) {
      targets = response.targets
    } else if (response?.result && Array.isArray(response.result)) {
      targets = response.result
    }
    
    // Backend'den gelen veriyi frontend formatına dönüştür
    const formattedTargets: DepartmentTarget[] = targets.map(disciplineTarget => {
      // JSON string'leri parse et
      let dataArray = []
      let itemsArray = []
      
      try {
        if (disciplineTarget.data && typeof disciplineTarget.data === 'string') {
          dataArray = JSON.parse(disciplineTarget.data)
        } else if (Array.isArray(disciplineTarget.data)) {
          dataArray = disciplineTarget.data
        }
        
        if (disciplineTarget.target?.items && typeof disciplineTarget.target.items === 'string') {
          itemsArray = JSON.parse(disciplineTarget.target.items)
        } else if (Array.isArray(disciplineTarget.target?.items)) {
          itemsArray = disciplineTarget.target.items
        }
      } catch (e) {
        console.error('JSON parse hatası:', e)
      }
      
      // İlk data ve items'ı al (varsayılan olarak)
      const firstData = dataArray[0] || {}
      const firstItem = itemsArray[0] || {}
      
      // Toplam target ve current değerlerini hesapla
      let totalTarget = 0
      let totalCurrent = 0
      
      dataArray.forEach((item: any) => {
        totalTarget += item.target || 0
        totalCurrent += item.current || 0
      })
      
      // Progress hesapla
      let progress = 0
      if (disciplineTarget.status === 'COMPLETED') {
        progress = 100
      } else if (disciplineTarget.status === 'PENDING' || disciplineTarget.status === 'IN_PROGRESS') {
        progress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0
      } else {
        progress = 0
      }
      
      return {
        id: disciplineTarget.id,
        title: `Hedef ${disciplineTarget.targetId?.slice(0, 8)}`,
        description: `Anabilim Dalı Hedefi - ${disciplineTarget.year || ''}`,
        targetValue: totalTarget,
        currentValue: totalCurrent,
        unit: 'adet',
        deadline: disciplineTarget.year ? `${disciplineTarget.year}-12-31` : '',
        status: disciplineTarget.status || 'IN_PROGRESS',
        priority: 'MEDIUM',
        departmentId: disciplineId,
        disciplineId: disciplineTarget.disciplineId || disciplineId,
        category: 'RESEARCH',
        progress: progress
      }
    })
    
    data.value = formattedTargets
  } catch (err: any) {
    console.error('Hedef verileri getirilemedi:', err)
    
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
          error.value = 'Hedef verileri yüklenirken bir hata oluştu.'
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
          error.value = 'Hedef verileri yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Hedef verileri yüklenirken bir hata oluştu.'
    }
    
    data.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTargets()
})

const refreshData = () => {
  fetchTargets()
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
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

    <!-- DataTable bileşeni -->
    <DataTable 
      v-else
      title="Anabilim Dalı Hedefleri"
      description="Anabilim dalı stratejik hedefleri ve ilerlemeler"
      :data="data as unknown as Record<string, unknown>[]"
      :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
      :filterable-columns="filterableColumns"
    />
  </div>
</template>
