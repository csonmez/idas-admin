<script setup lang="ts">
import { Loader } from 'lucide-vue-next'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import type { GenericObject, SubmissionHandler } from 'vee-validate'
import type { CompanyDetailResponse } from '@/types'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const zodSchema = z.object({
    name: z.string({ required_error: 'Firma adı zorunludur.' }).trim().min(1, 'Firma adı zorunludur.'),
    taxNumber: z.string({ required_error: 'Vergi numarası zorunludur.' }).trim().regex(/^\d{10,11}$/, 'Vergi numarası 10 veya 11 haneli olmalıdır.'),
    companyRegistrationNumber: z.string().trim().optional(),
    tradeRegistryNumber: z.string().trim().optional(),
    address: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email('Geçerli bir e-posta giriniz.').optional().or(z.literal('')),
    website: z.string().trim().url('Geçerli bir web adresi giriniz.').optional().or(z.literal(''))
})
const formSchema = toTypedSchema(zodSchema)

const isLoading = ref(false)

const onSubmit: SubmissionHandler<GenericObject, GenericObject, unknown> = async (values, { resetForm }) => {
    try {
        isLoading.value = true
        const body: Record<string, any> = {
            name: values.name,
            taxNumber: values.taxNumber
        }
        if (values.companyRegistrationNumber) body.companyRegistrationNumber = values.companyRegistrationNumber
        if (values.tradeRegistryNumber) body.tradeRegistryNumber = values.tradeRegistryNumber
        if (values.address) body.address = values.address
        if (values.phone) body.phone = values.phone
        if (values.email) body.email = values.email
        if (values.website) body.website = values.website

        const res = await useRequest<CompanyDetailResponse>('/companies', { method: 'POST', body })
        isLoading.value = false
        navigateTo(`/dashboard/companies/${res.company.id}?success=created`)
        resetForm()
    } catch (error) {
        console.error('Firma oluşturma hatası:', error)
        isLoading.value = false
    }
}
</script>

<template>
    <div class="relative w-full gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Firma Ekle</CardTitle>
            </CardHeader>
            <CardContent class="p-5">
                <Form class="grid gap-4" :validation-schema="formSchema" @submit="onSubmit">
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="name">
                        <FormItem>
                            <FormLabel for="name">Firma Adı</FormLabel>
                            <FormControl>
                                <Input id="name" type="text" placeholder="Firma adını yazınız" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="taxNumber">
                        <FormItem>
                            <FormLabel for="taxNumber">Vergi Numarası</FormLabel>
                            <FormControl>
                                <Input id="taxNumber" type="text" placeholder="10 veya 11 haneli" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="companyRegistrationNumber">
                        <FormItem>
                            <FormLabel for="companyRegistrationNumber">Sicil No <span class="text-muted-foreground text-xs">(opsiyonel)</span></FormLabel>
                            <FormControl>
                                <Input id="companyRegistrationNumber" type="text" placeholder="Sicil numarası" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="tradeRegistryNumber">
                        <FormItem>
                            <FormLabel for="tradeRegistryNumber">Ticaret Sicil No <span class="text-muted-foreground text-xs">(opsiyonel)</span></FormLabel>
                            <FormControl>
                                <Input id="tradeRegistryNumber" type="text" placeholder="Ticaret sicil numarası" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="address">
                        <FormItem>
                            <FormLabel for="address">Adres <span class="text-muted-foreground text-xs">(opsiyonel)</span></FormLabel>
                            <FormControl>
                                <Input id="address" type="text" placeholder="Adres" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="phone">
                        <FormItem>
                            <FormLabel for="phone">Telefon <span class="text-muted-foreground text-xs">(opsiyonel)</span></FormLabel>
                            <FormControl>
                                <Input id="phone" type="text" placeholder="Telefon" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="email">
                        <FormItem>
                            <FormLabel for="email">E-posta <span class="text-muted-foreground text-xs">(opsiyonel)</span></FormLabel>
                            <FormControl>
                                <Input id="email" type="text" placeholder="ornek@firma.com" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="website">
                        <FormItem>
                            <FormLabel for="website">Web Sitesi <span class="text-muted-foreground text-xs">(opsiyonel)</span></FormLabel>
                            <FormControl>
                                <Input id="website" type="text" placeholder="https://..." v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <Button type="submit" class="w-full" :disabled="isLoading">
                        <Loader v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                        Firmayı Ekle
                    </Button>
                </Form>
            </CardContent>
        </Card>
    </div>
</template>
