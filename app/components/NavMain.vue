<script setup lang="ts">
import { ChevronRight, type LucideIcon } from 'lucide-vue-next'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

defineProps<{
    sections?: {
        title: string
        icon?: LucideIcon
        items: {
            title: string
            url: string
            icon?: LucideIcon
            isActive?: boolean
            items?: {
                title: string
                url: string
                items?: {
                    title: string
                    url: string
                }[]
            }[]
        }[]
    }[]
    items?: {
        title: string
        url: string
        icon: LucideIcon
        isActive?: boolean
        items?: {
            title: string
            url: string
            items?: {
                title: string
                url: string
            }[]
        }[]
    }[]
}>()
</script>

<template>
    <!-- For items prop (non-sectioned) -->
    <SidebarGroup v-if="items">
        <SidebarGroupLabel>Menü</SidebarGroupLabel>
        <SidebarMenu>
            <Collapsible v-for="item in items" :key="item.title" as-child :default-open="item.isActive">
                <SidebarMenuItem>
                    <SidebarMenuButton as-child :tooltip="item.title">
                        <NuxtLink :to="item.url">
                            <component :is="item.icon" />
                            <span class="font-semibold text-gray-600">{{ item.title }}</span>
                        </NuxtLink>
                    </SidebarMenuButton>
                    <template v-if="item.items?.length">
                        <CollapsibleTrigger as-child>
                            <SidebarMenuAction class="data-[state=open]:rotate-90">
                                <ChevronRight />
                                <span class="sr-only">Toggle</span>
                            </SidebarMenuAction>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                                    <Collapsible v-if="subItem.items?.length" as-child>
                                        <div class="flex flex-1 min-w-0">
                                            <SidebarMenuSubButton as-child>
                                                <NuxtLink :to="subItem.url" class="min-w-0">
                                                    <TooltipProvider :delay-duration="0">
                                                        <Tooltip>
                                                            <TooltipTrigger as-child>
                                                                <span class="truncate block">{{ subItem.title }}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="right">{{ subItem.title }}</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </NuxtLink>
                                            </SidebarMenuSubButton>
                                            <CollapsibleTrigger as-child>
                                                <SidebarMenuAction class="data-[state=open]:rotate-90">
                                                    <ChevronRight />
                                                    <span class="sr-only">Toggle</span>
                                                </SidebarMenuAction>
                                            </CollapsibleTrigger>
                                        </div>
                                        <CollapsibleContent>
                                            <SidebarMenuSub class="pl-4">
                                                <SidebarMenuSubItem v-for="nestedItem in subItem.items" :key="nestedItem.title">
                                                    <SidebarMenuSubButton as-child>
                                                        <NuxtLink :to="nestedItem.url" class="min-w-0">
                                                            <TooltipProvider :delay-duration="0">
                                                                <Tooltip>
                                                                    <TooltipTrigger as-child>
                                                                        <span class="truncate block">{{ nestedItem.title }}</span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="right">{{ nestedItem.title }}</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </NuxtLink>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                    <SidebarMenuSubButton v-else as-child>
                                        <NuxtLink :to="subItem.url" class="min-w-0">
                                            <TooltipProvider :delay-duration="0">
                                                <Tooltip>
                                                    <TooltipTrigger as-child>
                                                        <span class="truncate block">{{ subItem.title }}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right">{{ subItem.title }}</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </NuxtLink>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </template>
                </SidebarMenuItem>
            </Collapsible>
        </SidebarMenu>
    </SidebarGroup>

    <!-- For sections prop (grouped with headers) -->
    <template v-if="sections">
        <!-- Home Link -->
        <SidebarGroup v-if="sections[0]?.title === 'Home'">
            <SidebarMenu>
                <Collapsible v-for="item in sections[0].items" :key="item.title" as-child :default-open="item.isActive">
                    <SidebarMenuItem>
                        <SidebarMenuButton as-child :tooltip="item.title">
                            <NuxtLink :to="item.url">
                                <component :is="item.icon" />
                                <span>{{ item.title }}</span>
                            </NuxtLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>

        <!-- Other Sections -->
        <SidebarGroup v-for="section in sections" :key="section.title" v-show="section.title !== 'Home'">
            <SidebarGroupLabel>
                <div class="flex items-center gap-2">
                    <component v-if="section.icon" :is="section.icon" class="h-4 w-4" />
                    <span class="font-semibold">{{ section.title }}</span>
                </div>
            </SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible v-for="item in section.items" :key="item.title" as-child :default-open="item.isActive" class="group/collapsible">
                    <SidebarMenuItem>
                        <template v-if="item.items?.length">
                            <CollapsibleTrigger as-child>
                                <SidebarMenuButton :tooltip="item.title">
                                    <component v-if="item.icon" :is="item.icon" />
                                    <span>{{ item.title }}</span>
                                    <ChevronRight class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                                        <Collapsible v-if="subItem.items?.length" as-child>
                                            <div class="flex flex-1 min-w-0">
                                                <SidebarMenuSubButton as-child>
                                                    <NuxtLink :to="subItem.url" class="min-w-0">
                                                        <TooltipProvider :delay-duration="0">
                                                            <Tooltip>
                                                                <TooltipTrigger as-child>
                                                                    <span class="font-semibold text-gray-600 truncate block">{{ subItem.title }}</span>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="right">{{ subItem.title }}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </NuxtLink>
                                                </SidebarMenuSubButton>
                                                <CollapsibleTrigger as-child>
                                                    <SidebarMenuAction class="data-[state=open]:rotate-90">
                                                        <ChevronRight />
                                                        <span class="sr-only">Toggle</span>
                                                    </SidebarMenuAction>
                                                </CollapsibleTrigger>
                                            </div>
                                            <CollapsibleContent>
                                                <SidebarMenuSub class="pl-4">
                                                    <SidebarMenuSubItem v-for="nestedItem in subItem.items" :key="nestedItem.title">
                                                        <SidebarMenuSubButton as-child>
                                                            <NuxtLink :to="nestedItem.url" class="min-w-0">
                                                                <TooltipProvider :delay-duration="0">
                                                                    <Tooltip>
                                                                        <TooltipTrigger as-child>
                                                                            <span class="font-semibold text-gray-600 truncate block">{{ nestedItem.title }}</span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="right">{{ nestedItem.title }}</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </NuxtLink>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </Collapsible>
                                        <SidebarMenuSubButton v-else as-child>
                                            <NuxtLink :to="subItem.url" class="min-w-0">
                                                <TooltipProvider :delay-duration="0">
                                                    <Tooltip>
                                                        <TooltipTrigger as-child>
                                                            <span class="text-gray-600 truncate block">{{ subItem.title }}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right">{{ subItem.title }}</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </NuxtLink>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </template>
                        <SidebarMenuButton v-else as-child :tooltip="item.title">
                            <NuxtLink :to="item.url">
                                <component v-if="item.icon" :is="item.icon" />
                                <span>{{ item.title }}</span>
                            </NuxtLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    </template>
</template>
