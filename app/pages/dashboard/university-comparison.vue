<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'

// Sayfa meta bilgileri
definePageMeta({
    middleware: 'admin',
    layout: 'default'
})

// Composable'ı kullan
const { isLoading, error, categories, loadData, getChartData, getStats } = useUniversityData()

// Kategori iconları
const categoryIcons: Record<string, string> = {
    Akademisyen_Sayisi: '👨‍🏫',
    Makale_Sayısı: '📄',
    UluslararasıIsb_Yayın: '🌍',
    SanayiIsb_Yayın: '🏭',
    UlusalIsb_Yayın: '🏛️',
    'Q1+Q2': '🏆',
    '%10luk_Dilim': '📈',
    Atıf: '🔗',
    AçıkErişim: '🔓',
    BilimÖdülü: '🏅',
    ProjeSayısı: '🔬',
    ProjeFonTutarı: '💰',
    DoktoraMezunu: '🎓',
    UlusalPatent: '📋',
    FaydalıModel: '⚙️',
    UluslararasıPatentBas: '📝',
    UluslararasıPatentBel: '📜',
    SanayiİsbProje: '🏗️',
    SanIsbProFon: '💼',
    UluslararasıIsbPro: '🌐',
    UluslararasıProFon: '🌟',
    Dolasım: '🔄'
}

// YÖK görselleştirme sekmeleri
const activeComparisonTab = ref('performans-analizi')

const comparisonTabs = [
    {
        value: 'performans-analizi',
        label: 'Performans Analizi',
        src: '/university-compare/yok_birlesik_degerlendirme.html',
        title: 'YÖK Araştırma Üniversiteleri — Performans Analizi 2020–2024'
    },
    {
        value: 'performans-haritasi',
        label: 'Performans Haritası',
        src: '/university-compare/yok_arastirma_universiteleri_bubblechart.html',
        title: 'YÖK Araştırma Üniversiteleri Performans Haritası 2020–2024'
    },
    {
        value: 'isi-haritasi',
        label: 'Isı Haritası',
        src: '/university-compare/yok_heatmap.html',
        title: 'YÖK Araştırma Üniversiteleri — Performans Isı Haritası 2020–2024'
    },
    {
        value: 'dergi-ceyreklikleri',
        label: 'Dergi Çeyreklikleri',
        src: '/university-compare/dergi_ceyreklik_dilimleri.html',
        title: 'Dergi Çeyreklik Dilimlerine Göre Araştırma Üniversitelerinin Dağılımı'
    }
]

// Sayfa yüklendiğinde veriyi çek
onMounted(async () => {
    await loadData()
})

// Kategori bilgilerini hazırla (bazı kategoriler filtrelendi)
const categoriesWithData = computed(() => {
    // Çıkartılacak kategoriler
    const excludedCategories = ['%50lik_Dilim', '%1lik_Dilim']

    // Mevcut kategorileri filtrele
    const filteredCategories = categories.value
        .filter((category) => !excludedCategories.includes(category.categoryKey))
        .map((category) => ({
            ...category,
            icon: categoryIcons[category.categoryKey] || '📊',
            chartData: getChartData(category.categoryKey),
            stats: getStats(category.categoryKey)
        }))

    // Akademisyen sayısı kategorisini manuel olarak ekle (ilk sıraya)
    const academicianCategory = {
        categoryName: 'Akademisyen Sayısı',
        categoryKey: 'Akademisyen_Sayisi',
        icon: categoryIcons['Akademisyen_Sayisi'] || '👨‍🏫',
        chartData: getChartData('Akademisyen_Sayisi'),
        stats: getStats('Akademisyen_Sayisi')
    }

    // Akademisyen sayısını ilk sıraya koy, diğerlerini arkasına ekle
    return [academicianCategory, ...filteredCategories]
})
</script>

<template>
    <main class="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
        <!-- Sayfa başlığı -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold tracking-tight">Üniversite Karşılaştırma</h1>
            </div>
        </div>

        <!-- YÖK Görselleştirme Sekmeleri -->
        <Tabs v-model="activeComparisonTab" class="w-full">
            <TabsList class="mb-2 flex h-auto w-full flex-wrap gap-1.5 bg-transparent p-0">
                <TabsTrigger
                    v-for="tab in comparisonTabs"
                    :key="tab.value"
                    :value="tab.value"
                    class="h-10 rounded-md border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                    {{ tab.label }}
                </TabsTrigger>
            </TabsList>
            <TabsContent
                v-for="tab in comparisonTabs"
                :key="tab.value"
                :value="tab.value"
                class="mt-0"
            >
                <iframe
                    :src="tab.src"
                    :title="tab.title"
                    class="w-full rounded-lg border border-gray-200 shadow-sm"
                    style="height: 600px;"
                    loading="lazy"
                    frameborder="0"
                    scrolling="no"
                    @load="(e) => {
                        const iframe = e.target as HTMLIFrameElement
                        try {
                            const h = iframe.contentDocument?.documentElement?.scrollHeight
                            if (h && h > 0) iframe.style.height = h + 'px'
                        } catch {}
                    }"
                />
            </TabsContent>
        </Tabs>

        <!-- Loading state -->
        <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span class="text-muted-foreground">Veriler yükleniyor...</span>
            </div>
        </div>

        <!-- Error state -->
        <div v-if="error" class="flex items-center justify-center min-h-[400px]">
            <div class="text-center">
                <div class="text-4xl mb-4">⚠️</div>
                <h3 class="text-lg font-semibold mb-2">Veri Yükleme Hatası</h3>
                <p class="text-muted-foreground mb-4">{{ error }}</p>
                <Button variant="outline" @click="loadData"> Tekrar Dene </Button>
            </div>
        </div>

        <!-- Kategoriler Grid -->
        <div v-else class="grid gap-8 grid-cols-1 md:grid-cols-2">
            <ChartsLazyChart
                v-for="category in categoriesWithData"
                :key="category.categoryKey"
                :category-key="category.categoryKey"
                :category-name="category.categoryName"
                :category-icon="category.icon"
                :chart-data="category.chartData"
                :stats="category.stats"
            />
        </div>
    </main>
</template>
