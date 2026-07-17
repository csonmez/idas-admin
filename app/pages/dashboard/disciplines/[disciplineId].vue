<script setup lang="ts">
// Import sidebar components
import DisciplineSidebar from '@/components/Admin/Discipline/Sidebar.vue'

// Route parametrelerini al
import { useRoute } from 'vue-router'

const route = useRoute()
const disciplineId = route.params.disciplineId as string

// Current route name for sidebar
const routeName = route.name as string
</script>

<template>
  <div class="flex py-6 px-5">
    <!-- Left sidebar -->
    <div class="hidden md:block w-48 flex-shrink-0 ml-12 mt-1">
      <DisciplineSidebar 
        :discipline-id="disciplineId" 
        :unit-type="'admin'"
        :route-name="routeName"
      />
    </div>
    
    <!-- Main content -->
    <div class="flex-1 ml-6">
      <NuxtPage />
    </div>
  </div>
</template>