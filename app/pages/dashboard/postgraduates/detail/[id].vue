<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  GraduationCap,
  User,
  Calendar,
} from 'lucide-vue-next'

// Route ve router
const route = useRoute()
const router = useRouter()
const postgraduateId = route.params.id as string

// Lisansüstü interface
interface Postgraduate {
  id: string
  title: string
  type: string // 'YUKSEK_LISANS' | 'DOKTORA' | 'BUTUNLESIK_DOKTORA'
  subject: string
  studentName: string
  studentSurname: string
  studentEmail?: string
  startDate: Date
  endDate?: Date
  status: string // 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'TERK'
  userId: string
  user: {
    id: string
    fullName: string
    email: string
    title: string
  }
  createdAt: Date
  updatedAt: Date
}

// Mock lisansüstü verileri
const postgraduates: Postgraduate[] = [
  {
    id: 'pg1',
    title: 'Yapay Zeka ile Tıbbi Görüntü Analizi',
    type: 'YUKSEK_LISANS',
    subject: 'Bilgisayar Mühendisliği',
    studentName: 'Ahmet',
    studentSurname: 'Kaya',
    studentEmail: 'ahmet.kaya@student.erciyes.edu.tr',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2025-06-30'),
    status: 'DEVAM_EDIYOR',
    userId: 'u1',
    user: {
      id: 'u1',
      fullName: 'Prof. Dr. Ahmet Yılmaz',
      email: 'ahmet.yilmaz@erciyes.edu.tr',
      title: 'Profesör'
    },
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date('2024-11-15')
  },
  {
    id: 'pg2',
    title: 'Blockchain Teknolojileri ve Güvenlik',
    type: 'DOKTORA',
    subject: 'Bilgisayar Mühendisliği',
    studentName: 'Fatma',
    studentSurname: 'Demir',
    studentEmail: 'fatma.demir@student.erciyes.edu.tr',
    startDate: new Date('2022-09-01'),
    endDate: new Date('2026-06-30'),
    status: 'DEVAM_EDIYOR',
    userId: 'u2',
    user: {
      id: 'u2',
      fullName: 'Doç. Dr. Fatma Kaya',
      email: 'fatma.kaya@erciyes.edu.tr',
      title: 'Doçent'
    },
    createdAt: new Date('2022-08-15'),
    updatedAt: new Date('2024-11-15')
  },
  {
    id: 'pg3',
    title: 'Mobil Uygulama Geliştirme ve UX',
    type: 'YUKSEK_LISANS',
    subject: 'Bilgisayar Mühendisliği',
    studentName: 'Mehmet',
    studentSurname: 'Özkan',
    studentEmail: 'mehmet.ozkan@student.erciyes.edu.tr',
    startDate: new Date('2022-09-01'),
    endDate: new Date('2024-06-30'),
    status: 'TAMAMLANDI',
    userId: 'u3',
    user: {
      id: 'u3',
      fullName: 'Dr. Öğr. Üyesi Mehmet Demir',
      email: 'mehmet.demir@erciyes.edu.tr',
      title: 'Doktor Öğretim Üyesi'
    },
    createdAt: new Date('2022-08-15'),
    updatedAt: new Date('2024-07-01')
  },
  {
    id: 'pg4',
    title: 'IoT Sistemleri ve Akıllı Şehir',
    type: 'BUTUNLESIK_DOKTORA',
    subject: 'Bilgisayar Mühendisliği',
    studentName: 'Zeynep',
    studentSurname: 'Yıldız',
    studentEmail: 'zeynep.yildiz@student.erciyes.edu.tr',
    startDate: new Date('2021-09-01'),
    endDate: new Date('2026-06-30'),
    status: 'DEVAM_EDIYOR',
    userId: 'u4',
    user: {
      id: 'u4',
      fullName: 'Prof. Dr. Ali Özkan',
      email: 'ali.ozkan@erciyes.edu.tr',
      title: 'Profesör'
    },
    createdAt: new Date('2021-08-15'),
    updatedAt: new Date('2024-11-15')
  },
  {
    id: 'pg5',
    title: 'Makine Öğrenmesi ve Veri Madenciliği',
    type: 'YUKSEK_LISANS',
    subject: 'Bilgisayar Mühendisliği',
    studentName: 'Ali',
    studentSurname: 'Şahin',
    studentEmail: 'ali.sahin@student.erciyes.edu.tr',
    startDate: new Date('2023-02-01'),
    endDate: new Date('2024-12-30'),
    status: 'TERK',
    userId: 'u5',
    user: {
      id: 'u5',
      fullName: 'Doç. Dr. Zeynep Şahin',
      email: 'zeynep.sahin@erciyes.edu.tr',
      title: 'Doçent'
    },
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-03-01')
  }
]

// Lisansüstü'yü bul
const postgraduate = computed(() => postgraduates.find(p => p.id === postgraduateId))
const pending = computed(() => false) // Mock için false
const error = computed((): Error | null => null) // Mock için null

// Durum bilgisi
const statusInfo = computed(() => {
  if (!postgraduate.value) return { text: 'Bilinmiyor', color: 'gray' }
  
  const statusMap: Record<string, { text: string; color: string }> = {
    'DEVAM_EDIYOR': { text: 'Devam Ediyor', color: 'green' },
    'TAMAMLANDI': { text: 'Tamamlandı', color: 'blue' },
    'TERK': { text: 'Terk', color: 'red' }
  }
  
  return statusMap[postgraduate.value.status] || { text: 'Bilinmiyor', color: 'gray' }
})

// Tür bilgisi
const typeInfo = computed(() => {
  if (!postgraduate.value) return { text: 'Bilinmiyor', color: 'gray' }
  
  const typeMap: Record<string, { text: string; color: string }> = {
    'YUKSEK_LISANS': { text: 'Yüksek Lisans', color: 'blue' },
    'DOKTORA': { text: 'Doktora', color: 'purple' },
    'BUTUNLESIK_DOKTORA': { text: 'Bütünleşik Doktora', color: 'indigo' }
  }
  
  return typeMap[postgraduate.value.type] || { text: 'Bilinmiyor', color: 'gray' }
})

// Tarih formatları
const formattedStartDate = computed(() => {
  if (!postgraduate.value) return ''
  return postgraduate.value.startDate.toLocaleDateString('tr-TR')
})

const formattedEndDate = computed(() => {
  if (!postgraduate.value || !postgraduate.value.endDate) return ''
  return postgraduate.value.endDate.toLocaleDateString('tr-TR')
})

const formattedCreatedDate = computed(() => {
  if (!postgraduate.value) return ''
  return postgraduate.value.createdAt.toLocaleDateString('tr-TR')
})

const formattedUpdateDate = computed(() => {
  if (!postgraduate.value) return ''
  return postgraduate.value.updatedAt.toLocaleDateString('tr-TR')
})

// Kullanıcı ismi formatla
const formatUserName = (user: Postgraduate['user']) => {
  return user.fullName || 'Bilinmiyor'
}

// Refresh fonksiyonu (mock için boş)
const refresh = () => {
  // Mock için boş
}
</script>

<template> 
  <div class="container py-4 px-3 ml-12">
    <!-- Üst Kısım: Başlık ve Geri Butonu -->
    <div class="mb-6">
      <Button variant="ghost" class="mb-2" @click="router.back()">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Geri dön
      </Button>
      <div class="flex items-center space-x-2">
        <GraduationCap class="h-6 w-6 text-blue-600" />
        <h1 class="text-2xl font-bold tracking-tight text-blue-600">Lisansüstü Detayları</h1>
      </div>
    </div>

    <!-- Yükleniyor durumu -->
    <div v-if="pending" class="flex justify-center items-center min-h-[60vh]">
      <div class="flex flex-col items-center gap-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p class="text-muted-foreground">Lisansüstü bilgileri yükleniyor...</p>
      </div>
    </div>

    <!-- Hata durumu -->
    <div v-else-if="error" class="flex justify-center items-center min-h-[60vh]">
      <Card class="max-w-md mx-auto shadow-md border-t-4 border-t-red-500">
        <CardHeader>
          <CardTitle class="text-destructive">Hata</CardTitle>
          <CardDescription>Lisansüstü bilgileri alınamadı</CardDescription>
        </CardHeader>        <CardContent class="space-y-4">
          <p class="text-sm">{{ error?.message || 'Bir hata oluştu' }}</p>
          <div class="flex justify-end">
            <Button @click="refresh">Tekrar Dene</Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Lisansüstü içeriği -->
    <div v-else-if="postgraduate" class="space-y-6">
      <!-- Lisansüstü Başlığı ve Durum Kartı -->
      <Card class="shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-primary">
        <CardContent class="pt-6">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2">
              <Badge 
                variant="outline" 
                :class="`bg-${statusInfo.color}-50 text-${statusInfo.color}-700 border-${statusInfo.color}-200`"
              >
                {{ statusInfo.text }}
              </Badge>
              <Badge 
                variant="outline" 
                :class="`bg-${typeInfo.color}-50 text-${typeInfo.color}-700 border-${typeInfo.color}-200`"
              >
                {{ typeInfo.text }}
              </Badge>
              <Badge variant="outline" class="bg-blue-50 text-blue-700 border-blue-200">
                {{ postgraduate.subject }}
              </Badge>
            </div>
            
            <div class="text-sm text-muted-foreground">
              Başlangıç: {{ formattedStartDate }}
            </div>
          </div>
          
          <h2 class="text-xl font-semibold mb-2">{{ postgraduate.title }}</h2>
          <div class="flex flex-wrap items-center text-sm text-muted-foreground gap-x-4 gap-y-2">
            <div class="flex items-center gap-1">
              <User class="h-3.5 w-3.5" />
              <span>Öğrenci: {{ postgraduate.studentName }} {{ postgraduate.studentSurname }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Calendar class="h-3.5 w-3.5" />
              <span>Başlangıç: {{ formattedStartDate }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <!-- Lisansüstü Bilgileri ve Danışman -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Lisansüstü Bilgileri -->
        <div class="lg:col-span-1">
          <Card class="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500 h-full">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Lisansüstü Bilgileri</CardTitle>
            </CardHeader>
            
            <CardContent>
              <!-- Lisansüstü Detayları -->
              <div class="space-y-4">
                <div>
                  <h3 class="text-sm font-medium mb-2">Öğrenci Bilgileri</h3>
                  <div class="space-y-1">
                    <p class="text-sm"><span class="font-medium">Ad Soyad:</span> {{ postgraduate.studentName }} {{ postgraduate.studentSurname }}</p>
                    <p v-if="postgraduate.studentEmail" class="text-sm"><span class="font-medium">E-posta:</span> {{ postgraduate.studentEmail }}</p>
                  </div>
                </div>

                <div>
                  <h3 class="text-sm font-medium mb-2">Program Bilgileri</h3>
                  <div class="space-y-1">
                    <p class="text-sm"><span class="font-medium">Tür:</span> {{ typeInfo.text }}</p>
                    <p class="text-sm"><span class="font-medium">Alan:</span> {{ postgraduate.subject }}</p>
                  </div>
                </div>

                <div>
                  <h3 class="text-sm font-medium mb-2">Durum Bilgisi</h3>
                  <div class="flex items-center space-x-2" :class="`text-${statusInfo.color}-600`">
                    <span class="size-2 rounded-full" :class="`bg-${statusInfo.color}-600`" />
                    <span>{{ statusInfo.text }}</span>
                  </div>
                </div>

                <div>
                  <h3 class="text-sm font-medium mb-2">Tarih Bilgileri</h3>
                  <div class="space-y-2">
                    <div class="flex items-center space-x-2">
                      <span class="text-sm text-muted-foreground">Başlangıç Tarihi:</span>
                      <span>{{ formattedStartDate }}</span>
                    </div>
                    <div v-if="postgraduate.endDate" class="flex items-center space-x-2">
                      <span class="text-sm text-muted-foreground">Bitiş Tarihi:</span>
                      <span>{{ formattedEndDate }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="text-sm text-muted-foreground">Kayıt Tarihi:</span>
                      <span>{{ formattedCreatedDate }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="text-sm text-muted-foreground">Son Güncelleme:</span>
                      <span>{{ formattedUpdateDate }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <!-- Danışman Bilgileri -->
        <div class="lg:col-span-1">
          <Card class="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500 h-full">
            <CardHeader class="pb-2">
              <CardTitle class="flex items-center gap-2">
                <User class="h-4 w-4" />
                <span>Danışman</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div class="bg-muted/50 p-3 rounded-md">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-medium">{{ formatUserName(postgraduate.user) }}</p>
                    <p v-if="postgraduate.user.email" class="text-sm text-primary mt-1">{{ postgraduate.user.email }}</p>
                    <Badge 
                      v-if="postgraduate.user.title" 
                      variant="outline" 
                      class="mt-2 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {{ postgraduate.user.title }}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Kayıt bulunamadı durumu -->
    <Card v-else class="max-w-md mx-auto shadow-md border-t-4 border-t-red-500">
      <CardHeader>
        <CardTitle>Lisansüstü bulunamadı</CardTitle>
        <CardDescription>Aradığınız lisansüstü bulunamadı veya erişim izniniz yok.</CardDescription>
      </CardHeader>
      <CardContent class="flex justify-end">
        <Button @click="router.back()">Geri Dön</Button>
      </CardContent>
    </Card>
  </div>
</template>
