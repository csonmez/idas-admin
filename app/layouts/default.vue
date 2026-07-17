<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

const route = useRoute()

const generateBreadcrumb = () => {
    const path = route.path
    const breadcrumbs = []

    breadcrumbs.push({
        text: 'Erciyes Üniversitesi',
        href: '#',
        isLink: true
    })

    if (path.startsWith('/dashboard/faculties')) {
        breadcrumbs.push({
            text: 'Fakülteler',
            href: '/dashboard/faculties',
            isLink: true
        })

        if (path.includes('/targets')) {
            breadcrumbs.push({
                text: 'Hedefler',
                href: null,
                isLink: false
            })
        } else if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/dashboard/departments')) {
        breadcrumbs.push({
            text: 'Bölümler',
            href: '/dashboard/departments',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/dashboard/disciplines')) {
        breadcrumbs.push({
            text: 'Anabilim Dalları',
            href: '/dashboard/disciplines',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/dashboard/academicians')) {
        breadcrumbs.push({
            text: 'Akademisyenler',
            href: '/dashboard/academicians',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/dashboard/articles')) {
        breadcrumbs.push({
            text: 'Makaleler',
            href: '/dashboard/articles',
            isLink: true
        })

        if (path.includes('/detail/')) {
            // Makale detay sayfası için route'dan articleId'yi çıkar
            const articleId = route.params.id || route.query.id
            const detailHref = articleId ? `/dashboard/articles/detail/${articleId}` : null

            breadcrumbs.push({
                text: 'Detay',
                href: detailHref,
                isLink: !!detailHref
            })

            if (path.includes('/update')) {
                breadcrumbs.push({
                    text: 'Makaleyi Güncelle',
                    href: null,
                    isLink: false
                })
            }
        }
    } else if (path.startsWith('/dashboard/prizes')) {
        breadcrumbs.push({
            text: 'Ödüller',
            href: '/dashboard/prizes',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/dashboard/patents')) {
        breadcrumbs.push({
            text: 'Patentler',
            href: '/dashboard/patents',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/dashboard/projects')) {
        breadcrumbs.push({
            text: 'Projeler',
            href: '/dashboard/projects',
            isLink: true
        })

        if (path.includes('/create')) {
            breadcrumbs.push({
                text: 'Proje Ekle',
                href: null,
                isLink: false
            })
        } else if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/dashboard/university-targets')) {
        breadcrumbs.push({
            text: 'Ar-Ge Hedefleri',
            href: '/dashboard/university-targets',
            isLink: true
        })
        if (path.includes('tracking-summary')) {
            breadcrumbs.push({
                text: 'Ar-Ge Hedef Uyum Kontrolü',
                href: null,
                isLink: false
            })
        } else {
            breadcrumbs.push({
                text: 'Üniversite Ar-Ge Hedefi',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/dashboard/postgraduates')) {
        breadcrumbs.push({
            text: 'Lisansüstü Öğrenciler',
            href: '/dashboard/postgraduates',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/dashboard/analysis')) {
        breadcrumbs.push({
            text: 'Yetkinlik Analizleri',
            href: null,
            isLink: false
        })
    } else if (path.startsWith('/dashboard')) {
        breadcrumbs.push({
            text: 'Dashboard',
            href: null,
            isLink: false
        })
    } else if (path.startsWith('/faculties')) {
        breadcrumbs.push({
            text: 'Fakülteler',
            href: '/faculties',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/departments')) {
        breadcrumbs.push({
            text: 'Bölümler',
            href: '/departments',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/academicians')) {
        breadcrumbs.push({
            text: 'Akademisyenler',
            href: '/academicians',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/disciplines')) {
        breadcrumbs.push({
            text: 'Anabilim Dalları',
            href: '/disciplines',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    } else if (path.startsWith('/projects')) {
        breadcrumbs.push({
            text: 'Projeler',
            href: '/projects',
            isLink: true
        })

        if (path.includes('/detail/')) {
            breadcrumbs.push({
                text: 'Detay',
                href: null,
                isLink: false
            })
        }
    }

    return breadcrumbs
}

const breadcrumbs = computed(() => generateBreadcrumb())
</script>

<template>
    <SidebarProvider class="!min-h-screen">
        <AppSidebar />
        <SidebarInset>
            <header class="top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background">
                <div class="flex items-center gap-2 px-4">
                    <SidebarTrigger class="-ml-1" />
                    <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <template v-for="(breadcrumb, index) in breadcrumbs" :key="index">
                                <BreadcrumbItem v-if="breadcrumb.isLink" class="hidden md:block">
                                    <NuxtLink v-if="breadcrumb.href !== '#' && breadcrumb.href" :to="breadcrumb.href">
                                        <BreadcrumbLink>
                                            {{ breadcrumb.text }}
                                        </BreadcrumbLink>
                                    </NuxtLink>
                                    <BreadcrumbLink v-else href="#">
                                        {{ breadcrumb.text }}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbItem v-else>
                                    <BreadcrumbPage>{{ breadcrumb.text }}</BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" class="hidden md:block" />
                            </template>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <main class="my-4">
                <slot />
            </main>
        </SidebarInset>
    </SidebarProvider>
</template>
