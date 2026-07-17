<script setup lang="ts">
import jsPDF from 'jspdf'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const { data: jsonData } = await useFetch('/arastirma-universiteleri/arastirma_universiteleri.json', { server: false })

const mainKeys = computed(() => (jsonData.value ? Object.keys(jsonData.value as any) : []))
const selectedMain = ref('')
const selectedSub = ref('')
const chartRef = ref()

watch(
    () => jsonData.value,
    (val) => {
        if (val) {
            const mains = Object.keys(val as any)
            if (mains.length > 0) {
                selectedMain.value = mains[0]
                const arr = (val as any)[mains[0]]
                if (Array.isArray(arr)) {
                    const subs = arr.map((item: any) => item.column_0).filter((sub: any) => typeof sub === 'string' && !!sub)
                    if (subs.length > 0) {
                        selectedSub.value = subs[0]
                    }
                }
            }
        }
    },
    { immediate: true }
)

watch(
    () => selectedMain.value,
    (main) => {
        if (!jsonData.value || !main) return
        const arr = (jsonData.value as any)[main]
        if (!Array.isArray(arr)) return
        const subs = arr.map((item: any) => item.column_0).filter((sub: any) => typeof sub === 'string' && !!sub)
        if (main === 'ARAŞTIRMA_KALİTESİ') {
            // 2.1 ile başlayan alt başlık
            const found = subs.find((s: string) => s.trim().startsWith('2.1'))
            selectedSub.value = found || subs[0] || ''
        } else if (main !== '' && main !== 'ARAŞTIRMA_KALİTESİ') {
            // 3.1 ile başlayan alt başlık
            const found = subs.find((s: string) => s.trim().startsWith('3.1'))
            selectedSub.value = found || subs[0] || ''
        } else {
            selectedSub.value = subs[0] || ''
        }
    },
    { immediate: true }
)

const subKeys = computed(() => {
    if (!jsonData.value || !selectedMain.value) return []
    const arr = (jsonData.value as any)[selectedMain.value]
    if (!Array.isArray(arr)) return []
    return arr.map((item: any) => item.column_0).filter((sub: any) => typeof sub === 'string' && !!sub)
})
const valueType = ref<'count' | 'rate'>('count')
const interactionMainKey = 'ETKİLEŞİM_VE_İŞBİRLİĞİ'

const isInteractionFirstMetric = computed(() => {
    if (!jsonData.value || selectedMain.value !== interactionMainKey || !selectedSub.value) return false
    const arr = (jsonData.value as any)[interactionMainKey]
    return Array.isArray(arr) && arr[0]?.column_0 === selectedSub.value
})

function getActiveValueType() {
    return isInteractionFirstMetric.value ? 'count' : valueType.value
}

// Para birimi içeren veri kontrolü
const isMoneyType = computed(() => {
    if (!jsonData.value || !selectedMain.value || !selectedSub.value) return false
    const subItem = (jsonData.value as any)[selectedMain.value].find((item: any) => item.column_0 === selectedSub.value)
    if (!subItem) return false
    return Object.keys(subItem).some((key) => key !== 'column_0' && typeof subItem[key] === 'string' && subItem[key].includes('₺'))
})

// Para stringini sayıya çevirmew
function parseMoneyString(str: string): number {
    if (!str) return 0
    return Number(
        str
            .replace(/[^0-9,]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
    )
}

// ARWU aralığını ortalama değere dönüştür
function parseARWUValue(val: string): number | null {
    if (!val || val === '-') return null
    const match = val.match(/(\d+)-(\d+)/)
    if (match) {
        const min = Number(match[1])
        const max = Number(match[2])
        return (min + max) / 2
    }
    // Tek sayı ise direkt döndür
    const num = Number(val)
    return isNaN(num) ? null : num
}

const chartTypes = [
    { value: 'area', label: 'Çizgi' },
    { value: 'bar', label: 'Bar' }
]
const chartType = ref('area')

// Grafik rengi sabit
const mainColor = computed(() => '#2563eb')

const option = computed(() => {
    if (!jsonData.value || !selectedMain.value || !selectedSub.value) return null
    const subItem = (jsonData.value as any)[selectedMain.value].find((item: any) => item.column_0 === selectedSub.value)
    if (!subItem) return null

    // 2.6. Dünya Akademik Genel Başarı Sıralamalarındaki Performansı için özel çoklu çizgi grafik
    if (selectedSub.value.trim().startsWith('2.6')) {
        const years = Object.keys(subItem)
            .filter((k) => k !== 'column_0')
            .sort()
        // Her sıralama için ayrı dizi
        const theData = years.map((yil) => {
            const v = subItem[yil]?.THE
            return v && v !== '-' ? Number(v) : null
        })
        const qsData = years.map((yil) => {
            const v = subItem[yil]?.QS
            return v && v !== '-' ? Number(v) : null
        })
        const arwuData = years.map((yil) => {
            const v = subItem[yil]?.ARWU
            return v && v !== '-' ? parseARWUValue(v) : null
        })
        const isBar = chartType.value === 'bar'
        return {
            title: {
                text: cleanSubKey(selectedSub.value),
                left: 'center',
                textStyle: {
                    fontSize: 16,
                    fontWeight: 600,
                    width: 700,
                    overflow: 'break'
                }
            },
            tooltip: {
                trigger: isBar ? 'item' : 'axis',
                backgroundColor: '#f9fafb',
                borderColor: '#2563eb',
                borderWidth: 1,
                textStyle: { color: '#1e293b', fontWeight: 500, fontSize: 14 },
                padding: 12,
                extraCssText: 'box-shadow: 0 4px 24px 0 rgba(37,99,235,0.10); border-radius: 10px;',
                formatter: function (params: any) {
                    if (!params) return ''
                    if (Array.isArray(params)) {
                        let html = `<div style='font-weight:600; margin-bottom:4px;'>${params[0].axisValue}</div>`
                        params.forEach((p: any) => {
                            html += `<div><span style='color:${p.color}; font-weight:500;'>${p.seriesName}: ${p.data ?? '-'} </span></div>`
                        })
                        return html
                    } else {
                        // bar için tekli
                        return `<div style='font-weight:600; margin-bottom:4px;'>${params.name}</div><div><span style='color:${params.color}; font-weight:500;'>${params.seriesName}: ${params.data ?? '-'}</span></div>`
                    }
                }
            },
            legend: { show: true, top: 32, data: ['THE', 'QS', 'ARWU'] },
            grid: { left: 30, right: 10, top: 60, bottom: 40, containLabel: true },
            xAxis: {
                type: 'category',
                data: years,
                boundaryGap: isBar,
                axisLine: { lineStyle: { color: '#d1d5db' } },
                axisLabel: { color: '#374151', fontSize: 12, interval: 0, rotate: 30 }
            },
            yAxis: {
                type: 'value',
                inverse: !isBar, // Bar grafik için false, çizgi grafik için true
                axisLine: { lineStyle: { color: '#d1d5db' } },
                splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
                axisLabel: { color: '#374151', fontSize: 12 }
            },
            series: [
                {
                    name: 'THE',
                    data: theData,
                    type: isBar ? 'bar' : 'line',
                    barGap: 0,
                    barMaxWidth: isBar ? 32 : undefined,
                    smooth: !isBar,
                    symbol: isBar ? 'rect' : 'circle',
                    symbolSize: 8,
                    lineStyle: !isBar ? { width: 4, color: '#2563eb', shadowColor: 'rgba(37,99,235,0.3)', shadowBlur: 8 } : undefined,
                    itemStyle: { color: '#2563eb', shadowColor: 'rgba(37,99,235,0.3)', shadowBlur: 8 },
                    emphasis: { focus: 'series' }
                },
                {
                    name: 'QS',
                    data: qsData,
                    type: isBar ? 'bar' : 'line',
                    barGap: 0,
                    barMaxWidth: isBar ? 32 : undefined,
                    smooth: !isBar,
                    symbol: isBar ? 'rect' : 'circle',
                    symbolSize: 8,
                    lineStyle: !isBar ? { width: 4, color: '#f59e42', shadowColor: 'rgba(245,158,66,0.3)', shadowBlur: 8 } : undefined,
                    itemStyle: { color: '#f59e42', shadowColor: 'rgba(245,158,66,0.3)', shadowBlur: 8 },
                    emphasis: { focus: 'series' }
                },
                {
                    name: 'ARWU',
                    data: arwuData,
                    type: isBar ? 'bar' : 'line',
                    barGap: 0,
                    barMaxWidth: isBar ? 32 : undefined,
                    smooth: !isBar,
                    symbol: isBar ? 'rect' : 'circle',
                    symbolSize: 8,
                    lineStyle: !isBar ? { width: 4, color: '#10b981', shadowColor: 'rgba(16,185,129,0.3)', shadowBlur: 8 } : undefined,
                    itemStyle: { color: '#10b981', shadowColor: 'rgba(16,185,129,0.3)', shadowBlur: 8 },
                    emphasis: { focus: 'series' }
                }
            ],
            animationDuration: 1200,
            animationEasing: 'cubicOut' as const
        }
    }
    // Yılları ve değerleri ayır
    const years = Object.keys(subItem)
        .filter((k) => k !== 'column_0')
        .sort()
    const values = years.map((yil) => {
        const val = subItem[yil]
        const activeValueType = getActiveValueType()
        if (isMoneyType.value) {
            // para ise stringi sayıya çevir
            return typeof val === 'string' ? parseMoneyString(val) : val
        }
        if (val && typeof val === 'object' && activeValueType in val) return val[activeValueType]
        if (typeof val === 'number') return val
        if (!isNaN(Number(val))) return Number(val)
        return null
    })

    // Grafik türüne
    const isArea = chartType.value === 'area'
    const isBar = chartType.value === 'bar'

    return {
        title: {
            text: `${selectedSub.value ? cleanSubKey(selectedSub.value) : ''}${chartTitleTypeText.value}`,
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 600,
                width: 700, // veya ihtiyaca göre 600-800 arası bir değer
                overflow: 'break'
            }
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#f9fafb',
            borderColor: '#2563eb',
            borderWidth: 1,
            textStyle: { color: '#1e293b', fontWeight: 500, fontSize: 14 },
            padding: 12,
            extraCssText: 'box-shadow: 0 4px 24px 0 rgba(37,99,235,0.10); border-radius: 10px;',
            formatter: function (params: any) {
                if (!params || !params.length) return ''
                const p = params[0]
                const year = p.axisValue
                const value = p.data
                const subItem =
                    jsonData.value && selectedMain.value && selectedSub.value ? ((jsonData.value as any)[selectedMain.value] || []).find((item: any) => item.column_0 === selectedSub.value) : null
                let oran = ''
                let aciklama = ''
                if (subItem && subItem[year]) {
                    if (typeof subItem[year] === 'object') {
                        oran = subItem[year].rate !== undefined ? subItem[year].rate : ''
                        aciklama = subItem[year].original !== undefined ? subItem[year].original : ''
                    } else if (typeof subItem[year] === 'string') {
                        aciklama = subItem[year]
                    }
                }
                // para ise yazırmak için
                if (isMoneyType.value) {
                    return `
            <div style="font-weight:600; margin-bottom:4px;">${year}</div>
            <div><span style="color:#2563eb; font-weight:500;">${aciklama}</span></div>
          `
                }
                return `
          <div style="font-weight:600; margin-bottom:4px;">${year}</div>
          <div><span style="color:#2563eb; font-weight:500;">${value}</span> ${getActiveValueType() === 'count' ? 'adet' : 'oran'}</div>
          ${oran !== '' && getActiveValueType() === 'count' && !isInteractionFirstMetric.value ? `<div class='text-xs text-gray-500'>Oran: <b>${oran}</b></div>` : ''}
          ${aciklama && aciklama !== value && !isInteractionFirstMetric.value ? `<div class='text-xs text-gray-400 mt-1'>${aciklama}</div>` : ''}
        `
            }
        },
        legend: { show: false },
        grid: { left: 30, right: 10, top: 60, bottom: 40, containLabel: true },
        xAxis: {
            type: 'category',
            data: years,
            boundaryGap: isBar,
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#374151', fontSize: 12, interval: 0, rotate: 30 }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#d1d5db' } },
            splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
            axisLabel: {
                color: '#374151',
                fontSize: 12,
                formatter: isMoneyType.value ? '{value} ₺' : '{value}'
            }
        },
        series: [
            {
                data: values,
                type: isBar ? 'bar' : 'line',
                barMaxWidth: isBar ? 48 : undefined,
                smooth: false,
                symbol: isBar ? 'rect' : 'circle',
                symbolSize: 8,
                lineStyle: isBar
                    ? undefined
                    : {
                          width: 4,
                          color: mainColor.value,
                          shadowColor: 'rgba(37,99,235,0.3)',
                          shadowBlur: 8
                      },
                itemStyle: {
                    color: mainColor.value,
                    shadowColor: 'rgba(37,99,235,0.3)',
                    shadowBlur: 8
                },
                areaStyle: isArea
                    ? {
                          color: {
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 0,
                              y2: 1,
                              colorStops: [
                                  { offset: 0, color: mainColor.value + '2d' },
                                  { offset: 1, color: mainColor.value + '08' }
                              ]
                          }
                      }
                    : undefined,
                emphasis: { focus: 'series' }
            }
        ],
        animationDuration: 1200,
        animationEasing: 'cubicOut' as const
    }
})

// boş veri kontrolü - uyarı
const hasData = computed(() => {
    if (!option.value) return false
    const series = option.value.series?.[0]?.data || []
    return Array.isArray(series) && series.some((v) => v !== null && v !== undefined && v !== '' && !isNaN(v))
})

// Hangi veri tipleri mevcut kontrolü
const availableValueTypes = computed(() => {
    if (!jsonData.value || !selectedMain.value || !selectedSub.value) return []
    const arr = (jsonData.value as any)[selectedMain.value]
    const subItem = arr.find((item: any) => item.column_0 === selectedSub.value)
    if (!subItem) return []
    if (isInteractionFirstMetric.value) return ['count']
    // Yıllar üzerinden bak
    const years = Object.keys(subItem).filter((k) => k !== 'column_0')
    let hasCount = false
    let hasRate = false
    for (const year of years) {
        const val = subItem[year]
        if (val && typeof val === 'object') {
            if (val.count !== undefined) hasCount = true
            if (val.rate !== undefined) hasRate = true
        }
    }
    return [hasCount ? 'count' : null, hasRate ? 'rate' : null].filter(Boolean)
})

watch(
    [availableValueTypes, selectedSub],
    ([types]) => {
        if (types.length === 1) {
            valueType.value = types[0] as 'count' | 'rate'
        }
    },
    { immediate: true }
)

function downloadChart() {
    if (chartRef.value) {
        const base64 = chartRef.value.getDataURL({
            type: 'png',
            backgroundColor: '#fff',
            pixelRatio: 2
        })
        const link = document.createElement('a')
        link.href = base64
        link.download = 'chart.png'
        link.click()
    }
}

function downloadPDF() {
    if (chartRef.value) {
        const base64 = chartRef.value.getDataURL({
            type: 'png',
            backgroundColor: '#fff',
            pixelRatio: 2
        })
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'a4'
        })
        pdf.addImage(base64, 'PNG', 40, 40, 700, 400)
        pdf.save('chart.pdf')
    }
}

function formatMainKey(key: string) {
    return key.replace(/_/g, ' ')
}

function cleanSubKey(key: string) {
    if (!key || typeof key !== 'string') return ''
    return key
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/(^|\s)\S/g, (l) => l.toUpperCase())
}

function formatValueTypeLabel(type: string) {
    if (type === 'count') return 'Sayı'
    if (type === 'rate') return 'Oran'
    return type
}

const chartTitleTypeText = computed(() => {
    if (isMoneyType.value) return ' (Fon Tutarı ₺)'
    if (jsonData.value && selectedMain.value && selectedSub.value) {
        const arr = (jsonData.value as any)[selectedMain.value]
        const subItem = arr.find((item: any) => item.column_0 === selectedSub.value)
        if (subItem) {
            const years = Object.keys(subItem).filter((k) => k !== 'column_0')
            const allNumbers = years.every((y) => typeof subItem[y] === 'number' && !isNaN(subItem[y]))
            if (allNumbers) {
                const key = selectedSub.value.toLowerCase()
                if (key.includes('oran') || key.includes('%') || key.includes('rate') || key.includes('yüzde')) {
                    return ' (Oran)'
                }
                if (key.includes('sayı') || key.includes('adet') || key.includes('count') || key.includes('number')) {
                    return ' (Adet)'
                }
                // Eğer oran veya sayı kelimesi yoksa, mevcut mantıkla devam
                return availableValueTypes.value.length === 1 ? (availableValueTypes.value[0] === 'count' ? ' (Adet)' : ' (Oran)') : getActiveValueType() === 'count' ? ' (Adet)' : ' (Oran)'
            }
        }
    }
    if (availableValueTypes.value.length === 1) {
        return availableValueTypes.value[0] === 'count' ? ' (Adet)' : ' (Oran)'
    }
    return getActiveValueType() === 'count' ? ' (Adet)' : ' (Oran)'
})
</script>

<template>
    <div class="p-4 sm:p-8 mx-auto w-full">
        <h1 class="text-2xl sm:text-3xl font-semibold mb-4 flex items-center gap-2">Araştırma Üniversiteleri Göstergeleri</h1>

        <Card class="w-full max-w-full overflow-x-auto transition-all duration-300 ease-in-out relative">
            <CardHeader class="space-y-4 pb-4">
                <div class="flex flex-col sm:flex-row gap-3 w-full">
                    <select v-model="selectedMain" class="w-full min-h-[48px] text-base px-4 py-3 rounded border focus:ring-2 focus:ring-blue-200">
                        <option v-for="main in mainKeys" :key="main" :value="main">{{ formatMainKey(main) }}</option>
                    </select>
                    <select v-model="selectedSub" class="w-full min-h-[48px] text-base px-4 py-3 rounded border focus:ring-2 focus:ring-blue-200">
                        <option v-for="sub in subKeys" :key="sub" :value="sub" class="truncate">{{ cleanSubKey(sub) }}</option>
                    </select>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 items-center w-full">
                    <span class="w-full sm:w-auto mb-1 sm:mb-0">Grafik Türü:</span>
                    <div class="flex flex-row gap-2 w-full sm:w-auto">
                        <Button
                            v-for="type in chartTypes"
                            :key="type.value"
                            :variant="chartType === type.value ? 'default' : 'outline'"
                            size="sm"
                            :class="chartType === type.value ? 'bg-black text-white border-black' : ''"
                            @click="chartType = type.value"
                        >
                            {{ type.label }}
                        </Button>
                    </div>
                    <div class="flex-1"></div>
                    <div class="w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button size="sm" variant="outline" class="flex items-center gap-2 shadow-sm rounded-lg font-semibold transition-all duration-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                                    </svg>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem @click="downloadPDF">PDF</DropdownMenuItem>
                                <DropdownMenuItem @click="downloadChart">PNG</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            <CardContent class="flex flex-col items-center justify-center flex-1 pt-0">
                <Transition name="fade-slide" mode="out-in">
                    <template v-if="option && hasData">
                        <div class="w-full flex flex-col items-center flex-1">
                            <VChart
                                :key="`chart-${selectedMain}-${selectedSub}-${valueType}-${chartType}`"
                                ref="chartRef"
                                :option="option"
                                style="height: 100%; width: 100%; min-height: 400px; min-width: 0"
                                autoresize
                                class="transition-all duration-300 min-w-0 flex-1"
                            />

                            <div v-if="!isMoneyType && availableValueTypes.length > 1" class="flex gap-4 text-sm mt-4 justify-center w-full">
                                <label class="flex items-center gap-1 cursor-pointer">
                                    <input v-model="valueType" type="radio" value="count" class="accent-blue-600" :disabled="!availableValueTypes.includes('count')" />
                                    <span :class="valueType === 'count' ? 'text-blue-600 font-medium' : 'text-gray-600'">Sayı</span>
                                </label>
                                <label class="flex items-center gap-1 cursor-pointer">
                                    <input v-model="valueType" type="radio" value="rate" class="accent-blue-600" :disabled="!availableValueTypes.includes('rate')" />
                                    <span :class="valueType === 'rate' ? 'text-blue-600 font-medium' : 'text-gray-600'">Oran</span>
                                </label>
                            </div>
                            <div v-else-if="!isMoneyType && availableValueTypes.length === 1" class="flex gap-4 text-sm mt-4 justify-center w-full">
                                <span class="text-blue-600 font-medium">{{ formatValueTypeLabel(availableValueTypes[0]) }}</span>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="flex flex-col items-center justify-center text-center text-gray-500 gap-2 flex-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                            </svg>
                            <span class="font-medium">Bu aralıkta veya veri tipinde gösterilecek veri bulunamadı.</span>
                        </div>
                    </template>
                </Transition>
            </CardContent>
        </Card>
    </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition:
        opacity 0.5s,
        transform 0.5s;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(16px);
}
.fade-slide-enter-to,
.fade-slide-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
