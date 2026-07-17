<script setup lang="ts">
interface StatsData {
    totals: {
        articles: number
        projects: number
        patents: number
        prizes: number
        academicians: number
    }
    byYear: {
        articles: Array<{ year: number; count: number }>
    }
    articlesQDistribution: {
        byYear: Array<{
            year: number
            Q1: number
            Q2: number
            Q3: number
            Q4: number
            noQ: number
        }>
    }
    academiciansByFaculty: Array<{
        facultyId: string
        facultyName: string
        count: number
    }>
}

const articleChartData = computed(() => {
    if (!stats.value?.byYear?.articles || !stats.value?.articlesQDistribution?.byYear) {
        return { years: [], totalCounts: [], q1Data: [], q2Data: [], q3Data: [], q4Data: [] }
    }

    // Toplam makale verileri (2026 hariç)
    const articlesByYear = [...stats.value.byYear.articles].filter((item) => item.year !== 2026).sort((a, b) => a.year - b.year)

    // Q dağılım verileri (2026 hariç, noQ olmadan)
    const qDistributionByYear = [...stats.value.articlesQDistribution.byYear].filter((item) => item.year !== 2026).sort((a, b) => a.year - b.year)

    const years = articlesByYear.map((item) => item.year.toString())

    return {
        years,
        totalCounts: articlesByYear.map((item) => item.count),
        q1Data: qDistributionByYear.map((item) => item.Q1),
        q2Data: qDistributionByYear.map((item) => item.Q2),
        q3Data: qDistributionByYear.map((item) => item.Q3),
        q4Data: qDistributionByYear.map((item) => item.Q4)
    }
})

const articleChartOption = computed(() => ({
    title: {
        text: 'Yıllara Göre Makale Sayıları ve Q Dağılımı',
        left: 'center'
    },
    tooltip: {
        trigger: 'axis',
        formatter: function (params: Array<{ name: string; marker: string; seriesName: string; value: number }>) {
            let result = params[0].name + '<br/>'
            params.forEach((param) => {
                result += param.marker + ' ' + param.seriesName + ': ' + param.value + '<br/>'
            })
            return result
        }
    },
    legend: {
        data: ['Toplam Makale', 'Q1', 'Q2', 'Q3', 'Q4'],
        bottom: 0
    },
    xAxis: {
        type: 'category',
        data: articleChartData.value.years
    },
    yAxis: {
        type: 'value',
        name: 'Makale Sayısı'
    },
    series: [
        {
            name: 'Toplam Makale',
            data: articleChartData.value.totalCounts,
            type: 'line',
            smooth: false,
            lineStyle: {
                width: 3,
                color: '#5470c6'
            },
            symbolSize: 8,
            z: 10
        },
        {
            name: 'Q1',
            data: articleChartData.value.q1Data,
            type: 'bar',
            color: '#91cc75'
        },
        {
            name: 'Q2',
            data: articleChartData.value.q2Data,
            type: 'bar',
            color: '#fac858'
        },
        {
            name: 'Q3',
            data: articleChartData.value.q3Data,
            type: 'bar',
            color: '#ee6666'
        },
        {
            name: 'Q4',
            data: articleChartData.value.q4Data,
            type: 'bar',
            color: '#73c0de'
        }
    ],
    grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
    }
}))

// Fakülte pasta grafiği için dinamik veri hazırlama
const facultyChartData = computed(() => {
    if (!stats.value?.academiciansByFaculty) return []

    // Hariç tutulacak fakülte ID'leri
    const excludedFacultyIds = ['de9c7394-1c5b-441e-8223-75e57844c3bc', 'ab5540a4-dc0c-4f49-9cf1-94acb39d55a2', '5babec82-d999-43a4-8d36-0e3937a0a0b9']

    return [...stats.value.academiciansByFaculty]
        .filter((faculty) => !excludedFacultyIds.includes(faculty.facultyId))
        .sort((a, b) => b.count - a.count)
        .map((faculty) => ({
            value: faculty.count,
            name: faculty.facultyName
                .replace(/FAKÜLTESİ|ENSTİTÜSÜ|YÜKSEKOKULU|MESLEK YÜKSEKOKULU/g, '')
                .replace(/SAĞLIK BİLİMLERİ/g, 'SAĞLIK BİL.')
                .replace(/İKTİSADİ VE İDARİ BİLİMLER/g, 'İİBF')
                .replace(/MÜHENDİSLİK/g, 'MÜH.')
                .replace(/VETERİNER/g, 'VET.')
                .replace(/EDEBİYAT/g, 'EDEB.')
                .replace(/İLETİŞİM/g, 'İLET.')
                .replace(/HAVACILIK VE UZAY BİLİMLERİ/g, 'HAVAC.')
                .replace(/DİŞ HEKİMLİĞİ/g, 'DİŞ HEK.')
                .replace(/YABANCI DİLLER/g, 'YAB. DİL')
                .replace(/GÜZEL SANATLAR/g, 'G. SANAT')
                .replace(/SPOR BİLİMLERİ/g, 'SPOR')
                .replace(/HALİL BAYRAKTAR SAĞLIK HİZMETLERİ/g, 'H.B. SAĞLIK')
                .trim()
        }))
})

const facultyChartOption = computed(() => ({
    title: {
        text: 'Fakültelere Göre Akademisyen Dağılımı',
        left: 'center'
    },
    tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
    },
    legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        data: facultyChartData.value.slice(0, 6).map((item) => item.name)
    },
    series: [
        {
            type: 'pie',
            radius: '70%',
            center: ['60%', '50%'],
            data: facultyChartData.value,
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            label: {
                show: false
            }
        }
    ]
}))

const { data: stats } = await useAsyncData<StatsData>('stats', () => useRequest('/manager/universities/stats'))
</script>

<template>
    <div class="flex flex-col gap-3 p-5 pt-0">
        <div class="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div class="bg-card border shadow p-4 min-h-[120px] rounded-xl flex flex-col justify-between">
                <h3 class="text-lg font-semibold">Toplam Akademisyen</h3>
                <div>
                    <p class="text-3xl font-bold">2107</p>
                </div>
            </div>
            <div class="bg-card border shadow p-4 min-h-[120px] rounded-xl flex flex-col justify-between">
                <h3 class="text-lg font-semibold">Toplam Fakülte / Enstitü</h3>
                <div>
                    <p class="text-3xl font-bold">19 / 8</p>
                </div>
            </div>
            <div class="bg-card border shadow p-4 min-h-[120px] rounded-xl flex flex-col justify-between">
                <h3 class="text-lg font-semibold">Toplam Yüksekokul / MYO</h3>
                <div>
                    <p class="text-3xl font-bold">1 / 1</p>
                </div>
            </div>
            <div class="bg-card border shadow p-4 min-h-[120px] rounded-xl flex flex-col justify-between">
                <h3 class="text-lg font-semibold">Toplam Araştırma Merkezi</h3>
                <div>
                    <p class="text-3xl font-bold">37</p>
                </div>
            </div>
        </div>
        <div class="bg-card border p-6 rounded-xl">
            <h3 class="text-xl font-semibold mb-4 mt-6">Faaliyetler Özeti</h3>

            <!-- Totals Kartları -->
            <div class="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <div class="bg-card border shadow p-4 min-h-[120px] rounded-xl flex flex-col justify-between">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold">Toplam Makale</h3>
                        <span class="text-sm text-gray-500">(2019-2025)</span>
                    </div>
                    <div>
                        <p class="text-3xl font-bold">8161</p>
                    </div>
                </div>
                <div class="bg-card border shadow p-4 min-h-[120px] rounded-xl flex flex-col justify-between">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold">Toplam Proje</h3>
                        <span class="text-sm text-gray-500">(2019-2025)</span>
                    </div>
                    <div>
                        <p class="text-3xl font-bold">389</p>
                    </div>
                </div>
                <div class="bg-card border shadow p-4 min-h-[120px] rounded-xl flex flex-col justify-between">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold">Toplam Patent</h3>
                        <span class="text-sm text-gray-500">(2022-2024)</span>
                    </div>
                    <div>
                        <p class="text-3xl font-bold">115</p>
                    </div>
                </div>
                <div class="bg-card border shadow p-4 min-h-[120px] rounded-xl flex flex-col justify-between">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold">Toplam Ödül</h3>
                        <span class="text-sm text-gray-500">(2019-2025)</span>
                    </div>
                    <div>
                        <p class="text-3xl font-bold">21</p>
                    </div>
                </div>
            </div>

            <!-- <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <div class="border rounded-lg p-4 bg-white/50 dark:bg-gray-800/50">
                    <h4 class="font-medium text-lg mb-2">Yayın Faaliyetleri</h4>
                    <ul class="space-y-1">
                        <li class="flex justify-between">
                            <span>Toplam Makale Sayısı:</span>
                            <span class="font-semibold">2,458</span>
                        </li>
                        <li class="flex justify-between">
                            <span>Q1 Dergilerde Yayınlar:</span>
                            <span class="font-semibold">842</span>
                        </li>
                        <li class="flex justify-between">
                            <span>Atıf Sayısı:</span>
                            <span class="font-semibold">18,754</span>
                        </li>
                        <li class="flex justify-between text-green-600 dark:text-green-400">
                            <span>Son 1 Yılda Artış:</span>
                            <span class="font-semibold">+12%</span>
                        </li>
                    </ul>
                </div>

                <div class="border rounded-lg p-4 bg-white/50 dark:bg-gray-800/50">
                    <h4 class="font-medium text-lg mb-2">Proje ve Patentler</h4>
                    <ul class="space-y-1">
                        <li class="flex justify-between">
                            <span>Toplam Proje Sayısı:</span>
                            <span class="font-semibold">324</span>
                        </li>
                        <li class="flex justify-between">
                            <span>TÜBİTAK Projeleri:</span>
                            <span class="font-semibold">156</span>
                        </li>
                        <li class="flex justify-between">
                            <span>Patent Sayısı:</span>
                            <span class="font-semibold">48</span>
                        </li>
                        <li class="flex justify-between">
                            <span>Ödül Sayısı:</span>
                            <span class="font-semibold">73</span>
                        </li>
                    </ul>
                </div>

                <div class="border rounded-lg p-4 bg-white/50 dark:bg-gray-800/50">
                    <h4 class="font-medium text-lg mb-2">Mezunlar ve İşbirlikleri</h4>
                    <ul class="space-y-1">
                        <li class="flex justify-between">
                            <span>Doktora Mezun Sayısı:</span>
                            <span class="font-semibold">342</span>
                        </li>
                        <li class="flex justify-between">
                            <span>Devam Eden Doktora:</span>
                            <span class="font-semibold">578</span>
                        </li>
                        <li class="flex justify-between">
                            <span>Bursiyerler:</span>
                            <span class="font-semibold">216</span>
                        </li>
                        <li class="flex justify-between">
                            <span>İşbirliği Yapılan Firma:</span>
                            <span class="font-semibold">94</span>
                        </li>
                    </ul>
                </div>
            </div> -->

            <!-- Grafikler için container - yan yana düzenleme -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 mb-6">
                <!-- Yıllara göre makale grafiği (2/3 genişliğinde) -->
                <div class="lg:col-span-2 border rounded-lg p-4 bg-white/50 dark:bg-gray-800/50 h-[300px]">
                    <v-chart :option="articleChartOption" autoresize class="w-full h-full" />
                </div>

                <!-- Fakültelere göre akademisyen dağılımı pasta grafiği (1/3 genişliğinde) -->
                <div class="border rounded-lg p-4 bg-white/50 dark:bg-gray-800/50 h-[300px]">
                    <v-chart :option="facultyChartOption" autoresize class="w-full h-full" />
                </div>
            </div>
        </div>
    </div>
</template>
