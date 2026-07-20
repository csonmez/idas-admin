<script setup lang="ts">
import { Loader, ChevronsUpDownIcon, CheckIcon, SearchIcon } from 'lucide-vue-next'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import type { GenericObject, SubmissionHandler } from 'vee-validate'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

const zodSchema = z.object({
    title: z.string({ required_error: 'Lütfen makalenin başlığını yazınız.' }).trim(),
    wosId: z.string({ required_error: "Lütfen makalenin WoS Id'sini yazınız." }).trim(),
    journalId: z.string({ required_error: 'Lütfen makalenin yayınlandığı derginin ismini yazınız.' }).trim(),
    year: z.number({ required_error: 'Lütfen makalenin yayınlandığı yayın yılını seçiniz.' }),
    hasNationalCollaboration: z.boolean().optional().default(false),
    hasInternationalCollaboration: z.boolean().optional().default(false),
    hasIndustryCollaboration: z.boolean().optional().default(false)
})
const formSchema = toTypedSchema(zodSchema)

const isLoading = ref(false)
const selectedJournalId = ref('')
const selectedJournalName = ref('')
const journals = ref<{ id: string; name: string }[]>([])
const isSearching = ref(false)
const years = ref<number[]>([])
const journalPopoverOpen = ref(false)
const journalTriggerRef = ref<HTMLElement | null>(null)
const popoverWidth = ref<string | undefined>(undefined)
const journalSearchQuery = ref('')

// İlk render'da genişliği ölç
const updatePopoverWidth = () => {
    if (!journalTriggerRef.value) return false

    try {
        // Ref artık direkt bir div element'i olmalı
        const element = journalTriggerRef.value instanceof HTMLElement ? journalTriggerRef.value : null

        if (element && typeof element.getBoundingClientRect === 'function') {
            const rect = element.getBoundingClientRect()
            const width = rect.width
            if (width && width > 0) {
                popoverWidth.value = `${width}px`
                return true
            }
        }
    } catch (error) {
        console.warn('Popover genişliği ölçülemedi:', error)
    }

    return false
}

const currentYear = new Date().getFullYear()
for (let year = 2019; year <= currentYear; year++) {
    years.value.unshift(year)
}

const handleJournalSelection = (journalId: string) => {
    selectedJournalId.value = journalId === selectedJournalId.value ? '' : journalId
    const journal = journals.value.find((j) => j.id === journalId)
    if (journal) {
        selectedJournalName.value = journal.name
    }
    journalPopoverOpen.value = false
}

const selectedJournal = computed(() => {
    return journals.value.find((j) => j.id === selectedJournalId.value)
})

const searchJournals = async (query: string) => {
    if (query.length < 3) {
        journals.value = []
        return
    }

    try {
        isSearching.value = true
        // idas-api: GET /journals -> { rows, pagination }
        const response = await useRequest<{ rows: { id: string; name: string }[] }>(`/journals`, {
            query: {
                search: query,
                page: 1,
                limit: 5
            }
        })
        journals.value = response?.rows ?? []
    } catch (error) {
        journals.value = []
    } finally {
        isSearching.value = false
    }
}

const onSubmit: SubmissionHandler<GenericObject, GenericObject, unknown> = async (values, { resetForm }) => {
    try {
        isLoading.value = true

        // idas-api: POST /articles -> { article } (WoS Id, externalIds olarak gönderilir)
        const response = await useRequest<{ article: { id: string } }>('/articles', {
            method: 'POST',
            body: {
                title: values.title,
                publicationYear: values.year,
                journalId: values.journalId,
                hasNationalCollaboration: values.hasNationalCollaboration,
                hasInternationalCollaboration: values.hasInternationalCollaboration,
                hasIndustryCollaboration: values.hasIndustryCollaboration,
                externalIds: values.wosId ? [{ source: 'WOS', externalId: values.wosId }] : []
            }
        })

        isLoading.value = false

        navigateTo(`/dashboard/articles/${response.article.id}?success=created`)
        resetForm()
    } catch (error) {
        isLoading.value = false
        console.error('Makale oluşturma hatası:', error)
    }
}

watchEffect(() => {
    if (selectedJournalId.value) {
        if (!journals.value.some((j) => j.id === selectedJournalId.value)) {
            journals.value.push({
                id: selectedJournalId.value,
                name: selectedJournalName.value
            })
        }
    }
})

// Arama sorgusunu watch et ve API çağrısı yap
watch(journalSearchQuery, (newQuery) => {
    if (newQuery && newQuery.length >= 3) {
        searchJournals(newQuery)
    } else if (!newQuery || newQuery.length === 0) {
        journals.value = []
    }
})

// Popover açıldığında trigger genişliğini ölç ve PopoverContent'e uygula
watch(journalPopoverOpen, (isOpen) => {
    if (isOpen) {
        // Popover açıldıktan sonra ölç (nextTick ile DOM render'ını bekle)
        nextTick(() => {
            updatePopoverWidth()
            // Bir kez daha requestAnimationFrame ile kontrol et
            requestAnimationFrame(() => {
                updatePopoverWidth()
            })
        })
    } else {
        popoverWidth.value = undefined
    }
})
</script>

<template>
    <div class="relative w-full gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Makale Ekle</CardTitle>
            </CardHeader>
            <CardContent class="p-5">
                <Form class="grid gap-4" :validation-schema="formSchema" @submit="onSubmit">
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="title">
                        <FormItem>
                            <FormLabel for="title">Makalenin Başlığı</FormLabel>
                            <FormControl>
                                <Input id="title" type="text" placeholder="Makalenin başlığını yazınız" v-bind="componentField" required />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="wosId">
                        <FormItem>
                            <FormLabel for="wosId">Makalenin WoS Id'si</FormLabel>
                            <FormControl>
                                <Input id="wosId" type="text" placeholder="Makalenin WoS Id'sini yazınız" v-bind="componentField" required />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="year">
                        <FormItem>
                            <FormLabel for="year">Yayın Yılı</FormLabel>
                            <Select v-bind="componentField" class="w-full">
                                <FormControl>
                                    <SelectTrigger class="w-full">
                                        <SelectValue placeholder="Yayın yılını seçiniz" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem v-for="year in years" :key="year" :value="year">
                                            {{ year }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" class="grid gap-2" name="journalId">
                        <FormItem>
                            <FormLabel for="journalId">Dergi</FormLabel>
                            <FormControl>
                                <Popover v-model:open="journalPopoverOpen">
                                    <div ref="journalTriggerRef" class="w-full">
                                        <PopoverTrigger as-child>
                                            <Button variant="outline" role="combobox" :aria-expanded="journalPopoverOpen" class="w-full justify-between" v-bind="componentField">
                                                {{ selectedJournal?.name || 'Dergi seçiniz...' }}
                                                <ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                    </div>
                                    <PopoverContent
                                        class="p-0 journal-popover-content"
                                        :style="
                                            popoverWidth
                                                ? {
                                                      '--popover-width': popoverWidth,
                                                      width: popoverWidth,
                                                      minWidth: popoverWidth,
                                                      maxWidth: popoverWidth
                                                  }
                                                : {}
                                        "
                                    >
                                        <Command>
                                            <div class="flex h-9 items-center gap-2 border-b px-3">
                                                <SearchIcon class="size-4 shrink-0 opacity-50" />
                                                <Input
                                                    v-model="journalSearchQuery"
                                                    placeholder="Dergi ara..."
                                                    class="h-10 border-0 bg-transparent py-3 text-sm outline-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
                                                />
                                            </div>
                                            <CommandList>
                                                <CommandEmpty v-if="!isSearching && journals.length === 0"> Dergi bulunamadı. </CommandEmpty>
                                                <CommandGroup v-if="journals.length > 0">
                                                    <CommandItem
                                                        v-for="journal in journals"
                                                        :key="journal.id"
                                                        :value="journal.name"
                                                        @select="
                                                            (ev: any) => {
                                                                const journalId = journal.id
                                                                handleJournalSelection(journalId)
                                                                componentField.onChange(journalId)
                                                            }
                                                        "
                                                    >
                                                        <CheckIcon :class="cn('mr-2 h-4 w-4', selectedJournalId === journal.id ? 'opacity-100' : 'opacity-0')" />
                                                        {{ journal.name }}
                                                    </CommandItem>
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ value, handleChange }" type="checkbox" :value="true" :unchecked-value="false" name="hasNationalCollaboration">
                        <FormItem class="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox :model-value="value" @update:model-value="handleChange" />
                            </FormControl>
                            <FormLabel class="font-normal"> Ulusal iş birliği ile yayınlanmış makale </FormLabel>
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ value, handleChange }" type="checkbox" :value="true" :unchecked-value="false" name="hasInternationalCollaboration">
                        <FormItem class="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox :model-value="value" @update:model-value="handleChange" />
                            </FormControl>
                            <FormLabel class="font-normal"> Uluslararası iş birliği ile yayınlanmış makale </FormLabel>
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ value, handleChange }" type="checkbox" :value="true" :unchecked-value="false" name="hasIndustryCollaboration">
                        <FormItem class="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox :model-value="value" @update:model-value="handleChange" />
                            </FormControl>
                            <FormLabel class="font-normal"> Sanayi iş birliği ile yayınlanmış makale </FormLabel>
                        </FormItem>
                    </FormField>
                    <Button type="submit" class="w-full" :disabled="isLoading">
                        <Loader v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                        Makaleyi Ekle
                    </Button>
                </Form>
            </CardContent>
        </Card>
    </div>
</template>
