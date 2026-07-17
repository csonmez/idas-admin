<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Pen, 
  School2,
  Phone,
  Mail,
  MessageSquareShare,
  LayoutTemplate,
  Award,
  BrainCircuit,
  Users,
  Microscope,
  GraduationCap,
  Target,
  MapPin 
} from 'lucide-vue-next'

// Route parametrelerini al
const route = useRoute()
const departmentId = route.params.departmentId as string

// Department interface
interface Department {
  id: string
  name: string
  facultyId: string
  faculty: {
    id: string
    name: string
  }
  phone: string
  website: string
  email: string
  head: string
  academicianCount: number
  disciplineCount: number
  studentCount: number
  projectCount: number
  targetCount: number
  prizeCount: number
  establishmentYear: number
  address?: string
  description?: string
  status?: 'active' | 'passive'
}

// Bölüm verileri
const department = ref<Department | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Backend'den bölüm detay verilerini getir
const fetchDepartmentDetail = async (id: string) => {
  try {
    loading.value = true
    error.value = null

    // Bölüm detayını çek
    const departmentResponse = await $fetch<any>(`/api/manager/departments/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      query: {
        useFaculty: true,
        useHead: true,
        attributes: 'id name facultyId phone email address website head establishmentYear description status createdAt updatedAt'
      }
    })

    // Diğer verileri ayrı ayrı çek (hata durumunda 0 döndür)
    let academiciansResponse = []
    let disciplinesResponse = []
    let studentsResponse = []
    let targetsResponse = []
    let projectsResponse = []
    let prizesResponse = []

    try {
      academiciansResponse = await $fetch<any>('/api/manager/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        query: { page: 1, limit: 100, departmentId: id, useUserAcademicUnits: 'true' }
      })
    } catch (error) {
      console.warn('Akademisyenler getirilemedi:', error)
    }

    try {
      disciplinesResponse = await $fetch<any>('/api/manager/disciplines', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        query: { page: 1, limit: 100, departmentId: id, useFaculty: true, useDepartment: true }
      })
    } catch (error) {
      console.warn('Anabilim dalları getirilemedi:', error)
    }

    try {
      studentsResponse = await $fetch<any>('/api/manager/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        query: { page: 1, limit: 100, departmentId: id, useUserAcademicUnits: 'true' }
      })
    } catch (error) {
      console.warn('Öğrenciler getirilemedi:', error)
    }

    try {
      targetsResponse = await $fetch<any>(`/api/manager/departments/${id}/targets`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        query: { page: 1, limit: 100 }
      })
    } catch (error) {
      console.warn('Hedefler getirilemedi:', error)
    }

    try {
      projectsResponse = await $fetch<any>('/api/manager/projects', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        query: { page: 1, limit: 100, departmentId: id }
      })
    } catch (error) {
      console.warn('Projeler getirilemedi:', error)
    }

    try {
      prizesResponse = await $fetch<any>('/api/manager/prizes', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        query: { page: 1, limit: 100, departmentId: id }
      })
    } catch (error) {
      console.warn('Ödüller getirilemedi:', error)
    }

    // Backend'den gelen veriyi Department tipine dönüştür
    const backendDepartment = departmentResponse
    
    // Akademisyen sayısını hesapla
    let academicians: any[] = []
    if (Array.isArray(academiciansResponse)) {
      academicians = academiciansResponse
    } else if (academiciansResponse?.data && Array.isArray(academiciansResponse.data)) {
      academicians = academiciansResponse.data
    } else if (academiciansResponse?.users && Array.isArray(academiciansResponse.users)) {
      academicians = academiciansResponse.users
    } else if (academiciansResponse?.result && Array.isArray(academiciansResponse.result)) {
      academicians = academiciansResponse.result
    }

    // Anabilim dalı sayısını hesapla
    let disciplines: any[] = []
    if (Array.isArray(disciplinesResponse)) {
      disciplines = disciplinesResponse
    } else if (disciplinesResponse?.data && Array.isArray(disciplinesResponse.data)) {
      disciplines = disciplinesResponse.data
    } else if (disciplinesResponse?.rows && Array.isArray(disciplinesResponse.rows)) {
      disciplines = disciplinesResponse.rows
    } else if (disciplinesResponse?.disciplines && Array.isArray(disciplinesResponse.disciplines)) {
      disciplines = disciplinesResponse.disciplines
    } else if (disciplinesResponse?.result && Array.isArray(disciplinesResponse.result)) {
      disciplines = disciplinesResponse.result
    }

    // Öğrenci sayısını hesapla (sadece öğrenci tipindeki kullanıcılar)
    let students: any[] = []
    if (Array.isArray(studentsResponse)) {
      students = studentsResponse
    } else if (studentsResponse?.data && Array.isArray(studentsResponse.data)) {
      students = studentsResponse.data
    } else if (studentsResponse?.users && Array.isArray(studentsResponse.users)) {
      students = studentsResponse.users
    } else if (studentsResponse?.result && Array.isArray(studentsResponse.result)) {
      students = studentsResponse.result
    }

    // Hedef sayısını hesapla
    let targets: any[] = []
    if (Array.isArray(targetsResponse)) {
      targets = targetsResponse
    } else if (targetsResponse?.data && Array.isArray(targetsResponse.data)) {
      targets = targetsResponse.data
    } else if (targetsResponse?.targets && Array.isArray(targetsResponse.targets)) {
      targets = targetsResponse.targets
    } else if (targetsResponse?.result && Array.isArray(targetsResponse.result)) {
      targets = targetsResponse.result
    }

    // Proje sayısını hesapla
    let projects: any[] = []
    if (Array.isArray(projectsResponse)) {
      projects = projectsResponse
    } else if (projectsResponse?.data && Array.isArray(projectsResponse.data)) {
      projects = projectsResponse.data
    } else if (projectsResponse?.projects && Array.isArray(projectsResponse.projects)) {
      projects = projectsResponse.projects
    } else if (projectsResponse?.result && Array.isArray(projectsResponse.result)) {
      projects = projectsResponse.result
    }

    // Ödül sayısını hesapla
    let prizes: any[] = []
    if (Array.isArray(prizesResponse)) {
      prizes = prizesResponse
    } else if (prizesResponse?.data && Array.isArray(prizesResponse.data)) {
      prizes = prizesResponse.data
    } else if (prizesResponse?.prizes && Array.isArray(prizesResponse.prizes)) {
      prizes = prizesResponse.prizes
    } else if (prizesResponse?.result && Array.isArray(prizesResponse.result)) {
      prizes = prizesResponse.result
    }
    
    const formattedDepartment: Department = {
      id: backendDepartment.id,
      name: backendDepartment.name,
      facultyId: backendDepartment.facultyId || '',
      faculty: {
        id: backendDepartment.faculty?.id || backendDepartment.facultyId || '',
        name: backendDepartment.faculty?.name || 'Bilinmeyen Fakülte'
      },
      head: backendDepartment.head || backendDepartment.headName || 'Belirtilmemiş',
      academicianCount: academicians.length,
      disciplineCount: disciplines.length,
      studentCount: students.length,
      projectCount: projects.length,
      targetCount: targets.length,
      prizeCount: prizes.length,
      establishmentYear: backendDepartment.establishmentYear || backendDepartment.foundedYear || (backendDepartment.createdAt ? new Date(backendDepartment.createdAt).getFullYear() : 1970),
      phone: backendDepartment.phone || '',
      email: backendDepartment.email || '',
      website: backendDepartment.website || backendDepartment.webSite || '',
      address: backendDepartment.address || '',
      description: backendDepartment.description || '',
      status: backendDepartment.deletedAt ? 'passive' : 'active'
    }
    
    department.value = formattedDepartment
    
  } catch (err: any) {
    console.error('Bölüm detay verileri getirilemedi:', err)
    
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
          error.value = 'Bölüm detay verileri yüklenirken bir hata oluştu.'
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
          error.value = 'Bölüm bulunamadı.'
          break
        case 500:
          error.value = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
          break
        default:
          error.value = 'Bölüm detay verileri yüklenirken bir hata oluştu.'
      }
    } else {
      error.value = 'Bölüm detay verileri yüklenirken bir hata oluştu.'
    }
    
    department.value = null
  } finally {
    loading.value = false
  }
}

// Sayfa yüklendiğinde verileri getir
onMounted(() => {
  fetchDepartmentDetail(departmentId)
})

// Refresh fonksiyonu
const refreshData = () => {
  fetchDepartmentDetail(departmentId)
}

</script>

<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center p-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Bölüm bilgileri yükleniyor...</p>
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
    <div v-else-if="department" class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">{{ department.name }}</h1>
      <p class="text-muted-foreground">{{ department.faculty.name }} - Bölüm genel bilgileri ve yönetim</p>
    </div>
    
  
    <!-- Card 1: Bölüm Bilgileri -->
    <Card class="rounded-xl">
      <CardHeader class="flex flex-row items-center justify-between pb-4">
        <div class="flex flex-col">
          <CardTitle>{{ department.name }}</CardTitle>
          <CardDescription class="text-sm text-gray-600 mt-1">
            {{ department.faculty.name }}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" class="gap-2">
          <Pen class="w-4 h-4" />
          Düzenle
        </Button>
      </CardHeader>
      <CardContent>
        <div class="space-y-6">
          <!-- İlk Satır: Bölüm, Fakülte, Telefon -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="flex items-center space-x-3">
              <LayoutTemplate class="w-5 h-5 text-gray-500" />
              <div>
                <p class="text-sm text-gray-600">Bölüm</p>
                <p class="font-semibold">{{ department.name }}</p>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <School2 class="w-5 h-5 text-gray-500" />
              <div>
                <p class="text-sm text-gray-600">Fakülte</p>
                <p class="font-semibold">{{ department.faculty.name }}</p>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <Phone class="w-5 h-5 text-gray-500" />
              <div>
                <p class="text-sm text-gray-600">Telefon</p>
                <p class="font-semibold">{{ department.phone }}</p>
              </div>
            </div>
          </div>
          
          <!-- İkinci Satır: E-posta, Web Sitesi, Bölüm Başkanı -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="flex items-center space-x-3">
              <Mail class="w-5 h-5 text-gray-500" />
              <div>
                <p class="text-sm text-gray-600">E-posta</p>
                <p class="font-semibold">{{ department.email }}</p>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <MessageSquareShare class="w-5 h-5 text-gray-500" />
              <div>
                <p class="text-sm text-gray-600">Web Sitesi</p>
                <a 
                  :href="department.website" 
                  target="_blank"
                  class="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {{ department.website }}
                </a>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <Users class="w-5 h-5 text-gray-500" />
              <div>
                <p class="text-sm text-gray-600">Bölüm Başkanı</p>
                <p class="font-semibold">{{ department.head }}</p>
              </div>
            </div>
          </div>

          <!-- Üçüncü Satır: Adres -->
          <div class="grid grid-cols-1 gap-6">
            <div class="flex items-start space-x-3">
              <MapPin class="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <p class="text-sm text-gray-600">Adres</p>
                <p class="font-semibold">
                  Erciyes Üniversitesi<br>
                  {{ department.faculty.name }}<br>
                  {{ department.name }}<br>
                  38280 Talas/Kayseri
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Card 2: İstatistikler ve Sayılar -->
    <Card class="rounded-xl">
      <CardHeader>
        <CardTitle>Bölüm İstatistikleri</CardTitle>
        <CardDescription>Bölüme ait güncel sayısal veriler</CardDescription>
      </CardHeader>
      <CardContent>
        <!-- İstatistik Layout - Responsive Tasarım -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Öğrenci Sayısı -->
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition duration-300 cursor-pointer">
            <div class="flex items-center mb-3">
              <div class="p-2 rounded-full">
                <GraduationCap class="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <h3 class="text-gray-500 text-sm font-medium">Toplam Öğrenci</h3>
            <div class="flex items-baseline mt-1">
              <h2 class="text-xl font-bold">{{ department.studentCount }}</h2>
            </div>
          </div>

          <!-- Anabilim Dalı Sayısı -->
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition duration-300 cursor-pointer">
            <div class="flex items-center mb-3">
              <div class="p-2 rounded-full">
                <Microscope class="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <h3 class="text-gray-500 text-sm font-medium">Anabilim Dalı</h3>
            <div class="flex items-baseline mt-1">
              <h2 class="text-xl font-bold">{{ department.disciplineCount }}</h2>
            </div>
          </div>

          <!-- Akademisyen Sayısı -->
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition duration-300 cursor-pointer">
            <div class="flex items-center mb-3">
              <div class="p-2 rounded-full">
                <Users class="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <h3 class="text-gray-500 text-sm font-medium">Akademisyen</h3>
            <div class="flex items-baseline mt-1">
              <h2 class="text-xl font-bold">{{ department.academicianCount }}</h2>
            </div>
          </div>

          <!-- Aktif Proje Sayısı -->
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition duration-300 cursor-pointer">
            <div class="flex items-center mb-3">
              <div class="p-2 rounded-full">
                <BrainCircuit class="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <h3 class="text-gray-500 text-sm font-medium">Aktif Proje</h3>
            <div class="flex items-baseline mt-1">
              <h2 class="text-xl font-bold">{{ department.projectCount }}</h2>
            </div>
          </div>

          <!-- Aktif Hedefler -->
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition duration-300 cursor-pointer">
            <div class="flex items-center mb-3">
              <div class="p-2 rounded-full">
                <Target class="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <h3 class="text-gray-500 text-sm font-medium">Aktif Hedef</h3>
            <div class="flex items-baseline mt-1">
              <h2 class="text-xl font-bold">{{ department.targetCount }}</h2>
            </div>
          </div>

          <!-- Ödül Sayısı -->
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition duration-300 cursor-pointer">
            <div class="flex items-center mb-3">
              <div class="p-2 rounded-full">
                <Award class="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <h3 class="text-gray-500 text-sm font-medium">Ödül Sayısı</h3>
            <div class="flex items-baseline mt-1">
              <h2 class="text-xl font-bold">{{ department.prizeCount }}</h2>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
  </div>
</template>
