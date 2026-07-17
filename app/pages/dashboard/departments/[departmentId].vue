<script setup lang="ts">
// Import sidebar components
import DepartmentSidebar from '@/components/Admin/Department/Sidebar.vue'

// Route parametrelerini al
import { useRoute } from 'vue-router'

const route = useRoute()
const departmentId = route.params.departmentId as string
</script>

<template>
  <div class="flex py-6 px-5">
    <!-- Left sidebar -->
    <div class="hidden md:block w-48 flex-shrink-0 ml-12 mt-1">
      <DepartmentSidebar 
        :department-id="departmentId" 
        :unit-type="'admin'"
      />
    </div>
    
    <!-- Main content -->
    <div class="flex-1 ml-6">
      <NuxtPage />
    </div>
  </div>
</template>
