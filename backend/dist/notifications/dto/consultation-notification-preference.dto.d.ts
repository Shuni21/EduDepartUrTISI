export declare class UpdateConsultationNotificationPreferenceDto {
    enabled: boolean;
    allTeachers: boolean;
    teacherIds?: number[];
}
export type ConsultationNotificationPreferenceResponse = {
    enabled: boolean;
    allTeachers: boolean;
    teacherIds: number[];
};
export type ConsultationTeacherOption = {
    id: number;
    name: string;
    departmentId: number;
    departmentLabel: string;
};
