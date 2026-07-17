export const useAcademicianPerformance = (academicianId: string) => {
    // Tüm verileri paralel olarak çek
    const {
        data: articles,
        pending: articlesPending,
        error: articlesError,
        refresh: refreshArticles
    } = useAsyncData(
        `academician-articles-${academicianId}`,
        () =>
            useRequest(`/manager/user-articles`, {
                method: 'GET',
                query: {
                    userId: academicianId,
                    limit: 100 // Daha makul limit
                }
            }),
        { lazy: true }
    )

    const {
        data: projects,
        pending: projectsPending,
        error: projectsError,
        refresh: refreshProjects
    } = useAsyncData(
        `academician-projects-${academicianId}`,
        () =>
            useRequest(`/manager/user-projects`, {
                method: 'GET',
                query: {
                    userId: academicianId,
                    limit: 100 // Daha makul limit
                }
            }),
        { lazy: true }
    )

    const {
        data: prizes,
        pending: prizesPending,
        error: prizesError,
        refresh: refreshPrizes
    } = useAsyncData(
        `academician-prizes-${academicianId}`,
        () =>
            useRequest(`/manager/user-prizes`, {
                method: 'GET',
                query: {
                    userId: academicianId,
                    limit: 100 // Daha makul limit
                }
            }),
        { lazy: true }
    )

    const {
        data: patents,
        pending: patentsPending,
        error: patentsError,
        refresh: refreshPatents
    } = useAsyncData(
        `academician-patents-${academicianId}`,
        () =>
            useRequest(`/manager/user-patents`, {
                method: 'GET',
                query: {
                    userId: academicianId,
                    limit: 100 // Daha makul limit
                }
            }),
        { lazy: true }
    )

    // Yıllık dağılım hesapla
    const yearlyDistribution = computed(() => {
        const currentYear = new Date().getFullYear()
        const years = Array.from({ length: 6 }, (_, i) => currentYear - i).reverse()

        return {
            years: years.map((year) => year.toString()),
            articles: years.map((year) => {
                const yearStr = year.toString()
                return (
                    articles.value?.rows?.filter((article: any) => {
                        // article.createdAt kullanarak yılı çıkar
                        const articleYear = new Date(article.createdAt).getFullYear()
                        return articleYear.toString() === yearStr
                    }).length || 0
                )
            }),
            projects: years.map((year) => {
                const yearStr = year.toString()
                return (
                    projects.value?.rows?.filter((project: any) => {
                        // project.createdAt kullanarak yılı çıkar
                        const projectYear = new Date(project.createdAt).getFullYear()
                        return projectYear.toString() === yearStr
                    }).length || 0
                )
            }),
            prizes: years.map((year) => {
                const yearStr = year.toString()
                return (
                    prizes.value?.rows?.filter((prize: any) => {
                        // prize.createdAt kullanarak yılı çıkar
                        const prizeYear = new Date(prize.createdAt).getFullYear()
                        return prizeYear.toString() === yearStr
                    }).length || 0
                )
            }),
            patents: years.map((year) => {
                const yearStr = year.toString()
                return (
                    patents.value?.rows?.filter((patent: any) => {
                        // patent.createdAt kullanarak yılı çıkar
                        const patentYear = new Date(patent.createdAt).getFullYear()
                        return patentYear.toString() === yearStr
                    }).length || 0
                )
            })
        }
    })

    // Toplam sayılar
    const totals = computed(() => ({
        articles: articles.value?.rows?.length || 0,
        projects: projects.value?.rows?.length || 0,
        prizes: prizes.value?.rows?.length || 0,
        patents: patents.value?.rows?.length || 0
    }))

    // Loading state
    const isLoading = computed(() => articlesPending.value || projectsPending.value || prizesPending.value || patentsPending.value)

    // Error state
    const hasError = computed(() => articlesError.value || projectsError.value || prizesError.value || patentsError.value)

    // Refresh all data
    const refreshAll = () => {
        refreshArticles()
        refreshProjects()
        refreshPrizes()
        refreshPatents()
    }

    return {
        // Data
        articles,
        projects,
        prizes,
        patents,

        // Computed
        yearlyDistribution,
        totals,
        isLoading,
        hasError,

        // Loading states
        articlesPending,
        projectsPending,
        prizesPending,
        patentsPending,

        // Error states
        articlesError,
        projectsError,
        prizesError,
        patentsError,

        // Actions
        refreshArticles,
        refreshProjects,
        refreshPrizes,
        refreshPatents,
        refreshAll
    }
}
