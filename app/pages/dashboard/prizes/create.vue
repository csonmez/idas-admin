<script setup lang="ts">
import { Loader, CalendarIcon } from 'lucide-vue-next'
import { toTypedSchema } from '@vee-validate/zod'
import type { GenericObject, SubmissionHandler } from 'vee-validate'
import type { Prize } from '@/types'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import * as z from 'zod'
import { parseDate } from '@internationalized/date'

const zodSchema = z.object({
    title: z.string({ required_error: 'Lütfen ödül başlığını yazınız.' }).min(1, 'Ödül başlığı boş olamaz').trim(),
    type: z.string().optional(),
    date: z.string().optional(),
    year: z.number().optional()
})
const formSchema = toTypedSchema(zodSchema)

const isLoading = ref(false)

const years = ref<number[]>([])
const currentYear = new Date().getFullYear()
for (let year = 2000; year <= currentYear; year++) {
    years.value.unshift(year)
}

const onSubmit: SubmissionHandler<GenericObject, GenericObject, unknown> = async (values, { resetForm }) => {
    try {
        isLoading.value = true
        const body: Record<string, any> = {}
        if (values.title) body.title = values.title
        if (values.type) body.type = values.type
        if (values.date) body.date = new Date(values.date).toISOString()
        if (values.year) body.year = Number(values.year)

        const prizeResponse = await useRequest<Prize>('/manager/prizes', {
            method: 'POST',
            body
        })
        isLoading.value = false
        navigateTo(`/dashboard/prizes/detail/${prizeResponse.id}`)
        resetForm()
    } catch (error) {
        console.error('Ödül oluşturma hatası:', error)
        isLoading.value = false
    }
}
</script>

<template>
    <div class="relative w-full gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Ödül Ekle</CardTitle>
            </CardHeader>
            <CardContent class="p-5">
                <Form class="grid gap-4" :validation-schema="formSchema" @submit="onSubmit">
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="title">
                        <FormItem>
                            <FormLabel>Ödül Başlığı</FormLabel>
                            <FormControl>
                                <Input type="text" placeholder="Ödül başlığını yazınız" v-bind="componentField" required />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="type">
                        <FormItem>
                            <FormLabel>Ödül Türü <span class="text-muted-foreground text-xs"></span></FormLabel>
                            <FormControl>
                                <Input type="text" placeholder="Ödül türünü yazınız" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ value, handleChange }" class="grid gap-2" name="date">
                        <FormItem>
                            <FormLabel>Ödül Tarihi <span class="text-muted-foreground text-xs"></span></FormLabel>
                            <Popover>
                                <PopoverTrigger as-child>
                                    <Button variant="outline" class="w-full justify-start text-left font-normal" :class="!value && 'text-muted-foreground'">
                                        <CalendarIcon class="mr-2 h-4 w-4" />
                                        {{ value ? new Date(value).toLocaleDateString('tr-TR') : 'Tarih seçiniz' }}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent class="w-auto p-0" align="start">
                                    <Calendar
                                        :model-value="value ? parseDate(value.split('T')[0]) : undefined"
                                        @update:model-value="(v) => handleChange(v ? v.toString() : '')"
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" class="grid gap-2" name="year">
                        <FormItem>
                            <FormLabel>Yıl</FormLabel>
                            <Select v-bind="componentField" class="w-full" :model-value="componentField.modelValue?.toString()" @update:model-value="(v) => componentField['onUpdate:modelValue']?.(v ? Number(v) : undefined)">
                                <FormControl>
                                    <SelectTrigger class="w-full">
                                        <SelectValue placeholder="Yıl seçiniz" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem v-for="year in years" :key="year" :value="year.toString()">
                                            {{ year }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <Button type="submit" class="w-full" :disabled="isLoading">
                        <Loader v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                        Ödülü Ekle
                    </Button>
                </Form>
            </CardContent>
        </Card>
    </div>
</template>
