import type { User } from '~/types/User'

export interface Postgraduate {
    id: string
    title: string
    type: string // 'YUKSEK_LISANS' | 'DOKTORA' | 'BUTUNLESIK_DOKTORA'
    subject: string
    studentName: string
    studentSurname: string
    studentEmail?: string
    startDate: Date
    endDate?: Date
    status: string // 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'TERK'
    userId: string
    user: User // Danışman
    createdAt: Date
    updatedAt: Date
}

export interface UserPostgraduate {
    id: string
    postgraduateId: string
    postgraduate: Postgraduate
    userId: string
    user: User
    role: 'DANISMAN' | 'ES_DANISMAN' | 'IKINCI_DANISMAN'
    createdAt: Date
    updatedAt: Date
}
