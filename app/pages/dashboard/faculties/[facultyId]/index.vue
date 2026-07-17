<script setup lang="ts">
import type { Faculty } from '~/types'
import { CalendarIcon, Loader } from 'lucide-vue-next'

const props = defineProps<{
    faculty: Faculty
}>()

// Helper function to format user name
const formatUserName = (user: any) => {
    if (!user) return 'Belirtilmemiş'
    return `${user.name} ${user.surname}`
}
</script>

<template>
    <div>
        <Card>
            <CardHeader>
                <CardTitle>Fakülte Bilgileri</CardTitle>
            </CardHeader>
            <CardContent class="grid gap-4">
                <div class="flex items-center gap-4 p-1">
                    <div class="grid gap-1">
                        <p class="font-medium leading-none">Fakülte</p>
                    </div>
                    <div class="ml-auto font-medium">{{ faculty?.name }}</div>
                </div>
                <div class="flex items-center gap-4 p-1">
                    <div class="grid gap-1">
                        <p class="font-medium leading-none">Dekan</p>
                    </div>
                    <div class="ml-auto font-medium">{{ formatUserName(faculty?.dean) }}</div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
