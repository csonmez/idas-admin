<script setup lang="ts">
definePageMeta({
    middleware: 'admin',
    layout: 'default'
})

const analyses = [
    {
        title: 'Fen ve Mühendislik Bilimleri',
        description: 'Birim bazlı yetkinlik analizi',
        src: '/analysis/eru_fen_muhendislik_yetkinlik_analizi.html'
    },
    {
        title: 'Sosyal ve Beşeri Bilimler',
        description: 'Birim bazlı yetkinlik analizi',
        src: '/analysis/eru_sosyal_beseri_birim_analizi.html'
    },
    {
        title: 'Sağlık Bilimleri',
        description: 'Birim bazlı yetkinlik analizi',
        src: '/analysis/eru_saglik_bilimleri_birim_analizi%20%282%29.html'
    }
]
</script>

<template>
    <main class="flex flex-1 flex-col gap-5 p-3 md:gap-6 md:p-5">
        <div class="flex flex-col gap-2 rounded-xl border bg-background px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between md:px-6">
            <div>
                <h1 class="text-3xl font-bold tracking-tight">Yetkinlik Analizleri</h1>
                <p class="text-muted-foreground">ERÜ birim bazlı yetkinlik analizleri</p>
            </div>
        </div>

        <section class="flex flex-col gap-6">
            <article v-for="analysis in analyses" :key="analysis.src" class="overflow-hidden rounded-xl border bg-background shadow-sm">
                <div class="flex flex-col gap-3 border-b px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                    <div>
                        <h2 class="text-xl font-semibold">{{ analysis.title }}</h2>
                        <p class="text-sm text-muted-foreground">{{ analysis.description }}</p>
                    </div>
                    <a :href="analysis.src" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary hover:underline"> Ayrı sekmede aç </a>
                </div>
                <iframe :src="analysis.src" :title="analysis.title" class="h-[980px] w-full border-0 bg-white md:h-[1120px]" loading="lazy" />
            </article>
        </section>
    </main>
</template>
