<!-- eslint-disable vue/no-unused-vars -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Trash2, Copy, ExternalLink } from 'lucide-vue-next'

export interface ActionDropdownItem {
  id: string
  label: string
  icon?: any
  action?: () => void
  href?: string
  variant?: 'default' | 'destructive'
  separator?: boolean
}

interface Props {
  entity: Record<string, any>
  entityType: string
  items?: ActionDropdownItem[]
  showDefaultActions?: boolean
  detailUrlPattern?: string
  editUrlPattern?: string
  enableQuickView?: boolean
  enableCopyId?: boolean
  enableEdit?: boolean
  enableDelete?: boolean
  enableView?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDefaultActions: true,
  enableQuickView: true,
  enableCopyId: true,
  enableEdit: true,
  enableDelete: true,
  enableView: true,
  items: () => [],
  detailUrlPattern: '',
  editUrlPattern: ''
})

const emit = defineEmits<{
  expand: []
  edit: [entity: any]
  delete: [entity: any]
  view: [entity: any]
  action: [actionId: string, entity: any]
}>()

// Default actions
const copyId = async () => {
  await navigator.clipboard.writeText(props.entity.id)
  // TODO: Toast notification
}

const viewEntity = () => {
  if (props.detailUrlPattern) {
    const url = props.detailUrlPattern.replace(':id', props.entity.id)
    navigateTo(url)
  } else {
    emit('view', props.entity)
  }
}

const editEntity = () => {
  if (props.editUrlPattern) {
    const url = props.editUrlPattern.replace(':id', props.entity.id)
    navigateTo(url)
  } else {
    emit('edit', props.entity)
  }
}

const deleteEntity = () => {
  emit('delete', props.entity)
}

const quickView = () => {
  emit('expand')
}

const handleCustomAction = (item: ActionDropdownItem) => {
  if (item.action) {
    item.action()
  } else if (item.href) {
    navigateTo(item.href)
  } else {
    emit('action', item.id, props.entity)
  }
}

// Compute default actions based on props
const defaultActions = computed(() => {
  const actions: ActionDropdownItem[] = []
  
  if (props.enableCopyId) {
    actions.push({
      id: 'copy-id',
      label: 'ID Kopyala',
      icon: Copy,
      action: copyId
    })
  }
  
  if (actions.length > 0 && (props.enableView || props.enableEdit || props.enableQuickView)) {
    actions.push({ id: 'separator-1', label: '', separator: true })
  }
  
  if (props.enableView) {
    actions.push({
      id: 'view',
      label: 'Görüntüle',
      icon: Eye,
      action: viewEntity
    })
  }
  
  if (props.enableEdit) {
    actions.push({
      id: 'edit',
      label: 'Düzenle',
      icon: Edit,
      action: editEntity
    })
  }
  
  if (props.enableQuickView) {
    actions.push({
      id: 'quick-view',
      label: 'Hızlı Görünüm',
      icon: Eye,
      action: quickView
    })
  }
  
  if (props.enableDelete) {
    if (actions.length > 0) {
      actions.push({ id: 'separator-2', label: '', separator: true })
    }
    actions.push({
      id: 'delete',
      label: 'Sil',
      icon: Trash2,
      action: deleteEntity,
      variant: 'destructive'
    })
  }
  
  return actions
})

// Combine default and custom actions
const allActions = computed(() => {
  if (!props.showDefaultActions) {
    return props.items || []
  }
  
  const actions = [...defaultActions.value]
  
  if (props.items && props.items.length > 0) {
    if (actions.length > 0) {
      actions.push({ id: 'separator-custom', label: '', separator: true })
    }
    actions.push(...props.items)
  }
  
  return actions
})
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">Menüyü aç</span>
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
        <template v-for="item in allActions" :key="item.id">
        <DropdownMenuSeparator v-if="item.separator" />
        <DropdownMenuItem 
          v-else
          class="cursor-pointer"
          :class="{ 'text-red-600': item.variant === 'destructive' }"
          @click="handleCustomAction(item)"
        >
          <component 
            :is="item.icon"
            v-if="item.icon" 
            class="mr-2 h-4 w-4" 
          />
          {{ item.label }}
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
