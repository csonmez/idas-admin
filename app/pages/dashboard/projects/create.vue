<script setup lang="ts">
import { Loader, ChevronsUpDownIcon, CheckIcon, SearchIcon, CalendarIcon } from 'lucide-vue-next'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import type { GenericObject, SubmissionHandler } from 'vee-validate'
import type { Project } from '@/types'
import { DateFormatter, getLocalTimeZone, today, parseDate } from '@internationalized/date'
import { toDate, createYearRange } from 'reka-ui/date'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface ProjectType {
    id: string
    code?: string
    name: string
}

const currentYear = new Date().getFullYear()

const zodSchema = z.object({
    title: z.string({ required_error: 'Proje başlığı zorunludur' }).min(2, 'Proje başlığı en az 2 karakter olmalı').max(255, 'Proje başlığı en fazla 255 karakter olabilir').trim(),
    projectTypeId: z.string({ required_error: 'Proje tipi zorunludur' }).uuid('Geçersiz proje tipi ID formatı'),
    totalBudget: z.number({ required_error: 'Toplam bütçe zorunludur' }).min(0, 'Toplam bütçe 0 veya daha büyük olmalıdır'),
    year: z.number({ required_error: 'Yıl zorunludur' }).min(2020, 'Yıl 2020 veya daha büyük olmalıdır').max(currentYear, `Yıl ${currentYear} veya daha küçük olmalıdır`),
    startDate: z.coerce.date({
        required_error: 'Başlangıç tarihi zorunludur',
        invalid_type_error: 'Geçerli bir başlangıç tarihi girin'
    }),
    endDate: z.coerce.date({ invalid_type_error: 'Geçerli bir bitiş tarihi girin' }).optional()
})
const formSchema = toTypedSchema(zodSchema)

const isLoading = ref(false)
const projectTypes = ref<ProjectType[]>([])
const selectedProjectTypeId = ref('')
const projectTypePopoverOpen = ref(false)
const projectTypeTriggerRef = ref<HTMLElement | null>(null)
const popoverWidth = ref<string | undefined>(undefined)
const projectTypeSearchQuery = ref('')
const defaultPlaceholder = today(getLocalTimeZone())
const dateFormatter = new DateFormatter('tr-TR', { dateStyle: 'long' })
const startDateCalendarValue = ref()
const endDateCalendarValue = ref()

const years = computed(() => {
    const arr: number[] = []
    for (let y = currentYear; y >= 2020; y--) arr.push(y)
    return arr
})
const calendarYearRange = computed(() =>
    createYearRange({
        start: parseDate('2020-01-01'),
        end: parseDate(`${currentYear + 10}-01-01`)
    })
)
const calendarMinDate = parseDate('2020-01-01')
const calendarMaxDate = computed(() => parseDate(`${currentYear + 10}-12-31`))

const selectedProjectType = computed(() => {
    return projectTypes.value.find((pt) => pt.id === selectedProjectTypeId.value)
})

const filteredProjectTypes = computed(() => {
    const query = projectTypeSearchQuery.value?.toLowerCase().trim() || ''
    if (!query) return projectTypes.value
    return projectTypes.value.filter((pt) => pt.name.toLowerCase().includes(query))
})

const updatePopoverWidth = () => {
    if (!projectTypeTriggerRef.value) return false
    try {
        const element = projectTypeTriggerRef.value instanceof HTMLElement ? projectTypeTriggerRef.value : null
        if (element && typeof element.getBoundingClientRect === 'function') {
            const rect = element.getBoundingClientRect()
            if (rect.width > 0) {
                popoverWidth.value = `${rect.width}px`
                return true
            }
        }
    } catch (error) {
        console.warn('Popover genişliği ölçülemedi:', error)
    }
    return false
}

const handleProjectTypeSelection = (projectTypeId: string) => {
    selectedProjectTypeId.value = projectTypeId === selectedProjectTypeId.value ? '' : projectTypeId
    projectTypePopoverOpen.value = false
}

const fetchProjectTypes = async () => {
    try {
        projectTypes.value = await useRequest<ProjectType[]>(`/manager/project-types`, {
            method: 'GET',
            query: { onlyData: true }
        })
    } catch (error) {
        console.error('Proje türleri yüklenemedi:', error)
        projectTypes.value = []
    }
}

const formatDateForApi = (date: Date | undefined): string | undefined => {
    if (!date) return undefined
    const d = date instanceof Date ? date : new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const onSubmit: SubmissionHandler<GenericObject, GenericObject, unknown> = async (values, { resetForm }) => {
    try {
        isLoading.value = true

        const body = {
            title: values.title,
            projectTypeId: values.projectTypeId,
            totalBudget: Number(values.totalBudget),
            year: Number(values.year),
            startDate: formatDateForApi(values.startDate as Date),
            endDate: values.endDate ? formatDateForApi(values.endDate as Date) : undefined
        }

        const projectResponse = await useRequest<Project>('/manager/projects', {
            method: 'POST',
            body
        })

        isLoading.value = false
        navigateTo(`/dashboard/projects/${projectResponse.id}?success=created`)
        resetForm()
    } catch (error) {
        console.error('Proje oluşturma hatası:', error)
        isLoading.value = false
    }
}

watch(projectTypePopoverOpen, (isOpen) => {
    if (isOpen) {
        nextTick(() => {
            updatePopoverWidth()
            requestAnimationFrame(() => updatePopoverWidth())
        })
    } else {
        popoverWidth.value = undefined
    }
})

onMounted(() => {
    fetchProjectTypes()
})
</script>

<template>
    <div class="relative w-full gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Proje Ekle</CardTitle>
            </CardHeader>
            <CardContent class="p-5">
                <Form class="grid gap-4" :validation-schema="formSchema" @submit="onSubmit">
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="title">
                        <FormItem>
                            <FormLabel for="title">Proje Başlığı</FormLabel>
                            <FormControl>
                                <Input id="title" type="text" placeholder="Proje başlığını yazınız" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="projectTypeId">
                        <FormItem>
                            <FormLabel for="projectTypeId">Proje Türü</FormLabel>
                            <FormControl>
                                <Popover v-model:open="projectTypePopoverOpen">
                                    <div ref="projectTypeTriggerRef" class="w-full">
                                        <PopoverTrigger as-child>
                                            <Button variant="outline" role="combobox" :aria-expanded="projectTypePopoverOpen" class="w-full justify-between" v-bind="componentField">
                                                {{ selectedProjectType?.name || 'Proje türü seçiniz...' }}
                                                <ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                    </div>
                                    <PopoverContent
                                        class="p-0"
                                        :style="
                                            popoverWidth
                                                ? {
                                                      width: popoverWidth,
                                                      minWidth: popoverWidth,
                                                      maxWidth: popoverWidth
                                                  }
                                                : {}
                                        "
                                    >
                                        <Command>
                                            <div class="flex h-9 items-center gap-2 border-b px-3">
                                                <SearchIcon class="size-4 shrink-0 opacity-50" />
                                                <Input
                                                    v-model="projectTypeSearchQuery"
                                                    placeholder="Proje türü ara..."
                                                    class="h-10 border-0 bg-transparent py-3 text-sm outline-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
                                                />
                                            </div>
                                            <CommandList>
                                                <CommandEmpty>Proje türü bulunamadı.</CommandEmpty>
                                                <CommandGroup v-if="filteredProjectTypes.length > 0">
                                                    <CommandItem
                                                        v-for="pt in filteredProjectTypes"
                                                        :key="pt.id"
                                                        :value="pt.name"
                                                        @select="
                                                            () => {
                                                                handleProjectTypeSelection(pt.id)
                                                                componentField.onChange(pt.id)
                                                            }
                                                        "
                                                    >
                                                        <CheckIcon :class="cn('mr-2 h-4 w-4', selectedProjectTypeId === pt.id ? 'opacity-100' : 'opacity-0')" />
                                                        {{ pt.name }}
                                                    </CommandItem>
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="totalBudget">
                        <FormItem>
                            <FormLabel for="totalBudget">Toplam Bütçe (TL)</FormLabel>
                            <FormControl>
                                <Input
                                    id="totalBudget"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    v-bind="componentField"
                                    @update:model-value="(v: string | number) => componentField.onChange(typeof v === 'number' ? v : v ? Number(v) : 0)"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="year">
                        <FormItem>
                            <FormLabel for="year">Proje Yılı</FormLabel>
                            <Select v-bind="componentField" class="w-full">
                                <FormControl>
                                    <SelectTrigger class="w-full">
                                        <SelectValue placeholder="Yıl seçiniz" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem v-for="year in years" :key="year" :value="year">
                                            {{ year }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="startDate">
                        <FormItem>
                            <FormLabel for="startDate">Başlangıç Tarihi</FormLabel>
                            <FormControl>
                                <Popover v-slot="{ close }">
                                    <PopoverTrigger as-child>
                                        <Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !componentField.modelValue && 'text-muted-foreground')">
                                            <CalendarIcon class="mr-2 h-4 w-4" />
                                            {{
                                                componentField.modelValue
                                                    ? dateFormatter.format(componentField.modelValue instanceof Date ? componentField.modelValue : new Date(componentField.modelValue))
                                                    : 'Tarih seçiniz'
                                            }}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent class="w-auto p-0" align="start">
                                        <Calendar
                                            locale="tr-TR"
                                            :model-value="startDateCalendarValue"
                                            :default-placeholder="defaultPlaceholder"
                                            :year-range="calendarYearRange"
                                            :min-value="calendarMinDate"
                                            :max-value="calendarMaxDate"
                                            layout="month-and-year"
                                            initial-focus
                                            @update:model-value="
                                                (v) => {
                                                    startDateCalendarValue = v
                                                    componentField.onChange(v ? toDate(v, getLocalTimeZone()) : undefined)
                                                    close()
                                                }
                                            "
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="endDate">
                        <FormItem>
                            <FormLabel for="endDate">Bitiş Tarihi (opsiyonel)</FormLabel>
                            <FormControl>
                                <Popover v-slot="{ close }">
                                    <PopoverTrigger as-child>
                                        <Button variant="outline" :class="cn('w-full justify-start text-left font-normal', !componentField.modelValue && 'text-muted-foreground')">
                                            <CalendarIcon class="mr-2 h-4 w-4" />
                                            {{
                                                componentField.modelValue
                                                    ? dateFormatter.format(componentField.modelValue instanceof Date ? componentField.modelValue : new Date(componentField.modelValue))
                                                    : 'Tarih seçiniz'
                                            }}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent class="w-auto p-0" align="start">
                                        <Calendar
                                            locale="tr-TR"
                                            :model-value="endDateCalendarValue"
                                            :default-placeholder="defaultPlaceholder"
                                            :year-range="calendarYearRange"
                                            :min-value="calendarMinDate"
                                            :max-value="calendarMaxDate"
                                            layout="month-and-year"
                                            initial-focus
                                            @update:model-value="
                                                (v) => {
                                                    endDateCalendarValue = v
                                                    componentField.onChange(v ? toDate(v, getLocalTimeZone()) : undefined)
                                                    close()
                                                }
                                            "
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <Button type="submit" class="w-full" :disabled="isLoading">
                        <Loader v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                        Projeyi Ekle
                    </Button>
                </Form>
            </CardContent>
        </Card>
    </div>
</template>
