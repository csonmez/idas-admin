<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent } from '~/components/ui/card'
import { 
    BrainCircuit,
    ScrollText,
    Award,
    Shapes,
    Info 
} from 'lucide-vue-next';

const props = defineProps<{
    academicianId: string
    routeName?: string
    unitType: 'admin' | 'university' | 'faculty' | 'department' | 'discipline'
}>()

// These composables would be created later as needed
// For now, we'll provide empty implementations with proper type definitions
interface EntityWithId {
    id: string | null;
}

const useFaculty = () => ({ faculty: ref<EntityWithId>({ id: null }) })
const useDepartment = () => ({ department: ref<EntityWithId>({ id: null }) })
const useDiscipline = () => ({ discipline: ref<EntityWithId>({ id: null }) })

const { faculty } = useFaculty()
const { department } = useDepartment()
const { discipline } = useDiscipline()

const getLink = (routeName: null | 'articles' | 'projects' | 'prizes' | 'patents') => {
    if (props.unitType === 'admin') {
        return routeName ? `/dashboard/academicians/${props.academicianId}/${routeName}` : `/dashboard/academicians/${props.academicianId}`
    } else if (props.unitType === 'university') {
        return routeName ? `/university/academicians/${props.academicianId}/${routeName}` : `/university/academicians/${props.academicianId}`
    } else if (props.unitType === 'faculty') {
        return routeName ? `/faculty/${faculty.value?.id}/academicians/${props.academicianId}/${routeName}` : `/faculty/${faculty.value?.id}/academicians/${props.academicianId}`
    } else if (props.unitType === 'department') {
        return routeName ? `/department/${department.value?.id}/academicians/${props.academicianId}/${routeName}` : `/department/${department.value?.id}/academicians/${props.academicianId}`
    } else {
        return routeName ? `/discipline/${discipline.value?.id}/academicians/${props.academicianId}/${routeName}` : `/discipline/${discipline.value?.id}/academicians/${props.academicianId}`
    }
}

const getRouteName = (routeName: null | 'articles' | 'projects' | 'prizes' | 'patents') => {
    if (props.unitType === 'admin') {
        return routeName ? `dashboard-academicians-academicianId-${routeName}` : `dashboard-academicians-academicianId`
    } else if (props.unitType === 'university') {
        return routeName ? `university-academicians-academicianId-${routeName}` : `university-academicians-academicianId`
    } else if (props.unitType === 'faculty') {
        return routeName ? `faculty-facultyId-academicians-academicianId-${routeName}` : `faculty-facultyId-academicians-academicianId`
    } else if (props.unitType === 'department') {
        return routeName ? `department-departmentId-academicians-academicianId-${routeName}` : `department-departmentId-academicians-academicianId`
    } else {
        return routeName ? `discipline-disciplineId-academicians-academicianId-${routeName}` : `discipline-disciplineId-academicians-academicianId`
    }
}

// API data fetching commented out for now
// const { data } = await useAsyncData('admin-user-sidebar', async () => {
//     const [userArticleCount, projectCount, prizeCount, patentCount, postgraduateCount, supportCount] = await Promise.all([
//         useRequest<{ count: number }>('/user-articles', { method: 'GET', query: { user: props.userId, onlyCount: true } }),
//         useRequest<{ count: number }>('/projects', { method: 'GET', query: { user: props.userId, onlyCount: true } }),
//         useRequest<{ count: number }>('/prizes', { method: 'GET', query: { user: props.userId, onlyCount: true } }),
//         useRequest<{ count: number }>('/patents', { method: 'GET', query: { user: props.userId, onlyCount: true } }),
//         useRequest<{ count: number }>('/postgraduates', { method: 'GET', query: { user: props.userId, onlyCount: true } }),
//         useRequest<{ count: number }>('/supports', { method: 'GET', query: { user: props.userId, onlyCount: true } })
//     ])

//     return { userArticleCount, projectCount, prizeCount, patentCount, postgraduateCount, supportCount }
// })
</script>

<template>    <nav class="pb-0">        <Card class="w-full sticky top-1 shadow-sm rounded-xl">            <CardContent class="grid gap-0.5 text-sm text-muted-foreground px-2 py-2 pt-1.5 pb-1.5">
                <NuxtLink :to="getLink(null)" :class="{ 'font-semibold text-primary': !props.routeName || props.routeName === getRouteName(null) }" class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all">
                    <Info class="w-4 h-4" />
                    <span>Genel Bilgiler</span>
                </NuxtLink>
                <NuxtLink :to="getLink('articles')" :class="{ 'font-semibold text-primary': props.routeName === getRouteName('articles') }" class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all">
                    <ScrollText class="w-4 h-4" />
                    <span>Makaleler</span>
                </NuxtLink>
                <NuxtLink :to="getLink('projects')" :class="{ 'font-semibold text-primary': props.routeName === getRouteName('projects') }" class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all">
                    <Shapes class="w-4 h-4" />
                    <span>Projeler</span> 
                </NuxtLink>
                <NuxtLink :to="getLink('prizes')" :class="{ 'font-semibold text-primary': props.routeName === getRouteName('prizes') }" class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all">   
                    <Award class="w-4 h-4" />
                    <span>Ödüller</span> 
                </NuxtLink>
                <NuxtLink :to="getLink('patents')" :class="{ 'font-semibold text-primary': props.routeName === getRouteName('patents') }" class="flex items-center space-x-2 hover:scale-105 text-sm py-1 px-1 rounded-md hover:bg-gray-50 transition-all"> 
                    <BrainCircuit class="w-4 h-4" />
                    <span>Patentler</span>
                </NuxtLink>
                <!-- <NuxtLink
                    :to="`/admin/users/${userId}/postgraduates`"
                    :class="{ 'font-semibold text-primary': routeName === 'admin-users-userId-postgraduates' }"
                >
                    Doktora Mezun
                </NuxtLink>
                <NuxtLink
                    :to="`/admin/users/${userId}/supports`"
                    :class="{ 'font-semibold text-primary': routeName === 'admin-users-userId-supports' }"
                >
                    Talepler ({{ data?.supportCount.count }})
                </NuxtLink> -->
            </CardContent>
        </Card>
    </nav>
</template>
