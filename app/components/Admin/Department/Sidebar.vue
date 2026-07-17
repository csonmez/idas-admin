<script setup lang="ts">
import { Card, CardContent } from '~/components/ui/card'
import { 
    Info,
    Users,
    Target,
    Microscope,  
    GraduationCap
} from 'lucide-vue-next';
import { useRoute } from 'vue-router'

const props = defineProps<{
    departmentId: string
    routeName?: string
    unitType?: 'admin' | 'faculty' | 'department'
}>()

const route = useRoute()

const getLink = (routeName: null | 'academics' | 'disciplines' | 'targets' | 'students') => {
    if (routeName === 'academics') {
        return `/dashboard/departments/${props.departmentId}/academics`
    } else if (routeName === 'disciplines') {
        return `/dashboard/departments/${props.departmentId}/disciplines`
    } else if (routeName === 'targets') {
        return `/dashboard/departments/${props.departmentId}/targets`
    } else if (routeName === 'students') {
        return `/dashboard/departments/${props.departmentId}/students`
    } else {
        return `/dashboard/departments/${props.departmentId}`
    }
}

const getRouteName = (routeName: null | 'academics' | 'disciplines' | 'targets' | 'students') => {
    if (props.unitType === 'admin') {
        return routeName ? `admin-departments-departmentId-${routeName}` : `admin-departments-departmentId`
    } else if (props.unitType === 'faculty') {
        return routeName ? `faculty-facultyId-departments-departmentId-${routeName}` : `faculty-facultyId-departments-departmentId`
    } else {
        return routeName ? `department-departmentId-${routeName}` : `department-departmentId`
    }
}
</script>

<template>
  <nav class="pb-0">
    <Card class="w-full sticky top-1 shadow-sm rounded-xl">
      <CardContent 
        class="grid gap-0.5 text-sm text-muted-foreground px-2 py-2 pt-1.5 pb-1.5"
      >
        <NuxtLink
          :to="getLink(null)"
          :class="{ 'font-semibold text-primary': route.path === getLink(null) }"
          class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all"
        >
          <Info class="w-5 h-5" />
          <span>Genel Bilgiler</span>
        </NuxtLink>
        <NuxtLink
          :to="getLink('academics')"
          :class="{ 'font-semibold text-primary': route.path === getLink('academics') }"
          class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all"
        >
          <Users class="w-5 h-5" />
          <span>Akademisyenler</span>
        </NuxtLink>
        <NuxtLink
          :to="getLink('disciplines')"
          :class="{ 'font-semibold text-primary': route.path === getLink('disciplines') }"
          class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all"
        >
          <Microscope class="w-5 h-5" />
          <span>Anabilim Dalları</span>
        </NuxtLink>
        <NuxtLink
          :to="getLink('students')"
          :class="{ 'font-semibold text-primary': route.path === getLink('students') }"
          class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all"
        >
          <GraduationCap class="w-5 h-5" />
          <span>Öğrenciler</span>
        </NuxtLink>
        <NuxtLink
          :to="getLink('targets')"
          :class="{ 'font-semibold text-primary': route.path === getLink('targets') }"
          class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all"
        >
          <Target class="w-5 h-5" />
          <span>Hedefler</span>
        </NuxtLink>
      </CardContent>
    </Card>
  </nav>
</template>