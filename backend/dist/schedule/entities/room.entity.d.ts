import { ScheduleItem } from './schedule-item.entity';
export declare class Room {
    id: number;
    building: string | null;
    number: string;
    name: string | null;
    isOnline: boolean;
    isSharedMultiHall: boolean;
    scheduleItems: ScheduleItem[];
}
