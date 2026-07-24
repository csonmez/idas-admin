<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { Info, Home, TrendingUp, BarChart3, Target, ScrollText, Shapes, BrainCircuit, Award, Users, School, BarChart, Activity, BrickWall, ClipboardCheck, BadgeCheck, Building2 } from 'lucide-vue-next'
import NavMain from '@/components/NavMain.vue'
import NavUser from '@/components/NavUser.vue'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, type SidebarProps } from '@/components/ui/sidebar'

const props = withDefaults(defineProps<SidebarProps>(), {
    variant: 'inset'
})

const { user } = useAuth()
const route = useRoute()

const isArGeTargetsActive = computed(() => {
    const path = route.path
    return path.startsWith('/dashboard/targets')
})

const data = {
    user: computed(() => {
        if (user.value) {
            return {
                name: `${user.value.name} ${user.value.surname}`,
                email: user.value.email,
                avatar: ''
            }
        }
        return {
            name: 'Kullanıcı',
            email: 'kullanici@example.com',
            avatar: ''
        }
    }),
    sections: computed(() => [
        {
            title: 'Home',
            items: [
                {
                    title: 'Ana Sayfa',
                    url: '/dashboard',
                    icon: Home,
                    isActive: false
                }
            ]
        },
        {
            title: 'Faaliyetler',
            items: [
                {
                    title: 'Makaleler',
                    icon: ScrollText,
                    url: '/dashboard/articles'
                },
                {
                    title: 'Projeler',
                    icon: Shapes,
                    url: '/dashboard/projects'
                },
                {
                    title: 'Patentler',
                    icon: BrainCircuit,
                    url: '/dashboard/patents'
                },
                {
                    title: 'Ödüller',
                    icon: Award,
                    url: '/dashboard/prizes'
                },
                {
                    title: 'Firmalar',
                    icon: Building2,
                    url: '/dashboard/companies'
                }
                /* {
                    title: 'Doktora',
                    url: '#',
                    items: [
                        {
                            title: 'Mezunlar',
                            url: '#'
                        },
                        {
                            title: 'Devam edenler',
                            url: '#'
                        }
                    ]
                },
                {
                    title: 'Bursiyer',
                    url: '#',
                    items: [
                        {
                            title: 'Doktora bursiyer',
                            url: '#'
                        },
                        {
                            title: 'Doktora sonrası bursiyeri',
                            url: '#'
                        }
                    ]
                },
                {
                    title: 'Firmalar',
                    url: '#'
                } */
            ]
        },
        {
            title: 'Üniversite',
            items: [
                {
                    title: 'Akademisyenler',
                    url: '/dashboard/academicians',
                    icon: Users
                },
                {
                    title: 'Fakülteler',
                    url: '/dashboard/faculties',
                    icon: School
                },
                {
                    title: 'Yetkinlik Analizleri',
                    url: '/dashboard/analysis',
                    icon: BarChart3
                },
                {
                    title: 'Ar-Ge Hedefleri',
                    url: '/dashboard/targets',
                    icon: Target,
                    isActive: isArGeTargetsActive.value,
                    items: [
                        { title: 'Üniversite Ar-Ge Hedefi', url: '/dashboard/targets' },
                        { title: 'Ar-Ge Hedef Uyum Kontrolü', url: '/dashboard/targets/tracking-summary' },
                        { title: 'Fakülte Hedef Durumları', url: '/dashboard/targets/faculty-targets' },
                        { title: 'Bölüm Hedef Durumları', url: '/dashboard/targets/department-targets' },
                        { title: 'Anabilim Dalı Hedef Durumları', url: '/dashboard/targets/discipline-targets' },
                        { title: 'Akademisyen Hedef Durumları', url: '/dashboard/targets/academician-targets' }
                    ]
                },
                /* {
                    title: 'Bölümler',
                    url: '/dashboard/departments'
                },
                {
                    title: 'Anabilim Dalları',
                    url: '/dashboard/disciplines'
                }, */
                {
                    title: 'Bilimsel Teşvik',
                    icon: BadgeCheck,
                    url: '/dashboard/user-incentive-approvals'
                },
                {
                    title: 'Üniversite Göstergeleri',
                    url: '/dashboard/university-indicators',
                    icon: BrickWall
                },
                {
                    title: 'Üniversite Karşılaştırma',
                    url: '/dashboard/university-comparison',
                    icon: Activity
                },
                {
                    title: 'Dünya Sıralaması',
                    url: '/dashboard/rankings',
                    icon: BarChart
                }
            ]
        }
    ]),
    navSecondary: [
        {
            title: 'Destek Talepleri',
            url: '/dashboard/tickets',
            icon: Info
        }
    ]
}
</script>

<template>
    <Sidebar v-bind="props">
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" as-child class="h-auto">
                        <NuxtLink to="/dashboard">
                            <div class="flex flex-col items-center gap-3 flex-1 text-center leading-tight py-1 px-4">
                                <div class="flex items-center gap-4">
                                    <img src="/logo1.png" alt="Erciyes Üniversitesi Logo" class="h-20 w-20 object-contain" />
                                    <img src="/logo2.png" alt="Erciyes Üniversitesi Araştırma Logo" class="h-15 w-15 object-contain" />
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-bold text-blue-800 whitespace-nowrap">Erciyes Üniversitesi</div>
                                    <div class="text-lg font-bold text-blue-800 whitespace-nowrap">Veri Analitiği Sistemi</div>
                                </div>
                            </div>
                        </NuxtLink>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
            <NavMain :sections="(data.sections as ComputedRef)?.value ?? []" />
            <NavSecondary :items="data.navSecondary" />
        </SidebarContent>
        <SidebarFooter>
            <NavUser :user="data.user.value" />
        </SidebarFooter>
    </Sidebar>
</template>
