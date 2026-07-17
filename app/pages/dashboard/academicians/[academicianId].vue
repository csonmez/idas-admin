<script setup lang="ts">
import type { User } from '~/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

const route = useRoute()

const academicianId = computed(() => route.params.academicianId as string)

const academician = computed(() => academicianData.value || null)
const academicUnits = computed(() => {
    return academician.value?.userAcademicUnits || []
})

const {
    data: academicianData,
    pending: academicianPending,
    error: academicianError,
    refresh: refreshAcademician
} = await useAsyncData(
    `admin-academician-info-${route.params.academicianId}`,
    async () => {
        return await useRequest<User>(`/manager/users/${route.params.academicianId}`, {
            method: 'GET',
            query: {
                select: 'id,name,surname,email,title,iban,phone,userAcademicUnits',
                userAcademicUnitsSelect: 'id,faculty,department,discipline,affiliationType',
                facultySelect: 'id,name',
                departmentSelect: 'id,name',
                disciplineSelect: 'id,name'
            }
        })
    },
    { lazy: true }
)

// Provide academician data to child pages
provide('academician', academician)
provide('academicianId', academicianId)
</script>

<template>
    <div class="flex flex-col flex-1">
        <!-- Akademisyen Header -->
        <div class="px-4 md:px-8 mb-6 mt-6">
            <div class="mx-auto w-full max-w-7xl">
                <div class="bg-white dark:bg-gray-900 rounded-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
                    <!-- Academician Loading State -->
                    <div v-if="academicianPending" class="space-y-4">
                        <Skeleton class="h-10 w-80 mx-auto mb-4" />
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                            <div class="flex items-center gap-2">
                                <Skeleton class="h-4 w-12" />
                                <Skeleton class="h-4 w-32" />
                            </div>
                            <Skeleton class="h-4 w-48" />
                        </div>
                    </div>

                    <!-- Academician Error State -->
                    <div v-else-if="academicianError" class="text-center py-8 space-y-4">
                        <div class="text-red-600 dark:text-red-400">
                            <p class="font-medium">Akademisyen bilgileri yüklenemedi</p>
                            <p class="text-sm mt-1">{{ academicianError.message || 'Bilinmeyen bir hata oluştu' }}</p>
                        </div>
                        <Button variant="outline" size="sm" @click="refreshAcademician()">Tekrar Dene</Button>
                    </div>

                    <!-- Academician Content -->
                    <div v-else>
                        <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 text-center">
                            {{ formatUserName(academician || null) }}
                        </h1>

                        <!-- Akademik Birim Bilgisi -->
                        <div v-if="academicUnits.length > 0" class="mt-4 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                            <div v-if="academicUnits[0]?.faculty?.name" class="text-base text-center">
                                {{ academicUnits[0]?.faculty?.name }}
                            </div>
                            <div v-if="academicUnits[0]?.department?.name" class="text-base text-center flex items-center">
                                <span class="mx-2">•</span>
                                {{ academicUnits[0]?.department?.name }}
                            </div>
                            <div v-if="academicUnits[0]?.discipline?.name" class="text-base text-center flex items-center">
                                <span class="mx-2">•</span>
                                {{ academicUnits[0]?.discipline?.name }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Child Page Content -->
        <div class="flex-1">
            <NuxtPage />
        </div>
    </div>
</template>
