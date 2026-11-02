import { join } from 'node:path';

export function getSchedulesDir(): string {
    return join(__dirname, '..', '..', 'storage', 'schedules');
}
