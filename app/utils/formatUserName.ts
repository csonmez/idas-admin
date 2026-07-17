import type { User } from '~/types'

const TITLE_MAP = {
    PROF: 'Prof. Dr.',
    ASSOC_PROF: 'Doç. Dr.',
    ASSIST_PROF: 'Dr. Öğr. Üyesi',
    RESEARCH_ASSIST: 'Arş. Gör.',
    LECTURER: 'Öğr. Gör.',
    DOCTOR: 'Dr.'
} as const

/**
 * Formats a user's full name with their academic title
 * @param user The user object containing title, name, and surname
 * @returns Formatted string with title and full name
 */
export default function (user: Pick<User, 'title' | 'name' | 'surname'> | null): string {
    if (!user) return ''

    const title = TITLE_MAP[user.title as keyof typeof TITLE_MAP] || ''
    return `${title} ${user.name} ${user.surname}`.trim()
}
