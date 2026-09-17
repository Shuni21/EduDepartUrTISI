import { normalizeRomanRoomKey } from './roman-room.utils';

export function normalizeWeekStart(value: string): string {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const [year, month, day] = trimmed.slice(0, 10).split('-');
        return `${day}.${month}.${year}`;
    }

    return trimmed;
}

export function normalizeTime(value: string): string {
    return value.trim().slice(0, 5);
}

export function normalizeRoomValue(room: string | null | undefined): string | null {
    const value = room?.trim().toUpperCase();
    return value ? value : null;
}

export function normalizeRoomListKey(label: string): string {
    const normalized = label
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\.+$/g, '')
        .toUpperCase();

    return normalizeRomanRoomKey(normalized) ?? normalized;
}

export function pickPreferredRoomLabel(current: string, next: string): string {
    const trimmedCurrent = current.trim();
    const trimmedNext = next.trim();

    if (trimmedCurrent.endsWith('.') && !trimmedNext.endsWith('.')) {
        return trimmedNext;
    }

    if (!trimmedCurrent.endsWith('.') && trimmedNext.endsWith('.')) {
        return trimmedCurrent;
    }

    return trimmedCurrent.length >= trimmedNext.length
        ? trimmedCurrent
        : trimmedNext;
}
