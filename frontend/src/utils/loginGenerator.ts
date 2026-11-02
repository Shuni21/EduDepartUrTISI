
const translitMap: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
    з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e',
    ю: 'yu', я: 'ya',
}

function transliterate(text: string): string {
    return text
        .toLowerCase()
        .split('')
        .map((char) => translitMap[char] ?? (/[a-z0-9]/.test(char) ? char : ''))
        .join('')
}

function generateBaseLogin(
    surname: string,
    name: string,
    patronymic?: string,
): string {
    const s = transliterate(surname.trim())
    const n = name.trim() ? transliterate(name.trim())[0] ?? '' : ''
    const p = patronymic?.trim()
        ? transliterate(patronymic.trim())[0] ?? ''
        : ''

    return (s + n + p).replace(/[^a-z0-9]/g, '')
}

function randomChar(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    return chars[Math.floor(Math.random() * chars.length)] ?? 'a'
}

function insertRandomChar(login: string): string {
    const pos = Math.floor(Math.random() * (login.length - 1)) + 1

    return login.slice(0, pos) + randomChar() + login.slice(pos)
}

export function generateUniqueLogin(
    surname: string,
    name: string,
    patronymic?: string,
    _existingLogins: string[] = [],
): string {
    const base = generateBaseLogin(surname, name, patronymic)

    if (!base) return ''

    let result = base

    const count = 2 + Math.floor(Math.random() * 2)

    for (let i = 0; i < count; i++) {
        result = insertRandomChar(result)
    }

    return result
}
