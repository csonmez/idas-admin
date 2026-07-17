<script setup lang="ts">
import type { User, ListType } from '@/types'

const props = defineProps<{
    open: boolean
    year: number
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'added'): void
}>()

let searchTimer: ReturnType<typeof setTimeout> | null = null

const userSearch = ref('')
const userResults = ref<User[]>([])
const selectedUser = ref<User | null>(null)
const selectedYear = ref(props.year)
const selectedListTypes = ref<ListType[]>([])
const comment = ref('')
const loading = ref(false)
const searchLoading = ref(false)
const errors = ref<Record<string, string>>({})

const listTypeOptions: { value: ListType; label: string }[] = [
    { value: 'UNIVERSITY', label: 'Üniversite' },
    { value: 'FACULTY', label: 'Fakülte' },
    { value: 'DEPARTMENT', label: 'Bölüm' },
    { value: 'DISCIPLINE', label: 'Anabilim Dalı' }
]

const searchUsers = async () => {
    if (userSearch.value.length < 3) {
        userResults.value = []
        return
    }
    searchLoading.value = true
    try {
        const response = await useRequest<{ rows: User[] }>('/manager/users', {
            method: 'GET',
            query: { search: userSearch.value, limit: 8 }
        })
        userResults.value = response?.rows || []
    } catch {
        userResults.value = []
    } finally {
        searchLoading.value = false
    }
}

watch(userSearch, (value) => {
    if (searchTimer) clearTimeout(searchTimer)
    if (!value.trim()) {
        userResults.value = []
        return
    }
    searchTimer = setTimeout(searchUsers, 300)
})

const selectUser = (user: User) => {
    selectedUser.value = user
    userSearch.value = `${user.name} ${user.surname}`
    userResults.value = []
}

const toggleListType = (lt: ListType) => {
    const idx = selectedListTypes.value.indexOf(lt)
    if (idx === -1) {
        selectedListTypes.value.push(lt)
    } else {
        selectedListTypes.value.splice(idx, 1)
    }
}

const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!selectedUser.value) errs.user = 'Akademisyen seçimi zorunludur.'
    if (selectedListTypes.value.length === 0) errs.listTypes = 'En az bir kapsam seçilmelidir.'
    if (!comment.value.trim()) errs.comment = 'Yorum zorunludur.'
    errors.value = errs
    return Object.keys(errs).length === 0
}

const handleClose = () => {
    userSearch.value = ''
    userResults.value = []
    selectedUser.value = null
    selectedYear.value = props.year
    selectedListTypes.value = []
    comment.value = ''
    errors.value = {}
    emit('update:open', false)
}

const handleSubmit = async () => {
    if (!validate()) return
    loading.value = true
    try {
        await useRequest('/manager/performance-awards/manual', {
            method: 'POST',
            body: {
                userId: selectedUser.value!.id,
                year: selectedYear.value,
                listTypes: selectedListTypes.value,
                comment: comment.value.trim()
            }
        })
        $toast({
            title: 'Kullanıcı eklendi',
            description: `${selectedUser.value!.name} ${selectedUser.value!.surname} performans ödül listesine eklendi.`
        })
        handleClose()
        emit('added')
    } catch (error: any) {
        const code = error?.data?.code
        if (code === 'DUPLICATE') {
            $toast({
                title: 'Zaten mevcut',
                description: 'Bu kullanıcı bu yıl için zaten ödüllü.',
                variant: 'destructive'
            })
        } else {
            $toast({
                title: 'Hata',
                description: error?.data?.message || 'Kullanıcı eklenemedi.',
                variant: 'destructive'
            })
        }
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <Dialog :open="open" @update:open="handleClose">
        <DialogContent class="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Manuel Ödül Ekle</DialogTitle>
                <DialogDescription>Akademisyeni otomatik hesaplama dışında manuel olarak ödül listesine ekleyin.</DialogDescription>
            </DialogHeader>

            <div class="space-y-4 py-2">
                <!-- Akademisyen Arama -->
                <div class="space-y-1.5">
                    <label class="text-sm font-medium">Akademisyen <span class="text-red-500">*</span></label>
                    <div class="relative">
                        <Input v-model="userSearch" type="text" placeholder="İsim veya e-posta ile ara (min. 3 karakter)..." :class="errors.user ? 'border-red-400' : ''" />
                        <div v-if="searchLoading" class="absolute right-3 top-1/2 -translate-y-1/2">
                            <span class="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent inline-block" />
                        </div>
                        <div v-if="userResults.length > 0" class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <button
                                v-for="user in userResults"
                                :key="user.id"
                                class="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 last:border-0"
                                @click="selectUser(user)"
                            >
                                <span class="font-medium">{{ user.name }} {{ user.surname }}</span>
                                <span class="text-gray-400 ml-2 text-xs">{{ user.email }}</span>
                            </button>
                        </div>
                    </div>
                    <p v-if="errors.user" class="text-xs text-red-500">{{ errors.user }}</p>
                </div>

                <!-- Yıl -->
                <div class="space-y-1.5">
                    <label class="text-sm font-medium">Yıl <span class="text-red-500">*</span></label>
                    <Input v-model.number="selectedYear" type="number" :min="2020" :max="2030" class="w-32" />
                </div>

                <!-- Kapsam Seçimi -->
                <div class="space-y-1.5">
                    <label class="text-sm font-medium">Kapsam <span class="text-red-500">*</span></label>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="opt in listTypeOptions"
                            :key="opt.value"
                            :class="`px-3 py-1.5 rounded border text-sm font-medium transition-colors ${
                                selectedListTypes.includes(opt.value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                            }`"
                            @click="toggleListType(opt.value)"
                        >
                            {{ opt.label }}
                        </button>
                    </div>
                    <p v-if="errors.listTypes" class="text-xs text-red-500">{{ errors.listTypes }}</p>
                </div>

                <!-- Yorum -->
                <div class="space-y-1.5">
                    <label class="text-sm font-medium">Yorum <span class="text-red-500">*</span></label>
                    <Textarea v-model="comment" placeholder="Manuel ekleme gerekçesini açıklayın..." rows="3" :class="errors.comment ? 'border-red-400' : ''" />
                    <p v-if="errors.comment" class="text-xs text-red-500">{{ errors.comment }}</p>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" :disabled="loading" @click="handleClose">İptal</Button>
                <Button :disabled="loading" @click="handleSubmit">
                    <span v-if="loading" class="flex items-center gap-2">
                        <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Ekleniyor...
                    </span>
                    <span v-else>Ekle</span>
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
