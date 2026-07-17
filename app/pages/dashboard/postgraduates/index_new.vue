<template>
  <!-- Main content with padding -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <!-- DataTable bileşeni -->
    <DataTable 
      title="Lisansüstü Öğrenciler"
      description="Erciyes Üniversitesi lisansüstü öğrencilerinin listesi ve detayları"
      :data="filteredPostgraduates as unknown as Record<string, unknown>[]"
      :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
      :filterable-columns="filterableColumns"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, filterableColumns } from '@/components/DataTable/Postgraduates/columns'
import type { Postgraduate } from '~/types/Postgraduate'

// Örnek lisansüstü verileri
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
      name: 'Ahmet',
      surname: 'Yılmaz',
      fullName: 'Prof. Dr. Ahmet Yılmaz',
      email: 'ahmet.yilmaz@erciyes.edu.tr',
      password: '',
      userType: 'ACADEMICIAN',
      title: 'PROF',
      status: 'ACTIVE',
      iban: '',
      isSetPassword: true,
      lastNotifyAt: '',
      performanceEndDate: '',
      incentiveEndDate: '',
      rolePermissions: [],
      academicUnits: [],
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2024-11-15')
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
      name: 'Fatma',
      surname: 'Kaya',
      fullName: 'Doç. Dr. Fatma Kaya',
      email: 'fatma.kaya@erciyes.edu.tr',
      password: '',
      userType: 'ACADEMICIAN',
      title: 'ASSOC_PROF',
      status: 'ACTIVE',
      iban: '',
      isSetPassword: true,
      lastNotifyAt: '',
      performanceEndDate: '',
      incentiveEndDate: '',
      rolePermissions: [],
      academicUnits: [],
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2024-11-15')
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
      name: 'Mehmet',
      surname: 'Demir',
      fullName: 'Dr. Öğr. Üyesi Mehmet Demir',
      email: 'mehmet.demir@erciyes.edu.tr',
      password: '',
      userType: 'ACADEMICIAN',
      title: 'ASSIST_PROF',
      status: 'ACTIVE',
      iban: '',
      isSetPassword: true,
      lastNotifyAt: '',
      performanceEndDate: '',
      incentiveEndDate: '',
      rolePermissions: [],
      academicUnits: [],
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2024-11-15')
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
      name: 'Ali',
      surname: 'Özkan',
      fullName: 'Prof. Dr. Ali Özkan',
      email: 'ali.ozkan@erciyes.edu.tr',
      password: '',
      userType: 'ACADEMICIAN',
      title: 'PROF',
      status: 'ACTIVE',
      iban: '',
      isSetPassword: true,
      lastNotifyAt: '',
      performanceEndDate: '',
      incentiveEndDate: '',
      rolePermissions: [],
      academicUnits: [],
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2024-11-15')
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
      name: 'Zeynep',
      surname: 'Şahin',
      fullName: 'Doç. Dr. Zeynep Şahin',
      email: 'zeynep.sahin@erciyes.edu.tr',
      password: '',
      userType: 'ACADEMICIAN',
      title: 'ASSOC_PROF',
      status: 'ACTIVE',
      iban: '',
      isSetPassword: true,
      lastNotifyAt: '',
      performanceEndDate: '',
      incentiveEndDate: '',
      rolePermissions: [],
      academicUnits: [],
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2024-11-15')
    },
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-03-01')
  }
]

// Route parametrelerini al
const route = useRoute()

// Filtreleme fonksiyonu
const filteredPostgraduates = computed(() => {
  let filtered = postgraduates

  // URL parametrelerine göre filtreleme
  const statusFilter = route.query.status as string
  const typeFilter = route.query.type as string
  const subjectFilter = route.query.subject as string

  if (statusFilter) {
    filtered = filtered.filter(pg => pg.status === statusFilter)
  }
  
  if (typeFilter) {
    filtered = filtered.filter(pg => pg.type === typeFilter)
  }

  if (subjectFilter) {
    filtered = filtered.filter(pg => pg.subject === subjectFilter)
  }

  return filtered
})
</script>
