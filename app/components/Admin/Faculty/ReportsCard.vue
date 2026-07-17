<script setup lang="ts">
import { FileText, Download, ExternalLink } from 'lucide-vue-next'

// PDF.js kütüphanesini global olarak tanımla
declare global {
    interface Window {
        pdfjsLib: any
    }
}

interface Props {
    facultyId: string
    facultyName: string
}

const props = defineProps<Props>()

// Türkçe karakterleri slug'a çevirme fonksiyonu
const createSlug = (text: string): string => {
    const turkishMap: Record<string, string> = {
        ç: 'c',
        ğ: 'g',
        ı: 'i',
        ö: 'o',
        ş: 's',
        ü: 'u',
        Ç: 'c',
        Ğ: 'g',
        I: 'i',
        İ: 'i',
        Ö: 'o',
        Ş: 's',
        Ü: 'u'
    }

    return text
        .replace(/[çğıöşüÇĞIİÖŞÜ]/g, (char) => turkishMap[char] || char)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .trim()
}

// Yıl listesi
const years = [2025, 2024, 2023, 2022, 2021]

// Fakülte slug'ını oluştur
const facultySlug = computed(() => createSlug(props.facultyName))

// PDF URL'lerini oluşturma
const getPdfUrl = (year: number) => {
    return `/FacultyReports/${year}/${facultySlug.value}-${year}.pdf`
}

// PDF dosyasının varlığını kontrol etme
const checkPdfExists = async (url: string): Promise<boolean> => {
    try {
        const response = await fetch(url, { method: 'HEAD' })
        return response.ok
    } catch {
        return false
    }
}

// Her yıl için PDF varlığını kontrol et ve thumbnail oluştur
const pdfExists = ref<Record<number, boolean>>({})
const pdfThumbnails = ref<Record<number, string>>({})
const isLoadingThumbnails = ref<Record<number, boolean>>({})
const isVisible = ref<Record<number, boolean>>({})

// PDF.js yüklenmiş mi kontrolü
const pdfJsLoaded = ref(false)

// PDF.js'i CDN'den yükle
const loadPdfJs = async () => {
    if (window.pdfjsLib || pdfJsLoaded.value) return

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        pdfJsLoaded.value = true
    }
    document.head.appendChild(script)

    return new Promise((resolve) => {
        script.onload = resolve
    })
}

// PDF'in ilk sayfasını thumbnail olarak render et
const generateThumbnail = async (pdfUrl: string): Promise<string | null> => {
    try {
        if (!window.pdfjsLib) return null

        const pdf = await window.pdfjsLib.getDocument(pdfUrl).promise
        const page = await pdf.getPage(1)

        const scale = 0.5 // Küçük thumbnail için
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise

        return canvas.toDataURL('image/jpeg', 0.8)
    } catch (error) {
        console.error('PDF thumbnail error:', error)
        return null
    }
}

// Intersection Observer için ref'ler
const cardRefs = ref<Record<number, HTMLElement>>({})

// Debounce için pending years
const pendingYears = ref<Set<number>>(new Set())
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let intersectionObserver: IntersectionObserver | null = null

// Debounced batch loading
const debouncedBatchLoad = () => {
    if (debounceTimer) {
        clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
        const yearsToLoad = Array.from(pendingYears.value)
        if (yearsToLoad.length > 0) {
            batchLoadPdfData(yearsToLoad)
            pendingYears.value.clear()
        }
    }, 150) // 150ms debounce
}

// Batch PDF kontrolü - sadece görünen kartlar için
const batchLoadPdfData = async (yearsToLoad: number[]) => {
    // Zaten yüklenen, yükleniyor olan veya hatalı olanları filtrele
    const filteredYears = yearsToLoad.filter((year) => {
        // Zaten var olan veya yükleniyor olanları atla
        if (pdfExists.value[year] !== undefined || isLoadingThumbnails.value[year]) {
            return false
        }
        return true
    })

    if (filteredYears.length === 0) return

    // Tüm yıllar için loading state'i başlat
    filteredYears.forEach((year) => {
        isLoadingThumbnails.value[year] = true
    })

    try {
        // PDF.js'i önceden yükle
        if (!pdfJsLoaded.value) {
            await loadPdfJs()
        }

        // Paralel PDF varlık kontrolü
        const existsPromises = filteredYears.map(async (year) => {
            const url = getPdfUrl(year)
            const exists = await checkPdfExists(url)
            return { year, exists }
        })

        const existsResults = await Promise.all(existsPromises)

        // Sonuçları işle
        for (const { year, exists } of existsResults) {
            pdfExists.value[year] = exists
        }

        // Var olan PDF'ler için paralel thumbnail oluşturma
        const thumbnailPromises = existsResults
            .filter(({ exists }) => exists)
            .map(async ({ year }) => {
                const url = getPdfUrl(year)
                const thumbnail = await generateThumbnail(url)
                return { year, thumbnail }
            })

        const thumbnailResults = await Promise.all(thumbnailPromises)

        // Thumbnail sonuçlarını işle
        for (const { year, thumbnail } of thumbnailResults) {
            if (thumbnail) {
                pdfThumbnails.value[year] = thumbnail
            }
            isLoadingThumbnails.value[year] = false
        }

        // Thumbnail oluşturulamayan veya PDF olmayan yıllar için loading'i bitir
        filteredYears.forEach((year) => {
            if (!thumbnailResults.find((result) => result.year === year)) {
                isLoadingThumbnails.value[year] = false
            }
        })
    } catch (error) {
        console.error('Batch PDF loading error:', error)
        // Hata durumunda loading state'lerini temizle
        filteredYears.forEach((year) => {
            isLoadingThumbnails.value[year] = false
        })
    }
}

// Intersection Observer setup
const setupIntersectionObserver = () => {
    const observer = new IntersectionObserver(
        (entries) => {
            let hasNewEntries = false

            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const year = parseInt(entry.target.getAttribute('data-year') || '0')
                    if (year && !isVisible.value[year]) {
                        isVisible.value[year] = true
                        pendingYears.value.add(year)
                        hasNewEntries = true
                        observer.unobserve(entry.target)
                    }
                }
            })

            // Yeni entry varsa debounced loading'i tetikle
            if (hasNewEntries) {
                debouncedBatchLoad()
            }
        },
        {
            rootMargin: '100px', // 100px önceden yüklemeye başla
            threshold: 0.1
        }
    )

    // Her kart için observer'ı başlat
    years.forEach((year) => {
        const element = cardRefs.value[year]
        if (element) {
            observer.observe(element)
        }
    })

    return observer
}

// Cleanup fonksiyonu
const cleanup = () => {
    // Debounce timer'ını temizle
    if (debounceTimer) {
        clearTimeout(debounceTimer)
        debounceTimer = null
    }

    // Intersection Observer'ı disconnect et
    if (intersectionObserver) {
        intersectionObserver.disconnect()
        intersectionObserver = null
    }

    // Pending years'ı temizle
    pendingYears.value.clear()
}

onMounted(() => {
    // Intersection Observer'ı başlat
    nextTick(() => {
        intersectionObserver = setupIntersectionObserver()
    })
})

onBeforeUnmount(() => {
    cleanup()
})

// PDF'i yeni sekmede aç
const openPdf = (year: number) => {
    const url = getPdfUrl(year)
    window.open(url, '_blank')
}

// PDF'i indir
const downloadPdf = (year: number) => {
    const url = getPdfUrl(year)
    const link = document.createElement('a')
    link.href = url
    link.download = `${facultySlug.value}-${year}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
</script>

<template>
    <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="pt-6 px-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Fakülte Raporları</h2>
        </div>

            <!-- Horizontal Scroll Layout for PDF Cards -->
            <div class="flex gap-6 overflow-x-auto pb-6 px-6">
                <div v-for="year in years" :key="year" :ref="(el) => (cardRefs[year] = el as HTMLElement)" :data-year="year" class="group cursor-pointer flex-shrink-0 w-56" @click="pdfExists[year] && openPdf(year)">
                    <!-- PDF Card -->
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200">
                        <!-- PDF Preview Area -->
                        <div class="aspect-[3/4] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 relative flex items-center justify-center overflow-hidden">
                            <!-- PDF var ise -->
                            <template v-if="pdfExists[year]">
                                <!-- PDF Thumbnail varsa -->
                                <template v-if="pdfThumbnails[year]">
                                    <img :src="pdfThumbnails[year]" :alt="`${year} Raporu Önizleme`" class="w-full h-full object-cover" />

                                    <!-- Hover Overlay -->
                                    <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                </template>

                                <!-- Thumbnail yüklenirken -->
                                <template v-else-if="isLoadingThumbnails[year]">
                                    <div class="text-center">
                                        <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <div class="text-blue-700 dark:text-blue-300 text-sm">Önizleme hazırlanıyor...</div>
                                    </div>
                                </template>

                                <!-- Thumbnail oluşturulamadıysa fallback -->
                                <template v-else>
                                    <div class="text-center">
                                        <FileText class="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                                        <div class="text-blue-700 dark:text-blue-300 text-sm font-medium">PDF Raporu</div>
                                    </div>

                                    <!-- Hover Overlay -->
                                    <div class="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                </template>
                            </template>

                            <!-- Henüz yüklenmedi veya PDF yok -->
                            <template v-else-if="!isVisible[year]">
                                <div class="text-center">
                                    <FileText class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                    <div class="text-gray-400 dark:text-gray-500 text-sm">Yükleniyor...</div>
                                </div>
                            </template>

                            <!-- Yüklendikten sonra PDF yok ise -->
                            <template v-else-if="isVisible[year] && !isLoadingThumbnails[year] && !pdfExists[year]">
                                <div class="text-center">
                                    <FileText class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                    <div class="text-gray-400 dark:text-gray-500 text-sm">Hazırlanıyor...</div>
                                </div>

                                <!-- Status Badge -->
                                <div class="absolute top-3 right-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">Beklemede</div>
                            </template>

                            <!-- Yükleniyor durumu -->
                            <template v-else-if="isLoadingThumbnails[year]">
                                <div class="text-center">
                                    <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <div class="text-blue-700 dark:text-blue-300 text-sm">Kontrol ediliyor...</div>
                                </div>
                            </template>
                        </div>

                        <!-- Card Footer -->
                        <div class="p-4 bg-white dark:bg-gray-900">
                            <div class="text-center">
                                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">{{ year }} Raporu</h3>

                                <!-- Action Buttons -->
                                <template v-if="pdfExists[year]">
                                    <div class="flex gap-2">
                                        <Button variant="outline" size="sm" class="flex-1 flex items-center justify-center gap-1" @click.stop="openPdf(year)">
                                            <ExternalLink class="w-3 h-3" />
                                            Aç
                                        </Button>
                                        <Button variant="outline" size="sm" class="flex-1 flex items-center justify-center gap-1" @click.stop="downloadPdf(year)">
                                            <Download class="w-3 h-3" />
                                            İndir
                                        </Button>
                                    </div>
                                </template>

                                <template v-else-if="isVisible[year] && !isLoadingThumbnails[year]">
                                    <Button variant="outline" size="sm" disabled class="w-full"> Henüz Hazır Değil </Button>
                                </template>

                                <template v-else>
                                    <Button variant="outline" size="sm" disabled class="w-full"> Yükleniyor... </Button>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    </div>
</template>
