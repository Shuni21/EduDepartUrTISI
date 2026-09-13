export declare class CreateScheduleItemDto {
    groupName: string;
    weekStart: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subject: string;
    lessonType: string;
    teacherName?: string;
    room?: string;
    subgroup?: number;
    comment?: string;
}
export declare class UpdateScheduleItemDto {
    subject?: string;
    lessonType?: string;
    teacherName?: string;
    room?: string;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    weekStart?: string;
    subgroup?: number | null;
    comment?: string;
}
export declare class ScheduleTransferRecommendationQueryDto {
    weekStart?: string;
}
export interface ScheduleTransferRecommendationDto {
    weekStart: string;
    dayOfWeek: number;
    day: string;
    startTime: string;
    endTime: string;
    label: string;
    reasons: string[];
}
export declare class ScheduleItemPreviewDto {
    subject?: string;
    lessonType?: string;
    teacherName?: string;
    room?: string;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    weekStart?: string;
    subgroup?: number | null;
}
export interface ScheduleItemPreviewResultDto {
    conflicts: string[];
    recommendations: ScheduleTransferRecommendationDto[];
}
