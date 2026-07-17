<script setup lang="ts">
import { ref } from 'vue'
import { Check, X, Pen } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Indicator {
    id: string
    indicator: string
    description?: string
    target: number | null
    actual: number | null
    minValue: number
    maxValue: number
    weight: number
}

const props = defineProps<{
    indicators: Indicator[]
    year: number
    userTargetId: string
    categoryId: string
}>()

const emit = defineEmits<{
    refresh: []
}>()

// State
const editingIndicatorId = ref<string | null>(null)
const editValues = ref<{
    target: number | string | undefined
    actual: number | string | undefined
}>({
    target: undefined,
    actual: undefined
})
const isSaving = ref(false)

// Düzenleme başlat
const startEdit = (indicator: Indicator) => {
    editingIndicatorId.value = indicator.id
    editValues.value = {
        target: indicator.target ?? undefined,
        actual: indicator.actual ?? undefined
    }
}

// Düzenleme iptal
const cancelEdit = () => {
    editingIndicatorId.value = null
    editValues.value = { target: undefined, actual: undefined }
}

// Kaydet
const saveEdit = async (indicatorId: string) => {
    try {
        isSaving.value = true

        await useRequest(`/manager/user-targets/${props.userTargetId}/indicators/${indicatorId}`, {
            method: 'PATCH',
            body: {
                target: editValues.value.target !== undefined ? Number(editValues.value.target) : null,
                actual: editValues.value.actual !== undefined ? Number(editValues.value.actual) : null
            }
        })

        $toast({
            title: 'Başarılı',
            description: 'Gösterge değerleri güncellendi.'
        })

        emit('refresh')
        cancelEdit()
    } catch (error) {
        console.error('Güncelleme hatası:', error)
        $toast({
            title: 'Hata',
            description: 'Değerler güncellenirken bir hata oluştu.',
            variant: 'destructive'
        })
    } finally {
        isSaving.value = false
    }
}

// Durum hesaplama
const getStatusVariant = (actual: number | null, target: number | null) => {
    if (actual === null || target === null) return 'outline'
    if (actual >= target) return 'default' // Yeşil
    if (actual >= target * 0.7) return 'secondary' // Sarı
    return 'destructive' // Kırmızı
}

const getStatusText = (actual: number | null, target: number | null) => {
    if (actual === null || target === null) return '-'
    const percentage = Math.round((actual / target) * 100)
    if (actual >= target) return `✓ %${percentage}`
    return `%${percentage}`
}
</script>

<template>
    <div class="border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
            <Table class="table-fixed w-full">
                <colgroup>
                    <col class="w-[280px]" />
                    <col class="w-24" />
                    <col class="w-24" />
                    <col class="w-24" />
                    <col class="w-24" />
                </colgroup>
                <TableHeader>
                    <TableRow>
                        <TableHead class="text-sm">Gösterge</TableHead>
                        <TableHead class="text-center text-sm">Hedef</TableHead>
                        <TableHead class="text-center text-sm">Gerçekleşen</TableHead>
                        <TableHead class="text-center text-sm">Durum</TableHead>
                        <TableHead class="text-center text-sm">İşlem</TableHead>
                    </TableRow>
                </TableHeader>

            <TableBody>
                <TableRow v-for="indicator in indicators" :key="indicator.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <!-- Gösterge Adı -->
                    <TableCell class="align-top">
                        <div class="flex flex-col gap-1 whitespace-normal">
                            <span class="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight break-words">{{ indicator.indicator }}</span>
                            <span v-if="indicator.description" class="text-xs text-gray-500 dark:text-gray-400 leading-tight break-words">
                                {{ indicator.description }}
                            </span>
                        </div>
                    </TableCell>

                    <!-- Target Değeri -->
                    <TableCell class="text-center align-top">
                        <div v-if="editingIndicatorId === indicator.id">
                            <Input 
                                v-model="editValues.target" 
                                type="number" 
                                class="w-16 mx-auto text-center text-sm px-1" 
                                :min="0" 
                                :max="indicator.maxValue"
                            />
                        </div>
                        <div v-else>
                            <span class="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                                {{ indicator.target ?? '-' }}
                            </span>
                        </div>
                    </TableCell>

                    <!-- Actual Değeri -->
                    <TableCell class="text-center align-top">
                        <div v-if="editingIndicatorId === indicator.id">
                            <Input 
                                v-model="editValues.actual" 
                                type="number" 
                                class="w-16 mx-auto text-center text-sm px-1" 
                                :min="0" 
                                :max="indicator.maxValue"
                            />
                        </div>
                        <div v-else>
                            <span class="font-semibold text-green-600 dark:text-green-400 text-sm">
                                {{ indicator.actual ?? '-' }}
                            </span>
                        </div>
                    </TableCell>

                    <!-- Durum Badge -->
                    <TableCell class="text-center align-top">
                        <Badge 
                            v-if="indicator.actual !== null && indicator.target !== null" 
                            :variant="getStatusVariant(indicator.actual, indicator.target)"
                            class="text-xs px-2 py-0"
                        >
                            {{ getStatusText(indicator.actual, indicator.target) }}
                        </Badge>
                        <span v-else class="text-gray-400 dark:text-gray-500 text-sm">-</span>
                    </TableCell>

                    <!-- İşlem Butonları -->
                    <TableCell class="text-center align-top">
                        <!-- Düzenleme Modu DEĞİL -->
                        <div v-if="editingIndicatorId !== indicator.id">
                            <Button size="icon" variant="ghost" class="h-7 w-7" @click="startEdit(indicator)">
                                <Pen class="w-3 h-3" />
                            </Button>
                        </div>

                        <!-- Düzenleme Modu -->
                        <div v-else class="flex items-center justify-center gap-1">
                            <Button size="icon" class="h-7 w-7" @click="saveEdit(indicator.id)" :disabled="isSaving">
                                <Check class="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="outline" class="h-7 w-7" @click="cancelEdit()" :disabled="isSaving">
                                <X class="w-3 h-3" />
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>

                <!-- Empty State -->
                <TableRow v-if="indicators.length === 0">
                    <TableCell colspan="5" class="text-center py-8 text-gray-500 dark:text-gray-400"> Bu kategoride gösterge bulunmuyor. </TableCell>
                </TableRow>
            </TableBody>
        </Table>
        </div>
    </div>
</template>
