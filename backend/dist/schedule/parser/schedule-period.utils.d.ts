import { ScheduleItem } from '../entities/schedule-item.entity';
export interface SchedulePeriodMeta {
    academicYearLabel: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    periodLabel: string | null;
}
export declare function parseScheduleDate(value: string): Date;
export declare function getAcademicYearStartFromDate(referenceDate: Date): number;
export declare function formatAcademicYearLabel(validFrom: string): string;
export declare function formatPeriodLabel(validFrom: string, validTo: string): string;
export declare function resolveSchedulePeriodMeta(items: ScheduleItem[]): SchedulePeriodMeta;
