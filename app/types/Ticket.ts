import type { User } from './User'

export interface Ticket {
    id: string
    title: string
    userId: string
    system: 'INCENTIVE' | 'PERFORMANCE' | 'OTHER'
    type: 'UserArticle' | 'UserProject' | 'UserPrize' | 'UserPatent' | 'UserPostgraduate' | 'OTHER'
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
    user: Pick<User, 'id' | 'name' | 'surname' | 'email' | 'title'>
    messages: TicketMessage[]
    ticketMessages: TicketMessage[]
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
}

export interface TicketMessage {
    id: string
    ticketId: string
    ticket: Ticket
    userId: string
    user: Pick<User, 'id' | 'name' | 'surname' | 'email' | 'title'>
    message: string
    files: {
        name: string
        path: string
    }[]
    isRead: boolean
    isFromAdmin: boolean
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
}
