<script setup lang="ts">
import type { TargetIndicator, TargetData } from '~/types'
import { useDebounceFn } from '@vueuse/core'
import { Info } from 'lucide-vue-next'

const props = defineProps<{
    indicators?: TargetIndicator[]
    targetId?: string
    modelValue: Record<string, number | null>
    historyData: Record<number, TargetData[]>
    isCompleted?: boolean
    isOnlyShown?: boolean
    from?: string
    hasModifications?: boolean
}>()

const emit = defineEmits(['next', 'prev', 'update:modelValue', 'getHistoryData', 'update:hasModifications'])

const debouncedModelValue = ref(props.modelValue)
const isOnlyShown = computed(() => props.isOnlyShown)
const kltIndicators = computed(() => (props.from === 'user' ? props.indicators?.filter((i) => i.isAcademicianIndicator) : props.indicators))

const onSubmit = (e: Event) => {
    e.preventDefault()
    emit('next')
}
const updateValue = (value: string | number, id: string) => {
    const numValue = typeof value === 'string' ? (value ? Number(value) : null) : value
    emit('update:modelValue', { ...props.modelValue, [id]: numValue })
    emit('update:hasModifications', true)
}
const formatCurrency = (value: number, isMobile = false) => {
    const formatted = new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: isMobile ? 0 : 2,
        maximumFractionDigits: isMobile ? 0 : 2,
        notation: isMobile ? 'compact' : 'standard'
    }).format(value)

    return isMobile ? formatted.replace('B', 'Mn') : formatted
}
const getHistoryValue = (year: number, targetId: string | undefined, indicatorId: string) => {
    if (!targetId) return '-'

    const yearData = props.historyData[year]
    const target = yearData.find((t) => t.targetId === targetId)
    const indicator = target?.indicators.find((i) => i.indicatorId === indicatorId)

    const value = (isOnlyShown.value && year === 2025) || year === 2026 ? indicator?.target : indicator?.actual

    // Return '-' if value is explicitly '-' (not calculated)
    if (value === '-') return '-'

    // Return 0 if value is 0 (calculated but zero)
    if (value === 0) return 0

    // If value is undefined or null, return '-'
    if (value === undefined || value === null) return '-'

    const currentIndicator = props.indicators?.find((i) => i.id === indicatorId)
    const isMobile = window.innerWidth < 768

    if (currentIndicator?.inputType === 'money') {
        return `₺${formatCurrency(value as number, isMobile)}`
    } else if (currentIndicator?.inputType === 'percentage') {
        return `%${value}`
    }

    return value
}
const calculateChange = (currentValue: number, previousValue: number) => {
    if (!previousValue) return null
    const change = ((currentValue - previousValue) / previousValue) * 100
    return change ?? 0
}
const getChangeValue = (year: number, targetId: string | undefined, indicatorId: string) => {
    if (!targetId) return null

    const yearData = props.historyData[year]
    const prevYearData = props.historyData[year - 1]

    const target = yearData?.find((t) => t.targetId === targetId)
    const prevTarget = prevYearData?.find((t) => t.targetId === targetId)

    const indicator = target?.indicators.find((i) => i.indicatorId === indicatorId)
    const prevIndicator = prevTarget?.indicators.find((i) => i.indicatorId === indicatorId)

    const value = (isOnlyShown.value && year === 2025) || year === 2026 ? indicator?.target : indicator?.actual
    const prevValue = year === 2026 ? prevIndicator?.target : prevIndicator?.actual

    if (!value || !prevValue) return null

    return calculateChange(value as number, prevValue as number)
}
const formatChange = (change: number | null) => {
    if (!change) return ''

    const formattedValue = new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'never'
    }).format(Math.abs(change))

    const sign = change > 0 ? '+' : '-'
    return `${sign}%${formattedValue}`
}
const calculateInputChange = (year: number, targetId: string | undefined, indicatorId: string) => {
    if (!targetId || !debouncedModelValue.value[indicatorId]) return null

    const yearData = props.historyData[year]
    const target = yearData?.find((t) => t.targetId === targetId)
    const indicator = target?.indicators.find((i) => i.indicatorId === indicatorId)

    if (!indicator?.actual) return null

    return calculateChange(debouncedModelValue.value[indicatorId]!, indicator.actual as number)
}
const getTargetValue = (year: number, targetId: string | undefined, indicatorId: string) => {
    if (!targetId) return null

    const yearData = props.historyData[year]
    const target = yearData?.find((t) => t.targetId === targetId)
    const indicator = target?.indicators.find((i) => i.indicatorId === indicatorId)

    if (!indicator?.target || indicator.target === '-') return null

    const currentIndicator = props.indicators?.find((i) => i.id === indicatorId)
    const isMobile = window.innerWidth < 768

    if (currentIndicator?.inputType === 'money') {
        return `₺${formatCurrency(indicator.target as number, isMobile)}`
    } else if (currentIndicator?.inputType === 'percentage') {
        return `%${indicator.target}`
    }

    return indicator.target
}

watch(
    () => props.modelValue,
    useDebounceFn((newValue) => {
        debouncedModelValue.value = newValue
    }, 400)
)
</script>

<template>
    <div class="mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>2. Araştırma Kalitesi</CardTitle>
            </CardHeader>
            <CardContent class="p-5">
                <form @submit="onSubmit">
                    <table class="w-full">
                        <thead>
                            <tr class="text-sm font-semibold">
                                <th class="text-left w-[25%]">Gösterge</th>
                                <th class="text-center w-[10%]">2023</th>
                                <th class="text-center w-[5%]"></th>
                                <th class="text-center w-[10%]">2024</th>
                                <th class="text-center w-[5%]"></th>
                                <th class="text-center w-[10%]">
                                    2025
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger type="button">
                                                <Info class="w-4 h-4 inline-block align-text-bottom ms-1" />
                                            </TooltipTrigger>
                                            <TooltipContent class="max-w-[400px] p-4">
                                                <p class="text-sm leading-relaxed">
                                                    Verilerin elde edildiği kaynaklarda (örn. Web of Science) yılın ilk aylarında güncellemeler yoğun bir şekilde gerçekleştiği için 2025 yılına ilişkin
                                                    veriler (özellikle yayın verileri) güncel olmayabilir. İlgili veriler kaynağından periyodik olarak çekilecek ve güncellenecektir. Bu nedenle 2026
                                                    yılına ilişkin hedefler girilirken bu durumun göz önünde bulundurulması önem arz etmektedir.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </th>
                                <th class="text-center w-[5%]"></th>
                                <th class="text-center w-[10%]">2026</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in kltIndicators" :key="item.id" class="border-b">
                                <td class="py-4 text-sm">
                                    <span class="font-bold">
                                        {{ !item.subIndicatorType || item.subIndicatorType === 'a' ? 'KLT' + item.indicatorGroup + '.' : '' }}
                                    </span>
                                    <span class="font-bold mx-1" :class="{ 'md:ms-12': item.subIndicatorType && item.subIndicatorType === 'b' }">
                                        {{ item.subIndicatorType ? item.subIndicatorType + ')' : '' }}
                                    </span>
                                    <span>{{ item.indicator }}</span>
                                </td>
                                <td>
                                    <div class="flex justify-center items-center">
                                        <span>{{ getHistoryValue(2023, targetId, item.id) }}</span>
                                    </div>
                                </td>

                                <td>
                                    <div class="flex justify-center items-center">
                                        <span
                                            v-if="getChangeValue(2024, targetId, item.id) !== null"
                                            class="text-xs"
                                            :class="{
                                                'text-green-600': getChangeValue(2024, targetId, item.id)! > 0,
                                                'text-red-600': getChangeValue(2024, targetId, item.id)! < 0
                                            }"
                                        >
                                            {{ formatChange(getChangeValue(2024, targetId, item.id)) }}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex justify-center items-center">
                                        <span>{{ getHistoryValue(2024, targetId, item.id) }}</span>
                                    </div>
                                </td>

                                <td>
                                    <div class="flex justify-center items-center">
                                        <span
                                            v-if="getChangeValue(2025, targetId, item.id) !== null"
                                            class="text-xs"
                                            :class="{
                                                'text-green-600': getChangeValue(2025, targetId, item.id)! > 0,
                                                'text-red-600': getChangeValue(2025, targetId, item.id)! < 0
                                            }"
                                        >
                                            {{ formatChange(getChangeValue(2025, targetId, item.id)) }}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex flex-col justify-center items-center">
                                        <span>{{ getHistoryValue(2025, targetId, item.id) }}</span>
                                        <span v-if="getTargetValue(2025, targetId, item.id)" class="text-xs text-gray-500">({{ getTargetValue(2025, targetId, item.id) }})</span>
                                    </div>
                                </td>

                                <td v-if="isOnlyShown">
                                    <div class="flex justify-center items-center">
                                        <span
                                            v-if="getChangeValue(2026, targetId, item.id) !== null"
                                            class="text-xs"
                                            :class="{
                                                'text-green-600': getChangeValue(2026, targetId, item.id)! > 0,
                                                'text-red-600': getChangeValue(2026, targetId, item.id)! < 0
                                            }"
                                        >
                                            {{ formatChange(getChangeValue(2026, targetId, item.id)) }}
                                        </span>
                                    </div>
                                </td>
                                <td v-else>
                                    <div class="flex justify-center items-center">
                                        <span
                                            v-if="calculateInputChange(2025, targetId, item.id) !== null"
                                            class="text-xs"
                                            :class="{
                                                'text-green-600': calculateInputChange(2025, targetId, item.id)! > 0,
                                                'text-red-600': calculateInputChange(2025, targetId, item.id)! < 0
                                            }"
                                        >
                                            {{ formatChange(calculateInputChange(2025, targetId, item.id)) }}
                                        </span>
                                    </div>
                                </td>

                                <td v-if="isOnlyShown">
                                    <div class="flex justify-center items-center">
                                        <span>{{ getHistoryValue(2026, targetId, item.id) }}</span>
                                    </div>
                                </td>
                                <td v-else>
                                    <div class="flex justify-center">
                                        <Input
                                            :id="item.id"
                                            type="number"
                                            :model-value="modelValue[item.id]?.toString()"
                                            :placeholder="'Hedef'"
                                            min="0"
                                            step="0.0001"
                                            class="text-center w-full h-8 px-2"
                                            :readonly="isCompleted"
                                            @update:model-value="(value) => updateValue(value, item.id)"
                                        />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="flex justify-end items-center mt-5 space-x-4">
                        <div class="flex items-center space-x-4">
                            <Button type="button" variant="outline" @click="emit('prev')">Geri</Button>
                            <Button type="submit">İleri</Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
</template>
