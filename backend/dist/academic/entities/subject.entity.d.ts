import { ScheduleItem } from '../../schedule/entities/schedule-item.entity';
export declare class Subject {
    id: number;
    name: string;
    description: string | null;
    scheduleItems: ScheduleItem[];
}
