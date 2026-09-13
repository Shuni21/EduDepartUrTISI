export interface ScheduleLessonSlot {
    groupName: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weekStart: string;
    subgroup: number | null;
    isDistance: boolean;
    isSameCellParallel: boolean;
    isSharedMultiHall?: boolean;
    subject: string;
    lessonType: string;
    teacherPosition: string;
    teacherName: string;
    room: string | null;
}
export interface ScheduleConflict {
    message: string;
    lessonA: ScheduleLessonSlot;
    lessonB: ScheduleLessonSlot;
}
export declare function validateScheduleConflicts(lessons: ScheduleLessonSlot[], existingLessons?: ScheduleLessonSlot[]): ScheduleConflict[];
