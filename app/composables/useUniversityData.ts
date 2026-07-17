import { ref, computed } from 'vue'

type MetricValue = number | string | null | undefined

const parseMetricValue = (value: MetricValue): number | null => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null
    }

    if (typeof value === 'string') {
        const normalizedValue = value.trim().replace(',', '.')
        if (!normalizedValue || normalizedValue === '-') return null

        const parsedValue = Number(normalizedValue)
        return Number.isFinite(parsedValue) ? parsedValue : null
    }

    return null
}

// Yerel formatNumber fonksiyonu
const formatNumber = (num: MetricValue): number => parseMetricValue(num) ?? 0

const getMetricValue = (values: Record<string, MetricValue> | undefined, year: string): number => formatNumber(values?.[year])

const getPerAcademicianValue = (uni: UniversityData, year: string): number => {
    const existingValue = parseMetricValue(uni.akademisyen_basina_yayin?.[year])
    if (existingValue !== null) return existingValue

    const publicationCount = getMetricValue(uni.yayin_sayisi, year)
    const academicianCount = getMetricValue(uni.akademisyen_sayisi, year)

    return academicianCount > 0 ? publicationCount / academicianCount : 0
}

const excludedUniversityNames = new Set(['Atatürk Üniversitesi', 'İstanbul Üniversitesi - Cerrahpaşa'])

const isExcludedUniversity = (name: string): boolean => excludedUniversityNames.has(name)

const categoriesWithout2025 = new Set([
    'ProjeSayısı',
    'ProjeFonTutarı',
    'DoktoraMezunu',
    'UlusalPatent',
    'FaydalıModel',
    'UluslararasıPatentBas',
    'UluslararasıPatentBel',
    'SanayiİsbProje',
    'SanIsbProFon',
    'UluslararasıIsbPro',
    'UluslararasıProFon',
    'Dolasım'
])

const getAvailableYears = (categoryKey: string, years: Set<string>): string[] => {
    const sortedYears = Array.from(years).sort()

    if (!categoriesWithout2025.has(categoryKey)) {
        return sortedYears
    }

    return sortedYears.filter((year) => year !== '2025')
}

// Veri tipleri
interface UniversityData {
    name: string
    yayin_sayisi: Record<string, MetricValue>
    akademisyen_sayisi: Record<string, MetricValue>
    akademisyen_basina_yayin: Record<string, MetricValue>
}

interface CategoryData {
    categoryName: string
    categoryKey: string
    universities: UniversityData[]
}

interface ChartData {
    categoryName: string
    categoryKey: string
    years: string[]
    // Her üniversite için hem ham sayı hem de akademisyen başına veri
    publicationData: {
        name: string
        data: number[]
        color: string
    }[]
    perAcademicData: {
        name: string
        data: number[]
        color: string
    }[]
}

// Üniversite renk paleti
const universityColors = {
    'Erciyes Üniversitesi': '#3b82f6',
    'Ankara Üniversitesi': '#ef4444',
    'Ege Üniversitesi': '#f59e0b',
    'Gazi Üniversitesi': '#8b5cf6',
    'Hacettepe Üniversitesi': '#ec4899',
    'İstanbul Üniversitesi': '#06b6d4'
}

// Üniversite kısa isimleri
const universityShortNames = {
    'Erciyes Üniversitesi': 'Erciyes',
    'Ankara Üniversitesi': 'Ankara',
    'Ege Üniversitesi': 'Ege',
    'Gazi Üniversitesi': 'Gazi',
    'Hacettepe Üniversitesi': 'Hacettepe',
    'İstanbul Üniversitesi': 'İstanbul'
}

export const useUniversityData = () => {
    const rawData = ref<any>(null)
    const isLoading = ref(true)
    const error = ref<string | null>(null)

    // Raw veriyi yükle
    const loadData = async () => {
        try {
            isLoading.value = true
            error.value = null

            const response = await fetch('/compare-data/universities_data.json')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            rawData.value = data
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Unknown error occurred'
            console.error('Error loading universities data:', err)
        } finally {
            isLoading.value = false
        }
    }

    // Kategorileri organize et
    const categories = computed<CategoryData[]>(() => {
        if (!rawData.value) return []

        const categoryList: CategoryData[] = []

        // Her kategori için veriyi organize et
        Object.entries(rawData.value).forEach(([categoryKey, universities]) => {
            if (Array.isArray(universities)) {
                const categoryData: CategoryData = {
                    categoryName: getCategoryDisplayName(categoryKey),
                    categoryKey,
                    universities: universities
                        .filter((uni: any) => typeof uni.name === 'string' && !isExcludedUniversity(uni.name))
                        .map((uni: any) => ({
                            name: uni.name,
                            yayin_sayisi: uni.yayin_sayisi || {},
                            akademisyen_sayisi: uni.akademisyen_sayisi || {},
                            akademisyen_basina_yayin: uni.akademisyen_basina_yayin || {}
                        }))
                }
                categoryList.push(categoryData)
            }
        })

        return categoryList
    })

    // Chart formatına çevir
    const getChartData = (categoryKey: string): ChartData | null => {
        // Özel kategori: Akademisyen Sayısı
        if (categoryKey === 'Akademisyen_Sayisi') {
            return getAcademicianCountChartData()
        }

        const category = categories.value.find((c) => c.categoryKey === categoryKey)
        if (!category) return null

        // Yılları bul (tüm üniversitelerden)
        const allYears = new Set<string>()
        category.universities.forEach((uni) => {
            Object.keys(uni.yayin_sayisi).forEach((year) => {
                allYears.add(year)
            })
        })

        const years = getAvailableYears(categoryKey, allYears)

        // Ham sayı verileri
        const publicationData = category.universities.map((uni) => ({
            name: universityShortNames[uni.name as keyof typeof universityShortNames] || uni.name,
            data: years.map((year) => getMetricValue(uni.yayin_sayisi, year)),
            color: universityColors[uni.name as keyof typeof universityColors] || '#64748b'
        }))

        // Akademisyen başına veriler
        const perAcademicData = category.universities.map((uni) => ({
            name: universityShortNames[uni.name as keyof typeof universityShortNames] || uni.name,
            data: years.map((year) => getPerAcademicianValue(uni, year)),
            color: universityColors[uni.name as keyof typeof universityColors] || '#64748b'
        }))

        return {
            categoryName: category.categoryName,
            categoryKey: category.categoryKey,
            years,
            publicationData,
            perAcademicData
        }
    }

    // Akademisyen sayısı için özel chart data fonksiyonu
    const getAcademicianCountChartData = (): ChartData | null => {
        // Herhangi bir kategoriden üniversite listesi al (akademisyen sayısı hepsinde var)
        const firstCategory = categories.value[0]
        if (!firstCategory || !firstCategory.universities || firstCategory.universities.length === 0) {
            return null
        }

        // Yılları bul
        const allYears = new Set<string>()
        firstCategory.universities.forEach((uni) => {
            if (uni.akademisyen_sayisi) {
                Object.keys(uni.akademisyen_sayisi).forEach((year) => {
                    allYears.add(year)
                })
            }
        })

        const years = Array.from(allYears).sort()

        // Boş yıllar kontrolü
        if (years.length === 0) {
            return null
        }

        // Akademisyen sayısı verileri (hem ham sayı hem de aynı veri - akademisyen sayısında per academic mantıklı değil)
        const academicianData = firstCategory.universities.map((uni) => ({
            name: universityShortNames[uni.name as keyof typeof universityShortNames] || uni.name,
            data: years.map((year) => getMetricValue(uni.akademisyen_sayisi, year)),
            color: universityColors[uni.name as keyof typeof universityColors] || '#64748b'
        }))

        return {
            categoryName: 'Akademisyen Sayısı',
            categoryKey: 'Akademisyen_Sayisi',
            years,
            publicationData: academicianData,
            perAcademicData: academicianData // Akademisyen sayısında per academic aynı veri
        }
    }

    // Kategori display name
    const getCategoryDisplayName = (categoryKey: string): string => {
        const displayNames: Record<string, string> = {
            Akademisyen_Sayisi: 'Akademisyen Sayısı',
            Makale_Sayısı: 'Makale Sayısı',
            UluslararasıIsb_Yayın: 'Uluslararası ISB Yayın',
            SanayiIsb_Yayın: 'Sanayi ISB Yayın',
            UlusalIsb_Yayın: 'Ulusal ISB Yayın',
            'Q1+Q2': 'Q1+Q2 Yayınları',
            '%50lik_Dilim': '%50lik Dilim',
            '%1lik_Dilim': '%1lik Dilim',
            '%10luk_Dilim': '%10luk Dilim',
            Atıf: 'Atıf Sayısı',
            AçıkErişim: 'Açık Erişim',
            BilimÖdülü: 'Bilim Ödülü',
            ProjeSayısı: 'Proje Sayısı',
            ProjeFonTutarı: 'Proje Fon Tutarı',
            DoktoraMezunu: 'Doktora Mezunu',
            UlusalPatent: 'Ulusal Patent',
            FaydalıModel: 'Faydalı Model',
            UluslararasıPatentBas: 'Uluslararası Patent Başvuru',
            UluslararasıPatentBel: 'Uluslararası Patent Belge',
            SanayiİsbProje: 'Sanayi İşb. Proje',
            SanIsbProFon: 'Sanayi İşb. Proje Fon',
            UluslararasıIsbPro: 'Uluslararası İşb. Proje',
            UluslararasıProFon: 'Uluslararası Proje Fon',
            Dolasım: 'Dolaşım'
        }
        return displayNames[categoryKey] || categoryKey
    }

    // Özet istatistikler
    const getStats = (categoryKey: string) => {
        const chartData = getChartData(categoryKey)
        if (!chartData) return null

        // Boş veri kontrolü
        if (!chartData.years.length || !chartData.publicationData.length) {
            return {
                latestYear: '2024',
                topPerformer: { name: 'Veri Yok', value: 0, color: '#64748b' },
                totalPublications: 0,
                universityCount: 0
            }
        }

        const latestYear = chartData.years[chartData.years.length - 1]
        const latestData = chartData.publicationData.map((uni) => ({
            name: uni.name,
            value: formatNumber(uni.data[uni.data.length - 1]),
            color: uni.color
        }))

        // Boş latestData kontrolü
        if (latestData.length === 0) {
            return {
                latestYear,
                topPerformer: { name: 'Veri Yok', value: 0, color: '#64748b' },
                totalPublications: 0,
                universityCount: 0
            }
        }

        const topPerformer = latestData.reduce((top, current) => (current.value > top.value ? current : top), latestData[0]!)

        const totalPublications = formatNumber(latestData.reduce((sum, uni) => sum + uni.value, 0))

        return {
            latestYear,
            topPerformer,
            totalPublications,
            universityCount: chartData.publicationData.length
        }
    }

    // Tüm kategorilerin temel bilgilerini al
    const getAllCategoriesInfo = computed(() => {
        return categories.value.map((category) => ({
            categoryKey: category.categoryKey,
            categoryName: category.categoryName,
            stats: getStats(category.categoryKey)
        }))
    })

    return {
        // States
        isLoading: readonly(isLoading),
        error: readonly(error),

        // Data
        categories: readonly(categories),

        // Methods
        loadData,
        getChartData,
        getStats,
        getAllCategoriesInfo,

        // Utils
        universityColors,
        universityShortNames
    }
}
