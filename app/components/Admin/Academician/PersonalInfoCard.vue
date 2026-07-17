<script setup lang="ts">
import { Pen } from 'lucide-vue-next'
import type { User } from '~/types'

const props = defineProps<{
    user: User
}>()
const emit = defineEmits<{
    (e: 'update:user'): void
}>()

const isEditing = ref(false)
const isLoading = ref(false)
const titles = [
    { value: 'PROF', label: 'Profesör Doktor' },
    { value: 'ASSOC_PROF', label: 'Doçent Doktor' },
    { value: 'ASSIST_PROF', label: 'Doktor Öğretim Üyesi' },
    { value: 'RESEARCH_ASSIST', label: 'Araştırma Görevlisi' },
    { value: 'LECTURER', label: 'Öğretim Görevlisi' }
]
const formData = reactive({
    name: '',
    surname: '',
    email: '',
    title: ''
})
const getTitleLabel = computed(() => {
    return titles.find((t) => t.value === props.user?.title)?.label ?? props.user?.title ?? ''
})

const handleEdit = () => {
    formData.name = props.user.name ?? ''
    formData.surname = props.user.surname ?? ''
    formData.email = props.user.email ?? ''
    formData.title = props.user.title ?? ''
    isEditing.value = true
}
const handleSubmit = async () => {
    try {
        isLoading.value = true
        await useRequest(`/manager/users/${props.user.id}`, {
            method: 'PATCH',
            body: {
                name: formData.name,
                surname: formData.surname,
                email: formData.email,
                title: formData.title
            }
        })
        emit('update:user')

        $toast({ title: 'Başarılı', description: 'Akademisyen bilgileri güncellendi.' })
        isEditing.value = false
    } catch (error) {
        console.error(error)
        $toast({ title: 'Hata', description: 'Akademisyen bilgileri güncellenirken bir hata oluştu.', variant: 'destructive' })
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <Card>
        <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle>Akademisyen Bilgileri</CardTitle>
            <Button v-if="!isEditing" variant="outline" size="sm" @click="handleEdit">
                <Pen class="mr-2 h-4 w-4" />
                Düzenle
            </Button>
        </CardHeader>
        <CardContent>
            <Form v-if="isEditing" :initial-values="formData" @submit="handleSubmit">
                <div class="grid gap-4">
                    <FormField name="name">
                        <FormItem>
                            <FormLabel>Ad</FormLabel>
                            <FormControl>
                                <Input v-model="formData.name" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField name="surname">
                        <FormItem>
                            <FormLabel>Soyad</FormLabel>
                            <FormControl>
                                <Input v-model="formData.surname" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField name="email">
                        <FormItem>
                            <FormLabel>E-posta</FormLabel>
                            <FormControl>
                                <Input v-model="formData.email" type="email" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField name="title">
                        <FormItem>
                            <FormLabel>Ünvan</FormLabel>
                            <Select v-model="formData.title">
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ünvan seçiniz" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem v-for="title in titles" :key="title.value" :value="title.value">
                                        {{ title.label }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <div class="flex justify-end gap-4">
                        <Button variant="outline" type="button" :disabled="isLoading" @click="isEditing = false"> İptal </Button>
                        <Button type="submit" :loading="isLoading"> Kaydet </Button>
                    </div>
                </div>
            </Form>

            <div v-else class="grid gap-4">
                <div class="flex items-center gap-4 p-1">
                    <div class="grid gap-1">
                        <p class="font-medium leading-none">İsim Soyisim</p>
                    </div>
                    <div class="ml-auto font-medium">{{ user?.name + ' ' + user?.surname }}</div>
                </div>
                <div class="flex items-center gap-4 p-1">
                    <div class="grid gap-1">
                        <p class="font-medium leading-none">E-posta</p>
                    </div>
                    <div class="ml-auto font-medium">{{ user?.email }}</div>
                </div>
                <div class="flex items-center gap-4 p-1">
                    <div class="grid gap-1">
                        <p class="font-medium leading-none">Ünvan</p>
                    </div>
                    <div class="ml-auto font-medium">{{ getTitleLabel }}</div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
