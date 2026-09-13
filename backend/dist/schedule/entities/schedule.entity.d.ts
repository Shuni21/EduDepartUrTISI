import { Group } from '../../academic/entities/group.entity';
import { User } from '../../users/entities/user.entity';
import { ScheduleItem } from './schedule-item.entity';
import { ScheduleType } from './schedule-type.enum';
import { ScheduleUpload } from './schedule-upload.entity';
export { ScheduleType } from './schedule-type.enum';
export declare class Schedule {
    id: number;
    scheduleType: ScheduleType;
    groupId: number | null;
    group: Group | null;
    teacherId: number | null;
    uploadId: number | null;
    upload: ScheduleUpload | null;
    teacher: User | null;
    validFrom: string;
    validTo: string;
    isActive: boolean;
    items: ScheduleItem[];
}
