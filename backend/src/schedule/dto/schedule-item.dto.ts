import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class CreateScheduleItemDto {
    @IsString()
    @IsNotEmpty()
    groupName!: string;

    @IsString()
    @IsNotEmpty()
    weekStart!: string;

    @IsInt()
    @Min(1)
    @Max(7)
    dayOfWeek!: number;

    @IsString()
    @IsNotEmpty()
    startTime!: string;

    @IsString()
    @IsNotEmpty()
    endTime!: string;

    @IsString()
    @IsNotEmpty()
    subject!: string;

    @IsString()
    @IsNotEmpty()
    lessonType!: string;

    @IsOptional()
    @IsString()
    teacherName?: string;

    @IsOptional()
    @IsString()
    room?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(2)
    subgroup?: number;

    @IsOptional()
    @IsString()
    comment?: string;
}

export class UpdateScheduleItemDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    subject?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    lessonType?: string;

    @IsOptional()
    @IsString()
    teacherName?: string;

    @IsOptional()
    @IsString()
    room?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(7)
    dayOfWeek?: number;

    @IsOptional()
    @IsString()
    startTime?: string;

    @IsOptional()
    @IsString()
    endTime?: string;

    @IsOptional()
    @IsString()
    weekStart?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(2)
    subgroup?: number | null;

    @IsOptional()
    @IsString()
    comment?: string;
}

export class ScheduleTransferRecommendationQueryDto {
    @IsOptional()
    @IsString()
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

export class ScheduleItemPreviewDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    subject?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    lessonType?: string;

    @IsOptional()
    @IsString()
    teacherName?: string;

    @IsOptional()
    @IsString()
    room?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(7)
    dayOfWeek?: number;

    @IsOptional()
    @IsString()
    startTime?: string;

    @IsOptional()
    @IsString()
    endTime?: string;

    @IsOptional()
    @IsString()
    weekStart?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(2)
    subgroup?: number | null;
}

export interface ScheduleItemPreviewResultDto {
    conflicts: string[];
    recommendations: ScheduleTransferRecommendationDto[];
}

export class BulkDisableByTeacherDto {
    @IsOptional()
    @IsInt()
    teacherId?: number;

    @IsOptional()
    @IsString()
    teacherName?: string;

    @IsDateString()
    fromDate!: string;

    @IsDateString()
    toDate!: string;
}

export interface BulkDisableResultDto {
    disabledCount: number;
}
