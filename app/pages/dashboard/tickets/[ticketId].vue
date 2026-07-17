<script setup lang="ts">
import { CloudDownload, CornerDownLeft } from 'lucide-vue-next'
import type { Ticket, TicketMessage, User } from '~/types'

const route = useRoute()
const { user } = useAuth()

const ticketTitle = ref('')
const ticketStatus = ref('')
const isOpenAlertDialog = ref(false)
const messages = ref<TicketMessage[]>([])
const isLoading = ref(false)
const form = ref({ ticket: '', message: '' })
const scrollContainer = ref()

const isFormValid = computed(() => form.value.message && form.value.message.trim().length > 0)

const scrollToBottom = () => {
    nextTick(() => {
        if (scrollContainer.value) {
            scrollContainer.value.scrollIntoView({ block: 'end' })
        }
    })
}
const sendMessage = async () => {
    if (!form.value.message) {
        console.log('Mesaj boş')
        return
    }

    if (!ticket.value?.id) {
        console.log('Ticket ID bulunamadı')
        return
    }

    try {
        isLoading.value = true

        const message = await useRequest<TicketMessage>(`/manager/tickets/${route.params.ticketId}/reply`, {
            method: 'POST',
            body: {
                message: form.value.message
            }
        })

        isLoading.value = false
        form.value.message = ''
        messages.value.push({
            ...message,
            isFromAdmin: true,
            user: {
                id: (user.value as User).id,
                name: (user.value as User).name || 'ARDEK',
                surname: (user.value as User).surname || '',
                email: (user.value as User).email,
                title: (user.value as User).title || undefined
            }
        })
        scrollToBottom()
    } catch (error) {
        console.error('Mesaj gönderme hatası:', error)
        isLoading.value = false
        $toast({
            title: 'Bir hata meydana geldi.',
            description: 'Lütfen daha sonra tekrar deneyiniz.'
        })
    }
}
const downloadFile = async (messageId: string, file: { name: string; path: string }) => {
    try {
        const blob = await useRequest<Blob>(`/manager/tickets/messages/${messageId}/files/${encodeURIComponent(file.path)}`, {
            method: 'GET',
            responseType: 'blob'
        })

        const blobWithType = new Blob([blob], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blobWithType)
        const newWindow = window.open(url, '_blank')

        if (!newWindow) {
            const link = document.createElement('a')
            link.href = url
            link.target = '_blank'
            link.download = file.name
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                window.URL.revokeObjectURL(url)
                document.body.removeChild(link)
            }, 5000)
        } else {
            setTimeout(() => {
                window.URL.revokeObjectURL(url)
            }, 5000)
        }
    } catch (error) {
        console.error('İndirme hatası:', error)
        $toast({
            title: 'Bir hata meydana geldi.',
            description: 'Lütfen daha sonra tekrar deneyiniz.'
        })
    }
}
const updateTicketStatus = async () => {
    try {
        isOpenAlertDialog.value = false
        await useRequest(`/manager/tickets/${route.params.ticketId}/status`, {
            method: 'PATCH',
            body: { status: ticketStatus.value }
        })
        $toast({
            title: 'Başarılı',
            description: 'Talep durumu başarıyla güncellendi.'
        })
    } catch {
        $toast({
            title: 'Bir hata meydana geldi.',
            description: 'Lütfen daha sonra tekrar deneyiniz.'
        })
    }
}
const getFileName = (fileName: string, limit = 25) => {
    if (fileName.length <= limit) {
        return fileName
    }

    return fileName.substring(0, limit).trim() + '...'
}

const { data: ticket } = await useAsyncData(`ticket-${route.params.ticketId}`, () =>
    useRequest<Ticket>(`/manager/tickets/${route.params.ticketId}`, {
        method: 'GET'
    })
)

watch(ticketStatus, () => {
    if (!ticket.value) return
    isOpenAlertDialog.value = ticketStatus.value !== ticket.value?.status
})

watch(
    ticket,
    (newTicket) => {
        if (newTicket) {
            ticketTitle.value = newTicket.title.length > 100 ? `${newTicket.title.slice(0, 100)}...` : newTicket.title
            ticketStatus.value = newTicket.status
            form.value.ticket = newTicket.id
            messages.value = newTicket.ticketMessages || []
            nextTick(() => {
                scrollToBottom()
            })
        }
    },
    { immediate: true }
)
</script>

<template>
    <main class="flex flex-1 flex-col gap-4 p-4 md:grid-cols-1 lg:grid-cols-1">
        <div class="flex justify-between items-center">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink as-child>
                            <NuxtLink to="/dashboard/tickets">Talepler</NuxtLink>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage class="truncate" :title="ticket?.title"> {{ ticketTitle }} </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <Select v-model="ticketStatus" :disabled="ticket?.status === 'CLOSED'">
                <SelectTrigger class="w-72">
                    <SelectValue placeholder="Talep Durumu" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="PENDING"> Bekliyor </SelectItem>
                        <SelectItem value="IN_PROGRESS"> İşleniyor </SelectItem>
                        <SelectItem value="COMPLETED"> Tamamlandı </SelectItem>
                        <SelectItem v-if="ticket?.status === 'CLOSED'" value="CLOSED"> Kapatıldı </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            <AlertDialog v-model:open="isOpenAlertDialog">
                <AlertDialogTrigger as-child />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle> Talep durumunu değiştirmek istediğinize emin misiniz? </AlertDialogTitle>
                        <AlertDialogDescription>
                            <b>"{{ ticket?.title }}"</b> başlıklı destek talebinin durumunu değiştirmek istediğinize emin misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction @click="updateTicketStatus">Onayla</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        <div class="relative flex h-full flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2">
            <ScrollArea class="h-full">
                <div ref="scrollContainer" class="flex-1">
                    <Card v-for="message in messages" :key="message.id" :class="!message.isFromAdmin ? 'mr-auto' : 'ml-auto'" class="w-3/5 my-4 shadow-md">
                        <CardHeader>
                            <CardTitle class="flex justify-between items-center">
                                <NuxtLink class="text-sm" :to="`/dashboard/academicians/${message.user.id}`">
                                    {{ !message.isFromAdmin ? formatUserName(message.user) : 'ARDEK' }}
                                </NuxtLink>
                                <span class="text-sm font-light">{{ new Date(message.createdAt).toLocaleString() }}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{{ message.message }}</p>
                            <div v-if="message.files && message.files.length" class="mt-4 bg-gray-100 p-4 rounded-lg">
                                <ul class="divide-y divide-gray-200">
                                    <li v-for="(file, index) in message.files" :key="index" class="flex items-center justify-between py-2">
                                        <div class="flex items-center">
                                            <span class="text-gray-700">{{ getFileName(file.name, 50) }}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <Button variant="link" class="text-blue-500 hover:text-blue-700 mr-2" @click="downloadFile(message.id, file)">
                                                <CloudDownload class="size-5" />
                                            </Button>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
            <form class="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring mt-4" @submit.prevent="sendMessage">
                <Label for="message" class="sr-only"> Mesaj </Label>
                <Textarea
                    id="message"
                    v-model="form.message"
                    placeholder="Mesajınızı yazınız."
                    class="min-h-32 resize-none border-0 p-4 shadow-none focus-visible:ring-0 w-full"
                    :disabled="isLoading || ticket?.status === 'CLOSED'"
                />
                <div class="flex items-center p-3 pt-0">
                    <Button type="submit" size="sm" class="ml-auto gap-1.5" :disabled="isLoading || !isFormValid || ticket?.status === 'CLOSED'">
                        {{ isLoading ? 'Gönderiliyor...' : 'Gönder' }}
                        <CornerDownLeft class="size-3.5" />
                    </Button>
                </div>
            </form>
        </div>
    </main>
</template>
