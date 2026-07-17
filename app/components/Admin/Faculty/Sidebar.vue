<script setup lang="ts">
import { Card, CardContent } from '~/components/ui/card'
import { 
    Info,
    Users,
    Target
} from 'lucide-vue-next';

const props = defineProps<{
    facultyId: string
    routeName?: string
    unitType?: 'admin' | 'faculty' | 'department'
}>()

// Default props değerleri
const routeName = props.routeName || 'admin-faculties-facultyId'

const getLink = (routeName: null | 'academics' | 'targets') => {
    if (routeName === 'academics') {
        return `/dashboard/faculties/${props.facultyId}/academicians`
    } else if (routeName === 'targets') {
        return `/dashboard/faculties/${props.facultyId}/targets`
    } else {
        return `/dashboard/faculties/${props.facultyId}`
    }
}

const getRouteName = (routeName: null | 'academics' | 'targets') => {
    if (routeName === 'academics') {
        return 'academicians'
    } else if (routeName === 'targets') {
        return 'faculty-targets'
    } else {
        return 'faculty-details'
    }
}

// Route değişkenine ihtiyaç kalmadı, NuxtLink kullanıyoruz
</script>

<template>
  <nav class="pb-0">
    <Card class="w-full sticky top-1 shadow-sm rounded-xl">
      <CardContent
        class="grid gap-0.5 text-sm text-muted-foreground px-2 py-2 pt-1.5 pb-1.5"
      >
        <NuxtLink
          :to="getLink(null)"
          :class="{ 'font-semibold text-primary': routeName === getRouteName(null) }"
          class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all"
        >
          <Info 
            class="w-5 h-5" 
          />
          <span>Genel Bilgiler</span>
        </NuxtLink>

        <NuxtLink
          :to="getLink('academics')"
          :class="{ 'font-semibold text-primary': routeName === getRouteName('academics') }"
          class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all"
        >
          <Users 
            class="w-5 h-5" 
          />
          <span>Akademisyenler</span>
        </NuxtLink>

        <NuxtLink
          :to="getLink('targets')"
          :class="{ 'font-semibold text-primary': routeName === getRouteName('targets') }"
          class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all"
        >
          <Target 
            class="w-5 h-5" 
          />
          <span>Hedefler</span>
        </NuxtLink>
      </CardContent>
    </Card>
  </nav>
</template>