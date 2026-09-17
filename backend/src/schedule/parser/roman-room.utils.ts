export const ROMAN_BUILDING = 'Римская';

const ROMAN_NUMBER_BY_DECIMAL: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
};

const DECIMAL_BY_ROMAN: Record<string, number> = Object.fromEntries(
    Object.entries(ROMAN_NUMBER_BY_DECIMAL).map(([decimal, roman]) => [roman, Number(decimal)]),
);

function normalizeRomanRoomValue(value: string): string {
    return value
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[.,;]+$/g, '')
        .toUpperCase();
}

function parseRomanRoomNumber(room: string): string | null {
    const normalized = normalizeRomanRoomValue(room).replace(/^РИМСКАЯ\s+/, '');

    const match = normalized.match(/^(?:I{1,3}|IV|V|VI|VII|VIII|[1-8])(?=\s|$|[.,;]|\s*(?:АУД|АУДИТОРИЯ|КАБ|КАБИНЕТ))/u);
    if (!match) {
        return null;
    }

    const rawNumber = match[0];
    if (/^\d+$/.test(rawNumber)) {
        return ROMAN_NUMBER_BY_DECIMAL[Number(rawNumber)] ?? null;
    }

    return rawNumber;
}

export function normalizeRomanRoomKey(room: string): string | null {
    if (normalizeRomanRoomValue(room).includes('УК')) {
        return null;
    }

    const romanNumber = parseRomanRoomNumber(room);
    if (!romanNumber) {
        return null;
    }

    const normalizedRoom = normalizeRomanRoomValue(room);
    const withoutPrefix = normalizedRoom.replace(/^РИМСКАЯ\s+/, '');

    if (withoutPrefix.startsWith(romanNumber)) {
        return romanNumber;
    }

    return romanNumber;
}

export function formatRomanRoomLabel(room: string): string | null {
    const romanNumber = normalizeRomanRoomKey(room);
    return romanNumber ? `${romanNumber} римск.` : null;
}

/** Римские аудитории в УК5: I, III, IV (и 1, 3, 4). */
export function isRomanRoomUk5(room: string): boolean {
    const normalized = normalizeRomanRoomValue(room);
    const romanNumber = parseRomanRoomNumber(normalized);

    if (!romanNumber) {
        return false;
    }

    const decimal = DECIMAL_BY_ROMAN[romanNumber] ?? Number.parseInt(romanNumber, 10);
    return decimal === 1 || decimal === 3 || decimal === 4;
}

/** Римские аудитории в УК3: II, V, VI, VII, VIII (и 2, 5, 6, 7, 8). */
export function isRomanRoomUk3(room: string): boolean {
    const normalized = normalizeRomanRoomValue(room);
    const romanNumber = parseRomanRoomNumber(normalized);

    if (!romanNumber) {
        return false;
    }

    const decimal = DECIMAL_BY_ROMAN[romanNumber] ?? Number.parseInt(romanNumber, 10);
    return decimal === 2 || decimal === 5 || decimal === 6 || decimal === 7 || decimal === 8;
}

export function isRomanRoom(room: string): boolean {
    const normalized = normalizeRomanRoomValue(room);

    if (!normalized || normalized.includes('УК')) {
        return false;
    }

    return !!parseRomanRoomNumber(normalized);
}

export function getRomanBuilding(room: string): 'УК3' | 'УК5' | null {
    if (isRomanRoomUk5(room)) {
        return 'УК5';
    }

    if (isRomanRoomUk3(room)) {
        return 'УК3';
    }

    return null;
}
