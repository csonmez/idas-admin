<script setup lang="ts">
import { View, ScrollText, Shapes, BrainCircuit, Award } from 'lucide-vue-next'
import { h, resolveComponent, ref } from 'vue'
import { createColumnHelper } from '@tanstack/vue-table'
import type { IApiResponse, UserArticle, UserProject, UserPrize, UserPatent } from '~/types'

const NuxtLink = resolveComponent('NuxtLink')

const props = defineProps<{
    academicianId: string
    type: 'articles' | 'projects' | 'prizes' | 'patents'
}>()
const currentPage = ref(1)

const articleColumnHelper = createColumnHelper<UserArticle>()
const projectColumnHelper = createColumnHelper<UserProject>()
const prizeColumnHelper = createColumnHelper<UserPrize>()
const patentColumnHelper = createColumnHelper<UserPatent>()

const getColumns = () => {
    switch (props.type) {
        case 'articles':
            return [
                articleColumnHelper.display({
                    id: 'articleTitle',
                    header: 'Makale Başlığı',
                    cell: ({ row }) => h('div', { class: 'text-wrap leading-relaxed p-2' }, row.original.article?.title || '-')
                }),
                articleColumnHelper.display({
                    id: 'articleYear',
                    header: 'Yıl',
                    cell: ({ row }) => h('div', { class: 'text-center p-2' }, row.original.article?.year || '-')
                }),
                articleColumnHelper.display({
                    id: 'articleJournal',
                    header: 'Dergi',
                    cell: ({ row }) => h('div', { class: 'text-wrap leading-relaxed p-2' }, row.original.article?.journal?.name || '-')
                }),
                articleColumnHelper.display({
                    id: 'articleJournalQValue',
                    header: 'Dergi Q Değeri',
                    cell: ({ row }) => h('div', { class: 'text-wrap leading-relaxed p-2' }, row.original.article?.journalMetric?.qValue || '-')
                }),
                articleColumnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: ({ row }) =>
                        h(
                            NuxtLink,
                            {
                                to: `/dashboard/articles/${row.original.articleId}`,
                                class: 'inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors'
                            },
                            () => [h(View, { size: 16 })]
                        )
                })
            ]
        case 'projects':
            return [
                projectColumnHelper.display({
                    id: 'projectTitle',
                    header: 'Proje Başlığı',
                    cell: ({ row }) => h('div', { class: 'text-wrap leading-relaxed p-2' }, row.original.project?.title || '-')
                }),
                projectColumnHelper.display({
                    id: 'projectYear',
                    header: 'Yıl',
                    cell: ({ row }) => h('div', { class: 'text-center p-2' }, row.original.project?.year || '-')
                }),
                projectColumnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: ({ row }) =>
                        h(
                            NuxtLink,
                            {
                                to: `/dashboard/projects/${row.original.projectId}`,
                                class: 'inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors'
                            },
                            () => [h(View, { size: 16 })]
                        )
                })
            ]
        case 'prizes':
            return [
                prizeColumnHelper.display({
                    id: 'prizeTitle',
                    header: 'Ödül Başlığı',
                    cell: ({ row }) => h('div', { class: 'text-wrap leading-relaxed p-2' }, row.original.prize?.title || '-')
                }),
                prizeColumnHelper.display({
                    id: 'prizeType',
                    header: 'Ödül Türü',
                    cell: ({ row }) => h('div', { class: 'text-wrap p-2' }, row.original.prize?.type || '-')
                }),
                prizeColumnHelper.display({
                    id: 'prizeYear',
                    header: 'Yıl',
                    cell: ({ row }) => h('div', { class: 'text-center p-2' }, row.original.prize?.year || '-')
                }),
                prizeColumnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: ({ row }) =>
                        h(
                            NuxtLink,
                            {
                                to: `/dashboard/prizes/detail/${row.original.prizeId}`,
                                class: 'inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors'
                            },
                            () => [h(View, { size: 16 })]
                        )
                })
            ]
        case 'patents':
            return [
                patentColumnHelper.display({
                    id: 'patentTitle',
                    header: 'Patent Başlığı',
                    cell: ({ row }) => h('div', { class: 'text-wrap leading-relaxed p-2' }, row.original.patent?.title || '-')
                }),
                patentColumnHelper.display({
                    id: 'patentType',
                    header: 'Patent Türü',
                    cell: ({ row }) => h('div', { class: 'text-wrap p-2' }, row.original.patent?.type === 'INTERNATIONAL' ? 'Uluslararası' : 'Ulusal')
                }),
                patentColumnHelper.display({
                    id: 'patentYear',
                    header: 'Yıl',
                    cell: ({ row }) => h('div', { class: 'text-center p-2' }, row.original.patent?.year || '-')
                }),
                patentColumnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: ({ row }) =>
                        h(
                            NuxtLink,
                            {
                                to: `/dashboard/patents/detail/${row.original.patentId}`,
                                class: 'inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors'
                            },
                            () => [h(View, { size: 16 })]
                        )
                })
            ]
    }
}

const getTitleAndIcon = () => {
    switch (props.type) {
        case 'articles':
            return { title: 'Makaleler', icon: ScrollText, color: 'text-blue-600' }
        case 'projects':
            return { title: 'Projeler', icon: Shapes, color: 'text-green-600' }
        case 'prizes':
            return { title: 'Ödüller', icon: Award, color: 'text-yellow-600' }
        case 'patents':
            return { title: 'Patentler', icon: BrainCircuit, color: 'text-purple-600' }
        default:
            return { title: 'Veriler', icon: ScrollText, color: 'text-gray-600' }
    }
}

const getData = async () => {
    const endpoint = `/manager/user-${props.type}`

    const response = await useRequest<IApiResponse<UserArticle | UserProject | UserPrize | UserPatent>>(endpoint, {
        method: 'GET',
        query: {
            userId: props.academicianId,
            page: currentPage.value,
            select: getSelectFields(),
            articleSelect: 'id,title,year,journal,journalMetric',
            projectSelect: 'id,title,startDate,endDate,year',
            prizeSelect: 'id,title,type,year',
            patentSelect: 'id,title,type,year'
        }
    })

    return response
}

const getSelectFields = () => {
    switch (props.type) {
        case 'articles':
            return 'id,userId,articleId,article,createdAt,updatedAt'
        case 'projects':
            return 'id,userId,projectId,project,createdAt,updatedAt'
        case 'prizes':
            return 'id,userId,prizeId,prize,createdAt,updatedAt'
        case 'patents':
            return 'id,userId,patentId,patent,createdAt,updatedAt'
        default:
            return 'id,title,year'
    }
}

const { data: tableData } = await useAsyncData(`academician-data-list-${props.type}-${props.academicianId}`, getData, {
    watch: [currentPage]
})

const titleAndIcon = getTitleAndIcon()
</script>

<template>
    <Card class="w-full">
        <CardHeader>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <component :is="titleAndIcon.icon" class="w-6 h-6" :class="titleAndIcon.color" />
                    <CardTitle>{{ titleAndIcon.title }}</CardTitle>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Toplam: {{ tableData?.pagination?.totalItems || 0 }} {{ titleAndIcon.title.toLowerCase() }}</div>
            </div>
        </CardHeader>
        <CardContent>
            <DataTable v-model:page="currentPage" :data="tableData?.rows || []" :columns="getColumns()" :api-pagination="tableData?.pagination" class="w-full" />
        </CardContent>
    </Card>
</template>
