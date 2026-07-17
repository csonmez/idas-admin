<template>
  <!-- Main content with padding -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <!-- DataTable bileşeni -->
    <DataTable 
      title="Anabilim Dalları Listesi"
      description="Erciyes Üniversitesi anabilim dallarının listesi ve detayları"
      :data="data as unknown as Record<string, unknown>[]"
      :columns="columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]"
      :filterable-columns="filterableColumns"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/DataTable.vue'
import { columns, filterableColumns, type Discipline } from '@/components/DataTable/Disciplines/columns'

// Örnek anabilim dalı verileri
const data: Discipline[] = [
  {
    id: 'd1',
    name: 'Bilgisayar Bilimleri Anabilim Dalı',
    shortName: 'BBAD',
    phone: '+90 352 207 66 66',
    email: 'bbad@erciyes.edu.tr',
    address: 'Erciyes Üniversitesi Mühendislik Fakültesi, Bilgisayar Mühendisliği Bölümü, 38039, Melikgazi/Kayseri',
    website: 'https://bilgisayar.erciyes.edu.tr',
    departmentId: 'dept1',
    department: {
      id: 'dept1',
      name: 'Bilgisayar Mühendisliği'
    },
    createdAt: new Date('2010-01-01'),
    updatedAt: new Date('2024-11-20'),
    deletedAt: null
  },
  {
    id: 'd2',
    name: 'Yazılım Mühendisliği Anabilim Dalı',
    shortName: 'YMAD',
    phone: '+90 352 207 66 77',
    email: 'ymad@erciyes.edu.tr',
    address: 'Erciyes Üniversitesi Mühendislik Fakültesi, Bilgisayar Mühendisliği Bölümü, 38039, Melikgazi/Kayseri',
    website: 'https://yazilim.erciyes.edu.tr',
    departmentId: 'dept1',
    department: {
      id: 'dept1',
      name: 'Bilgisayar Mühendisliği'
    },
    createdAt: new Date('2015-01-01'),
    updatedAt: new Date('2024-11-18'),
    deletedAt: null
  },
  {
    id: 'd3',
    name: 'Elektronik Anabilim Dalı',
    shortName: 'EAD',
    phone: '+90 352 207 77 77',
    email: 'ead@erciyes.edu.tr',
    address: 'Erciyes Üniversitesi Mühendislik Fakültesi, Elektrik-Elektronik Mühendisliği Bölümü, 38039, Melikgazi/Kayseri',
    website: 'https://elektronik.erciyes.edu.tr',
    departmentId: 'dept2',
    department: {
      id: 'dept2',
      name: 'Elektrik-Elektronik Mühendisliği'
    },
    createdAt: new Date('2008-01-01'),
    updatedAt: new Date('2024-11-15'),
    deletedAt: null
  },
  {
    id: 'd4',
    name: 'İç Hastalıkları Anabilim Dalı',
    shortName: 'İHAD',
    phone: '+90 352 207 88 88',
    email: 'ichastaliklari@erciyes.edu.tr',
    address: 'Erciyes Üniversitesi Tıp Fakültesi, 38039, Melikgazi/Kayseri',
    website: 'https://tip.erciyes.edu.tr/ic-hastaliklari',
    departmentId: 'dept3',
    department: {
      id: 'dept3',
      name: 'İç Hastalıkları'
    },
    createdAt: new Date('2005-01-01'),
    updatedAt: new Date('2024-11-10'),
    deletedAt: null
  }
]
</script>
