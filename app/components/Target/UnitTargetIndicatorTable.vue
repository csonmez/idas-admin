<script setup lang="ts">
import { ref } from 'vue'
import { Check, X, Pen } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export interface UnitTargetIndicator {
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
    indicators: UnitTargetIndicator[]
    modelValue: Record<string, number | null>
    disabled?: boolean
    showActual?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: Record<string, number | null>]
    save: []
}>()

const editingIndicatorId = ref<string | null>(null)
const editValues = ref<{
    target: number | string | undefined
    actual: number | string | undefined
}>({
    target: undefined,
    actual: undefined
})
const isSaving = ref(false)

const startEdit = (indicator: UnitTargetIndicator) => {
    if (props.disabled) return
    editingIndicatorId.value = indicator.id
    const currentTarget = props.modelValue[indicator.id] ?? indicator.target
    editValues.value = {
        target: currentTarget ?? undefined,
        actual: indicator.actual ?? undefined
    }
}

const cancelEdit = () => {
    editingIndicatorId.value = null
    editValues.value = { target: undefined, actual: undefined }
}

const commitEdit = (indicatorId: string) => {
    const newValue = editValues.value.target !== undefined && editValues.value.target !== '' ? Number(editValues.value.target) : null
    const updated = { ...props.modelValue, [indicatorId]: newValue }
    emit('update:modelValue', updated)
    emit('save')
    cancelEdit()
}

const getStatusVariant = (actual: number | null, target: number | null) => {
    if (actual === null || target === null) return 'outline'
    if (actual >= target) return 'default'
    if (target > 0 && actual >= target * 0.7) return 'secondary'
    return 'destructive'
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
                    <col v-if="showActual" class="w-24" />
                    <col class="w-24" />
                    <col class="w-24" />
                </colgroup>
                <TableHeader>
                    <TableRow>
                        <TableHead class="text-sm">Gösterge</TableHead>
                        <TableHead class="text-center text-sm">Hedef</TableHead>
                        <TableHead v-if="showActual" class="text-center text-sm">Gerçekleşen</TableHead>
                        <TableHead class="text-center text-sm">Durum</TableHead>
                        <TableHead class="text-center text-sm">İşlem</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-for="indicator in indicators" :key="indicator.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell class="align-top">
                            <div class="flex flex-col gap-1 whitespace-normal">
                                <span class="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight break-words">{{ indicator.indicator }}</span>
                                <span v-if="indicator.description" class="text-xs text-gray-500 dark:text-gray-400 leading-tight break-words">
                                    {{ indicator.description }}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell class="text-center align-top">
                            <div v-if="editingIndicatorId === indicator.id">
                                <Input v-model="editValues.target" type="number" class="w-16 mx-auto text-center text-sm px-1" :min="0" :max="indicator.maxValue" />
                            </div>
                            <div v-else>
                                <span class="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                                    {{ modelValue[indicator.id] ?? indicator.target ?? '-' }}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell v-if="showActual" class="text-center align-top">
                            <div v-if="editingIndicatorId === indicator.id">
                                <Input v-model="editValues.actual" type="number" class="w-16 mx-auto text-center text-sm px-1" :min="0" :max="indicator.maxValue" />
                            </div>
                            <div v-else>
                                <span class="font-semibold text-green-600 dark:text-green-400 text-sm">
                                    {{ indicator.actual ?? '-' }}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell class="text-center align-top">
                            <Badge
                                v-if="indicator.actual != null && (modelValue[indicator.id] ?? indicator.target) != null"
                                :variant="getStatusVariant(indicator.actual, (modelValue[indicator.id] ?? indicator.target)!)"
                                class="text-xs px-2 py-0"
                            >
                                {{ getStatusText(indicator.actual, (modelValue[indicator.id] ?? indicator.target)!) }}
                            </Badge>
                            <span v-else class="text-gray-400 dark:text-gray-500 text-sm">-</span>
                        </TableCell>
                        <TableCell class="text-center align-top">
                            <div v-if="editingIndicatorId !== indicator.id">
                                <Button v-if="!disabled" size="icon" variant="ghost" class="h-7 w-7" @click="startEdit(indicator)">
                                    <Pen class="w-3 h-3" />
                                </Button>
                                <span v-else class="text-gray-400 text-sm">-</span>
                            </div>
                            <div v-else class="flex items-center justify-center gap-1">
                                <Button size="icon" class="h-7 w-7" :disabled="isSaving" @click="commitEdit(indicator.id)">
                                    <Check class="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="outline" class="h-7 w-7" :disabled="isSaving" @click="cancelEdit">
                                    <X class="w-3 h-3" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                    <TableRow v-if="indicators.length === 0">
                        <TableCell :colspan="showActual ? 5 : 4" class="text-center py-8 text-gray-500 dark:text-gray-400"> Bu kategoride gösterge bulunmuyor. </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>
</template>
