import type { ScheduleLessonSlot } from './schedule-conflict.validator';
export interface ParseScheduleResult {
    groupName: string;
    lessons: ScheduleLessonSlot[];
    warnings: string[];
    periodStart: string | null;
    periodEnd: string | null;
}
export interface SchedulePeriod {
    start: Date;
    end: Date;
}
export declare function parseScheduleWorkbook(buffer: Buffer): ParseScheduleResult;
