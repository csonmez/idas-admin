<script setup lang="ts">
import type { Faculty } from '~/types'
import { Users, Building2, GraduationCap } from 'lucide-vue-next'
import FacultyTargetsCard from '~/components/Admin/Faculty/TargetsCard.vue'
import FacultyMembersCard from '~/components/Admin/Faculty/MembersCard.vue'
import FacultyReportsCard from '~/components/Admin/Faculty/ReportsCard.vue'
import ChartsSpecializedFacultyPerformanceChart from '~/components/Charts/specialized/FacultyPerformanceChart.vue'

const route = useRoute()

const facultyId = computed(() => route.params.facultyId as string)

// Ayrı lazy veri çekme işlemleri
const {
    data: facultyData,
    pending: facultyPending,
    error: facultyError,
    refresh: refreshFaculty
} = await useAsyncData(
    `admin-faculty-info-${facultyId.value}`,
    async () => {
        return await useRequest<Faculty>(`/manager/faculties/${facultyId.value}`, {
            method: 'GET',
            query: {
                useDean: true,
                useDepartments: true,
                useDisciplines: true
            }
        })
    },
    { lazy: true }
)

const {
    data: academicianCount,
    pending: academicianCountPending,
    error: academicianCountError,
    refresh: refreshAcademicianCount
} = await useAsyncData(
    `admin-faculty-users-${facultyId.value}`,
    async () => {
        return await useRequest<number>('/manager/users', {
            method: 'GET',
            query: {
                onlyCount: true,
                facultyId: facultyId.value
            }
        })
    },
    { lazy: true }
)

const {
    data: statsData,
    pending: statsPending,
    error: statsError,
    refresh: refreshStats
} = await useAsyncData(
    `admin-faculty-stats-${facultyId.value}`,
    async () => {
        return await useRequest<{
            facultyId: string
            totalAcademicians: number
            stats: {
                articles: {
                    total: number
                    perAcademician: number
                    byYear: Record<string, number>
                }
                patents: {
                    total: number
                    perAcademician: number
                    byYear: Record<string, number>
                }
                projects: {
                    total: number
                    perAcademician: number
                    byYear: Record<string, number>
                }
                prizes: {
                    total: number
                    perAcademician: number
                    byYear: Record<string, number>
                }
            }
            topPerformers: Array<{
                academicianId: string
                name: string
                totalPublications: number
            }>
        }>(`/manager/faculties/${facultyId.value}/stats`, {
            method: 'GET'
        })
    },
    { lazy: true }
)

// Computed properties
const faculty = computed(() => facultyData.value)
const stats = computed(() => statsData.value)
</script>

<template>
    <div class="flex flex-col flex-1">
        <!-- Büyük Fakülte Başlığı -->
        <div class="px-4 md:px-8 mb-6 mt-6">
            <div class="mx-auto w-full max-w-7xl">
                <div class="bg-white dark:bg-gray-900 rounded-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
                    <!-- Faculty Loading State -->
                    <div v-if="facultyPending" class="space-y-4">
                        <Skeleton class="h-10 w-80 mx-auto mb-4" />
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                            <div class="flex items-center gap-2">
                                <Skeleton class="h-4 w-12" />
                                <Skeleton class="h-4 w-32" />
                            </div>
                            <Skeleton class="h-4 w-48" />
                        </div>
                    </div>

                    <!-- Faculty Error State -->
                    <div v-else-if="facultyError" class="text-center py-8 space-y-4">
                        <div class="text-red-600 dark:text-red-400">
                            <p class="font-medium">Fakülte bilgileri yüklenemedi</p>
                            <p class="text-sm mt-1">{{ facultyError.message || 'Bilinmeyen bir hata oluştu' }}</p>
                        </div>
                        <Button variant="outline" size="sm" @click="refreshFaculty()"> Tekrar Dene </Button>
                    </div>

                    <!-- Faculty Content -->
                    <div v-else>
                        <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 text-center">
                            {{ faculty?.name ?? 'Fakülte' }}
                        </h1>

                        <!-- Dekan Bilgisi -->
                        <div v-if="faculty?.dean" class="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 text-gray-600 dark:text-gray-400">
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-medium">Dekan:</span>
                                <span class="text-sm">
                                    {{
                                        faculty.dean.title === 'PROF'
                                            ? 'Prof. Dr.'
                                            : faculty.dean.title === 'ASSOC_PROF'
                                              ? 'Doç. Dr.'
                                              : faculty.dean.title === 'ASSIST_PROF'
                                                ? 'Dr. Öğr. Üyesi'
                                                : faculty.dean.title === 'DOCTOR'
                                                  ? 'Dr.'
                                                  : ''
                                    }}
                                    {{ faculty.dean.name + ' ' + faculty.dean.surname }}
                                </span>
                            </div>
                            <div v-if="faculty.dean.email" class="flex items-center gap-2">
                                <span class="hidden sm:inline text-gray-400">•</span>
                                <a :href="`mailto:${faculty.dean.email}`" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                    {{ faculty.dean.email }}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex-1 px-4 pb-8 md:px-8 md:pb-10">
            <div class="mx-auto w-full max-w-7xl h-full">
                <!-- İstatistik Kartları -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <!-- Academician Count Loading State -->
                    <template v-if="academicianCountPending || facultyPending">
                        <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <div class="space-y-2">
                                    <Skeleton class="h-4 w-24" />
                                    <Skeleton class="h-8 w-16" />
                                </div>
                                <Skeleton class="h-12 w-12 rounded-lg" />
                            </div>
                        </div>
                    </template>

                    <!-- Academician Count Error State -->
                    <template v-else-if="academicianCountError || facultyError">
                        <div class="col-span-full bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div class="text-center py-8 space-y-4">
                                <div class="text-red-600 dark:text-red-400">
                                    <p class="font-medium">İstatistik verileri yüklenemedi</p>
                                    <p class="text-sm mt-1">{{ academicianCountError?.message || facultyError?.message || 'Bilinmeyen bir hata oluştu' }}</p>
                                </div>
                                <Button variant="outline" size="sm" @click="academicianCountError ? refreshAcademicianCount() : refreshFaculty()"> Tekrar Dene </Button>
                            </div>
                        </div>
                    </template>

                    <!-- İstatistik Kartları Content -->
                    <template v-else>
                        <!-- Akademisyen Sayısı -->
                        <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Akademisyen</p>
                                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {{ academicianCount || 0 }}
                                    </p>
                                </div>
                                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                    <Users class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <!-- Bölüm Sayısı -->
                        <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Bölüm</p>
                                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {{ faculty?.departments?.length || 0 }}
                                    </p>
                                </div>
                                <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                    <Building2 class="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <!-- Anabilim Dalı Sayısı -->
                        <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Anabilim Dalı</p>
                                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {{ faculty?.departments?.reduce((total: number, dept: any) => total + (dept.disciplines?.length || 0), 0) || 0 }}
                                    </p>
                                </div>
                                <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                    <GraduationCap class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Fakülte Performans Chart'ı -->
                <div class="mb-6">
                    <!-- Stats Loading State -->
                    <div v-if="statsPending" class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div class="space-y-4">
                            <Skeleton class="h-6 w-48" />
                            <div class="flex items-center gap-4 mb-4">
                                <Skeleton class="h-4 w-20" />
                                <Skeleton class="h-4 w-24" />
                                <Skeleton class="h-4 w-20" />
                                <Skeleton class="h-4 w-24" />
                            </div>
                            <Skeleton class="h-64 w-full rounded" />
                        </div>
                    </div>

                    <!-- Stats Error State -->
                    <div v-else-if="statsError" class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div class="text-center py-8 space-y-4">
                            <div class="text-red-600 dark:text-red-400">
                                <p class="font-medium">Performans verileri yüklenemedi</p>
                                <p class="text-sm mt-1">{{ statsError.message || 'Bilinmeyen bir hata oluştu' }}</p>
                            </div>
                            <Button variant="outline" size="sm" @click="refreshStats()"> Tekrar Dene </Button>
                        </div>
                    </div>

                    <!-- Stats Content -->
                    <div v-else-if="stats">
                        <ChartsSpecializedFacultyPerformanceChart :stats-data="stats" />
                    </div>

                    <!-- Stats Empty State -->
                    <div v-else class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div class="text-center py-8">
                            <p class="text-gray-500 dark:text-gray-400">İstatistik verileri bulunamadı.</p>
                        </div>
                    </div>
                </div>

                <!-- Fakülte Hedefleri -->
                <div class="mb-6">
                    <FacultyTargetsCard :faculty-id="facultyId" />
                </div>

                <!-- Fakülte Akademisyenleri -->
                <div class="mb-6">
                    <FacultyMembersCard :faculty-id="facultyId" />
                </div>

                <!-- Fakülte Raporları -->
                <div class="mb-6">
                    <FacultyReportsCard :faculty-id="facultyId" :faculty-name="faculty?.name || 'Fakülte'" />
                </div>
            </div>
        </div>
    </div>
</template>
