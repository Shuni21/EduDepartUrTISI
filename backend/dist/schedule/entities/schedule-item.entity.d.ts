import { Schedule } from './schedule.entity';
import { Subject } from '../../academic/entities/subject.entity';
import { Subgroup } from '../../academic/entities/subgroup.entity';
import { LessonType } from './lesson-type.entity';
import { User } from '../../users/entities/user.entity';
import { Room } from './room.entity';
export declare enum WeekType {
    EVEN = "even",
    ODD = "odd"
}
export declare class ScheduleItem {
    id: number;
    scheduleId: number;
    schedule: Schedule;
    subjectId: number;
    subject: Subject;
    subgroupId: number | null;
    subgroup: Subgroup | null;
    lessonTypeId: number;
    lessonType: LessonType;
    teacherId: number | null;
    teacher: User | null;
    roomId: number | null;
    room: Room | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weekType: WeekType | null;
    comment: string | null;
    weekStart: string;
    isDisabled: boolean;
    isSameCellParallel: boolean;
    teacherPosition: string | null;
    legacyTeacherName: string | null;
}
