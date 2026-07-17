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

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { 
    Info,
    Users,
    Target,
    GraduationCap
} from 'lucide-vue-next';
import { useRoute } from 'vue-router'

const props = defineProps<{
    disciplineId: string
    routeName?: string
    unitType?: 'admin' | 'department' | 'discipline'
}>()

const route = useRoute()

const getLink = (routeName: null | 'academics' | 'targets' | 'students') => {
    if (routeName === 'academics') {
        return `/dashboard/disciplines/${props.disciplineId}/academics`
    } else if (routeName === 'targets') {
        return `/dashboard/disciplines/${props.disciplineId}/targets`
    } else if (routeName === 'students') {
        return `/dashboard/disciplines/${props.disciplineId}/students`
    } else {
        return `/dashboard/disciplines/${props.disciplineId}`
    }
}

const getRouteName = (routeName: null | 'academics' | 'targets' | 'students') => {
    if (props.unitType === 'admin') {
        return routeName ? `admin-disciplines-disciplineId-${routeName}` : `admin-disciplines-disciplineId`
    } else if (props.unitType === 'department') {
        return routeName ? `department-departmentId-disciplines-disciplineId-${routeName}` : `department-departmentId-disciplines-disciplineId`
    } else {
        return routeName ? `discipline-disciplineId-${routeName}` : `discipline-disciplineId`
    }
}
</script>
