import type { Patent } from './Patent'

export interface PatentDocument {
  id: string
  patentId: string
  patent?: Patent
  name: string
  type: 'APPLICATION' | 'CERTIFICATE' | 'DRAWING' | 'OTHER'
  fileUrl: string
  fileSize: number // bytes cinsinden
  fileType: string // MIME tipi, örneğin 'application/pdf'
  uploadedAt: Date
  updatedAt: Date
}
