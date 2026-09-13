export declare class CreateConsultationDto {
    departmentId: number;
    subject: string;
    teacherName: string;
    consultationType: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weekStart: string;
    room?: string;
    comment?: string;
}
export declare class UpdateConsultationDto {
    subject?: string;
    teacherName?: string;
    consultationType?: string;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    weekStart?: string;
    room?: string;
    comment?: string;
}
