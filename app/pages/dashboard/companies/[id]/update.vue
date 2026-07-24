<script setup lang="ts">
import { Loader } from 'lucide-vue-next'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import type { GenericObject, SubmissionHandler } from 'vee-validate'
import type { CompanyDetailResponse } from '@/types'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const route = useRoute()
const companyId = route.params.id as string

const zodSchema = z.object({
    name: z.string().trim().min(1, 'Firma adı zorunludur.').optional(),
    taxNumber: z.string().trim().regex(/^\d{10,11}$/, 'Vergi numarası 10 veya 11 haneli olmalıdır.').optional(),
    companyRegistrationNumber: z.string().trim().optional(),
    tradeRegistryNumber: z.string().trim().optional(),
    address: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email('Geçerli bir e-posta giriniz.').optional().or(z.literal('')),
    website: z.string().trim().url('Geçerli bir web adresi giriniz.').optional().or(z.literal(''))
})
const formSchema = toTypedSchema(zodSchema)

const isLoading = ref(false)

const { data: company } = await useAsyncData(`company-update-${companyId}`, async () => {
    const res = await useRequest<CompanyDetailResponse>(`/companies/${companyId}`, { method: 'GET' })
    return res.company
})

const initialValues = computed(() => {
    if (!company.value) return {}
    return {
        name: company.value.name || '',
        taxNumber: company.value.taxNumber || '',
        companyRegistrationNumber: company.value.companyRegistrationNumber || '',
        tradeRegistryNumber: company.value.tradeRegistryNumber || '',
        address: company.value.address || '',
        phone: company.value.phone || '',
        email: company.value.email || '',
        website: company.value.website || ''
    }
})

const onSubmit: SubmissionHandler<GenericObject, GenericObject, unknown> = async (values, { resetForm }) => {
    try {
        isLoading.value = true
        const body: Record<string, any> = {}
        if (values.name) body.name = values.name
        if (values.taxNumber) body.taxNumber = values.taxNumber
        if (values.companyRegistrationNumber !== undefined) body.companyRegistrationNumber = values.companyRegistrationNumber || null
        if (values.tradeRegistryNumber !== undefined) body.tradeRegistryNumber = values.tradeRegistryNumber || null
        if (values.address !== undefined) body.address = values.address || null
        if (values.phone !== undefined) body.phone = values.phone || null
        if (values.email !== undefined) body.email = values.email || null
        if (values.website !== undefined) body.website = values.website || null

        await useRequest(`/companies/${companyId}`, { method: 'PATCH', body })
        $toast({ title: 'Firma güncellendi', description: 'Firma bilgileri başarıyla güncellendi.' })
        isLoading.value = false
        navigateTo(`/dashboard/companies/${companyId}`)
        resetForm()
    } catch (error) {
        console.error('Firma güncelleme hatası:', error)
        $toast({ title: 'Hata', description: 'Firma güncellenirken bir hata oluştu.', variant: 'destructive' })
        isLoading.value = false
    }
}
</script>

<template>
    <div class="relative w-full gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Firmayı Güncelle</CardTitle>
            </CardHeader>
            <CardContent class="p-5">
                <Form class="grid gap-4" :validation-schema="formSchema" :initial-values="initialValues" @submit="onSubmit">
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
                            <FormLabel for="companyRegistrationNumber">Sicil No</FormLabel>
                            <FormControl>
                                <Input id="companyRegistrationNumber" type="text" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="tradeRegistryNumber">
                        <FormItem>
                            <FormLabel for="tradeRegistryNumber">Ticaret Sicil No</FormLabel>
                            <FormControl>
                                <Input id="tradeRegistryNumber" type="text" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="address">
                        <FormItem>
                            <FormLabel for="address">Adres</FormLabel>
                            <FormControl>
                                <Input id="address" type="text" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="phone">
                        <FormItem>
                            <FormLabel for="phone">Telefon</FormLabel>
                            <FormControl>
                                <Input id="phone" type="text" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="email">
                        <FormItem>
                            <FormLabel for="email">E-posta</FormLabel>
                            <FormControl>
                                <Input id="email" type="text" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="website">
                        <FormItem>
                            <FormLabel for="website">Web Sitesi</FormLabel>
                            <FormControl>
                                <Input id="website" type="text" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <Button type="submit" class="w-full" :disabled="isLoading">
                        <Loader v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                        Firmayı Güncelle
                    </Button>
                </Form>
            </CardContent>
        </Card>
    </div>
</template>
