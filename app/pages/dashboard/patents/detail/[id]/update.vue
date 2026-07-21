<script setup lang="ts">
import { Loader, CalendarIcon } from 'lucide-vue-next'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import type { GenericObject, SubmissionHandler } from 'vee-validate'
import type { Patent } from '@/types'
import { DateFormatter, getLocalTimeZone, today, parseDate } from '@internationalized/date'
import { toDate, createYearRange } from 'reka-ui/date'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

const route = useRoute()
const patentId = route.params.id as string
const currentYear = new Date().getFullYear()

const zodSchema = z.object({
    title: z.string({ required_error: 'Lütfen patentin başlığını yazınız.' }).min(1, 'Patent başlığı boş olamaz').max(255).trim(),
    date: z.coerce
        .date({ required_error: 'Patent tarihi zorunludur', invalid_type_error: 'Geçerli bir patent tarihi girin' })
        .optional(),
    year: z
        .number({ required_error: 'Lütfen patent yılını seçiniz.' })
        .int()
        .min(1900, "Yıl 1900'den küçük olamaz")
        .max(currentYear + 1)
        .optional(),
    type: z.enum(['NATIONAL', 'INTERNATIONAL']).optional(),
    hasNationalCollaboration: z.boolean().optional().default(false),
    hasInternationalCollaboration: z.boolean().optional().default(false),
    hasIndustryCollaboration: z.boolean().optional().default(false)
})
const formSchema = toTypedSchema(zodSchema)

const isLoading = ref(false)
const defaultPlaceholder = today(getLocalTimeZone())
const dateFormatter = new DateFormatter('tr-TR', { dateStyle: 'long' })
const dateCalendarValue = ref()

const years = computed(() => {
    const arr: number[] = []
    for (let y = currentYear; y >= 1900; y--) arr.push(y)
    return arr
})

const calendarYearRange = computed(() =>
    createYearRange({
        start: parseDate('1900-01-01'),
        end: parseDate(`${currentYear + 1}-12-31`)
    })
)
const calendarMinDate = parseDate('1900-01-01')
const calendarMaxDate = computed(() => parseDate(`${currentYear + 1}-12-31`))

const formatDateForApi = (date: Date | undefined): string | undefined => {
    if (!date) return undefined
    const d = date instanceof Date ? date : new Date(date)
    // idas-api ISO datetime bekliyor (z.string().datetime()); takvim gününü koru
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00.000Z`
}

const onSubmit: SubmissionHandler<GenericObject, GenericObject, unknown> = async (values, { resetForm }) => {
    try {
        isLoading.value = true

        const body: Record<string, any> = {}
        if (values.title !== undefined) body.title = values.title
        if (values.date !== undefined) body.date = formatDateForApi(values.date as Date)
        if (values.year !== undefined) body.year = Number(values.year)
        if (values.type !== undefined) body.type = values.type
        body.hasNationalCollaboration = values.hasNationalCollaboration ?? false
        body.hasInternationalCollaboration = values.hasInternationalCollaboration ?? false
        body.hasIndustryCollaboration = values.hasIndustryCollaboration ?? false

        await useRequest<Patent>(`/patents/admin/${patentId}`, {
            method: 'PUT',
            body
        })

        isLoading.value = false
        navigateTo(`/dashboard/patents/detail/${patentId}?success=updated`)
        resetForm()
    } catch (error) {
        console.error('Patent güncelleme hatası:', error)
        isLoading.value = false
    }
}

const { data: patent } = await useAsyncData(
    `update-patent-${patentId}`,
    () =>
        useRequest<Patent>(`/patents/admin/${patentId}`, { method: 'GET' }),
    { server: true }
)

watchEffect(() => {
    if (patent.value?.date) {
        const d = new Date(patent.value.date)
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        try {
            dateCalendarValue.value = parseDate(iso)
        } catch {}
    }
})

const initialValues = computed(() => {
    if (!patent.value) return {}
    return {
        title: patent.value.title || '',
        date: patent.value.date ? new Date(patent.value.date) : undefined,
        year: patent.value.year || currentYear,
        type: patent.value.type || undefined,
        hasNationalCollaboration: patent.value.hasNationalCollaboration ?? false,
        hasInternationalCollaboration: patent.value.hasInternationalCollaboration ?? false,
        hasIndustryCollaboration: patent.value.hasIndustryCollaboration ?? false
    }
})
</script>

<template>
    <div class="relative w-full gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Patenti Güncelle</CardTitle>
            </CardHeader>
            <CardContent class="p-5">
                <Form class="grid gap-4" :validation-schema="formSchema" :initial-values="initialValues" @submit="onSubmit">

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="title">
                        <FormItem>
                            <FormLabel for="title">Patent Başlığı</FormLabel>
                            <FormControl>
                                <Input id="title" type="text" placeholder="Patent başlığını yazınız" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="type">
                        <FormItem>
                            <FormLabel for="type">Patent Türü</FormLabel>
                            <Select v-bind="componentField" class="w-full">
                                <FormControl>
                                    <SelectTrigger class="w-full">
                                        <SelectValue placeholder="Patent türü seçiniz..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="NATIONAL">Ulusal</SelectItem>
                                        <SelectItem value="INTERNATIONAL">Uluslararası</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="year">
                        <FormItem>
                            <FormLabel for="year">Patent Yılı</FormLabel>
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

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="date">
                        <FormItem>
                            <FormLabel for="date">Patent Tarihi</FormLabel>
                            <FormControl>
                                <Popover v-slot="{ close }">
                                    <PopoverTrigger as-child>
                                        <Button
                                            variant="outline"
                                            :class="cn('w-full justify-start text-left font-normal', !componentField.modelValue && 'text-muted-foreground')"
                                        >
                                            <CalendarIcon class="mr-2 h-4 w-4" />
                                            {{
                                                componentField.modelValue
                                                    ? dateFormatter.format(
                                                          componentField.modelValue instanceof Date
                                                              ? componentField.modelValue
                                                              : new Date(componentField.modelValue)
                                                      )
                                                    : 'Tarih seçiniz'
                                            }}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent class="w-auto p-0" align="start">
                                        <Calendar
                                            locale="tr-TR"
                                            :model-value="dateCalendarValue"
                                            :default-placeholder="defaultPlaceholder"
                                            :year-range="calendarYearRange"
                                            :min-value="calendarMinDate"
                                            :max-value="calendarMaxDate"
                                            layout="month-and-year"
                                            initial-focus
                                            @update:model-value="
                                                (val: any) => {
                                                    dateCalendarValue = val
                                                    if (val) {
                                                        componentField.onChange(toDate(val, getLocalTimeZone()))
                                                    } else {
                                                        componentField.onChange(undefined)
                                                    }
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

                    <FormField v-slot="{ value, handleChange }" type="checkbox" :value="true" :unchecked-value="false" name="hasNationalCollaboration">
                        <FormItem class="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox :model-value="value" @update:model-value="handleChange" />
                            </FormControl>
                            <FormLabel class="font-normal">Ulusal iş birliği ile alınan patent</FormLabel>
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ value, handleChange }" type="checkbox" :value="true" :unchecked-value="false" name="hasInternationalCollaboration">
                        <FormItem class="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox :model-value="value" @update:model-value="handleChange" />
                            </FormControl>
                            <FormLabel class="font-normal">Uluslararası iş birliği ile alınan patent</FormLabel>
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ value, handleChange }" type="checkbox" :value="true" :unchecked-value="false" name="hasIndustryCollaboration">
                        <FormItem class="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox :model-value="value" @update:model-value="handleChange" />
                            </FormControl>
                            <FormLabel class="font-normal">Sanayi iş birliği ile alınan patent</FormLabel>
                        </FormItem>
                    </FormField>

                    <Button type="submit" class="w-full" :disabled="isLoading">
                        <Loader v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                        Patenti Güncelle
                    </Button>

                </Form>
            </CardContent>
        </Card>
    </div>
</template>
