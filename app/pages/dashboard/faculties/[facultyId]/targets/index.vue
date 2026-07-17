<script setup lang="ts">
import type { Faculty } from '~/types'

const props = defineProps<{
    faculty: Faculty
}>()

const route = useRoute()
const facultyId = route.params.facultyId

const { data: facultyTargets, status } = await useAsyncData(`admin-faculty-${facultyId}-targets`, () => useRequest(`/manager/faculties/${facultyId}/targets`, { method: 'GET', query: { facultyId } }))
</script>

<template>
    <div>
        <h1>Targets</h1>
    </div>
</template>
